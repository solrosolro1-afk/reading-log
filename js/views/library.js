// 서재: 상태별 책 목록 + 올해 목표 막대
import { esc, icon, fmtShort, daysBetween, today } from '../util.js';
import { db } from '../db.js';
import { allBooks, pct, STATUS, STATUS_ORDER, yearOf } from '../store.js';
import { coverHTML } from './common.js';
import { hydratePhotos } from '../media.js';
import { openAddBook } from './addbook.js';

let lastFilter = 'reading';

export async function render(ctx) {
  ctx.setTop({ title: '책갈피', actions: [{ icon: 'search', label: '검색', href: '#/search' }] });
  const books = await allBooks();
  const year = new Date().getFullYear();
  const goal = await db.getKV('yearGoal', 24);
  const doneThisYear = books.filter(b => b.status === 'done' && yearOf(b.endDate) === year).length;
  const counts = Object.fromEntries(STATUS_ORDER.map(s => [s, books.filter(b => b.status === s).length]));
  const filter = ctx.query.f || (counts[lastFilter] ? lastFilter : (books.length ? (counts.reading ? 'reading' : 'all') : 'reading'));
  lastFilter = filter;
  const list = filter === 'all' ? books : books.filter(b => b.status === filter);
  if (filter === 'done') list.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));

  const goalPct = goal ? Math.min(100, Math.round((doneThisYear / goal) * 100)) : 0;
  ctx.el.innerHTML = `
    <a class="card goal-strip" href="#/stats">
      <div class="meter"><strong>${year}년 ${doneThisYear}권 완독</strong> <span class="muted small">/ 목표 ${goal}권</span>
        <div class="meter-bar"><i style="width:${goalPct}%"></i></div></div>
      ${icon('chevron')}
    </a>
    <div class="seg" role="tablist">
      ${STATUS_ORDER.map(s => `<button class="chip ${filter === s ? 'on' : ''}" data-f="${s}">${STATUS[s]} <span class="n">${counts[s]}</span></button>`).join('')}
      <button class="chip ${filter === 'all' ? 'on' : ''}" data-f="all">전체 <span class="n">${books.length}</span></button>
    </div>
    ${list.length ? `<div class="book-list">${list.map(itemHTML).join('')}</div>` : emptyHTML(filter, books.length)}
    <button class="fab" data-add>${icon('plus')}책 추가</button>`;
  ctx.el.querySelector('.goal-strip svg').style.cssText = 'width:20px;height:20px;color:var(--muted)';
  ctx.el.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => { lastFilter = b.dataset.f; ctx.rerender(); }; });
  ctx.el.querySelector('[data-add]').onclick = () => openAddBook({ status: filter === 'want' ? 'want' : 'reading' });
  ctx.el.querySelector('[data-first]')?.addEventListener('click', () => openAddBook({}));
  hydratePhotos(ctx.el);
}

function itemHTML(b) {
  const p = pct(b);
  let meta = '';
  if (b.status === 'reading') meta = `<span>${b.startDate ? `${daysBetween(b.startDate, today()) + 1}일째` : ''}</span><span>${b.pages ? `${b.currentPage || 0}/${b.pages}쪽` : ''}</span>`;
  else if (b.status === 'done') meta = `<span>${fmtShort(b.endDate)} 완독</span>${b.rating ? `<span style="color:#C98A00">★ ${b.rating}</span>` : ''}`;
  else if (b.status === 'stopped') meta = `<span>${fmtShort(b.endDate)} 중단</span>`;
  else meta = `<span>읽고 싶은 책</span>`;
  return `<a class="card book-item" href="#/book/${esc(b.id)}">
    ${coverHTML(b)}
    <div class="info">
      <div class="title">${esc(b.title)}</div>
      <div class="author">${esc(b.authors || '저자 미상')}</div>
      <div class="meta">${meta}</div>
      ${b.status === 'reading' ? `<div class="meter-bar"><i style="width:${p}%"></i></div>` : ''}
    </div></a>`;
}

function emptyHTML(filter, total) {
  if (!total) {
    return `<div class="empty">${icon('book')}
      <p><b>첫 책을 넣어 볼까요?</b></p>
      <p class="small">표지를 찍으면 오늘이 시작일로 기록되고,<br>뒷표지 바코드를 찍으면 책 정보가 채워집니다.</p>
      <button class="btn primary" data-first style="margin-top:14px">${icon('camera')}표지 찍고 시작하기</button></div>`;
  }
  return `<div class="empty"><p>${STATUS[filter] || ''} 책이 없습니다.</p></div>`;
}
