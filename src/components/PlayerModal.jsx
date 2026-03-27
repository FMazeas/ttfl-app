import { formatDate, parseDate, getScoreClass } from '../utils';
import { PLAYER_TEAMS, TEAM_COLORS } from '../data';

export default function PlayerModal({ player, onClose }) {
  if (!player) return null;

  const team = PLAYER_TEAMS[player.player] || '—';
  const color = TEAM_COLORS[team] || '#6B7280';
  const bestPick = player.picks[0];
  const hasX2 = player.picks.some(p => p.bonus === 'x2');

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <div className="modal-title">{player.player}</div>
            <div className="modal-subtitle" style={{ color }}>
              <span className="team-dot" style={{ background: color }} />
              {team}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {player.best_score !== null && (
          <div className="modal-score-row">
            <div className="modal-score-main">
              <div className="modal-big-score">{player.best_score}</div>
              <div className="modal-score-label">Meilleur score TTFL</div>
            </div>
            {hasX2 && <div className="modal-x2-badge">x2</div>}
          </div>
        )}

        <div className="modal-stats-grid">
          <div className="stat-cell">
            <div className="stat-val">{player.uses}</div>
            <div className="stat-lbl">Picks</div>
          </div>
          <div className="stat-cell">
            <div className="stat-val">{player.avg_score ?? '—'}</div>
            <div className="stat-lbl">Moy.</div>
          </div>
          <div className="stat-cell">
            <div className="stat-val">{player.isAvailable ? '✅' : `${player.daysLeft}j`}</div>
            <div className="stat-lbl">{player.isAvailable ? 'Dispo' : 'Cooldown'}</div>
          </div>
        </div>

        {player.picks.length > 0 && (
          <div className="modal-history">
            <h4>Historique des picks</h4>
            {player.picks.map((p, i) => (
              <div key={i} className="history-row">
                <span className="history-date">{formatDate(parseDate(p.date))}</span>
                <span className="history-score">
                  <span className={`score-tag ${getScoreClass(p.score)}`}>{p.score} pts</span>
                </span>
                {p.bonus === 'x2' && <span className="history-x2">x2</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
