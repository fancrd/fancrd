// The Fancrd: a flippable baseball-card style profile card.
import { TEAMS } from '../data/venues.js';
import { esc, iconSvg, teamChip } from './ui.js';

export const CARD_FONTS = {
  classic: { label: 'Classic', family: "'Oswald', sans-serif" },
  slab: { label: 'Slab', family: "'Alfa Slab One', serif" },
  marker: { label: 'Marker', family: "'Permanent Marker', cursive" },
  arcade: { label: 'Arcade', family: "'Bungee', sans-serif" },
};

// stats: { games, venues, teams, byYear?: {year: count} }
export function fancrdCard(user, stats, { size = '', flippable = true } = {}) {
  const fav = (user.favoriteTeams || []).map(id => TEAMS[id]).filter(Boolean);
  const [c1, c2] = fav[0]?.colors || ['#e30a0a', '#ffffff'];
  const font = (CARD_FONTS[user.cardFont] || CARD_FONTS.classic).family;
  const front = user.photo
    ? `<img class="fc__photo" src="${user.photo}" alt="">`
    : `<div class="fc__icon">${iconSvg(user.icon)}</div>`;
  const years = Object.entries(stats.byYear || {}).sort((a, b) => b[0] - a[0]).slice(0, 6);
  const back = `
    <div class="fc__back-head">
      <div class="fc__back-name" style="font-family:${font}">${esc(user.displayName)}</div>
      <div class="fc__handle">@${esc(user.username)}</div>
    </div>
    <div class="fc__back-body">
      ${user.backPhoto ? `<img class="fc__back-photo" src="${user.backPhoto}" alt="">` : ''}
      <div class="fc__back-teams">${fav.map(t => teamChip(t.id, { size: 'sm' })).join('') || '<span class="muted">No favorite teams yet</span>'}</div>
      <table class="fc__table">
        <thead><tr><th>Year</th><th>Events</th></tr></thead>
        <tbody>${years.length ? years.map(([y, n]) => `<tr><td>${y}</td><td>${n}</td></tr>`).join('') : '<tr><td colspan="2" class="muted">Season stats hidden</td></tr>'}</tbody>
      </table>
      <div class="fc__totals">
        <div><b>${stats.games}</b><span>Events</span></div>
        <div><b>${stats.venues}</b><span>Venues</span></div>
        <div><b>${stats.teams}</b><span>Teams</span></div>
      </div>
    </div>`;
  return `
  <div class="fc ${size}" style="--c1:${c1};--c2:${c2}" data-card>
    <div class="fc__inner">
      <div class="fc__face fc__front">
        <div class="fc__frame">
          ${front}
          <img class="fc__logo" src="../logo.png" alt="">
          <div class="fc__team">${fav[0] ? esc(fav[0].short) : 'FAN'}</div>
          <div class="fc__banner"><span style="font-family:${font}">${esc(user.displayName)}</span></div>
        </div>
      </div>
      <div class="fc__face fc__back">${back}</div>
    </div>
    ${flippable ? '<button class="fc__flip" type="button" aria-label="Flip card" title="Flip card">⟲</button>' : ''}
  </div>`;
}

export function bindCards(root) {
  root.querySelectorAll('[data-card]').forEach(card => {
    card.querySelector('.fc__flip')?.addEventListener('click', e => {
      e.stopPropagation();
      card.classList.toggle('flipped');
    });
  });
}
