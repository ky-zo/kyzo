import assert from 'node:assert/strict'
import test from 'node:test'

import { cleanEmail } from '../lib/newsletter'

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
