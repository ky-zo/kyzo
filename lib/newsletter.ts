// Signups go to the shared newsletter worker, tagged with the site they came from.
export const NEWSLETTER_SOURCE = 'kyzo.io'

// One @, no spaces, and a dotted domain. Delivery proves the rest.
export function cleanEmail(value: unknown): string | null {
  const email = String(value ?? '')
    .trim()
    .toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) ? email : null
}
