/* Procedural canvas scenes. Original art, no external images, no logos. */
(function () {
  'use strict';
  function rng(seed) { let s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

  function sky(ctx, w, h, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function stars(ctx, w, h, seed, n, t) {
    const r = rng(seed); n = n || Math.floor(w * h / 1800);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, s = r() * 1.4 + 0.2, ph = r() * 6.28;
      const a = 0.35 + 0.65 * Math.abs(Math.sin((t || 0) * 0.0015 + ph));
      ctx.fillStyle = 'rgba(255,255,255,' + (a * (0.4 + s / 2)).toFixed(3) + ')';
      ctx.fillRect(x, y, s, s);
    }
  }
  function glow(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }

  /* Starship stack drawn with its base at (x,y), height H. part: 'stack' | 'ship' */
  function starship(ctx, x, y, H, part) {
    const W = H * 0.075; ctx.save(); ctx.translate(x, y);
    const steel = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
    steel.addColorStop(0, '#6d747c'); steel.addColorStop(0.35, '#e9edf1'); steel.addColorStop(0.6, '#b9c0c7'); steel.addColorStop(1, '#4b5157');
    let top = 0;
    if (part !== 'ship') {
      const bh = H * 0.56; ctx.fillStyle = steel; ctx.fillRect(-W / 2, -bh, W, bh);
      ctx.fillStyle = '#2b2f33'; ctx.fillRect(-W / 2, -bh * 0.08, W, bh * 0.08);
      ctx.fillStyle = '#9aa1a8'; // grid fins
      ctx.fillRect(-W / 2 - W * 0.28, -bh + W * 0.15, W * 0.28, W * 0.5); ctx.fillRect(W / 2, -bh + W * 0.15, W * 0.28, W * 0.5);
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-W / 2, -bh * i / 8); ctx.lineTo(W / 2, -bh * i / 8); ctx.stroke(); }
      top = -bh;
      ctx.fillStyle = '#3a3f44'; ctx.fillRect(-W / 2, top - H * 0.012, W, H * 0.012); top -= H * 0.012;
    }
    const sh = H * 0.43; const cyl = sh * 0.68;
    ctx.fillStyle = steel; ctx.fillRect(-W / 2, top - cyl, W, cyl);
    // heat shield side
    ctx.fillStyle = 'rgba(20,22,26,.85)'; ctx.fillRect(-W / 2, top - cyl, W * 0.32, cyl);
    ctx.beginPath(); ctx.moveTo(-W / 2, top - cyl);
    ctx.bezierCurveTo(-W / 2, top - cyl - sh * 0.22, -W * 0.12, top - sh, 0, top - sh);
    ctx.bezierCurveTo(W * 0.12, top - sh, W / 2, top - cyl - sh * 0.22, W / 2, top - cyl); ctx.closePath(); ctx.fillStyle = steel; ctx.fill();
    // flaps
    ctx.fillStyle = '#2b2f33';
    ctx.beginPath(); ctx.moveTo(-W / 2, top - W * 0.2); ctx.lineTo(-W / 2 - W * 0.32, top - W * 0.35); ctx.lineTo(-W / 2 - W * 0.32, top - W * 1.25); ctx.lineTo(-W / 2, top - W * 1.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W / 2, top - W * 0.2); ctx.lineTo(W / 2 + W * 0.32, top - W * 0.35); ctx.lineTo(W / 2 + W * 0.32, top - W * 1.25); ctx.lineTo(W / 2, top - W * 1.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-W / 2, top - cyl - sh * 0.05); ctx.lineTo(-W / 2 - W * 0.22, top - cyl + W * 0.2); ctx.lineTo(-W / 2, top - cyl + W * 0.6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W / 2, top - cyl - sh * 0.05); ctx.lineTo(W / 2 + W * 0.22, top - cyl + W * 0.2); ctx.lineTo(W / 2, top - cyl + W * 0.6); ctx.fill();
    ctx.restore();
    return W;
  }

  function tower(ctx, x, base, H) {
    ctx.save(); ctx.strokeStyle = '#1b1f24'; ctx.fillStyle = '#14181c'; const w = H * 0.08;
    ctx.fillRect(x - w / 2, base - H, w, H);
    ctx.strokeStyle = 'rgba(120,130,140,.35)'; ctx.lineWidth = 1;
    for (let y = base; y > base - H; y -= w) { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y - w); ctx.moveTo(x + w / 2, y); ctx.lineTo(x - w / 2, y - w); ctx.stroke(); }
    ctx.fillStyle = '#1b2026'; ctx.fillRect(x + w / 2, base - H * 0.78, H * 0.16, H * 0.02); ctx.fillRect(x + w / 2, base - H * 0.62, H * 0.16, H * 0.02); // chopsticks
    ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(x, base - H - 3, 2.2, 0, 6.28); ctx.fill();
    ctx.restore();
  }

  function robot(ctx, x, y, s, pose) { // sleek generic humanoid, base at (x,y); no logos
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const sw = Math.sin(pose || 0) * 4, pulse = 0.65 + 0.35 * Math.sin((pose || 0) * 0.7);
    const metal = ctx.createLinearGradient(-8, 0, 8, 0); metal.addColorStop(0, '#59626c'); metal.addColorStop(0.35, '#f5f8fb'); metal.addColorStop(0.6, '#b4bec8'); metal.addColorStop(1, '#3a4149');
    const dark = '#161a20', glow = 'rgba(90,220,255,' + pulse.toFixed(2) + ')';
    ctx.lineCap = 'round';
    function limb(x1, y1, x2, y2, x3, y3, w) { ctx.strokeStyle = dark; ctx.lineWidth = w + 1.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke(); ctx.strokeStyle = metal; ctx.lineWidth = w; ctx.stroke(); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x2, y2, 0.9, 0, 6.28); ctx.fill(); }
    // legs (thigh, shin) and arms
    limb(-2.8, -18, -3.6 - sw * 0.25, -9, -3.8 - sw * 0.45, 0, 3);
    limb(2.8, -18, 3.6 + sw * 0.25, -9, 3.8 + sw * 0.45, 0, 3);
    ctx.fillStyle = dark; ctx.fillRect(-6.2 - sw * 0.45, -1.2, 4.6, 1.6); ctx.fillRect(1.6 + sw * 0.45, -1.2, 4.6, 1.6);
    limb(-6.5, -33, -8.3 + sw * 0.4, -26, -8.6 + sw * 0.6, -20, 2.4);
    limb(6.5, -33, 8.3 - sw * 0.4, -26, 8.6 - sw * 0.6, -20, 2.4);
    // torso: tapered, metallic, with a dark waist band
    ctx.beginPath(); ctx.moveTo(-7, -35); ctx.quadraticCurveTo(0, -37.5, 7, -35); ctx.lineTo(4.6, -22); ctx.quadraticCurveTo(0, -20.5, -4.6, -22); ctx.closePath(); ctx.fillStyle = metal; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-4.8, -22.5); ctx.lineTo(4.8, -22.5); ctx.lineTo(4, -18); ctx.lineTo(-4, -18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#20262e'; ctx.beginPath(); ctx.ellipse(-7, -34, 2.6, 1.8, 0, 0, 6.28); ctx.ellipse(7, -34, 2.6, 1.8, 0, 0, 6.28); ctx.fill();
    // light accents: chest core and seam lines
    ctx.save(); ctx.shadowColor = '#5ad8ff'; ctx.shadowBlur = 6; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, -30, 1.3, 0, 6.28); ctx.fill();
    ctx.fillRect(-0.3, -28, 0.6, 5); ctx.fillRect(-4.2, -21.2, 8.4, 0.7);
    ctx.restore();
    // neck + head: smooth capsule, glossy, with a glowing visor strip
    ctx.fillStyle = dark; ctx.fillRect(-1.4, -38.6, 2.8, 2.4);
    const hg = ctx.createRadialGradient(-1.6, -44.5, 0.5, 0, -42, 6); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.5, '#c4ccd4'); hg.addColorStop(1, '#4a525b');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, -42.2, 4.2, 5.2, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#05070a'; ctx.beginPath(); ctx.ellipse(0, -42.4, 3.6, 1.6, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.shadowColor = '#5ad8ff'; ctx.shadowBlur = 8; ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, -42.4, 3.1, 0.55, 0, 0, 6.28); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-1.8, -45.4, 1.2, 0.6, -0.5, 0, 6.28); ctx.fill();
    ctx.restore();
  }

  function earthLimb(ctx, w, h, cy, R) {
    const cx = w / 2;
    glow(ctx, cx, cy, R * 1.08, 'rgba(90,170,255,.35)');
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#2f7fd1'); g.addColorStop(0.6, '#174a8a'); g.addColorStop(1, '#06162e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    const r = rng(77); ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 40; i++) { const a = r() * 3.14 + 3.14, d = R * (0.6 + r() * 0.38); ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.08 * r() + 4, R * 0.015 + 2, a, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = 'rgba(140,210,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 3.14, 6.283); ctx.stroke();
  }
  function satellite(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0); ctx.scale(s, s);
    ctx.fillStyle = '#cfd6dd'; ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = '#1d3f73'; ctx.fillRect(-16, -1.4, 12, 2.8); ctx.fillRect(4, -1.4, 12, 2.8);
    ctx.strokeStyle = 'rgba(160,200,255,.5)'; ctx.lineWidth = .4; ctx.strokeRect(-16, -1.4, 12, 2.8); ctx.strokeRect(4, -1.4, 12, 2.8);
    ctx.restore();
  }
  function ground(ctx, w, h, y0, c1, c2, seed, bumps) {
    const r = rng(seed); ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, y0);
    for (let x = 0; x <= w; x += w / 24) ctx.lineTo(x, y0 + Math.sin(x * 0.01 + seed) * bumps + r() * bumps * 0.5);
    ctx.lineTo(w, h); ctx.closePath();
    const g = ctx.createLinearGradient(0, y0, 0, h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill();
  }
  function craters(ctx, w, y0, h, seed, col) {
    const r = rng(seed); for (let i = 0; i < 26; i++) { const x = r() * w, y = y0 + 10 + r() * (h - y0), rr = 4 + r() * 26 * ((y - y0) / (h - y0) + 0.2);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.32, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(x, y - 1, rr, rr * 0.32, 0, 3.3, 6.1); ctx.stroke(); }
  }

  const S = {};
  S.launch = function (ctx, w, h, t) {
    sky(ctx, w, h, '#02040b', '#1b1030'); stars(ctx, w, h, 11, 0, t);
    glow(ctx, w * 0.5, h * 0.92, w * 0.5, 'rgba(255,140,60,.25)');
    ground(ctx, w, h, h * 0.86, '#0d0f14', '#050608', 3, 4);
    tower(ctx, w * 0.5 + h * 0.07, h * 0.86, h * 0.62);
    starship(ctx, w * 0.5, h * 0.86, h * 0.6, 'stack');
    glow(ctx, w * 0.5, h * 0.87, h * 0.08, 'rgba(255,220,160,.6)');
  };
  S.datacenter = function (ctx, w, h, t) {
    sky(ctx, w, h, '#020814', '#071a2c'); const vx = w / 2, vy = h * 0.42;
    ctx.strokeStyle = 'rgba(60,160,255,.12)'; for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + i * w * 0.12, h); ctx.stroke(); }
    for (let z = 0; z < 9; z++) { const k = Math.pow(1.38, z) / 20, y = vy + (h - vy) * k; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const r = rng(5);
    for (let side = -1; side <= 1; side += 2) for (let z = 8; z >= 0; z--) {
      const k = Math.pow(1.32, z) / 14, x = vx + side * w * (0.06 + k * 0.42), rh = h * k * 0.9, rw = w * k * 0.16;
      ctx.fillStyle = '#0b1320'; ctx.fillRect(x - rw / 2, vy + (h - vy) * k * 0.55 - rh, rw, rh);
      for (let j = 0; j < 14; j++) { const on = (Math.sin((t || 0) * 0.004 + r() * 30) > 0); ctx.fillStyle = on ? 'rgba(80,220,255,.9)' : 'rgba(40,255,160,.35)'; ctx.fillRect(x - rw * 0.38 + r() * rw * 0.7, vy + (h - vy) * k * 0.55 - rh + r() * rh, Math.max(1, rw * 0.05), Math.max(1, rh * 0.008)); }
    }
    glow(ctx, vx, vy, w * 0.35, 'rgba(60,140,255,.25)');
  };
  S.vault = function (ctx, w, h, t) {
    sky(ctx, w, h, '#080a10', '#141a24'); stars(ctx, w, h, 9, 60, t);
    const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.34;
    glow(ctx, cx, cy, R * 1.6, 'rgba(255,190,90,.18)');
    ctx.fillStyle = '#20262f'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#8a7346'; ctx.lineWidth = R * 0.06; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((t || 0) * 0.0003);
    ctx.strokeStyle = '#c9a85a'; ctx.lineWidth = R * 0.05; for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.7, 0); ctx.stroke(); }
    ctx.fillStyle = '#c9a85a'; ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, 6.28); ctx.fill(); ctx.restore();
    const r = rng(3); for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,210,120,' + (0.15 + r() * 0.5) + ')'; ctx.fillRect(r() * w, r() * h, 6, 3); }
  };
  S.chart = function (ctx, w, h, t) {
    sky(ctx, w, h, '#03060c', '#0b1622'); ctx.strokeStyle = 'rgba(120,180,255,.08)';
    for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const r = rng(21); let y = h * 0.7; ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 12) { y += (r() - 0.56) * 22; y = Math.max(h * 0.15, Math.min(h * 0.85, y)); ctx.lineTo(x, y); }
    ctx.strokeStyle = '#4fe3a1'; ctx.lineWidth = 2.5; ctx.shadowColor = '#4fe3a1'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
  };
  S.orbit = function (ctx, w, h, t) {
    sky(ctx, w, h, '#000', '#020814'); stars(ctx, w, h, 31, 0, t);
    earthLimb(ctx, w, h, h * 1.75, h * 1.15);
    const n = 16; for (let i = 0; i < n; i++) { const p = ((t || 0) * 0.00004 + i / n) % 1; satellite(ctx, w * (0.1 + p * 0.8), h * 0.35 + Math.sin(p * 3.14) * -h * 0.12 + i % 2 * 8, 0.9 + (i % 3) * 0.2, -0.2 + p * 0.4); }
    starship(ctx, w * 0.22, h * 0.36, h * 0.3, 'ship');
  };
  S.moon = function (ctx, w, h, t, opts) {
    sky(ctx, w, h, '#000', '#05060a'); stars(ctx, w, h, 41, 0, t);
    // Earth in sky
    const ex = w * 0.58, ey = h * 0.2, er = h * 0.09; glow(ctx, ex, ey, er * 1.6, 'rgba(90,170,255,.3)');
    ctx.fillStyle = '#2a6fc2'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.arc(ex + er * 0.45, ey, er, 0, 6.28); ctx.fill();
    ground(ctx, w, h, h * 0.68, '#9b9ea3', '#3a3c40', 8, 10); craters(ctx, w, h * 0.7, h, 4, 'rgba(40,42,46,.45)');
    starship(ctx, w * 0.86, h * 0.8, h * 0.55, 'ship');
    if (opts && opts.base) {
      ctx.fillStyle = '#cfd3d8'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w * (0.56 + i * 0.08), h * 0.8, h * 0.05, 3.14, 6.28); ctx.fill(); }
      ctx.fillStyle = '#1d3f73'; for (let i = 0; i < 5; i++) ctx.fillRect(w * (0.55 + i * 0.06), h * 0.66, w * 0.045, h * 0.03);
      for (let i = 0; i < 4; i++) robot(ctx, w * (0.6 + i * 0.07), h * (0.9 + (i % 2) * 0.04), h / 260, (t || 0) * 0.006 + i);
    }
  };
  S.mars = function (ctx, w, h, t, opts) {
    sky(ctx, w, h, '#1a0b08', '#c9774a'); stars(ctx, w, h * 0.4, 51, 80, t);
    glow(ctx, w * 0.7, h * 0.22, h * 0.12, 'rgba(255,240,210,.55)');
    ground(ctx, w, h, h * 0.62, '#b4552c', '#4a1c0c', 12, 18);
    ground(ctx, w, h, h * 0.74, '#8f3f1f', '#2e1007', 19, 10);
    starship(ctx, w * 0.88, h * 0.86, h * 0.6, 'ship');
    if (opts && opts.base) {
      ctx.fillStyle = 'rgba(240,230,220,.9)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w * (0.55 + i * 0.08), h * 0.86, h * 0.055, 3.14, 6.28); ctx.fill(); }
      ctx.fillStyle = '#1d3f73'; for (let i = 0; i < 6; i++) ctx.fillRect(w * (0.52 + i * 0.05), h * 0.75, w * 0.04, h * 0.025);
      for (let i = 0; i < 5; i++) robot(ctx, w * (0.58 + i * 0.065), h * (0.93 + (i % 2) * 0.03), h / 250, (t || 0) * 0.006 + i);
    }
  };
  S.dyson = function (ctx, w, h, t) {
    sky(ctx, w, h, '#000', '#07020f'); stars(ctx, w, h, 61, 0, t);
    const cx = w / 2, cy = h / 2; glow(ctx, cx, cy, h * 0.5, 'rgba(255,190,90,.35)'); glow(ctx, cx, cy, h * 0.12, 'rgba(255,250,220,1)');
    for (let ring = 0; ring < 4; ring++) {
      const R = h * (0.2 + ring * 0.08), n = 40 + ring * 18, tilt = 0.28 + ring * 0.07;
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + (t || 0) * 0.00012 * (ring % 2 ? -1 : 1) * (1 + ring * 0.2);
        const x = cx + Math.cos(a) * R * 1.8, y = cy + Math.sin(a) * R * tilt * 1.4, front = Math.sin(a) > 0;
        ctx.fillStyle = front ? 'rgba(120,190,255,.95)' : 'rgba(80,120,190,.5)'; ctx.fillRect(x - 3, y - 1, 6, 2.4); }
    }
  };
  S.chips = function (ctx, w, h, t) {
    sky(ctx, w, h, '#020a06', '#06180f'); const r = rng(14);
    const cs = Math.min(w, h) * 0.5, cx = w / 2 - cs / 2, cy = h / 2 - cs / 2;
    ctx.strokeStyle = 'rgba(80,255,170,.25)'; for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 200, y); ctx.lineTo(x + (r() - 0.5) * 200, y + (r() - 0.5) * 200); ctx.stroke(); }
    glow(ctx, w / 2, h / 2, cs, 'rgba(60,255,160,.22)');
    ctx.fillStyle = '#0d1d16'; ctx.fillRect(cx, cy, cs, cs); ctx.strokeStyle = '#4fe3a1'; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, cs, cs);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const on = Math.sin((t || 0) * 0.003 + i * 1.3 + j) > 0.2; ctx.fillStyle = on ? 'rgba(79,227,161,.8)' : 'rgba(79,227,161,.25)'; ctx.fillRect(cx + cs * 0.1 + i * cs * 0.135, cy + cs * 0.1 + j * cs * 0.135, cs * 0.1, cs * 0.1); }
  };
  S.spectrum = function (ctx, w, h, t) {
    sky(ctx, w, h, '#05020c', '#140a26'); stars(ctx, w, h, 71, 60, t);
    for (let k = 0; k < 7; k++) { ctx.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h * 0.5 + Math.sin(x * (0.01 + k * 0.004) + (t || 0) * 0.002 + k) * h * (0.05 + k * 0.025); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = 'hsla(' + (260 + k * 14) + ',90%,65%,.55)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    satellite(ctx, w * 0.75, h * 0.2, 2.2, 0.3);
  };
  S.refuel = function (ctx, w, h, t) {
    sky(ctx, w, h, '#000', '#020814'); stars(ctx, w, h, 81, 0, t); earthLimb(ctx, w, h, h * 1.9, h * 1.2);
    ctx.save(); ctx.translate(w * 0.5, h * 0.42); ctx.rotate(Math.PI / 2); starship(ctx, h * 0.02, 0, h * 0.5, 'ship'); ctx.restore();
    ctx.save(); ctx.translate(w * 0.5, h * 0.42); ctx.rotate(-Math.PI / 2); starship(ctx, h * 0.02, 0, h * 0.5, 'ship'); ctx.restore();
    glow(ctx, w * 0.5, h * 0.42, 14, 'rgba(160,220,255,.9)');
  };
  S.splash = function (ctx, w, h, t) {
    sky(ctx, w, h, '#0a1a2c', '#4a6e8c');
    ground(ctx, w, h, h * 0.68, '#1d4a6a', '#08202f', 2, 6);
    const p = ((t || 0) * 0.0004) % 1; ctx.save(); ctx.translate(w * 0.5, h * 0.66); ctx.rotate(1.2); starship(ctx, 0, h * 0.03, h * 0.4, 'ship'); ctx.restore();
    for (let i = 0; i < 40; i++) { const a = i / 40 * 3.14, d = 20 + p * 80; ctx.fillStyle = 'rgba(255,255,255,' + (0.7 - p * 0.6) + ')'; ctx.beginPath(); ctx.arc(w * 0.5 + Math.cos(a) * d * 1.8, h * 0.68 - Math.sin(a) * d * 0.6, 2.4, 0, 6.28); ctx.fill(); }
  };

  window.Scenes = { S: S, starship: starship, tower: tower, robot: robot, glow: glow, stars: stars, sky: sky, satellite: satellite, earthLimb: earthLimb, rng: rng, ground: ground };

  /* paint a scene into a canvas, optionally animating while it's in the DOM */
  window.paintScene = function (canvas, name, opts, animate) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { const r = canvas.getBoundingClientRect(); canvas.width = Math.max(10, r.width * dpr); canvas.height = Math.max(10, r.height * dpr); }
    size();
    const ctx = canvas.getContext('2d');
    function frame(t) {
      if (!canvas.isConnected) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.width / dpr, h = canvas.height / dpr;
      (S[name] || S.orbit)(ctx, w, h, t || 0, opts || {});
      if (animate) canvas._raf = requestAnimationFrame(frame);
    }
    if (canvas._raf) cancelAnimationFrame(canvas._raf);
    frame(0);
    if (animate) canvas._raf = requestAnimationFrame(frame);
  };
})();
