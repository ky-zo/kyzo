// Signups go to the shared newsletter worker, tagged with the site they came from.
export const NEWSLETTER_SOURCE = 'kyzo.io'

// One @, no spaces, and a dotted domain. Delivery proves the rest.
export function cleanEmail(value: unknown): string | null {
  const email = String(value ?? '')
    .trim()
    .toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) ? email : null
}

// Set by the server when a signup succeeds, so the form stays hidden on later visits.
// Server-set rather than document.cookie because Safari caps script-set cookies at 7 days; Chrome caps any cookie at 400.
export const SUBSCRIBED_COOKIE = 'newsletter_subscribed'
export const SUBSCRIBED_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

// Runs before first paint and flags <html>, which globals.css uses to hide the signup block.
// Skipped on the redirect back from a no-JS signup so that visit still shows the confirmation.
export const HIDE_SIGNUP_SCRIPT = `if(/(?:^|; )${SUBSCRIBED_COOKIE}=1(?:;|$)/.test(document.cookie)&&!/[?&]newsletter=subscribed/.test(location.search))document.documentElement.dataset.subscribed=''`
