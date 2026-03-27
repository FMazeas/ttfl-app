import { useState, useEffect, useRef, useCallback } from 'react';
import './BallMenu.css';

export const MENU_TABS = [
  { id: 'calendrier',    label: 'Calendrier',   icon: '📅', color: '#00d4ff', desc: 'Calendrier NBA & planification' },
  { id: 'disponibilite', label: 'Disponibilité', icon: '🎯', color: '#00e87a', desc: 'Joueurs disponibles pour picker' },
  { id: 'historique',    label: 'Historique',    icon: '📊', color: '#ff8c42', desc: 'Tous tes picks passés' },
  { id: 'playoffs',      label: 'Playoffs',      icon: '🏆', color: '#ffd700', desc: 'Bracket & joueurs playoffs' },
  { id: 'game',          label: 'Mini Jeu',      icon: '🏀', color: '#ff3868', desc: 'Tir au panier · 60 secondes' },
];

const Seams = () => (
  <svg className="bm-seams" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M5 50 C25 20,45 20,50 50 C55 80,75 80,95 50"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M5 50 C25 80,45 80,50 50 C55 20,75 20,95 50"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M50 5 C20 25,20 45,50 50 C80 55,80 75,50 95"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M50 5 C80 25,80 45,50 50 C20 55,20 75,50 95"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/* Basketball half-court SVG background */
const CourtBg = () => (
  <svg className="bm-court" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {/* outer boundary */}
    <rect x="20" y="20" width="760" height="460" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    {/* center line */}
    <line x1="400" y1="20" x2="400" y2="480" stroke="currentColor" strokeWidth="2"/>
    {/* center circle */}
    <circle cx="400" cy="250" r="72" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* center dot */}
    <circle cx="400" cy="250" r="5" fill="currentColor" opacity="0.4"/>
    {/* left key */}
    <rect x="20" y="155" width="160" height="190" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* left free-throw circle */}
    <circle cx="180" cy="250" r="72" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* left basket */}
    <circle cx="60" cy="250" r="22" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* left 3pt arc */}
    <path d="M 20 90 A 290 290 0 0 1 20 410" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* right key */}
    <rect x="620" y="155" width="160" height="190" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* right free-throw circle */}
    <circle cx="620" cy="250" r="72" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* right basket */}
    <circle cx="740" cy="250" r="22" fill="none" stroke="currentColor" strokeWidth="2"/>
    {/* right 3pt arc */}
    <path d="M 780 90 A 290 290 0 0 0 780 410" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export default function BallMenu({ onEnter, theme, onThemeToggle }) {
  const [idx,   setIdx]   = useState(0);
  const [shown, setShown] = useState(0);
  const [anim,  setAnim]  = useState('enter');

  /* ── Spring mouse parallax ── */
  const tiltCurrent = useRef({ x: 0, y: 0 });
  const tiltTarget  = useRef({ x: 0, y: 0 });
  const [tilt, setTilt]   = useState({ x: 0, y: 0 });
  const rafTilt = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      tiltTarget.current = {
        x: ((e.clientY - cy) / cy) * -10,
        y: ((e.clientX - cx) / cx) *  10,
      };
    };
    const spring = () => {
      const c = tiltCurrent.current;
      const t = tiltTarget.current;
      const nx = c.x + (t.x - c.x) * 0.07;
      const ny = c.y + (t.y - c.y) * 0.07;
      tiltCurrent.current = { x: nx, y: ny };
      setTilt({ x: nx, y: ny });
      rafTilt.current = requestAnimationFrame(spring);
    };
    rafTilt.current = requestAnimationFrame(spring);
    window.addEventListener('mousemove', onMove);
    return () => {
      cancelAnimationFrame(rafTilt.current);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  /* ── Clear entrance anim ── */
  useEffect(() => {
    const t = setTimeout(() => setAnim('idle'), 750);
    return () => clearTimeout(t);
  }, []);

  /* ── Keyboard nav ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')              navigate(-1);
      if (e.key === 'ArrowRight')             navigate(1);
      if (e.key === 'Enter' || e.key === ' ') onEnter(MENU_TABS[idx].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, anim]); // eslint-disable-line

  /* ── Mobile swipe ── */
  const touchStartX = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) navigate(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  function navigate(d) {
    if (anim === 'out' || anim === 'in') return;
    const next = (idx + d + MENU_TABS.length) % MENU_TABS.length;
    setAnim('out');
    setIdx(next);
    setTimeout(() => {
      setShown(next);
      setAnim('in');
      setTimeout(() => setAnim('idle'), 480);
    }, 250);
  }

  function goTo(i) {
    if (i === idx || anim === 'out' || anim === 'in') return;
    setAnim('out');
    setIdx(i);
    setTimeout(() => {
      setShown(i);
      setAnim('in');
      setTimeout(() => setAnim('idle'), 480);
    }, 250);
  }

  const tab = MENU_TABS[shown];
  const parallaxStyle = anim === 'idle'
    ? { transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }
    : {};

  return (
    <div className="ball-menu-page">
      <div className="bm-grid" aria-hidden="true" />
      <CourtBg />
      <div className="bm-ambient" style={{ '--accent': tab.color }} />

      {/* Ghost text */}
      <div className="bm-ghost-wrap" key={tab.id}>
        <span className="bm-ghost">{tab.label.toUpperCase()}</span>
      </div>

      {/* Top bar */}
      <div className="bm-topbar">
        <div className="bm-brand">
          <span className="bm-brand-logo">TTFL</span>
          <span className="bm-brand-sub">Trash Talk Fantasy League</span>
        </div>
        <button className="bm-theme-btn" onClick={onThemeToggle} title="Changer de thème">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Ball stage */}
      <div
        className="bm-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button className="bm-arrow" onClick={() => navigate(-1)} aria-label="Précédent">‹</button>

        {/* Parallax wrapper → flip wrapper → ball */}
        <div className="bm-parallax" style={parallaxStyle}>
          <div className={`bm-ball-outer bm-anim-${anim}`} style={{ '--accent': tab.color }}>
            <div className="bm-ball">
              <Seams />
              <div className="bm-shine" />
              <span className="bm-face-icon">{tab.icon}</span>
            </div>
            <div className="bm-ring bm-ring-1" />
            <div className="bm-ring bm-ring-2" />
            <div className="bm-ring bm-ring-3" />
          </div>
        </div>

        <button className="bm-arrow" onClick={() => navigate(1)} aria-label="Suivant">›</button>
      </div>

      {/* Tab info */}
      <div className="bm-info" key={tab.id + '-info'}>
        <div className="bm-tab-name" style={{ color: tab.color }}>{tab.label}</div>
        <div className="bm-tab-desc">{tab.desc}</div>
      </div>

      {/* Dots */}
      <div className="bm-dots">
        {MENU_TABS.map((t, i) => (
          <button
            key={t.id}
            className={`bm-dot${i === idx ? ' active' : ''}`}
            style={i === idx ? { '--accent': t.color } : {}}
            onClick={() => goTo(i)}
            aria-label={t.label}
          />
        ))}
      </div>

      {/* Enter */}
      <button className="bm-enter-btn" style={{ '--accent': tab.color }} onClick={() => onEnter(tab.id)}>
        <span>Entrer</span>
        <span className="bm-enter-arrow">→</span>
      </button>

      <div className="bm-hint">← → pour naviguer · Entrée pour sélectionner</div>
    </div>
  );
}
