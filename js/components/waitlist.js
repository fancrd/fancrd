// Email waitlist. Signups post to the "Fancrd Waitlist" Google Form in the officialfancrd account.
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc2kclhHWR9gdtcr-m73pCfFp3fX-11I0VLqllGgjnG2QBAFw/formResponse';
const EMAIL_ENTRY = 'entry.995342009';
const SUCCESS = "You're on the list. See you at the game!";

export const waitlistForm = () => `
  <section class="waitlist" aria-labelledby="waitlist-title">
    <h2 id="waitlist-title">Get on the list</h2>
    <form data-waitlist novalidate>
      <div class="waitlist__row">
        <input type="email" name="email" placeholder="you@example.com" autocomplete="email" aria-label="Email address" required>
        <button class="btn btn--primary" type="submit">Join the waitlist</button>
      </div>
      <input class="waitlist__hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    </form>
    <p class="waitlist__status" data-waitlist-status role="status"></p>
    <p class="muted small">We'll only email you about Fancrd. Unsubscribe anytime.</p>
  </section>`;

export function bindWaitlist(root) {
  const form = root.querySelector('[data-waitlist]');
  if (!form) return;
  const status = root.querySelector('[data-waitlist-status]');
  const setStatus = (text, kind) => {
    status.textContent = text;
    status.className = `waitlist__status ${kind}`;
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    // Bots fill the hidden field; pretend it worked and store nothing
    if (form.elements.website.value) {
      form.hidden = true;
      setStatus(SUCCESS, 'success');
      return;
    }
    const email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      // no-cors: Google hides the response, so only network failures are detectable
      await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ [EMAIL_ENTRY]: email }) });
      form.hidden = true;
      setStatus(SUCCESS, 'success');
    } catch {
      button.disabled = false;
      setStatus('That did not go through. Please try again.', 'error');
    }
  });
}
