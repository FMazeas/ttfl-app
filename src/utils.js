import { COOLDOWN_DAYS, PLAYER_TEAMS, EXTRA_PLAYERS } from './data';

export function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

export function formatDate(d) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(d) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getTeamAbbr(team) {
  const map = {
    "Atlanta Hawks": "ATL", "Boston Celtics": "BOS", "Brooklyn Nets": "BKN",
    "Charlotte Hornets": "CHA", "Chicago Bulls": "CHI", "Cleveland Cavaliers": "CLE",
    "Dallas Mavericks": "DAL", "Denver Nuggets": "DEN", "Detroit Pistons": "DET",
    "Golden State Warriors": "GSW", "Houston Rockets": "HOU", "Indiana Pacers": "IND",
    "LA Clippers": "LAC", "Los Angeles Clippers": "LAC", "Los Angeles Lakers": "LAL",
    "Memphis Grizzlies": "MEM", "Miami Heat": "MIA", "Milwaukee Bucks": "MIL",
    "Minnesota Timberwolves": "MIN", "New Orleans Pelicans": "NOP", "New York Knicks": "NYK",
    "Oklahoma City Thunder": "OKC", "Orlando Magic": "ORL", "Philadelphia 76ers": "PHI",
    "Phoenix Suns": "PHX", "Portland Trail Blazers": "POR", "Sacramento Kings": "SAC",
    "San Antonio Spurs": "SAS", "Toronto Raptors": "TOR", "Utah Jazz": "UTA",
    "Washington Wizards": "WAS",
  };
  return map[team] || team?.substring(0, 3).toUpperCase() || '—';
}

export function getTeamLogoUrl(teamName) {
  const abbr = getTeamAbbr(teamName);
  return `https://cdn.nba.com/logos/nba/${nbaTeamId(abbr)}/global/L/logo.svg`;
}

function nbaTeamId(abbr) {
  const ids = {
    ATL:1610612737, BOS:1610612738, BKN:1610612751, CHA:1610612766, CHI:1610612741,
    CLE:1610612739, DAL:1610612742, DEN:1610612743, DET:1610612765, GSW:1610612744,
    HOU:1610612745, IND:1610612754, LAC:1610612746, LAL:1610612747, MEM:1610612763,
    MIA:1610612748, MIL:1610612749, MIN:1610612750, NOP:1610612740, NYK:1610612752,
    OKC:1610612760, ORL:1610612753, PHI:1610612755, PHX:1610612756, POR:1610612757,
    SAC:1610612758, SAS:1610612759, TOR:1610612761, UTA:1610612762, WAS:1610612764,
  };
  return ids[abbr] || 0;
}

export function getScoreClass(score) {
  if (score === null || score === undefined) return '';
  if (score >= 50) return 'high';
  if (score >= 30) return 'mid';
  return 'low';
}

export function computePlayerData(picks, refDate) {
  const map = {};
  picks.forEach(p => {
    if (!map[p.player]) map[p.player] = { player: p.player, picks: [] };
    map[p.player].picks.push(p);
  });

  const todayD = refDate || today();

  EXTRA_PLAYERS.forEach(name => {
    if (!map[name]) map[name] = { player: name, picks: [], isExtra: true };
  });

  return Object.values(map).map(({ player, picks: ps, isExtra }) => {
    if (isExtra) {
      return {
        player,
        team: PLAYER_TEAMS[player] || '—',
        isAvailable: true,
        available_from: null,
        daysLeft: 0,
        last_used: null,
        best_score: null,
        avg_score: null,
        uses: 0,
        picks: [],
      };
    }

    const sorted = [...ps].sort((a, b) => b.date.localeCompare(a.date));
    const last = sorted[0];
    const lastDate = parseDate(last.date);
    const availDate = addDays(lastDate, COOLDOWN_DAYS + 1);
    const isAvail = todayD >= availDate;
    const daysLeft = isAvail ? 0 : daysBetween(todayD, availDate);
    const scores = ps.map(p => p.score).filter(s => s !== null);
    const best = scores.length ? Math.max(...scores) : null;
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return {
      player,
      team: PLAYER_TEAMS[player] || '—',
      isAvailable: isAvail,
      available_from: availDate,
      daysLeft,
      last_used: lastDate,
      best_score: best,
      avg_score: avg,
      uses: ps.length,
      picks: sorted,
    };
  });
}

export function getAllPlayerNames(picks) {
  const fromPicks = picks.map(p => p.player);
  return [...new Set([...fromPicks, ...EXTRA_PLAYERS])].sort();
}
