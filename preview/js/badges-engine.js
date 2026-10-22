// Evaluates the Stage 1 badges (data/badges.js) against a user's logs.
// Each rule returns { earned, progress?: [have, need] }. Badges without a rule yet
// return { pending: true } and show as "Tracking soon".
import { BADGES } from './data/badges.js';
import { TEAMS, VENUES, VENUE_BY_ID, SPORT_OF, milesBetween, venueTzOffsetFromET } from './data/venues.js';

const MLB_CENTRAL = ['progressive', 'comerica', 'kauffman', 'target-field', 'rate-field', 'wrigley', 'american-family', 'busch', 'great-american', 'pnc'];
const COLONIES = ['NH', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA'];
const MLB_VENUES = VENUES.filter(v => v.teams.some(t => TEAMS[t].league === 'MLB')).map(v => v.id);

const minutes = t => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + m; };
const dayOfWeek = d => new Date(d + 'T12:00:00').getDay(); // 0 = Sunday
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

function isThanksgiving(d) {
  const x = new Date(d + 'T12:00:00');
  return x.getMonth() === 10 && x.getDay() === 4 && x.getDate() >= 22 && x.getDate() <= 28;
}

const count = (n, need) => ({ earned: n >= need, progress: [Math.min(n, need), need] });
const all = (have, need) => count(need.filter(x => have.has(x)).length, need.length);

function buildContext(logs, profile) {
  const games = logs.filter(l => l.home && l.away).map(l => ({ ...l, v: VENUE_BY_ID[l.venue] }));
  const visits = logs.map(l => ({ ...l, v: VENUE_BY_ID[l.venue] })).filter(l => l.v);
  const homeGames = (teamId, league) => games.filter(g => g.home === teamId && !g.neutral && (!league || g.league === league));
  const hasHome = teamId => homeGames(teamId).length > 0;
  const football = games.filter(g => SPORT_OF[g.league] === 'football');
  return { games, visits, profile, homeGames, hasHome, football, venueIds: new Set(visits.map(v => v.venue)) };
}

function homeFieldAdvantage(c, league) {
  const wins = {};
  c.games.filter(g => g.league === league && !g.neutral && g.homeScore > g.awayScore)
    .forEach(g => { wins[g.home] = (wins[g.home] || 0) + 1; });
  return count(Math.max(0, ...Object.values(wins)), 5);
}

