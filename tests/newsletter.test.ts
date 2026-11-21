import assert from 'node:assert/strict'
import test from 'node:test'

import { cleanEmail, HIDE_SIGNUP_SCRIPT } from '../lib/newsletter'

test('emails are trimmed and lowercased, and junk is refused', () => {
  assert.equal(cleanEmail('  Ada@Example.COM '), 'ada@example.com')
  assert.equal(cleanEmail('ada+notes@mail.example.co.uk'), 'ada+notes@mail.example.co.uk')
  const junk = [
    '',
    'ada',
    'ada@',
    '@example.com',
    'ada@example',
    'ada@@example.com',
    'ada @example.com',
    'ada@example..com',
    'ada@.com',
    null,
    undefined,
    `a@b.${'c'.repeat(260)}`,
  ]
  for (const value of junk) assert.equal(cleanEmail(value), null, String(value))
})

test('the signup block hides only for browsers carrying the subscribed cookie', () => {
  const hides = (cookie: string, search = '') => {
    const documentElement = { dataset: {} as Record<string, string> }
    new Function('document', 'location', HIDE_SIGNUP_SCRIPT)({ cookie, documentElement }, { search })
    return 'subscribed' in documentElement.dataset
  }
  assert.equal(hides('newsletter_subscribed=1'), true)
  assert.equal(hides('ph_session=abc; newsletter_subscribed=1; theme=dark'), true)
  assert.equal(hides(''), false)
  assert.equal(hides('newsletter_subscribed=10'), false)
  assert.equal(hides('old_newsletter_subscribed=1'), false)
  // Coming back from a no-JS signup, the block stays so the confirmation shows.
  assert.equal(hides('newsletter_subscribed=1', '?newsletter=subscribed'), false)
})
