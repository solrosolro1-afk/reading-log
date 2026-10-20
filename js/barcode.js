// ISBN 바코드 읽기
// APK: 구글 코드 스캐너(기기 안) → 실패 시 카메라 화면 직접 판독
// 웹앱: 크롬 BarcodeDetector → 없으면 zxing-wasm
import { isNative, MlKit } from './native.js';
import { icon, esc, sheet, pushLayer } from './util.js';
import { loadBitmap, toCanvas, canvasToBlob, blobToBase64, pickImage } from './media.js';

export function cleanISBN(s) {
  const d = String(s || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (d.length === 13 && isISBN13(d)) return d;
  if (d.length === 10 && isISBN10(d)) return isbn10to13(d);
  return null;
}
function isISBN13(d) {
  if (!/^97[89]\d{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 12; i++) s += +d[i] * (i % 2 ? 3 : 1);
  return (10 - (s % 10)) % 10 === +d[12];
}
function isISBN10(d) {
  if (!/^\d{9}[\dX]$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 10; i++) s += (d[i] === 'X' ? 10 : +d[i]) * (10 - i);
  return s % 11 === 0;
}
function isbn10to13(d) {
  const b = '978' + d.slice(0, 9);
  let s = 0;
  for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1);
  return b + ((10 - (s % 10)) % 10);
}

// ── 정지 화면(사진)에서 읽기 ──
let zxingReady = null;
function loadZXing() {
  if (!zxingReady) {
    zxingReady = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'vendor/zxing/zxing-reader.js';
      s.onload = () => {
        const wasm = new URL('vendor/zxing/zxing_reader.wasm', location.href).href;
        window.ZXingWASM.prepareZXingModule({
          overrides: { locateFile: (p, prefix) => (p.endsWith('.wasm') ? wasm : prefix + p) },
        });
        res(window.ZXingWASM);
      };
      s.onerror = () => rej(new Error('바코드 판독기를 불러오지 못했습니다'));
      document.head.append(s);
    });
    zxingReady.catch(() => { zxingReady = null; });
  }
  return zxingReady;
}

let detector;
async function getDetector() {
  if (detector !== undefined) return detector;
  detector = null;
  try {
    if ('BarcodeDetector' in window) {
      const f = await window.BarcodeDetector.getSupportedFormats();
      if (f.includes('ean_13')) detector = new window.BarcodeDetector({ formats: ['ean_13'] });
    }
  } catch { detector = null; }
  return detector;
}

async function decodeSource(src) {
  const det = await getDetector();
  if (det) {
    try {
      const r = await det.detect(src);
      for (const x of r) { const v = cleanISBN(x.rawValue); if (v) return v; }
    } catch { /* 다음 방법으로 */ }
  }
  const Z = await loadZXing();
  let imageData;
  if (src instanceof ImageData) imageData = src;
  else {
    const c = document.createElement('canvas');
    c.width = src.videoWidth || src.width;
    c.height = src.videoHeight || src.height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, c.width, c.height);
    imageData = g.getImageData(0, 0, c.width, c.height);
  }
  const res = await Z.readBarcodes(imageData, { formats: ['EAN13'], tryHarder: true, maxNumberOfSymbols: 2 });
  for (const x of res) { const v = cleanISBN(x.text); if (v) return v; }
  return null;
}

export async function decodeFromFile(file) {
  const bmp = await loadBitmap(file);
  const c = toCanvas(bmp, 1600);
  if (isNative && MlKit) {
    try {
      const r = await MlKit.decodeBarcode({ image: await blobToBase64(await canvasToBlob(c, 'image/jpeg', 0.9)) });
      const v = cleanISBN(r?.value);
      if (v) return v;
    } catch { /* 웹 방식으로 */ }
  }
  return decodeSource(c);
}

