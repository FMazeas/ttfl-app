import { useState, useEffect } from 'react';
import { today, todayStr, dateToStr, addDays, formatDateShort, parseDate, daysBetween } from '../utils';

function getWeeks(picks, weeksAhead = 8) {
  const t = today();
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((t.getDay() + 6) % 7)); // go to Monday

  const weeks = [];
  for (let w = -2; w < weeksAhead; w++) {
    const weekStart = addDays(monday, w * 7);
    const weekEnd = addDays(weekStart, 6);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d);
      const dayStr = dateToStr(day);
      days.push({ date: day, dateStr: dayStr });
    }
    weeks.push({ weekStart, weekEnd, days });
  }
  return weeks;
}

function getWeekNum(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
}

export default function PlanningsSidebar({ picks, planningPicks, onAdd, onDelete }) {
  const [addDate, setAddDate] = useState(todayStr());
  const [addPlayer, setAddPlayer] = useState('');
  const [openWeeks, setOpenWeeks] = useState(new Set());
  const todayD = today();
  const todayS = todayStr();

  const weeks = getWeeks(picks);

  // Auto-open current week
  useEffect(() => {
    const t = today();
    const monday = new Date(t);
    monday.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    setOpenWeeks(new Set([dateToStr(monday)]));
  }, []);

  function toggleWeek(key) {
    setOpenWeeks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAdd() {
    if (!addDate || !addPlayer.trim()) return;
    onAdd({ date: addDate, player: addPlayer.trim() });
    setAddPlayer('');
  }

  function getPickForDay(dateStr) {
    // First check real picks
    const real = picks.find(p => p.date === dateStr);
    if (real) return { ...real, isReal: true };
    // Then planning
    const plan = planningPicks.find(p => p.date === dateStr);
    if (plan) return { ...plan, isReal: false };
    return null;
  }

  const allNames = [...new Set([...picks.map(p => p.player)])].sort();

  // Compute stats for header
  const completedPicks = picks.filter(p => p.date <= todayS);
  const totalScore = completedPicks.reduce((a, p) => a + (p.score || 0), 0);
  const avgScore = completedPicks.length ? Math.round(totalScore / completedPicks.length) : 0;
  const bestScore = completedPicks.length ? Math.max(...completedPicks.map(p => p.score)) : 0;

  return (
    <div className="cal-planning-sidebar">
      <div className="planning-header">
        <span>📅 Mon planning</span>
        <span className="planning-subtitle">Picks réels + planifiés</span>
        <div className="planning-stats-row">
          <div className="planning-stat-pill">
            <span className="planning-stat-label">Picks</span>
            <span className="planning-stat-value">{completedPicks.length}</span>
          </div>
          <div className="planning-stat-pill">
            <span className="planning-stat-label">Moy.</span>
            <span className="planning-stat-value">{avgScore} pts</span>
          </div>
          <div className="planning-stat-pill">
            <span className="planning-stat-label">Best</span>
            <span className="planning-stat-value">{bestScore} pts</span>
          </div>
        </div>
      </div>

      <div className="planning-weeks-wrap">
        {weeks.map(({ weekStart, weekEnd, days }) => {
          const key = dateToStr(weekStart);
          const weekNum = getWeekNum(weekStart);
          const isCurrent = todayD >= weekStart && todayD <= weekEnd;
          const isOpen = openWeeks.has(key);

          const weekPicks = days.map(d => getPickForDay(d.dateStr)).filter(Boolean);
          const weekTotal = weekPicks.filter(p => p.isReal).reduce((a, p) => a + (p.score || 0), 0);

          const startLabel = formatDateShort(weekStart);
          const endLabel = formatDateShort(weekEnd);

          return (
            <div key={key}>
              <div
                className={`planning-week-header${isCurrent ? ' current-week' : ''}`}
                onClick={() => toggleWeek(key)}
              >
                <div>
                  <div className="planning-week-num">S{weekNum}</div>
                  <div className="planning-week-dates">{startLabel} – {endLabel}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {weekTotal > 0 && <span className="planning-week-total">{weekTotal} pts</span>}
                  <span className="planning-week-toggle" style={{ transform: isOpen ? 'rotate(90deg)' : '', transition: 'transform .2s' }}>›</span>
                </div>
              </div>

              {isOpen && (
                <div className="planning-week-body open">
                  {days.map(({ date, dateStr }) => {
                    const pick = getPickForDay(dateStr);
                    const isPast = date < todayD;
                    const isToday = dateStr === todayS;
                    const rowClass = `plan-row${isToday ? ' today-row' : isPast ? ' past-row' : ''}${pick?.bonus === 'x2' ? ' x2gold' : ''}`;
                    const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });

                    return (
                      <div key={dateStr} className={rowClass}>
                        <span className="plan-date-cell">{dateLabel}</span>
                        {pick ? (
                          <span className={`plan-player-cell${pick.bonus === 'x2' ? ' x2gold' : ''}${isPast && !isToday ? ' past-player' : ''}`}>
                            {pick.player}
                          </span>
                        ) : (
                          <span className="plan-empty-label">—</span>
                        )}
                        <span className={`plan-score-cell${pick?.score > 40 ? ' good' : pick?.score < 20 ? ' bad' : ''}${pick?.bonus === 'x2' ? ' x2gold' : ''}`}>
                          {pick?.score !== undefined ? `${pick.score} pts` : ''}
                          {!pick && !isPast && (
                            <button className="plan-add-btn" onClick={() => { setAddDate(dateStr); }}>+</button>
                          )}
                          {pick && !pick.isReal && (
                            <button className="plan-delete" onClick={() => onDelete(pick)}>×</button>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="planning-add-row">
        <input
          type="date" className="planning-input" value={addDate}
          onChange={e => setAddDate(e.target.value)} style={{ width: 110, flexShrink: 0 }}
        />
        <input
          type="text" className="planning-input" placeholder="Joueur…"
          value={addPlayer} onChange={e => setAddPlayer(e.target.value)}
          list="planning-players-list"
          style={{ flex: 1, minWidth: 0 }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <datalist id="planning-players-list">
          {allNames.map(n => <option key={n} value={n} />)}
        </datalist>
        <button className="planning-add-btn" onClick={handleAdd}>+</button>
      </div>
    </div>
  );
}
