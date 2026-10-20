// 독서 통계·목표: 연간 목표, 핵심 수치, 월별 막대, 독서 달력, 태그
import { esc, icon, sheet, toast, today, ymd, fmtMinutes, daysBetween } from '../util.js';
import { db } from '../db.js';
import { allBooks, activityByDay, streaks, yearOf, allTags } from '../store.js';

let year = new Date().getFullYear();
let metric = 'books';
let calMonth = null; // 'YYYY-MM'

const METRICS = { books: ['완독 권수', '권'], pages: ['읽은 쪽수', '쪽'], minutes: ['독서 시간', '분'] };

export async function render(ctx) {
  ctx.setTop({ title: '통계' });
  const [books, sessions, quotes, act, goal, tags] = await Promise.all([
    allBooks(), db.all('sessions'), db.all('quotes'), activityByDay(), db.getKV('yearGoal', 24), allTags(),
  ]);
  const done = books.filter(b => b.status === 'done' && yearOf(b.endDate) === year);
  const ses = sessions.filter(s => yearOf(s.date) === year);
  const pages = ses.reduce((t, s) => t + Math.max(0, (s.toPage || 0) - (s.fromPage || 0)), 0);
  const minutes = ses.reduce((t, s) => t + (s.minutes || 0), 0);
  const qCount = quotes.filter(q => new Date(q.createdAt).getFullYear() === year).length;
  const st = streaks(act);
  const rated = done.filter(b => b.rating);
  const avgRating = rated.length ? (rated.reduce((t, b) => t + b.rating, 0) / rated.length).toFixed(1) : '–';
  const avgDays = done.length ? Math.round(done.reduce((t, b) => t + Math.max(1, daysBetween(b.startDate || b.endDate, b.endDate) + 1), 0) / done.length) : null;

  // 월별 값
  const monthly = Array.from({ length: 12 }, () => ({ books: 0, pages: 0, minutes: 0 }));
  for (const b of done) monthly[+b.endDate.slice(5, 7) - 1].books++;
  for (const s of ses) {
    const m = +s.date.slice(5, 7) - 1;
    monthly[m].pages += Math.max(0, (s.toPage || 0) - (s.fromPage || 0));
    monthly[m].minutes += s.minutes || 0;
  }

  // 목표 페이스
  const now = new Date();
  const isThisYear = year === now.getFullYear();
  const dayOfYear = isThisYear ? daysBetween(`${year}-01-01`, today()) + 1 : 365;
  const expected = Math.round(goal * dayOfYear / 365 * 10) / 10;
  const remainBooks = Math.max(0, goal - done.length);
  const remainMonths = isThisYear ? 12 - now.getMonth() : 0;
  let pace = '';
  if (isThisYear) {
    pace = done.length >= goal ? '목표를 달성했습니다! 🎉'
      : done.length >= expected ? `계획보다 앞서고 있어요 (지금쯤 ${expected}권 페이스)`
        : `남은 ${remainMonths}개월 동안 월 ${(remainBooks / Math.max(1, remainMonths)).toFixed(1)}권이면 달성`;
  }

  if (!calMonth || +calMonth.slice(0, 4) !== year) calMonth = isThisYear ? today().slice(0, 7) : `${year}-12`;

  ctx.el.innerHTML = `
    <div class="year-nav">
      <button class="icon-btn" data-y="-1" aria-label="이전 해">${icon('back')}</button>
      <strong>${year}년</strong>
      <button class="icon-btn" data-y="1" aria-label="다음 해" ${year >= now.getFullYear() ? 'disabled style="opacity:.3"' : ''}>${icon('chevron')}</button>
    </div>
    <button class="card goal-hero" data-goal style="width:100%;text-align:left">
      ${ring(done.length, goal)}
      <div><div class="num">${done.length}<small> / ${goal}권</small></div>
      <div class="desc">${esc(pace || `${year}년에 ${done.length}권을 완독했습니다`)}</div>
      <div class="small muted" style="margin-top:4px">눌러서 목표 바꾸기</div></div>
    </button>
    <div class="section-title">한눈에</div>
    <div class="tiles">
      ${tile('완독', done.length, '권')}${tile('읽은 쪽수', pages.toLocaleString(), '쪽')}
      ${tile('독서 시간', fmtMinutes(minutes), '')}${tile('담은 문장', qCount, '개')}
      ${tile('연속 독서', st.current, '일', `최장 ${st.longest}일`)}${tile('평균 별점', avgRating, '', avgDays ? `완독까지 평균 ${avgDays}일` : '')}
    </div>
    <div class="section-title">월별</div>
    <div class="card chart-card">
      <div class="chips" style="margin:0 4px 8px">${Object.entries(METRICS).map(([k, [l]]) => `<button class="chip ${metric === k ? 'on' : ''}" data-m="${k}">${l}</button>`).join('')}</div>
      ${barChart(monthly.map(m => m[metric]), METRICS[metric][1])}
      <div class="chart-tip" data-tip>막대를 누르면 값이 보입니다</div>
      <details style="margin:6px 4px 0"><summary class="small muted">숫자로 보기</summary>
        <table class="small" style="width:100%;margin-top:6px;border-collapse:collapse;font-variant-numeric:tabular-nums">
          <tr class="muted"><td>월</td><td style="text-align:right">권</td><td style="text-align:right">쪽</td><td style="text-align:right">시간</td></tr>
          ${monthly.map((m, i) => `<tr><td>${i + 1}월</td><td style="text-align:right">${m.books}</td><td style="text-align:right">${m.pages}</td><td style="text-align:right">${fmtMinutes(m.minutes)}</td></tr>`).join('')}
        </table></details>
    </div>
    <div class="section-title">독서 달력</div>
    <div class="card" style="padding:12px">${calendar(calMonth, act)}</div>
    ${tags.length ? `<div class="section-title">많이 쓴 태그</div><div class="card">${tagBars(tags.slice(0, 6))}</div>` : ''}
    ${done.length ? `<div class="section-title">${year}년 완독한 책</div><div class="card" style="padding:4px 0">${done.sort((a, b) => a.endDate.localeCompare(b.endDate)).map(b => `<a class="set-item" href="#/book/${esc(b.id)}"><span class="t"><b>${esc(b.title)}</b><span>${b.endDate.slice(5).replace('-', '.')} 완독${b.rating ? ` · ★ ${b.rating}` : ''}</span></span>${icon('chevron')}</a>`).join('')}</div>` : ''}`;

  ctx.el.querySelectorAll('[data-y]').forEach(b => { b.onclick = () => { if (b.disabled) return; year += +b.dataset.y; ctx.rerender(); }; });
  ctx.el.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => { metric = b.dataset.m; ctx.rerender(); }; });
  ctx.el.querySelector('[data-goal]').onclick = async () => {
    const v = await sheet({
      title: `${year}년 목표 권수`,
      body: `<input class="input" data-g inputmode="numeric" value="${goal}" style="font-size:24px;font-weight:800;text-align:center">
        <div class="chips" style="margin-top:12px;justify-content:center">${[12, 24, 36, 52].map(n => `<button class="chip" data-n="${n}">${n}권</button>`).join('')}</div>
        <p class="hint" style="text-align:center">월 2권이면 24권, 주 1권이면 52권</p>`,
      actions: [{ label: '취소', value: null }, { label: '저장', cls: 'primary', onClick: el => parseInt(el.querySelector('[data-g]').value, 10) }],
      onMount: el => el.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { el.querySelector('[data-g]').value = b.dataset.n; }; }),
    });
    if (v && v > 0) { await db.setKV('yearGoal', v); toast('목표를 바꿨습니다'); ctx.rerender(); }
  };
  // 막대 누르기 → 값
  const tip = ctx.el.querySelector('[data-tip]');
  ctx.el.querySelectorAll('[data-bar]').forEach(r => {
    const show = () => {
      const i = +r.dataset.bar;
      const v = monthly[i][metric];
      tip.textContent = `${i + 1}월 · ${metric === 'minutes' ? fmtMinutes(v) : v.toLocaleString() + METRICS[metric][1]}`;
      ctx.el.querySelectorAll('[data-barfill]').forEach(f => { f.style.opacity = f.dataset.barfill === r.dataset.bar ? '1' : '.45'; });
    };
    r.addEventListener('pointerenter', show);
    r.addEventListener('click', show);
  });
  ctx.el.querySelector('[data-chart]')?.addEventListener('pointerleave', () => {
    ctx.el.querySelectorAll('[data-barfill]').forEach(f => { f.style.opacity = '1'; });
  });
  // 달력
  ctx.el.querySelectorAll('[data-cm]').forEach(b => {
    b.onclick = () => {
      const [y, m] = calMonth.split('-').map(Number);
      const d = new Date(y, m - 1 + +b.dataset.cm, 1);
      if (d.getFullYear() !== year) { year = d.getFullYear(); }
      calMonth = ymd(d).slice(0, 7);
      ctx.rerender();
    };
  });
  const calTip = ctx.el.querySelector('[data-caltip]');
  ctx.el.querySelectorAll('[data-day]').forEach(b => {
    b.onclick = () => {
      const e = act.get(b.dataset.day);
      const d = b.dataset.day.slice(5).replace('-', '월 ') + '일';
      calTip.textContent = e ? `${d} · ${[e.minutes && fmtMinutes(e.minutes), e.pages && e.pages + '쪽', e.quotes && '문장 ' + e.quotes, e.notes && '메모 ' + e.notes].filter(Boolean).join(' · ')}` : `${d} · 기록 없음`;
    };
  });
}

