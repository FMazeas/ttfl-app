import { useState, useMemo } from 'react';
import { computePlayerData, formatDate, today, parseDate, addDays, daysBetween, todayStr, getScoreClass, getAllPlayerNames } from '../utils';
import { TEAM_COLORS } from '../data';
import PlayerModal from './PlayerModal';

export default function DisponibiliteTab({ picks, onAddPick }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('available_from');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('all');
  const [simDate, setSimDate] = useState('');
  const [formDate, setFormDate] = useState(todayStr());
  const [formPlayer, setFormPlayer] = useState('');
  const [formScore, setFormScore] = useState('');
  const [formBonus, setFormBonus] = useState('');
  const [modalPlayer, setModalPlayer] = useState(null);

  const refDate = simDate ? parseDate(simDate) : null;
  const playerData = useMemo(() => computePlayerData(picks, refDate), [picks, simDate]);
  const todayD = refDate || today();

  const allNames = useMemo(() => getAllPlayerNames(picks), [picks]);

  // Stats
  const available = playerData.filter(d => d.isAvailable).length;
  const cooldown = playerData.filter(d => !d.isAvailable).length;
  const scores = picks.map(p => p.score);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Newly available (became available in last 3 days)
  const newlyAvail = useMemo(() => {
    return playerData.filter(d => {
      if (!d.isAvailable || !d.available_from) return false;
      const diff = daysBetween(d.available_from, todayD);
      return diff >= 0 && diff <= 3;
    }).sort((a, b) => b.best_score - a.best_score);
  }, [playerData, todayD]);

  // Soon available (1-7 days)
  const soonAvail = useMemo(() => {
    return playerData.filter(d => !d.isAvailable && d.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [playerData]);

  // Filtered & sorted
  const displayed = useMemo(() => {
    let data = [...playerData];

    if (search) {
      data = data.filter(d => d.player.toLowerCase().includes(search.toLowerCase()));
    }
    if (filter === 'available') data = data.filter(d => d.isAvailable);
    if (filter === 'cooldown') data = data.filter(d => !d.isAvailable);
    if (filter === 'picked') data = data.filter(d => d.uses > 0);

    data.sort((a, b) => {
      let va, vb;
      switch (sortField) {
        case 'player': va = a.player; vb = b.player; break;
        case 'team': va = a.team; vb = b.team; break;
        case 'last_used':
          va = a.last_used ? a.last_used.getTime() : 0;
          vb = b.last_used ? b.last_used.getTime() : 0;
          break;
        case 'best_score': va = a.best_score ?? -999; vb = b.best_score ?? -999; break;
        default: // available_from
          if (a.isAvailable && !b.isAvailable) return sortAsc ? -1 : 1;
          if (!a.isAvailable && b.isAvailable) return sortAsc ? 1 : -1;
          if (a.isAvailable && b.isAvailable) {
            va = a.best_score ?? -999; vb = b.best_score ?? -999;
          } else {
            va = a.daysLeft; vb = b.daysLeft;
          }
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    return data;
  }, [playerData, search, filter, sortField, sortAsc]);

  function handleSort(field) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  function handleAddPick(e) {
    e.preventDefault();
    if (!formDate || !formPlayer.trim() || formScore === '') return;
    onAddPick({ date: formDate, player: formPlayer.trim(), score: Number(formScore), bonus: formBonus || null });
    setFormPlayer('');
    setFormScore('');
    setFormBonus('');
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon">{sortAsc ? '↑' : '↓'}</span>;
  }

  return (
    <div>
      {/* Stats */}
      <div className="stats">
        <div className="stat-card green">
          <div className="label">Disponibles</div>
          <div className="value">{available}</div>
        </div>
        <div className="stat-card red">
          <div className="label">En cooldown</div>
          <div className="value">{cooldown}</div>
        </div>
        <div className="stat-card orange">
          <div className="label">Total picks</div>
          <div className="value">{picks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Score moyen</div>
          <div className="value">{avg} pts</div>
        </div>
      </div>

      {/* Add pick */}
      <div className="add-pick-section">
        <h3>➕ Enregistrer un nouveau pick</h3>
        <form className="add-pick-form" onSubmit={handleAddPick}>
          <div className="form-group">
            <label>Date du pick</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Joueur</label>
            <input
              type="text" value={formPlayer} onChange={e => setFormPlayer(e.target.value)}
              placeholder="ex. Luka Doncic" list="players-datalist" required
            />
            <datalist id="players-datalist">
              {allNames.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label>Score TTFL</label>
            <input type="number" value={formScore} onChange={e => setFormScore(e.target.value)}
              placeholder="ex. 45" style={{ width: 110 }} required />
          </div>
          <div className="form-group">
            <label>Bonus</label>
            <select value={formBonus} onChange={e => setFormBonus(e.target.value)} style={{ width: 90 }}>
              <option value="">—</option>
              <option value="x2">x2</option>
            </select>
          </div>
          <button type="submit" className="btn-add">Valider</button>
        </form>
      </div>

      {/* Simulation date */}
      <div className="sim-bar">
        <label>📅 Simuler la disponibilité au :</label>
        <input type="date" value={simDate} onChange={e => setSimDate(e.target.value)} />
        {simDate && <span className="sim-active-badge">Mode simulation</span>}
        {simDate && (
          <button className="btn-sim-reset" onClick={() => setSimDate('')}>Revenir à aujourd'hui</button>
        )}
      </div>

      {/* Banners */}
      {newlyAvail.length > 0 && (
        <div className="newly-avail-banner">
          <span className="newly-avail-icon">🟢</span>
          <div>
            <div className="newly-avail-label">Nouveaux disponibles (3 derniers jours)</div>
            <div className="newly-avail-chips">
              {newlyAvail.map(p => (
                <span key={p.player} className="newly-avail-chip" onClick={() => setModalPlayer(p)}>
                  {p.player}
                  {p.best_score !== null && <span style={{ fontWeight: 400, fontSize: 11 }}>{p.best_score}pts</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {soonAvail.length > 0 && (
        <div className="recently-avail-banner">
          <span className="newly-avail-icon">⏳</span>
          <div>
            <div className="recently-avail-label">Bientôt disponibles (≤ 7 jours)</div>
            <div className="newly-avail-chips">
              {soonAvail.map(p => (
                <span key={p.player} className="recently-avail-chip" onClick={() => setModalPlayer(p)}>
                  {p.player}
                  <span className="chip-since">J+{p.daysLeft}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="search-box">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Rechercher un joueur…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="sort-select" value={sortField} onChange={e => handleSort(e.target.value)}>
          <option value="available_from">Trier par disponibilité</option>
          <option value="player">Trier par nom</option>
          <option value="team">Trier par équipe</option>
          <option value="last_used">Trier par dernier pick</option>
          <option value="best_score">Trier par meilleur score</option>
        </select>
        <select className="sort-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tous les joueurs</option>
          <option value="available">Disponibles seulement</option>
          <option value="cooldown">En cooldown</option>
          <option value="picked">Déjà pickés</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun joueur trouvé.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('player')} className={sortField === 'player' ? 'sorted' : ''}>
                  Joueur <SortIcon field="player" />
                </th>
                <th onClick={() => handleSort('team')} className={sortField === 'team' ? 'sorted' : ''}>
                  Équipe <SortIcon field="team" />
                </th>
                <th onClick={() => handleSort('available_from')} className={sortField === 'available_from' ? 'sorted' : ''}>
                  Statut <SortIcon field="available_from" />
                </th>
                <th onClick={() => handleSort('last_used')} className={sortField === 'last_used' ? 'sorted' : ''}>
                  Dernier pick <SortIcon field="last_used" />
                </th>
                <th onClick={() => handleSort('best_score')} className={sortField === 'best_score' ? 'sorted' : ''}>
                  Meilleur score <SortIcon field="best_score" />
                </th>
                <th>Progression</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(p => {
                const color = TEAM_COLORS[p.team] || '#6B7280';
                return (
                  <tr key={p.player}>
                    <td>
                      <div className="player-name" onClick={() => p.uses > 0 && setModalPlayer(p)}>{p.player}</div>
                      {p.uses > 0 && <div className="player-uses">{p.uses} pick{p.uses > 1 ? 's' : ''}</div>}
                    </td>
                    <td>
                      <span className="team-dot" style={{ background: color }} />
                      <span style={{ fontSize: 13 }}>{p.team}</span>
                    </td>
                    <td>
                      {p.isAvailable ? (
                        <span className="badge available"><span className="dot" />Disponible</span>
                      ) : (
                        <span className="badge cooldown"><span className="dot" />J+{p.daysLeft}</span>
                      )}
                    </td>
                    <td className="date-text">
                      {p.last_used ? formatDate(p.last_used) : '—'}
                    </td>
                    <td>
                      {p.best_score !== null ? (
                        <span className={`score-tag ${getScoreClass(p.best_score)}`}>{p.best_score} pts</span>
                      ) : '—'}
                    </td>
                    <td>
                      {!p.isAvailable && p.available_from ? (
                        <div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(100, Math.round((30 - p.daysLeft) / 30 * 100))}%` }}
                            />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                            {formatDate(p.available_from)}
                          </div>
                        </div>
                      ) : (
                        <div className="progress-bar">
                          <div className="progress-fill done" style={{ width: '100%' }} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalPlayer && <PlayerModal player={modalPlayer} onClose={() => setModalPlayer(null)} />}
    </div>
  );
}
