import { useState } from 'react';
import { todayStr, computePlayerData, today } from '../utils';
import { PLAYER_TEAMS } from '../data';
import PlanningsSidebar from './Planningsidebar';

function getTeamAbbr(name) {
  const map = {
    "Atlanta Hawks":"ATL","Boston Celtics":"BOS","Brooklyn Nets":"BKN",
    "Charlotte Hornets":"CHA","Chicago Bulls":"CHI","Cleveland Cavaliers":"CLE",
    "Dallas Mavericks":"DAL","Denver Nuggets":"DEN","Detroit Pistons":"DET",
    "Golden State Warriors":"GSW","Houston Rockets":"HOU","Indiana Pacers":"IND",
    "LA Clippers":"LAC","Los Angeles Clippers":"LAC","Los Angeles Lakers":"LAL",
    "Memphis Grizzlies":"MEM","Miami Heat":"MIA","Milwaukee Bucks":"MIL",
    "Minnesota Timberwolves":"MIN","New Orleans Pelicans":"NOP","New York Knicks":"NYK",
    "Oklahoma City Thunder":"OKC","Orlando Magic":"ORL","Philadelphia 76ers":"PHI",
    "Phoenix Suns":"PHX","Portland Trail Blazers":"POR","Sacramento Kings":"SAC",
    "San Antonio Spurs":"SAS","Toronto Raptors":"TOR","Utah Jazz":"UTA",
    "Washington Wizards":"WAS",
  };
  return map[name] || name?.substring(0, 3).toUpperCase() || '?';
}

const NBA_IDS = {
  ATL:1610612737,BOS:1610612738,BKN:1610612751,CHA:1610612766,CHI:1610612741,
  CLE:1610612739,DAL:1610612742,DEN:1610612743,DET:1610612765,GSW:1610612744,
  HOU:1610612745,IND:1610612754,LAC:1610612746,LAL:1610612747,MEM:1610612763,
  MIA:1610612748,MIL:1610612749,MIN:1610612750,NOP:1610612740,NYK:1610612752,
  OKC:1610612760,ORL:1610612753,PHI:1610612755,PHX:1610612756,POR:1610612757,
  SAC:1610612758,SAS:1610612759,TOR:1610612761,UTA:1610612762,WAS:1610612764,
};

function logoUrl(teamName) {
  const abbr = getTeamAbbr(teamName);
  const id = NBA_IDS[abbr];
  return id ? `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg` : '';
}

// Build a reverse map: teamName → players tracked
function getTrackedByTeam(picks) {
  const map = {};
  const playerData = computePlayerData(picks, today());
  playerData.forEach(p => {
    if (p.uses === 0) return;
    const team = PLAYER_TEAMS[p.player];
    if (!team) return;
    if (!map[team]) map[team] = [];
    map[team].push(p);
  });
  return map;
}

function formatGameTime(utcStr) {
  if (!utcStr) return '';
  try {
    const d = new Date(utcStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) + ' (Paris)';
  } catch { return ''; }
}

