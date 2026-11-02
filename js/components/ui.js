// Small shared UI helpers: escaping, icons, stars, team chips, modal, toast.
import { TEAMS } from '../data/venues.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// Built-in profile icons (white line art on a 64x64 grid)
const ICON_PATHS = {
  batter: '<circle cx="30" cy="12" r="6"/><path d="M30 18v20l-8 18M30 38l8 18M30 24l12-4M30 24l10 6"/><path d="M42 20 56 4" stroke-width="5"/>',
  pitcher: '<circle cx="28" cy="10" r="6"/><path d="M28 16l2 20-10 20M30 36l14 10 4 10M29 22 14 14M29 22l16-8 6-8"/><circle cx="52" cy="5" r="3" fill="currentColor"/>',
  football: '<ellipse cx="32" cy="32" rx="26" ry="15" transform="rotate(-30 32 32)"/><path d="M22 38 42 26M27 36l-3-4M32 33l-3-4M37 30l-3-4"/>',
  helmet: '<path d="M10 36c0-16 12-26 26-26s20 10 20 22v8H34l-4 10H16c-4 0-6-6-6-14z"/><path d="M34 40h18M44 40v10h10M44 26h10"/><circle cx="26" cy="28" r="3"/>',
  baseball: '<circle cx="32" cy="32" r="24"/><path d="M18 14c8 10 8 26 0 36M46 14c-8 10-8 26 0 36"/><path d="M19 22l4-2M20 30h4M19 38l4 2M45 22l-4-2M44 30h-4M45 38l-4 2"/>',
  pennant: '<path d="M10 8v52"/><path d="M10 12 58 26 10 40z"/><path d="M20 22l14 4"/>',
  foam: '<path d="M22 60V34l-6-6V18c0-3 5-3 5 0v6M21 18V10c0-3 5-3 5 0v14M26 12V6c0-3 6-3 6 0v18M32 10c0-3 6-3 6 0v16l6-4c3-2 6 1 4 4l-8 12v22"/>',
  trophy: '<path d="M20 8h24v14c0 8-5 14-12 14s-12-6-12-14z"/><path d="M20 12H10c0 10 4 14 10 14M44 12h10c0 10-4 14-10 14M32 36v10M22 56h20M26 46h12v10H26z"/>',
};
export const ICON_IDS = Object.keys(ICON_PATHS);
export const iconSvg = (id, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[id] || ICON_PATHS.baseball}</svg>`;

// Referee for the password checklist: arms up = "it's good", arms crossed = "no good"
export function refereeSvg(good) {
  const arms = good
    ? '<path d="M24 30 16 10M40 30l8-20" stroke-width="4"/>'
    : '<path d="M16 26 48 38M16 38l32-12" stroke-width="4"/>';
  return `<svg class="ref ${good ? 'ref--good' : 'ref--bad'}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" class="ref__ring"/>
    <circle cx="32" cy="18" r="6" fill="#f2d3b3" stroke="#111" stroke-width="1.5"/>
    <rect x="23" y="25" width="18" height="20" rx="3" fill="#fff" stroke="#111" stroke-width="1.5"/>
    <path d="M27 25v20M32 25v20M37 25v20" stroke="#111" stroke-width="2.5"/>
    <path d="M27 45l-2 12M37 45l2 12" stroke="#111" stroke-width="3" stroke-linecap="round"/>
    <g stroke="#f2d3b3" stroke-linecap="round" fill="none">${arms}</g>
    <g stroke="#111" stroke-linecap="round" fill="none" stroke-width="1" opacity=".6">${arms.replace(/stroke-width="4"/, 'stroke-width="1"')}</g>
  </svg>`;
}

export function stars(value, { name = '', editable = false } = {}) {
  const v = Math.round(value || 0);
  const items = [1, 2, 3, 4, 5].map(n => editable
    ? `<button type="button" class="star ${n <= v ? 'on' : ''}" data-star="${n}" data-name="${name}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`
    : `<span class="star ${n <= v ? 'on' : ''}">★</span>`).join('');
  return `<span class="stars ${editable ? 'stars--edit' : ''}" role="${editable ? 'radiogroup' : 'img'}" aria-label="${v} of 5">${items}</span>`;
}

// Wires every editable star group inside root; calls onSet(name, value)
export function bindStars(root, onSet) {
  root.querySelectorAll('.stars--edit').forEach(group => {
    group.addEventListener('click', e => {
      const b = e.target.closest('[data-star]');
      if (!b) return;
      const n = +b.dataset.star;
      group.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < n));
      onSet(b.dataset.name, n);
    });
  });
}

// Team "logo" chip: initials in team colors (official logos need league licensing)
export function teamChip(teamId, { size = '' } = {}) {
  const t = TEAMS[teamId];
  if (!t) return '';
  return `<span class="team-chip ${size}" style="--c1:${t.colors[0]};--c2:${t.colors[1]}" title="${esc(t.name)}">${esc(t.short)}</span>`;
}

let modalEl;
export function openModal(html, { onMount, wide = false } = {}) {
  closeModal();
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.innerHTML = `<div class="modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true">
    <button class="modal__close" aria-label="Close">×</button>${html}</div>`;
  document.body.appendChild(modalEl);
  document.body.classList.add('no-scroll');
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl || e.target.closest('.modal__close')) closeModal();
  });
  onMount?.(modalEl.querySelector('.modal'));
}
export function closeModal() {
  modalEl?.remove();
  modalEl = null;
  document.body.classList.remove('no-scroll');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

export function toast(html) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3600);
}

export const readFileAsDataUrl = file => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(fr.result);
  fr.onerror = rej;
  fr.readAsDataURL(file);
});
