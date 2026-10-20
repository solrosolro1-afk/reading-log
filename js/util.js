// 공통 도우미: 날짜, 이스케이프, 아이콘, 토스트, 바텀시트, 전체화면 오버레이

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ── 날짜 (모두 기기 현지 시각 기준 'YYYY-MM-DD') ──
export function ymd(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const today = () => ymd();
export function parseYmd(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function fmtDate(s, withYear = true) {
  const d = parseYmd(s);
  if (!d) return '';
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return withYear ? `${d.getFullYear()}년 ${md}` : md;
}
export function fmtShort(s) {
  const d = parseYmd(s);
  if (!d) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
export function daysBetween(a, b) {
  const da = parseYmd(a), db = parseYmd(b);
  if (!da || !db) return 0;
  return Math.round((db - da) / 86400000);
}
export function addDays(s, n) {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
export function fmtMinutes(min) {
  min = Math.round(min || 0);
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}
export function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`;
}

// 검색용 정규화: 공백 제거 + 소문자 (OCR 띄어쓰기 차이를 흡수)
export const norm = s => String(s ?? '').toLowerCase().replace(/\s+/g, '');

export function debounce(fn, ms = 250) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function parseTags(s) {
  return [...new Set(String(s || '').split(/[,#\s]+/).map(t => t.trim()).filter(Boolean))];
}

// 표지가 없을 때 제목으로 정해지는 차분한 색
const PH_COLORS = ['#5B6B5D', '#7A5C4F', '#4F5F7A', '#6E5A78', '#7A6A45', '#4E6F6B', '#83564F', '#5A6475'];
export function phColor(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return PH_COLORS[h % PH_COLORS.length];
}

// ── 아이콘 (선 굵기 1.8, currentColor) ──
const P = {
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6"/><path d="M14 7h4v4c0 3-1.5 5-4 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  barcode: '<path d="M4 6v12M7 6v12M10 6v12M14 6v12M16 6v12M20 6v12"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  page: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  card: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  rotate: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>',
  note: '<path d="M5 4h14v12l-5 4H5z"/><path d="M14 20v-4h5M9 9h6M9 13h4"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  db: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
};
export function icon(name, cls = '') {
  const fill = name === 'play' || name === 'stop' ? 'currentColor' : 'none';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

// ── 토스트 ──
let toastTimer;
export function toast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ── 뒤로가기(안드로이드 back 버튼)로 닫히는 레이어 관리 ──
const layers = [];
window.addEventListener('popstate', () => {
  const top = layers[layers.length - 1];
  if (top && history.state?.layer !== top.id) {
    layers.pop();
    top.close(true);
  }
});
export function pushLayer(close) {
  const id = uid();
  const prev = history.state?.layer;
  history.pushState({ layer: id, prev }, '');
  const entry = { id, close };
  layers.push(entry);
  return () => {
    const i = layers.indexOf(entry);
    if (i < 0) return;
    layers.splice(i, 1);
    if (history.state?.layer === id) {
      pendingBack = new Promise(res => {
        const h = () => { window.removeEventListener('popstate', h); res(); };
        window.addEventListener('popstate', h);
        setTimeout(res, 500);
      });
      history.back();
    }
  };
}
let pendingBack = Promise.resolve();
export const hasLayer = () => layers.length > 0;

// 레이어를 닫으며 생긴 history.back()이 끝난 뒤에 화면을 옮긴다(순서가 꼬이면 이전 화면으로 되돌아감)
export async function navigate(hash) {
  await pendingBack;
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

// ── 바텀시트 ──
// sheet({ title, body (html|Element), actions: [{label, cls, value}], onMount(el, close) }) → Promise(value|null)
export function sheet({ title = '', body = '', actions = [], onMount } = {}) {
  return new Promise(resolve => {
    const bd = document.createElement('div');
    bd.className = 'backdrop';
    const el = document.createElement('div');
    el.className = 'sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="grab"></div>
      <header><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="닫기">${icon('close')}</button></header>
      <div class="body"></div>
      ${actions.length ? `<div class="foot">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-act="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}`;
    const bodyEl = el.querySelector('.body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.append(body);
    document.body.append(bd, el);
    requestAnimationFrame(() => { bd.classList.add('show'); el.classList.add('show'); });
    let done = false;
    const finish = (val, fromPop) => {
      if (done) return;
      done = true;
      if (!fromPop) release();
      bd.classList.remove('show');
      el.classList.remove('show');
      setTimeout(() => { bd.remove(); el.remove(); }, 230);
      resolve(val);
    };
    const release = pushLayer(() => finish(null, true));
    bd.onclick = () => finish(null);
    el.querySelector('[data-x]').onclick = () => finish(null);
    el.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        const a = actions[+b.dataset.act];
        if (a.onClick) {
          const r = await a.onClick(el);
          if (r === false) return;
          finish(r === undefined ? a.value : r);
        } else finish(a.value);
      };
    });
    onMount?.(el, v => finish(v));
  });
}

export function confirmSheet(msg, okLabel = '확인', danger = false) {
  return sheet({
    title: msg,
    actions: [{ label: '취소', value: false }, { label: okLabel, cls: danger ? 'primary danger' : 'primary', value: true }],
  }).then(v => !!v);
}

// 메뉴 시트: items [{icon, label, value, danger}]
export function menuSheet(title, items) {
  return sheet({
    title,
    body: `<div class="menu-list">${items.map((it, i) => `<button data-i="${i}" class="${it.danger ? 'danger' : ''}">${icon(it.icon || 'chevron')}<span>${esc(it.label)}</span></button>`).join('')}</div>`,
    onMount: (el, close) => el.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => close(items[+b.dataset.i].value); }),
  });
}

// ── 전체화면 오버레이 (촬영·선택 흐름) ──
// overlay({ title, onClose }) → { el, body, foot, setTitle, close }
export function overlay({ title = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<header><button class="icon-btn" data-x aria-label="닫기">${icon('close')}</button><h3>${esc(title)}</h3><div class="right"></div></header>
    <div class="body"><div class="inner"></div></div><div class="foot" hidden></div>`;
  document.body.append(el);
  document.body.style.overflow = 'hidden';
  let closed = false;
  const doClose = (fromPop) => {
    if (closed) return;
    closed = true;
    if (!fromPop) release();
    el.remove();
    if (!document.querySelector('.overlay')) document.body.style.overflow = '';
    onClose?.();
  };
  const release = pushLayer(() => doClose(true));
  el.querySelector('[data-x]').onclick = () => doClose(false);
  return {
    el,
    body: el.querySelector('.inner'),
    foot: el.querySelector('.foot'),
    right: el.querySelector('header .right'),
    setTitle: t => { el.querySelector('h3').textContent = t; },
    close: () => doClose(false),
    get closed() { return closed; },
  };
}

export function busyHTML(msg, withBar = false) {
  return `<div class="busy"><div class="spinner"></div><div class="msg">${esc(msg)}</div>${withBar ? '<div class="progress-line"><i></i></div>' : ''}</div>`;
}
