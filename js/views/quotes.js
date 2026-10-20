// 모든 책의 문장 모아 보기 (태그로 거르기)
import { esc, icon } from '../util.js';
import { db } from '../db.js';
import { allTags } from '../store.js';
import { quoteHTML, quoteMenu } from './common.js';

let tagFilter = '';
let sort = 'new';

export async function render(ctx) {
  ctx.setTop({ title: '문장', actions: [{ icon: 'search', label: '검색', href: '#/search' }] });
  if (ctx.query.tag !== undefined) tagFilter = ctx.query.tag;
  const [quotes, books, tags] = await Promise.all([db.all('quotes'), db.all('books'), allTags()]);
  const bmap = new Map(books.map(b => [b.id, b]));
  let list = tagFilter ? quotes.filter(q => (q.tags || []).includes(tagFilter)) : quotes;
  list = list.slice().sort(sort === 'new' ? (a, b) => b.createdAt - a.createdAt : (a, b) => a.createdAt - b.createdAt);

  ctx.el.innerHTML = `
    ${tags.length ? `<div class="seg">
      <button class="chip ${!tagFilter ? 'on' : ''}" data-tag="">전체 <span class="n">${quotes.length}</span></button>
      ${tags.map(([t, n]) => `<button class="chip ${tagFilter === t ? 'on' : ''}" data-tag="${esc(t)}">#${esc(t)} <span class="n">${n}</span></button>`).join('')}
    </div>` : ''}
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:10px">
      <span class="muted small" style="flex:none">${list.length}개 문장</span>
      <button class="btn sm ghost" data-sort style="flex:none">${sort === 'new' ? '최근 순' : '오래된 순'}</button>
    </div>
    ${list.length ? `<div class="quote-list">${list.map(q => quoteHTML(q, bmap.get(q.bookId), { showBook: true })).join('')}</div>`
      : `<div class="empty">${icon('quote')}<p>담은 문장이 없습니다.</p><p class="small">책 화면에서 “문장 찍기”로 모아 보세요.</p></div>`}`;
  ctx.el.querySelectorAll('[data-tag]').forEach(b => { b.onclick = () => { tagFilter = b.dataset.tag; history.replaceState(history.state, '', '#/quotes'); ctx.rerender(); }; });
  ctx.el.querySelector('[data-sort]').onclick = () => { sort = sort === 'new' ? 'old' : 'new'; ctx.rerender(); };
  ctx.el.querySelectorAll('[data-qmenu]').forEach(b => { b.onclick = () => quoteMenu(b.dataset.qmenu); });
  ctx.el.querySelectorAll('.quote .src').forEach((s, i) => {
    const q = list[i];
    s.style.cursor = 'pointer';
    s.onclick = () => { location.hash = `#/book/${q.bookId}?tab=quotes`; };
  });
}
