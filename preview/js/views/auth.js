// Sign in / create account. Preview only: nothing is sent anywhere and passwords are
// never stored. The real version will call the auth backend (e.g. Supabase or Firebase).
import { createAccount, setSignedIn } from '../store.js';
import { TEAMS } from '../data/venues.js';
import { esc, refereeSvg, toast } from '../components/ui.js';
import { validateUsername } from './profile.js';

const PASSWORD_RULES = [
  ['len', 'At least 8 characters', p => p.length >= 8],
  ['cap', 'A capital letter', p => /[A-Z]/.test(p)],
  ['num', 'A number', p => /\d/.test(p)],
  ['sym', 'A special character', p => /[^A-Za-z0-9]/.test(p)],
];

const socialButtons = `
  <div class="social-auth">
    <button class="btn btn--ghost" type="button" disabled title="Coming soon">Continue with Google</button>
    <button class="btn btn--ghost" type="button" disabled title="Coming soon">Continue with Apple</button>
  </div>
  <div class="divider"><span>or</span></div>`;

export function renderSignIn(root) {
  root.innerHTML = `
  <section class="auth">
    <h1>Welcome back</h1>
    ${socialButtons}
    <form class="form" id="signin">
      <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="field"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>
      <button class="btn btn--primary btn--block" type="submit">Sign in</button>
      <p class="muted small">Preview: signs you in to the sample account. Nothing is checked or saved.</p>
    </form>
    <p class="muted">New here? <a href="#/join">Create your Fancrd</a></p>
  </section>`;
  root.querySelector('#signin').addEventListener('submit', e => {
    e.preventDefault();
    setSignedIn(true);
    location.hash = '#/profile';
    toast('Signed in');
  });
}

export function renderJoin(root) {
  let home = null;
  root.innerHTML = `
  <section class="auth auth--wide">
    <h1>Create your Fancrd</h1>
    <p class="muted">Launching with NFL, college football and MLB.</p>
    ${socialButtons}
    <form class="form" id="join" novalidate>
      <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required><small class="err" data-err="email"></small></label>
      <div class="form-grid">
        <label class="field"><span>Username</span><input name="username" autocomplete="username" placeholder="e.g. lambeaulover" required><small class="err" data-err="username"></small></label>
        <label class="field"><span>Display name</span><input name="displayName" maxlength="30" placeholder="Shown on your card" required><small class="err" data-err="displayName"></small></label>
      </div>
      <label class="field"><span>Password</span><input type="password" name="password" autocomplete="new-password" required></label>
      <ul class="ref-list" aria-live="polite">
        ${PASSWORD_RULES.map(([k, label]) => `<li data-rule="${k}">${refereeSvg(false)}<span>${label}</span></li>`).join('')}
      </ul>
      <label class="field"><span>Confirm password</span><input type="password" name="confirm" autocomplete="new-password" required><small class="err" data-err="confirm"></small></label>
      <label class="field"><span>Favorite team (optional)</span>
        <select name="team"><option value="">Pick later</option>${Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name))
          .map(t => `<option value="${t.id}">${esc(t.name)} (${t.league})</option>`).join('')}</select></label>
      <div class="toggle-row">
        <label class="switch"><input type="checkbox" name="location"><i></i></label>
        <div><b>Use my location</b><p class="muted small">Finds the closest stadiums you haven't visited and unlocks local badges like No Place Like Home.</p><small data-loc class="muted"></small></div>
      </div>
      <div class="toggle-row">
        <label class="switch"><input type="checkbox" name="weekly" checked><i></i></label>
        <div><b>Weekly Fancrd recap email</b><p class="muted small">Your recent games, the closest stadium you haven't been to, and a fan story or fun fact. Unsubscribe anytime.</p></div>
      </div>
      <button class="btn btn--primary btn--block" type="submit">Create account</button>
      <p class="muted small">Preview: your account is saved only in this browser. Your password is never stored.</p>
    </form>
    <p class="muted">Already have an account? <a href="#/signin">Sign in</a></p>
  </section>`;

  const form = root.querySelector('#join');
  const $ = n => form.elements[n];
  const setErr = (k, msg) => { form.querySelector(`[data-err=${k}]`).textContent = msg; };

  $('password').addEventListener('input', () => {
    const p = $('password').value;
    PASSWORD_RULES.forEach(([k, , test]) => {
      const li = form.querySelector(`[data-rule=${k}]`);
      const ok = test(p);
      li.classList.toggle('ok', ok);
      li.querySelector('svg').outerHTML = refereeSvg(ok);
    });
  });

  $('location').addEventListener('change', () => {
    const note = form.querySelector('[data-loc]');
    if (!$('location').checked) { home = null; note.textContent = ''; return; }
    if (!navigator.geolocation) { note.textContent = 'Location isn’t available in this browser.'; $('location').checked = false; return; }
    note.textContent = 'Asking your browser…';
    navigator.geolocation.getCurrentPosition(
      pos => { home = { city: 'Near you', lat: pos.coords.latitude, lng: pos.coords.longitude }; note.textContent = 'Location on.'; },
      () => { $('location').checked = false; note.textContent = 'Location was not shared. You can turn it on later.'; },
      { maximumAge: 600000, timeout: 10000 },
    );
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const username = $('username').value.trim().toLowerCase();
    const errs = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value.trim()) ? '' : 'Enter a valid email.',
      username: validateUsername(username, null, null),
      displayName: $('displayName').value.trim() ? '' : 'Add a display name for your card.',
      confirm: $('confirm').value === $('password').value ? '' : 'Passwords don’t match.',
    };
    Object.entries(errs).forEach(([k, v]) => setErr(k, v));
    const pwOk = PASSWORD_RULES.every(([, , test]) => test($('password').value));
    if (!pwOk) setErr('confirm', 'Your password needs a thumbs-up from every referee.');
    if (Object.values(errs).some(Boolean) || !pwOk) return;

    location.hash = '#/profile';
    createAccount({
      username,
      displayName: $('displayName').value.trim(),
      favoriteTeams: $('team').value ? [$('team').value] : [],
      home,
      weeklyEmail: $('weekly').checked,
      joined: new Date().toISOString().slice(0, 10),
    });
    toast(`Welcome to Fancrd, ${esc($('displayName').value.trim())}!`);
  });
}
