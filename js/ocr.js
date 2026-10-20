// 글자 인식(OCR). APK에서는 구글 ML Kit 한국어 모델(기기 안), 웹앱에서는 Tesseract.js(기기 안).
// 결과 형식: { lines: [{ text, x0, y0, x1, y1, block }], width, height, engine }
import { isNative, MlKit } from './native.js';
import { canvasToBlob, blobToBase64 } from './media.js';

const abs = p => new URL(p, location.href).href;

function loadScript(src) {
  return new Promise((res, rej) => {
    if ([...document.scripts].some(s => s.src === abs(src))) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('스크립트를 불러오지 못했습니다: ' + src));
    document.head.append(s);
  });
}

const STATUS_KO = {
  'loading tesseract core': '인식 엔진 불러오는 중',
  'initializing tesseract': '인식 엔진 준비 중',
  'loading language traineddata': '한국어 데이터 불러오는 중',
  'loading language traineddata (from cache)': '한국어 데이터 불러오는 중',
  'initializing api': '인식 준비 중',
  'recognizing text': '글자 읽는 중',
};

let progressCb = null;
let workerP = null, workerLang = '';

// 시험 결과: 한국어 책은 'kor' 단독이 'kor+eng'보다 정확(영문 섞으면 한글 낱말이 영문자로 바뀌는 오류)
async function langSetting() {
  const { db } = await import('./db.js');
  return db.getKV('ocrLang', 'kor');
}

async function getWorker() {
  const lang = await langSetting();
  if (workerP && workerLang !== lang) { const old = workerP; workerP = null; old.then(w => w.terminate()).catch(() => {}); }
  if (!workerP) {
    workerLang = lang;
    workerP = (async () => {
      await loadScript('vendor/tesseract/tesseract.min.js');
      return window.Tesseract.createWorker(lang.split('+'), 1, {
        workerPath: abs('vendor/tesseract/worker.min.js'),
        corePath: abs('vendor/tesseract-core/'),
        langPath: abs('vendor/tessdata'),
        gzip: true,
        logger: m => progressCb?.(STATUS_KO[m.status] || m.status, m.progress ?? 0),
      });
    })();
    workerP.catch(() => { workerP = null; });
  }
  return workerP;
}

export const engineName = () => (isNative && MlKit ? 'ML Kit 한국어(기기 안)' : 'Tesseract 한국어(기기 안)');

// 설정 화면의 '미리 준비' 및 촬영 화면 진입 시 미리 깨우기
export async function warmup(onProgress) {
  if (isNative && MlKit) return true;
  progressCb = onProgress || null;
  try { await getWorker(); return true; } finally { progressCb = null; }
}

