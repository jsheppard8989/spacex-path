/* Outcome animations (theme x outcome), big Moon/Mars endings, explosion. Original procedural art. */
(function () {
  'use strict';
  const X = window.Scenes, S = X.S;
  const ease = p => p < 0 ? 0 : p > 1 ? 1 : p * p * (3 - 2 * p);
  const C = { bull: '#36d399', neutral: '#f6c453', miss: '#ff6b6b' };
  function label(ctx, w, h, txt, o) { ctx.save(); const big = window.Anim && Anim.labelCenter; ctx.font = '700 ' + (big ? 20 : 15) + 'px system-ui'; const tw = ctx.measureText(txt).width + 22, bh = big ? 38 : 30, x = big ? (w - tw) / 2 : w - tw - 14, y = big ? 22 : 14; ctx.fillStyle = 'rgba(5,8,14,.78)'; ctx.fillRect(x, y, tw, bh); ctx.fillStyle = C[o]; ctx.fillRect(x, y, 4, bh); ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 12, y + bh - (big ? 12 : 9)); ctx.restore(); }
  function fireball(ctx, x, y, k, s) { s = s || 1; for (let i = 0; i < 7; i++) { const a = i * 0.9, r = (20 + i * 9) * s * (0.4 + k); X.glow(ctx, x + Math.cos(a) * 16 * s * k, y + Math.sin(a) * 12 * s * k, r, 'rgba(255,' + (140 + i * 10) + ',60,' + (0.7 * (1 - k * 0.6)).toFixed(2) + ')'); } X.glow(ctx, x, y, 30 * s * (1 - k * 0.5), 'rgba(255,250,220,' + (1 - k).toFixed(2) + ')'); }
  function flame(ctx, x, y, len, wid) { X.glow(ctx, x, y + len * 0.3, len * 0.6, 'rgba(255,170,70,.55)'); ctx.fillStyle = 'rgba(255,240,200,.9)'; ctx.beginPath(); ctx.moveTo(x - wid, y); ctx.lineTo(x + wid, y); ctx.lineTo(x, y + len); ctx.fill(); }
  function dollars(ctx, w, h, t, up, col) { const r = X.rng(9); ctx.font = '700 16px system-ui'; for (let i = 0; i < 26; i++) { const x = r() * w, sp = 0.04 + r() * 0.05; let y = ((r() * h + (up ? -1 : 1) * t * sp) % h + h) % h; ctx.fillStyle = col; ctx.globalAlpha = 0.25 + r() * 0.5; ctx.fillText('$', x, y); } ctx.globalAlpha = 1; }

  /* draw(ctx, w, h, t, p): p = 0..1 progress of the outcome animation */
  const OV = {
    launch(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#02040b', '#1b1030'); X.stars(ctx, w, h, 11, 0, t); X.ground(ctx, w, h, h * 0.86, '#0d0f14', '#050608', 3, 4);
      const tx = w * 0.5 + h * 0.07; X.tower(ctx, tx, h * 0.86, h * 0.62);
      const H = h * 0.6, up = ease(p / 0.45) * h * 0.9;
      if (o === 'miss' && p > 0.38) { fireball(ctx, w * 0.5, h * 0.86 - h * 0.9 * ease(0.38 / 0.45) - H * 0.5, Math.min(1, (p - 0.38) / 0.6), 1.6); return label(ctx, w, h, 'MISS · anomaly: later gates slip', o); }
      if (p < 0.5) { X.starship(ctx, w * 0.5, h * 0.86 - up, H, 'stack'); if (p > 0.02) flame(ctx, w * 0.5, h * 0.86 - up, H * 0.25, H * 0.03); }
      if (o === 'bull' && p >= 0.5) { // booster returns to the tower chopsticks
        const k = ease((p - 0.5) / 0.45), by = -h * 0.2 + k * (h * 0.86 + h * 0.2 - h * 0.08); ctx.save(); ctx.translate(w * 0.5 + (1 - k) * 40, by); ctx.beginPath(); ctx.rect(-H, -H * 0.57, 2 * H, H * 0.6); ctx.clip(); X.starship(ctx, 0, 0, H, 'stack'); ctx.restore();
        if (k < 1) flame(ctx, w * 0.5 + (1 - k) * 40, by, H * 0.12, H * 0.025);
        if (k >= 1) X.glow(ctx, tx, h * 0.86 - H * 0.46, 50, 'rgba(80,255,170,.45)');
        return label(ctx, w, h, k >= 1 ? 'BULL · caught at the tower' : 'BULL · coming home', o);
      }
      if (o === 'neutral' && p >= 0.5) { const k = ease((p - 0.5) / 0.5); X.ground(ctx, w, h, h * 0.86, '#123a55', '#06141f', 2, 3); for (let i = 0; i < 20; i++) { const a = i / 20 * 3.14; ctx.fillStyle = 'rgba(255,255,255,' + (0.8 - k * 0.7) + ')'; ctx.beginPath(); ctx.arc(w * 0.5 + Math.cos(a) * k * 90, h * 0.86 - Math.sin(a) * k * 40, 3, 0, 6.28); ctx.fill(); } return label(ctx, w, h, 'NEUTRAL · clean flight, ocean splashdown', o); }
      label(ctx, w, h, 'Liftoff', o);
    },
    datacenter(ctx, w, h, t, p, o) {
      S.datacenter(ctx, w, h, t);
      if (o === 'bull') { ctx.fillStyle = 'rgba(54,211,153,' + (0.18 * ease(p)) + ')'; ctx.fillRect(0, 0, w, h); dollars(ctx, w, h, t, true, '#7dffc6'); }
      if (o === 'miss') { ctx.fillStyle = 'rgba(0,0,0,' + (0.6 * ease(p)) + ')'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(255,60,60,' + (0.25 * ease(p)) + ')'; ctx.fillRect(0, 0, w, h); dollars(ctx, w, h, t, false, '#ff8b8b'); }
      label(ctx, w, h, { bull: 'BULL · full capacity rented', neutral: 'NEUTRAL · contracts keep running', miss: 'MISS · racks go idle, re-let cheaper' }[o], o);
    },
    chart(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#03060c', '#0b1622'); ctx.strokeStyle = 'rgba(120,180,255,.08)'; for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const slope = { bull: -0.5, neutral: 0, miss: 0.45 }[o], r = X.rng(21); let y = h * 0.55; ctx.beginPath(); ctx.moveTo(0, y); const n = Math.floor(ease(p) * w);
      for (let x = 0; x <= n; x += 10) { y = h * 0.55 + slope * x * (h / w) + (r() - 0.5) * 14; ctx.lineTo(x, y); }
      ctx.strokeStyle = C[o]; ctx.lineWidth = 3; ctx.shadowColor = C[o]; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
      label(ctx, w, h, { bull: 'BULL · AI revenue beats', neutral: 'NEUTRAL · in line', miss: 'MISS · AI revenue under $5B' }[o], o);
    },
    vault(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#080a10', '#141a24'); X.stars(ctx, w, h, 9, 60, t);
      const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.3, open = o === 'miss' ? ease(p) : o === 'neutral' ? 0.3 * ease(p) : 0;
      X.glow(ctx, cx, cy, R * 1.6, 'rgba(255,190,90,.15)'); ctx.fillStyle = '#05070a'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
      ctx.save(); ctx.translate(cx - R * open * 1.2, cy); ctx.scale(1 - open * 0.7, 1); ctx.fillStyle = '#20262f'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#c9a85a'; ctx.lineWidth = R * 0.05; ctx.stroke(); ctx.lineWidth = R * 0.018; ctx.rotate(t * 0.0004); for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.7, 0); ctx.stroke(); } ctx.restore();
      const r = X.rng(4), n = 70; for (let i = 0; i < n; i++) { const a = r() * 6.283, d0 = R * (1.1 + r() * 1.6); let d;
        if (o === 'bull') d = d0 * (1 - ease(p)) + R * 0.2; else d = R * 0.3 + (d0 - R * 0.3) * ease(p) * (o === 'miss' ? 1.6 : 0.6);
        ctx.fillStyle = o === 'miss' ? 'rgba(255,100,100,.8)' : o === 'bull' ? 'rgba(120,255,190,.8)' : 'rgba(246,196,83,.7)'; ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d + (o === 'miss' ? ease(p) * 60 : 0), 9, 4); }
      label(ctx, w, h, { bull: 'BULL · supply absorbed', neutral: 'NEUTRAL · some selling, range holds', miss: 'MISS · shares flood out, below $135' }[o], o);
    },
    chips(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#020a06', '#06180f'); const cs = Math.min(w, h) * 0.55, cx = w / 2 - cs / 2, cy = h / 2 - cs / 2, lit = { bull: 36, neutral: 18, miss: 4 }[o];
      X.glow(ctx, w / 2, h / 2, cs, 'rgba(60,255,160,' + (o === 'miss' ? .05 : .2) + ')'); ctx.fillStyle = '#0d1d16'; ctx.fillRect(cx, cy, cs, cs); ctx.strokeStyle = o === 'miss' ? '#7a3a3a' : '#4fe3a1'; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, cs, cs);
      for (let i = 0; i < 36; i++) { const on = i < lit * ease(p); ctx.fillStyle = on ? (o === 'miss' ? 'rgba(255,107,107,.8)' : 'rgba(79,227,161,.9)') : 'rgba(79,227,161,.12)'; ctx.fillRect(cx + cs * 0.1 + (i % 6) * cs * 0.135, cy + cs * 0.1 + Math.floor(i / 6) * cs * 0.135, cs * 0.1, cs * 0.1); }
      if (o === 'miss') { ctx.fillStyle = 'rgba(255,107,107,.85)'; const r = X.rng(2); for (let i = 0; i < 30 * ease(p); i++) ctx.fillRect(r() * w, r() * h, 10, 4); }
      label(ctx, w, h, { bull: 'BULL · financed, online, rented', neutral: 'NEUTRAL · build slips a few quarters', miss: 'MISS · funded with new shares' }[o], o);
    },
    orbit(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#000', '#020814'); X.stars(ctx, w, h, 31, 0, t); X.earthLimb(ctx, w, h, h * 1.75, h * 1.15);
      const sx = w * 0.2, sy = h * 0.34; const n = { bull: 30, neutral: 8, miss: 0 }[o];
      for (let i = 0; i < n; i++) { const k = ease(p * 1.3 - i / n * 0.6); if (k <= 0) continue; X.satellite(ctx, sx + k * (w * 0.7) * (0.3 + (i % 10) / 12), sy + (i % 5) * 9 - k * 20 + Math.floor(i / 10) * 14, 1, 0.2); }
      if (o === 'miss') { ctx.save(); ctx.translate(sx + p * w * 0.3, sy + p * h * 0.25); ctx.rotate(p * 4); X.starship(ctx, 0, h * 0.15, h * 0.3, 'ship'); ctx.restore(); }
      else X.starship(ctx, sx, sy + h * 0.15, h * 0.3, 'ship');
      label(ctx, w, h, { bull: 'BULL · V3 satellites stream out', neutral: 'NEUTRAL · a few deploy, slow cadence', miss: 'MISS · no deployment this year' }[o], o);
    },
    moon(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#000', '#05060a'); X.stars(ctx, w, h, 41, 0, t);
      X.glow(ctx, w * 0.2, h * 0.2, h * 0.14, 'rgba(90,170,255,.3)'); ctx.fillStyle = '#2a6fc2'; ctx.beginPath(); ctx.arc(w * 0.2, h * 0.2, h * 0.08, 0, 6.28); ctx.fill();
      X.ground(ctx, w, h, h * 0.72, '#9b9ea3', '#3a3c40', 8, 8);
      const H = h * 0.42, lx = w * 0.6, gy = h * 0.8;
      if (o === 'neutral') { const a = t * 0.0012; ctx.save(); ctx.translate(lx + Math.cos(a) * w * 0.25, h * 0.3 + Math.sin(a) * h * 0.06); ctx.rotate(1.57); X.starship(ctx, 0, 0, H * 0.6, 'ship'); ctx.restore(); return label(ctx, w, h, 'NEUTRAL · test in 2027, landing slips to 2028', o); }
      const y = -H + ease(p / 0.8) * (gy + H); ctx.save();
      if (o === 'miss' && p > 0.8) { ctx.translate(lx, gy); ctx.rotate(Math.min(1.4, (p - 0.8) * 6)); X.starship(ctx, 0, 0, H, 'ship'); ctx.restore(); fireball(ctx, lx + 30, gy - 10, Math.min(1, (p - 0.8) * 4), 1.2); return label(ctx, w, h, 'MISS · transfer test fails, timeline resets', o); }
      ctx.restore(); X.starship(ctx, lx, Math.min(gy, y), H, 'ship'); if (p < 0.8) flame(ctx, lx, Math.min(gy, y), H * 0.12, H * 0.03);
      if (p >= 0.8) { ctx.fillStyle = 'rgba(200,200,205,' + (1 - (p - 0.8) * 5) + ')'; for (let i = 0; i < 30; i++) { const a = i / 30 * 3.14; ctx.beginPath(); ctx.arc(lx + Math.cos(a) * 60 * (p - 0.7) * 5, gy - Math.sin(a) * 18, 4, 0, 6.28); ctx.fill(); } }
      label(ctx, w, h, o === 'bull' ? (p >= 0.8 ? 'BULL · Starship on the Moon' : 'BULL · descending') : 'MISS', o);
    },
    dyson(ctx, w, h, t, p, o) {
      X.sky(ctx, w, h, '#000', '#07020f'); X.stars(ctx, w, h, 61, 0, t); const cx = w / 2, cy = h / 2; X.glow(ctx, cx, cy, h * 0.5, 'rgba(255,190,90,.3)'); X.glow(ctx, cx, cy, h * 0.11, 'rgba(255,250,220,1)');
      const frac = { bull: 1, neutral: 0.08, miss: 0.3 }[o] * (o === 'miss' ? 1 - ease(p) : ease(p));
      for (let ring = 0; ring < 4; ring++) { const R = h * (0.2 + ring * 0.08), n = 40 + ring * 18; for (let i = 0; i < n * frac; i++) { const a = i / n * 6.283 + t * 0.00012 * (ring % 2 ? -1 : 1); const x = cx + Math.cos(a) * R * 1.8, y = cy + Math.sin(a) * R * (0.28 + ring * 0.07) * 1.4; ctx.fillStyle = o === 'miss' ? 'rgba(160,160,170,.6)' : 'rgba(120,190,255,.95)'; ctx.fillRect(x - 3, y - 1, 6, 2.4); } }
      label(ctx, w, h, { bull: 'BULL · compute satellites deploy (from 2028)', neutral: 'NEUTRAL · prototypes only', miss: 'MISS · stays a slide' }[o], o);
    },
    spectrum(ctx, w, h, t, p, o) { S.spectrum(ctx, w, h, t); label(ctx, w, h, o.toUpperCase(), o); }
  };
  OV.refuel = OV.moon;

  /* ---------- big endings ---------- */
  function domes(ctx, w, h, x0, y, n, col) { for (let i = 0; i < n; i++) { const x = w * (x0 + i * 0.07), r = h * 0.065; const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.6, 2, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 3.14, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(255,220,140,.9)'; ctx.fillRect(x - 3, y - 6, 6, 6); } }
  function solar(ctx, w, h, x0, y, n) { for (let i = 0; i < n; i++) { const x = w * (x0 + i * 0.045); ctx.fillStyle = '#555'; ctx.fillRect(x + 8, y, 2, 12); ctx.fillStyle = '#1d3f73'; ctx.fillRect(x, y - 8, w * 0.035, 9); ctx.strokeStyle = 'rgba(150,200,255,.5)'; ctx.strokeRect(x, y - 8, w * 0.035, 9); } }
  function worker(ctx, x, y, s, t, i, range, carry) { const ph = t * 0.0011 + i * 1.7, dx = Math.sin(ph) * range; X.robot(ctx, x + dx, y, s, t * 0.012 + i); if (carry) { ctx.fillStyle = '#c8873a'; ctx.fillRect(x + dx - 7 * s, y - 30 * s, 14 * s, 9 * s); ctx.strokeStyle = '#6b4519'; ctx.strokeRect(x + dx - 7 * s, y - 30 * s, 14 * s, 9 * s); } }
  function rover(ctx, x, y, s) { ctx.fillStyle = '#d8dde2'; ctx.fillRect(x - 18 * s, y - 14 * s, 36 * s, 9 * s); ctx.fillStyle = '#222'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(x + i * 13 * s, y - 3 * s, 4.5 * s, 0, 6.28); ctx.fill(); } }
  function marsEnding(ctx, w, h, t) {
    X.sky(ctx, w, h, '#1d0c08', '#d28356'); X.stars(ctx, w, h * 0.35, 51, 90, t);
    X.glow(ctx, w * 0.82, h * 0.16, h * 0.08, 'rgba(255,240,210,.7)');
    // compute swarm around the distant Sun
    for (let ring = 0; ring < 2; ring++) { const R = h * (0.06 + ring * 0.03), n = 24 + ring * 10; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + t * 0.0003 * (ring ? -1 : 1); ctx.fillStyle = Math.sin(a) > 0 ? 'rgba(170,220,255,.95)' : 'rgba(170,220,255,.35)'; ctx.fillRect(w * 0.82 + Math.cos(a) * R * 2.4 - 2, h * 0.16 + Math.sin(a) * R * 0.5 - 1, 4, 2); } }
    ctx.fillStyle = 'rgba(80,30,20,.55)'; ctx.beginPath(); ctx.moveTo(0, h * 0.55); for (let x = 0; x <= w; x += w / 10) ctx.lineTo(x, h * 0.5 + Math.sin(x * 0.012) * h * 0.06); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    X.ground(ctx, w, h, h * 0.66, '#b4552c', '#4a1c0c', 12, 14);
    // landed Starships
    [[0.64, 0.8, 0.95], [0.77, 0.77, 0.8], [0.92, 0.81, 1.0]].forEach(s => { ctx.fillStyle = 'rgba(40,15,8,.4)'; ctx.beginPath(); ctx.ellipse(w * s[0], h * s[1], h * 0.07, 7, 0, 0, 6.28); ctx.fill(); X.starship(ctx, w * s[0], h * s[1], h * s[2], 'ship'); });
    // one Starship landing now (loops)
    const cyc = (t % 9000) / 9000, ly = -h * 0.4 + Math.min(1, cyc / 0.7) * (h * 0.78 + h * 0.4); X.starship(ctx, w * 0.47, Math.min(h * 0.78, ly), h * 0.8, 'ship');
    if (cyc < 0.7) { flame(ctx, w * 0.47, ly, h * 0.14, h * 0.022); ctx.fillStyle = '#fff'; ctx.font = '600 12px system-ui'; ctx.fillText('landing burn', w * 0.47 + 18, ly - h * 0.1); } else { ctx.fillStyle = 'rgba(210,130,90,' + (1 - (cyc - 0.7) * 3) + ')'; for (let i = 0; i < 24; i++) { const a = i / 24 * 3.14; ctx.beginPath(); ctx.arc(w * 0.47 + Math.cos(a) * (cyc - 0.65) * 400, h * 0.78 - Math.sin(a) * 14, 4, 0, 6.28); ctx.fill(); } }
    domes(ctx, w, h, 0.08, h * 0.86, 4, '#e6d8cc'); solar(ctx, w, h, 0.05, h * 0.74, 6); rover(ctx, w * 0.36, h * 0.9, 1.4);
    for (let i = 0; i < 8; i++) worker(ctx, w * (0.1 + i * 0.07), h * (0.92 + (i % 2) * 0.04), h / 480, t, i, 22, i % 2 === 0);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '12px system-ui'; ctx.fillText("Illustrative of Elon's vision coming true, not timeline consistent.", 12, h - 10);
  }
  function moonEnding(ctx, w, h, t) {
    X.sky(ctx, w, h, '#000', '#05060a'); X.stars(ctx, w, h, 41, 0, t);
    const ex = w * 0.78, ey = h * 0.2, er = h * 0.1; X.glow(ctx, ex, ey, er * 1.7, 'rgba(90,170,255,.35)'); ctx.fillStyle = '#2a6fc2'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(ex - er * 0.2, ey - er * 0.2, er * 0.4, er * 0.15, 0.4, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.arc(ex + er * 0.5, ey, er, 0, 6.28); ctx.fill();
    X.ground(ctx, w, h, h * 0.66, '#a3a6ab', '#3a3c40', 8, 9);
    const r = X.rng(4); for (let i = 0; i < 20; i++) { const x = r() * w, y = h * 0.7 + r() * h * 0.3, rr = 6 + r() * 22; ctx.fillStyle = 'rgba(40,42,46,.4)'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.3, 0, 0, 6.28); ctx.fill(); }
    X.starship(ctx, w * 0.64, h * 0.8, h * 0.95, 'ship'); X.starship(ctx, w * 0.86, h * 0.78, h * 0.8, 'ship');
    domes(ctx, w, h, 0.1, h * 0.84, 3, '#d9dde2'); solar(ctx, w, h, 0.08, h * 0.72, 7); rover(ctx, w * 0.42, h * 0.9, 1.4);
    for (let i = 0; i < 7; i++) worker(ctx, w * (0.1 + i * 0.075), h * (0.92 + (i % 2) * 0.04), h / 480, t, i, 20, i % 2 === 1);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '12px system-ui'; ctx.fillText('THE MOON · illustration: Starship landers, base, generic humanoid robots at work', 12, h - 10);
  }
  function launcherEnding(ctx, w, h, t) { // Moon base + lunar mass driver (electromagnetic launcher)
    X.sky(ctx, w, h, '#000', '#05060a'); X.stars(ctx, w, h, 43, 0, t);
    const ex = w * 0.16, ey = h * 0.17, er = h * 0.085; X.glow(ctx, ex, ey, er * 1.7, 'rgba(90,170,255,.35)'); ctx.fillStyle = '#2a6fc2'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.arc(ex + er * 0.5, ey, er, 0, 6.28); ctx.fill();
    // satellites already flung into orbit
    const r0 = X.rng(12); for (let i = 0; i < 22; i++) { const a = r0() * 6.28 + t * 0.00008; X.satellite(ctx, w * (0.35 + 0.6 * r0()) + Math.cos(a) * 6, h * (0.06 + 0.22 * r0()), 0.6, a); }
    X.ground(ctx, w, h, h * 0.62, '#a3a6ab', '#3a3c40', 5, 7);
    const r = X.rng(7); for (let i = 0; i < 16; i++) { const x = r() * w, y = h * 0.66 + r() * h * 0.3, rr = 6 + r() * 20; ctx.fillStyle = 'rgba(40,42,46,.4)'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.3, 0, 0, 6.28); ctx.fill(); }
    // the rail: from a loading station (lower left) rising to the muzzle (upper right)
    const x0 = w * 0.27, y0 = h * 0.8, x1 = w * 0.985, y1 = h * 0.47, L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    for (let k = 0; k <= 14; k++) { const px = x0 + (x1 - x0) * k / 14, py = y0 + (y1 - y0) * k / 14, base = Math.min(h * 0.97, py + h * (0.05 + 0.25 * k / 14)); ctx.strokeStyle = '#4b5159'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px - 6, base); ctx.moveTo(px, py + 4); ctx.lineTo(px + 6, base); ctx.stroke(); }
    ctx.strokeStyle = '#cfd6dd'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0 + 5); ctx.lineTo(x1, y1 + 5); ctx.stroke();
    // coil rings pulsing along the rail
    const n = 40; for (let i = 0; i < n; i++) { const f = i / n, px = x0 + (x1 - x0) * f, py = y0 + (y1 - y0) * f, on = 0.25 + 0.75 * Math.max(0, Math.cos((f * 6 - t * 0.004) * 3.14)); ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(uy, ux)); ctx.strokeStyle = 'rgba(90,220,255,' + on.toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 9, 0, 0, 6.28); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#6b737c'; ctx.fillRect(x0 - 40, y0 - 18, 46, 30); ctx.fillStyle = 'rgba(90,220,255,.8)'; ctx.fillRect(x0 - 34, y0 - 12, 34, 3);
    // compact boxy satellites: ride a sled up the rail with wings folded, leave the muzzle, unfold solar wings, and curve up into orbit
    const sat = (px, py, rot, unf, sc, al) => { ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = al;
      const span = 4 + 26 * unf, ph = 3 + 5 * unf; // wing length grows as the panels unfold
      ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6 - span * 0.15, 0); ctx.moveTo(6, 0); ctx.lineTo(6 + span * 0.15, 0); ctx.stroke();
      [-1, 1].forEach(sd => { const x = sd < 0 ? -6 - span * 0.15 - span : 6 + span * 0.15; ctx.fillStyle = '#1d3f73'; ctx.fillRect(x, -ph / 2, span, ph); ctx.strokeStyle = '#5b86c4'; ctx.lineWidth = 0.6; for (let c = 1; c < 4 * unf + 1; c++) { const cx = x + span * c / (4 * unf + 1); ctx.beginPath(); ctx.moveTo(cx, -ph / 2); ctx.lineTo(cx, ph / 2); ctx.stroke(); } });
      ctx.fillStyle = '#d9dee4'; ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#c9a646'; ctx.fillRect(-6, -6, 12, 4); ctx.strokeStyle = '#7d858e'; ctx.lineWidth = 1; ctx.strokeRect(-6, -6, 12, 12);
      ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.arc(0, -8, 2.2, 3.14, 6.28); ctx.fill(); ctx.restore(); };
    const rot = Math.atan2(uy, ux);
    for (let j = 0; j < 3; j++) { const ph = ((t / 3600) + j / 3) % 1;
      if (ph < 0.55) { const d = Math.pow(ph / 0.55, 2) * L, px = x0 + ux * d, py = y0 + uy * d;
        ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.fillStyle = '#5a626b'; ctx.fillRect(-10, 2, 20, 4); ctx.restore(); // sled on the rail
        sat(px + uy * 12, py - ux * 12, rot, 0, 1.5, 1); }
      else { const q = (ph - 0.55) / 0.45, unf = Math.min(1, q * 2.2);
        const pos = qq => ({ x: x1 - 6 + ux * qq * w * 0.05 - qq * qq * w * 0.42, y: y1 - 14 + uy * qq * w * 0.05 - (1 - (1 - qq) * (1 - qq)) * h * 0.36 });
        // faint dotted orbit track (no plume): the path it has already travelled
        ctx.fillStyle = 'rgba(170,220,255,.45)'; for (let k = 0; k < 16; k++) { const qq = q * k / 16, pp = pos(qq); ctx.fillRect(pp.x, pp.y, 1.5, 1.5); }
        const pp = pos(q); sat(pp.x, pp.y, rot * (1 - q), unf, 1.6 - q * 0.9, 1 - Math.max(0, q - 0.75) * 3); } }
    X.glow(ctx, x1, y1, 14, 'rgba(120,230,255,.35)');
    domes(ctx, w, h, 0.03, h * 0.88, 3, '#d9dde2'); solar(ctx, w, h, 0.02, h * 0.74, 5);
    for (let i = 0; i < 6; i++) worker(ctx, w * (0.05 + i * 0.06), h * (0.93 + (i % 2) * 0.04), h / 480, t, i, 16, i % 2 === 0);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '12px system-ui'; ctx.fillText('THE MOON · illustration: a mass driver flings compact satellites; they unfold solar wings on the way to orbit; generic robots', 12, h - 10);
  }
  function orbitEnding(ctx, w, h, t) { OV.orbit(ctx, w, h, t, ((t % 6000) / 6000), 'bull'); }
  function splashEnding(ctx, w, h, t) { S.splash(ctx, w, h, t); }
  let boomState = null;
  function explodeEnding(ctx, w, h, t) {
    X.sky(ctx, w, h, '#02030a', '#1a0d12'); X.stars(ctx, w, h, 5, 0, t); const cyc = t % 8000, cx = w * 0.5, cy = h * 0.42;
    if (cyc < 1000) { X.starship(ctx, cx, cy + 150 - cyc * 0.12, h * 0.42, 'stack'); flame(ctx, cx, cy + 150 - cyc * 0.12, h * 0.08, h * 0.012); boomState = null; return; }
    if (!boomState) { boomState = { F: Array.from({ length: 18 }, () => ({ a: Math.random() * 6.283, s: 0.5 + Math.random() * 2.2, r: Math.random() * 6, vr: (Math.random() - .5) * .15, w: 6 + Math.random() * 18, h: 3 + Math.random() * 6 })), P: Array.from({ length: 260 }, () => ({ a: Math.random() * 6.283, s: 0.8 + Math.random() * 5 })) }; }
    const e = (cyc - 1000) / 1000, k = Math.min(1, e / 4); fireball(ctx, cx, cy, k * 0.85, 2.4);
    ctx.strokeStyle = 'rgba(220,210,200,' + (0.35 * (1 - k)).toFixed(2) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, cy, 60 + e * 130, 20 + e * 36, 0, 0, 6.283); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; boomState.P.forEach(p => { const d = p.s * e * 60; ctx.fillStyle = 'rgba(255,' + Math.round(110 + 120 * (1 - k)) + ',60,' + (1 - k).toFixed(2) + ')'; ctx.fillRect(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d + e * e * 8, 3, 3); }); ctx.globalCompositeOperation = 'source-over';
    boomState.F.forEach(q => { const d = q.s * e * 60; ctx.save(); ctx.translate(cx + Math.cos(q.a) * d, cy + Math.sin(q.a) * d + e * e * 6); ctx.rotate(q.r + q.vr * e * 60); ctx.fillStyle = '#b9c0c7'; ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); ctx.fillStyle = '#4b5157'; ctx.fillRect(-q.w / 2, -q.h / 2, q.w * 0.3, q.h); ctx.restore(); });
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, e / 1.5).toFixed(2) + ')'; ctx.font = '600 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Rapid unscheduled disassembly. The data is still useful.', cx, h * 0.1); ctx.textAlign = 'left';
  }
  const ENDS = { mars: marsEnding, launcher: launcherEnding, moon: moonEnding, orbit: orbitEnding, splash: splashEnding, explode: explodeEnding };

  /* ---------- canvas runners ---------- */
  function fit(cv) { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.max(10, cv.clientWidth * dpr); cv.height = Math.max(10, cv.clientHeight * dpr); return dpr; }
  function run(cv, draw) { if (cv._raf) cancelAnimationFrame(cv._raf); const dpr = fit(cv), ctx = cv.getContext('2d'); const t0 = performance.now();
    function f(now) { if (!cv.isConnected) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(ctx, cv.clientWidth, cv.clientHeight, now - t0); cv._raf = requestAnimationFrame(f); } cv._raf = requestAnimationFrame(f); }
  window.Anim = {
    OV, ENDS,
    outcome(cv, theme, o, ms, done) { const f = OV[theme] || OV.orbit; let fired = false; ms = ms || 2200;
      run(cv, (ctx, w, h, t) => { const p = Math.min(1, t / ms); f(ctx, w, h, t, p, o); if (p >= 1 && !fired) { fired = true; done && done(); } }); },
    resetBoom() { boomState = null; },
    ending(cv, k) { run(cv, (ctx, w, h, t) => ENDS[k](ctx, w, h, t)); },
    run
  };
})();