function tile(k, v, unit, sub = '') {
  return `<div class="card tile"><div class="k">${k}</div><div class="v">${esc(v)}${unit ? `<small>${unit}</small>` : ''}</div>${sub ? `<div class="small muted">${esc(sub)}</div>` : ''}</div>`;
}

function ring(v, goal) {
  const r = 34, c = 2 * Math.PI * r, p = goal ? Math.min(1, v / goal) : 0;
  return `<svg class="ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--seq-0)" stroke-width="9"/>
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 42 42)"/>
    <text x="42" y="47" text-anchor="middle" font-size="15" font-weight="800" fill="var(--ink)">${Math.round(p * 100)}%</text></svg>`;
}

// 단일 계열 막대: 범례 없음(제목이 계열 이름), 최댓값만 직접 표기, 위쪽만 4px 둥글게
function barChart(vals, unit) {
  const W = 340, H = 170, padL = 28, padB = 22, padT = 18;
  const max = Math.max(...vals, 0);
  const niceMax = max <= 4 ? Math.max(1, max) : Math.ceil(max / niceStep(max)) * niceStep(max);
  const ih = H - padB - padT, iw = W - padL - 4;
  const bw = iw / 12;
  const barW = Math.max(6, bw * 0.56);
  const y = v => padT + ih - (v / niceMax) * ih;
  // 작은 정수(권수)는 0.5 같은 눈금이 생기지 않게 정수 눈금만
  const ticks = niceMax <= 4 ? Array.from({ length: niceMax + 1 }, (_, i) => i) : [0, niceMax / 2, niceMax].map(v => Math.round(v * 10) / 10);
  const maxI = vals.indexOf(max);
  const label = v => unit === '분' ? fmtMinutes(v) : v.toLocaleString();
  return `<svg viewBox="0 0 ${W} ${H}" data-chart role="img" aria-label="월별 ${unit} 막대 그래프: ${vals.map((v, i) => `${i + 1}월 ${v}`).join(', ')}">
    ${ticks.map(t => `<line x1="${padL}" x2="${W - 4}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1" ${t ? 'stroke-dasharray="2 3"' : ''}/>
      <text x="${padL - 6}" y="${y(t) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${unit === '분' && t >= 60 ? Math.round(t / 60) + 'h' : t}</text>`).join('')}
    ${vals.map((v, i) => {
      const x = padL + bw * i + (bw - barW) / 2;
      const h = Math.max(0, (v / niceMax) * ih);
      const r = Math.min(4, h, barW / 2);
      const top = padT + ih - h;
      const path = h > 0 ? `M${x},${padT + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${padT + ih} Z` : '';
      return `<g data-bar="${i}" style="cursor:pointer">
        <rect x="${padL + bw * i}" y="${padT}" width="${bw}" height="${ih + padB}" fill="transparent"/>
        ${path ? `<path d="${path}" fill="var(--seq-3)" data-barfill="${i}"/>` : ''}
        ${i === maxI && max > 0 ? `<text x="${x + barW / 2}" y="${top - 5}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink-2)">${label(v)}</text>` : ''}
        <text x="${padL + bw * i + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--muted)">${i + 1}</text></g>`;
    }).join('')}
  </svg>`;
}
function niceStep(max) {
  const raw = max / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1, 2, 5, 10].map(m => m * p).find(s => s >= raw) || p * 10;
}

function level(e) {
  if (!e) return 0;
  const score = (e.minutes || 0) + (e.pages || 0) * 1.5 + (e.quotes || 0) * 10 + (e.notes || 0) * 10;
  if (score <= 0) return 1;
  return score < 20 ? 1 : score < 45 ? 2 : score < 90 ? 3 : 4;
}

function calendar(ym, act) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const lead = first.getDay();
  const t = today();
  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<div class="day blank"></div>';
  let active = 0;
  for (let d = 1; d <= days; d++) {
    const key = `${ym}-${String(d).padStart(2, '0')}`;
    const lv = level(act.get(key));
    if (lv) active++;
    cells += `<button class="day ${lv ? 'l' + lv : ''} ${key === t ? 'today' : ''}" data-day="${key}" aria-label="${d}일${lv ? ' 독서함' : ''}">${d}</button>`;
  }
  return `<div class="row" style="align-items:center;margin-bottom:8px">
      <button class="icon-btn" data-cm="-1" style="flex:none" aria-label="이전 달">${icon('back')}</button>
      <strong style="text-align:center">${y}년 ${m}월 <span class="muted small" style="font-weight:500">· ${active}일 읽음</span></strong>
      <button class="icon-btn" data-cm="1" aria-label="다음 달" ${ym >= t.slice(0, 7) ? 'disabled style="opacity:.3;flex:none"' : 'style="flex:none"'}>${icon('chevron')}</button></div>
    <div class="cal">${['일', '월', '화', '수', '목', '금', '토'].map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div>
    <div class="row" style="align-items:center;margin-top:8px"><span class="chart-tip" data-caltip style="padding:0">날짜를 누르면 기록이 보입니다</span>
    <span class="legend-seq" style="flex:none;margin:0">적음 <i style="background:var(--seq-1)"></i><i style="background:var(--seq-2)"></i><i style="background:var(--seq-3)"></i><i style="background:var(--seq-4)"></i> 많음</span></div>`;
}

function tagBars(tags) {
  const max = tags[0][1];
  return `<div class="bar-list">${tags.map(([t, n]) => `<a class="r" href="#/quotes?tag=${encodeURIComponent(t)}" style="text-decoration:none;color:inherit"><span class="l">#${esc(t)}</span><span><span class="b" style="display:block;width:${Math.max(4, n / max * 100)}%"></span></span><span class="n">${n}</span></a>`).join('')}</div>`;
}
