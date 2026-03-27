import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { RAW_PICKS } from './data';
import { formatDate, today } from './utils';
import DisponibiliteTab from './components/DisponibiliteTab';
import HistoriqueTab    from './components/HistoriqueTab';
import CalendrierTab    from './components/CalendrierTab';
import PlayoffsTab      from './components/PlayoffsTab';
import GameTab          from './components/GameTab';
import IntroAnimation   from './components/IntroAnimation';
import BallMenu, { MENU_TABS } from './components/BallMenu';

function loadPicks() {
  try { const s = localStorage.getItem('ttfl_picks'); if (s) return JSON.parse(s); } catch {}
  return [...RAW_PICKS];
}
function loadPlanning() {
  try { const s = localStorage.getItem('ttfl_planning'); if (s) return JSON.parse(s); } catch {}
  return [];
}
function loadTheme() {
  try { return localStorage.getItem('ttfl_theme') || 'dark'; } catch { return 'dark'; }
}

export default function App() {
  // ── Always show intro on every refresh ──
  const [showIntro, setShowIntro]         = useState(true);
  const [inMenu,    setInMenu]            = useState(false); // ball menu visible?
  const [activeTab, setActiveTab]         = useState('calendrier');
  const [picks,     setPicks]             = useState(loadPicks);
  const [planningPicks, setPlanningPicks] = useState(loadPlanning);
  const [toast,     setToast]             = useState({ msg: '', visible: false });
  const [theme,     setTheme]             = useState(loadTheme);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ttfl_theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('ttfl_picks',    JSON.stringify(picks));         }, [picks]);
  useEffect(() => { localStorage.setItem('ttfl_planning', JSON.stringify(planningPicks)); }, [planningPicks]);

  const showToast = useCallback((msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  function handleAddPick(pick) {
    if (picks.find(p => p.date === pick.date)) {
      showToast(`⚠️ Un pick existe déjà pour le ${pick.date}`);
      return;
    }
    setPicks(prev => [...prev, pick].sort((a, b) => a.date.localeCompare(b.date)));
    showToast(`✅ ${pick.player} ajouté !`);
  }

  function handleAddPlanning(item) {
    setPlanningPicks(prev => {
      const filtered = prev.filter(p => p.date !== item.date);
      return [...filtered, item].sort((a, b) => a.date.localeCompare(b.date));
    });
    showToast(`✅ ${item.player} planifié`);
  }

  function handleDeletePlanning(item) {
    setPlanningPicks(prev => prev.filter(p => !(p.date === item.date && p.player === item.player)));
  }

  // Intro → ball menu
  function handleIntroComplete() {
    setShowIntro(false);
    setInMenu(true);
  }

  // Ball menu → content
  function handleEnterTab(tabId) {
    setActiveTab(tabId);
    setInMenu(false);
  }

  const todayD = today();

  /* ──────────────────────────────────────────────────── */
  return (
    <>
      {/* 1. Intro animation (always on load) */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      {/* 2. Ball menu (landing page) */}
      {!showIntro && inMenu && (
        <BallMenu
          onEnter={handleEnterTab}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
      )}

      {/* 3. Content pages */}
      {!showIntro && !inMenu && (
        <>
          <header>
            <div className="header-brand">
              {/* Back to ball menu */}
              <button
                className="header-ball back-btn"
                onClick={() => setInMenu(true)}
                title="Retour au menu"
              >
                🏀
              </button>
              <div>
                <div className="logo">TTFL</div>
                <div className="subtitle">Trash Talk Fantasy League</div>
              </div>
            </div>

        {/* Current tab indicator */}
        <div className="header-tab-badge">
          <span className="header-tab-icon">{MENU_TABS.find(t => t.id === activeTab)?.icon}</span>
          <span className="header-tab-name">{MENU_TABS.find(t => t.id === activeTab)?.label}</span>
        </div>

            <div className="header-right">
              <div className="today-badge">
                Aujourd'hui : <span>{formatDate(todayD)}</span>
              </div>
              <button
                className="theme-toggle"
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                title="Changer de thème"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          <div className="container">
            <div key={activeTab} className="page-enter">
            {activeTab === 'calendrier' && (
              <CalendrierTab
                picks={picks}
                planningPicks={planningPicks}
                onAddPlanning={handleAddPlanning}
                onDeletePlanning={handleDeletePlanning}
              />
            )}
            {activeTab === 'disponibilite' && (
              <DisponibiliteTab picks={picks} onAddPick={handleAddPick} />
            )}
            {activeTab === 'historique' && (
              <HistoriqueTab picks={picks} />
            )}
            {activeTab === 'playoffs' && (
              <PlayoffsTab picks={picks} />
            )}
            {activeTab === 'game' && (
              <GameTab />
            )}
            </div>
          </div>

          <div className={`toast${toast.visible ? ' show' : ''}`}>{toast.msg}</div>
        </>
      )}
    </>
  );
}
