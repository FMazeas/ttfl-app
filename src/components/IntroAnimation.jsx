import { useState, useEffect } from 'react';
import './IntroAnimation.css';

// 19 polygons that tile the full viewport — they fly apart on shatter
const SHARDS = [
  { id:  0, clip: 'polygon(0% 0%, 26% 0%, 18% 26%, 0% 20%)',              dx:'-130vw', dy:'-110vh', dr:'-55deg', delay:  0 },
  { id:  1, clip: 'polygon(26% 0%, 54% 0%, 40% 32%, 18% 26%)',            dx: '-18vw', dy:'-135vh', dr:' 32deg', delay: 25 },
  { id:  2, clip: 'polygon(54% 0%, 78% 0%, 64% 28%, 40% 32%)',            dx:'  18vw', dy:'-128vh', dr:'-22deg', delay: 15 },
  { id:  3, clip: 'polygon(78% 0%, 100% 0%, 100% 18%, 80% 22%, 64% 28%)', dx:' 135vw', dy:'-108vh', dr:' 58deg', delay:  5 },
  { id:  4, clip: 'polygon(0% 20%, 18% 26%, 14% 52%, 0% 46%)',            dx:'-142vw', dy:' -22vh', dr:'-42deg', delay: 40 },
  { id:  5, clip: 'polygon(18% 26%, 40% 32%, 32% 56%, 14% 52%)',          dx: '-72vw', dy:' -72vh', dr:' 38deg', delay: 12 },
  { id:  6, clip: 'polygon(40% 32%, 64% 28%, 60% 56%, 32% 56%)',          dx:'   2vw', dy:'-115vh', dr:'-18deg', delay:  0 },
  { id:  7, clip: 'polygon(64% 28%, 80% 22%, 84% 52%, 60% 56%)',          dx:'  72vw', dy:' -68vh', dr:' 30deg', delay: 20 },
  { id:  8, clip: 'polygon(80% 22%, 100% 18%, 100% 48%, 84% 52%)',        dx:' 145vw', dy:' -20vh', dr:' 50deg', delay: 32 },
  { id:  9, clip: 'polygon(0% 46%, 14% 52%, 10% 76%, 0% 72%)',            dx:'-145vw', dy:'  20vh', dr:'-38deg', delay: 48 },
  { id: 10, clip: 'polygon(14% 52%, 32% 56%, 26% 80%, 10% 76%)',          dx: '-78vw', dy:'  78vh', dr:' 44deg', delay: 18 },
  { id: 11, clip: 'polygon(32% 56%, 60% 56%, 52% 82%, 26% 80%)',          dx:'  -6vw', dy:' 118vh', dr:'-14deg', delay:  8 },
  { id: 12, clip: 'polygon(60% 56%, 84% 52%, 78% 78%, 52% 82%)',          dx:'  70vw', dy:'  72vh', dr:' 25deg', delay: 28 },
  { id: 13, clip: 'polygon(84% 52%, 100% 48%, 100% 74%, 78% 78%)',        dx:' 142vw', dy:'  20vh', dr:' 45deg', delay: 42 },
  { id: 14, clip: 'polygon(0% 72%, 10% 76%, 6% 100%, 0% 100%)',           dx:'-128vw', dy:' 108vh', dr:'-32deg', delay: 58 },
  { id: 15, clip: 'polygon(10% 76%, 26% 80%, 22% 100%, 6% 100%)',         dx: '-58vw', dy:' 125vh', dr:' 28deg', delay: 28 },
  { id: 16, clip: 'polygon(26% 80%, 52% 82%, 46% 100%, 22% 100%)',        dx:'  -4vw', dy:' 128vh', dr:'-10deg', delay: 14 },
  { id: 17, clip: 'polygon(52% 82%, 78% 78%, 72% 100%, 46% 100%)',        dx:'  52vw', dy:' 122vh', dr:' 20deg', delay: 22 },
  { id: 18, clip: 'polygon(78% 78%, 100% 74%, 100% 100%, 72% 100%)',      dx:' 125vw', dy:' 108vh', dr:' 40deg', delay: 52 },
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top:  `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 4}px`,
  delay: `${Math.random() * 4}s`,
  duration: `${3 + Math.random() * 5}s`,
  color: Math.random() > 0.6 ? 'rgba(255,107,43,0.7)' : Math.random() > 0.5 ? 'rgba(0,212,255,0.6)' : 'rgba(255,255,255,0.4)',
}));

