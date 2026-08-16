import type { FollowerHistory, FollowerPoint, XFollowerSnapshot } from './types'

const DAY = 86_400_000

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function previousDate(date: string): string {
  return dateOnly(new Date(new Date(`${date}T00:00:00Z`).getTime() - DAY))
}

function calendarDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.FOLLOWER_TIMEZONE || 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoDate))
}

export function mergeXSnapshot(history: FollowerHistory, snapshot: XFollowerSnapshot): FollowerHistory {
  const netByDate = new Map(snapshot.dailyNet.map((point) => [point.date, point.net]))
  const dates = snapshot.dailyNet.map((point) => point.date).sort()
  const windowStart = dates[0]
  const latestNetDate = dates.at(-1)
  const today = calendarDate(snapshot.fetchedAt)

  if (!windowStart || !latestNetDate) throw new Error('X returned no daily follow metrics')

  const fresh: FollowerPoint[] = []
  let cursor = today
  let followers = snapshot.currentFollowers
  fresh.push({ date: cursor, followers, kind: 'x-daily', source: 'X Account Analytics' })

  // The current relationship count is live. Walk backward only across dates for
  // which X supplied (or intentionally omitted as zero) the daily net movement.
  if (latestNetDate === today) {
    while (cursor >= windowStart) {
      followers -= netByDate.get(cursor) ?? 0
      cursor = previousDate(cursor)
      fresh.push({ date: cursor, followers, kind: 'x-daily', source: 'X Account Analytics' })
    }
  }

  const byDate = new Map(history.points.filter((point) => point.date <= today).map((point) => [point.date, point]))
  for (const point of fresh) byDate.set(point.date, point)

  return {
    ...history,
    updatedAt: snapshot.fetchedAt,
    currentFollowers: snapshot.currentFollowers,
    points: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    lastSync: {
      at: snapshot.fetchedAt,
      provider: 'x-account-analytics',
      windowStart,
      windowEnd: today,
    },
  }
}
