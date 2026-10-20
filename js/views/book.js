// 책 한 권: 진행·문장·느낀점·기록·정보
import { esc, icon, sheet, menuSheet, confirmSheet, toast, today, fmtShort, fmtDate, fmtMinutes, daysBetween, debounce, parseTags, navigate, ymd } from '../util.js';
import { db, changed, saveBook, deleteBook } from '../db.js';
import { STATUS, pct, eta, getTimer, startTimer, allTags, logSession } from '../store.js';
import { coverHTML, quoteHTML, quoteMenu, recordPage, stopTimerFlow, setStatus } from './common.js';
import { hydratePhotos, storePhoto, photoURL, pickImage, loadBitmap, toCanvas, canvasToBlob, forgetPhotoURL } from '../media.js';
import { captureText } from './capture.js';

const TABS = [['quotes', '문장'], ['review', '느낀점'], ['log', '기록'], ['info', '정보']];

export async function render(ctx) {
  const book = await db.get('books', ctx.params.id);
  if (!book) {
    ctx.setTop({ title: '책', back: '#/library' });
    ctx.el.innerHTML = `<div class="empty"><p>책을 찾을 수 없습니다.</p></div>`;
    return;
  }
  const tab = ctx.query.tab || (book.status === 'done' ? 'review' : 'quotes');
  const [quotes, notes, sessions, timer] = await Promise.all([
    db.byBook('quotes', book.id), db.byBook('notes', book.id), db.byBook('sessions', book.id), getTimer(),
  ]);
  quotes.sort((a, b) => (a.page ?? 1e9) - (b.page ?? 1e9) || a.createdAt - b.createdAt);
  notes.sort((a, b) => b.createdAt - a.createdAt);
  sessions.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
  const timing = timer?.bookId === book.id;

  ctx.setTop({ title: book.title, back: '#/library', actions: [{ icon: 'dots', label: '책 메뉴', onClick: () => bookMenu(book) }] });

  const p = pct(book);
  const e = eta(book);
  const dateLine = book.status === 'done'
    ? `${fmtShort(book.startDate)} ~ ${fmtShort(book.endDate)} · ${Math.max(1, daysBetween(book.startDate, book.endDate) + 1)}일 동안`
    : book.status === 'reading' && book.startDate
      ? `${fmtShort(book.startDate)} 시작 · ${daysBetween(book.startDate, today()) + 1}일째`
      : book.status === 'stopped' ? `${fmtShort(book.startDate)} ~ ${fmtShort(book.endDate)} 중단` : '아직 시작 전';

  ctx.el.innerHTML = `
    <div class="book-head">
      ${coverHTML(book, 'lg')}
      <div class="info">
        <span class="status-pill ${book.status}">${STATUS[book.status]}</span>
        <h2>${esc(book.title)}</h2>
        ${book.subtitle ? `<div class="sub">${esc(book.subtitle)}</div>` : ''}
        <div class="sub">${esc([book.authors, book.translator && book.translator + ' 옮김'].filter(Boolean).join(' · '))}</div>
        <div class="dates">${esc(dateLine)}</div>
        ${book.rating ? `<div class="dates" style="color:#C98A00">${'★'.repeat(Math.floor(book.rating))}${book.rating % 1 ? '½' : ''} <span class="muted">${book.rating}</span></div>` : ''}
      </div>
    </div>
    ${book.status === 'reading' || book.status === 'done' ? `
    <div class="card progress-card">
      <div class="top"><span class="pct">${p}%</span><span class="muted small">${book.pages ? `${book.currentPage || 0} / ${book.pages}쪽` : `${book.currentPage || 0}쪽`}</span></div>
      <div class="meter-bar"><i style="width:${p}%"></i></div>
      ${e ? `<div class="eta">하루 평균 ${e.rate}쪽 → <b>${fmtDate(e.date, false)}</b> 완독 예상 (남은 ${e.remain}쪽)</div>` : ''}
    </div>` : ''}
    ${book.status === 'reading' ? `
    <div class="action-grid">
      <button class="btn" data-a="quote">${icon('camera')}문장 찍기</button>
      <button class="btn" data-a="page">${icon('page')}쪽수 기록</button>
      <button class="btn ${timing ? 'primary' : ''}" data-a="timer">${icon(timing ? 'stop' : 'timer')}${timing ? '타이머 정지' : '독서 타이머'}</button>
    </div>
    <button class="btn block" data-a="finish" style="margin-top:4px">${icon('flag')}다 읽었어요 — 저자 소개 찍고 완독 기록</button>`
    : book.status === 'want' ? `<button class="btn primary block" data-a="start">${icon('play')}오늘부터 읽기 시작</button>`
    : book.status === 'stopped' ? `<button class="btn block" data-a="resume">${icon('play')}다시 읽기</button>`
    : `<div class="action-grid"><button class="btn" data-a="quote">${icon('camera')}문장 찍기</button><button class="btn" data-a="review">${icon('note')}느낀점</button><button class="btn" data-a="cards">${icon('card')}문장 카드</button></div>`}
    <div class="tabs-inline" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}${k === 'quotes' && quotes.length ? ` <span class="n">${quotes.length}</span>` : ''}</button>`).join('')}</div>
    <div data-pane></div>`;

  const pane = ctx.el.querySelector('[data-pane]');
  ({ quotes: paneQuotes, review: paneReview, log: paneLog, info: paneInfo })[tab](pane, { book, quotes, notes, sessions });
  hydratePhotos(ctx.el);

  ctx.el.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => history.replaceState(history.state, '', `#/book/${book.id}?tab=${b.dataset.tab}`) || ctx.rerender();
  });
  ctx.el.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => act(b.dataset.a, book, ctx); });
}

