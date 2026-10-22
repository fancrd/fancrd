import { getLogs, getProfile, saveProfile, getFriends, getFriend } from '../store.js';
import { TEAMS } from '../data/venues.js';
import { BLOCKED_USERNAME_WORDS } from '../data/sample.js';
import { computeStats, favoriteVenues } from '../stats.js';
import { evaluateBadges } from '../badges-engine.js';
import { esc, stars, iconSvg, ICON_IDS, teamChip, openModal, closeModal, readFileAsDataUrl, toast } from '../components/ui.js';
import { fancrdCard, bindCards, CARD_FONTS } from '../components/card.js';
import { ticketStub, bindStubs } from '../components/stub.js';
import { mountVisitMap } from '../components/map.js';

const USERNAME_COOLDOWN_DAYS = 30;

export function badgeTile(b) {
  const prog = b.progress && !b.earned ? `<div class="badge__prog"><i style="width:${(b.progress[0] / b.progress[1]) * 100}%"></i></div><small>${b.progress[0]}/${b.progress[1]}</small>` : '';
  return `<div class="badge ${b.earned ? 'badge--earned' : 'badge--locked'} badge--${b.difficulty.toLowerCase()}" title="${esc(b.description)}">
    <div class="badge__medal">${b.earned ? '★' : b.pending ? '…' : '🔒'}</div>
    <div class="badge__name">${esc(b.name)}</div>
    <div class="badge__meta">${esc(b.league)} · ${esc(b.difficulty)}</div>
    ${prog}
  </div>`;
}

export function renderProfile(root) {
  const me = getProfile();
  const logs = getLogs();
  const stats = computeStats(logs);
  const badges = evaluateBadges(logs, me);
  const earned = badges.filter(b => b.earned);
  const shown = (me.displayedBadges?.length ? me.displayedBadges.map(id => earned.find(b => b.id === id)).filter(Boolean) : earned).slice(0, 10);
  const favs = favoriteVenues(logs);
  const following = getFriends().filter(f => (me.following || []).includes(f.username));

  root.innerHTML = `
  <section class="profile-top">
    <div class="profile-card">${fancrdCard(me, stats, { size: 'fc--lg' })}
      <button class="btn btn--ghost btn--sm" data-edit type="button">Customize my Fancrd</button>
    </div>
    <div class="profile-summary">
      <div class="eyebrow">@${esc(me.username)} · ${esc(me.home?.city || 'Location off')}</div>
      <h1>${esc(me.displayName)}</h1>
      <div class="fav-teams">${(me.favoriteTeams || []).map(id => teamChip(id)).join('')}</div>
      <div class="statline">
        <div><b>${stats.games}</b><span>Events</span></div>
        <div><b>${stats.venues}</b><span>Venues</span></div>
        <div><b>${stats.teams}</b><span>Teams seen</span></div>
        <div><b>${earned.length}</b><span>Badges</span></div>
        <div><b>${following.length}</b><span>Following</span></div>
      </div>
      ${stats.mostVisited ? `<div class="most-visited"><span class="eyebrow">Most visited</span>
        <a href="#/venue/${stats.mostVisited.venue.id}">${esc(stats.mostVisited.venue.name)}</a> · ${stats.mostVisited.count} visits</div>` : ''}
      <a class="btn btn--primary" href="#/passport">Open passport →</a>
    </div>
  </section>

  <section class="section">
    <div class="section__head"><h2>Badge showcase</h2><a href="#/passport">All ${badges.length} badges →</a></div>
    <div class="badge-row">${shown.map(badgeTile).join('') || '<p class="muted">Log a game to start earning badges.</p>'}</div>
  </section>

  <div class="two-col">
    <section class="section">
      <div class="section__head"><h2>Latest events</h2><a href="#/log">+ Log</a></div>
      <div class="stub-list">${logs.slice(0, 5).map(ticketStub).join('') || '<p class="muted">No events yet.</p>'}</div>
    </section>
    <section class="section">
      <div class="section__head"><h2>Top 3 venues</h2></div>
      <ol class="fav-venues">${favs.map(f => `<li><a href="#/venue/${f.venue.id}">${esc(f.venue.name)}</a>
        <span>${stars(f.avg)} <small class="muted">${f.visits} visit${f.visits > 1 ? 's' : ''}</small></span></li>`).join('')}</ol>
    </section>
  </div>

  <section class="section">
    <div class="section__head"><h2>Where I've been</h2>
      <div class="seg" role="tablist"><button class="on" data-mode="pins" type="button">Pins</button><button data-mode="heat" type="button">Heat map</button></div>
    </div>
    <div class="map" id="visit-map"></div>
  </section>

  <section class="section">
    <div class="section__head"><h2>Following</h2>
      <div class="seg"><button class="on" data-view="binder" type="button">Binder</button><button data-view="list" type="button">List</button></div>
    </div>
    <div id="following"></div>
  </section>`;

  bindCards(root);
  bindStubs(root, id => getLogs().find(l => l.id === id));
  root.querySelector('[data-edit]').addEventListener('click', () => openEditProfile(me, earned));

  const mapCtl = mountVisitMap(root.querySelector('#visit-map'), logs);
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
    mapCtl?.setMode(b.dataset.mode);
  }));

  renderFollowing(root.querySelector('#following'), following, 'binder');
  root.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('on', x === b));
    renderFollowing(root.querySelector('#following'), following, b.dataset.view);
  }));

  return () => mapCtl?.map.remove();
}

