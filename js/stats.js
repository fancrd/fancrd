// Derived numbers for profiles and the passport.
import { VENUE_BY_ID } from './data/venues.js';

export function computeStats(logs) {
  const byYear = {}, venueCounts = {}, teams = new Set();
  logs.forEach(l => {
    const y = l.date.slice(0, 4);
    byYear[y] = (byYear[y] || 0) + 1;
    venueCounts[l.venue] = (venueCounts[l.venue] || 0) + 1;
    if (l.home) teams.add(l.home);
    if (l.away) teams.add(l.away);
  });
  const mostVisited = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    games: logs.length,
    venues: Object.keys(venueCounts).length,
    teams: teams.size,
    teamIds: [...teams],
    byYear,
    venueCounts,
    mostVisited: mostVisited ? { venue: VENUE_BY_ID[mostVisited[0]], count: mostVisited[1] } : null,
  };
}

// Favorite venues: highest average overall rating, ties broken by visit count
export function favoriteVenues(logs, n = 3) {
  const agg = {};
  logs.forEach(l => {
    const a = (agg[l.venue] ||= { sum: 0, rated: 0, visits: 0 });
    a.visits++;
    if (l.rating?.overall) { a.sum += l.rating.overall; a.rated++; }
  });
  return Object.entries(agg)
    .map(([id, a]) => ({ venue: VENUE_BY_ID[id], avg: a.rated ? a.sum / a.rated : 0, visits: a.visits }))
    .sort((x, y) => y.avg - x.avg || y.visits - x.visits)
    .slice(0, n);
}

// Deterministic sample "community" ratings until real reviews exist
export function communityRating(venueId) {
  let h = 0;
  for (const ch of venueId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = 3.2 + (h % 170) / 100; // 3.2 – 4.9
  return { avg: Math.round(base * 10) / 10, reviews: 40 + (h % 900) };
}
