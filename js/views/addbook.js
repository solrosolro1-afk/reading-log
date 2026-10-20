// 책 추가: 표지 사진(시작일·제목 자동) + ISBN 바코드(정확한 서지) + 제목 검색
import { overlay, icon, esc, toast, today, parseTags, navigate, menuSheet, phColor } from '../util.js';
import { pickImage, loadBitmap, toCanvas, canvasToBlob, photoDate, storePhoto } from '../media.js';
import { recognize, warmup } from '../ocr.js';
import { scanISBN, askISBN } from '../barcode.js';
import { lookupISBN, searchTitle } from '../bookapi.js';
import { newBook, STATUS } from '../store.js';
import { saveBook } from '../db.js';

export function openAddBook({ status = 'reading' } = {}) {
  const ov = overlay({ title: '책 추가' });
  warmup().catch(() => {});
  const st = { coverBlob: null, coverURL: null, coverW: 0, coverH: 0, ocrLines: null, ocrBusy: false, apiBusy: false, sources: [] };
  const book = newBook({ status });

  ov.body.innerHTML = `
    <div class="pick-area" data-pick>
      <button class="btn primary" data-cam>${icon('camera')}표지 찍기</button>
      <button class="btn" data-scan>${icon('barcode')}바코드 스캔</button>
    </div>
    <p class="hint" style="margin:8px 2px 0">표지를 찍으면 <b>찍은 날이 시작일</b>로, 표지 글자가 제목 후보로 들어갑니다. 뒷표지 바코드까지 찍으면 제목·저자·출판사·쪽수가 정확히 채워집니다.</p>
    <div data-cover style="margin-top:14px" hidden></div>
    <div data-ocr hidden></div>
    <div data-api hidden></div>
    <div class="section-title">제목으로 찾기</div>
    <div class="row" style="gap:8px"><input class="input" data-q placeholder="책 제목 입력" enterkeyhint="search"><button class="btn" data-find style="flex:none">찾기</button></div>
    <div data-results style="margin-top:10px"></div>
    <div class="section-title">책 정보</div>
    <form data-form autocomplete="off">
      <label class="field"><span>제목 *</span><input class="input" name="title" required></label>
      <label class="field"><span>부제</span><input class="input" name="subtitle"></label>
      <div class="row field"><label><span class="lbl">저자</span><input class="input" name="authors"></label><label><span class="lbl">옮긴이</span><input class="input" name="translator"></label></div>
      <div class="row field"><label><span class="lbl">출판사</span><input class="input" name="publisher"></label><label><span class="lbl">총 쪽수</span><input class="input" name="pages" inputmode="numeric"></label></div>
      <div class="row field"><label><span class="lbl">상태</span><select class="select" name="status">${['reading', 'want', 'done'].map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${STATUS[s]}</option>`).join('')}</select></label>
        <label><span class="lbl">시작일</span><input class="input" type="date" name="startDate" value="${today()}"></label></div>
      <label class="field"><span>ISBN</span><input class="input" name="isbn" inputmode="numeric"></label>
      <label class="field"><span>태그</span><input class="input" name="tags" placeholder="예: 경영 품질 소설"></label>
    </form>`;
  ov.body.querySelectorAll('.row.field .lbl').forEach(s => { s.style.cssText = 'display:block;font-size:13px;font-weight:700;color:var(--ink-2);margin:0 2px 5px'; });
  const form = ov.body.querySelector('[data-form]');
  const F = name => form.elements[name];
  ov.foot.hidden = false;
  ov.foot.innerHTML = `<button class="btn primary" data-save>${icon('check')}서재에 넣기</button>`;

  // ── 표지 ──
  ov.body.querySelector('[data-cam]').onclick = async () => {
    const choice = await menuSheet('표지 사진', [
      { icon: 'camera', label: '카메라로 찍기', value: 'cam' },
      { icon: 'image', label: '앨범에서 고르기', value: 'alb' },
    ]);
    if (!choice) return;
    const f = await pickImage({ capture: choice === 'cam' });
    if (f) setCover(f);
  };

  async function setCover(f) {
    let bmp;
    try { bmp = await loadBitmap(f); } catch { toast('사진을 열 수 없습니다'); return; }
    const c = toCanvas(bmp, 900);
    st.coverBlob = await canvasToBlob(c, 'image/jpeg', 0.82);
    st.coverW = c.width; st.coverH = c.height;
    if (st.coverURL) URL.revokeObjectURL(st.coverURL);
    st.coverURL = URL.createObjectURL(st.coverBlob);
    const d = await photoDate(f);
    if (F('status').value !== 'want') F('startDate').value = d;
    const box = ov.body.querySelector('[data-cover]');
    box.hidden = false;
    box.innerHTML = `<div class="row" style="gap:14px;align-items:flex-start">
      <div class="cover lg" style="flex:none"><img src="${st.coverURL}" alt="표지"></div>
      <div style="flex:1;min-width:0"><b>표지 사진</b><p class="small muted" style="margin:4px 0 10px">시작일: ${esc(d)} (사진 찍은 날)</p>
      <button class="btn sm" data-recam>${icon('camera')}다시 찍기</button></div></div>`;
    box.querySelector('[data-recam]').onclick = ov.body.querySelector('[data-cam]').onclick;
    // 표지 글자 읽기
    const out = ov.body.querySelector('[data-ocr]');
    out.hidden = false;
    out.innerHTML = `<div class="section-title">표지에서 읽은 글자</div><p class="small muted">${icon('timer', 'i')} 읽는 중…</p>`;
    out.querySelector('svg').style.cssText = 'width:15px;height:15px;vertical-align:-3px';
    try {
      const big = toCanvas(bmp, 1600);
      const r = await recognize(big, { mode: 'cover' });
      showCoverText(r);
    } catch (e) {
      out.innerHTML = `<div class="section-title">표지에서 읽은 글자</div><p class="small muted">표지 글자를 읽지 못했습니다. 바코드 스캔이나 제목 검색을 써 주세요.</p>`;
    }
  }

  function showCoverText(r) {
    const out = ov.body.querySelector('[data-ocr]');
    // 글씨가 클수록 제목일 가능성이 높다
    const lines = r.lines
      .filter(l => l.text.replace(/[^0-9A-Za-z가-힣]/g, '').length >= 2)
      .map(l => ({ ...l, size: l.y1 - l.y0 }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    if (!lines.length) {
      out.innerHTML = `<div class="section-title">표지에서 읽은 글자</div><p class="small muted">읽힌 글자가 없습니다. 표지 글씨가 꾸민 서체이면 잘 안 읽힙니다 — 바코드를 찍어 주세요.</p>`;
      return;
    }
    const maxSize = lines[0].size;
    out.innerHTML = `<div class="section-title">표지에서 읽은 글자 <span class="small" style="font-weight:500">· 눌러서 칸에 넣기</span></div>
      <div class="ocr-chips">${lines.map((l, i) => `<button data-i="${i}" class="${l.size > maxSize * 0.7 ? 'big' : ''}">${esc(l.text)}</button>`).join('')}</div>`;
    out.querySelectorAll('[data-i]').forEach(b => {
      b.onclick = async () => {
        const t = lines[+b.dataset.i].text;
        const where = await menuSheet(`“${t.slice(0, 30)}”`, [
          { icon: 'book', label: '제목으로', value: 'title' },
          { icon: 'book', label: '부제로', value: 'subtitle' },
          { icon: 'user', label: '저자로', value: 'authors' },
          { icon: 'user', label: '옮긴이로', value: 'translator' },
          { icon: 'book', label: '출판사로', value: 'publisher' },
        ]);
        if (!where) return;
        F(where).value = where === 'authors' || where === 'translator' ? t.replace(/(지음|지은이|옮김|옮긴이|글|저|역)\s*$/, '').trim() : t;
      };
    });
    // 제목 칸이 비어 있으면 가장 큰 글씨를 임시 제목으로
    if (!F('title').value.trim()) {
      F('title').value = lines[0].text;
      F('title').dataset.fromCover = '1';
      const author = r.lines.find(l => /(지음|지은이|옮김|글\s|저\s|저$)/.test(l.text));
      if (author && !F('authors').value) F('authors').value = author.text.replace(/(지음|지은이|옮김|옮긴이)/g, '').trim();
      toast('표지에서 읽은 글자로 제목을 채웠습니다. 맞는지 확인해 주세요.', 3000);
    }
  }

  // ── 바코드 ──
  ov.body.querySelector('[data-scan]').onclick = async () => {
    const isbn = await scanISBN();
    if (isbn) fillByISBN(isbn);
  };

  async function fillByISBN(isbn) {
    F('isbn').value = isbn;
    const box = ov.body.querySelector('[data-api]');
    box.hidden = false;
    box.innerHTML = `<div class="card small" style="margin-top:12px">ISBN ${esc(isbn)} · 책 정보 찾는 중…</div>`;
    let res;
    try { res = await lookupISBN(isbn); } catch (e) { res = { book: null, errors: [e.message] }; }
    if (!res.book) {
      box.innerHTML = `<div class="card small" style="margin-top:12px">ISBN ${esc(isbn)}을 찾지 못했습니다.<br>
        <span class="muted">인터넷이 없거나, 아직 공개 DB에 없는 책입니다. 설정에서 <b>국립중앙도서관·카카오 키</b>를 넣으면 한국 책은 거의 다 찾습니다. 제목은 직접 입력하거나 표지 사진을 찍어 주세요.</span></div>`;
      return;
    }
    applyBook(res.book, true);
    box.innerHTML = `<div class="card small" style="margin-top:12px">${icon('check', 'i')} <b>${esc(res.book.title)}</b> 정보를 채웠습니다 <span class="muted">· ${esc(res.book.sources.join(', '))}</span></div>`;
    box.querySelector('svg').style.cssText = 'width:16px;height:16px;vertical-align:-3px;color:var(--accent)';
  }

  function applyBook(b, overwrite) {
    for (const k of ['title', 'subtitle', 'authors', 'translator', 'publisher', 'pages', 'isbn']) {
      if (b[k] && (overwrite || !F(k).value || (k === 'title' && F('title').dataset.fromCover))) F(k).value = b[k];
    }
    delete F('title').dataset.fromCover;
    book.pubDate = b.pubDate || book.pubDate;
    book.coverUrl = b.coverUrl || book.coverUrl;
    book.description = b.description || book.description;
    book.source = (b.sources || [b.source]).filter(Boolean).join(', ');
  }

  // ── 제목 검색 ──
  const doFind = async () => {
    const q = ov.body.querySelector('[data-q]').value.trim();
    const box = ov.body.querySelector('[data-results]');
    if (!q) return;
    box.innerHTML = '<p class="small muted">찾는 중…</p>';
    let r;
    try { r = await searchTitle(q); } catch (e) { r = { list: [], errors: [e.message] }; }
    if (!r.list.length) {
      box.innerHTML = `<p class="small muted">찾지 못했습니다.${r.hasKey ? '' : ' 설정에서 카카오·국립중앙도서관 키를 넣으면 한국 책 검색이 정확해집니다.'}</p>`;
      return;
    }
    box.innerHTML = r.list.map((b, i) => `<button class="result-item" data-i="${i}" type="button">
      <div class="cover ${b.coverUrl ? '' : 'ph'}" style="${b.coverUrl ? '' : `background:${phColor(b.title)}`}">${b.coverUrl ? `<img src="${esc(b.coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</div>
      <div style="min-width:0"><b>${esc(b.title)}</b><span>${esc([b.authors, b.publisher, b.pubDate?.slice(0, 4)].filter(Boolean).join(' · '))}</span><span>${esc(b.source)}</span></div></button>`).join('');
    box.querySelectorAll('[data-i]').forEach(btn => {
      btn.onclick = async () => {
        const b = r.list[+btn.dataset.i];
        applyBook({ ...b, sources: [b.source] }, true);
        box.innerHTML = `<p class="small" style="color:var(--accent)">“${esc(b.title)}” 정보를 채웠습니다.</p>`;
        if (b.isbn && !b.pages) {
          const more = await lookupISBN(b.isbn).catch(() => null);
          if (more?.book) applyBook(more.book, false);
        }
      };
    });
  };
  ov.body.querySelector('[data-find]').onclick = doFind;
  ov.body.querySelector('[data-q]').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); doFind(); } };

  // ── 저장 ──
  ov.foot.querySelector('[data-save]').onclick = async () => {
    const title = F('title').value.trim();
    if (!title) { toast('제목을 넣어 주세요'); F('title').focus(); return; }
    Object.assign(book, {
      title,
      subtitle: F('subtitle').value.trim(),
      authors: F('authors').value.trim(),
      translator: F('translator').value.trim(),
      publisher: F('publisher').value.trim(),
      pages: parseInt(F('pages').value, 10) || null,
      isbn: F('isbn').value.replace(/[^0-9X]/gi, ''),
      status: F('status').value,
      startDate: F('status').value === 'want' ? '' : (F('startDate').value || today()),
      tags: parseTags(F('tags').value),
    });
    if (book.status === 'done') { book.endDate = today(); book.currentPage = book.pages || 0; }
    if (st.coverBlob) book.coverId = await storePhoto(st.coverBlob, 'cover', st.coverW, st.coverH);
    await saveBook(book);
    toast('서재에 넣었습니다');
    ov.close();
    navigate('#/book/' + book.id);
  };

  return ov;
}

export { askISBN };
