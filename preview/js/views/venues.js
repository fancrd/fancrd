import { getLogs } from '../store.js';
import { VENUES, VENUE_BY_ID, TEAMS, LEAGUES, venueLeagues } from '../data/venues.js';
import { communityRating } from '../stats.js';
import { esc, stars, teamChip } from '../components/ui.js';
import { ticketStub, bindStubs, RATING_FIELDS } from '../components/stub.js';

export function renderVenues(root) {
  const visited = new Set(getLogs().map(l => l.venue));
  const state = { league: 'all', q: '', sort: 'rating', show: 'all' };

  root.innerHTML = `
  <section class="page-head">
    <h1>Venues</h1>
    <p class="muted">${VENUES.length} Stage 1 venues across the NFL, college football and MLB.</p>
  </section>
  <div class="filters">
    <input type="search" placeholder="Filter by name or city" data-k="q" aria-label="Filter venues">
    <select data-k="league" aria-label="League"><option value="all">All leagues</option>${LEAGUES.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</select>
    <select data-k="show" aria-label="Visited"><option value="all">Visited + not</option><option value="visited">Visited</option><option value="unvisited">Not visited</option></select>
    <select data-k="sort" aria-label="Sort"><option value="rating">Top rated</option><option value="capacity">Biggest</option><option value="name">A–Z</option></select>
  </div>
  <div class="venue-grid" id="venue-grid"></div>`;

  const grid = root.querySelector('#venue-grid');
  const draw = () => {
    const q = state.q.toLowerCase();
    const list = VENUES
      .filter(v => state.league === 'all' || venueLeagues(v).includes(state.league))
      .filter(v => state.show === 'all' || (state.show === 'visited') === visited.has(v.id))
      .filter(v => !q || `${v.name} ${v.city} ${v.state}`.toLowerCase().includes(q))
      .sort((a, b) => state.sort === 'name' ? a.name.localeCompare(b.name)
        : state.sort === 'capacity' ? b.capacity - a.capacity
        : communityRating(b.id).avg - communityRating(a.id).avg);
    grid.innerHTML = list.map(v => {
      const r = communityRating(v.id);
      return `<a class="venue-card ${visited.has(v.id) ? 'venue-card--visited' : ''}" href="#/venue/${v.id}">
        <div class="venue-card__teams">${v.teams.map(t => teamChip(t)).join('')}${visited.has(v.id) ? '<span class="visited-tag">Visited</span>' : ''}</div>
        <h3>${esc(v.name)}</h3>
        <div class="muted">${esc(v.city)}, ${esc(v.state)} · ${v.capacity.toLocaleString()}</div>
        <div class="venue-card__rating">${stars(r.avg)} <span>${r.avg.toFixed(1)}</span> <small class="muted">(${r.reviews})</small></div>
      </a>`;
    }).join('') || '<p class="muted">No venues match.</p>';
  };
  root.querySelectorAll('[data-k]').forEach(el => el.addEventListener('input', () => { state[el.dataset.k] = el.value; draw(); }));
  draw();
}

export function renderVenue(root, id) {
  const v = VENUE_BY_ID[id];
  if (!v) { root.innerHTML = '<section class="empty"><h1>Venue not found</h1><p><a href="#/venues">All venues</a></p></section>'; return; }
  const mine = getLogs().filter(l => l.venue === id);
  const r = communityRating(id);
  // Sample category split around the community average
  const cat = (k, i) => Math.max(1, Math.min(5, r.avg + ((k.length + i) % 3 - 1) * 0.4));

  root.innerHTML = `
  <section class="venue-hero">
    <div>
      <div class="eyebrow">${venueLeagues(v).join(' · ')}</div>
      <h1>${esc(v.name)}</h1>
      <p class="muted">${esc(v.city)}, ${esc(v.state)} · Capacity ${v.capacity.toLocaleString()} · ${v.surface === 'turf' ? 'Artificial turf' : 'Natural grass'}</p>
      <div class="fav-teams">${v.teams.map(t => `${teamChip(t)} <span class="team-name">${esc(TEAMS[t].name)}</span>`).join('')}</div>
      <div class="hero__cta">
        <a class="btn btn--primary" href="#/log?venue=${v.id}">Log a game here</a>
        <a class="btn btn--ghost" href="#/log?venue=${v.id}&visit=1">Just log the visit</a>
      </div>
    </div>
    <div class="score-box">
      <div class="score-box__big">${r.avg.toFixed(1)}</div>${stars(r.avg)}
      <div class="muted small">${r.reviews} fan ratings (sample)</div>
      <div class="ratings">${RATING_FIELDS.map(([k, label], i) => `<div class="rating-row"><span>${label}</span>${stars(cat(k, i))}</div>`).join('')}</div>
    </div>
  </section>
  <section class="section">
    <div class="section__head"><h2>Your visits</h2><span class="muted">${mine.length}</span></div>
    <div class="stub-list">${mine.map(ticketStub).join('') || '<p class="muted">You haven’t logged this venue yet.</p>'}</div>
  </section>`;
  bindStubs(root, lid => getLogs().find(l => l.id === lid));
}
