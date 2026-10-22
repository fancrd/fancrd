import { getLogs, getProfile, addLog, getFriends } from '../store.js';
import { VENUES, VENUE_BY_ID, TEAMS, LEAGUES, venueLeagues } from '../data/venues.js';
import { evaluateBadges } from '../badges-engine.js';
import { esc, stars, bindStars, toast } from '../components/ui.js';
import { RATING_FIELDS } from '../components/stub.js';

export function renderLog(root) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const preVenue = VENUE_BY_ID[params.get('venue')];
  const me = getProfile();
  const rating = {};
  const today = new Date().toISOString().slice(0, 10);

  root.innerHTML = `
  <section class="page-head"><h1>Log an event</h1><p class="muted">Add a game you went to. It lands on your profile as a ticket stub.</p></section>
  <form class="form card-form" id="log-form" novalidate>
    <div class="seg seg--wide" role="tablist">
      <button type="button" data-kind="game" class="on">A game</button>
      <button type="button" data-kind="visit">Just the stadium</button>
    </div>
    <p class="muted small" data-visit-note hidden>Don't remember the game? Log the venue now and add details later.</p>

    <div class="form-grid">
      <label class="field"><span>League</span><select name="league">${LEAGUES.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</select></label>
      <label class="field"><span>Venue</span><select name="venue" required></select></label>
      <label class="field"><span>Date</span><input type="date" name="date" max="${today}" required></label>
      <label class="field" data-game><span>Start time (local)</span><input type="time" name="time"></label>
    </div>

    <div data-game>
      <div class="form-grid form-grid--match">
        <label class="field"><span>Away team</span><select name="away"></select></label>
        <label class="field field--score"><span>Score</span><input type="number" name="awayScore" min="0" max="200" inputmode="numeric"></label>
        <label class="field"><span>Home team</span><select name="home"></select></label>
        <label class="field field--score"><span>Score</span><input type="number" name="homeScore" min="0" max="200" inputmode="numeric"></label>
      </div>
      <div class="chips">
        <label class="chip"><input type="checkbox" name="neutral"><span>Neutral site</span></label>
        <label class="chip"><input type="checkbox" name="extra"><span data-extra-label>Overtime</span></label>
        <label class="chip" data-mlb><input type="checkbox" name="doubleheader"><span>Doubleheader</span></label>
        <label class="chip" data-mlb><input type="checkbox" name="openingDay"><span>Opening Day</span></label>
      </div>
    </div>

    <fieldset class="field"><legend>Went with</legend>
      <div class="chips">${getFriends().filter(f => (me.following || []).includes(f.username))
        .map(f => `<label class="chip"><input type="checkbox" name="with" value="${f.username}"><span>@${esc(f.username)}</span></label>`).join('')}</div>
    </fieldset>

    <fieldset class="field"><legend>Rate it</legend>
      <div class="ratings ratings--inline">
        <div class="rating-row rating-row--main"><span>Overall</span>${stars(0, { name: 'overall', editable: true })}</div>
        ${RATING_FIELDS.map(([k, label]) => `<div class="rating-row"><span>${label}</span>${stars(0, { name: k, editable: true })}</div>`).join('')}
      </div>
    </fieldset>

    <label class="field"><span>Notes</span><textarea name="notes" rows="3" placeholder="Best moment, where you sat, what you ate…"></textarea></label>
    <p class="err" data-form-err></p>
    <div class="actions"><a class="btn btn--ghost" href="#/profile">Cancel</a><button class="btn btn--primary" type="submit">Fancrd it</button></div>
  </form>`;

  const form = root.querySelector('#log-form');
  const $ = n => form.elements[n];
  let kind = params.get('visit') ? 'visit' : 'game';

  const fillVenues = () => {
    const league = $('league').value;
    const list = VENUES.filter(v => venueLeagues(v).includes(league)).sort((a, b) => a.name.localeCompare(b.name));
    $('venue').innerHTML = list.map(v => `<option value="${v.id}">${esc(v.name)} — ${esc(v.city)}, ${esc(v.state)}</option>`).join('');
  };
  const fillTeams = () => {
    const league = $('league').value;
    const opts = Object.values(TEAMS).filter(t => t.league === league).sort((a, b) => a.name.localeCompare(b.name))
      .map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
    $('home').innerHTML = opts;
    $('away').innerHTML = '<option value="">Choose…</option>' + opts;
    syncHome();
  };
  // Home team defaults to the venue's tenant unless it's a neutral-site game
  const syncHome = () => {
    const v = VENUE_BY_ID[$('venue').value];
    const tenant = v?.teams.find(t => TEAMS[t].league === $('league').value);
    if (tenant && !$('neutral').checked) $('home').value = tenant;
  };
  const syncKind = () => {
    form.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('on', b.dataset.kind === kind));
    form.querySelectorAll('[data-game]').forEach(el => { el.hidden = kind === 'visit'; });
    form.querySelector('[data-visit-note]').hidden = kind !== 'visit';
  };
  const syncLeague = () => {
    const mlb = $('league').value === 'MLB';
    form.querySelectorAll('[data-mlb]').forEach(el => { el.hidden = !mlb; });
    form.querySelector('[data-extra-label]').textContent = mlb ? 'Extra innings' : 'Overtime';
  };

  if (preVenue) $('league').value = venueLeagues(preVenue)[0];
  fillVenues();
  if (preVenue) $('venue').value = preVenue.id;
  fillTeams();
  syncKind();
  syncLeague();

  $('league').addEventListener('change', () => { fillVenues(); fillTeams(); syncLeague(); });
  $('venue').addEventListener('change', syncHome);
  $('neutral').addEventListener('change', syncHome);
  form.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => { kind = b.dataset.kind; syncKind(); }));
  bindStars(form, (k, n) => { rating[k] = n; });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const err = form.querySelector('[data-form-err]');
    const date = $('date').value;
    if (!date) { err.textContent = 'Add the date you went.'; return; }
    if (date > today) { err.textContent = 'That date is in the future. Log it after the game!'; return; }
    const log = { league: $('league').value, venue: $('venue').value, date, with: [...form.querySelectorAll('[name=with]:checked')].map(c => c.value), rating, notes: $('notes').value.trim() };
    if (kind === 'game') {
      if (!$('away').value) { err.textContent = 'Pick the away team.'; return; }
      if ($('away').value === $('home').value) { err.textContent = 'A team can’t play itself.'; return; }
      const hs = $('homeScore').value, as = $('awayScore').value;
      Object.assign(log, {
        time: $('time').value || '', home: $('home').value, away: $('away').value,
        homeScore: hs === '' ? null : +hs, awayScore: as === '' ? null : +as,
        neutral: $('neutral').checked, extra: $('extra').checked,
        doubleheader: $('doubleheader').checked, openingDay: $('openingDay').checked,
      });
    }
    const before = new Set(evaluateBadges(getLogs(), me).filter(b => b.earned).map(b => b.id));
    addLog(log);
    const unlocked = evaluateBadges(getLogs(), getProfile()).filter(b => b.earned && !before.has(b.id));
    location.hash = '#/profile';
    toast(unlocked.length
      ? `<b>Badge${unlocked.length > 1 ? 's' : ''} unlocked!</b> ${unlocked.map(b => esc(b.name)).join(', ')}`
      : 'Logged! Your ticket stub is on your profile.');
  });
}
