// 책갈피 — 앱 골격: 화면 전환, 상단·하단 막대, 타이머 막대, 오프라인 설치
import { $, esc, icon, fmtClock, debounce, toast } from './util.js';
import { db, bus, requestPersist } from './db.js';
import { getTimer } from './store.js';
import { stopTimerFlow } from './views/common.js';
import { applyTheme } from './views/settings.js';
import { isNative } from './native.js';

const ROUTES = [
  [/^#?\/?$/, 'library'],
  [/^#\/library$/, 'library'],
  [/^#\/book\/([^/?]+)$/, 'book', ['id']],
  [/^#\/quotes$/, 'quotes'],
  [/^#\/search$/, 'search'],
  [/^#\/stats$/, 'stats'],
  [/^#\/settings$/, 'settings'],
];
const TABS = [
  ['library', '#/library', 'book', '서재'],
  ['quotes', '#/quotes', 'quote', '문장'],
  ['search', '#/search', 'search', '검색'],
  ['stats', '#/stats', 'chart', '통계'],
  ['settings', '#/settings', 'gear', '설정'],
];
const loaders = {
  library: () => import('./views/library.js'),
  book: () => import('./views/book.js'),
  quotes: () => import('./views/quotes.js'),
  search: () => import('./views/search.js'),
  stats: () => import('./views/stats.js'),
  settings: () => import('./views/settings.js'),
};

const view = $('#view');
const topbar = $('#topbar');
let current = null;
let renderSeq = 0;

function parseHash() {
  const h = location.hash || '#/library';
  const [path, qs] = h.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  for (const [re, name, keys = []] of ROUTES) {
    const m = re.exec(path);
    if (m) return { name, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), query, path };
  }
  return { name: 'library', params: {}, query, path };
}

function setTop({ title = '', back = null, actions = [] } = {}) {
  topbar.innerHTML = `
    ${back ? `<button class="icon-btn back" data-back aria-label="뒤로">${icon('back')}</button>` : ''}
    <h1>${esc(title)}</h1>
    ${actions.map((a, i) => a.href ? `<a class="icon-btn" href="${a.href}" aria-label="${esc(a.label)}">${icon(a.icon)}</a>` : `<button class="icon-btn" data-top="${i}" aria-label="${esc(a.label)}">${icon(a.icon)}</button>`).join('')}`;
  topbar.querySelector('[data-back]')?.addEventListener('click', () => {
    if (history.length > 1 && sessionStorage.getItem('navCount') > 1) history.back();
    else location.hash = back;
  });
  topbar.querySelectorAll('[data-top]').forEach(b => { b.onclick = () => actions[+b.dataset.top].onClick(); });
}

async function render({ keepScroll = false } = {}) {
  const seq = ++renderSeq;
  const r = parseHash();
  const sameView = current && current.name === r.name && current.path === r.path;
  const y = keepScroll || sameView ? window.scrollY : 0;
  current = r;
  document.querySelectorAll('#tabbar a').forEach(a => {
    const on = a.dataset.tab === r.name || (r.name === 'book' && a.dataset.tab === 'library');
    a.classList.toggle('on', on);
    a.setAttribute('aria-current', on ? 'page' : 'false');
  });
  const mod = await loaders[r.name]();
  if (seq !== renderSeq) return;
  const ctx = { el: view, params: r.params, query: r.query, setTop, rerender: () => render({ keepScroll: true }) };
  try {
    const tmp = document.createElement('div');
    ctx.el = tmp;
    await mod.render(ctx);
    if (seq !== renderSeq) return;
    view.replaceChildren(...tmp.childNodes);
    ctx.el = view;
    // render 안에서 붙인 이벤트는 노드와 함께 옮겨진다
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="empty"><p>화면을 그리지 못했습니다.</p><p class="small">${esc(e.message || e)}</p></div>`;
  }
  window.scrollTo(0, y);
}

// 하단 탭
$('#tabbar').innerHTML = `<div class="tabs">${TABS.map(([k, href, ic, label]) => `<a href="${href}" data-tab="${k}">${icon(ic)}<span>${label}</span></a>`).join('')}</div>`;

window.addEventListener('hashchange', () => {
  sessionStorage.setItem('navCount', String(+(sessionStorage.getItem('navCount') || 0) + 1));
  render();
});
bus.addEventListener('change', debounce(() => { render({ keepScroll: true }); updateTimerBar(); }, 60));
window.addEventListener('scroll', () => topbar.classList.toggle('scrolled', window.scrollY > 4), { passive: true });

// ── 타이머 막대 ──
const timerbar = $('#timerbar');
let timerState = null, tickH = null;
async function updateTimerBar() {
  timerState = await getTimer();
  if (!timerState) {
    timerbar.hidden = true;
    document.body.classList.remove('timer-on');
    clearInterval(tickH);
    return;
  }
  const book = await db.get('books', timerState.bookId);
  timerbar.hidden = false;
  document.body.classList.add('timer-on');
  timerbar.innerHTML = `${icon('timer')}<span class="t" data-t></span><span class="b">${esc(book?.title || '')}</span><button data-stop>정지</button>`;
  timerbar.querySelector('svg').style.cssText = 'width:20px;height:20px;flex:none';
  timerbar.querySelector('[data-stop]').onclick = () => stopTimerFlow();
  timerbar.querySelector('.b').onclick = () => { if (book) location.hash = '#/book/' + book.id; };
  const tick = () => { const t = timerbar.querySelector('[data-t]'); if (t && timerState) t.textContent = fmtClock(Date.now() - timerState.startedAt); };
  tick();
  clearInterval(tickH);
  tickH = setInterval(tick, 1000);
}

// ── 시작 ──
(async () => {
  applyTheme(await db.getKV('theme', 'auto'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', async () => applyTheme(await db.getKV('theme', 'auto')));
  sessionStorage.setItem('navCount', '1');
  await render();
  updateTimerBar();
  requestPersist();
  backupReminder();
})();

async function backupReminder() {
  const [last, books, shownAt] = await Promise.all([db.getKV('lastBackup', 0), db.all('books'), db.getKV('backupNagAt', 0)]);
  if (books.length < 3) return;
  const day = 86400000;
  if (Date.now() - last > 30 * day && Date.now() - shownAt > 7 * day) {
    await db.setKV('backupNagAt', Date.now());
    setTimeout(() => toast(last ? '백업한 지 한 달이 지났어요. 설정 → 백업 파일 만들기' : '기록이 폰에만 있어요. 설정 → 백업 파일 만들기로 한 번 보관해 두세요', 4500), 1500);
  }
}

// ── 오프라인 동작(서비스 워커) — 웹앱일 때만 ──
const devNoSW = location.hostname === 'localhost' && !location.search.includes('sw=1'); // 개발 중엔 캐시가 고친 파일을 가리지 않게
if (!isNative && !devNoSW && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(nw);
      });
    });
  }).catch(e => console.warn('SW 등록 실패', e));
  // 첫 설치 때는 새로고침하지 않고, 새 버전으로 바뀔 때만 다시 연다
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
}
function showUpdate(worker) {
  const bar = document.createElement('div');
  bar.className = 'update-bar';
  bar.innerHTML = '새 버전이 있습니다 <button>새로고침</button>';
  bar.querySelector('button').onclick = () => worker.postMessage('skipWaiting');
  document.body.append(bar);
}
