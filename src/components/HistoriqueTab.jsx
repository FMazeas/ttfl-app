import { formatDate, parseDate, getScoreClass } from '../utils';

export default function HistoriqueTab({ picks, onDeletePick }) {
  const sorted = [...picks].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="table-wrap">
        {sorted.length === 0 ? (
          <div className="empty-state"><p>Aucun pick enregistré.</p></div>
        ) : (
          <>
            <div className="history-header">
              <div>Date</div>
              <div>Joueur</div>
              <div>Score</div>
              <div>Bonus</div>
            </div>
            {sorted.map((p, i) => (
              <div key={i} className="pick-row">
                <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                  {formatDate(parseDate(p.date))}
                </span>
                <span style={{ fontWeight: 600 }}>{p.player}</span>
                <span>
                  <span className={`score-tag ${getScoreClass(p.score)}`}>{p.score} pts</span>
                </span>
                <span>
                  {p.bonus === 'x2' && <span className="score-tag x2">x2</span>}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
