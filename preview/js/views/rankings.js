import { getLogs, getProfile, getFriends } from '../store.js';
import { VENUES, TEAMS, LEAGUES, venueLeagues } from '../data/venues.js';
import { computeStats, communityRating } from '../stats.js';
import { evaluateBadges } from '../badges-engine.js';
import { esc, iconSvg } from '../components/ui.js';

export function renderRankings(root) {
  const me = getProfile();
  const logs = getLogs();
  const myStats = computeStats(logs);
  const fans = [
    { ...me, stats: { ...myStats, badges: evaluateBadges(logs, me).filter(b => b.earned).length }, isMe: true },
    ...getFriends(),
  ].sort((a, b) => b.stats.venues - a.stats.venues);

  const topBy = league => VENUES.filter(v => venueLeagues(v).includes(league))
    .map(v => ({ v, r: communityRating(v.id) }))
    .sort((a, b) => b.r.avg - a.r.avg).slice(0, 10);

  root.innerHTML = `
  <section class="page-head"><h1>Rankings</h1><p class="muted">Community venue ratings and the fans who've been everywhere. (Sample numbers.)</p></section>
  <div class="rank-grid">
    ${LEAGUES.map(l => `<section class="section rank-col">
      <div class="section__head"><h2>Top ${l.name} venues</h2></div>
      <ol class="rank-list">${topBy(l.id).map(({ v, r }, i) => `<li><span class="rank">${i + 1}</span>
        <a href="#/venue/${v.id}">${esc(v.name)}</a><span class="rank-score">${r.avg.toFixed(1)}</span></li>`).join('')}</ol>
    </section>`).join('')}
    <section class="section rank-col">
      <div class="section__head"><h2>Most venues visited</h2><span class="muted">You + following</span></div>
      <ol class="rank-list">${fans.map((f, i) => `<li class="${f.isMe ? 'me' : ''}"><span class="rank">${i + 1}</span>
        <a class="avatar avatar--sm" href="${f.isMe ? '#/profile' : '#/u/' + f.username}" style="--c1:${TEAMS[f.favoriteTeams?.[0]]?.colors[0] || '#e30a0a'}">${iconSvg(f.icon)}</a>
        <a href="${f.isMe ? '#/profile' : '#/u/' + f.username}">${esc(f.displayName)}</a><span class="rank-score">${f.stats.venues}</span></li>`).join('')}</ol>
    </section>
  </div>`;
}
