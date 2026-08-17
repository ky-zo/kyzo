export type SeriesPoint = {
  date: Date
  value: number
  contributions?: number
}

export type Period = {
  label: string
  short: string
  days?: number
  months?: number
  years?: number
  all?: boolean
}

export type Domain = {
  cutoff: number
  yMin: number
  yMax: number
}

export type ProjectedPoint = SeriesPoint & {
  x: number
  y: number
}

export const PERIODS: Period[] = [
  { label: '7 days', short: '7d', days: 7 },
  { label: '14 days', short: '14d', days: 14 },
  { label: '1 month', short: '1m', months: 1 },
  { label: '2 months', short: '2m', months: 2 },
  { label: '3 months', short: '3m', months: 3 },
  { label: '6 months', short: '6m', months: 6 },
  { label: '9 months', short: '9m', months: 9 },
  { label: '12 months', short: '12m', months: 12 },
  { label: '2 years', short: '2y', years: 2 },
  { label: '3 years', short: '3y', years: 3 },
  { label: 'Since April 2023', short: 'All', all: true },
]

export const HISTORY_START = new Date('2023-04-01T12:00:00')
export const CHART_SIZE = { w: 1040, h: 380, t: 21, r: 62, b: 47, l: 2 }
export const SLIDER_CLICK_DURATION = 160
export const SLIDER_DRAG_DURATION = 100
export const GRAPH_ZOOM_DURATION = 240
export const fmt = new Intl.NumberFormat('en-US')

const SMOOTHING = 0.28

export function shortDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function compact(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}K` : fmt.format(value)
}

export function deltaText(change: number) {
  return `${change < 0 ? '−' : '+'}${fmt.format(Math.abs(change))}`
}

export function niceStep(value: number) {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, value)))
  const scaled = value / power
  return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * power
}

export function niceStepDown(value: number) {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, value)))
  const scaled = value / power
  const factor = [1, 2, 2.5, 5, 10].filter((candidate) => candidate <= scaled).at(-1) || 1
  return factor * power
}

export function geometryPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return ''
  if (points.length === 1) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`

  const factor = SMOOTHING / 6
  let result = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
  for (let index = 0; index < points.length - 1; index++) {
    const previous = points[Math.max(0, index - 1)]
    const current = points[index]
    const next = points[index + 1]
    const following = points[Math.min(points.length - 1, index + 2)]
    const minY = Math.min(current.y, next.y)
    const maxY = Math.max(current.y, next.y)
    const control1 = {
      x: current.x + (next.x - previous.x) * factor,
      y: Math.max(minY, Math.min(maxY, current.y + (next.y - previous.y) * factor)),
    }
    const control2 = {
      x: next.x - (following.x - current.x) * factor,
      y: Math.max(minY, Math.min(maxY, next.y - (following.y - current.y) * factor)),
    }
    result += ` C${control1.x.toFixed(1)},${control1.y.toFixed(1)} ${control2.x.toFixed(1)},${control2.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`
  }
  return result
}

