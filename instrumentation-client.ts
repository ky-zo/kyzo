import posthog from 'posthog-js'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    capture_exceptions: true,
  })
} else if (process.env.NODE_ENV === 'development') {
  // warn rather than throw: a thrown error here aborts hydration for the whole app
  console.warn('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set, PostHog events will be dropped')
}
