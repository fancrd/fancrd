// Visited-venues map (Leaflet, loaded globally from cdnjs in index.html).
import { VENUE_BY_ID } from '../data/venues.js';
import { esc } from './ui.js';

export function mountVisitMap(el, logs, { mode = 'pins' } = {}) {
  if (!window.L) {
    el.innerHTML = '<p class="muted pad">Map could not load. Check your connection.</p>';
    return null;
  }
  const counts = {};
  logs.forEach(l => { counts[l.venue] = (counts[l.venue] || 0) + 1; });
  const map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
    .setView([39.5, -96], 4);
  // Keyless OSM tiles, darkened in CSS (.map .leaflet-tile-pane). For production traffic,
  // switch to a hosted tile provider with an API key (OSM's servers are for light use).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  const layer = L.layerGroup().addTo(map);
  const max = Math.max(1, ...Object.values(counts));
  const draw = m => {
    layer.clearLayers();
    Object.entries(counts).forEach(([id, n]) => {
      const v = VENUE_BY_ID[id];
      if (!v) return;
      const tip = `<b>${esc(v.name)}</b><br>${esc(v.city)}, ${esc(v.state)}<br>${n} visit${n > 1 ? 's' : ''}`;
      if (m === 'heat') {
        const t = n / max;
        L.circle([v.lat, v.lng], { radius: 60000 + 140000 * t, stroke: false, fillColor: '#e30a0a', fillOpacity: 0.25 + 0.45 * t })
          .bindTooltip(tip).addTo(layer);
      } else {
        L.circleMarker([v.lat, v.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#e30a0a', fillOpacity: 1 })
          .bindTooltip(tip).addTo(layer);
      }
    });
  };
  draw(mode);
  const pts = Object.keys(counts).map(id => VENUE_BY_ID[id]).filter(Boolean).map(v => [v.lat, v.lng]);
  // No animation: the profile view can tear the map down mid-zoom on navigation
  if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 6, animate: false });
  return { setMode: draw, map };
}