// 인식 전 보정: 회색조 + 약한 대비 강화. 어두운 바탕(밝은 글씨) 표지는 뒤집는다(시험에서 저자명이 이때만 읽힘)
function prep(canvas, allowInvert) {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(canvas, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = y;
    sum += y;
  }
  const invert = allowInvert && sum / (d.length / 4) < 110;
  for (let i = 0; i < d.length; i += 4) {
    let y = invert ? 255 - d[i] : d[i];
    y = (y - 128) * 1.25 + 128;
    y = y < 0 ? 0 : y > 255 ? 255 : y;
    d[i] = d[i + 1] = d[i + 2] = y;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// mode: 'page'(본문) | 'cover'(표지: 흩어진 큰 글씨)
export async function recognize(canvas, { mode = 'page', onProgress } = {}) {
  const W = canvas.width, H = canvas.height;
  if (isNative && MlKit) {
    onProgress?.('글자 읽는 중', 0.3);
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    const image = await blobToBase64(blob);
    const r = await MlKit.recognizeText({ image });
    onProgress?.('정리 중', 1);
    const lines = (r.lines || []).map(l => ({ text: String(l.text || '').trim(), x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, block: l.block ?? 0 }));
    // ML Kit의 문단(블록) 순서가 위→아래가 아닐 때가 있어, 문단 윗변 기준으로 다시 줄 세운다(문지르기 범위가 끊기지 않게)
    const top = new Map();
    for (const l of lines) top.set(l.block, Math.min(top.get(l.block) ?? Infinity, l.y0));
    lines.sort((a, b) => (top.get(a.block) - top.get(b.block)) || (a.block - b.block) || (a.y0 - b.y0));
    return { lines: clean(lines), width: r.width || W, height: r.height || H, engine: 'mlkit' };
  }
  progressCb = onProgress || null;
  try {
    const w = await getWorker();
    await w.setParameters({
      // 본문: 한 덩어리(6)가 자동(3)보다 문단 앞부분을 덜 놓침 / 표지: 흩어진 글씨(11)
      tessedit_pageseg_mode: mode === 'cover' ? '11' : '6',
      preserve_interword_spaces: '1',
    });
    const { data } = await w.recognize(prep(canvas, mode === 'cover'), {}, { blocks: true, text: true });
    const minConf = mode === 'cover' ? 50 : 25; // 표지는 무늬를 글자로 잘못 읽는 일이 많아 기준을 높임
    const lines = [];
    let bi = 0;
    for (const b of data.blocks || []) {
      for (const p of b.paragraphs || []) {
        for (const l of p.lines || []) {
          if ((l.confidence ?? 100) < minConf) continue;
          lines.push({ text: fixSpacing(l.text), x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1, block: bi });
        }
        bi++;
      }
    }
    return { lines: clean(lines), width: W, height: H, engine: 'tesseract' };
  } finally { progressCb = null; }
}

// Tesseract가 한글 글자 사이에 넣는 군더더기 공백 정리
function fixSpacing(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/(?<=[가-힣]) (?=[,.!?…·」』”’)\]])/g, '')
    .replace(/(?<=[「『“‘(\[]) (?=[가-힣])/g, '')
    .trim();
}

function clean(lines) {
  return lines
    .map(l => ({ ...l, text: l.text.replace(/[|¦]+$/g, '').trim() }))
    .filter(l => l.text && /[0-9A-Za-z가-힣]/.test(l.text));
}

// 줄 바꿈으로 끊긴 낱말인지 판단: 다음 줄이 조사로 시작하면 붙여 쓴다
// ('이·가·도·만'은 '이 책', '만 원'처럼 낱말 첫머리로도 흔해서 뺐다)
const PARTICLE_START = /^들?(은|는|을|를|에|의|로|과|와|에게|에서|으로|처럼|보다|까지|부터|이다|였다|이었다)?(?=[\s,.!?…]|$)/;

// 고른 줄들을 한 문단 글로 합친다
export function joinLines(lines) {
  if (!lines.length) return '';
  const hs = lines.map(l => l.y1 - l.y0).sort((a, b) => a - b);
  const lh = hs[Math.floor(hs.length / 2)] || 20;
  let out = lines[0].text;
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1], cur = lines[i];
    const gap = cur.y0 - prev.y1;
    const newPara = gap > lh * 0.95 || (cur.block !== prev.block && gap > lh * 0.5);
    if (newPara) { out += '\n' + cur.text; continue; }
    if (/[A-Za-z]-$/.test(out) && /^[a-z]/.test(cur.text)) { out = out.slice(0, -1) + cur.text; continue; }
    const m = PARTICLE_START.exec(cur.text);
    if (/[가-힣]$/.test(out) && m && m[0]) { out += cur.text; continue; }
    out += ' ' + cur.text;
  }
  return out.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

// 머리말·꼬리말 자리의 숫자를 쪽 번호로 추정
export function detectPage(lines, height) {
  const zone = l => l.y1 < height * 0.13 || l.y0 > height * 0.87;
  for (const l of lines) {
    if (!zone(l)) continue;
    const t = l.text.trim();
    let m = /^[^\dA-Za-z가-힣]{0,2}(\d{1,4})[^\dA-Za-z가-힣]{0,2}$/.exec(t)
      || /^(\d{1,4})\s+\S/.exec(t)
      || /\S\s+(\d{1,4})$/.exec(t);
    if (m) {
      const n = +m[1];
      if (n > 0 && n < 3000) return n;
    }
  }
  return null;
}
