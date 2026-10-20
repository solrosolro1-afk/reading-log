// 책 정보 찾기: 국립중앙도서관(키) · 카카오(키) · Open Library · Google Books
// 모두 폰에서 직접 호출한다(중간 서버 없음). 인터넷이 없으면 그냥 건너뛴다.
import { db } from './db.js';

async function getJSON(url, opts = {}, ms = 7000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const intOf = s => { const m = /\d+/.exec(String(s ?? '')); return m ? +m[0] : null; };
const https = u => (u ? String(u).replace(/^http:\/\//, 'https://') : '');
const dateOf = s => {
  s = String(s || '');
  let m = /^(\d{4})(\d{2})(\d{2})$/.exec(s) || /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /(\d{4})/.exec(s);
  return m ? m[1] : '';
};

// "유발 하라리 지음 ; 조현욱 옮김" → { authors: '유발 하라리', translator: '조현욱' }
function splitPeople(s) {
  const parts = String(s || '').split(/\s*[;|]\s*/).filter(Boolean);
  const authors = [], trans = [];
  for (let p of parts) {
    const isTr = /(옮김|옮긴이|번역|역자|譯)|(^|\s)역(?=\s|$|[:：])/.test(p);
    p = p.replace(/(지은이|지음|글쓴이|저자|옮긴이|옮김|번역|역자|엮은이|엮음|편저|그림|사진|감수|원작)\s*[:：]?/g, ' ')
      .replace(/(^|\s)(글|저|역|편|著|譯)(?=\s|$|[:：])/g, ' ')
      .replace(/[:：]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!p) continue;
    (isTr ? trans : authors).push(p);
  }
  return { authors: authors.join(', '), translator: trans.join(', ') };
}

function splitTitle(t) {
  const s = String(t || '').trim();
  const i = s.indexOf(' : ');
  return i > 0 ? { title: s.slice(0, i).trim(), subtitle: s.slice(i + 3).trim() } : { title: s, subtitle: '' };
}

// ── 각 출처 ──
async function fromNL(key, { isbn, title }) {
  const q = isbn ? `isbn=${isbn}` : `title=${encodeURIComponent(title)}`;
  const j = await getJSON(`https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(key)}&result_style=json&page_no=1&page_size=10&${q}`);
  if (j.RESULT === 'ERROR') throw new Error(j.ERR_MESSAGE || '국립중앙도서관 오류');
  return (j.docs || []).map(d => {
    const { title, subtitle } = splitTitle(d.TITLE);
    const p = splitPeople(d.AUTHOR);
    return {
      isbn: d.EA_ISBN || d.SET_ISBN || isbn || '', title, subtitle, authors: p.authors, translator: p.translator,
      publisher: d.PUBLISHER || '', pubDate: dateOf(d.PUBLISH_PREDATE || d.REAL_PUBLISH_DATE), pages: intOf(d.PAGE),
      coverUrl: https(d.TITLE_URL), description: '', source: '국립중앙도서관',
    };
  });
}

async function fromKakao(key, { isbn, title }) {
  const q = isbn ? `target=isbn&query=${isbn}` : `target=title&size=12&query=${encodeURIComponent(title)}`;
  const j = await getJSON(`https://dapi.kakao.com/v3/search/book?${q}`, { headers: { Authorization: `KakaoAK ${key}` } });
  return (j.documents || []).map(d => {
    const i13 = String(d.isbn || '').split(/\s+/).find(x => x.length === 13) || '';
    const { title, subtitle } = splitTitle(d.title);
    return {
      isbn: i13 || isbn || '', title, subtitle, authors: (d.authors || []).join(', '), translator: (d.translators || []).join(', '),
      publisher: d.publisher || '', pubDate: dateOf(d.datetime), pages: null, coverUrl: https(d.thumbnail),
      description: d.contents || '', source: '카카오',
    };
  });
}

async function fromOpenLibrary({ isbn, title }) {
  if (isbn) {
    const j = await getJSON(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const d = j[`ISBN:${isbn}`];
    if (!d) return [];
    return [{
      isbn, title: d.title || '', subtitle: d.subtitle || '', authors: (d.authors || []).map(a => a.name).join(', '), translator: '',
      publisher: (d.publishers || []).map(p => p.name).join(', '), pubDate: dateOf(d.publish_date), pages: d.number_of_pages || null,
      coverUrl: https(d.cover?.medium || d.cover?.large || ''), description: '', source: 'Open Library',
    }];
  }
  const j = await getJSON(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=10&fields=title,subtitle,author_name,publisher,isbn,number_of_pages_median,cover_i,first_publish_year`);
  return (j.docs || []).map(d => ({
    isbn: (d.isbn || []).find(x => x.length === 13) || '', title: d.title || '', subtitle: d.subtitle || '',
    authors: (d.author_name || []).join(', '), translator: '', publisher: (d.publisher || [])[0] || '',
    pubDate: d.first_publish_year ? String(d.first_publish_year) : '', pages: d.number_of_pages_median || null,
    coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : '', description: '', source: 'Open Library',
  }));
}

async function fromGoogle(key, { isbn, title }) {
  const q = isbn ? `isbn:${isbn}` : `intitle:${title}`;
  const j = await getJSON(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10${key ? `&key=${encodeURIComponent(key)}` : ''}`);
  return (j.items || []).map(it => {
    const v = it.volumeInfo || {};
    const i13 = (v.industryIdentifiers || []).find(x => x.type === 'ISBN_13')?.identifier || isbn || '';
    return {
      isbn: i13, title: v.title || '', subtitle: v.subtitle || '', authors: (v.authors || []).join(', '), translator: '',
      publisher: v.publisher || '', pubDate: dateOf(v.publishedDate), pages: v.pageCount || null,
      coverUrl: https(v.imageLinks?.thumbnail || ''), description: v.description || '', source: 'Google Books',
    };
  });
}

async function keys() {
  return {
    nl: (await db.getKV('nlKey', '')).trim(),
    kakao: (await db.getKV('kakaoKey', '')).trim(),
    google: (await db.getKV('googleKey', '')).trim(),
  };
}

const FIELDS = ['title', 'subtitle', 'authors', 'translator', 'publisher', 'pubDate', 'pages', 'coverUrl', 'description'];

// ISBN 하나 → 여러 출처를 합친 책 정보 (없으면 null)
export async function lookupISBN(isbn) {
  const k = await keys();
  const jobs = [];
  if (k.nl) jobs.push(fromNL(k.nl, { isbn }));
  if (k.kakao) jobs.push(fromKakao(k.kakao, { isbn }));
  jobs.push(fromOpenLibrary({ isbn }));
  jobs.push(fromGoogle(k.google, { isbn }));
  const settled = await Promise.allSettled(jobs);
  const found = settled.filter(s => s.status === 'fulfilled' && s.value[0]?.title).map(s => s.value[0]);
  const errors = settled.filter(s => s.status === 'rejected').map(s => s.reason?.message);
  if (!found.length) return { book: null, errors };
  const out = { isbn, sources: [] };
  for (const f of FIELDS) {
    for (const r of found) {
      if (r[f]) { out[f] = r[f]; break; }
    }
  }
  out.sources = [...new Set(found.map(r => r.source))];
  return { book: out, errors };
}

// 제목으로 찾기 → 후보 목록
export async function searchTitle(title) {
  const k = await keys();
  const jobs = [];
  if (k.kakao) jobs.push(fromKakao(k.kakao, { title }));
  if (k.nl) jobs.push(fromNL(k.nl, { title }));
  jobs.push(fromOpenLibrary({ title }));
  if (!k.kakao && !k.nl) jobs.push(fromGoogle(k.google, { title }));
  const settled = await Promise.allSettled(jobs);
  const seen = new Set();
  const list = [];
  for (const s of settled) {
    if (s.status !== 'fulfilled') continue;
    for (const r of s.value) {
      const id = r.isbn || r.title + r.authors;
      if (!r.title || seen.has(id)) continue;
      seen.add(id);
      list.push(r);
    }
  }
  return { list: list.slice(0, 20), errors: settled.filter(s => s.status === 'rejected').map(s => s.reason?.message), hasKey: !!(k.kakao || k.nl) };
}

// 설정 화면의 키 확인
export async function testKey(kind, key) {
  const sample = '9788936434120';
  if (kind === 'nl') return (await fromNL(key, { isbn: sample })).length > 0;
  if (kind === 'kakao') return (await fromKakao(key, { isbn: sample })).length > 0;
  if (kind === 'google') return (await fromGoogle(key, { isbn: sample })).length > 0;
  return false;
}