async function act(a, book, ctx) {
  if (a === 'quote') return addQuote(book);
  if (a === 'page') return recordPage(book);
  if (a === 'timer') {
    const t = await getTimer();
    if (t?.bookId === book.id) return stopTimerFlow();
    if (t && !(await confirmSheet('다른 책의 타이머가 돌고 있습니다. 그 기록을 마치고 이 책으로 바꿀까요?', '바꾸기'))) return;
    if (t) await stopTimerFlow();
    await startTimer(book.id);
    toast('독서 타이머를 시작했습니다. 앱을 닫아도 계속 잽니다.');
    return;
  }
  if (a === 'finish') return finishBook(book);
  if (a === 'start' || a === 'resume') { await setStatus(book, 'reading'); toast('읽는 중으로 바꿨습니다'); return; }
  if (a === 'review') return navigate(`#/book/${book.id}?tab=review`);
  if (a === 'cards') return navigate(`#/book/${book.id}?tab=quotes`);
}

export async function addQuote(book) {
  const tags = (await allTags()).map(t => t[0]);
  const r = await captureText({ title: `문장 찍기 · ${book.title}`, fields: ['page', 'tags', 'memo'], tagSuggestions: tags });
  if (!r) return;
  const q = {
    id: crypto.randomUUID?.() || String(Date.now()), bookId: book.id, text: r.text, page: r.page, tags: r.tags, memo: r.memo,
    photoId: r.photoBlob ? await storePhoto(r.photoBlob, 'quote', r.w, r.h) : null, createdAt: Date.now(), updatedAt: Date.now(),
  };
  await db.put('quotes', q);
  if (r.page && r.page > (book.currentPage || 0) && book.status === 'reading') {
    await logSession(book, { toPage: r.page, kind: 'progress' });
  }
  changed('quotes');
  toast('문장을 담았습니다');
}

// 완독: 저자 소개(또는 판권면) 사진 → 저자 정보 + 완독일
export async function finishBook(book) {
  const r = await captureText({
    title: '완독 기록 · 저자 소개 찍기',
    hint: '책날개나 맨 뒤의 저자 소개(또는 판권면)를 찍으면, 저자 정보와 함께 오늘을 완독일로 기록합니다. 사진 없이 “직접 입력”으로 넘어가도 됩니다.',
    fields: ['endDate'], saveLabel: '완독으로 기록', requireText: false,
    defaults: { endDate: today() },
  });
  if (!r) return;
  if (r.text) book.authorInfo = r.text;
  if (r.photoBlob) book.authorPhotoId = await storePhoto(r.photoBlob, 'author', r.w, r.h);
  const end = r.endDate || today();
  if (book.pages && (book.currentPage || 0) < book.pages) {
    await logSession(book, { toPage: book.pages, kind: 'progress', date: end });
  }
  book.status = 'done';
  book.endDate = end;
  if (book.pages) book.currentPage = book.pages;
  await saveBook(book);
  const t = await getTimer();
  if (t?.bookId === book.id) await stopTimerFlow();
  toast('완독을 축하합니다! 느낀점을 남겨 보세요.', 3200);
  navigate(`#/book/${book.id}?tab=review`);
}

