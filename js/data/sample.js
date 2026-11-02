// Sample data for the preview. Not real users; scores are illustrative.

export const SAMPLE_USER = {
  username: 'samrivera',
  displayName: 'Sam Rivera',
  joined: '2025-11-10',
  home: { city: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  favoriteTeams: ['mlb-chc', 'nfl-chi', 'cfb-nd'],
  icon: 'batter',
  photo: null,
  backPhoto: null,
  cardFont: 'classic',
  displayedBadges: [],
  usernameChangedAt: null,
  following: ['jordanp', 'mkim', 'tdavis', 'alexg', 'priya', 'chrisw', 'nate', 'lena', 'marco', 'deshawn', 'ella', 'bigtom'],
};

const r = (overall, food, seating, amenities, parking, transit) => ({ overall, food, seating, amenities, parking, transit });

export const SAMPLE_LOGS = [
  { id: 's1', league: 'MLB', date: '2014-08-16', time: '13:20', venue: 'wrigley', home: 'mlb-chc', away: 'mlb-mil', homeScore: 2, awayScore: 0, with: ['jordanp'], rating: r(5, 4, 4, 3, 2, 5), notes: 'First game with Dad in the bleachers.' },
  { id: 's2', league: 'MLB', date: '2023-07-15', time: '18:10', venue: 'comerica', home: 'mlb-det', away: 'mlb-chc', homeScore: 3, awayScore: 2, with: [], rating: r(4, 4, 4, 4, 3, 3), notes: '' },
  { id: 's3', league: 'NFL', date: '2023-11-23', time: '12:30', venue: 'ford-field', home: 'nfl-det', away: 'nfl-gb', homeScore: 22, awayScore: 29, with: ['mkim'], rating: r(5, 4, 5, 5, 3, 3), notes: 'Thanksgiving football indoors. Loud.' },
  { id: 's4', league: 'MLB', date: '2024-08-10', time: '13:10', venue: 'rate-field', home: 'mlb-cws', away: 'mlb-chc', homeScore: 3, awayScore: 6, with: ['jordanp', 'tdavis'], rating: r(3, 4, 3, 3, 5, 4), notes: 'Crosstown. Cubs fans everywhere.' },
  { id: 's5', league: 'CFB', date: '2024-09-28', time: '11:00', venue: 'notre-dame', home: 'cfb-nd', away: 'cfb-stan', homeScore: 31, awayScore: 24, with: ['alexg'], rating: r(5, 3, 4, 4, 2, 2), notes: 'Touchdown Jesus in person.' },
  { id: 's6', league: 'NFL', date: '2024-09-29', time: '12:00', venue: 'soldier-field', home: 'nfl-chi', away: 'nfl-lar', homeScore: 24, awayScore: 18, with: ['alexg'], rating: r(3, 3, 3, 2, 2, 4), notes: 'Back-to-back football weekend.' },
  { id: 's7', league: 'CFB', date: '2024-11-30', time: '14:30', venue: 'kyle-field', home: 'cfb-tamu', away: 'cfb-tex', homeScore: 17, awayScore: 24, with: ['priya'], rating: r(5, 4, 3, 4, 2, 2), notes: '100,000+ people. Basically a city.' },
  { id: 's8', league: 'MLB', date: '2025-04-12', time: '13:10', venue: 'fenway', home: 'mlb-bos', away: 'mlb-nyy', homeScore: 4, awayScore: 5, extra: true, with: ['chrisw'], rating: r(5, 4, 2, 3, 1, 5), notes: '10 innings, 41 degrees.' },
  { id: 's9', league: 'MLB', date: '2025-04-13', time: '13:35', venue: 'yankee-stadium', home: 'mlb-nyy', away: 'mlb-tor', homeScore: 6, awayScore: 2, with: ['chrisw'], rating: r(4, 3, 4, 4, 2, 5), notes: '' },
  { id: 's10', league: 'MLB', date: '2025-07-04', time: '18:05', venue: 'wrigley', home: 'mlb-chc', away: 'mlb-cws', homeScore: 7, awayScore: 4, with: ['jordanp'], rating: r(5, 4, 4, 3, 2, 5), notes: 'Fireworks after.' },
  { id: 's11', league: 'CFB', date: '2025-08-30', time: '11:00', venue: 'mercedes-benz', home: 'cfb-bama', away: 'cfb-fsu', homeScore: 27, awayScore: 20, neutral: true, with: [], rating: r(4, 4, 4, 5, 3, 4), notes: 'Neutral-site kickoff game.' },
  { id: 's12', league: 'CFB', date: '2025-10-18', time: '16:30', venue: 'rose-bowl', home: 'cfb-ucla', away: 'cfb-ore', homeScore: 20, awayScore: 34, with: ['lena'], rating: r(5, 3, 3, 3, 3, 2), notes: 'Sunset over the San Gabriels.' },
  { id: 's13', league: 'NFL', date: '2025-10-19', time: '17:20', venue: 'sofi', home: 'nfl-lar', away: 'nfl-chi', homeScore: 20, awayScore: 23, extra: true, with: ['lena'], rating: r(4, 4, 5, 5, 2, 2), notes: 'Overtime winner. Bears!' },
  { id: 's14', league: 'NFL', date: '2025-12-21', time: '12:00', venue: 'arrowhead', home: 'nfl-kc', away: 'nfl-den', homeScore: 27, awayScore: 0, with: ['bigtom'], rating: r(5, 5, 3, 3, 3, 1), notes: 'Coldest I have ever been.' },
  { id: 's15', league: 'MLB', date: '2026-04-03', time: '13:20', venue: 'wrigley', home: 'mlb-chc', away: 'mlb-pit', homeScore: 3, awayScore: 1, openingDay: true, with: ['jordanp', 'mkim'], rating: r(5, 4, 4, 3, 2, 5), notes: 'Opening Day!' },
  { id: 's16', league: 'MLB', date: '2026-05-27', time: '13:10', venue: 'wrigley', home: 'mlb-chc', away: 'mlb-stl', homeScore: 4, awayScore: 6, doubleheader: true, with: [], rating: r(4, 4, 4, 3, 2, 5), notes: 'Played hooky. Game 1.' },
  { id: 's17', league: 'MLB', date: '2026-05-27', time: '19:05', venue: 'wrigley', home: 'mlb-chc', away: 'mlb-stl', homeScore: 8, awayScore: 3, doubleheader: true, with: [], rating: r(5, 4, 4, 3, 2, 5), notes: 'Game 2. Worth it.' },
];

// People the sample user follows. Stats are summaries only (no logs) in the preview.
const F = (username, displayName, team, icon, cardFont, games, venues, teams, badges) =>
  ({ username, displayName, favoriteTeams: [team], icon, cardFont, stats: { games, venues, teams, badges } });

export const SAMPLE_FRIENDS = [
  F('jordanp', 'Jordan P.', 'mlb-chc', 'pitcher', 'slab', 64, 21, 38, 19),
  F('mkim', 'Michelle Kim', 'nfl-det', 'football', 'classic', 41, 17, 29, 14),
  F('tdavis', 'Tyler Davis', 'mlb-cws', 'batter', 'arcade', 23, 9, 18, 8),
  F('alexg', 'Alex G.', 'cfb-nd', 'helmet', 'marker', 77, 33, 51, 27),
  F('priya', 'Priya S.', 'cfb-tex', 'pennant', 'classic', 38, 19, 30, 13),
  F('chrisw', 'Chris W.', 'mlb-bos', 'baseball', 'slab', 112, 46, 60, 34),
  F('nate', 'Nate Olson', 'nfl-gb', 'foam', 'classic', 52, 12, 26, 11),
  F('lena', 'Lena Park', 'cfb-ucla', 'trophy', 'marker', 29, 15, 24, 10),
  F('marco', 'Marco R.', 'mlb-lad', 'batter', 'arcade', 88, 30, 47, 22),
  F('deshawn', 'DeShawn M.', 'nfl-kc', 'football', 'slab', 45, 22, 35, 16),
  F('ella', 'Ella J.', 'cfb-uga', 'pennant', 'classic', 33, 11, 22, 9),
  F('bigtom', 'Big Tom', 'nfl-kc', 'foam', 'arcade', 150, 58, 71, 41),
];

// Placeholder list; replace with a maintained blocklist before launch.
export const BLOCKED_USERNAME_WORDS = ['admin', 'administrator', 'moderator', 'fancrd', 'official', 'support', 'staff'];
