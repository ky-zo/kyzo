import { NextResponse } from 'next/server'

import { cleanEmail, NEWSLETTER_SOURCE } from '@/lib/newsletter'
import { captureServerException } from '@/lib/posthog-server'

export const dynamic = 'force-dynamic'

type Outcome = { status: number; error?: string }

async function save(email: string): Promise<Outcome> {
  const hub = process.env.NEWSLETTER_URL
  const token = process.env.NEWSLETTER_TOKEN
  if (!hub || !token) {
    console.error('NEWSLETTER_URL and NEWSLETTER_TOKEN must be set to accept signups')
    return { status: 503, error: 'signups are closed right now' }
  }
  try {
    const saved = await fetch(`${hub.replace(/\/+$/, '')}/subscribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: NEWSLETTER_SOURCE }),
      cache: 'no-store',
    })
    if (!saved.ok) throw new Error(`Newsletter worker answered HTTP ${saved.status}`)
    return { status: 204 }
  } catch (error) {
    console.error('Newsletter signup failed', error)
    await captureServerException(error, { route: '/api/subscribe' })
    return { status: 502, error: 'couldn’t save that, try again' }
  }
}

async function subscribe(request: Request, fields: { email?: unknown; website?: unknown } | null): Promise<Outcome> {
  // Only this site's own form may sign people up.
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== request.headers.get('host')) return { status: 403, error: 'forbidden' }
  // Bots fill the hidden website field. Thank them and store nothing.
  if (fields?.website) return { status: 204 }
  const email = cleanEmail(fields?.email)
  if (!email) return { status: 400, error: 'that email doesn’t look right' }
  return save(email)
}

export async function POST(request: Request) {
  // The form posts JSON once the page is interactive, and a plain form post before that.
  const json = request.headers.get('content-type')?.includes('application/json') ?? false
  let fields: { email?: unknown; website?: unknown } | null = null
  try {
    fields = json ? await request.json() : Object.fromEntries(await request.formData())
  } catch {}
  const outcome = await subscribe(request, fields)

  if (!json) {
    const result = outcome.status < 300 ? 'subscribed' : outcome.status === 400 ? 'invalid' : 'error'
    return new NextResponse(null, { status: 303, headers: { Location: `/?newsletter=${result}`, 'Cache-Control': 'no-store' } })
  }
  if (outcome.error) return NextResponse.json({ error: outcome.error }, { status: outcome.status, headers: { 'Cache-Control': 'no-store' } })
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