// ── 문장 ──
function paneQuotes(pane, { book, quotes }) {
  pane.innerHTML = `
    <div class="btn-row" style="margin-bottom:12px"><button class="btn primary" data-cap>${icon('camera')}문장 찍기</button><button class="btn" data-type>${icon('edit')}직접 입력</button></div>
    ${quotes.length ? `<div class="quote-list">${quotes.map(q => quoteHTML(q, book)).join('')}</div>`
      : `<div class="empty">${icon('quote')}<p>아직 담은 문장이 없습니다.</p><p class="small">마음에 드는 쪽을 찍고, 문장만 문질러 고르세요.</p></div>`}`;
  pane.querySelector('[data-cap]').onclick = () => addQuote(book);
  pane.querySelector('[data-type]').onclick = async () => {
    const tags = (await allTags()).map(t => t[0]);
    const r = await captureText({ title: '문장 직접 입력', fields: ['page', 'tags', 'memo'], tagSuggestions: tags, typeOnly: true });
    if (!r) return;
    await db.put('quotes', { id: crypto.randomUUID(), bookId: book.id, text: r.text, page: r.page, tags: r.tags, memo: r.memo, photoId: null, createdAt: Date.now(), updatedAt: Date.now() });
    changed('quotes');
    toast('문장을 담았습니다');
  };
  pane.querySelectorAll('[data-qmenu]').forEach(b => { b.onclick = () => quoteMenu(b.dataset.qmenu); });
}

// ── 느낀점: 독서 메모 + 서평 질문 ──
const QUESTIONS = [
  ['oneLine', '한 줄 평', '이 책을 한 문장으로 말하면?', 1],
  ['impressive', '가장 인상 깊었던 점과 그 이유', '어느 장면·문장이 왜 남았나요?', 4],
  ['learned', '새롭게 알게 된 것', '몰랐던 사실, 바뀐 생각', 3],
  ['apply', '내 삶·일에 적용할 점', '이번 주에 해 볼 실천 한 가지', 3],
  ['recommend', '이 책을 권하고 싶은 사람', '누구에게, 왜?', 2],
  ['free', '자유 메모', '', 4],
];

