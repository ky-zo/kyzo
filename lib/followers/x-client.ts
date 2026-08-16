import type { XFollowerSnapshot } from './types'

const DEFAULT_QUERY_ID = '_P1caq0YB4SVuEtFLPDMfQ'
const DAY = 86_400_000

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set — required for the X follower sync`)
  return value
}

function utcMidnight(timestamp: number): number {
  const date = new Date(timestamp)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function collectRows(node: unknown, rows: Record<string, unknown>[]): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) collectRows(child, rows)
    return
  }
  const record = node as Record<string, unknown>
  if (record.timestamp && (record.metric_values || record.engagement_type)) {
    rows.push(record)
    return
  }
  for (const child of Object.values(record)) collectRows(child, rows)
}

function timestampDate(value: unknown): string | null {
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10)
  if (typeof value === 'string') return new Date(value).toISOString().slice(0, 10)
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  return timestampDate(record.iso8601_time ?? record.time ?? record.timestamp)
}

function metricNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

function parseDailyNet(result: Record<string, unknown>): Array<{ date: string; net: number }> {
  const rows: Record<string, unknown>[] = []
  collectRows(result.legacy_current_follow_metrics ?? result.current_time_series, rows)
  const byDate = new Map<string, number>()

  for (const row of rows) {
    const date = timestampDate(row.timestamp)
    if (!date) continue
    let net = 0
    const metrics = Array.isArray(row.metric_values) ? row.metric_values : []
    for (const value of metrics) {
      if (!value || typeof value !== 'object') continue
      const metric = value as Record<string, unknown>
      const type = String(metric.metric_type ?? metric.type ?? '').toLowerCase()
      const count = metricNumber(metric.metric_value ?? metric.value ?? metric.count)
      if (type.includes('unfollow')) net -= count
      else if (type.includes('follow')) net += count
    }
    if (!metrics.length) {
      const type = String(row.engagement_type ?? '').toLowerCase()
      const count = metricNumber(row.count)
      if (type.includes('unfollow')) net -= count
      else if (type.includes('follow')) net += count
    }
    byDate.set(date, (byDate.get(date) ?? 0) + net)
  }

  return Array.from(byDate, ([date, net]) => ({ date, net })).sort((a, b) => a.date.localeCompare(b.date))
}

export async function fetchXFollowers(days = 45): Promise<XFollowerSnapshot> {
  const now = Date.now()
  const currentTo = utcMidnight(now) + DAY
  const currentFrom = currentTo - days * DAY
  const previousFrom = currentFrom - days * DAY
  const backfillFrom = utcMidnight(now) - DAY
  const variables = {
    current_from: currentFrom,
    current_from_iso: new Date(currentFrom).toISOString(),
    current_to: currentTo,
    current_to_iso: new Date(currentTo).toISOString(),
    prev_from: previousFrom,
    prev_from_iso: new Date(previousFrom).toISOString(),
    prev_to: currentFrom,
    prev_to_iso: new Date(currentFrom).toISOString(),
    backfill_from: backfillFrom,
    backfill_to: currentTo,
    show_verified_followers: true,
  }
  const queryId = process.env.X_GRAPHQL_QUERY_ID || DEFAULT_QUERY_ID
  const url = new URL(`https://x.com/i/api/graphql/${queryId}/accountOverviewDailyQuery`)
  url.searchParams.set('variables', JSON.stringify(variables))
  const csrf = required('X_CSRF_TOKEN')
  const auth = required('X_AUTH_TOKEN')
  const extraCookie = process.env.X_EXTRA_COOKIE?.trim()
  const cookie = [`auth_token=${auth}`, `ct0=${csrf}`, extraCookie].filter(Boolean).join('; ')
  const headers: Record<string, string> = {
    accept: '*/*',
    authorization: `Bearer ${required('X_BEARER_TOKEN')}`,
    cookie,
    referer: 'https://x.com/i/account_analytics/overview',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    'x-csrf-token': csrf,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
  }
  if (process.env.X_CLIENT_TRANSACTION_ID) headers['x-client-transaction-id'] = process.env.X_CLIENT_TRANSACTION_ID

  const response = await fetch(url, { headers, cache: 'no-store' })
  if (!response.ok) throw new Error(`X Account Analytics returned HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`)
  const body = (await response.json()) as Record<string, any>
  const result = body?.data?.viewer_v2?.user_results?.result as Record<string, unknown> | undefined
  if (!result) throw new Error('X Account Analytics returned no user result')
  const currentFollowers = metricNumber((result.relationship_counts as Record<string, unknown> | undefined)?.followers)
  if (!currentFollowers) throw new Error('X Account Analytics returned no exact follower count')
  const dailyNet = parseDailyNet(result)
  if (!dailyNet.length) throw new Error('X Account Analytics returned no daily follow metrics')

  return { currentFollowers, dailyNet, fetchedAt: new Date().toISOString() }
}
