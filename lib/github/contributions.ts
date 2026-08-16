export type GitHubContributionPoint = {
  date: string
  contributions: number
}

const CALENDAR_START_YEAR = 2023
const GITHUB_USERNAME = 'ky-zo'

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1]
}

export function parseContributionCalendar(html: string) {
  const dateByCell = new Map<string, string>()
  const cellPattern = /<td\b[^>]*\bContributionCalendar-day\b[^>]*>/g
  let match: RegExpExecArray | null
  while ((match = cellPattern.exec(html)) !== null) {
    const id = attribute(match[0], 'id')
    const date = attribute(match[0], 'data-date')
    if (id && date) dateByCell.set(id, date)
  }

  const points: GitHubContributionPoint[] = []
  const tooltipPattern = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g
  while ((match = tooltipPattern.exec(html)) !== null) {
    const date = dateByCell.get(match[1])
    if (!date) continue

    const count = match[2].trim().match(/^([\d,]+) contributions?\b/i)
    points.push({
      date,
      contributions: count ? Number.parseInt(count[1].replaceAll(',', ''), 10) : 0,
    })
  }

  return points
}

function expectedDays(year: number) {
  return new Date(Date.UTC(year + 1, 0, 1)).getTime() - new Date(Date.UTC(year, 0, 1)).getTime()
}

export function parseContributionYear(html: string, year: number) {
  const points = parseContributionCalendar(html)
  const uniqueDates = new Set(points.map((point) => point.date))
  const dayCount = expectedDays(year) / 86_400_000

  if (points.length !== dayCount || uniqueDates.size !== dayCount || points.some((point) => !point.date.startsWith(`${year}-`))) {
    throw new Error(`GitHub contribution calendar for ${year} was incomplete`)
  }

  const publishedTotal = html.match(/<h2\b[^>]*\bid="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s*contributions\b/i)?.[1]
  if (!publishedTotal) {
    throw new Error(`GitHub contribution calendar for ${year} had no published total`)
  }

  const expectedTotal = Number.parseInt(publishedTotal.replaceAll(',', ''), 10)
  const parsedTotal = points.reduce((total, point) => total + point.contributions, 0)
  if (parsedTotal !== expectedTotal) {
    throw new Error(`GitHub contribution calendar for ${year} did not match its published total`)
  }

  return points.sort((a, b) => a.date.localeCompare(b.date))
}

async function fetchContributionYear(year: number) {
  const response = await fetch(`https://github.com/users/${GITHUB_USERNAME}/contributions?from=${year}-01-01&to=${year}-12-31`, {
    headers: {
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'kyzo.io public contribution chart',
    },
    next: { revalidate: 86_400 },
  })

  if (!response.ok) {
    throw new Error(`GitHub contribution calendar returned HTTP ${response.status}`)
  }

  return parseContributionYear(await response.text(), year)
}

export async function fetchPublicGitHubContributions(now = new Date()) {
  const years = Array.from({ length: now.getUTCFullYear() - CALENDAR_START_YEAR + 1 }, (_, index) => CALENDAR_START_YEAR + index)
  const today = now.toISOString().slice(0, 10)
  const points = (await Promise.all(years.map(fetchContributionYear)))
    .flat()
    .filter((point) => point.date >= '2023-04-01' && point.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    username: GITHUB_USERNAME,
    semantics:
      "Daily totals published on GitHub's profile contribution calendar. They can include commits, pull requests, issues, reviews, and anonymized private activity.",
    points,
    totalContributions: points.reduce((total, point) => total + point.contributions, 0),
    updatedAt: now.toISOString(),
  }
}
