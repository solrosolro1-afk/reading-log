// 문장 카드 이미지: 고른 문구를 책 제목과 함께 이미지로 → 카톡·SNS 공유
import { overlay, icon, esc, toast } from '../util.js';
import { canvasToBlob } from '../media.js';
import { shareFile, deliverFile } from '../native.js';

const THEMES = {
  paper: { name: '종이', bg: '#F4EEE2', ink: '#2A251E', sub: '#7A6E5E', accent: '#C9A24A' },
  night: { name: '밤', bg: '#1C2321', ink: '#EEE7D7', sub: '#9FB0A8', accent: '#8CC2AE' },
  forest: { name: '숲', bg: '#2F5D50', ink: '#F7F3EA', sub: '#CFE2D8', accent: '#E9C46A' },
  white: { name: '흰', bg: '#FFFFFF', ink: '#1E1E1E', sub: '#777777', accent: '#1E1E1E' },
  rose: { name: '노을', bg: '#F3E3DC', ink: '#3B2622', sub: '#8E6B62', accent: '#C2654F' },
};
const SIZES = { post: ['4:5', 1080, 1350], square: ['1:1', 1080, 1080], story: ['스토리', 1080, 1920] };

let lastTheme = 'paper', lastSize = 'post';

export async function openCardMaker(q, book) {
  const ov = overlay({ title: '문장 카드' });
  ov.body.innerHTML = `
    <div class="card-preview"><canvas data-c></canvas></div>
    <div class="theme-dots">${Object.entries(THEMES).map(([k, t]) => `<button data-t="${k}" style="background:${t.bg}" aria-label="${t.name}"></button>`).join('')}</div>
    <div class="chips" style="justify-content:center;margin-top:6px">${Object.entries(SIZES).map(([k, s]) => `<button class="chip" data-s="${k}">${s[0]}</button>`).join('')}</div>
    <label class="row" style="align-items:center;gap:8px;margin:14px auto 0;max-width:420px"><input type="checkbox" data-pg checked style="flex:none;width:20px;height:20px"><span class="small" style="flex:1">쪽 번호 넣기</span></label>`;
  ov.foot.hidden = false;
  ov.foot.innerHTML = `<button class="btn" data-save>${icon('download')}저장</button><button class="btn primary" data-share>${icon('share')}공유</button>`;
  const c = ov.body.querySelector('[data-c]');
  try { await Promise.all([document.fonts.load('60px "Gowun Batang"'), document.fonts.load('700 40px "Gowun Batang"')]); } catch { /* 기본 글꼴 */ }
  const draw = () => {
    const withPage = ov.body.querySelector('[data-pg]').checked;
    drawCard(c, q, book, THEMES[lastTheme], SIZES[lastSize], withPage);
    ov.body.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === lastTheme));
    ov.body.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === lastSize));
  };
  ov.body.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => { lastTheme = b.dataset.t; draw(); }; });
  ov.body.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { lastSize = b.dataset.s; draw(); }; });
  ov.body.querySelector('[data-pg]').onchange = draw;
  draw();
  const name = () => `책갈피_${(book?.title || '문장').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 20)}_${q.page || ''}.png`;
  ov.foot.querySelector('[data-share]').onclick = async () => {
    const blob = await canvasToBlob(c, 'image/png');
    await shareFile(blob, name(), { title: book?.title || '문장', text: `${q.text}\n— ${book?.title || ''}` }).catch(e => toast('공유하지 못했습니다: ' + e.message));
  };
  ov.foot.querySelector('[data-save]').onclick = async () => {
    const blob = await canvasToBlob(c, 'image/png');
    const r = await deliverFile(blob, name(), { title: '문장 카드' }).catch(e => { toast('저장하지 못했습니다: ' + e.message); return null; });
    if (r === 'downloaded') toast('이미지를 내려받았습니다 (다운로드 폴더)');
  };
}

function drawCard(c, q, book, th, [, W, H], withPage) {
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = th.bg;
  g.fillRect(0, 0, W, H);
  // 종이 결
  g.globalAlpha = 0.035;
  g.fillStyle = th.ink;
  for (let i = 0; i < 1400; i++) g.fillRect((i * 7919) % W, (i * 104729) % H, 2, 2);
  g.globalAlpha = 1;

  const padX = 112;
  const maxW = W - padX * 2;
  const footH = 210;
  const top = H > 1500 ? 360 : 230;
  const maxH = H - top - footH - 40;
  // 글자 크기 자동 맞춤
  let size = 64, lines, lh;
  for (; size >= 30; size -= 2) {
    g.font = `400 ${size}px "Gowun Batang", serif`;
    lh = size * 1.62;
    lines = wrap(g, q.text, maxW);
    if (lines.length * lh <= maxH) break;
  }
  if (lines.length * lh > maxH) {
    const max = Math.floor(maxH / lh);
    lines = lines.slice(0, max);
    lines[max - 1] = lines[max - 1].replace(/.{0,2}$/, '…');
  }
  // 글이 짧으면 가운데보다 약간 위에 놓는다
  let y = top + 10 + Math.max(0, (maxH - lines.length * lh) * 0.4);
  // 여는 따옴표
  g.fillStyle = th.accent;
  g.font = '700 170px "Gowun Batang", serif';
  g.textBaseline = 'alphabetic';
  g.fillText('“', padX - 12, y - 30);
  g.font = `400 ${size}px "Gowun Batang", serif`;
  g.fillStyle = th.ink;
  g.textBaseline = 'top';
  for (const ln of lines) { g.fillText(ln, padX, y); y += lh; }

  // 아래: 책 제목 · 저자 · 쪽
  const fy = H - footH + 30;
  g.fillStyle = th.accent;
  g.fillRect(padX, fy, 64, 4);
  g.fillStyle = th.ink;
  g.font = '700 38px "Gowun Batang", serif';
  g.fillText(ellipsize(g, book?.title || '', maxW), padX, fy + 30);
  g.fillStyle = th.sub;
  g.font = '400 30px "Gowun Batang", serif';
  const meta = [book?.authors, withPage && q.page ? `p.${q.page}` : ''].filter(Boolean).join('  ·  ');
  g.fillText(ellipsize(g, meta, maxW), padX, fy + 84);
  g.font = '400 24px system-ui, sans-serif';
  g.textAlign = 'right';
  g.globalAlpha = 0.6;
  g.fillText('책갈피', W - padX, fy + 92);
  g.globalAlpha = 1;
  g.textAlign = 'left';
}

// 한국어 줄바꿈: 낱말(띄어쓰기) 단위, 너무 긴 낱말만 글자 단위로 자른다
function wrap(g, text, maxW) {
  const out = [];
  for (const para of String(text).split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + word : word;
      if (g.measureText(test).width <= maxW) { line = test; continue; }
      if (line) out.push(line);
      if (g.measureText(word).width <= maxW) { line = word; continue; }
      line = '';
      for (const ch of word) {
        if (g.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch;
      }
    }
    if (line) out.push(line);
  }
  return out;
}
function ellipsize(g, s, maxW) {
  if (g.measureText(s).width <= maxW) return s;
  while (s && g.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

export { esc };
