// 내보내기(엑셀·텍스트)와 백업·복원. 기록이 폰에만 있으므로 백업 파일이 유일한 사본이다.
import { db, STORES, changed } from './db.js';
import { today, ymd, fmtMinutes, daysBetween } from './util.js';
import { blobToDataURL, dataURLToBlob } from './media.js';
import { deliverFile } from './native.js';
import { STATUS } from './store.js';

function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'vendor/xlsx/xlsx.mini.min.js';
    s.onload = () => res(window.XLSX);
    s.onerror = () => rej(new Error('엑셀 모듈을 불러오지 못했습니다'));
    document.head.append(s);
  });
}

async function everything() {
  const [books, quotes, notes, sessions] = await Promise.all(['books', 'quotes', 'notes', 'sessions'].map(s => db.all(s)));
  books.sort((a, b) => (a.startDate || '9').localeCompare(b.startDate || '9'));
  return { books, quotes, notes, sessions, bmap: new Map(books.map(b => [b.id, b])) };
}

export async function exportXlsx() {
  const XLSX = await loadXLSX();
  const { books, quotes, notes, sessions, bmap } = await everything();
  const title = id => bmap.get(id)?.title || '';
  const wb = XLSX.utils.book_new();
  const add = (name, rows, widths) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths.map(w => ({ wch: w }));
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, rows.length - 1), c: rows[0].length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add('책목록', [
    ['제목', '부제', '저자', '옮긴이', '출판사', 'ISBN', '총 쪽수', '상태', '시작일', '완독일', '걸린 날', '별점', '한 줄 평', '태그'],
    ...books.map(b => [b.title, b.subtitle, b.authors, b.translator, b.publisher, b.isbn, b.pages || '', STATUS[b.status], b.startDate, b.status === 'done' ? b.endDate : '',
      b.status === 'done' && b.startDate ? daysBetween(b.startDate, b.endDate) + 1 : '', b.rating || '', b.review?.oneLine || '', (b.tags || []).join(', ')]),
  ], [28, 18, 16, 12, 14, 15, 8, 8, 11, 11, 8, 6, 36, 16]);
  add('문장', [
    ['책', '쪽', '문장', '생각', '태그', '담은 날'],
    ...quotes.sort((a, b) => title(a.bookId).localeCompare(title(b.bookId)) || (a.page || 0) - (b.page || 0))
      .map(q => [title(q.bookId), q.page || '', q.text, q.memo || '', (q.tags || []).join(', '), ymd(new Date(q.createdAt))]),
  ], [24, 6, 70, 30, 14, 11]);
  add('느낀점', [
    ['책', '별점', '한 줄 평', '인상 깊었던 점', '새로 알게 된 것', '적용할 점', '권하고 싶은 사람', '자유 메모'],
    ...books.filter(b => b.rating || Object.values(b.review || {}).some(Boolean)).map(b => {
      const r = b.review || {};
      return [b.title, b.rating || '', r.oneLine || '', r.impressive || '', r.learned || '', r.apply || '', r.recommend || '', r.free || ''];
    }),
  ], [24, 6, 30, 40, 30, 30, 20, 30]);
  add('독서메모', [['책', '날짜', '쪽', '메모'], ...notes.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(n => [title(n.bookId), n.date, n.page || '', n.text])], [24, 11, 6, 70]);
  add('독서기록', [['책', '날짜', '읽은 시간(분)', '시작 쪽', '끝 쪽', '읽은 쪽수', '방식'],
    ...sessions.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(s => [title(s.bookId), s.date, s.minutes || 0, s.fromPage || 0, s.toPage || 0, Math.max(0, (s.toPage || 0) - (s.fromPage || 0)), { timer: '타이머', progress: '쪽수 기록', manual: '직접 입력' }[s.kind] || s.kind])],
  [24, 11, 12, 8, 8, 9, 10]);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return deliverFile(blob, `책갈피_독서기록_${today()}.xlsx`, { title: '독서 기록 엑셀' });
}

