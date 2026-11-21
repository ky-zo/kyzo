// One mailing list for every project. A site's server posts {email, source} to /subscribe with the shared token.
// The worker only inserts: it can't read, change or delete the list.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const SOURCE = /^[a-z0-9][a-z0-9.-]{0,63}$/
const encoder = new TextEncoder()

function authorized(request, token) {
  if (!token) return false
  const given = encoder.encode(request.headers.get('Authorization') ?? '')
  const expected = encoder.encode(`Bearer ${token}`)
  return given.byteLength === expected.byteLength && crypto.subtle.timingSafeEqual(given, expected)
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/subscribe') return new Response('Not found', { status: 404 })
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
    if (!authorized(request, env.NEWSLETTER_TOKEN)) return new Response('Unauthorized', { status: 401 })

    let body = null
    try {
      body = await request.json()
    } catch {}
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()
    const source = String(body?.source ?? '')
      .trim()
      .toLowerCase()
    if (email.length > 254 || !EMAIL.test(email)) return Response.json({ error: 'invalid email' }, { status: 400 })
    if (!SOURCE.test(source)) return Response.json({ error: 'invalid source' }, { status: 400 })

    // A repeat signup from the same project keeps its first date.
    await env.DB.prepare('INSERT INTO signups (email, source) VALUES (?, ?) ON CONFLICT DO NOTHING').bind(email, source).run()
    return new Response(null, { status: 204 })
  },
}