function paneReview(pane, { book, notes }) {
  const rv = book.review || {};
  pane.innerHTML = `
    <div class="card">
      <div class="review-q" style="margin-top:2px">별점</div>
      <div class="stars" data-stars>${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" aria-label="${n}점">${icon('star')}</button>`).join('')}<span class="val" data-val></span></div>
      <p class="hint">같은 별을 한 번 더 누르면 반 개(½)가 됩니다.</p>
      ${QUESTIONS.map(([k, label, ph, rows]) => `<div class="review-q">${label}</div>
        <textarea class="textarea" data-k="${k}" rows="${rows}" placeholder="${esc(ph)}" style="min-height:${rows === 1 ? 48 : 80}px">${esc(rv[k] || '')}</textarea>`).join('')}
      <p class="hint" data-saved style="text-align:right">적는 대로 저장됩니다</p>
    </div>
    <div class="section-title">읽는 동안 남긴 메모 ${notes.length ? `· ${notes.length}` : ''}</div>
    <button class="btn block" data-addnote>${icon('plus')}메모 남기기</button>
    <div class="stack" style="margin-top:12px">${notes.map(n => `<div class="card note-item"><div class="d"><span>${fmtShort(n.date)}${n.page ? ` · p.${n.page}` : ''}</span><button class="icon-btn" data-nmenu="${n.id}" style="width:28px;height:28px;margin:-6px -6px 0 0">${icon('dots')}</button></div><p>${esc(n.text)}</p></div>`).join('')}</div>`;

  // 별점
  const stars = pane.querySelector('[data-stars]');
  const paint = () => {
    const r = book.rating || 0;
    stars.querySelectorAll('[data-n]').forEach(b => {
      const n = +b.dataset.n;
      b.classList.toggle('on', r >= n);
      b.classList.toggle('half', r === n - 0.5);
      b.querySelector('svg').style.fill = r >= n ? 'currentColor' : 'none';
      if (r === n - 0.5) b.querySelector('svg').style.fill = 'url(#half)';
    });
    pane.querySelector('[data-val]').textContent = r ? r.toFixed(1) : '';
  };
  stars.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="half"><stop offset="50%" stop-color="#E3A008"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs></svg>');
  stars.querySelectorAll('[data-n]').forEach(b => {
    b.onclick = async () => {
      const n = +b.dataset.n;
      book.rating = book.rating === n ? n - 0.5 : book.rating === n - 0.5 ? 0 : n;
      paint();
      book.updatedAt = Date.now();
      await db.put('books', book);
    };
  });
  paint();

  // 서평 자동 저장 (화면을 다시 그리지 않도록 조용히 저장)
  const savedEl = pane.querySelector('[data-saved]');
  const save = debounce(async () => {
    book.review = book.review || {};
    pane.querySelectorAll('[data-k]').forEach(t => { book.review[t.dataset.k] = t.value.trim(); });
    book.reviewedAt = Date.now();
    book.updatedAt = Date.now();
    await db.put('books', book);
    savedEl.textContent = '저장했습니다 · ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }, 600);
  pane.querySelectorAll('[data-k]').forEach(t => { t.oninput = () => { savedEl.textContent = '저장 중…'; save(); }; });

  pane.querySelector('[data-addnote]').onclick = () => noteSheet(book);
  pane.querySelectorAll('[data-nmenu]').forEach(b => {
    b.onclick = async () => {
      const n = notes.find(x => x.id === b.dataset.nmenu);
      const v = await menuSheet('메모', [{ icon: 'edit', label: '고치기', value: 'edit' }, { icon: 'trash', label: '지우기', value: 'del', danger: true }]);
      if (v === 'edit') noteSheet(book, n);
      if (v === 'del' && await confirmSheet('이 메모를 지울까요?', '지우기', true)) { await db.del('notes', n.id); changed('notes'); }
    };
  });
}

async function noteSheet(book, note = null) {
  const r = await sheet({
    title: note ? '메모 고치기' : '메모 남기기',
    body: `<label class="field"><span>지금 드는 생각</span><textarea class="textarea" rows="6" data-t placeholder="읽다가 떠오른 생각, 질문, 연결되는 경험">${esc(note?.text || '')}</textarea></label>
      <div class="row field"><label><span class="small muted">쪽 (선택)</span><input class="input" inputmode="numeric" data-p value="${esc(note?.page ?? book.currentPage ?? '')}"></label>
      <label><span class="small muted">날짜</span><input class="input" type="date" data-d value="${esc(note?.date || today())}"></label></div>`,
    actions: [{ label: '취소', value: null }, {
      label: '저장', cls: 'primary', onClick: el => ({
        text: el.querySelector('[data-t]').value.trim(), page: parseInt(el.querySelector('[data-p]').value, 10) || null, date: el.querySelector('[data-d]').value || today(),
      }),
    }],
    onMount: el => setTimeout(() => el.querySelector('[data-t]').focus(), 250),
  });
  if (!r || !r.text) return;
  const n = note ? Object.assign(note, r) : { id: crypto.randomUUID(), bookId: book.id, createdAt: Date.now(), ...r };
  await db.put('notes', n);
  changed('notes');
  toast('메모를 저장했습니다');
}

// ── 기록 ──
function paneLog(pane, { book, sessions }) {
  const total = sessions.reduce((s, x) => s + (x.minutes || 0), 0);
  const days = new Set(sessions.map(s => s.date)).size;
  const kindLabel = { timer: '타이머', progress: '쪽수', manual: '직접' };
  pane.innerHTML = `
    <div class="tiles">
      <div class="card tile"><div class="k">독서 시간</div><div class="v">${fmtMinutes(total)}</div></div>
      <div class="card tile"><div class="k">읽은 날</div><div class="v">${days}<small>일</small></div></div>
    </div>
    <div class="btn-row" style="margin:12px 0"><button class="btn" data-addlog>${icon('plus')}기록 직접 추가</button></div>
    ${sessions.length ? `<div class="card" style="padding:0">${sessions.map(s => `<div class="session-item" ${''}>
        <span class="d">${fmtShort(s.date).slice(5)}</span>
        <span class="v">${s.minutes ? fmtMinutes(s.minutes) : ''}${s.minutes && s.toPage !== s.fromPage ? ' · ' : ''}${s.toPage !== s.fromPage ? `p.${s.fromPage} → ${s.toPage}` : s.minutes ? '' : `p.${s.toPage}`}
        <span class="muted small"> ${kindLabel[s.kind] || ''}</span></span>
        <button class="icon-btn" data-sdel="${s.id}" aria-label="지우기" style="width:32px;height:32px">${icon('trash')}</button></div>`).join('<div style="border-top:1px solid var(--line)"></div>')}</div>`
      : `<div class="empty">${icon('timer')}<p>아직 독서 기록이 없습니다.</p><p class="small">독서 타이머나 쪽수 기록을 쓰면 여기에 쌓입니다.</p></div>`}`;
  pane.querySelector('[data-addlog]').onclick = async () => {
    const r = await sheet({
      title: '독서 기록 추가',
      body: `<label class="field"><span>날짜</span><input class="input" type="date" data-d value="${today()}"></label>
        <div class="row field"><label><span class="small muted">읽은 시간(분)</span><input class="input" inputmode="numeric" data-m placeholder="30"></label>
        <label><span class="small muted">몇 쪽까지</span><input class="input" inputmode="numeric" data-p placeholder="${book.currentPage || ''}"></label></div>`,
      actions: [{ label: '취소', value: null }, {
        label: '추가', cls: 'primary', onClick: el => ({
          date: el.querySelector('[data-d]').value || today(), minutes: parseInt(el.querySelector('[data-m]').value, 10) || 0, page: parseInt(el.querySelector('[data-p]').value, 10),
        }),
      }],
    });
    if (!r) return;
    await logSession(book, { minutes: r.minutes, toPage: Number.isNaN(r.page) ? null : r.page, kind: 'manual', date: r.date });
    toast('기록했습니다');
  };
  pane.querySelectorAll('[data-sdel]').forEach(b => {
    b.onclick = async () => {
      if (!(await confirmSheet('이 기록을 지울까요?', '지우기', true))) return;
      await db.del('sessions', b.dataset.sdel);
      changed('sessions');
    };
  });
}

// ── 정보 ──
async function paneInfo(pane, { book }) {
  const authorPhoto = book.authorPhotoId ? await photoURL(book.authorPhotoId) : null;
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '');
  pane.innerHTML = `
    <div class="card"><dl class="kv">
      ${row('저자', book.authors)}${row('옮긴이', book.translator)}${row('출판사', book.publisher)}${row('출간', book.pubDate)}
      ${row('쪽수', book.pages ? book.pages + '쪽' : '')}${row('ISBN', book.isbn)}${row('시작일', book.startDate && fmtDate(book.startDate))}
      ${row('완독일', book.endDate && book.status === 'done' && fmtDate(book.endDate))}${row('정보 출처', book.source)}
      ${book.tags?.length ? `<dt>태그</dt><dd>${book.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join(' ')}</dd>` : ''}
    </dl></div>
    <div class="section-title">저자 소개</div>
    <div class="card">${book.authorInfo ? `<div class="author-info">${esc(book.authorInfo)}</div>` : '<p class="muted small" style="margin:0">완독할 때 저자 소개를 찍으면 여기에 남습니다.</p>'}
      ${authorPhoto ? `<img src="${authorPhoto}" alt="저자 소개 사진" style="margin-top:12px;border-radius:10px;max-height:240px;width:auto">` : ''}
      <div class="btn-row" style="margin-top:12px"><button class="btn sm" data-author>${icon('camera')}${book.authorInfo ? '다시 찍기' : '저자 소개 찍기'}</button></div></div>
    ${book.description ? `<div class="section-title">책 소개</div><div class="card small" style="white-space:pre-wrap">${esc(book.description)}</div>` : ''}
    <div class="section-title">관리</div>
    <div class="card set-list" style="padding:0">
      <button class="set-item" data-m="edit">${icon('edit')}<span class="t"><b>책 정보 고치기</b></span></button>
      <button class="set-item" data-m="cover">${icon('camera')}<span class="t"><b>표지 사진 바꾸기</b></span></button>
      <button class="set-item" data-m="status">${icon('flag')}<span class="t"><b>상태 바꾸기</b><span>지금: ${STATUS[book.status]}</span></span></button>
      <button class="set-item" data-m="delete" style="color:var(--danger)">${icon('trash')}<span class="t"><b>이 책 지우기</b><span>문장·메모·기록도 함께 지워집니다</span></span></button>
    </div>`;
  pane.querySelector('[data-author]').onclick = async () => {
    const r = await captureText({ title: '저자 소개 찍기', hint: '책날개나 맨 뒤의 저자 소개를 찍어 주세요.', fields: [], saveLabel: '저장', defaults: {} });
    if (!r) return;
    book.authorInfo = r.text;
    if (r.photoBlob) {
      if (book.authorPhotoId) { await db.del('photos', book.authorPhotoId); forgetPhotoURL(book.authorPhotoId); }
      book.authorPhotoId = await storePhoto(r.photoBlob, 'author', r.w, r.h);
    }
    await saveBook(book);
  };
  pane.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => bookAction(b.dataset.m, book); });
}

async function bookMenu(book) {
  const v = await menuSheet(book.title, [
    { icon: 'edit', label: '책 정보 고치기', value: 'edit' },
    { icon: 'camera', label: '표지 사진 바꾸기', value: 'cover' },
    { icon: 'flag', label: '상태 바꾸기', value: 'status' },
    { icon: 'trash', label: '이 책 지우기', value: 'delete', danger: true },
  ]);
  if (v) bookAction(v, book);
}

async function bookAction(m, book) {
  if (m === 'edit') return editBook(book);
  if (m === 'cover') {
    const choice = await menuSheet('표지 사진', [{ icon: 'camera', label: '카메라로 찍기', value: true }, { icon: 'image', label: '앨범에서 고르기', value: false }]);
    if (choice === null) return;
    const f = await pickImage({ capture: choice });
    if (!f) return;
    const c = toCanvas(await loadBitmap(f), 900);
    if (book.coverId) { await db.del('photos', book.coverId); forgetPhotoURL(book.coverId); }
    book.coverId = await storePhoto(await canvasToBlob(c, 'image/jpeg', 0.82), 'cover', c.width, c.height);
    await saveBook(book);
    return;
  }
  if (m === 'status') {
    const v = await menuSheet('상태 바꾸기', Object.entries(STATUS).map(([k, l]) => ({ icon: k === book.status ? 'check' : 'chevron', label: l, value: k })));
    if (!v || v === book.status) return;
    if (v === 'done') return finishBook(book);
    await setStatus(book, v);
    return;
  }
  if (m === 'delete') {
    if (!(await confirmSheet(`“${book.title}”을(를) 지울까요? 문장·메모·기록이 모두 지워지고 되돌릴 수 없습니다.`, '지우기', true))) return;
    await deleteBook(book.id);
    toast('지웠습니다');
    navigate('#/library');
  }
}

async function editBook(book) {
  const f = (k, label, extra = '') => `<label class="field"><span>${label}</span><input class="input" data-f="${k}" value="${esc(book[k] ?? '')}" ${extra}></label>`;
  const r = await sheet({
    title: '책 정보 고치기',
    body: `${f('title', '제목')}${f('subtitle', '부제')}${f('authors', '저자')}${f('translator', '옮긴이')}${f('publisher', '출판사')}
      ${f('pages', '총 쪽수', 'inputmode="numeric"')}${f('isbn', 'ISBN', 'inputmode="numeric"')}
      <div class="row field"><label><span class="small muted">시작일</span><input class="input" type="date" data-f="startDate" value="${esc(book.startDate || '')}"></label>
      <label><span class="small muted">완독일</span><input class="input" type="date" data-f="endDate" value="${esc(book.endDate || '')}"></label></div>
      <label class="field"><span>태그</span><input class="input" data-f="tags" value="${esc((book.tags || []).join(' '))}"></label>`,
    actions: [{ label: '취소', value: null }, {
      label: '저장', cls: 'primary', onClick: el => {
        const o = {};
        el.querySelectorAll('[data-f]').forEach(i => { o[i.dataset.f] = i.value.trim(); });
        return o;
      },
    }],
  });
  if (!r) return;
  if (!r.title) { toast('제목은 비울 수 없습니다'); return; }
  Object.assign(book, r, { pages: parseInt(r.pages, 10) || null, tags: parseTags(r.tags) });
  await saveBook(book);
  toast('저장했습니다');
}

export { ymd };
