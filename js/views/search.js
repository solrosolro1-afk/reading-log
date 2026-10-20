// 전체 검색: 책 · 문장 · 메모 · 느낀점, 그리고 태그 모음
import { esc, icon, norm, debounce } from '../util.js';
import { db } from '../db.js';
import { allTags } from '../store.js';
import { coverHTML, quoteHTML, quoteMenu } from './common.js';
import { hydratePhotos } from '../media.js';

let lastQ = '';

export async function render(ctx) {
  ctx.setTop({ title: '검색' });
  const tags = await allTags();
  ctx.el.innerHTML = `
    <div class="search-box">${icon('search')}<input class="input" type="search" data-q placeholder="제목, 저자, 문장, 메모, 태그" value="${esc(lastQ)}" enterkeyhint="search"></div>
    <div data-res></div>
    ${tags.length ? `<div class="section-title">태그</div><div class="chips">${tags.map(([t, n]) => `<a class="chip" href="#/quotes?tag=${encodeURIComponent(t)}">#${esc(t)} <span class="muted" style="font-weight:500">${n}</span></a>`).join('')}</div>` : ''}`;
  const input = ctx.el.querySelector('[data-q]');
  const run = debounce(() => search(ctx.el.querySelector('[data-res]'), input.value), 200);
  input.oninput = () => { lastQ = input.value; run(); };
  if (lastQ) search(ctx.el.querySelector('[data-res]'), lastQ);
  else setTimeout(() => input.focus(), 50);
}

async function search(box, q) {
  const raw = q.trim();
  const n = norm(raw);
  if (!n) { box.innerHTML = ''; return; }
  const [books, quotes, notes] = await Promise.all([db.all('books'), db.all('quotes'), db.all('notes')]);
  const bmap = new Map(books.map(b => [b.id, b]));
  const tagHit = t => norm(t).includes(n.replace(/^#/, ''));
  const rb = books.filter(b => norm([b.title, b.subtitle, b.authors, b.translator, b.publisher, b.isbn].join(' ')).includes(n) || (b.tags || []).some(tagHit));
  const rr = books.filter(b => !rb.includes(b) && norm(Object.values(b.review || {}).join(' ') + b.authorInfo).includes(n));
  const rq = quotes.filter(x => norm(x.text + ' ' + (x.memo || '')).includes(n) || (x.tags || []).some(tagHit));
  const rn = notes.filter(x => norm(x.text).includes(n));
  const total = rb.length + rr.length + rq.length + rn.length;
  if (!total) { box.innerHTML = `<div class="empty"><p>“${esc(raw)}” 결과가 없습니다.</p></div>`; return; }
  const bookRow = b => `<a class="card book-item" href="#/book/${esc(b.id)}" style="padding:10px">${coverHTML(b)}<div class="info"><div class="title">${esc(b.title)}</div><div class="author">${esc(b.authors || '')}</div></div></a>`;
  box.innerHTML = `
    ${rb.length ? `<div class="result-group"><h3>책 ${rb.length}</h3><div class="book-list">${rb.map(bookRow).join('')}</div></div>` : ''}
    ${rq.length ? `<div class="result-group"><h3>문장 ${rq.length}</h3><div class="quote-list">${rq.slice(0, 60).map(x => quoteHTML(x, bmap.get(x.bookId), { showBook: true, hl: raw })).join('')}</div></div>` : ''}
    ${rn.length ? `<div class="result-group"><h3>메모 ${rn.length}</h3><div class="stack">${rn.map(x => `<a class="card note-item" style="display:block;text-decoration:none;color:inherit" href="#/book/${esc(x.bookId)}?tab=review"><div class="d"><span>${esc(bmap.get(x.bookId)?.title || '')}</span></div><p>${esc(x.text)}</p></a>`).join('')}</div></div>` : ''}
    ${rr.length ? `<div class="result-group"><h3>느낀점 ${rr.length}</h3><div class="book-list">${rr.map(bookRow).join('')}</div></div>` : ''}`;
  box.querySelectorAll('[data-qmenu]').forEach(b => { b.onclick = () => quoteMenu(b.dataset.qmenu); });
  box.querySelectorAll('.book-item .cover').forEach(c => { c.style.width = '44px'; });
  hydratePhotos(box);
}
