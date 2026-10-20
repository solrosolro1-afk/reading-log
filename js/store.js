// 기록 조회·계산 묶음 (진행률, 예상 완독일, 독서일, 연속 기록, 타이머)
import { db, changed, saveBook } from './db.js';
import { uid, today, ymd, daysBetween, addDays, parseYmd } from './util.js';

export const STATUS = { reading: '읽는 중', done: '완독', want: '읽고 싶은', stopped: '중단' };
export const STATUS_ORDER = ['reading', 'done', 'want', 'stopped'];

export async function allBooks() {
  const list = await db.all('books');
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function pct(b) {
  if (b.status === 'done') return 100;
  if (!b.pages || !b.currentPage) return 0;
  return Math.max(0, Math.min(100, Math.round((b.currentPage / b.pages) * 100)));
}

// 하루 평균 쪽수로 예상 완독일
export function eta(b) {
  if (b.status !== 'reading' || !b.pages || !b.currentPage || !b.startDate) return null;
  const days = Math.max(1, daysBetween(b.startDate, today()) + 1);
  const rate = b.currentPage / days;
  if (rate <= 0) return null;
  const remain = Math.max(0, b.pages - b.currentPage);
  return { rate: Math.round(rate * 10) / 10, date: addDays(today(), Math.ceil(remain / rate)), remain };
}

export function newBook(fields = {}) {
  const now = Date.now();
  return {
    id: uid(), title: '', subtitle: '', authors: '', translator: '', publisher: '', pubDate: '', isbn: '',
    pages: null, currentPage: 0, status: 'reading', startDate: today(), endDate: '', coverId: null, coverUrl: '',
    rating: 0, review: {}, authorInfo: '', authorPhotoId: null, tags: [], description: '', source: '',
    createdAt: now, updatedAt: now, ...fields,
  };
}

// 독서 기록 한 건 (타이머·쪽수 갱신·직접 입력)
export async function logSession(book, { minutes = 0, toPage = null, kind = 'manual', date = today(), startedAt = null, endedAt = null }) {
  const fromPage = book.currentPage || 0;
  const s = {
    id: uid(), bookId: book.id, date, minutes: Math.max(0, Math.round(minutes)), fromPage,
    toPage: toPage == null ? fromPage : toPage, kind, startedAt, endedAt, createdAt: Date.now(),
  };
  await db.put('sessions', s);
  if (toPage != null && toPage >= 0) {
    book.currentPage = book.pages ? Math.min(toPage, book.pages) : toPage;
  }
  if (book.status === 'want') { book.status = 'reading'; if (!book.startDate) book.startDate = date; }
  await saveBook(book);
  changed('sessions');
  return s;
}

// ── 타이머 (앱을 닫아도 시작 시각을 기억) ──
export const getTimer = () => db.getKV('timer', null);
export async function startTimer(bookId) {
  await db.setKV('timer', { bookId, startedAt: Date.now() });
  changed('timer');
}
export async function cancelTimer() {
  await db.setKV('timer', null);
  changed('timer');
}

// ── 독서한 날 모음: 기록·문장·메모가 있는 날 ──
export async function activityByDay() {
  const map = new Map(); // date → { minutes, pages, quotes, notes }
  const bump = (d, k, v = 1) => {
    if (!d) return;
    const e = map.get(d) || { minutes: 0, pages: 0, quotes: 0, notes: 0 };
    e[k] += v;
    map.set(d, e);
  };
  for (const s of await db.all('sessions')) {
    bump(s.date, 'minutes', s.minutes || 0);
    bump(s.date, 'pages', Math.max(0, (s.toPage || 0) - (s.fromPage || 0)));
  }
  for (const q of await db.all('quotes')) bump(ymd(new Date(q.createdAt)), 'quotes');
  for (const n of await db.all('notes')) bump(n.date || ymd(new Date(n.createdAt)), 'notes');
  return map;
}

export function streaks(dayMap) {
  const days = [...dayMap.keys()].sort();
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  // 오늘(또는 어제)까지 이어지는 연속
  let cur = 0;
  let d = dayMap.has(today()) ? today() : addDays(today(), -1);
  while (dayMap.has(d)) { cur++; d = addDays(d, -1); }
  return { current: cur, longest };
}

export function yearOf(s) { return s ? +s.slice(0, 4) : null; }

export async function allTags() {
  const count = new Map();
  for (const q of await db.all('quotes')) for (const t of q.tags || []) count.set(t, (count.get(t) || 0) + 1);
  for (const b of await db.all('books')) for (const t of b.tags || []) count.set(t, (count.get(t) || 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]);
}

export function dateOfTs(ts) { return ymd(new Date(ts)); }
export { parseYmd };
