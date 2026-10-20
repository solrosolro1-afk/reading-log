// APK(안드로이드 앱)로 돌 때만 쓰는 네이티브 기능 연결. 웹앱에서는 모두 null.
import { blobToBase64 } from './media.js';

const cap = window.Capacitor;
export const isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());

function plugin(name) {
  if (!isNative) return null;
  try {
    if (window.capacitorExports?.registerPlugin) return window.capacitorExports.registerPlugin(name);
    return cap.Plugins?.[name] || null;
  } catch { return null; }
}

export const MlKit = plugin('MlKit');           // 한국어 OCR · 바코드 (이 앱 전용 플러그인)
const Filesystem = plugin('Filesystem');
const Share = plugin('Share');

// 파일(엑셀·백업·카드 이미지)을 폰에 넘긴다: 앱에서는 공유 시트, 웹에서는 공유 또는 내려받기
export async function deliverFile(blob, filename, { title = filename, text = '' } = {}) {
  if (isNative && Filesystem && Share) {
    const data = await blobToBase64(blob);
    const res = await Filesystem.writeFile({ path: filename, data, directory: 'CACHE' });
    await Share.share({ title, text, files: [res.uri], dialogTitle: title });
    return 'shared';
  }
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] }) && /image\//.test(blob.type)) {
    try {
      await navigator.share({ files: [file], title, text });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancel';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

// 파일을 공유 시트로만 넘길 때(이미지 공유하기 버튼)
export async function shareFile(blob, filename, opts = {}) {
  if (isNative) return deliverFile(blob, filename, opts);
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: opts.title || '', text: opts.text || '' }); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancel'; }
  }
  return deliverFile(blob, filename, opts);
}