const RULES = {
  'grand-slam': c => all(c.venueIds, MLB_VENUES),
  'calendar-grand-slam': c => {
    const byYear = {};
    c.visits.filter(v => MLB_VENUES.includes(v.venue)).forEach(v => {
      (byYear[v.date.slice(0, 4)] ||= new Set()).add(v.venue);
    });
    return count(Math.max(0, ...Object.values(byYear).map(s => s.size)), MLB_VENUES.length);
  },
  'basically-a-city': c => ({ earned: c.games.some(g => (g.attendance || g.v.capacity) >= 80000) }),
  'subway-series': c => ({ earned: c.games.some(g => ['yankee-stadium', 'citi-field'].includes(g.venue)) }),
  'quadrangle-of-hate': c => ({ earned: c.games.some(g => g.league === 'CFB' && ['cfb-iowa', 'cfb-minn', 'cfb-wis', 'cfb-neb'].some(t => g.home === t || g.away === t)) }),
  'no-place-like-home': c => {
    const home = c.profile.home;
    if (!home) return { earned: false };
    const cfb = VENUES.filter(v => v.teams.some(t => TEAMS[t].league === 'CFB'));
    const nearest = cfb.reduce((a, b) => (milesBetween(home, a) <= milesBetween(home, b) ? a : b));
    return { earned: c.venueIds.has(nearest.id) };
  },
  'planes-trains-and-automobiles': c => ({ earned: !!c.profile.home && c.visits.some(v => milesBetween(c.profile.home, v.v) > 500) }),
  'first-win': c => ({ earned: c.games.some(g => {
    const fav = c.profile.favoriteTeams || [];
    return (fav.includes(g.home) && g.homeScore > g.awayScore) || (fav.includes(g.away) && g.awayScore > g.homeScore);
  }) }),
  'opening-day-ace': c => ({ earned: c.games.some(g => g.league === 'MLB' && g.openingDay) }),
  'two-sport-athlete': c => count(new Set(c.games.map(g => SPORT_OF[g.league])).size, 2),
  'split-ticket': c => {
    const mlb = c.games.filter(g => g.league === 'MLB');
    return { earned: mlb.some(a => mlb.some(b => a.venue === b.venue && a.date !== b.date && minutes(a.time) < 17 * 60 && minutes(b.time) >= 17 * 60)) };
  },
  'sunday-scaries': c => count(c.games.filter(g => g.league === 'NFL').length, 10),
  'it-s-not-a-phase': c => ({ earned: c.visits.some(a => c.visits.some(b => a.venue === b.venue && +b.date.slice(0, 4) - +a.date.slice(0, 4) >= 10)) }),
  'home-field-advantage-nfl': c => homeFieldAdvantage(c, 'NFL'),
  'home-field-advantage-cfb': c => homeFieldAdvantage(c, 'CFB'),
  'home-field-advantage-mlb': c => homeFieldAdvantage(c, 'MLB'),
  'west-coast-best-coast': c => ({ earned: c.visits.some(v => ['CA', 'OR', 'WA'].includes(v.v.state)) }),
  'metlife-maniac': c => all(new Set(c.games.filter(g => g.venue === 'metlife').map(g => g.home)), ['nfl-nyg', 'nfl-nyj']),
  'new-york-s-true-team': c => ({ earned: c.games.some(g => [g.home, g.away].includes('nfl-buf') && ['nfl-nyg', 'nfl-nyj'].some(t => [g.home, g.away].includes(t))) }),
  'revolutionary': c => ({ earned: c.visits.some(v => COLONIES.includes(v.v.state)) }),
  'yellow-rose-of-texas': c => ({ earned: c.football.some(g => g.v.state === 'TX') }),
  'sunshine-and-gridiron': c => ({ earned: c.football.some(g => g.v.state === 'FL') }),
  '2-for-the-price-of-one': c => ({ earned: c.games.some(g => g.league === 'MLB' && g.doubleheader) }),
  'isn-t-it-work-right-now': c => ({ earned: c.games.some(g => {
    const d = dayOfWeek(g.date), m = minutes(g.time);
    return d >= 1 && d <= 5 && m >= 9 * 60 && m < 17 * 60;
  }) }),
  'weekend-warrior': c => ({ earned: c.games.some(n => n.league === 'NFL' && dayOfWeek(n.date) === 0 &&
    c.games.some(s => s.league === 'CFB' && s.date === addDays(n.date, -1))) }),
  'shutout': c => ({ earned: c.games.some(g => g.homeScore === 0 || g.awayScore === 0) }),
  'first-timer': c => count(c.visits.length, 1),
  'mr-popular': c => count((c.profile.following || []).length, 1),
  'green-monster-or-green-ivy': c => ({ earned: c.games.some(g => ['fenway', 'wrigley'].includes(g.venue)) }),
  'canadian-crossing': c => ({ earned: c.hasHome('mlb-tor') }),
  'midwest-diamond': c => count(MLB_CENTRAL.filter(id => c.venueIds.has(id)).length, 3),
  'cold-weather-ball': c => ({ earned: c.games.some(g => g.league === 'MLB' && ['04', '10'].includes(g.date.slice(5, 7))) }),
  '9-innings-strong': c => count(c.games.filter(g => g.league === 'MLB').length, 9),
  '27-outs-for-the-win': c => count(c.games.filter(g => g.league === 'MLB').length, 27),
  'mile-high-clubber': c => ({ earned: c.hasHome('nfl-den') }),
  'luck-of-the-irish': c => ({ earned: c.hasHome('cfb-nd') }),
  'turf-titan': c => ({ earned: c.football.some(g => g.v.surface === 'turf') }),
  'grass-purist': c => ({ earned: c.football.some(g => g.v.surface === 'grass') }),
  'more-bang-for-your-buck': c => ({ earned: c.games.some(g => g.extra) }),
  '4-corners': c => all(new Set(c.visits.map(v => v.v.state)), ['AZ', 'NM', 'CO', 'UT']),
  'will-the-real-death-valley-stand-up': c => all(c.venueIds, ['tiger-stadium', 'clemson-memorial']),
  'crack-of-dawn': c => ({ earned: c.games.some(g => minutes(g.time) <= 12 * 60) }),
  'primetime': c => ({ earned: c.games.some(g => minutes(g.time) - venueTzOffsetFromET(g.v) * 60 >= 19 * 60 + 30) }),
  'holiday-sports': c => ({ earned: c.games.some(g => g.date.endsWith('-10-31') || g.date.endsWith('-12-25') || isThanksgiving(g.date)) }),
  'red-kingdom': c => ({ earned: c.hasHome('nfl-kc') }),
  'a-capitol-idea': c => all(new Set(c.games.map(g => g.v.city)), ['Philadelphia', 'New York', 'Washington']),
  'viva-las-vegas': c => ({ earned: c.visits.some(v => v.v.city === 'Las Vegas') }),
  'you-got-a-friend-in-me': c => ({ earned: c.visits.some(v => (v.with || []).length > 0) }),
  'pirate-haven': c => ({ earned: ['mlb-pit', 'nfl-tb', 'nfl-min', 'cfb-ecu'].some(c.hasHome) }),
  'nick-saban-lifetime-achievement': c => all(new Set(c.games.filter(g => !g.neutral).map(g => g.home)), ['cfb-kent', 'cfb-tol', 'cfb-msu', 'cfb-lsu', 'nfl-mia', 'cfb-bama']),
  'today-i-am-switzerland': c => ({ earned: c.games.some(g => g.neutral) }),
  'windy-city-wizard': c => all(new Set(c.games.map(g => g.home)), ['mlb-cws', 'mlb-chc']),
  'keystone-klub': c => all(new Set(c.games.map(g => g.home)), ['mlb-pit', 'mlb-phi']),
  's-t-e-a-g-l-e-s-steagles': c => all(new Set(c.games.map(g => g.home)), ['nfl-pit', 'nfl-phi']),
  'big-kitty-club': c => all(new Set(c.games.map(g => g.home)), ['nfl-det', 'mlb-det']),
  'green-thumb': c => ({ earned: ['cfb-osu', 'cfb-stan'].some(c.hasHome) }),
  'the-grand-daddy-of-them-all': c => ({ earned: c.venueIds.has('rose-bowl') }),
  // Not yet tracked: need the full SEC venue list and team schedules
  // 'it-just-means-more', 'season-ticket'
};

export function evaluateBadges(logs, profile) {
  const c = buildContext(logs, profile);
  return BADGES.map(b => {
    const rule = RULES[b.id];
    return { ...b, ...(rule ? rule(c) : { earned: false, pending: true }) };
  });
}

export const DIFFICULTY_ORDER = ['Easy', 'Medium', 'Hard', 'Extreme', 'Impossible'];
