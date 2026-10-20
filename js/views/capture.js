// 사진 → 글자 인식 → 원하는 줄만 형광펜처럼 골라 담기
// captureText({ title, hint, fields: ['page','tags','memo','endDate'], tagSuggestions, saveLabel, keepPhotoDefault })
//   → { text, page, tags, memo, endDate, photoBlob, w, h } | null
import { overlay, icon, esc, busyHTML, toast, today, parseTags } from '../util.js';
import { pickImage, loadBitmap, toCanvas, canvasToBlob, photoDate } from '../media.js';
import { recognize, joinLines, detectPage, warmup, engineName } from '../ocr.js';

export function captureText(opts = {}) {
  const {
    title = '문장 찍기', hint = '책을 평평하게 펴고 그림자가 지지 않게 찍어 주세요.',
    fields = ['page', 'tags', 'memo'], tagSuggestions = [], saveLabel = '저장', keepPhotoDefault = true, defaults = {},
  } = opts;
  return new Promise(resolve => {
    let result = null;
    const ov = overlay({ title, onClose: () => resolve(result) });
    warmup().catch(() => {});

    let file = null, bitmap = null, rotation = 0, canvas = null, ocr = null;
    let selected = [], edited = false, listMode = false, fileDate = null;

    function pickStep() {
      ov.foot.hidden = true;
      ov.body.innerHTML = `
        <p class="muted small" style="margin:2px 2px 14px">${esc(hint)}</p>
        <div class="pick-area">
          <button class="btn primary" data-cam>${icon('camera')}카메라로 찍기</button>
          <button class="btn" data-alb>${icon('image')}앨범에서 고르기</button>
        </div>
        <p class="hint" style="margin-top:14px">글자 인식은 폰 안에서만 처리됩니다 · ${esc(engineName())}</p>
        <div class="section-title">또는</div>
        <button class="btn block" data-type>${icon('edit')}직접 입력하기</button>`;
      ov.body.querySelector('[data-cam]').onclick = () => choose(true);
      ov.body.querySelector('[data-alb]').onclick = () => choose(false);
      ov.body.querySelector('[data-type]').onclick = () => { ocr = null; canvas = null; editStep(); };
    }

    async function choose(capture) {
      const f = await pickImage({ capture });
      if (!f) return;
      file = f;
      fileDate = await photoDate(f);
      rotation = 0;
      try { bitmap = await loadBitmap(f); } catch { toast('사진을 열 수 없습니다'); return; }
      runOCR();
    }

    async function runOCR() {
      ov.foot.hidden = true;
      ov.body.innerHTML = busyHTML('글자 읽는 중…', true);
      const msg = ov.body.querySelector('.msg'), bar = ov.body.querySelector('.progress-line i');
      canvas = toCanvas(bitmap, 2000, rotation);
      try {
        ocr = await recognize(canvas, {
          mode: 'page',
          onProgress: (m, p) => { if (msg) msg.textContent = m + '…'; if (bar) bar.style.width = Math.round((p || 0) * 100) + '%'; },
        });
      } catch (e) {
        console.error(e);
        ov.body.innerHTML = `<div class="empty"><p>글자를 읽지 못했습니다.</p><p class="small">${esc(e.message || e)}</p></div>
          <div class="btn-row"><button class="btn" data-retry>${icon('rotate')}다시 시도</button><button class="btn" data-type>직접 입력</button></div>`;
        ov.body.querySelector('[data-retry]').onclick = runOCR;
        ov.body.querySelector('[data-type]').onclick = () => editStep();
        return;
      }
      if (ov.closed) return;
      selected = ocr.lines.map(() => false);
      if (ocr.lines.length && ocr.lines.length <= 3) selected = selected.map(() => true);
      edited = false;
      selectStep();
    }

    function selectedLines() { return ocr ? ocr.lines.filter((_, i) => selected[i]) : []; }

    function selectStep() {
      const n = ocr.lines.length;
      ov.body.innerHTML = `
        ${n ? `<p class="muted small" style="margin:0 2px 8px">담고 싶은 줄을 <b>손가락으로 문질러</b> 고르세요. 다시 문지르면 해제됩니다.</p>`
          : `<p class="muted small">읽힌 글자가 없습니다. 더 가까이, 밝은 곳에서 다시 찍어 보세요.</p>`}
        <div class="sel-wrap" data-wrap ${listMode ? 'hidden' : ''}></div>
        <div class="line-list" data-list ${listMode ? '' : 'hidden'}></div>
        <div class="sel-tools">
          <button class="chip" data-all>전체 선택</button>
          <button class="chip" data-none>선택 해제</button>
          <button class="chip" data-mode>${listMode ? '사진으로 보기' : '줄 목록으로 보기'}</button>
          <button class="chip" data-rot>${icon('rotate', 'i')}돌리기</button>
          <button class="chip" data-again>다시 찍기</button>
        </div>
        <div class="section-title" style="margin-top:8px">고른 문장 <span data-cnt></span></div>
        <textarea class="textarea serif" data-text rows="5" placeholder="위에서 줄을 고르면 여기에 담깁니다. 틀린 글자는 바로 고치세요."></textarea>
        <button class="btn sm ghost" data-refill hidden>${icon('rotate')}고른 줄로 다시 채우기</button>`;
      $all('.chip svg', ov.body).forEach(s => { s.style.width = '15px'; s.style.height = '15px'; });
      drawImage();
      drawList();
      const ta = ov.body.querySelector('[data-text]');
      ta.value = joinLines(selectedLines());
      ta.oninput = () => { edited = true; ov.body.querySelector('[data-refill]').hidden = false; };
      ov.body.querySelector('[data-refill]').onclick = () => { edited = false; ta.value = joinLines(selectedLines()); ov.body.querySelector('[data-refill]').hidden = true; };
      ov.body.querySelector('[data-all]').onclick = () => { selected = selected.map(() => true); refresh(); };
      ov.body.querySelector('[data-none]').onclick = () => { selected = selected.map(() => false); refresh(); };
      ov.body.querySelector('[data-mode]').onclick = () => { listMode = !listMode; selectStep(); };
      ov.body.querySelector('[data-rot]').onclick = () => { rotation = (rotation + 90) % 360; runOCR(); };
      ov.body.querySelector('[data-again]').onclick = pickStep;
      refresh();
      ov.foot.hidden = false;
      ov.foot.innerHTML = `<button class="btn primary" data-next>다음</button>`;
      ov.foot.querySelector('[data-next]').onclick = () => editStep(ta.value);
    }

    function refresh() {
      const wrap = ov.body.querySelector('[data-wrap]');
      wrap?.querySelectorAll('.ln').forEach((d, i) => d.classList.toggle('on', !!selected[i]));
      ov.body.querySelectorAll('[data-list] button').forEach((b, i) => b.classList.toggle('on', !!selected[i]));
      const cnt = selected.filter(Boolean).length;
      const c = ov.body.querySelector('[data-cnt]');
      if (c) c.textContent = cnt ? `· ${cnt}줄` : '';
      const ta = ov.body.querySelector('[data-text]');
      if (ta && !edited) ta.value = joinLines(selectedLines());
    }

    function drawImage() {
      const wrap = ov.body.querySelector('[data-wrap]');
      if (!wrap) return;
      const W = ocr.width, H = ocr.height;
      const availW = Math.min(ov.body.clientWidth || window.innerWidth - 32, 608);
      const maxH = Math.max(320, window.innerHeight * 0.6);
      const dispW = Math.min(availW, maxH * (W / H));
      wrap.style.width = dispW + 'px';
      wrap.style.height = dispW * (H / W) + 'px';
      const img = document.createElement('canvas');
      img.width = canvas.width; img.height = canvas.height;
      img.getContext('2d').drawImage(canvas, 0, 0);
      wrap.append(img);
      ocr.lines.forEach(l => {
        const d = document.createElement('div');
        d.className = 'ln';
        const pad = (l.y1 - l.y0) * 0.12;
        d.style.left = ((l.x0 - pad) / W * 100) + '%';
        d.style.top = ((l.y0 - pad) / H * 100) + '%';
        d.style.width = ((l.x1 - l.x0 + pad * 2) / W * 100) + '%';
        d.style.height = ((l.y1 - l.y0 + pad * 2) / H * 100) + '%';
        wrap.append(d);
      });
      // 문지르기 선택
      let anchor = -1, mode = true, snap = null;
      const lineAt = (ev) => {
        const r = wrap.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
        let best = -1, bestD = Infinity;
        ocr.lines.forEach((l, i) => {
          const lh = l.y1 - l.y0;
          const dy = y < l.y0 ? l.y0 - y : y > l.y1 ? y - l.y1 : 0;
          const dx = x < l.x0 ? l.x0 - x : x > l.x1 ? x - l.x1 : 0;
          if (dy > lh * 0.9 || dx > W * 0.08) return;
          const dd = dy * 3 + dx;
          if (dd < bestD) { bestD = dd; best = i; }
        });
        return best;
      };
      const apply = (i) => {
        selected = snap.slice();
        const a = Math.min(anchor, i), b = Math.max(anchor, i);
        for (let k = a; k <= b; k++) selected[k] = mode;
        refresh();
      };
      wrap.onpointerdown = ev => {
        const i = lineAt(ev);
        if (i < 0) return;
        ev.preventDefault();
        wrap.setPointerCapture(ev.pointerId);
        anchor = i; mode = !selected[i]; snap = selected.slice();
        apply(i);
      };
      wrap.onpointermove = ev => {
        if (anchor < 0) return;
        const i = lineAt(ev);
        if (i >= 0) apply(i);
      };
      wrap.onpointerup = wrap.onpointercancel = () => { anchor = -1; };
    }

    function drawList() {
      const list = ov.body.querySelector('[data-list]');
      if (!list) return;
      list.innerHTML = ocr.lines.map((l, i) => `<button data-i="${i}">${esc(l.text)}</button>`).join('');
      list.querySelectorAll('button').forEach(b => { b.onclick = () => { const i = +b.dataset.i; selected[i] = !selected[i]; refresh(); }; });
    }

    function editStep(text = '') {
      const page = ocr ? detectPage(ocr.lines, ocr.height) : null;
      const has = f => fields.includes(f);
      ov.foot.hidden = false;
      ov.body.innerHTML = `
        <label class="field"><span>문장</span>
          <textarea class="textarea serif" data-text rows="7" placeholder="문장을 입력하세요">${esc(text)}</textarea></label>
        ${has('page') ? `<label class="field"><span>쪽</span><input class="input" data-page inputmode="numeric" placeholder="예: 123" value="${esc(defaults.page ?? page ?? '')}">
          ${page ? '<p class="hint">사진의 쪽 번호를 읽어 넣었습니다. 다르면 고쳐 주세요.</p>' : ''}</label>` : ''}
        ${has('endDate') ? `<label class="field"><span>완독일</span><input class="input" type="date" data-end value="${esc(defaults.endDate || fileDate || today())}">
          <p class="hint">사진을 찍은 날로 채웠습니다.</p></label>` : ''}
        ${has('tags') ? `<label class="field"><span>태그</span><input class="input" data-tags placeholder="쉼표나 띄어쓰기로 구분 (예: 리더십 품질)" value="${esc((defaults.tags || []).join(' '))}">
          ${tagSuggestions.length ? `<div class="chips" style="margin-top:8px" data-sugg>${tagSuggestions.slice(0, 12).map(t => `<button class="chip" type="button" data-t="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}</label>` : ''}
        ${has('memo') ? `<label class="field"><span>이 문장에 대한 생각 (선택)</span><textarea class="textarea" data-memo rows="3" placeholder="왜 마음에 들었는지 짧게 남겨 두면 나중에 더 오래 남아요">${esc(defaults.memo || '')}</textarea></label>` : ''}
        ${canvas ? `<label class="row" style="align-items:center;gap:8px;margin-top:14px;flex:none"><input type="checkbox" data-keep ${keepPhotoDefault ? 'checked' : ''} style="flex:none;width:20px;height:20px"><span class="small" style="flex:1">찍은 사진도 함께 보관</span></label>` : ''}`;
      ov.body.querySelectorAll('[data-sugg] [data-t]').forEach(b => {
        b.onclick = () => {
          const inp = ov.body.querySelector('[data-tags]');
          const cur = parseTags(inp.value);
          if (!cur.includes(b.dataset.t)) cur.push(b.dataset.t);
          inp.value = cur.join(' ');
        };
      });
      ov.foot.innerHTML = `${ocr ? '<button class="btn" data-back>이전</button>' : ''}<button class="btn primary" data-save>${esc(saveLabel)}</button>`;
      ov.foot.querySelector('[data-back]')?.addEventListener('click', () => selectStep());
      ov.foot.querySelector('[data-save]').onclick = async () => {
        const t = ov.body.querySelector('[data-text]').value.trim();
        if (!t && opts.requireText !== false) { toast('문장이 비어 있습니다'); return; }
        let photoBlob = null;
        if (canvas && ov.body.querySelector('[data-keep]')?.checked) {
          const small = toCanvas(canvas, 1600, 0);
          photoBlob = await canvasToBlob(small, 'image/jpeg', 0.75);
        }
        const pg = ov.body.querySelector('[data-page]')?.value;
        result = {
          text: t,
          page: pg ? (parseInt(pg, 10) || null) : null,
          tags: parseTags(ov.body.querySelector('[data-tags]')?.value),
          memo: ov.body.querySelector('[data-memo]')?.value.trim() || '',
          endDate: ov.body.querySelector('[data-end]')?.value || '',
          photoBlob, w: canvas?.width || 0, h: canvas?.height || 0,
        };
        ov.close();
      };
    }

    function $all(sel, el) { return [...el.querySelectorAll(sel)]; }

    if (opts.file) { file = opts.file; photoDate(file).then(d => { fileDate = d; }); loadBitmap(file).then(b => { bitmap = b; runOCR(); }); }
    else if (opts.typeOnly) editStep();
    else pickStep();
  });
}
