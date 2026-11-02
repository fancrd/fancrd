import { getLogs, getProfile } from '../store.js';
import { TEAMS, VENUES, LEAGUES, venueLeagues, milesBetween } from '../data/venues.js';
import { computeStats } from '../stats.js';
import { evaluateBadges, DIFFICULTY_ORDER } from '../badges-engine.js';
import { esc, teamChip } from '../components/ui.js';
import { badgeTile } from './profile.js';

export function renderPassport(root) {
  const me = getProfile();
  const logs = getLogs();
  const stats = computeStats(logs);
  const badges = evaluateBadges(logs, me);
  const earnedCount = badges.filter(b => b.earned).length;
  const filters = { status: 'all', league: 'all', difficulty: 'all' };

  const unvisited = VENUES.filter(v => !stats.venueCounts[v.id]);
  const nextUp = me.home && unvisited.length
    ? unvisited.reduce((a, b) => (milesBetween(me.home, a) <= milesBetween(me.home, b) ? a : b)) : null;

  root.innerHTML = `
  <section class="passport-head">
    <div>
      <div class="eyebrow">Passport · @${esc(me.username)}</div>
      <h1>${esc(me.displayName)}'s passport</h1>
    </div>
    <div class="statline">
      <div><b>${earnedCount}<small>/${badges.length}</small></b><span>Badges</span></div>
      <div><b>${stats.venues}<small>/${VENUES.length}</small></b><span>Venues</span></div>
      <div><b>${stats.teams}<small>/${Object.keys(TEAMS).length}</small></b><span>Teams</span></div>
    </div>
  </section>
  ${nextUp ? `<a class="next-up" href="#/venue/${nextUp.id}"><span class="eyebrow">Closest venue you haven't visited</span>
    <b>${esc(nextUp.name)}</b> · ${esc(nextUp.city)}, ${esc(nextUp.state)} · ${Math.round(milesBetween(me.home, nextUp))} mi away</a>` : ''}

  <div class="tabs" role="tablist">
    <button class="on" data-tab="badges" type="button">Badges</button>
    <button data-tab="teams" type="button">Teams seen</button>
    <button data-tab="venues" type="button">Venues</button>
  </div>

  <section data-panel="badges">
    <div class="filters">
      <select data-f="status" aria-label="Status"><option value="all">All badges</option><option value="earned">Earned</option><option value="locked">Not yet</option></select>
      <select data-f="league" aria-label="League"><option value="all">Any league</option>${[...new Set(badges.map(b => b.league))].map(l => `<option>${esc(l)}</option>`).join('')}</select>
      <select data-f="difficulty" aria-label="Difficulty"><option value="all">Any difficulty</option>${DIFFICULTY_ORDER.map(d => `<option>${d}</option>`).join('')}</select>
    </div>
    <div class="badge-grid" id="badge-grid"></div>
  </section>

  <section data-panel="teams" hidden>
    ${LEAGUES.map(l => {
      const all = Object.values(TEAMS).filter(t => t.league === l.id);
      const seen = all.filter(t => stats.teamIds.includes(t.id));
      return `<div class="section"><div class="section__head"><h2>${l.name}</h2><span class="muted">${seen.length}/${all.length}</span></div>
        <div class="team-wall">${all.map(t => `<div class="team-wall__item ${seen.includes(t) ? 'seen' : ''}">${teamChip(t.id, { size: 'lg' })}<small>${esc(t.name)}</small></div>`).join('')}</div></div>`;
    }).join('')}
  </section>

  <section data-panel="venues" hidden>
    ${LEAGUES.map(l => {
      const all = VENUES.filter(v => venueLeagues(v).includes(l.id));
      const seen = all.filter(v => stats.venueCounts[v.id]);
      return `<div class="section"><div class="section__head"><h2>${l.name}</h2><span class="muted">${seen.length}/${all.length}</span></div>
        <div class="venue-checklist">${all.map(v => `<a href="#/venue/${v.id}" class="${stats.venueCounts[v.id] ? 'seen' : ''}">
          <span class="check">${stats.venueCounts[v.id] ? '✓' : ''}</span>${esc(v.name)} <small class="muted">${esc(v.city)}, ${esc(v.state)}</small></a>`).join('')}</div></div>`;
    }).join('')}
  </section>`;

  const grid = root.querySelector('#badge-grid');
  const drawBadges = () => {
    const list = badges
      .filter(b => filters.status === 'all' || (filters.status === 'earned') === !!b.earned)
      .filter(b => filters.league === 'all' || b.league === filters.league)
      .filter(b => filters.difficulty === 'all' || b.difficulty === filters.difficulty)
      .sort((a, b) => (b.earned - a.earned) || DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty));
    grid.innerHTML = list.map(b => `<div class="badge-card">${badgeTile(b)}<p>${esc(b.description)}</p>
      ${b.region && b.region !== 'All' ? `<small class="muted">📍 ${esc(b.region)}</small>` : ''}
      ${b.pending ? '<small class="muted">Tracking soon</small>' : ''}</div>`).join('') || '<p class="muted">No badges match.</p>';
  };
  root.querySelectorAll('[data-f]').forEach(s => s.addEventListener('change', () => { filters[s.dataset.f] = s.value; drawBadges(); }));
  drawBadges();

  root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
    root.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  }));
}