export default function CalendrierTab({ picks, planningPicks, onAddPlanning, onDeletePlanning }) {
  const [dateStr, setDateStr] = useState(todayStr());
  const [games, setGames] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trackedByTeam = getTrackedByTeam(picks);

  async function loadCalendar() {
    if (!dateStr) return;
    setLoading(true);
    setError('');
    setGames(null);

    const d = dateStr.replace(/-/g, '');
    const prevDate = new Date(dateStr);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevD = `${prevDate.getFullYear()}${String(prevDate.getMonth()+1).padStart(2,'0')}${String(prevDate.getDate()).padStart(2,'0')}`;

    try {
      const [res, prevRes] = await Promise.all([
        fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${d}`),
        fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${prevD}`),
      ]);
      const json = await res.json();
      const prevJson = await prevRes.json();

      // Build B2B set from prev day
      const b2bTeams = new Set();
      (prevJson.events || []).forEach(ev => {
        ev.competitions?.[0]?.competitors?.forEach(c => b2bTeams.add(c.team?.displayName));
      });

      const events = json.events || [];
      if (events.length === 0) {
        setGames([]);
      } else {
        setGames(events.map(ev => {
          const comp = ev.competitions?.[0];
          const competitors = comp?.competitors || [];
          const home = competitors.find(c => c.homeAway === 'home');
          const away = competitors.find(c => c.homeAway === 'away');
          const status = comp?.status?.type?.description || '';
          const time = comp?.date;
          return {
            id: ev.id,
            home: home?.team?.displayName,
            away: away?.team?.displayName,
            homeScore: home?.score,
            awayScore: away?.score,
            status,
            time,
            homeB2B: b2bTeams.has(home?.team?.displayName),
            awayB2B: b2bTeams.has(away?.team?.displayName),
          };
        }));
      }
    } catch (e) {
      setError('Erreur lors du chargement des matchs. Vérifie ta connexion.');
    } finally {
      setLoading(false);
    }
  }

  function changeDate(delta) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + delta);
    const newStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    setDateStr(newStr);
    setGames(null);
  }

  function TeamPlayers({ teamName }) {
    const players = trackedByTeam[teamName] || [];
    if (players.length === 0) return <div className="no-tracked">Aucun joueur suivi</div>;
    return players.map(p => (
      <div key={p.player} className="game-player-row">
        <span className="game-player-name">{p.player}</span>
        {p.isAvailable ? (
          <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>✓ Dispo</span>
        ) : (
          <span style={{ fontSize: 11, color: '#DC2626' }}>J+{p.daysLeft}</span>
        )}
        {p.best_score !== null && (
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.best_score}pts</span>
        )}
      </div>
    ));
  }

  return (
    <div className="cal-main-layout">
      <div className="cal-body-col">
        <div className="cal-controls">
          <div className="form-group">
            <label style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 500 }}>Date</label>
            <input
              type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <button className="cal-nav-btn" onClick={() => changeDate(-1)}>←</button>
          <button className="cal-nav-btn" onClick={() => changeDate(1)}>→</button>
          <button className="btn-cal" onClick={loadCalendar}>🏀 Charger les matchs</button>
        </div>

        {loading && <div className="cal-loading">⏳ Chargement des matchs…</div>}
        {error && <div className="cal-loading" style={{ color: 'var(--red)' }}>{error}</div>}

        {!loading && games === null && (
          <div className="cal-loading">Sélectionne une date et clique sur "Charger les matchs".</div>
        )}

        {!loading && games !== null && games.length === 0 && (
          <div className="cal-loading">Aucun match NBA ce jour-là.</div>
        )}

        {!loading && games && games.map(game => (
          <div key={game.id} className="game-card">
            <div className="game-header">
              <span className="game-time">{formatGameTime(game.time)}</span>
              <span className="game-status">{game.status}</span>
            </div>
            <div className="game-body">
              {/* Away */}
              <div>
                <div className="game-team-header">
                  <img src={logoUrl(game.away)} alt={game.away} onError={e => e.target.style.display='none'} />
                  <strong>{game.away}</strong>
                  <span className="away-badge">EXT</span>
                  {game.awayB2B && <span className="btob-badge">B2B</span>}
                  {game.awayScore && <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{game.awayScore}</span>}
                </div>
                <TeamPlayers teamName={game.away} />
              </div>

              {/* VS */}
              <div className="vs-col">
                <span className="vs-text">VS</span>
              </div>

              {/* Home */}
              <div>
                <div className="game-team-header">
                  <img src={logoUrl(game.home)} alt={game.home} onError={e => e.target.style.display='none'} />
                  <strong>{game.home}</strong>
                  <span className="home-badge">DOM</span>
                  {game.homeB2B && <span className="btob-badge">B2B</span>}
                  {game.homeScore && <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{game.homeScore}</span>}
                </div>
                <TeamPlayers teamName={game.home} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <PlanningsSidebar
        picks={picks}
        planningPicks={planningPicks}
        onAdd={onAddPlanning}
        onDelete={onDeletePlanning}
      />
    </div>
  );
}