// Followers as a card binder: sleeves of 9 per page, or a plain list
function renderFollowing(el, people, view, page = 0) {
  if (!people.length) { el.innerHTML = '<p class="muted">Not following anyone yet.</p>'; return; }
  if (view === 'list') {
    el.innerHTML = `<ul class="people-list">${people.map(p => `<li>
      <a class="avatar" href="#/u/${p.username}" style="--c1:${TEAMS[p.favoriteTeams[0]].colors[0]}">${iconSvg(p.icon)}</a>
      <a href="#/u/${p.username}"><b>${esc(p.displayName)}</b> <span class="muted">@${esc(p.username)}</span></a>
      <span class="muted small">${p.stats.venues} venues</span></li>`).join('')}</ul>`;
    return;
  }
  const pages = Math.ceil(people.length / 9);
  const slice = people.slice(page * 9, page * 9 + 9);
  el.innerHTML = `<div class="binder">
    <div class="binder__page">${slice.map(p => `<a class="sleeve" href="#/u/${p.username}">${fancrdCard(p, p.stats, { size: 'fc--sm', flippable: false })}</a>`).join('')}
      ${Array.from({ length: 9 - slice.length }, () => '<div class="sleeve sleeve--empty"></div>').join('')}</div>
    <div class="binder__nav">
      <button class="btn btn--ghost btn--sm" data-pg="-1" ${page === 0 ? 'disabled' : ''} type="button">← Prev</button>
      <span>Page ${page + 1} of ${pages}</span>
      <button class="btn btn--ghost btn--sm" data-pg="1" ${page >= pages - 1 ? 'disabled' : ''} type="button">Next →</button>
    </div></div>`;
  el.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => renderFollowing(el, people, 'binder', page + +b.dataset.pg)));
}

export function validateUsername(name, current, lastChanged) {
  if (!/^[a-z0-9_]{3,20}$/.test(name)) return '3–20 characters: lowercase letters, numbers and underscores.';
  if (BLOCKED_USERNAME_WORDS.some(w => name.includes(w))) return 'That username isn’t allowed.';
  if (name !== current && getFriends().some(f => f.username === name)) return 'That username is taken.';
  if (name !== current && lastChanged) {
    const days = (Date.now() - new Date(lastChanged).getTime()) / 86400000;
    if (days < USERNAME_COOLDOWN_DAYS) return `You can change your username again in ${Math.ceil(USERNAME_COOLDOWN_DAYS - days)} days.`;
  }
  return '';
}

