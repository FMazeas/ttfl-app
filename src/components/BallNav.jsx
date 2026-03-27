import { useState, useCallback } from 'react';
import './BallNav.css';

export const BALL_TABS = [
  { id: 'calendrier',    label: 'Calendrier',   icon: '📅', color: '#00d4ff' },
  { id: 'disponibilite', label: 'Disponibilité', icon: '🎯', color: '#00e87a' },
  { id: 'historique',    label: 'Historique',    icon: '📊', color: '#ff8c42' },
  { id: 'playoffs',      label: 'Playoffs',      icon: '🏆', color: '#ffd700' },
];

const Seams = () => (
  <svg className="bn-seams" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M5 50 C25 20,45 20,50 50 C55 80,75 80,95 50"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M5 50 C25 80,45 80,50 50 C55 20,75 20,95 50"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M50 5 C20 25,20 45,50 50 C80 55,80 75,50 95"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M50 5 C80 25,80 45,50 50 C20 55,20 75,50 95"
          fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function BallNav({ activeTab, onTabChange }) {
  const currentIndex = BALL_TABS.findIndex(t => t.id === activeTab);
  const [anim, setAnim]   = useState('idle'); // 'idle' | 'out' | 'in'
  const [shown, setShown] = useState(currentIndex);

  const goTo = useCallback((nextIdx) => {
    if (nextIdx === currentIndex || anim !== 'idle') return;
    setAnim('out');
    onTabChange(BALL_TABS[nextIdx].id);
    setTimeout(() => {
      setShown(nextIdx);
      setAnim('in');
      setTimeout(() => setAnim('idle'), 420);
    }, 230);
  }, [currentIndex, anim, onTabChange]);

  const prev = () => goTo((currentIndex - 1 + BALL_TABS.length) % BALL_TABS.length);
  const next = () => goTo((currentIndex + 1) % BALL_TABS.length);

  const displayedTab = BALL_TABS[shown];
  const prevTab = BALL_TABS[(currentIndex - 1 + BALL_TABS.length) % BALL_TABS.length];
  const nextTab = BALL_TABS[(currentIndex + 1) % BALL_TABS.length];

  return (
    <nav className="ball-nav" aria-label="Navigation principale">
      <div className="bn-row">

        {/* ── Left mini ball (prev) ── */}
        <button className="bn-side bn-side-left" onClick={prev} aria-label={`Aller à ${prevTab.label}`}>
          <div className="bn-mini">
            <Seams />
            <span className="bn-mini-icon">{prevTab.icon}</span>
          </div>
          <span className="bn-side-label">{prevTab.label}</span>
        </button>

        {/* ── Main ball ── */}
        <div className={`bn-main-outer bn-anim-${anim}`}>
          <button
            className="bn-main"
            style={{ '--accent': displayedTab.color }}
            onClick={next}
            aria-label={`${displayedTab.label} — cliquer pour suivant`}
          >
            <Seams />
            <div className="bn-shine" />
            <div className="bn-center">
              <span className="bn-big-icon">{displayedTab.icon}</span>
              <span className="bn-big-label">{displayedTab.label}</span>
            </div>
          </button>
          <div className="bn-orbit" style={{ '--accent': displayedTab.color }} />
        </div>

        {/* ── Right mini ball (next) ── */}
        <button className="bn-side bn-side-right" onClick={next} aria-label={`Aller à ${nextTab.label}`}>
          <div className="bn-mini">
            <Seams />
            <span className="bn-mini-icon">{nextTab.icon}</span>
          </div>
          <span className="bn-side-label">{nextTab.label}</span>
        </button>

      </div>

      {/* ── Dots ── */}
      <div className="bn-dots" role="tablist">
        {BALL_TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === currentIndex}
            className={`bn-dot${i === currentIndex ? ' active' : ''}`}
            style={i === currentIndex ? { '--accent': t.color } : {}}
            onClick={() => goTo(i)}
            aria-label={t.label}
          />
        ))}
      </div>
    </nav>
  );
}
