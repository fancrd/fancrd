// Ticket stub for a logged event + its detail editor (notes, photo, category ratings).
import { TEAMS, VENUE_BY_ID } from '../data/venues.js';
import { updateLog, removeLog } from '../store.js';
import { esc, fmtDate, fmtTime, stars, bindStars, openModal, closeModal, readFileAsDataUrl, teamChip, toast } from './ui.js';

export const RATING_FIELDS = [
  ['food', 'Food & drink'], ['seating', 'Seating'], ['amenities', 'Amenities'],
  ['parking', 'Parking'], ['transit', 'Public transit'],
];

function matchup(log) {
  if (!log.home) return '<span class="stub__visit">Stadium visit</span>';
  const h = TEAMS[log.home], a = TEAMS[log.away];
  const score = log.homeScore != null && log.awayScore != null
    ? `<span class="stub__score">${log.awayScore}–${log.homeScore}${log.extra ? ` <small>${log.league === 'MLB' ? 'F/X' : 'OT'}</small>` : ''}</span>` : '';
  return `${teamChip(log.away, { size: 'sm' })}<span class="stub__vs">${log.neutral ? 'vs' : '@'}</span>${teamChip(log.home, { size: 'sm' })}
    <span class="stub__names">${esc(a?.short)} ${log.neutral ? 'vs' : '@'} ${esc(h?.short)}</span>${score}`;
}

export function ticketStub(log) {
  const v = VENUE_BY_ID[log.venue];
  const d = new Date(log.date + 'T12:00:00');
  return `
  <button class="stub" type="button" data-log="${log.id}">
    <div class="stub__main">
      <div class="stub__top"><span class="stub__league">${esc(log.league || '')}</span>${log.doubleheader ? '<span class="stub__tag">DH</span>' : ''}${log.openingDay ? '<span class="stub__tag">Opening Day</span>' : ''}</div>
      <div class="stub__matchup">${matchup(log)}</div>
      <div class="stub__venue">${esc(v?.name)}</div>
      <div class="stub__meta">${esc(v?.city)}, ${esc(v?.state)}${log.time ? ' · ' + fmtTime(log.time) : ''}</div>
    </div>
    <div class="stub__tear">
      <div class="stub__mon">${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</div>
      <div class="stub__day">${d.getDate()}</div>
      <div class="stub__yr">${d.getFullYear()}</div>
      ${stars(log.rating?.overall)}
    </div>
  </button>`;
}

export function bindStubs(root, getLog, { editable = true } = {}) {
  root.querySelectorAll('[data-log]').forEach(el => {
    el.addEventListener('click', () => openStubDetail(getLog(el.dataset.log), editable));
  });
}

export function openStubDetail(log, editable = true) {
  if (!log) return;
  const v = VENUE_BY_ID[log.venue];
  const rating = { ...(log.rating || {}) };
  let photo = log.photo || null;
  const title = log.home ? `${TEAMS[log.away]?.name} ${log.neutral ? 'vs' : '@'} ${TEAMS[log.home]?.name}` : 'Stadium visit';
  openModal(`
    <div class="stub-detail">
      <div class="stub-detail__head">
        <div class="eyebrow">${esc(log.league || '')} · ${fmtDate(log.date)}${log.time ? ' · ' + fmtTime(log.time) : ''}</div>
        <h2>${esc(title)}</h2>
        <div class="muted">${esc(v?.name)} — ${esc(v?.city)}, ${esc(v?.state)}${log.homeScore != null ? ` · Final ${log.awayScore}–${log.homeScore}` : ''}</div>
      </div>
      <div class="stub-detail__grid">
        <div>
          <div class="photo-drop ${photo ? 'has-photo' : ''}">
            ${photo ? `<img src="${photo}" alt="">` : '<span>Add a photo from the game</span>'}
            ${editable ? '<input type="file" accept="image/*" aria-label="Upload photo">' : ''}
          </div>
          <label class="field"><span>Notes</span>
            <textarea rows="4" ${editable ? '' : 'readonly'} placeholder="Best moment, where you sat, what you ate…">${esc(log.notes || '')}</textarea></label>
        </div>
        <div class="ratings">
          <div class="rating-row rating-row--main"><span>Overall</span>${stars(rating.overall, { name: 'overall', editable })}</div>
          ${RATING_FIELDS.map(([k, label]) => `<div class="rating-row"><span>${label}</span>${stars(rating[k], { name: k, editable })}</div>`).join('')}
          ${(log.with || []).length ? `<div class="with">With ${log.with.map(u => `<a href="#/u/${esc(u)}">@${esc(u)}</a>`).join(', ')}</div>` : ''}
        </div>
      </div>
      ${editable ? `<div class="actions">
        <button class="btn btn--ghost btn--danger" data-remove type="button">Remove</button>
        <button class="btn btn--primary" data-save type="button">Save</button></div>` : ''}
    </div>`, {
    wide: true,
    onMount: m => {
      if (!editable) return;
      bindStars(m, (k, n) => { rating[k] = n; });
      m.querySelector('input[type=file]').addEventListener('change', async e => {
        const f = e.target.files[0];
        if (!f) return;
        photo = await readFileAsDataUrl(f);
        const drop = m.querySelector('.photo-drop');
        drop.classList.add('has-photo');
        drop.querySelector('span, img')?.remove();
        drop.insertAdjacentHTML('afterbegin', `<img src="${photo}" alt="">`);
      });
      m.querySelector('[data-save]').addEventListener('click', () => {
        updateLog(log.id, { rating, photo, notes: m.querySelector('textarea').value });
        closeModal();
        toast('Ticket stub saved');
      });
      m.querySelector('[data-remove]').addEventListener('click', () => {
        if (!confirm('Remove this event from your log?')) return;
        removeLog(log.id);
        closeModal();
        toast('Event removed');
      });
    },
  });
}
