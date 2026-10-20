// 사진 고르기·회전·축소, 촬영 날짜(EXIF) 읽기, 사진 저장
import { db } from './db.js';
import { uid, ymd } from './util.js';

// capture=true면 바로 카메라, false면 앨범(갤러리) 선택
export function pickImage({ capture = true } = {}) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.append(input);
    let settled = false;
    const done = f => { if (settled) return; settled = true; input.remove(); resolve(f); };
    input.addEventListener('change', () => done(input.files?.[0] || null));
    input.addEventListener('cancel', () => done(null));
    input.click();
  });
}

export async function loadBitmap(blob) {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally { URL.revokeObjectURL(url); }
  }
}

// 긴 변을 maxSide 이하로 줄이고 rotate(0/90/180/270)만큼 돌린 캔버스
export function toCanvas(src, maxSide = 1600, rotate = 0) {
  const sw = src.width, sh = src.height;
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.round(sw * k), h = Math.round(sh * k);
  const c = document.createElement('canvas');
  const r = ((rotate % 360) + 360) % 360;
  c.width = r % 180 ? h : w;
  c.height = r % 180 ? w : h;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.translate(c.width / 2, c.height / 2);
  g.rotate(r * Math.PI / 180);
  g.drawImage(src, -w / 2, -h / 2, w, h);
  return c;
}

export const canvasToBlob = (c, type = 'image/jpeg', q = 0.82) =>
  new Promise(res => c.toBlob(res, type, q));

export function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
export function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
export async function dataURLToBlob(url) {
  return (await fetch(url)).blob();
}

// 사진을 찍은 날짜: EXIF DateTimeOriginal → DateTime → 파일 수정일 → 오늘
export async function photoDate(file) {
  try {
    const d = await readExifDate(file);
    if (d) return d;
  } catch { /* EXIF 없음 */ }
  if (file?.lastModified) {
    const lm = new Date(file.lastModified);
    if (lm.getFullYear() > 2000 && lm <= new Date()) return ymd(lm);
  }
  return ymd();
}

async function readExifDate(file) {
  const buf = await file.slice(0, 256 * 1024).arrayBuffer();
  const v = new DataView(buf);
  if (v.getUint16(0) !== 0xFFD8) return null;
  let off = 2;
  while (off + 4 < v.byteLength) {
    const marker = v.getUint16(off);
    const len = v.getUint16(off + 2);
    if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) { // 'Exif'
      return parseTiff(v, off + 10);
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    off += 2 + len;
  }
  return null;
}

function parseTiff(v, start) {
  const le = v.getUint16(start) === 0x4949;
  const u16 = o => v.getUint16(start + o, le);
  const u32 = o => v.getUint32(start + o, le);
  const readIFD = (o) => {
    const n = u16(o);
    const tags = {};
    for (let i = 0; i < n; i++) {
      const e = o + 2 + i * 12;
      const tag = u16(e), type = u16(e + 2), cnt = u32(e + 4);
      if (type === 2) {
        const p = cnt > 4 ? u32(e + 8) : e + 8;
        let s = '';
        for (let k = 0; k < cnt - 1 && start + p + k < v.byteLength; k++) s += String.fromCharCode(v.getUint8(start + p + k));
        tags[tag] = s;
      } else if (type === 4 || type === 3) {
        tags[tag] = type === 4 ? u32(e + 8) : u16(e + 8);
      }
    }
    return tags;
  };
  const ifd0 = readIFD(u32(4));
  let dt = null;
  if (ifd0[0x8769]) dt = readIFD(ifd0[0x8769])[0x9003];
  dt = dt || ifd0[0x0132];
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(dt || '');
  if (!m || m[1] === '0000') return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// ── 사진 보관 ──
export async function storePhoto(blob, kind, w = 0, h = 0) {
  const id = uid();
  await db.put('photos', { id, kind, blob, w, h, createdAt: Date.now() });
  return id;
}

const urlCache = new Map();
export async function photoURL(id) {
  if (!id) return null;
  if (urlCache.has(id)) return urlCache.get(id);
  const p = await db.get('photos', id);
  if (!p?.blob) return null;
  const url = URL.createObjectURL(p.blob);
  urlCache.set(id, url);
  return url;
}
export function forgetPhotoURL(id) {
  const u = urlCache.get(id);
  if (u) { URL.revokeObjectURL(u); urlCache.delete(id); }
}

// 화면에 붙은 <img data-photo="id"> 들의 src를 채운다
export async function hydratePhotos(root = document) {
  for (const img of root.querySelectorAll('img[data-photo]')) {
    if (img.dataset.loaded) continue;
    const url = await photoURL(img.dataset.photo);
    if (url) { img.src = url; img.dataset.loaded = '1'; }
  }
}
