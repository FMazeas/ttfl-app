import { useEffect, useRef, useCallback } from 'react';
import './GameTab.css';

/* ═══════════════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════════════ */
const W = 800, H = 480, FLOOR_Y = 388;
const BALL_R = 18, GRAVITY = 0.38, POWER = 0.165, MAX_DRAG = 220;

const BACKBOARD_X = 698;
const RIM_FRONT_X = 634, RIM_BACK_X = 682, RIM_Y = 234;
const RIM_R = 7, NET_H = 64;
const THREE_PT_X = 398;           // left of this x → 3pts
const HI_KEY = 'ttfl_game_hi';

// Shooting positions (randomised each shot)
const POSITIONS = [
  { x: 118, pts: 3 },
  { x: 215, pts: 3 },
  { x: 440, pts: 2 },
  { x: 522, pts: 2 },
];

/* ═══════════════════════════════════════════════════════
   Drawing helpers (module-level, no React deps)
═══════════════════════════════════════════════════════ */

function drawBall(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
  g.addColorStop(0, '#ff9055');
  g.addColorStop(0.55, '#e05010');
  g.addColorStop(1, '#6b1800');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // Seams
  ctx.strokeStyle = 'rgba(0,0,0,0.48)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r, -0.4, Math.PI + 0.4); ctx.stroke();
  ctx.save(); ctx.rotate(Math.PI / 2);
  ctx.beginPath(); ctx.arc(0, 0, r, -0.4, Math.PI + 0.4); ctx.stroke();
  ctx.restore();

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.28, r * 0.28, r * 0.17, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNet(ctx, wave) {
  const fx = RIM_FRONT_X, bx = RIM_BACK_X, ty = RIM_Y;
  const by = ty + NET_H, mx = (fx + bx) / 2;
  const sway = Math.sin(wave * 0.28) * Math.exp(-wave * 0.035) * 14;
  ctx.lineWidth = 0.9;
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const tx2 = fx + (bx - fx) * t;
    const bx2 = mx - 11 + 22 * t + sway * Math.sin(t * Math.PI);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.2 * Math.sin(t * Math.PI)})`;
    ctx.beginPath();
    ctx.moveTo(tx2, ty);
    ctx.quadraticCurveTo(tx2 + sway * 0.35, ty + NET_H * 0.55, bx2, by);
    ctx.stroke();
  }
  for (let j = 1; j <= 4; j++) {
    const p = j / 4, y = ty + NET_H * p;
    const lx = fx + (mx - 11 - fx) * p + sway * p * 0.5;
    const rx = bx + (mx + 11 - bx) * p + sway * p * 0.5;
    ctx.strokeStyle = `rgba(255,255,255,${0.4 - p * 0.05})`;
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(rx, y); ctx.stroke();
  }
}

function drawHoop(ctx, wave) {
  // Pole
  const pg = ctx.createLinearGradient(BACKBOARD_X + 2, 0, BACKBOARD_X + 11, 0);
  pg.addColorStop(0, '#444'); pg.addColorStop(0.5, '#888'); pg.addColorStop(1, '#444');
  ctx.fillStyle = pg;
  ctx.fillRect(BACKBOARD_X + 2, RIM_Y + 8, 9, FLOOR_Y - RIM_Y - 8);

  // Backboard
  ctx.fillStyle = 'rgba(180,210,255,0.12)';
  ctx.fillRect(BACKBOARD_X, 152, 12, 158);
  ctx.strokeStyle = 'rgba(200,225,255,0.65)'; ctx.lineWidth = 2;
  ctx.strokeRect(BACKBOARD_X, 152, 12, 158);
  ctx.strokeStyle = 'rgba(200,225,255,0.35)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(BACKBOARD_X, 215, 12, 48);

  // Rim arm
  ctx.strokeStyle = '#c84800'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(BACKBOARD_X, RIM_Y); ctx.lineTo(RIM_BACK_X, RIM_Y); ctx.stroke();

  // Rim pipe
  ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(RIM_FRONT_X, RIM_Y); ctx.lineTo(RIM_BACK_X, RIM_Y); ctx.stroke();

  // Rim end caps
  ctx.fillStyle = '#ff5500';
  [RIM_FRONT_X, RIM_BACK_X].forEach(rx => {
    ctx.beginPath(); ctx.arc(rx, RIM_Y, 5, 0, Math.PI * 2); ctx.fill();
  });

  drawNet(ctx, wave);
}

function drawCourt(ctx) {
  // Background
  ctx.fillStyle = '#06060e'; ctx.fillRect(0, 0, W, H);

  // Crowd (blurred dark gradient)
  const crowd = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  crowd.addColorStop(0, 'rgba(8,5,25,0.9)'); crowd.addColorStop(1, 'rgba(18,12,35,0.6)');
  ctx.fillStyle = crowd; ctx.fillRect(0, 0, W, FLOOR_Y);

  // Arena spotlights from ceiling
  [80, 250, 450, 650, 780].forEach(lx => {
    const lg = ctx.createRadialGradient(lx, 0, 0, lx, 0, 180);
    lg.addColorStop(0, 'rgba(255,240,200,0.07)'); lg.addColorStop(1, 'transparent');
    ctx.fillStyle = lg; ctx.fillRect(lx - 180, 0, 360, 200);
  });

  // Hardwood floor
  const fg = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
  fg.addColorStop(0, '#c47c3a'); fg.addColorStop(0.3, '#b06828'); fg.addColorStop(1, '#7a4010');
  ctx.fillStyle = fg; ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

  // Floor boards
  ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 1;
  for (let y = FLOOR_Y + 12; y < H; y += 14) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Floor edge
  ctx.strokeStyle = 'rgba(255,230,180,0.65)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(W, FLOOR_Y); ctx.stroke();

  // Key / paint area
  ctx.strokeStyle = 'rgba(255,230,160,0.22)'; ctx.lineWidth = 1.5;
  const keyL = THREE_PT_X + 90;
  ctx.strokeRect(keyL, FLOOR_Y - 85, BACKBOARD_X - keyL, 85);

  // 3pt vertical marker
  ctx.strokeStyle = 'rgba(255,230,160,0.42)'; ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.moveTo(THREE_PT_X, FLOOR_Y); ctx.lineTo(THREE_PT_X, FLOOR_Y - 68); ctx.stroke();

  // 3pt floor arc (perspective ellipse)
  ctx.strokeStyle = 'rgba(255,230,160,0.28)';
  ctx.beginPath();
  ctx.ellipse(BACKBOARD_X, FLOOR_Y, BACKBOARD_X - THREE_PT_X, 28, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function rimCollision(ball, cx, cy) {
  const dx = ball.x - cx, dy = ball.y - cy;
  const d = Math.sqrt(dx * dx + dy * dy), min = BALL_R + RIM_R;
  if (d < min && d > 0) {
    const nx = dx / d, ny = dy / d;
    ball.x += nx * (min - d); ball.y += ny * (min - d);
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx -= 2 * dot * nx * 0.62;
    ball.vy -= 2 * dot * ny * 0.62;
  }
}

function getTrajectory(sx, sy, vx, vy, steps) {
  const pts = [];
  let x = sx, y = sy, velY = vy;
  for (let i = 0; i < steps; i++) {
    x += vx; y += velY; velY += GRAVITY;
    pts.push([x, y]);
    if (y > FLOOR_Y + 30 || x > W + 50 || x < -50) break;
  }
  return pts;
}

/* ═══════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════ */
export default function GameTab() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const timerRef  = useRef(null);

  const ballRef = useRef({ x: 118, y: FLOOR_Y - BALL_R, vx: 0, vy: 0, active: false, prevY: 0, rot: 0 });
  const dragRef = useRef({ on: false, ex: 0, ey: 0 });
  const gRef    = useRef({
    phase: 'idle',    // idle | ready | aiming | flying | result | gameover
    score: 0, timeLeft: 60, streak: 0,
    posIdx: 0, currentPts: 3,
    netWave: 0, feedText: '', feedTimer: 0,
    hi: parseInt(localStorage.getItem(HI_KEY) || '0'),
  });

  /* ── Reset ball to current position ── */
  const resetBall = useCallback(() => {
    const g = gRef.current, b = ballRef.current;
    const pos = POSITIONS[g.posIdx];
    b.x = pos.x; b.y = FLOOR_Y - BALL_R;
    b.vx = 0; b.vy = 0; b.active = false; b.rot = 0;
    g.currentPts = pos.pts;
    if (g.phase !== 'gameover') g.phase = 'ready';
  }, []);

  /* ── Start game ── */
  const startGame = useCallback(() => {
    const g = gRef.current;
    g.score = 0; g.timeLeft = 60; g.streak = 0;
    g.posIdx = Math.floor(Math.random() * POSITIONS.length);
    g.netWave = 0; g.feedText = ''; g.feedTimer = 0;
    g.phase = 'ready';
    resetBall();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const gr = gRef.current;
      if (gr.phase === 'gameover') { clearInterval(timerRef.current); return; }
      gr.timeLeft = Math.max(0, gr.timeLeft - 1);
      if (gr.timeLeft === 0) {
        gr.phase = 'gameover';
        if (gr.score > gr.hi) {
          gr.hi = gr.score;
          localStorage.setItem(HI_KEY, String(gr.score));
        }
        clearInterval(timerRef.current);
      }
    }, 1000);
  }, [resetBall]);

  /* ── Main RAF loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop() {
      const b = ballRef.current, drag = dragRef.current, g = gRef.current;

      /* Physics */
      if (b.active) {
        b.prevY = b.y;
        b.x += b.vx; b.y += b.vy; b.vy += GRAVITY;
        b.rot += b.vx * 0.05;

        rimCollision(b, RIM_FRONT_X, RIM_Y);
        rimCollision(b, RIM_BACK_X, RIM_Y);

        /* Score detection */
        if (g.phase === 'flying') {
          const inX = b.x > RIM_FRONT_X - BALL_R * 0.35 && b.x < RIM_BACK_X + BALL_R * 0.35;
          const crossed = b.prevY <= RIM_Y && b.y > RIM_Y && b.vy > 0;
          if (inX && crossed) {
            const pts = g.currentPts;
            g.score += pts;
            g.streak++;
            g.netWave = 58;
            const hot = g.streak >= 3;
            g.feedText = hot
              ? `+${pts} 🔥 SÉRIE x${g.streak}`
              : pts === 3 ? `+3 🎯 THREE!` : `+2 ✓ DEDANS!`;
            g.feedTimer = 80;
            g.phase = 'result';
            g.posIdx = Math.floor(Math.random() * POSITIONS.length);
            setTimeout(resetBall, 850);
          }
        }

        /* Floor */
        if (b.y + BALL_R >= FLOOR_Y) {
          b.y = FLOOR_Y - BALL_R;
          b.vy *= -0.48; b.vx *= 0.72;
          if (Math.abs(b.vy) < 1.8) {
            b.vy = 0; b.active = false;
            if (g.phase === 'flying') {
              g.streak = 0; g.feedText = 'RATÉ 😬'; g.feedTimer = 72;
              g.phase = 'result';
              g.posIdx = Math.floor(Math.random() * POSITIONS.length);
              setTimeout(resetBall, 900);
            }
          }
        }

        /* Off-screen */
        if (b.x > W + 80 || b.x < -80) {
          if (g.phase === 'flying') {
            g.streak = 0; g.feedText = 'RATÉ 😬'; g.feedTimer = 72;
            g.phase = 'result';
            g.posIdx = Math.floor(Math.random() * POSITIONS.length);
            setTimeout(resetBall, 400);
          }
        }
      }

      if (g.netWave > 0) g.netWave--;
      if (g.feedTimer > 0) g.feedTimer--;

      /* ── Draw ── */
      drawCourt(ctx);

      // Zone labels
      ctx.font = 'bold 11px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,212,255,0.45)';
      ctx.fillText('3 PTS', THREE_PT_X - 1, FLOOR_Y - 72);
      ctx.fillStyle = 'rgba(0,232,122,0.35)';
      ctx.fillText('2 PTS', (THREE_PT_X + BACKBOARD_X) / 2 - 20, FLOOR_Y - 72);

      /* Ball position indicator (spotlight) */
      if ((g.phase === 'ready' || g.phase === 'aiming') && !b.active) {
        const pos = POSITIONS[g.posIdx];
        const col = pos.pts === 3 ? '#00d4ff' : '#00e87a';
        const sg = ctx.createRadialGradient(pos.x, FLOOR_Y, 0, pos.x, FLOOR_Y, 55);
        sg.addColorStop(0, col + '44'); sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg; ctx.fillRect(pos.x - 55, FLOOR_Y - 10, 110, 14);
        ctx.fillStyle = col + 'cc';
        ctx.font = 'bold 13px Rajdhani, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(pos.pts === 3 ? '3 POINTS' : '2 POINTS', pos.x, FLOOR_Y + 24);
      }

      /* Trajectory preview */
      if (g.phase === 'aiming' && drag.on) {
        const ddx = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, b.x - drag.ex)) * POWER;
        const ddy = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, b.y - drag.ey)) * POWER;
        const traj = getTrajectory(b.x, b.y, ddx, ddy, 55);
        traj.forEach(([tx, ty], i) => {
          if (i % 2 !== 0) return;
          const a = (1 - i / traj.length) * 0.8;
          const r2 = Math.max(0.5, 3 - (i / traj.length) * 2.5);
          ctx.fillStyle = `rgba(255,200,80,${a})`;
          ctx.beginPath(); ctx.arc(tx, ty, r2, 0, Math.PI * 2); ctx.fill();
        });
        // Drag line
        ctx.strokeStyle = 'rgba(255,200,80,0.28)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(drag.ex, drag.ey); ctx.stroke();
        ctx.setLineDash([]);
        // Power bar
        const pw = Math.min(Math.hypot(b.x - drag.ex, b.y - drag.ey) / MAX_DRAG, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(b.x - 32, b.y + BALL_R + 12, 64, 7);
        ctx.fillStyle = pw < 0.4 ? '#00e87a' : pw < 0.7 ? '#ffd700' : '#ff3868';
        ctx.fillRect(b.x - 32, b.y + BALL_R + 12, 64 * pw, 7);
      }

      drawHoop(ctx, g.netWave);

      /* Ball */
      if (b.x > -BALL_R && b.x < W + BALL_R)
        drawBall(ctx, b.x, b.y, BALL_R, b.rot);

      /* Feedback text */
      if (g.feedTimer > 0) {
        const a = Math.min(1, g.feedTimer / 18);
        const rise = (80 - g.feedTimer) * 0.55;
        const isScore = !g.feedText.startsWith('RATÉ');
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `bold ${isScore ? 30 : 25}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isScore ? (g.currentPts === 3 ? '#00d4ff' : '#00e87a') : '#ff3868';
        ctx.shadowBlur = 28; ctx.shadowColor = ctx.fillStyle;
        ctx.fillText(g.feedText, W / 2, H / 2 - 55 - rise);
        ctx.restore();
      }

      /* HUD bar */
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, 50);

      ctx.font = 'bold 24px Orbitron, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
      ctx.fillText(`${g.score}`, 20, 33);

      ctx.textAlign = 'right';
      ctx.fillStyle = g.timeLeft <= 10 ? '#ff3868' : '#ffffff';
      ctx.shadowBlur = g.timeLeft <= 10 ? 14 : 0; ctx.shadowColor = '#ff3868';
      ctx.fillText(`${String(g.timeLeft).padStart(2, '0')}s`, W - 18, 33);
      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px Rajdhani, sans-serif';
      ctx.fillText(`RECORD : ${g.hi}`, W / 2, 32);
      if (g.streak >= 2) {
        ctx.fillStyle = '#ff8c42'; ctx.font = 'bold 13px Rajdhani, sans-serif';
        ctx.fillText(`🔥 SÉRIE x${g.streak}`, W / 2, 14);
      }

      /* Idle / Gameover overlay */
      if (g.phase === 'idle' || g.phase === 'gameover') {
        ctx.fillStyle = 'rgba(6,6,14,0.8)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';

        if (g.phase === 'idle') {
          ctx.fillStyle = '#ff6b2b'; ctx.font = 'bold 42px Orbitron, sans-serif';
          ctx.shadowBlur = 35; ctx.shadowColor = '#ff6b2b';
          ctx.fillText('TTFL SHOOT', W / 2, H / 2 - 70);
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '17px Rajdhani, sans-serif';
          ctx.fillText('Glisse le ballon pour tirer · 60 secondes', W / 2, H / 2 - 10);
          ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '13px Rajdhani, sans-serif';
          ctx.fillText('← → flèches clavier · swipe tactile supporté', W / 2, H / 2 + 20);

          // Start button rect
          const bw = 200, bh = 46, bx = W / 2 - bw / 2, by = H / 2 + 50;
          ctx.fillStyle = '#ff6b2b'; ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Rajdhani, sans-serif';
          ctx.fillText('COMMENCER', W / 2, by + 30);
        } else {
          const isNewHi = g.score > 0 && g.score >= g.hi;
          ctx.fillStyle = isNewHi ? '#ffd700' : '#ffffff';
          ctx.font = 'bold 58px Orbitron, sans-serif';
          ctx.shadowBlur = isNewHi ? 45 : 0; ctx.shadowColor = '#ffd700';
          ctx.fillText(`${g.score}`, W / 2, H / 2 - 45);
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '15px Rajdhani, sans-serif';
          ctx.fillText(isNewHi ? '🏆 NOUVEAU RECORD !' : `Record : ${g.hi}`, W / 2, H / 2 + 5);

          // Replay button
          const bw = 200, bh = 46, bx = W / 2 - bw / 2, by = H / 2 + 35;
          ctx.fillStyle = '#ff6b2b'; ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Rajdhani, sans-serif';
          ctx.fillText('REJOUER', W / 2, by + 30);
        }
      }

      /* Ready hint */
      if (g.phase === 'ready') {
        const pos = POSITIONS[g.posIdx];
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '12px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Glisse pour tirer', pos.x, FLOOR_Y - 48);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
    };
  }, [resetBall]);

  /* ── Event handlers ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function toCanvas(cx, cy) {
      const r = canvas.getBoundingClientRect();
      return { x: (cx - r.left) * (W / r.width), y: (cy - r.top) * (H / r.height) };
    }

    function onDown(cx, cy) {
      const { x, y } = toCanvas(cx, cy);
      const g = gRef.current, b = ballRef.current;
      if (g.phase === 'idle' || g.phase === 'gameover') { startGame(); return; }
      if (g.phase !== 'ready') return;
      if (Math.hypot(x - b.x, y - b.y) < BALL_R + 30) {
        dragRef.current = { on: true, ex: x, ey: y };
        g.phase = 'aiming';
      }
    }

    function onMove(cx, cy) {
      if (!dragRef.current.on) return;
      const { x, y } = toCanvas(cx, cy);
      dragRef.current.ex = x; dragRef.current.ey = y;
    }

    function onUp(cx, cy) {
      const drag = dragRef.current;
      if (!drag.on) return;
      drag.on = false;
      const { x, y } = toCanvas(cx, cy);
      const g = gRef.current, b = ballRef.current;
      const ddx = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, b.x - x));
      const ddy = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, b.y - y));
      if (Math.hypot(ddx, ddy) < 14) { g.phase = 'ready'; return; }
      b.vx = ddx * POWER; b.vy = ddy * POWER;
      b.active = true; g.phase = 'flying';
    }

    // Keyboard arrows
    function onKey(e) {
      const g = gRef.current, b = ballRef.current;
      if (g.phase === 'idle' || g.phase === 'gameover') { startGame(); return; }
      if (g.phase !== 'ready') return;
      if (e.key === 'ArrowLeft')  { b.vx = -4.5; b.vy = -7.5; b.active = true; g.phase = 'flying'; }
      if (e.key === 'ArrowRight') { b.vx = 6;    b.vy = -8;   b.active = true; g.phase = 'flying'; }
    }

    const md = e => onDown(e.clientX, e.clientY);
    const mm = e => onMove(e.clientX, e.clientY);
    const mu = e => onUp(e.clientX, e.clientY);
    const ts = e => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); };
    const tm = e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const tu = e => { e.preventDefault(); onUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY); };

    canvas.addEventListener('mousedown', md);
    canvas.addEventListener('mousemove', mm);
    canvas.addEventListener('mouseup',   mu);
    canvas.addEventListener('touchstart', ts, { passive: false });
    canvas.addEventListener('touchmove',  tm, { passive: false });
    canvas.addEventListener('touchend',   tu, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      canvas.removeEventListener('mousedown', md);
      canvas.removeEventListener('mousemove', mm);
      canvas.removeEventListener('mouseup',   mu);
      canvas.removeEventListener('touchstart', ts);
      canvas.removeEventListener('touchmove',  tm);
      canvas.removeEventListener('touchend',   tu);
      window.removeEventListener('keydown', onKey);
    };
  }, [startGame]);

  return (
    <div className="game-tab">
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
    </div>
  );
}
