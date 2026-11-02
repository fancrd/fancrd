// App shell: hash router, header state, global search.
import { onChange, isSignedIn, setSignedIn, getProfile, getFriends, resetPreview } from './store.js';
import { VENUES, TEAMS } from './data/venues.js';
import { esc, closeModal, toast } from './components/ui.js';
import { renderHome } from './views/home.js';
import { renderProfile, renderFriendProfile } from './views/profile.js';
import { renderPassport } from './views/passport.js';
import { renderVenues, renderVenue } from './views/venues.js';
import { renderRankings } from './views/rankings.js';
import { renderSignIn, renderJoin } from './views/auth.js';
import { renderLog } from './views/log.js';

const app = document.getElementById('app');

const ROUTES = [
  [/^\/?$/, renderHome, ''],
  [/^\/profile$/, renderProfile, 'profile'],
  [/^\/u\/([\w-]+)$/, renderFriendProfile, 'profile'],
  [/^\/passport$/, renderPassport, 'passport'],
  [/^\/venues$/, renderVenues, 'venues'],
  [/^\/venue\/([\w-]+)$/, renderVenue, 'venues'],
  [/^\/rankings$/, renderRankings, 'rankings'],
  [/^\/signin$/, renderSignIn, ''],
  [/^\/join$/, renderJoin, ''],
  [/^\/log$/, renderLog, ''],
];

let cleanup = null;
function route() {
  const path = location.hash.slice(1).split('?')[0] || '/';
  closeModal();
  cleanup?.();
  cleanup = null;
  for (const [re, view, nav] of ROUTES) {
    const m = path.match(re);
    if (m) {
      document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === nav));
      app.innerHTML = '';
      cleanup = view(app, ...m.slice(1)) || null;
      window.scrollTo(0, 0);
      return;
    }
  }
  app.innerHTML = '<section class="empty"><h1>Out of bounds</h1><p><a href="#/">Back to the home screen</a></p></section>';
}

function renderAuthNav() {
  const el = document.querySelector('.nav-auth');
  el.innerHTML = isSignedIn()
    ? `<button class="link" type="button" data-signout>Sign out @${esc(getProfile().username)}</button>`
    : '<a href="#/signin">Sign in</a><a href="#/join">Create account</a>';
  el.querySelector('[data-signout]')?.addEventListener('click', () => { setSignedIn(false); toast('Signed out'); });
}

// Global search across venues, teams and fans
const searchInput = document.querySelector('.search input');
const searchResults = document.querySelector('.search__results');
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 2) { searchResults.hidden = true; return; }
  const venues = VENUES.filter(v => `${v.name} ${v.city} ${v.state}`.toLowerCase().includes(q)).slice(0, 5)
    .map(v => `<a href="#/venue/${v.id}"><span class="tag">Venue</span>${esc(v.name)} <small>${esc(v.city)}, ${esc(v.state)}</small></a>`);
  const teams = Object.values(TEAMS).filter(t => t.name.toLowerCase().includes(q)).slice(0, 5)
    .map(t => {
      const v = VENUES.find(x => x.teams.includes(t.id));
      return `<a href="#/venue/${v.id}"><span class="tag">${t.league}</span>${esc(t.name)} <small>${esc(v.name)}</small></a>`;
    });
  const me = getProfile();
  const people = [me, ...getFriends()].filter(p => `${p.displayName} ${p.username}`.toLowerCase().includes(q)).slice(0, 5)
    .map(p => `<a href="${p.username === me.username ? '#/profile' : '#/u/' + p.username}"><span class="tag">Fan</span>${esc(p.displayName)} <small>@${esc(p.username)}</small></a>`);
  const rows = [...venues, ...teams, ...people];
  searchResults.innerHTML = rows.length ? rows.join('') : '<div class="muted pad">No matches</div>';
  searchResults.hidden = false;
});
searchResults.addEventListener('click', () => { searchResults.hidden = true; searchInput.value = ''; });
document.addEventListener('click', e => { if (!e.target.closest('.search')) searchResults.hidden = true; });

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
toggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  toggle.setAttribute('aria-expanded', open);
});
window.addEventListener('hashchange', () => document.body.classList.remove('nav-open'));

document.getElementById('reset-preview').addEventListener('click', () => {
  if (confirm('Reset all preview data in this browser?')) { resetPreview(); toast('Preview reset'); }
});

onChange(() => { renderAuthNav(); route(); });
window.addEventListener('hashchange', route);
renderAuthNav();
route();