// ── 실시간 스캔 ──
// 결과: ISBN 문자열 | null(취소)
export async function scanISBN() {
  if (isNative && MlKit) {
    try {
      const r = await MlKit.scanBarcode();
      if (r?.cancelled) return null;
      const v = cleanISBN(r?.value);
      if (v) return v;
    } catch { /* 구글 스캐너가 없는 기기 → 아래 카메라 화면으로 */ }
  }
  return liveScanner();
}

function liveScanner() {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'scanner';
    el.innerHTML = `<video playsinline muted></video><div class="guide"></div>
      <div class="top"><button class="icon-btn" data-x aria-label="닫기">${icon('close')}</button>
      <button class="icon-btn" data-torch aria-label="플래시" hidden>${icon('bolt')}</button></div>
      <div class="msg">뒷표지의 ISBN 바코드를 네모 칸에 맞춰 주세요</div>
      <div class="bottom"><button class="btn" data-photo>${icon('image')}사진으로 읽기</button><button class="btn" data-type>${icon('edit')}번호 직접 입력</button></div>`;
    document.body.append(el);
    const video = el.querySelector('video');
    const msg = el.querySelector('.msg');
    let stream = null, stopped = false, timer = null;
    const release = pushLayer(() => finish(null, true));

    function finish(v, fromPop) {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach(t => t.stop());
      el.remove();
      if (!fromPop) release();
      resolve(v);
    }

    el.querySelector('[data-x]').onclick = () => finish(null);
    el.querySelector('[data-photo]').onclick = async () => {
      const f = await pickImage({ capture: false });
      if (!f) return;
      msg.textContent = '사진에서 바코드를 찾는 중…';
      const v = await decodeFromFile(f).catch(() => null);
      if (v) finish(v); else msg.textContent = '바코드를 찾지 못했습니다. 바코드가 크게 보이게 다시 찍어 주세요.';
    };
    el.querySelector('[data-type]').onclick = async () => {
      const v = await askISBN();
      if (v) finish(v);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
        });
      } catch {
        msg.innerHTML = '카메라를 열 수 없습니다.<br>카메라 권한을 허용하거나, 아래 “사진으로 읽기”를 써 주세요.';
        return;
      }
      if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
      video.srcObject = stream;
      await video.play().catch(() => {});
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      if (caps.torch) {
        const tb = el.querySelector('[data-torch]');
        tb.hidden = false;
        let on = false;
        tb.onclick = () => { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }).catch(() => {}); };
      }
      if (caps.focusMode?.includes?.('continuous')) track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      const crop = document.createElement('canvas');
      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2) {
          // 가운데 띠만 잘라 판독(빠르고 정확)
          const vw = video.videoWidth, vh = video.videoHeight;
          const cw = Math.round(vw * 0.9), ch = Math.round(vh * 0.45);
          crop.width = cw; crop.height = ch;
          const g = crop.getContext('2d', { willReadFrequently: true });
          g.drawImage(video, (vw - cw) / 2, vh * 0.42 - ch / 2, cw, ch, 0, 0, cw, ch);
          const v = await decodeSource(crop).catch(() => null);
          if (v) { navigator.vibrate?.(60); finish(v); return; }
        }
        timer = setTimeout(tick, 180);
      };
      tick();
    })();
  });
}

export async function askISBN() {
  let val = null;
  await sheet({
    title: 'ISBN 직접 입력',
    body: `<label class="field"><span>뒷표지 바코드 아래 13자리 숫자</span>
      <input class="input" inputmode="numeric" placeholder="9788936434120" maxlength="17" data-isbn></label>
      <p class="hint" data-err></p>`,
    actions: [{ label: '취소', value: null }, {
      label: '확인', cls: 'primary', onClick: el => {
        const v = cleanISBN(el.querySelector('[data-isbn]').value);
        if (!v) { el.querySelector('[data-err]').textContent = 'ISBN 숫자가 맞지 않습니다. 다시 확인해 주세요.'; return false; }
        val = v;
        return v;
      },
    }],
    onMount: el => setTimeout(() => el.querySelector('[data-isbn]').focus(), 250),
  });
  return val;
}

export const _test = { decodeSource, esc };
