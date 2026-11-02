// Preview data layer. Everything lives in this browser's localStorage until the real
// backend (accounts + database) is connected; swap these functions for API calls then.
import { SAMPLE_USER, SAMPLE_LOGS, SAMPLE_FRIENDS } from './data/sample.js';

const KEY = 'fancrd.preview.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

let state = load();
const listeners = new Set();
function commit(next) {
  state = next;
  save(state);
  listeners.forEach(fn => fn());
}

export const onChange = fn => listeners.add(fn);

export function getProfile() {
  return { ...SAMPLE_USER, ...(state.profile || {}) };
}
export function saveProfile(patch) {
  commit({ ...state, profile: { ...(state.profile || {}), ...patch } });
}

export function getLogs() {
  const edits = state.logEdits || {};
  const removed = new Set(state.removed || []);
  const all = [...(state.fresh ? [] : SAMPLE_LOGS), ...(state.logs || [])]
    .filter(l => !removed.has(l.id))
    .map(l => ({ ...l, ...(edits[l.id] || {}) }));
  return all.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
}
export function addLog(log) {
  const id = 'u' + Date.now().toString(36);
  commit({ ...state, logs: [...(state.logs || []), { ...log, id }] });
  return id;
}
export function updateLog(id, patch) {
  const edits = state.logEdits || {};
  commit({ ...state, logEdits: { ...edits, [id]: { ...(edits[id] || {}), ...patch } } });
}
export function removeLog(id) {
  commit({
    ...state,
    logs: (state.logs || []).filter(l => l.id !== id),
    removed: [...(state.removed || []), id],
  });
}

export const getFriends = () => SAMPLE_FRIENDS;
export const getFriend = username => SAMPLE_FRIENDS.find(f => f.username === username);

// New account: drop the sample fan's history and start with this profile
export function createAccount(profile) {
  commit({ fresh: true, signedIn: true, profile: { ...profile, displayedBadges: [], photo: null, backPhoto: null } });
}

export function isSignedIn() { return !!state.signedIn; }
export function setSignedIn(v) { commit({ ...state, signedIn: v }); }

export function resetPreview() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  state = {};
  listeners.forEach(fn => fn());
}