export function areaPath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length < 2) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${geometryPath(points)} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${first.x.toFixed(1)},${baseline.toFixed(1)} Z`
}

export function easeInOutQuart(value: number) {
  return value < 0.5 ? 8 * value ** 4 : 1 - (-2 * value + 2) ** 4 / 2
}

export function historyFrom(canonical: SeriesPoint[], cutoff: Date | number) {
  const cutoffTime = cutoff instanceof Date ? cutoff.getTime() : cutoff
  const firstVisible = canonical.findIndex((point) => point.date.getTime() >= cutoffTime)
  if (firstVisible < 0) return [canonical[canonical.length - 1]]
  if (firstVisible === 0 || canonical[firstVisible].date.getTime() === cutoffTime) return canonical.slice(firstVisible)

  const previous = canonical[firstVisible - 1]
  const next = canonical[firstVisible]
  const span = next.date.getTime() - previous.date.getTime()
  const progress = span ? Math.max(0, Math.min(1, (cutoffTime - previous.date.getTime()) / span)) : 0
  return [
    {
      date: new Date(cutoffTime),
      value: Math.round(previous.value + (next.value - previous.value) * progress),
    },
    ...canonical.slice(firstVisible),
  ]
}

export function seriesFrom(points: SeriesPoint[], cutoff: Date | number, displayEnd: Date | number) {
  const cutoffTime = cutoff instanceof Date ? cutoff.getTime() : cutoff
  const endTime = displayEnd instanceof Date ? displayEnd.getTime() : displayEnd
  return points.filter((point) => point.date.getTime() >= cutoffTime && point.date.getTime() <= endTime)
}

export function valueAt(points: SeriesPoint[], time: number) {
  if (!points.length) return null
  if (time <= points[0].date.getTime()) return points[0].value
  if (time >= points[points.length - 1].date.getTime()) return points[points.length - 1].value
  const upperIndex = points.findIndex((point) => point.date.getTime() >= time)
  const previous = points[upperIndex - 1]
  const next = points[upperIndex]
  const span = next.date.getTime() - previous.date.getTime()
  const progress = span ? (time - previous.date.getTime()) / span : 0
  return previous.value + (next.value - previous.value) * progress
}

export function cutoffFor(period: Period, displayEnd: Date) {
  const cutoff = new Date(displayEnd)
  if (period.days) cutoff.setDate(cutoff.getDate() - (period.days - 1))
  if (period.months) cutoff.setMonth(cutoff.getMonth() - period.months)
  if (period.years) cutoff.setFullYear(cutoff.getFullYear() - period.years)
  if (period.all) cutoff.setTime(HISTORY_START.getTime())
  return cutoff
}

export function yDomain(values: number[], period: Period) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const movement = Math.max(1, max - min)
  const tightRange = Boolean(period.days || period.months || period.years === 2)
  let step: number
  let yMin: number
  let yMax: number
  let tickStart: number

  if (tightRange) {
    const padding = Math.max(4, movement * 0.125)
    yMin = Math.max(0, min - padding)
    yMax = max + padding
    step = niceStepDown((yMax - yMin) / 4)
    yMax = Math.max(yMax, (Math.floor(max / step) + 1) * step)
    tickStart = Math.ceil(yMin / step) * step
  } else {
    const padding = Math.max(12, movement * 0.16, max * 0.011)
    step = niceStep((movement + padding * 2) / 4)
    yMin = Math.max(0, Math.floor((min - padding) / step) * step)
    yMax = Math.ceil((max + padding) / step) * step
    tickStart = yMin
  }

  if (yMax <= yMin) yMax = yMin + step
  return { yMin, yMax, step, tickStart }
}

export function project(points: SeriesPoint[], domain: Domain, displayEnd: number): ProjectedPoint[] {
  const { w, h, t, r, b, l } = CHART_SIZE
  const iw = w - l - r
  const ih = h - t - b
  return points.map((point) => ({
    ...point,
    x: l + ((point.date.getTime() - domain.cutoff) / Math.max(1, displayEnd - domain.cutoff)) * iw,
    y: t + (1 - (point.value - domain.yMin) / (domain.yMax - domain.yMin)) * ih,
  }))
}

export function xAt(date: Date, domain: Domain, displayEnd: number) {
  const { w, r, l } = CHART_SIZE
  return l + ((date.getTime() - domain.cutoff) / Math.max(1, displayEnd - domain.cutoff)) * (w - l - r)
}

export function yAt(value: number, domain: Domain) {
  const { h, t, b } = CHART_SIZE
  return t + (1 - (value - domain.yMin) / (domain.yMax - domain.yMin)) * (h - t - b)
}

export function axisTicks(tickStart: number, yMax: number, step: number) {
  const ticks: number[] = []
  for (let value = tickStart; value <= yMax + step * 0.001; value += step) {
    ticks.push(Number(value.toPrecision(12)))
  }
  return ticks
}

export function axisLabels(period: Period, cutoff: Date, displayEnd: Date) {
  const { w, l, r } = CHART_SIZE
  const iw = w - l - r
  const labelCount = period.days ? Math.min(period.days, 7) : period.months && period.months <= 3 ? 6 : 7
  return Array.from({ length: labelCount }, (_, index) => {
    const date = new Date(cutoff.getTime() + (displayEnd.getTime() - cutoff.getTime()) * (index / (labelCount - 1)))
    return { date, x: l + (iw * index) / (labelCount - 1) }
  })
}

export function labelText(date: Date, period: Period) {
  if (period.days || (period.months && period.months <= 3)) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period.months) return date.toLocaleDateString('en-US', { month: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', ' ’')
}

export function nextSeriesState(toggling: 'followers' | 'github', followersOn: boolean, githubOn: boolean, githubReady: boolean) {
  const next = {
    followersOn: toggling === 'followers' ? !followersOn : followersOn,
    githubOn: toggling === 'github' ? !githubOn : githubOn,
  }

  if (next.followersOn || next.githubOn) return next
  if (toggling === 'followers' && githubReady) return { followersOn: false, githubOn: true }
  if (toggling === 'github') return { followersOn: true, githubOn: false }
  return { followersOn, githubOn }
}

export function toFollowerSeries(points: Array<{ date: string; followers: number }>): SeriesPoint[] {
  return points
    .map((point) => ({
      date: new Date(`${point.date}T12:00:00`),
      value: point.followers,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function toGithubSeries(points: Array<{ date: string; contributions: number }>): SeriesPoint[] {
  let runningTotal = 0
  return points
    .map((point) => ({
      date: new Date(`${point.date}T12:00:00`),
      contributions: Number(point.contributions),
    }))
    .filter((point) => Number.isFinite(point.contributions))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((point) => {
      runningTotal += point.contributions
      return { ...point, value: runningTotal }
    })
}
