import type { StravaEffortHistory, StravaEffortPoint } from './types'

export const EFFORT_START = '2023-04-01'
export const EFFORT_SEMANTICS =
  'Daily effort index from Strava: kilometers run + kilometers cycled + gym visits + moving minutes of every other sport, counted from April 2023.'

const RUN_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun'])
const RIDE_SPORTS = new Set(['Ride', 'MountainBikeRide', 'GravelRide', 'VirtualRide', 'EBikeRide'])
const GYM_SPORTS = new Set(['WeightTraining', 'Workout', 'Crossfit'])

type StravaActivity = {
  start_date_local?: string
  sport_type?: string
  type?: string
  distance?: number
  moving_time?: number
}

type SyncOptions = {
  refreshToken?: string
  onTokenRotated?: (refreshToken: string) => Promise<void>
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set — required for Strava sync`)
  return value
}

const round1 = (value: number) => Math.round(value * 10) / 10

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: required('STRAVA_CLIENT_ID'),
      client_secret: required('STRAVA_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Strava token refresh failed (HTTP ${response.status})`)
  const token = (await response.json()) as { access_token?: string; refresh_token?: string }
  if (!token.access_token || !token.refresh_token) throw new Error('Strava token refresh response was invalid')
  return { accessToken: token.access_token, refreshToken: token.refresh_token }
}

async function fetchAllActivities(accessToken: string): Promise<StravaActivity[]> {
  const activities: StravaActivity[] = []
  for (let page = 1; page <= 40; page++) {
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=200&after=0`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Strava activities page ${page} failed (HTTP ${response.status})`)
    const batch = (await response.json()) as StravaActivity[]
    if (!batch.length) break
    activities.push(...batch)
    if (batch.length < 200) break
  }
  return activities
}

export function buildEffortHistory(activities: StravaActivity[], now = new Date()): StravaEffortHistory {
  const byDate = new Map<string, StravaEffortPoint>()
  let counted = 0

  for (const activity of activities) {
    const date = activity.start_date_local?.slice(0, 10)
    if (!date || date < EFFORT_START) continue
    const sport = activity.sport_type || activity.type || ''
    const point = byDate.get(date) ?? { date, effort: 0, runKm: 0, rideKm: 0, gymVisits: 0, otherMinutes: 0 }
    if (RUN_SPORTS.has(sport)) point.runKm += (activity.distance ?? 0) / 1000
    else if (RIDE_SPORTS.has(sport)) point.rideKm += (activity.distance ?? 0) / 1000
    else if (GYM_SPORTS.has(sport)) point.gymVisits += 1
    else point.otherMinutes += (activity.moving_time ?? 0) / 60
    byDate.set(date, point)
    counted++
  }

  const points = Array.from(byDate.values())
    .map((point) => {
      const runKm = round1(point.runKm)
      const rideKm = round1(point.rideKm)
      const otherMinutes = round1(point.otherMinutes)
      return { date: point.date, effort: round1(runKm + rideKm + point.gymVisits + otherMinutes), runKm, rideKm, gymVisits: point.gymVisits, otherMinutes }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    version: 1,
    semantics: EFFORT_SEMANTICS,
    updatedAt: now.toISOString(),
    totalEffort: Math.round(points.reduce((total, point) => total + point.effort, 0)),
    points,
    lastSync: { syncedAt: now.toISOString(), activities: counted },
  }
}

export async function fetchStravaEffort(options: SyncOptions = {}): Promise<StravaEffortHistory> {
  const initial = options.refreshToken || required('STRAVA_REFRESH_TOKEN')
  const token = await refreshAccessToken(initial)
  if (token.refreshToken !== initial && options.onTokenRotated) await options.onTokenRotated(token.refreshToken)
  const activities = await fetchAllActivities(token.accessToken)
  return buildEffortHistory(activities)
}
