(function () {
  'use strict';
  const A = window.ANCHORS, EV = window.EVENTS, SRC = window.SRC, B = window.BUCKETS;
  const $ = (s, r) => (r || document).querySelector(s);
  const fmtP = p => '$' + p.toFixed(2);
  const fmtC = c => c >= 1e12 ? '$' + (c / 1e12).toFixed(2) + 'T' : '$' + Math.round(c / 1e9) + 'B';
  const pct = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';
  const L = { near: { bull: Math.log(A.b3m / A.spot), neutral: Math.log(A.n3m / A.spot) }, long: { bull: Math.log(A.b3y / A.b3m), neutral: Math.log(A.n3y / A.n3m) } };
  const srcLinks = keys => (keys || []).map(k => SRC[k] ? '<a href="' + SRC[k].u + '" target="_blank" rel="noopener">' + SRC[k].t + '</a>' : '').join(' · ');
  let PR = { spcx: { price: 144.75, shares: 13.579e9 }, tsla: { marketCap: 1.493e12 }, asOf: '2026-10-22 close (America/Chicago)' };

  /* ---------- prices (local data file; embedded fallback for file://) ---------- */
  function applyPrices() {
    A.spot = PR.spcx.price; A.shares = PR.spcx.shares;
    $('#heroPrice').textContent = fmtP(A.spot); $('#heroCap').textContent = fmtC(A.spot * A.shares);
  }
  if (location.protocol === 'file:') { applyPrices(); } // browsers block fetch() on file://; embedded values mirror data/prices.json
  else fetch('data/prices.json').then(r => r.ok ? r.json() : null).then(j => { if (j) PR = j; }).catch(() => {}).finally(() => { applyPrices(); renderGame(); });

  /* ---------- orbital add-on (scenario) ---------- */
  const ORB = { gw: 2, rate: 7.3, mult: 5.5 }; const ORBW = { bull: 1, neutral: 0.25, miss: 0 };
  const orbValue = () => ORB.gw * ORB.rate * ORB.mult * 1e9; // $ value of 2030 orbital compute
  /* ---------- scenario math ---------- */
  function evalPath(picks) { // picks: {id: 'bull'|'neutral'|'miss'}
    let logSum = 0, shares = A.shares; const missed = {}; const aiHits = [];
    EV.forEach(e => {
      const p = picks[e.id]; if (!p) return;
      if (p === 'miss') { missed[e.bucket] = true; if (e.bucket === 'ai') aiHits.push(e); }
      else logSum += e.w * L[e.group][p];
      if (e.group === 'long') shares += e.w * (A.sh3y[p] - 13.579e9);
    });
    const hits = [];
    if (missed.ai) {
      const ids = aiHits.map(e => e.id);
      if (ids.includes('C3') && (ids.includes('C1') || ids.includes('C5'))) hits.push(['ai', B.ai.both, 'both contracts lost / re-let at reset prices']);
      else { const worst = aiHits.reduce((m, e) => e.missHit < m.missHit ? e : m); hits.push(['ai', worst.missHit, worst.title]); }
    }
    if (missed.capital) { hits.push(['capital', B.capital.hit, 'raise / supply stress']); shares += A.shRaise - 13.579e9; }
    if (missed.conn) hits.push(['conn', B.conn.hit, 'Starlink derating']);
    let core = A.spot * Math.exp(logSum); hits.forEach(h => core *= (1 + h[1]));
    const g5 = picks.G5, ow = g5 ? ORBW[g5] : 0, orbPS = ow * orbValue() / shares, price = core + orbPS;
    return { price, core, orbPS, orbW: ow, cap: price * shares, shares, missed, hits, logSum };
  }
  function standalone(e, p) { // card display: one event alone, from spot
    let price;
    if (p === 'miss') price = e.missHit != null ? A.spot * (1 + e.missHit) : A.spot * (1 + B[e.bucket].hit);
    else price = A.spot * Math.exp(e.w * L[e.group][p]);
    if (e.id === 'G5') price += ORBW[p] * orbValue() / A.shares;
    return { price, cap: price * A.shares, d: price / A.spot - 1, dcap: (price - A.spot) * A.shares };
  }
  function ending(picks, r) {
    const m = r.missed, tri = ['ai', 'starship', 'capital'].filter(k => m[k]).length;
    const vals = Object.values(picks), nb = vals.filter(v => v === 'bull').length, nm = vals.filter(v => v === 'miss').length;
    if (tri === 3) return 'explode';
    if (tri === 2) return 'splash';
    if (typeof elonActive === 'function' && elonUsed && elonActive() && ORDER.every(e => picks[e.id] === 'bull')) return 'mars'; // Mars only via Elon's plan
    if (!m.starship && nb >= 11 && nm <= 1) return 'launcher'; // best custom paths: Moon base + mass driver
    if (picks.G4 !== 'miss' && nm <= 3) return 'moon'; // middling paths (incl. Base): Moon base
    return 'orbit';
  }
  window.SPCX = { evalPath, ending, standalone, ORB };

  /* ---------- hero animation ---------- */
  (function hero() {
    const c = $('#heroCanvas'), ctx = c.getContext('2d'); const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, dpr; const parts = [], smoke = [];
    const r = Scenes.rng(99), starL = Array.from({ length: 320 }, () => ({ x: r(), y: r() * 3, s: r() * 1.6 + .2, ph: r() * 6 }));
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; }
    size(); addEventListener('resize', size);
    const CYCLE = 15000; let t0 = performance.now();
    function frame(now) {
      const t = reduce ? 1500 : (now - t0) % CYCLE; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ign = 2200, tt = Math.max(0, t - ign) / 1000; const rise = tt > 0.6 ? 0.5 * 38 * Math.pow(tt - 0.6, 2.1) : 0;
      const RX = w > 900 ? w * 0.74 : w * 0.5; const padY = h * 0.84, H = Math.min(h * 0.62, w * 1.1); let rocketY = padY - rise, cam = 0;
      if (rocketY < h * 0.55) { cam = h * 0.55 - rocketY; rocketY = h * 0.55; }
      const g = ctx.createLinearGradient(0, 0, 0, h); const k = Math.min(1, cam / (h * 3));
      g.addColorStop(0, '#01030a'); g.addColorStop(1, k > 0.5 ? '#02040c' : 'rgb(' + Math.round(40 - 34 * k) + ',' + Math.round(20 - 14 * k) + ',' + Math.round(52 - 40 * k) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      starL.forEach(s => { const y = ((s.y * h + cam * 0.15) % (h * 1.2)); const a = .3 + .7 * Math.abs(Math.sin(now * .0012 + s.ph)); ctx.fillStyle = 'rgba(255,255,255,' + (a * .8).toFixed(2) + ')'; ctx.fillRect(s.x * w, y, s.s, s.s); });
      const gy = padY + cam;
      if (gy < h + 200) {
        Scenes.glow(ctx, RX, gy, w * 0.6, 'rgba(255,130,50,' + (t > ign ? 0.35 : 0.12) + ')');
        ctx.fillStyle = '#07080b'; ctx.fillRect(0, gy, w, h);
        ctx.fillStyle = '#0b0d11'; for (let i = 0; i < 12; i++) ctx.fillRect(w * (i / 12) + 10, gy - 6 - (i % 3) * 4, 24, 6 + (i % 3) * 4);
        Scenes.tower(ctx, RX + H * 0.12, gy, H * 1.02);
      }
      // exhaust
      if (t > ign && !reduce) {
        const n = 14; for (let i = 0; i < n; i++) parts.push({ x: RX + (Math.random() - .5) * H * 0.05, y: rocketY, vx: (Math.random() - .5) * 1.2, vy: 6 + Math.random() * 6, life: 1 });
        if (gy < h + 50) for (let i = 0; i < 3; i++) smoke.push({ x: RX + (Math.random() - .5) * 30, y: gy - 4, vx: (Math.random() - .5) * 7, vy: -Math.random() * 1.5, r: 10 + Math.random() * 20, life: 1 });
      }
      for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.x += s.vx; s.y += s.vy + (cam ? 0 : 0); s.r += 0.6; s.life -= 0.008; if (s.life <= 0) { smoke.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(200,190,185,' + (s.life * 0.13).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y + cam * 0.0, s.r, 0, 6.28); ctx.fill(); }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.045; if (p.life <= 0) { parts.splice(i, 1); continue; }
        const col = p.life > .7 ? '255,245,220' : p.life > .4 ? '255,170,70' : '255,90,30'; ctx.fillStyle = 'rgba(' + col + ',' + (p.life * .55).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + (1 - p.life) * 9, 0, 6.28); ctx.fill(); }
      if (t > ign) { Scenes.glow(ctx, RX, rocketY + 6, H * 0.12, 'rgba(255,220,170,.9)'); }
      ctx.globalCompositeOperation = 'source-over';
      Scenes.starship(ctx, RX, rocketY, H, 'stack');
      if (t < ign && !reduce) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('T-' + Math.ceil((ign - t) / 1000) + ' · illustration', RX, padY + 28); }
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- modal cards ---------- */
  const modal = $('#modal');
  function openCard(html, theme, opts) {
    $('#mBody').innerHTML = html; modal.hidden = false; document.body.classList.add('noscroll');
    requestAnimationFrame(() => { paintScene($('.mbg', modal), theme, opts, true); const pv = $('.mprev canvas', modal);
      if (pv) { paintScene(pv, theme, opts, true); modal.querySelectorAll('.oplay').forEach(b => b.onclick = () => { modal.querySelectorAll('.oplay').forEach(x => x.classList.remove('on')); b.classList.add('on'); Anim.outcome(pv, theme, b.dataset.p, window.SPCX_ANIM_MS || 2200); pv.scrollIntoView({ block: 'nearest' }); }); } });
    $('.mclose', modal).focus();
  }
  function closeCard() { modal.hidden = true; document.body.classList.remove('noscroll'); }
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('mclose')) closeCard(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeCard(); });

  function outcomeBlock(e, p) {
    const s = standalone(e, p), lab = { miss: 'MISS', neutral: 'NEUTRAL', bull: 'BULL' }[p];
    let how = p === 'miss' ? (e.missHit != null ? 'Downside estimate, standalone hit ' + pct(e.missHit) : e.bucket === 'starship' ? 'No separate price hit: the earlier −7.85% Starship downside estimate was the orbital option, which now lives only in the orbital add-on (so it is not counted twice). The miss forgoes this gate\u2019s upside.' : 'Downside estimate: ' + B[e.bucket].name + ' bucket ' + pct(B[e.bucket].hit) + ' (counted once)')
      : 'our estimate: weight ' + e.w + ' × research ' + (e.group === 'near' ? '3-month' : '3-year, orbital stripped,') + ' ' + (p === 'bull' ? 'bull' : 'base') + ' move';
    if (e.id === 'G5') how += '. Plus the orbital add-on at ' + (ORBW[p] * 100) + '% weight: ' + fmtP(ORBW[p] * orbValue() / A.shares) + '/share (scenario, game dials)';
    return '<div class="oc ' + p + '"><div class="oc-h">' + lab + '</div><p>' + e.o[p] + '</p><div class="oc-n"><i class="scen">' + fmtP(s.price) + '</i> <span class="scen-tag">scenario</span> (' + pct(s.d) + ')<br>Market cap <i class="scen">' + fmtC(s.cap) + '</i> (' + (s.dcap >= 0 ? '+' : '−') + fmtC(Math.abs(s.dcap)) + ')</div><div class="oc-f">' + how + '</div><button class="btn sm oplay" data-p="' + p + '">▶ Play ' + lab + '</button></div>';
  }
  function eventCardHTML(e, withPick) {
    const act = ['', 'Act I · Compute', 'Act II · Launch & Starlink', 'Act III · Starship gates'][e.act];
    return '<p class="kicker">' + act + (e.gate ? ' · gate ' + e.gate + ' of 5' : '') + '</p><h3 id="mTitle">' + e.title + '</h3>' +
      '<p class="date">📅 ' + e.date + ' — <span class="s">' + srcLinks(e.src) + '</span></p>' +
      '<div class="mprev"><canvas></canvas><span>Press ▶ Play on any outcome to watch it (illustration)</span></div>' +
      '<div class="card-fact">' + e.fact + ' <span class="s">Source: ' + srcLinks(e.factSrc) + '</span></div>' +
      '<div class="ocs">' + ['miss', 'neutral', 'bull'].map(p => outcomeBlock(e, p)).join('') + '</div>' +
      '<p class="note">Standalone moves from $' + A.spot.toFixed(2) + ' / ' + fmtC(A.spot * A.shares) + ' on 13.58B shares. In the game, misses stack by bucket (downside overlap rules), not one by one. Confirming event: ' + e.confirm + '.</p>' + (withPick || '');
  }

  /* ---------- calendar ---------- */
  function renderCal() {
    const items = EV.map(e => ({ kind: 'ev', e, sort: e.sort })).concat(window.RADAR.map(x => ({ kind: 'radar', e: x, sort: x.sort }))).sort((a, b) => a.sort < b.sort ? -1 : 1);
    $('#calList').innerHTML = items.map((it, i) => {
      const e = it.e; const m = (it.sort || '').slice(0, 7); const mon = new Date(m + '-15T12:00:00').toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const cls = it.kind === 'ev' ? 'ev act' + e.act : 'radar' + (e.done ? ' done' : '');
      const badge = it.kind === 'ev' ? (e.gate ? 'Gate ' + e.gate : ['', 'Compute', 'Launch & Starlink'][e.act]) : (e.done ? 'Done' : 'Watch list');
      return '<button class="calitem ' + cls + '" data-i="' + i + '"><span class="cm">' + mon + '</span><span class="ct">' + e.title + '</span><span class="cd">' + e.date + '</span><span class="cb">' + badge + '</span></button>';
    }).join('');
    $('#calList').querySelectorAll('.calitem').forEach(b => b.addEventListener('click', () => {
      const it = items[+b.dataset.i];
      if (it.kind === 'ev') openCard(eventCardHTML(it.e), it.e.theme);
      else openCard('<p class="kicker">' + (it.e.done ? 'Already happened' : 'Watch list (not in the game math)') + '</p><h3 id="mTitle">' + it.e.title + '</h3><p class="date">📅 ' + it.e.date + ' — <span class="s">' + srcLinks(it.e.src) + '</span></p><div class="card-fact">' + it.e.fact + ' <span class="s">Source: ' + srcLinks(it.e.src) + '</span></div>' + radarOutcomes(it.e), it.e.theme);
    }));
  }
  function radarOutcomes(x) {
    if (x.done) return '<div class="ocs"><div class="oc bull"><div class="oc-h">OUTCOME</div><p>Happened. Already in the price.</p></div></div>';
    const pb = p => '<button class="btn sm oplay" data-p="' + p + '">▶ Play</button>', prev = '<div class="mprev"><canvas></canvas><span>Press ▶ Play to watch an outcome (illustration)</span></div>';
    return prev + '<div class="ocs"><div class="oc miss"><div class="oc-h">MISS</div><p>Heavy selling into weakness.</p>' + pb('miss') + '</div><div class="oc neutral"><div class="oc-h">NEUTRAL</div><p>Absorbed.</p>' + pb('neutral') + '</div><div class="oc bull"><div class="oc-h">BULL</div><p>Absorbed easily; index-inclusion talk.</p>' + pb('bull') + '</div></div><p class="note">Not priced in the game.</p>';
  }
  renderCal();

  /* ---------- game ---------- */
  const ORDER = EV.slice(); // already act-ordered
  let picks = {}, side = null, cur = null, busy = false, showEnd = false;
  const ANIM_MS = () => window.SPCX_ANIM_MS || 2200;
  const ACTS = {
    1: { name: 'Act I · Compute', line: 'SpaceX rents GPU capacity it powers and runs. It earns the spread between the rental price and chips plus power, wide while compute is scarce.', fact: 'Company-wide installed GPU power was 1.7 GW nameplate at Sep 30, 2026 (1.4 GW Jun 30; 0.6 GW Sep 30, 2025) (Q3 8-K). Anthropic pays $1.25B a month through May 2029; after an initial three-month period, either side can end it on 90 days\u2019 notice (prospectus p. 14).', src: ['q10', 's424'] },
    2: { name: 'Act II · Launch & Starlink', line: 'Launch is the tollbooth: anyone who needs mass in orbit pays SpaceX\u2019s price, and Starlink turns cheap launches into subscription cash.', fact: 'Starlink: 13.6M consumer subscribers at Q3 (8-K EX-99.1). IPO lock-up releases: Oct 22 up to 1.3B shares; Oct 24 up to 328.4M; Dec 8 up to 328.4M or 797.6M; about 1.96B to 2.43B in total Oct 22 to Dec 8 (prospectus pp. 258–259; totals our arithmetic).', src: ['q3', 's424'] },
    3: { name: 'Act III · Starship gates', line: 'Starship is five yes/no gates. Each one opens the next; a miss at an early gate delays every later one.', fact: 'Gate 0 is passed: Flight 14 reached orbit on Sep 28, 2026 and deployed 26 Starlink V3 satellites (SpaceX).', src: ['f14'] }
  };
  function gateClosed(e) { if (!e.gate) return false; return ORDER.some(x => x.gate && x.gate < e.gate && picks[x.id] === 'miss'); }
  function enforceLocks() { let n = 0; ORDER.forEach(e => { if (picks[e.id] === 'bull' && gateClosed(e)) { picks[e.id] = 'neutral'; n++; } }); return n; }
  const allPicked = () => ORDER.every(e => picks[e.id]);
  function tipText(r) {
    return 'Scenario price = $' + A.spot.toFixed(2) + ' × exp(Σ weight × research log-move for each BULL/NEUTRAL pick) × Π(1 + bucket hit) for each missed bucket. ' +
      'Log-move = ln(target ÷ start): near-term 2026 events use the 3-month bull $210 / base $165; 2027+ events the 3-year targets with the earlier orbital option stripped out: bull $275.03 / base $138.15 (were $310 / $145). ' +
      'Bucket hits (downside estimate, each counted once): AI −18% to −25% (−43.4% if a termination plus a second AI miss), capital −8%, Starlink −16.6%. Starship misses carry no separate hit: the earlier −7.85% downside estimate was the orbital option, now carried by the add-on. ' +
      '+ Orbital add-on (scenario) = gate-5 weight (Bull 100% / Neutral 25% / Miss 0%) × ' + ORB.gw.toFixed(1) + ' gigawatts × $' + ORB.rate.toFixed(1) + 'B × ' + ORB.mult.toFixed(1) + 'x ÷ shares. ' +
      'Now: exp-term (the Σ inside exp() above) ' + r.logSum.toFixed(3) + (r.hits.length ? '; hits ' + r.hits.map(h => B[h[0]].name + ' ' + pct(h[1])).join(', ') : '') + '; core ' + fmtP(r.core) + ' + orbital ' + fmtP(r.orbPS) + '. Market cap = price × ' + (r.shares / 1e9).toFixed(2) + 'B shares.';
  }
  function updHUD() {
    const r = evalPath(picks); $('#gPrice').textContent = fmtP(r.price); $('#gCap').textContent = fmtC(r.cap);
    $('#gProg').textContent = Object.keys(picks).length + ' / ' + ORDER.length + ' picked'; $('#gTipText').textContent = tipText(r);
    $('#gTrail').innerHTML = ORDER.filter(e => picks[e.id]).map(e => '<span class="dot ' + picks[e.id] + '" title="' + e.title + ': ' + picks[e.id] + '">' + e.id + '</span>').join('');
    $('#gOrb').innerHTML = picks.G5 ? '<i class="scen">+' + fmtP(r.orbPS) + '</i> <span class="scen-tag">scenario</span> <span class="s">gate 5 ' + picks.G5 + ' · ' + (r.orbW * 100) + '% weight</span>' : '<span class="s">waits for gate 5</span>';
    markPresets(); $('#playAll').disabled = !allPicked(); $('#playAll').title = allPicked() ? '' : 'Set all 14 checkpoints first';
    return r;
  }
  function renderBoard() {
    const bd = $('#board'); const br = evalPath(picks); let html = '<div class="bhead"><b>Checkpoint board</b><span>' + Object.keys(picks).length + ' of 14 set · click any checkpoint to change it</span><span class="bprice">Scenario <i class="scen" id="bPrice">' + fmtP(br.price) + '</i> · <i class="scen" id="bCap">' + fmtC(br.cap) + '</i> <span class="scen-tag">scenario</span><br><span class="s" id="bOrb">core ' + fmtP(br.core) + ' + orbital add-on ' + fmtP(br.orbPS) + ' (opinion)</span></span></div>';
    [1, 2, 3].forEach(a => {
      html += '<div class="bact">' + ACTS[a].name + '</div>';
      ORDER.filter(e => e.act === a).forEach(e => {
        const closed = gateClosed(e);
        html += '<div class="brow' + (cur === e.id ? ' cur' : '') + (picks[e.id] ? ' set' : '') + '" data-id="' + e.id + '"><button class="bname" data-view="' + e.id + '" title="Open this checkpoint">' + e.id + ' · ' + e.title.replace(/^Gate \d: /, '') + '</button><div class="btgl" role="radiogroup" aria-label="' + e.title + '">' +
          ['miss', 'neutral', 'bull'].map(p => '<button class="tg ' + p + (picks[e.id] === p ? ' on' : '') + '" role="radio" aria-checked="' + (picks[e.id] === p) + '" data-id="' + e.id + '" data-p="' + p + '"' + (closed && p === 'bull' ? ' disabled title="Locked: an earlier Starship gate missed"' : '') + '>' + { miss: 'Miss', neutral: 'Neutral', bull: 'Bull' }[p] + '</button>').join('') + '</div></div>';
      });
    });
    bd.innerHTML = html;
    bd.querySelectorAll('.tg[data-p]').forEach(b => b.onclick = () => { if (b.disabled) return; picks[b.dataset.id] = b.dataset.p; const n = enforceLocks(); cur = b.dataset.id; side = null; renderGame({ play: b.dataset.p, locked: n }); });
    bd.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { cur = b.dataset.view; side = null; renderGame(); });
  }
  function renderGame(o) {
    o = o || {}; busy = false; const st = $('#stage'); if (!st) return; updHUD(); renderBoard();
    if (!cur && allPicked()) return showEnd ? renderEnding(st) : renderReady(st);
    const e = cur ? ORDER.find(x => x.id === cur) : ORDER.find(x => !picks[x.id]);
    const i = ORDER.indexOf(e), first = !ORDER.slice(0, i).some(x => x.act === e.act), closed = gateClosed(e), mine = picks[e.id];
    let intro = '';
    if (first && !mine) { const a = ACTS[e.act]; intro = '<div class="actintro"><h3>' + a.name + '</h3><p>' + a.line + '</p><div class="card-fact">' + a.fact + ' <span class="s">Source: ' + srcLinks(a.src) + '</span></div></div>'; }
    const btns = ['miss', 'neutral', 'bull'].map(p => {
      const dis = closed && p === 'bull'; const s = standalone(e, p);
      return '<button class="pick ' + p + (mine === p ? ' chosen' : '') + '" data-p="' + p + '"' + (dis ? ' disabled title="Gate closed: an earlier Starship gate missed, so the best case is a delay"' : '') + '><b>' + p.toUpperCase() + (mine === p ? ' · your pick' : '') + '</b><span>' + e.o[p] + '</span><em>standalone <i class="scen">' + pct(s.d) + '</i></em></button>';
    }).join('');
    st.innerHTML = intro + '<div class="gcard"><div class="gscene"><canvas class="gbg"></canvas><div class="gstat" aria-live="polite"></div></div><div class="gin"><p class="kicker">Checkpoint ' + (i + 1) + ' of ' + ORDER.length + (e.gate ? ' · Starship gate ' + e.gate + ' of 5' : '') + ' · your call</p><h3>' + e.title + '</h3><p class="date">📅 ' + e.date + ' — <span class="s">' + srcLinks(e.src) + '</span></p><div class="card-fact">' + e.fact + ' <span class="s">Source: ' + srcLinks(e.factSrc) + '</span></div>' + (closed ? '<div class="card-op"><b>Gate closed.</b> An earlier Starship gate missed, so this gate can only slip (Neutral) or miss.</div>' : '') + (o.locked ? '<div class="card-op"><b>' + o.locked + ' later gate(s) moved from Bull to Neutral</b> because this miss closes them.</div>' : '') + '<p class="pickq">What happens here? <b>You choose:</b></p><div class="picks">' + btns + '</div>' + (mine ? '<div class="presets"><button class="btn primary" id="gNext">' + (allPicked() ? 'See the ending' : 'Next unset checkpoint') + ' →</button><button class="btn sm" id="gReplay">▶ Replay this animation</button></div>' : '') + '</div></div>';
    const cv = $('.gbg', st), stat = $('.gstat', st);
    if (mine) { Anim.outcome(cv, e.theme, mine, ANIM_MS()); stat.textContent = 'Your pick: ' + mine.toUpperCase(); stat.className = 'gstat ' + mine; }
    else paintScene(cv, e.theme, {}, true);
    if (o.play) scrollCard();
    st.querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => {
      if (busy) return; const p = b.dataset.p; picks[e.id] = p; const n = enforceLocks(); updHUD(); renderBoard();
      busy = true; st.querySelectorAll('.pick').forEach(x => { x.disabled = true; x.classList.toggle('chosen', x === b); });
      stat.textContent = 'Playing: ' + p.toUpperCase(); stat.className = 'gstat ' + p;
      Anim.outcome(cv, e.theme, p, ANIM_MS(), () => { busy = false; cur = null; if (allPicked()) showEnd = true; renderGame({ locked: n }); scrollCard(); });
    }));
    if ($('#gNext')) $('#gNext').onclick = () => { cur = null; if (allPicked()) showEnd = true; renderGame(); scrollCard(); };
    if ($('#gReplay')) $('#gReplay').onclick = () => Anim.outcome(cv, e.theme, mine, ANIM_MS());
  }
  function scrollCard() { const g = $('#stage .gcard') || $('#stage .ending'); if (g) g.scrollIntoView({ block: 'start' }); }
  const ENDS = {
    mars: { title: 'MARS: Elon\u2019s plan comes true', text: 'Every checkpoint went right and Musk\u2019s stated orbital-compute targets were hit. Compute stayed scarce, Starship cleared all five gates and orbital compute began deploying from 2028. Starships land on Mars, a base goes up, and generic humanoid robots do the heavy work (illustration; Optimus is a Tesla product, shown only as a possible Starship payload). A swarm of compute satellites circles the Sun in the distance.' },
    launcher: { title: 'THE MOON, WITH A MASS DRIVER: the bull path', text: 'Compute stayed scarce and Starship cleared its gates. A Moon base is running and a lunar mass driver, a long electromagnetic rail on the surface, flings compact satellites off its end; they unfold their solar wings and climb into orbit (illustration; the prospectus mentions lunar energy and manufacturing as future markets, and Musk has described a lunar mass driver). Generic humanoid robots run the base. Mars is reserved for Elon\u2019s plan.' },
    moon: { title: 'THE MOON: a working base', text: 'The middle of the road: Human Landing System milestones and V3 cadence carried the value even with some misses. Starship landers deliver a base and generic humanoid robots go to work (illustration); Mars waits for the next decade.' },
    orbit: { title: 'ORBIT: satellites deploying, the base case', text: 'Starship works and Starlink V3 deploys, but compute pricing drifts to consensus and dilution eats the per-share gains. Real business, ordinary returns.' },
    splash: { title: 'SPLASHDOWN: the bear path (two of three buckets missed)', text: 'Two of the three downside buckets (Starship, AI revenue, capital) broke in the same window. Not an explosion, but the ship ends in the ocean: our $118 near-term bear territory.' },
    explode: { title: 'RAPID UNSCHEDULED DISASSEMBLY', text: 'A Starship miss, an AI-revenue break and capital stress all landed together. Per our downside estimates, that is what it takes: about $112 if it all hits in the Oct 24 to Dec 31 window and about $78 if both contracts go through 2027. With the orbital piece now carried only by the add-on (no separate −7.85% Starship hit), the game shows those same paths at about $122 and $85, lower if Starlink derates too.' }
  };
  function paintEnding(cv, k) { if (k === 'explode') explosion(cv); else if (k === 'splash') paintScene(cv, 'splash', {}, true); else Anim.ending(cv, k); }
  function renderReady(st) {
    const r = evalPath(picks), a = activePreset(), k = ending(picks, r), name = { elon: 'Elon\u2019s plan (his stated targets)', bull: 'Full Bull', neutral: 'Base', miss: 'Bear' }[a] || 'your picks';
    st.innerHTML = '<div class="gcard ready"><div class="gscene"><canvas class="gbg"></canvas></div><div class="gin"><p class="kicker">Board filled · ' + name + '</p><h3>All 14 checkpoints are set. Ready to launch.</h3>' +
      '<div class="endnums"><div><span class="lbl">Scenario price</span><i class="scen big">' + fmtP(r.price) + '</i> <span class="scen-tag">' + (a === 'elon' ? 'scenario · if his targets are hit' : 'scenario') + '</span></div><div><span class="lbl">Scenario market cap</span><i class="scen big">' + fmtC(r.cap) + '</i></div><div><span class="lbl">Of which orbital add-on</span><i class="scen big">+' + fmtP(r.orbPS) + '</i> <span class="scen-tag">scenario</span></div></div>' +
      '<p>Change any checkpoint on the board, or press <b>▶ Play full timeline</b> to watch the whole path in date order, from liftoff to the ending.</p>' +
      '<div class="presets"><button class="btn primary big" id="playAll3">▶ Play full timeline</button><button class="btn" id="seeEnd">Skip to the ending</button></div>' +
      (a === 'elon' ? elonBox(r) : '') + '</div></div>';
    paintScene($('.gbg', st), 'launch', {}, true); elonStat();
    $('#playAll3').onclick = finale; $('#seeEnd').onclick = () => { showEnd = true; renderGame(); };
  }
  function renderEnding(st) {
    const r = evalPath(picks), k = ending(picks, r), E = ENDS[k];
    const trail = ORDER.map(e => '<li class="' + picks[e.id] + '"><b>' + picks[e.id].toUpperCase() + '</b> ' + e.title + ' <span class="s">— confirm: ' + e.confirm + '</span></li>').join('');
    const missTriggers = ORDER.filter(e => picks[e.id] === 'miss').map(e => e.title + ' (' + e.date.split('(')[0].trim() + ')');
    st.innerHTML = '<div class="ending ' + k + '"><div class="escene"><canvas class="ebg"></canvas></div><div class="ein"><p class="kicker">' + (elonUsed && elonActive() ? 'Ending · Elon\u2019s plan (his stated targets) · scenario: if his targets are hit' : 'Ending · built from your 14 picks') + '</p><h3>' + E.title + '</h3>' +
      '<div class="endnums"><div><span class="lbl">Final scenario price</span><i class="scen big" id="ePrice">' + fmtP(r.price) + '</i> <span class="scen-tag">scenario</span> <span class="d" id="eD">(' + pct(r.price / A.spot - 1) + ' vs $' + A.spot.toFixed(2) + ')</span></div><div><span class="lbl">Scenario market cap</span><i class="scen big" id="eCap">' + fmtC(r.cap) + '</i> <span class="scen-tag">scenario</span> <span class="d">vs ' + fmtC(A.spot * A.shares) + ' today</span></div><div><span class="lbl">Of which orbital add-on</span><i class="scen big" id="eOrb">+' + fmtP(r.orbPS) + '</i> <span class="scen-tag">scenario</span> <span class="d" id="eOrbM">' + orbMath(r) + '</span></div></div>' +
      (elonUsed && ORDER.every(e => picks[e.id] === 'bull') ? elonBox(r) : '') + '<div class="presets"><button class="btn primary big" id="playAll2">▶ Play full timeline</button></div>' +
      '<p>' + E.text + '</p>' + (missTriggers.length ? '<p class="note"><b>Dated events that would confirm the misses:</b> ' + missTriggers.join('; ') + '.</p>' : '') +
      '<p class="note">Reference points: our 3-year research bull <i class="scen">$310</i> / base <i class="scen">$145</i> / bear <i class="scen">$52</i> (the game uses $275.03 / $138.15 / $52 after stripping the earlier orbital option, then adds your orbital add-on); downside estimates <i class="scen">$112</i> near-term explosion, <i class="scen">≈$118</i> two-of-three, <i class="scen">$78</i> full 2027 path (which include a −7.85% orbital/Starship hit the game now carries in the add-on instead); Morgan Stanley $600 / $300 / $75 (their view, press).</p>' +
      '<div class="presets"><button class="btn" id="again">Clear the board</button><span class="plbl">Change any pick on the board, or refill it:</span><button class="btn" data-preset="bull">Full Bull</button><button class="btn" data-preset="neutral">Base</button><button class="btn" data-preset="miss">Bear</button></div>' +
      '<details><summary>Your path (' + ORDER.length + ' picks)</summary><ol class="ptrail">' + trail + '</ol></details></div></div>';
    paintEnding($('.ebg', st), k); elonStat();
    $('#again').onclick = replay; $('#playAll2').onclick = finale;
    st.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => preset(b.dataset.preset));
  }
  function explosion(cv) { Anim.ending(cv, 'explode'); }
  function orbMath(r) { return (r.orbW * 100) + '% (gate 5: ' + (picks.G5 || 'not set') + ') × ' + ORB.gw.toFixed(1) + ' gigawatts × $' + ORB.rate.toFixed(1) + 'B per gigawatt × ' + ORB.mult.toFixed(1) + 'x = ' + fB(r.orbW * orbValue() / 1e9) + ' ÷ ' + (r.shares / 1e9).toFixed(2) + 'B shares'; }
  function liveRefresh() { // dial change: update numbers in place, no scene restart
    const r = updHUD(); elonStat(); if ($('#bPrice')) { $('#bPrice').textContent = fmtP(r.price); $('#bCap').textContent = fmtC(r.cap); $('#bOrb').textContent = 'core ' + fmtP(r.core) + ' + orbital add-on ' + fmtP(r.orbPS) + ' (opinion)'; }
    if ($('#ePrice')) { $('#ePrice').textContent = fmtP(r.price); $('#eCap').textContent = fmtC(r.cap); $('#eD').textContent = '(' + pct(r.price / A.spot - 1) + ' vs $' + A.spot.toFixed(2) + ')'; $('#eOrb').textContent = '+' + fmtP(r.orbPS); $('#eOrbM').textContent = orbMath(r); }
    if ($('#stage .gcard') && !busy && cur === 'G5') { /* G5 card numbers */ $('#stage').querySelectorAll('.pick').forEach(b => { const s = standalone(EV.find(x => x.id === 'G5'), b.dataset.p); const i = b.querySelector('em i'); if (i) i.textContent = pct(s.d); }); }
  }

  /* ---------- full timeline finale ---------- */
  let fRaf = null, finaleCalc = null;
  function finale() {
    if (!allPicked()) return;
    const fin = $('#finale'), cv = $('#fCanvas'); fin.hidden = false; document.body.classList.add('noscroll');
    const seq = ORDER.slice().sort((a, b) => a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0);
    const SEG = window.SPCX_FINALE_MS || 3250, INTRO = 3000, OUTRO = 9000, sub = {};
    let prices, fr; const calc = () => { const sub = {}; prices = [{ price: A.spot, cap: A.spot * A.shares }]; seq.forEach(e => { sub[e.id] = picks[e.id]; const r = evalPath(sub); prices.push({ price: r.price, cap: r.cap }); }); fr = evalPath(picks); };
    calc(); finaleCalc = calc; const k = ending(picks, fr), total = INTRO + seq.length * SEG + OUTRO;
    const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; const ctx = cv.getContext('2d');
    Anim.labelCenter = true; const t0 = performance.now(); let last = -2; if (fRaf) cancelAnimationFrame(fRaf); Anim.resetBoom && Anim.resetBoom();
    const fmtMon = s => new Date(s.slice(0, 7) + '-15T12:00:00').toLocaleString('en-US', { month: 'short', year: 'numeric' });
    function frame(now) {
      if (fin.hidden) return; const t = Math.min(now - t0, total), w = cv.clientWidth, h = cv.clientHeight; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let seg, p, pr;
      if (t < INTRO) { seg = -1; p = t / INTRO; Anim.OV.launch(ctx, w, h, t, p * 0.45, 'bull'); pr = prices[0]; }
      else if (t < INTRO + seq.length * SEG) { seg = Math.floor((t - INTRO) / SEG); p = ((t - INTRO) % SEG) / SEG; const e = seq[seg]; Anim.OV[e.theme](ctx, w, h, t, Math.min(1, p * 1.25), picks[e.id]);
        const a = prices[seg], b = prices[seg + 1], q = Math.min(1, p * 1.6); pr = { price: a.price + (b.price - a.price) * q, cap: a.cap + (b.cap - a.cap) * q }; }
      else { seg = seq.length; Anim.ENDS[k](ctx, w, h, t - INTRO - seq.length * SEG); pr = prices[prices.length - 1]; }
      if (seg === seq.length && $('#fEndNum')) { $('#fEndNum').textContent = (elonUsed && elonActive() ? 'Elon\u2019s plan, scenario if his targets are hit. ' : '') + 'Final scenario price ' + fmtP(fr.price) + ' · market cap ' + fmtC(fr.cap) + ' · of which orbital add-on +' + fmtP(fr.orbPS) + ' (scenario).'; }
      $('#fPrice').textContent = fmtP(pr.price); $('#fCap').textContent = fmtC(pr.cap); $('#fBar').style.width = (t / total * 100).toFixed(1) + '%';
      if (seg !== last) { last = seg;
        if (seg === -1) { $('#fStep').textContent = 'Start · Oct 22, 2026 close'; $('#fCapn').innerHTML = '<b>Liftoff.</b> SPCX at $' + A.spot.toFixed(2) + ' (' + fmtC(A.spot * A.shares) + '). Flight 14 reached orbit on Sep 28. Your 14 picks play out in date order.'; }
        else if (seg < seq.length) { const e = seq[seg], pk = picks[e.id]; $('#fStep').innerHTML = (seg + 1) + ' / ' + seq.length + ' · ' + (/^date not set/i.test(e.date) ? 'date not set, placed ~' : '') + fmtMon(e.sort) + ' · <span class="tg ' + pk + ' on">' + pk.toUpperCase() + '</span>'; $('#fCapn').innerHTML = '<span class="fdate">' + e.date.split('(')[0].replace(/\.\s*$/, '') + '</span><b>' + e.title + '</b><br>' + e.o[pk]; }
        else { $('#fStep').textContent = 'Ending'; $('#fCapn').innerHTML = '<b>' + ENDS[k].title + '</b><br><span id="fEndNum"></span>'; }
        $('#fCapn').classList.toggle('top', seg === seq.length);
      }
      fRaf = requestAnimationFrame(frame);
    }
    fRaf = requestAnimationFrame(frame);
  }
  function closeFinale() { if (allPicked() && !showEnd) { showEnd = true; renderGame(); } Anim.labelCenter = false; $('#finale').hidden = true; document.body.classList.remove('noscroll'); if (fRaf) cancelAnimationFrame(fRaf); }
  $('#fClose').onclick = closeFinale; addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#finale').hidden) closeFinale(); });
  $('#playAll').onclick = finale; $('#elonPlan').onclick = elonPlan; window.SPCX.elonPlan = elonPlan; window.SPCX.showEnding = () => { showEnd = true; renderGame(); };

  function replay() { picks = {}; cur = null; side = null; showEnd = false; renderGame(); $('#game').scrollIntoView({ behavior: 'smooth' }); }
  const DEF = { rate: 7.3, mult: 5.5 };
  const elonActive = () => ORDER.every(e => picks[e.id] === 'bull') && ORB.gw === ELON.dials.gw && ORB.rate === (ELON.dials.rate || DEF.rate) && ORB.mult === (ELON.dials.mult || DEF.mult);
  let elonUsed = false;
  let prevDials = null;
  function restoreDials() { if (!prevDials) return; $('#dOrb').value = prevDials[0]; $('#dRate').value = prevDials[1]; $('#dMult').value = prevDials[2]; prevDials = null; lab(); }
  function elonPlan() { // toggles; never scrolls or jumps to the ending
    if (activePreset() === 'elon') { elonUsed = false; restoreDials(); clearBoard(); return; }
    if (!prevDials) prevDials = [$('#dOrb').value, $('#dRate').value, $('#dMult').value];
    $('#dOrb').value = ELON.dials.gw; $('#dRate').value = ELON.dials.rate || DEF.rate; $('#dMult').value = ELON.dials.mult || DEF.mult;
    picks = {}; ORDER.forEach(e => { picks[e.id] = 'bull'; }); cur = null; side = null; showEnd = false; elonUsed = true; lab(); renderGame();
  }
  function activePreset() {
    if (!allPicked()) return null; const v = ORDER.map(e => picks[e.id]);
    if (elonUsed && elonActive()) return 'elon';
    for (const p of ['bull', 'neutral', 'miss']) { const want = {}; ORDER.forEach(e => want[e.id] = p); Object.keys(want).forEach(id => { const e = ORDER.find(x => x.id === id); if (p === 'bull' && gateClosedFor(want, e)) want[id] = 'neutral'; }); if (ORDER.every(e => picks[e.id] === want[e.id])) return p; }
    return null;
  }
  function gateClosedFor(pk, e) { return !!e.gate && ORDER.some(x => x.gate && x.gate < e.gate && pk[x.id] === 'miss'); }
  function markPresets() { const a = activePreset(); document.querySelectorAll('[data-preset]').forEach(b => { const on = b.dataset.preset === a; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); }); document.querySelectorAll('#elonPlan').forEach(b => { const on = a === 'elon'; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); }); }
  function clearBoard() { picks = {}; cur = null; side = null; showEnd = false; renderGame(); }
  function elonBox(r) {
    const li = ELON.figs.map(f => '<li' + (f.dial ? ' class="dialfig"' : '') + '>' + (f.dial ? '<b>Sets the ' + { gw: 'orbital gigawatts', rate: 'compute-price', mult: 'multiple' }[f.dial] + ' dial:</b> ' : '') + f.fig + ' <span class="s">— ' + (f.u ? '<a href="' + f.u + '" target="_blank" rel="noopener">' + f.who + '</a>' : f.who) + '</span></li>').join('');
    return '<div class="elonbox"><div class="speclabel">SCENARIO · IF HIS TARGETS ARE HIT</div><p id="elonStat" class="note"></p>' +
      '<p><b>How the dials were set.</b> Orbital gigawatts in service by 2030 = <b>' + ELON.dials.gw + '</b>: Musk stated a ~100 GW/year annualized rate in 3 to 4 years (Jan 22, 2026), the company\u2019s goal is 100 gigawatts a year to orbit, and deployment starts as early as 2028. Reading that as about 100 gigawatts in service during 2030 is <i>our mapping</i>, not his words. Compute price and multiple: <b>no stated figure, so our defaults ($' + DEF.rate + 'B per gigawatt per year, ' + DEF.mult + 'x) are kept</b>. All 14 checkpoints are set to Bull.</p>' +
      '<p class="eq small">Add-on = ' + ELON.dials.gw + ' gigawatts × $' + DEF.rate + 'B × ' + DEF.mult + 'x = ' + fB(ELON.dials.gw * DEF.rate * DEF.mult) + ' ÷ 14.30B shares ≈ $' + (ELON.dials.gw * DEF.rate * DEF.mult / 14.3).toFixed(2) + ' per share on top of the ex-orbital bull core of $275.03. Physical check (company figures): 100 gigawatts at 100 kW per metric ton ≈ 1 million metric tons, about 10,000 Starship V3 launches of 100 t (our arithmetic).</p>' +
      '<details open><summary>Stated figures and sources (' + ELON.figs.length + ')</summary><ul class="elonlist">' + li + '</ul></details></div>';
  }
  function elonStat() { const el = $('#elonStat'); if (!el) return; const on = elonActive(); el.innerHTML = on ? '<b>Elon\u2019s plan is active.</b> This price is a scenario: what the game gives <i>if his targets are hit</i>. It is not a forecast.' : '<b>Modified:</b> you have moved a dial or a pick away from Elon\u2019s plan, so the price above reflects your settings, not his targets.'; }
  function preset(p) { // toggles; fills the board and stays put (no scroll, no jump to the ending)
    if (activePreset() === p) { clearBoard(); return; }
    if (elonUsed) restoreDials(); elonUsed = false; showEnd = false; picks = {}; ORDER.forEach(e => { picks[e.id] = p; }); enforceLocks(); cur = null; side = null; renderGame(); }
  window.SPCX.preset = preset; window.SPCX.fillPreset = p => { picks = {}; preset(p); }; window.SPCX.finale = finale; window.SPCX.picks = () => Object.assign({}, picks);
  window.SPCX.pick = p => { const b = document.querySelector('#stage .pick.' + p + ':not([disabled])') || document.querySelector('#stage .pick.neutral'); b && b.click(); };
  window.SPCX.setPicks = o => { picks = Object.assign({}, o); enforceLocks(); cur = null; side = null; showEnd = true; renderGame(); };
  document.querySelectorAll('.presets [data-preset]').forEach(b => b.addEventListener('click', () => preset(b.dataset.preset)));
  $('#replay').onclick = replay;
  function evalPathDone() { return Object.keys(picks).length === ORDER.length; }

  /* ---------- compute lab + revenue streams ---------- */
  const tslaCap = () => (PR.tsla && PR.tsla.marketCap) || 1.493e12;
  const fB = v => v >= 1000 ? '$' + (v / 1000).toFixed(2) + 'T' : '$' + v.toFixed(0) + 'B';
  function lab() {
    const gw = +$('#dGw').value, rate = +$('#dRate').value, mult = +$('#dMult').value, orb = +$('#dOrb').value;
    ORB.gw = orb; ORB.rate = rate; ORB.mult = mult; if (finaleCalc) finaleCalc(); if (typeof liveRefresh === 'function' && $('#stage').innerHTML) liveRefresh();
    $('#vGw').textContent = gw.toFixed(1) + ' gigawatts'; $('#vRate').textContent = '$' + rate.toFixed(1) + 'B per gigawatt ($' + rate.toFixed(1) + '/W)'; $('#vMult').textContent = mult.toFixed(1) + 'x'; $('#vOrb').textContent = orb.toFixed(1) + ' gigawatts'; mathVals(gw, rate, mult, orb);
    const rev = gw * rate, val = rev * mult, ps = val * 1e9 / A.shares, cut = gw * rate * 0.3, today = A.spot * A.shares / 1e9;
    $('#labOut').innerHTML = '<div class="eq">Revenue <b>$' + rev.toFixed(1) + 'B</b>/yr × <b>' + mult.toFixed(1) + 'x</b> = <i class="scen">' + fB(val) + '</i> <span class="scen-tag">scenario</span> value for rented compute</div>' +
      '<div class="eq">= <i class="scen">$' + ps.toFixed(1) + '</i> per share, or ' + (val / today * 100).toFixed(0) + '% of today\u2019s $' + (today / 1000).toFixed(2) + 'T market cap</div>' +
      '<div class="eq small">A 30% rate cut at ' + gw.toFixed(1) + ' gigawatts costs about <b>$' + cut.toFixed(1) + 'B</b> a year (our arithmetic). +$10/W at 4.1 gigawatts ≈ +$41B a year, matching "more than $40B" ('+'<a href="https://www.benzinga.com/analyst-stock-ratings/reiteration/26/10/62166196/spacex-is-cheap-and-getting-cheaper-morgan-stanley-says" target="_blank" rel="noopener">Morgan Stanley note, Oct 4, via Benzinga</a>'+').</div>' +
      '<div class="card-fact small">Cost side: $27.96B of non-cancelable commitments, mostly AI infrastructure; Q2 AI capex $15.83B (10-Q). Contracted rentals ≈ $26B a year: Anthropic $15B (prospectus p. 14: after an initial three-month period, either side can end it on 90 days\u2019 notice) + Google $11B (press). <span class="s">' + srcLinks(['q10', 's424', 'web']) + '</span></div>' +
      '<div class="card-op small">Our view: the rate dial matters more than the build dial. Our 3-year cases value compute rental at $140B × 8x (bull), $95B × 5.5x (base), $45B × 3x (bear) of 2030 revenue (opinion).</div>';
    streams(rate, mult, orb);
  }
  function streams(rate, mult, orb) {
    const oRev = orb * rate, oVal = oRev * mult, launches = Math.round(orb * 100), psB = oVal * 1e9 / 14.3e9, psN = 0.25 * oVal * 1e9 / 14.6e9;
    const sc = (b, n, r) => '<i class="scen">' + b + '</i> / <i class="scen">' + n + '</i> / <i class="scen">' + r + '</i>';
    const N = '<span class="st np">NOT PRICED</span>', P = '<span class="st pr">PRICED</span>', W = '<span class="st pw">PRICED WITHIN</span>', U = '<span class="st un">UNPRICED</span>', T = '<span class="st te">NOT SPACEX</span>';
    const rows = [
      ['Starlink broadband: consumer, enterprise, maritime, aviation', P, 'Connectivity EBITDA (earnings before interest, taxes, depreciation and amortization) ' + sc('$50B × 30x', '$38B × 24x', '$28B × 18x'), 'Q2 Connectivity $4.29B; consumer $2.49B, enterprise &amp; government $1.81B. ' + srcLinks(['q10'])],
      ['Starshield / government satellite services', W, 'Inside Connectivity (enterprise &amp; government) and the Space line ' + sc('$400B', '$250B', '$175B') + ' value', 'No separate disclosure. ' + srcLinks(['q10'])],
      ['Falcon and Starship launch for outside customers, NASA cargo and crew, national-security launch', P, 'Space line ' + sc('$400B', '$250B', '$175B') + ' value', srcLinks(['s424'])],
      ['NASA Human Landing System (Moon lander)', W, 'Inside the Space line', 'Starship is NASA\u2019s Human Landing System for Artemis (prospectus p. 187). ' + srcLinks(['s424'])],
      ['Terrestrial compute rental (Anthropic, Google, others)', P, 'Compute rental 2030 revenue ' + sc('$140B × 8x', '$95B × 5.5x', '$45B × 3x') + '; dials 1-3 in the game controls change it', srcLinks(['q10', 's424'])],
      ['Cursor / enterprise software', P, sc('$50B × 15x', '$32B × 12x', '$20B × 8x') + ' 2030 revenue', srcLinks(['k814'])],
      ['Grok and X: premium subscriptions, ads, API, data licensing', P, 'Consumer / API / X ' + sc('$40B × 8x', '$28B × 6x', '$15B × 4x') + ' 2030 revenue', 'Revenue includes "premium subscriptions on X and Grok" and data licensing (prospectus p. 101). ' + srcLinks(['s424'])],
      ['<b>Orbital AI compute (the Dyson-swarm idea)</b>', P, 'Earlier orbital option ' + sc('$500B', '$100B', '$0') + ' <b>stripped out of the targets</b>; replaced by your add-on. <b>Your dials:</b> <i class="scen">' + orb.toFixed(1) + ' gigawatts × $' + rate.toFixed(1) + 'B = $' + oRev.toFixed(1) + 'B</i> 2030 revenue × ' + mult.toFixed(1) + 'x = <i class="scen">' + fB(oVal) + '</i> <span class="scen-tag">scenario</span>', 'SpaceX expects to begin deploying orbital AI compute satellites "as early as 2028" (prospectus p. 4). Revenue in this table starts no earlier than 2028. ' + srcLinks(['s424'])],
      ['Point-to-point terrestrial travel', U, '$0 in all cases', 'Listed under "Future Markets" (prospectus p. 11). ' + srcLinks(['s424'])],
      ['Space tourism', U, '$0', 'Future Markets (prospectus p. 11).'],
      ['In-orbit manufacturing', U, '$0', 'Future Markets (prospectus p. 11).'],
      ['Moon and Mars: cargo and passenger transport, energy, manufacturing, a lunar mass driver', U, '$0 (the endings are illustrations, not value)', 'Future Markets (prospectus p. 11); the Moon-first plan is press. ' + srcLinks(['moonpivot'])],
      ['Own chip manufacturing ("Terafab")', U, '$0; treated as a cost saver, no terms disclosed', 'Strategy list: "Design and manufacture our own chips" (prospectus p. 11).'],
      ['Digital human augmentation', U, '$0', 'Strategy list (prospectus p. 11). No revenue disclosed.'],
      ['Optimus humanoid robots, robotaxis', T, 'Not in SPCX math. These are Tesla businesses; robots appear only as Starship payloads in the illustrations.', srcLinks(['optimus', 't10q'])],
      ['Direct-to-cell / Starlink Mobile (the phone business)', N, 'Not priced as its own line, and the game adds nothing for it (our Connectivity target already folds in a small probability-weighted mobile option). <b>Max upside:</b> our <i class="scen">$50B</i> mobile option ≈ <i class="scen">+$' + (50e9 / A.shares).toFixed(2) + '</i> per share, about ' + (50e9 / (A.spot * A.shares) * 100).toFixed(1) + '% of today\u2019s cap (basis: $50B ÷ 13.58B shares; the $50B is our weighting of MoffettNathanson and Besen scenarios). Even bullish third-party scenarios put the whole carrier option at about 1-12% of the cap (our arithmetic).', 'FCC grant DA 26-1078 (15,000 direct-to-phone satellites); EchoStar spectrum (10-Q). ' + srcLinks(['da', 'q10'])],
      ['Tesla merger', N, 'No merger announced. Musk said on the Oct 20 call that Tesla and SpaceX boards formed special committees of independent directors to discuss a potential merger (press-reported, CNBC). No 8-K on it (EDGAR filings list checked Oct 22: latest is the Oct 20 8-K, Items 2.02/9.01 only, i.e. results plus exhibits). <b>Max upside if it happened:</b> combined value of ~<i class="scen">' + fmtC(A.spot * A.shares + tslaCap()) + '</i> (basis: SPCX ' + fmtC(A.spot * A.shares) + ' + Tesla ' + fmtC(tslaCap()) + ' market caps (SPCX at the Oct 22, 2026 close, Tesla at the Oct 12, 2026 close, not refreshed); Tesla = $378.03 × 3.95B shares as of Jul 16, 2026 (Q2 10-Q), a simple sum with no deal premium or synergies). A share swap at market prices adds no value per SPCX share by itself.', 'Tesla cap: ' + srcLinks(['tmc']) + '; no deal: ' + srcLinks(['rmerge', 'cnbcq3'])]
    ];
    $('#streamsOut').innerHTML = '<div class="tblwrap"><table class="streams"><thead><tr><th>Revenue stream</th><th>Status</th><th>How the 2030 targets price it (bull / base / bear, our research)</th><th>Source</th></tr></thead><tbody>' +
      rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td class="s">' + r[3] + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="card-op orbmath"><b>Orbital compute, the math (scenario, our estimate).</b> Fact: SpaceX\u2019s design target is more than 100 kilowatts of compute per metric ton (prospectus p. 10), and Starship V3 is designed to carry 100 metric tons to orbit (prospectus p. 6). So one full V3 launch carries about 100 kW × 100 t ≈ <b>10 megawatts</b>, and 1 gigawatt takes about 100 launches (our arithmetic). Your <b>' + orb.toFixed(1) + ' gigawatts</b> in service by 2030 means about <b>' + launches + ' launches</b> between 2028 and 2030, priced at the compute-price dial (<b>$' + rate.toFixed(1) + 'B per gigawatt per year</b>) and the multiple dial (<b>' + mult.toFixed(1) + 'x</b>). That gives <i class="scen">$' + oRev.toFixed(1) + 'B</i> revenue and <i class="scen">' + fB(oVal) + '</i> value. Our scenario cases: bull 2 / base 0.5 / bear 0 gigawatts; the <b>Elon\u2019s plan</b> preset sets 100, from his stated targets. ' +
      '<br><b>How it enters the game price (additive).</b> Our earlier 3-year targets contained an orbital option ($500B bull / $100B base / $0 bear), so we removed it: bull $310 − $500B ÷ 14.3B = <b>$275.03</b>, base $145 − $100B ÷ 14.6B = <b>$138.15</b>, bear $52 unchanged. The earlier −7.85% Starship-miss downside estimate was that same option, so it is dropped too. Then the add-on goes on top: value × gate-5 weight (Bull 100%, Neutral 25%, Miss 0%) ÷ path shares. At these dials that is <i class="scen">+$' + psB.toFixed(2) + '</i> per share on the all-bull path (14.3B shares) and <i class="scen">+$' + psN.toFixed(2) + '</i> on the base path (14.6B shares). <span class="scen-tag">scenario</span> The game price, board and timeline overlay update live as you move the dials.</div>' +
      '<p class="note">Physical check: the 100-gigawatts-a-year goal needs "thousands of launches per year" (prospectus p. 10). A few hundred launches by 2030 is our opinion, not a company forecast.</p>';
  }
  function mathVals(gw, rate, mult, orb) {
    const r = evalPath(Object.keys(picks).length ? picks : {}), row = (n, v) => '<div><span class="lbl">' + n + '</span><b>' + v + '</b></div>';
    $('#mathVals').innerHTML = row('1. Terrestrial compute billed', gw.toFixed(1) + ' gigawatts') + row('2. Compute price', '$' + rate.toFixed(1) + 'B per gigawatt per year') + row('3. Multiple of revenue', mult.toFixed(1) + 'x') + row('4. Orbital compute by 2030', orb.toFixed(1) + ' gigawatts');
    $('#mathOrb').innerHTML = '<div class="card-op small"><b>Orbital add-on on your current path (scenario).</b> ' + (picks.G5 ? orbMath(r) + ' = <i class="scen">+' + fmtP(r.orbPS) + '</i> per share, inside the current scenario price <i class="scen">' + fmtP(r.price) + '</i> / <i class="scen">' + fmtC(r.cap) + '</i>.' : 'Set gate 5 on the board to see the add-on for your path. On the all-bull path (14.3B shares) it is <i class="scen">+$' + (orb * rate * mult * 1e9 / 14.3e9).toFixed(2) + '</i> per share at these dials.') + '</div>';
  }
  const mathModal = $('#mathModal');
  function openMath() { lab(); mathModal.hidden = false; document.body.classList.add('noscroll'); $('.mclose', mathModal).focus(); }
  function closeMath() { mathModal.hidden = true; document.body.classList.remove('noscroll'); $('#showMath').focus(); }
  $('#showMath').onclick = openMath; window.SPCX.openMath = openMath;
  mathModal.addEventListener('click', e => { if (e.target === mathModal || e.target.classList.contains('mclose')) closeMath(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mathModal.hidden) closeMath(); });
  ['#dGw', '#dRate', '#dMult', '#dOrb'].forEach(s => $(s).addEventListener('input', lab));
  document.querySelectorAll('[data-mark]').forEach(b => b.addEventListener('click', () => { const m = { q2: [1.7, 17.8], cons: [4.1, 17.6], bull: [10, 14] }[b.dataset.mark]; $('#dGw').value = m[0]; $('#dRate').value = m[1]; lab(); }));
  lab();
  renderGame();
})();
