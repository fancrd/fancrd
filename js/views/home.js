import { getLogs, getProfile, getFriends, isSignedIn } from '../store.js';
import { VENUES, TEAMS } from '../data/venues.js';
import { communityRating } from '../stats.js';
import { esc, stars, iconSvg, teamChip } from '../components/ui.js';
import { ticketStub, bindStubs } from '../components/stub.js';
import { waitlistForm, bindWaitlist } from '../components/waitlist.js';

// Sample friend activity for the feed
const ACTIVITY = [
  ['chrisw', 'logged', 'fenway', 'Red Sox walk-off in the 9th.'],
  ['alexg', 'earned', null, 'Luck of the Irish'],
  ['priya', 'rated', 'dkr', 'Food 5★ — brisket tacos at the north end.'],
  ['bigtom', 'logged', 'arrowhead', 'Stadium #58. Still the loudest.'],
  ['lena', 'rated', 'rose-bowl', 'Parking 2★ — get there early.'],
];

export function renderHome(root) {
  const me = getProfile();
  const logs = getLogs().slice(0, 3);
  const popular = [...VENUES].sort((a, b) => communityRating(b.id).avg - communityRating(a.id).avg).slice(0, 6);
  const friends = Object.fromEntries(getFriends().map(f => [f.username, f]));
  const venueName = id => VENUES.find(v => v.id === id)?.name;

  root.innerHTML = `
  <section class="hero">
    <div class="hero__copy">
      <h1>Visit. Watch it. <span class="red">Fancrd it.</span></h1>
      <p class="lead">Your seat. Your card. Log every game you've been to, rate every stadium, and collect badges from Lambeau to the Rose Bowl.</p>
      ${isSignedIn() ? '' : waitlistForm()}
      <div class="hero__cta">
        ${isSignedIn()
          ? '<a class="btn btn--primary" href="#/log">Log a game</a><a class="btn btn--ghost" href="#/profile">View my Fancrd</a>'
          : '<a class="btn btn--ghost" href="#/profile">See a sample profile</a>'}
      </div>
      <p class="muted small">Launching with NFL · College Football · MLB</p>
    </div>
    <div class="hero__art" aria-hidden="true">
      <div class="hero__field"></div>
      <img src="logo.png" alt="">
    </div>
  </section>

  <section class="features">
    <a class="feature" href="#/log">${iconSvg('baseball')}<h3>Log every game</h3><p>Date, teams, score, who you went with. Your ticket-stub collection builds itself.</p></a>
    <a class="feature" href="#/venues">${iconSvg('pennant')}<h3>Rate the venue</h3><p>Food, seats, parking, transit. Know before you go.</p></a>
    <a class="feature" href="#/passport">${iconSvg('trophy')}<h3>Fill your passport</h3><p>Badges for rivalries, road trips, doubleheaders and holiday games.</p></a>
  </section>

  <section class="section">
    <div class="section__head"><h2>Popular venues</h2><a href="#/venues">All venues →</a></div>
    <div class="venue-grid">
      ${popular.map(v => {
        const r = communityRating(v.id);
        return `<a class="venue-card" href="#/venue/${v.id}">
          <div class="venue-card__teams">${v.teams.map(t => teamChip(t)).join('')}</div>
          <h3>${esc(v.name)}</h3>
          <div class="muted">${esc(v.city)}, ${esc(v.state)}</div>
          <div class="venue-card__rating">${stars(r.avg)} <span>${r.avg.toFixed(1)}</span></div>
        </a>`;
      }).join('')}
    </div>
  </section>

  <div class="two-col">
    <section class="section">
      <div class="section__head"><h2>Friends' activity</h2></div>
      <ul class="feed">
        ${ACTIVITY.map(([u, verb, venue, text]) => {
          const f = friends[u];
          const team = TEAMS[f.favoriteTeams[0]];
          return `<li>
            <a class="avatar" href="#/u/${u}" style="--c1:${team.colors[0]}">${iconSvg(f.icon)}</a>
            <div><a href="#/u/${u}"><b>${esc(f.displayName)}</b></a> ${verb === 'earned' ? `earned <b>${esc(text)}</b>` : `${verb} <a href="#/venue/${venue}">${esc(venueName(venue))}</a><p class="muted">${esc(text)}</p>`}</div>
          </li>`;
        }).join('')}
      </ul>
    </section>
    <section class="section">
      <div class="section__head"><h2>${esc(me.displayName)}'s latest</h2><a href="#/profile">Profile →</a></div>
      <div class="stub-list">${logs.map(ticketStub).join('')}</div>
    </section>
  </div>`;

  bindStubs(root, id => getLogs().find(l => l.id === id));
  bindWaitlist(root);
}
