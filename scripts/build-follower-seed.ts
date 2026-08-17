import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type Point = {
  date: string
  followers: number
  kind: 'baseline' | 'observed' | 'calibrated'
  source?: string
}

const root = process.cwd()
const netPath = path.join(root, 'data/followers/x-daily-net.json')
const monthlyPath = path.join(root, 'data/followers/followers-monthly.csv')
const anchorsPath = path.join(root, 'data/followers/followers-history-anchors.csv')
const outputPath = path.join(root, 'data/followers/history.seed.json')
const DAY = 86_400_000

function atNoon(date: string): number {
  return Date.parse(`${date}T12:00:00Z`)
}

function dateOnly(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function csvPoints(csv: string, source: string): Point[] {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(','))
    .filter((columns) => /^\d{4}-\d{2}-\d{2}$/.test(columns[0]) && Number.isFinite(Number(columns[1])))
    .map(([date, followers]) => ({ date, followers: Number(followers), kind: 'observed' as const, source }))
}

async function main() {
  const [netFile, monthlyCsv, anchorsCsv] = await Promise.all([readFile(netPath, 'utf8'), readFile(monthlyPath, 'utf8'), readFile(anchorsPath, 'utf8')])
  const { currentFollowers, net: dailyNet } = JSON.parse(netFile) as { currentFollowers: number; net: number[] }
  if (!Number.isFinite(currentFollowers) || !Array.isArray(dailyNet) || !dailyNet.length) {
    throw new Error('Could not read the X daily series from data/followers/x-daily-net.json')
  }
  const observed = [
    { date: '2023-04-01', followers: 0, kind: 'baseline' as const, source: 'User-defined start' },
    ...csvPoints(monthlyCsv, 'Typefully'),
    ...csvPoints(anchorsCsv, 'Tweet or export evidence'),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const rawByDate = new Map<string, number>()
  let running = currentFollowers - dailyNet.reduce((sum, value) => sum + value, 0)
  rawByDate.set('2025-08-15', running)
  dailyNet.forEach((net, index) => {
    running += net
    rawByDate.set(dateOnly(atNoon('2025-08-16') + index * DAY), running)
  })

  const calibrationStart = '2025-08-16'
  const historical = observed.filter((point) => point.date < calibrationStart)
  const calibrationAnchors = observed.filter((point) => point.date >= calibrationStart)
  const canonical: Point[] = [...historical]

  calibrationAnchors.slice(0, -1).forEach((start, index) => {
    const end = calibrationAnchors[index + 1]
    const days = Math.round((atNoon(end.date) - atNoon(start.date)) / DAY)
    const rawStart = rawByDate.get(start.date)
    const rawEnd = rawByDate.get(end.date)
    if (rawStart === undefined || rawEnd === undefined) return

    const reconciliation = end.followers - start.followers - (rawEnd - rawStart)
    if (index === 0) canonical.push(start)

    for (let day = 1; day <= days; day++) {
      const date = dateOnly(atNoon(start.date) + day * DAY)
      if (day === days) {
        canonical.push(end)
        continue
      }
      const rawValue = rawByDate.get(date)
      if (rawValue === undefined) continue
      canonical.push({
        date,
        followers: Math.round(start.followers + (rawValue - rawStart) + reconciliation * (day / days)),
        kind: 'calibrated',
        source: 'X daily movement between observed counts',
      })
    }
  })

  const byDate = new Map<string, Point>()
  for (const point of canonical) byDate.set(point.date, point)
  const points = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))

  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        version: 1,
        account: { id: '945756809356300294', username: 'ky__zo' },
        updatedAt: '2026-08-15T00:00:00.000Z',
        currentFollowers,
        points,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`Wrote ${points.length} follower points to ${path.relative(root, outputPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