// 사람이 읽기 좋은 텍스트(메모장·카톡·노션에 붙여넣기용)
export async function exportText() {
  const { books, quotes, notes, sessions } = await everything();
  const L = [`# 책갈피 독서 기록 (${today()} 내보냄)`, ''];
  for (const b of books) {
    const qs = quotes.filter(q => q.bookId === b.id).sort((a, c) => (a.page || 0) - (c.page || 0));
    const ns = notes.filter(n => n.bookId === b.id).sort((a, c) => (a.date || '').localeCompare(c.date || ''));
    const min = sessions.filter(s => s.bookId === b.id).reduce((t, s) => t + (s.minutes || 0), 0);
    const r = b.review || {};
    L.push(`## ${b.title}${b.subtitle ? ' — ' + b.subtitle : ''}`);
    L.push([b.authors, b.translator && b.translator + ' 옮김', b.publisher].filter(Boolean).join(' · '));
    L.push(`${STATUS[b.status]} · ${b.startDate || '-'} ~ ${b.status === 'done' ? b.endDate : ''}${b.rating ? ` · ★ ${b.rating}` : ''}${min ? ` · ${fmtMinutes(min)}` : ''}`);
    if (r.oneLine) L.push('', `한 줄 평: ${r.oneLine}`);
    for (const [k, l] of [['impressive', '인상 깊었던 점'], ['learned', '새로 알게 된 것'], ['apply', '적용할 점'], ['recommend', '권하고 싶은 사람'], ['free', '메모']]) {
      if (r[k]) L.push('', `### ${l}`, r[k]);
    }
    if (qs.length) {
      L.push('', '### 문장');
      for (const q of qs) {
        L.push(`> ${q.text.replace(/\n/g, '\n> ')}${q.page ? `  (p.${q.page})` : ''}`);
        if (q.memo) L.push(`  └ ${q.memo}`);
      }
    }
    if (ns.length) {
      L.push('', '### 읽으며 남긴 메모');
      for (const n of ns) L.push(`- ${n.date}${n.page ? ` p.${n.page}` : ''}: ${n.text}`);
    }
    if (b.authorInfo) L.push('', '### 저자 소개', b.authorInfo);
    L.push('', '---', '');
  }
  const blob = new Blob(['﻿' + L.join('\n')], { type: 'text/plain;charset=utf-8' });
  return deliverFile(blob, `책갈피_독서기록_${today()}.txt`, { title: '독서 기록 텍스트' });
}

// ── 백업 · 복원 ──
export async function backup({ withPhotos = true } = {}) {
  const data = { app: 'chaekgalpi', version: 1, exportedAt: new Date().toISOString() };
  for (const s of ['books', 'quotes', 'notes', 'sessions']) data[s] = await db.all(s);
  data.kv = (await db.all('kv')).filter(k => k.key !== 'timer');
  data.photos = [];
  if (withPhotos) {
    for (const p of await db.all('photos')) {
      if (!p.blob) continue;
      data.photos.push({ id: p.id, kind: p.kind, w: p.w, h: p.h, createdAt: p.createdAt, data: await blobToDataURL(p.blob) });
    }
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  await db.setKV('lastBackup', Date.now());
  return deliverFile(blob, `책갈피_백업_${today()}.json`, { title: '책갈피 백업' });
}

// mode: 'merge'(같은 항목은 더 최근 것) | 'replace'(지우고 덮기)
export async function restore(file, mode = 'merge') {
  const data = JSON.parse(await file.text());
  if (data.app !== 'chaekgalpi') throw new Error('책갈피 백업 파일이 아닙니다');
  if (mode === 'replace') for (const s of STORES) await db.clear(s);
  let n = 0;
  for (const s of ['books', 'quotes', 'notes', 'sessions']) {
    const list = data[s] || [];
    const keep = [];
    for (const x of list) {
      if (mode === 'merge') {
        const cur = await db.get(s, x.id);
        if (cur && (cur.updatedAt || cur.createdAt || 0) > (x.updatedAt || x.createdAt || 0)) continue;
      }
      keep.push(x);
    }
    await db.putMany(s, keep);
    n += keep.length;
  }
  for (const p of data.photos || []) {
    if (mode === 'merge' && await db.get('photos', p.id)) continue;
    await db.put('photos', { id: p.id, kind: p.kind, w: p.w, h: p.h, createdAt: p.createdAt, blob: await dataURLToBlob(p.data) });
  }
  for (const k of data.kv || []) {
    if (mode === 'merge' && ['lastBackup'].includes(k.key)) continue;
    await db.put('kv', k);
  }
  changed('all');
  return n;
}
