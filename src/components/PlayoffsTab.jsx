import { useState } from 'react';
import { computePlayerData, today } from '../utils';
import { PLAYER_TEAMS } from '../data';

const DEFAULT_TEAMS = {
  east: Array(8).fill('').map((_, i) => ({ seed: i+1, name: '', eliminated: false })),
  west: Array(8).fill('').map((_, i) => ({ seed: i+1, name: '', eliminated: false })),
};

export default function PlayoffsTab({ picks }) {
  const [playoffTeams, setPlayoffTeams] = useState(() => {
    try {
      const s = localStorage.getItem('ttfl_playoff_teams');
      return s ? JSON.parse(s) : DEFAULT_TEAMS;
    } catch { return DEFAULT_TEAMS; }
  });
  const [showConfig, setShowConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState(null);

  const playerData = computePlayerData(picks, today());

  const allPlayoffTeams = [
    ...playoffTeams.east.map(t => t.name).filter(Boolean),
    ...playoffTeams.west.map(t => t.name).filter(Boolean),
  ];

  const qualifiedElim = [
    ...playoffTeams.east.filter(t => t.name && t.eliminated).map(t => t.name),
    ...playoffTeams.west.filter(t => t.name && t.eliminated).map(t => t.name),
  ];

  // Available players on playoff teams
  const availablePlayers = playerData.filter(p => {
    const team = PLAYER_TEAMS[p.player];
    return team && allPlayoffTeams.includes(team) && p.isAvailable && !qualifiedElim.includes(team);
  });

  // Group by team
  const byTeam = {};
  availablePlayers.forEach(p => {
    const team = PLAYER_TEAMS[p.player];
    if (!byTeam[team]) byTeam[team] = [];
    byTeam[team].push(p);
  });

  function openConfig() {
    setConfigDraft(JSON.parse(JSON.stringify(playoffTeams)));
    setShowConfig(true);
  }

  function saveConfig() {
    setPlayoffTeams(configDraft);
    localStorage.setItem('ttfl_playoff_teams', JSON.stringify(configDraft));
    setShowConfig(false);
  }

  function SeriesSlot({ conf, round, matchIndex }) {
    const teams = playoffTeams[conf];
    if (!teams) return null;

    let t1seed, t2seed;
    if (round === 0) {
      const pairs = [[1,8],[4,5],[3,6],[2,7]];
      [t1seed, t2seed] = pairs[matchIndex] || [0,0];
    } else {
      return <div className="series-card"><div className="series-team" style={{color:'#aaa',fontSize:11}}>TBD</div></div>;
    }

    const t1 = teams.find(t => t.seed === t1seed);
    const t2 = teams.find(t => t.seed === t2seed);

    return (
      <div className="series-card">
        <div className={`series-team${t1?.eliminated ? ' series-elim' : ''}`}>
          <span className="bs-seed">{t1seed}</span>
          <span className="series-name">{t1?.name || 'TBD'}</span>
        </div>
        <div className={`series-team${t2?.eliminated ? ' series-elim' : ''}`}>
          <span className="bs-seed">{t2seed}</span>
          <span className="series-name">{t2?.name || 'TBD'}</span>
        </div>
      </div>
    );
  }

  const hasTeams = allPlayoffTeams.length > 0;

  return (
    <div className="playoffs-layout">
      <div className="playoffs-main">
        <div className="playoffs-status-banner">
          🏆 Playoffs NBA 2025-26 — 18 avril 2026
        </div>

        <div className="playoffs-controls">
          <button className="btn-playoff-refresh" onClick={openConfig}>⚙️ Configurer les équipes</button>
        </div>

        {hasTeams && (
          <div className="playoff-bracket-wrap">
            {(['west','east']).map(conf => (
              <div key={conf} className="bracket-conf-section">
                <div className="bracket-conf-title">
                  {conf === 'west' ? '🔴 Conférence Ouest' : '🔵 Conférence Est'}
                </div>
                <div className="bracket-rounds-wrap">
                  <div className="bracket-round">
                    <div className="bracket-round-label">1er tour</div>
                    {[0,1,2,3].map(i => (
                      <SeriesSlot key={i} conf={conf} round={0} matchIndex={i} />
                    ))}
                  </div>
                  <div className="bracket-round">
                    <div className="bracket-round-label">Demi-finale</div>
                    {[0,1].map(i => <div key={i} className="series-card"><div className="series-team" style={{color:'#aaa',fontSize:11,padding:'8px'}}>TBD</div></div>)}
                  </div>
                  <div className="bracket-round">
                    <div className="bracket-round-label">Finale conf.</div>
                    <div className="series-card"><div className="series-team" style={{color:'#aaa',fontSize:11,padding:'8px'}}>TBD</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <div className="playoffs-avail-header">
            <span>🎯 Joueurs disponibles en playoffs</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{availablePlayers.length} joueur{availablePlayers.length !== 1 ? 's' : ''}</span>
          </div>

          {!hasTeams ? (
            <div className="playoffs-empty">Configure les équipes qualifiées pour voir les joueurs disponibles.</div>
          ) : Object.keys(byTeam).length === 0 ? (
            <div className="playoffs-empty">Aucun joueur suivi disponible sur ces équipes.</div>
          ) : (
            <div className="playoffs-avail-grid">
              {Object.entries(byTeam).map(([team, players]) => (
                <div key={team} className="avail-team-block">
                  <div className="avail-team-header">{team}</div>
                  <div className="avail-players">
                    {players.map(p => (
                      <span key={p.player} className="avail-player-chip">
                        {p.player} {p.best_score !== null && <span style={{opacity:.6}}>{p.best_score}pts</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="playoffs-sidebar">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🏀 Infos playoffs</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
          Les playoffs NBA 2025-26 débutent le <strong style={{color:'#FFD700'}}>18 avril 2026</strong>.<br /><br />
          Configure les 16 équipes qualifiées (8 par conférence) pour voir tes joueurs disponibles.
        </div>
        <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
          Total picks enregistrés : <strong style={{color:'#fff'}}>{picks.length}</strong>
        </div>
      </div>

      {/* Config modal */}
      {showConfig && configDraft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 700, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 15 }}>
              <span>⚙️ Équipes qualifiées pour les playoffs</span>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'flex', overflowY: 'auto', flex: 1 }}>
              {['east','west'].map(conf => (
                <div key={conf} style={{ flex: 1, padding: 16, borderRight: conf === 'east' ? '1px solid #f1f5f9' : undefined }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                    {conf === 'east' ? '🔵 Conférence Est' : '🔴 Conférence Ouest'} (1→8)
                  </div>
                  {configDraft[conf].map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ background: '#1e293b', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 700, padding: '2px 7px', flexShrink: 0, width: 24, textAlign: 'center' }}>{t.seed}</span>
                      <input
                        type="text"
                        value={t.name}
                        onChange={e => {
                          const next = JSON.parse(JSON.stringify(configDraft));
                          next[conf][i].name = e.target.value;
                          setConfigDraft(next);
                        }}
                        placeholder="Nom de l'équipe…"
                        list="nba-teams-config-list"
                        style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12 }}
                      />
                      <label style={{ fontSize: 11, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <input
                          type="checkbox" checked={t.eliminated}
                          onChange={e => {
                            const next = JSON.parse(JSON.stringify(configDraft));
                            next[conf][i].eliminated = e.target.checked;
                            setConfigDraft(next);
                          }}
                        /> Éliminée
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <datalist id="nba-teams-config-list">
              {["Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls","Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors","Houston Rockets","Indiana Pacers","LA Clippers","Los Angeles Lakers","Memphis Grizzlies","Miami Heat","Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks","Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers","Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards"].map(t => <option key={t} value={t} />)}
            </datalist>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={saveConfig} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