function openEditProfile(me, earned) {
  let photo = me.photo, backPhoto = me.backPhoto, icon = me.icon;
  const shown = new Set(me.displayedBadges?.length ? me.displayedBadges : earned.slice(0, 10).map(b => b.id));
  const teamOpts = sel => ['', ...Object.keys(TEAMS)].map(id =>
    `<option value="${id}" ${id === sel ? 'selected' : ''}>${id ? `${TEAMS[id].league} · ${esc(TEAMS[id].name)}` : '—'}</option>`).join('');
  openModal(`
    <h2>Customize your Fancrd</h2>
    <form class="form" id="edit-form">
      <div class="form-grid">
        <label class="field"><span>Display name</span><input name="displayName" maxlength="30" value="${esc(me.displayName)}" required></label>
        <label class="field"><span>Username <small class="muted">(changeable once every ${USERNAME_COOLDOWN_DAYS} days)</small></span>
          <input name="username" value="${esc(me.username)}" autocomplete="off"><small class="err" data-err="username"></small></label>
      </div>
      <fieldset class="field"><legend>Card name style</legend><div class="chips">
        ${Object.entries(CARD_FONTS).map(([k, f]) => `<label class="chip"><input type="radio" name="cardFont" value="${k}" ${k === (me.cardFont || 'classic') ? 'checked' : ''}><span style="font-family:${f.family}">${f.label}</span></label>`).join('')}
      </div></fieldset>
      <fieldset class="field"><legend>Front of card</legend>
        <div class="icon-pick">${ICON_IDS.map(id => `<button type="button" class="icon-opt ${!photo && id === icon ? 'on' : ''}" data-icon="${id}" aria-label="${id}">${iconSvg(id)}</button>`).join('')}</div>
        <label class="upload">Or upload a photo <input type="file" accept="image/*" data-photo="front"></label>
        <small class="muted">Uploaded photos are reviewed by our team before they appear publicly.</small>
      </fieldset>
      <label class="upload">Back of card photo (optional) <input type="file" accept="image/*" data-photo="back"></label>
      <fieldset class="field"><legend>Favorite teams (up to 3)</legend>
        <div class="form-grid form-grid--3">${[0, 1, 2].map(i => `<select name="fav${i}">${teamOpts(me.favoriteTeams?.[i] || '')}</select>`).join('')}</div>
      </fieldset>
      <fieldset class="field"><legend>Showcase badges (up to 10)</legend>
        <div class="chips">${earned.map(b => `<label class="chip"><input type="checkbox" name="badge" value="${b.id}" ${shown.has(b.id) ? 'checked' : ''}><span>${esc(b.name)}</span></label>`).join('') || '<span class="muted">Earn badges to show them here.</span>'}</div>
      </fieldset>
      <div class="actions"><button class="btn btn--primary" type="submit">Save card</button></div>
    </form>`, {
    wide: true,
    onMount: m => {
      m.querySelectorAll('[data-icon]').forEach(b => b.addEventListener('click', () => {
        icon = b.dataset.icon; photo = null;
        m.querySelectorAll('[data-icon]').forEach(x => x.classList.toggle('on', x === b));
      }));
      m.querySelectorAll('[data-photo]').forEach(inp => inp.addEventListener('change', async () => {
        const f = inp.files[0];
        if (!f) return;
        const url = await readFileAsDataUrl(f);
        if (inp.dataset.photo === 'front') { photo = url; m.querySelectorAll('[data-icon]').forEach(x => x.classList.remove('on')); }
        else backPhoto = url;
      }));
      m.querySelectorAll('input[name=badge]').forEach(cb => cb.addEventListener('change', () => {
        if (m.querySelectorAll('input[name=badge]:checked').length > 10) { cb.checked = false; toast('Showcase holds up to 10 badges'); }
      }));
      m.querySelector('#edit-form').addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const username = fd.get('username').trim().toLowerCase();
        const err = validateUsername(username, me.username, me.usernameChangedAt);
        m.querySelector('[data-err=username]').textContent = err;
        if (err) return;
        const favoriteTeams = [...new Set([0, 1, 2].map(i => fd.get('fav' + i)).filter(Boolean))];
        saveProfile({
          displayName: fd.get('displayName').trim() || me.displayName,
          username,
          usernameChangedAt: username !== me.username ? new Date().toISOString() : me.usernameChangedAt,
          cardFont: fd.get('cardFont'),
          icon, photo, backPhoto, favoriteTeams,
          displayedBadges: fd.getAll('badge'),
        });
        closeModal();
        toast('Your Fancrd is updated');
      });
    },
  });
}

export function renderFriendProfile(root, username) {
  const f = getFriend(username);
  const me = getProfile();
  if (!f) { root.innerHTML = '<section class="empty"><h1>Fan not found</h1><p><a href="#/">Home</a></p></section>'; return; }
  const following = (me.following || []).includes(username);
  root.innerHTML = `
  <section class="profile-top">
    <div class="profile-card">${fancrdCard(f, f.stats, { size: 'fc--lg' })}</div>
    <div class="profile-summary">
      <div class="eyebrow">@${esc(f.username)}</div>
      <h1>${esc(f.displayName)}</h1>
      <div class="fav-teams">${f.favoriteTeams.map(id => teamChip(id)).join('')}</div>
      <div class="statline">
        <div><b>${f.stats.games}</b><span>Events</span></div>
        <div><b>${f.stats.venues}</b><span>Venues</span></div>
        <div><b>${f.stats.teams}</b><span>Teams seen</span></div>
        <div><b>${f.stats.badges}</b><span>Badges</span></div>
      </div>
      <button class="btn ${following ? 'btn--ghost' : 'btn--primary'}" data-follow type="button">${following ? 'Following ✓' : 'Follow'}</button>
      <p class="muted small">Sample fan. Full logs and passport show here once accounts are live.</p>
    </div>
  </section>`;
  bindCards(root);
  root.querySelector('[data-follow]').addEventListener('click', () => {
    const list = new Set(me.following || []);
    following ? list.delete(username) : list.add(username);
    saveProfile({ following: [...list] });
  });
}
