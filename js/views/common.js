// 여러 화면이 같이 쓰는 조각: 표지, 문장 카드, 타이머 정지, 쪽수 기록, 문장 메뉴
import { esc, icon, sheet, menuSheet, confirmSheet, toast, today, fmtMinutes, phColor, parseTags, fmtShort, ymd } from '../util.js';
import { db, changed, saveBook } from '../db.js';
import { logSession, getTimer, cancelTimer } from '../store.js';
import { photoURL, forgetPhotoURL } from '../media.js';

export function coverHTML(b, cls = '') {
  if (b.coverId) return `<div class="cover ${cls}"><img data-photo="${esc(b.coverId)}" alt=""></div>`;
  if (b.coverUrl) return `<div class="cover ${cls}"><img src="${esc(b.coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>`;
  return `<div class="cover ph ${cls}" style="background:${phColor(b.title)}">${esc(b.title.slice(0, 24))}</div>`;
}

export function quoteHTML(q, book, { showBook = false, hl = '' } = {}) {
  let text = esc(q.text);
  if (hl) {
    const i = q.text.toLowerCase().indexOf(hl.toLowerCase());
    if (i >= 0) text = esc(q.text.slice(0, i)) + '<mark>' + esc(q.text.slice(i, i + hl.length)) + '</mark>' + esc(q.text.slice(i + hl.length));
  }
  const src = showBook && book ? `${esc(book.title)}${q.page ? ' · ' : ''}` : '';
  return `<article class="quote" data-qid="${esc(q.id)}">
    <blockquote>${text}</blockquote>
    ${q.memo ? `<div class="memo">${esc(q.memo)}</div>` : ''}
    <div class="foot"><span class="src">${src}${q.page ? `p.${q.page}` : ''}${(q.tags || []).map(t => ` <span class="tag">#${esc(t)}</span>`).join('')}</span>
    <span>${fmtShort(ymd(new Date(q.createdAt)))}</span>
    <button class="icon-btn more" data-qmenu="${esc(q.id)}" aria-label="문장 메뉴">${icon('dots')}</button></div>
  </article>`;
}

// 문장 메뉴: 카드 이미지 · 복사 · 고치기 · 사진 보기 · 지우기
export async function quoteMenu(qid) {
  const q = await db.get('quotes', qid);
  if (!q) return;
  const book = await db.get('books', q.bookId);
  const items = [
    { icon: 'card', label: '문장 카드 이미지 만들기', value: 'card' },
    { icon: 'copy', label: '복사하기', value: 'copy' },
    { icon: 'edit', label: '고치기', value: 'edit' },
  ];
  if (q.photoId) items.push({ icon: 'image', label: '찍은 사진 보기', value: 'photo' });
  items.push({ icon: 'trash', label: '지우기', value: 'del', danger: true });
  const v = await menuSheet('문장', items);
  if (v === 'card') {
    const { openCardMaker } = await import('./cardimg.js');
    openCardMaker(q, book);
  } else if (v === 'copy') {
    const txt = `${q.text}\n— ${book?.title || ''}${book?.authors ? ', ' + book.authors : ''}${q.page ? ` (p.${q.page})` : ''}`;
    try { await navigator.clipboard.writeText(txt); toast('복사했습니다'); } catch { toast('복사하지 못했습니다'); }
  } else if (v === 'edit') {
    await editQuote(q);
  } else if (v === 'photo') {
    const url = await photoURL(q.photoId);
    await sheet({ title: '찍은 사진', body: `<img src="${url}" alt="" style="border-radius:10px;width:100%">` });
  } else if (v === 'del') {
    if (await confirmSheet('이 문장을 지울까요?', '지우기', true)) {
      if (q.photoId) { await db.del('photos', q.photoId); forgetPhotoURL(q.photoId); }
      await db.del('quotes', q.id);
      changed('quotes');
      toast('지웠습니다');
    }
  }
}

export async function editQuote(q) {
  const r = await sheet({
    title: '문장 고치기',
    body: `<label class="field"><span>문장</span><textarea class="textarea serif" rows="7" data-t>${esc(q.text)}</textarea></label>
      <label class="field"><span>쪽</span><input class="input" inputmode="numeric" data-p value="${esc(q.page ?? '')}"></label>
      <label class="field"><span>태그</span><input class="input" data-g value="${esc((q.tags || []).join(' '))}"></label>
      <label class="field"><span>생각</span><textarea class="textarea" rows="3" data-m>${esc(q.memo || '')}</textarea></label>`,
    actions: [{ label: '취소', value: null }, {
      label: '저장', cls: 'primary', onClick: el => ({
        text: el.querySelector('[data-t]').value.trim(),
        page: parseInt(el.querySelector('[data-p]').value, 10) || null,
        tags: parseTags(el.querySelector('[data-g]').value),
        memo: el.querySelector('[data-m]').value.trim(),
      }),
    }],
  });
  if (!r || !r.text) return;
  Object.assign(q, r, { updatedAt: Date.now() });
  await db.put('quotes', q);
  changed('quotes');
  toast('고쳤습니다');
}

// 쪽수 기록
export async function recordPage(book) {
  const cur = book.currentPage || 0;
  const r = await sheet({
    title: '지금 몇 쪽까지 읽었나요?',
    body: `<div class="row" style="align-items:center;gap:10px">
        <input class="input" data-p inputmode="numeric" value="${cur || ''}" placeholder="쪽" style="font-size:24px;font-weight:800;text-align:center">
        <span class="muted" style="flex:none">${book.pages ? `/ ${book.pages}쪽` : '쪽'}</span></div>
      ${book.pages ? `<input type="range" min="0" max="${book.pages}" value="${cur}" data-r style="width:100%;margin-top:16px;accent-color:var(--accent)">` : ''}
      <div class="chips" style="margin-top:12px">${[10, 20, 30, 50].map(n => `<button class="chip" data-add="${n}">+${n}</button>`).join('')}${book.pages ? `<button class="chip" data-end>끝까지</button>` : ''}</div>
      ${book.pages ? '' : '<p class="hint">책 정보에 총 쪽수를 넣으면 진행률과 예상 완독일이 보입니다.</p>'}`,
    actions: [{ label: '취소', value: null }, { label: '기록', cls: 'primary', onClick: el => parseInt(el.querySelector('[data-p]').value, 10) }],
    onMount: el => {
      const p = el.querySelector('[data-p]'), rg = el.querySelector('[data-r]');
      rg && (rg.oninput = () => { p.value = rg.value; });
      p.oninput = () => { if (rg) rg.value = p.value; };
      el.querySelectorAll('[data-add]').forEach(b => { b.onclick = () => { p.value = (parseInt(p.value, 10) || 0) + +b.dataset.add; if (rg) rg.value = p.value; }; });
      el.querySelector('[data-end]')?.addEventListener('click', () => { p.value = book.pages; if (rg) rg.value = book.pages; });
    },
  });
  if (r == null || Number.isNaN(r)) return false;
  await logSession(book, { toPage: r, kind: 'progress' });
  toast(`${r}쪽까지 기록했습니다`);
  return true;
}

// 타이머 정지 → 읽은 쪽 묻고 기록
export async function stopTimerFlow() {
  const t = await getTimer();
  if (!t) return;
  const book = await db.get('books', t.bookId);
  const endedAt = Date.now();
  const minutes = (endedAt - t.startedAt) / 60000;
  if (!book) { await cancelTimer(); return; }
  const r = await sheet({
    title: `${fmtMinutes(Math.max(1, minutes))} 읽었습니다`,
    body: `<p class="muted small" style="margin-top:0">${esc(book.title)}</p>
      <label class="field"><span>몇 쪽까지 읽었나요?</span>
      <input class="input" data-p inputmode="numeric" value="${book.currentPage || ''}" placeholder="${book.currentPage || '쪽'}" style="font-size:22px;font-weight:800"></label>`,
    actions: [{ label: '기록 안 함', value: 'discard' }, { label: '기록', cls: 'primary', onClick: el => ({ page: el.querySelector('[data-p]').value }) }],
  });
  if (r === null) return; // 닫기만 함 → 타이머 계속
  if (r === 'discard') {
    if (await confirmSheet('이번 독서 시간을 버릴까요?', '버리기', true)) { await cancelTimer(); toast('타이머를 껐습니다'); }
    return;
  }
  const page = parseInt(r.page, 10);
  await logSession(book, { minutes: Math.max(1, minutes), toPage: Number.isNaN(page) ? null : page, kind: 'timer', startedAt: t.startedAt, endedAt });
  await cancelTimer();
  toast(`${fmtMinutes(Math.max(1, minutes))} 기록했습니다`);
}

// 상태 바꾸기
export async function setStatus(book, status) {
  book.status = status;
  if (status === 'reading' && !book.startDate) book.startDate = today();
  if (status === 'done' && !book.endDate) { book.endDate = today(); if (book.pages) book.currentPage = book.pages; }
  if (status !== 'done') book.endDate = status === 'stopped' ? (book.endDate || today()) : '';
  await saveBook(book);
}