export default function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    // Ball approaches slowly for 1.5s, then SLAMS
    const t0 = setTimeout(() => setPhase('incoming'),   500);
    const t1 = setTimeout(() => setPhase('impact'),    2000);
    const t2 = setTimeout(() => setPhase('shattering'),3500);
    const t3 = setTimeout(() => setPhase('done'),      4400);
    return () => [t0, t1, t2, t3].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 'done') setTimeout(onComplete, 200);
  }, [phase, onComplete]);

  const isShattering = phase === 'shattering' || phase === 'done';
  const showCracks   = phase === 'impact' || phase === 'shattering' || phase === 'done';
  const showFlash    = phase === 'impact';
  const showBall     = phase === 'incoming' || phase === 'impact';

  return (
    <div
      className={`intro-overlay intro-${phase}`}
      onClick={() => phase !== 'idle' && setPhase(p =>
        p === 'incoming' ? 'impact' : p === 'impact' ? 'shattering' : p === 'shattering' ? 'done' : p
      )}
    >
      {/* ── Background ── */}
      <div className="intro-bg">
        <div className="intro-glow glow-orange" />
        <div className="intro-glow glow-cyan"   />
        <div className="intro-grid" />
        {PARTICLES.map(p => (
          <div key={p.id} className="intro-particle" style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }} />
        ))}
      </div>

      {/* ── Pre-title ── */}
      <div className="intro-pre-title">
        <div className="intro-ttfl-bg">TTFL</div>
        <div className="intro-season">SAISON 2025 · 2026</div>
        <div className="intro-loading-bar">
          <div className="intro-loading-fill" />
        </div>
      </div>

      {/* ── Basketball ── */}
      {showBall && (
        <div className={`intro-ball intro-ball-${phase}`}>
          <div className="ball-fire" />
          <span className="ball-emoji">🏀</span>
          <div className="ball-glow" />
          <div className="ball-trail" />
        </div>
      )}

      {/* ── Impact rings + shockwave ── */}
      {phase === 'impact' && (
        <>
          <div className="impact-ring ring-1" />
          <div className="impact-ring ring-2" />
          <div className="impact-ring ring-3" />
          <div className="shockwave sw-1" />
          <div className="shockwave sw-2" />
        </>
      )}

      {/* ── Flash ── */}
      {showFlash && <div className="intro-flash" />}

      {/* ── Crack lines — realistic zigzag glass cracks ── */}
      {showCracks && (
        <svg className="crack-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* ── 8 main cracks radiating from impact (50,50) — zigzag paths ── */}
          {/* upper-left */}
          <path className="crack c1" d="M 50 50 L 45 42 L 39 35 L 43 27 L 34 19 L 28 11 L 17 3" />
          {/* upper */}
          <path className="crack c2" d="M 50 50 L 53 40 L 48 30 L 52 19 L 47 9 L 50 0" />
          {/* upper-right */}
          <path className="crack c3" d="M 50 50 L 57 44 L 62 37 L 70 29 L 67 19 L 77 10 L 87 2" />
          {/* right */}
          <path className="crack c4" d="M 50 50 L 62 47 L 72 51 L 82 47 L 92 51 L 100 50" />
          {/* lower-right */}
          <path className="crack c5" d="M 50 50 L 56 57 L 63 64 L 68 71 L 77 77 L 84 86 L 92 96" />
          {/* lower */}
          <path className="crack c6" d="M 50 50 L 48 62 L 52 72 L 47 82 L 51 92 L 50 100" />
          {/* lower-left */}
          <path className="crack c7" d="M 50 50 L 42 57 L 36 66 L 32 75 L 37 83 L 24 91 L 12 99" />
          {/* left */}
          <path className="crack c8" d="M 50 50 L 39 48 L 29 51 L 19 48 L 9 51 L 0 50" />

          {/* ── Secondary cracks — branch from midpoints of main cracks ── */}
          {/* from c1 at (39,35) */}
          <path className="crack csec" d="M 39 35 L 31 32 L 23 26 L 16 18" style={{animationDelay:'0.14s'}} />
          {/* from c2 at (48,30) */}
          <path className="crack csec" d="M 48 30 L 41 26 L 35 19 L 27 13" style={{animationDelay:'0.30s'}} />
          {/* from c3 at (67,19) */}
          <path className="crack csec" d="M 67 19 L 74 12 L 82 5"          style={{animationDelay:'0.22s'}} />
          {/* from c4 at (82,47) */}
          <path className="crack csec" d="M 82 47 L 88 40 L 95 34"         style={{animationDelay:'0.48s'}} />
          {/* from c5 at (77,77) */}
          <path className="crack csec" d="M 77 77 L 85 73 L 93 79"         style={{animationDelay:'0.40s'}} />
          {/* from c6 at (47,82) */}
          <path className="crack csec" d="M 47 82 L 40 87 L 33 95"         style={{animationDelay:'0.64s'}} />
          {/* from c7 at (36,66) */}
          <path className="crack csec" d="M 36 66 L 28 70 L 20 76 L 12 86" style={{animationDelay:'0.35s'}} />
          {/* from c8 at (29,51) */}
          <path className="crack csec" d="M 29 51 L 24 58 L 16 64"         style={{animationDelay:'0.52s'}} />

          {/* ── Tertiary micro-cracks — from ends of secondary ── */}
          <path className="crack csec" d="M 17 3 L 10 0"                   style={{animationDelay:'0.26s'}} />
          <path className="crack csec" d="M 87 2 L 93 0"                   style={{animationDelay:'0.34s'}} />
          <path className="crack csec" d="M 12 99 L 5 96 L 1 100"          style={{animationDelay:'0.72s'}} />
          <path className="crack csec" d="M 23 26 L 15 22 L 8 15"          style={{animationDelay:'0.42s'}} />
          <path className="crack csec" d="M 35 19 L 28 14 L 20 8"          style={{animationDelay:'0.55s'}} />
          <path className="crack csec" d="M 88 40 L 94 35 L 98 27"         style={{animationDelay:'0.68s'}} />
          <path className="crack csec" d="M 93 79 L 98 86 L 100 93"        style={{animationDelay:'0.58s'}} />
        </svg>
      )}

      {/* ── Shards ── */}
      <div className="shards-wrap">
        {SHARDS.map(s => (
          <div
            key={s.id}
            className={`shard${isShattering ? ' shard-fly' : ''}`}
            style={{
              clipPath: s.clip,
              '--dx': s.dx, '--dy': s.dy, '--dr': s.dr,
              animationDelay: isShattering ? `${s.delay}ms` : '0ms',
            }}
          />
        ))}
      </div>

      {/* ── Skip ── */}
      {(phase === 'incoming' || phase === 'impact' || phase === 'shattering') && (
        <button className="intro-skip" onClick={() => setPhase('done')}>PASSER ›</button>
      )}
    </div>
  );
}
