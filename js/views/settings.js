// 설정: 책 정보 키, 글자 인식 준비, 내보내기, 백업·복원, 저장 공간, 화면
import { esc, icon, sheet, menuSheet, confirmSheet, toast, fmtShort, ymd } from '../util.js';
import { db, STORES, changed, requestPersist } from '../db.js';
import { testKey } from '../bookapi.js';
import { warmup, engineName } from '../ocr.js';
import { isNative } from '../native.js';
import { exportXlsx, exportText, backup, restore } from '../export.js';
import { pickImage } from '../media.js';

export const APP_VERSION = '1.0.0';

export async function render(ctx) {
  ctx.setTop({ title: '설정' });
  const [nlKey, kakaoKey, googleKey, theme, lastBackup, goal, ocrLang] = await Promise.all([
    db.getKV('nlKey', ''), db.getKV('kakaoKey', ''), db.getKV('googleKey', ''), db.getKV('theme', 'auto'), db.getKV('lastBackup', 0), db.getKV('yearGoal', 24),
    db.getKV('ocrLang', 'kor'),
  ]);
  let est = null, persisted = false;
  try { est = await navigator.storage?.estimate?.(); persisted = await navigator.storage?.persisted?.(); } catch { /* 지원 안 함 */ }
  const mb = b => (b / 1024 / 1024).toFixed(1) + 'MB';
  const keyRow = (k, v, name, help) => `
    <div class="set-item" style="flex-wrap:wrap">${icon('key')}<span class="t"><b>${name}</b><span>${help}</span></span>
      <div class="row" style="flex:1 0 100%;gap:8px;margin-top:8px"><input class="input" data-key="${k}" value="${esc(v)}" placeholder="인증키 붙여넣기" autocomplete="off" spellcheck="false" style="font-size:14px">
      <button class="btn sm" data-test="${k}" style="flex:none">확인</button></div></div>`;

  ctx.el.innerHTML = `
    <div class="section-title" style="margin-top:6px">책 정보 찾기</div>
    <div class="card set-list" style="padding:0">
      ${keyRow('nl', nlKey, '국립중앙도서관 ISBN 키', '한국 책 서지·쪽수가 가장 정확합니다 (무료)')}
      ${keyRow('kakao', kakaoKey, '카카오 책 검색 REST 키', '제목 검색·표지 이미지 (무료)')}
      ${keyRow('google', googleKey, 'Google Books 키 (선택)', '없어도 됩니다. 해외 책 보조용')}
      <div class="set-item"><span class="t"><span>키가 없어도 Open Library로 일부 책은 찾아집니다. 키 받는 법: 국립중앙도서관 <a href="https://www.nl.go.kr/seoji/" target="_blank" rel="noopener">ISBN 서지정보 Open API</a> 인증키 신청 · 카카오 <a href="https://developers.kakao.com/" target="_blank" rel="noopener">개발자 사이트</a>에서 앱 만들기 → REST API 키 복사. 키는 이 폰에만 저장됩니다.</span></span></div>
    </div>

    <div class="section-title">글자 인식</div>
    <div class="card set-list" style="padding:0">
      <div class="set-item">${icon('camera')}<span class="t"><b>${esc(engineName())}</b><span>사진은 폰 밖으로 나가지 않습니다</span></span></div>
      ${isNative ? '' : `<div class="set-item" style="flex-wrap:wrap">${icon('book')}<span class="t"><b>책 언어</b><span>한국어 책은 ‘한국어’가 가장 정확합니다</span></span>
        <div class="chips" style="flex:1 0 100%;margin-top:8px">${[['kor', '한국어'], ['kor+eng', '한국어+영어'], ['eng', '영어 원서']].map(([k, l]) => `<button class="chip ${ocrLang === k ? 'on' : ''}" data-lang="${k}">${l}</button>`).join('')}</div></div>
      <button class="set-item" data-ocr>${icon('download')}<span class="t"><b>한국어 인식 데이터 미리 받기</b><span data-ocrst>처음 한 번 받아 두면 인터넷 없이도 인식됩니다 (약 5MB)</span></span></button>`}
    </div>

    <div class="section-title">독서 목표</div>
    <div class="card set-list" style="padding:0">
      <button class="set-item" data-goal>${icon('target')}<span class="t"><b>올해 목표 ${goal}권</b><span>통계 화면에서도 바꿀 수 있습니다</span></span>${icon('chevron')}</button>
    </div>

    <div class="section-title">내보내기</div>
    <div class="card set-list" style="padding:0">
      <button class="set-item" data-x="xlsx">${icon('download')}<span class="t"><b>엑셀로 내보내기 (.xlsx)</b><span>책목록·문장·느낀점·메모·독서기록 5개 시트</span></span></button>
      <button class="set-item" data-x="txt">${icon('note')}<span class="t"><b>텍스트로 내보내기 (.txt)</b><span>책별로 문장·느낀점을 읽기 좋게 정리</span></span></button>
    </div>

    <div class="section-title">백업 · 복원</div>
    <div class="card set-list" style="padding:0">
      <button class="set-item" data-x="backup">${icon('db')}<span class="t"><b>백업 파일 만들기</b><span>${lastBackup ? `마지막 백업 ${fmtShort(ymd(new Date(lastBackup)))}` : '아직 백업한 적이 없습니다'} · 사진 포함</span></span></button>
      <button class="set-item" data-x="backup-lite">${icon('db')}<span class="t"><b>가벼운 백업 (사진 빼고)</b><span>카톡으로 보내기 좋은 크기</span></span></button>
      <button class="set-item" data-x="restore">${icon('upload')}<span class="t"><b>백업에서 되살리기</b><span>폰을 바꿨을 때 · 웹앱↔앱 사이 옮길 때</span></span></button>
      <div class="set-item"><span class="t"><span>기록은 이 폰의 이 앱 안에만 있습니다. 앱을 지우거나 브라우저 데이터를 지우면 사라지니, 한 달에 한 번은 백업 파일을 구글 드라이브나 카톡 ‘나와의 채팅’에 보관해 두세요.</span></span></div>
    </div>

    <div class="section-title">저장 공간</div>
    <div class="card set-list" style="padding:0">
      <div class="set-item">${icon('db')}<span class="t"><b>${est ? `${mb(est.usage || 0)} 사용 중` : '사용량 확인 불가'}</b><span>${persisted ? '영구 저장 켜짐 — 공간이 부족해도 지워지지 않습니다' : '영구 저장 꺼짐'}</span></span>
        ${persisted ? '<span class="badge-ok">켜짐</span>' : '<button class="btn sm" data-persist style="flex:none">켜기</button>'}</div>
    </div>

    <div class="section-title">화면</div>
    <div class="card" style="padding:12px 14px"><div class="chips">${[['auto', '폰 설정 따르기'], ['light', '밝게'], ['dark', '어둡게']].map(([k, l]) => `<button class="chip ${theme === k ? 'on' : ''}" data-theme="${k}">${l}</button>`).join('')}</div></div>

    <div class="section-title">앱 정보</div>
    <div class="card set-list" style="padding:0">
      <div class="set-item">${icon('info')}<span class="t"><b>책갈피 ${APP_VERSION} · ${isNative ? '안드로이드 앱(APK)' : '웹앱'}</b><span>클로드·외부 서버 연결 없이 폰에서만 동작합니다. 인터넷은 책 정보 검색에만 씁니다.</span></span></div>
      <button class="set-item" data-wipe style="color:var(--danger)">${icon('trash')}<span class="t"><b>모든 기록 지우기</b><span>되돌릴 수 없습니다. 먼저 백업하세요.</span></span></button>
    </div>`;

  ctx.el.querySelectorAll('.set-item > svg:first-child').forEach(s => { s.style.color = 'var(--ink-2)'; });

  // 키 저장·확인
  ctx.el.querySelectorAll('[data-key]').forEach(inp => {
    inp.onchange = async () => { await db.setKV(inp.dataset.key + 'Key', inp.value.trim()); toast('저장했습니다'); };
  });
  ctx.el.querySelectorAll('[data-test]').forEach(b => {
    b.onclick = async () => {
      const k = b.dataset.test;
      const v = ctx.el.querySelector(`[data-key="${k}"]`).value.trim();
      await db.setKV(k + 'Key', v);
      if (!v) { toast('키를 지웠습니다'); return; }
      b.disabled = true; b.textContent = '확인 중';
      try { toast((await testKey(k, v)) ? '키가 정상입니다 ✓' : '응답은 왔지만 책을 찾지 못했습니다', 2600); }
      catch (e) { toast('키 확인 실패: ' + (e.message || e), 3200); }
      finally { b.disabled = false; b.textContent = '확인'; }
    };
  });

  ctx.el.querySelector('[data-ocr]')?.addEventListener('click', async () => {
    const st = ctx.el.querySelector('[data-ocrst]');
    try {
      await warmup((m, p) => { st.textContent = `${m}… ${Math.round((p || 0) * 100)}%`; });
      st.textContent = '준비됐습니다 ✓ 이제 인터넷 없이도 인식됩니다';
    } catch (e) { st.textContent = '받지 못했습니다: ' + (e.message || e); }
  });

  ctx.el.querySelectorAll('[data-lang]').forEach(b => {
    b.onclick = async () => { await db.setKV('ocrLang', b.dataset.lang); toast('글자 인식 언어를 바꿨습니다'); ctx.rerender(); };
  });

  ctx.el.querySelector('[data-goal]').onclick = () => { location.hash = '#/stats'; };

  ctx.el.querySelectorAll('[data-x]').forEach(b => {
    b.onclick = async () => {
      const x = b.dataset.x;
      try {
        if (x === 'xlsx') { toast('엑셀을 만드는 중…'); await exportXlsx(); }
        else if (x === 'txt') await exportText();
        else if (x === 'backup' || x === 'backup-lite') { toast('백업 파일을 만드는 중…'); await backup({ withPhotos: x === 'backup' }); ctx.rerender(); }
        else if (x === 'restore') await doRestore(ctx);
      } catch (e) { console.error(e); toast('실패: ' + (e.message || e), 3200); }
    };
  });

  ctx.el.querySelector('[data-persist]')?.addEventListener('click', async () => {
    const ok = await requestPersist();
    toast(ok ? '영구 저장을 켰습니다' : '브라우저가 거절했습니다. 홈 화면에 앱으로 설치하면 켜지는 경우가 많습니다.', 3200);
    ctx.rerender();
  });

  ctx.el.querySelectorAll('[data-theme]').forEach(b => {
    b.onclick = async () => { await db.setKV('theme', b.dataset.theme); applyTheme(b.dataset.theme); ctx.rerender(); };
  });

  ctx.el.querySelector('[data-wipe]').onclick = async () => {
    if (!(await confirmSheet('정말 모든 책·문장·느낀점·기록·사진을 지울까요?', '모두 지우기', true))) return;
    if (!(await confirmSheet('한 번 더 확인합니다. 되돌릴 수 없습니다.', '지우기', true))) return;
    for (const s of STORES) if (s !== 'kv') await db.clear(s);
    await db.setKV('timer', null);
    changed('all');
    toast('모두 지웠습니다');
  };
}

async function doRestore(ctx) {
  const f = await new Promise(res => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.json,application/json';
    i.onchange = () => res(i.files?.[0] || null);
    i.addEventListener('cancel', () => res(null));
    i.click();
  });
  if (!f) return;
  const mode = await menuSheet('어떻게 되살릴까요?', [
    { icon: 'plus', label: '합치기 — 지금 기록은 두고 백업 내용을 더하기', value: 'merge' },
    { icon: 'rotate', label: '바꾸기 — 지금 기록을 지우고 백업으로 덮기', value: 'replace', danger: true },
  ]);
  if (!mode) return;
  if (mode === 'replace' && !(await confirmSheet('지금 기록이 모두 지워집니다. 계속할까요?', '바꾸기', true))) return;
  const n = await restore(f, mode);
  toast(`${n}개 항목을 되살렸습니다`);
  const theme = await db.getKV('theme', 'auto');
  applyTheme(theme);
  ctx.rerender();
}

export function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#14120E' : '#F5F0E6'));
}

export { pickImage };
