import { PostHog } from 'posthog-node'

/**
 * Server-side PostHog client for short-lived route handlers: flushes every
 * event immediately, so callers only need `await client.shutdown()` when done.
 */
export function getPostHogServer(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        new Error(
          'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
        ),
      )
    }
    return null
  }
  return new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
}

/** Report a server-side exception without ever affecting the response. */
export async function captureServerException(error: unknown, properties?: Record<string, unknown>) {
  const client = getPostHogServer()
  if (!client) return
  try {
    client.captureException(error instanceof Error ? error : new Error(String(error)), undefined, properties)
    await client.shutdown()
  } catch {
    // Analytics must never take down the route it instruments.
  }
}
