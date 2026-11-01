import assert from 'node:assert/strict'
import test from 'node:test'

import {
  axisTicks,
  cutoffFor,
  geometryPath,
  historyFrom,
  nextSeriesState,
  niceStepDown,
  PERIODS,
  toGithubSeries,
  yDomain,
} from '../app/interactive/graphs/chart'

test('unchecking the last series selects the other one', () => {
  assert.deepEqual(nextSeriesState('followers', true, false, true), { followersOn: false, githubOn: true })
  assert.deepEqual(nextSeriesState('github', false, true, true), { followersOn: true, githubOn: false })
  assert.deepEqual(nextSeriesState('followers', true, true, true), { followersOn: false, githubOn: true })
  assert.deepEqual(nextSeriesState('followers', true, false, false), { followersOn: true, githubOn: false })
})

test('historyFrom interpolates a boundary point when the cutoff sits between samples', () => {
  const points = [
    { date: new Date('2024-01-01T12:00:00'), value: 100 },
    { date: new Date('2024-01-03T12:00:00'), value: 200 },
  ]
  const sliced = historyFrom(points, new Date('2024-01-02T12:00:00'))

  assert.equal(sliced.length, 2)
  assert.equal(sliced[0].value, 150)
  assert.equal(sliced[1].value, 200)
})

test('tick spacing rounds down to the 1-2-2.5-5 scale', () => {
  assert.equal(niceStepDown(30), 25)
})

test('long ranges keep the latest follower count near the top of the chart', () => {
  const points = [
    { date: new Date('2023-04-01T12:00:00'), value: 0 },
    { date: new Date('2023-11-01T12:00:00'), value: 219 },
    { date: new Date('2024-11-01T12:00:00'), value: 9767 },
    { date: new Date('2026-11-01T12:00:00'), value: 19992 },
  ]
  const latest = points.at(-1)!

  for (const period of PERIODS.filter((period) => period.years || period.all)) {
    const values = historyFrom(points, cutoffFor(period, latest.date)).map((point) => point.value)
    const scale = yDomain(values)
    const headroom = (scale.yMax - latest.value) / (scale.yMax - scale.yMin)

    assert.ok(headroom > 0 && headroom < 0.15, `${period.short} should leave modest headroom`)
    assert.ok(axisTicks(scale.tickStart, scale.yMax, scale.step).includes(20000))
  }
})

test('crossing 20k does not jump the chart ceiling to the next tick', () => {
  for (const start of [0, 219, 9767, 19700]) {
    const before = yDomain([start, 19999])
    const after = yDomain([start, 20001])

    assert.ok(after.yMax >= 20001)
    assert.ok(after.yMax - before.yMax < 10, `history starting at ${start} should scale smoothly across 20k`)
  }
})

test('flat and zero series still have a usable scale with visible ticks', () => {
  for (const values of [[0], [0, 1], [20000, 20000]]) {
    const scale = yDomain(values)
    const ticks = axisTicks(scale.tickStart, scale.yMax, scale.step)

    assert.ok(scale.yMin >= 0 && scale.yMin <= Math.min(...values))
    assert.ok(scale.yMax > Math.max(...values))
    assert.ok(ticks.length >= 2 && ticks.length <= 8)
    assert.ok(ticks.every((tick) => tick >= scale.yMin && tick <= scale.yMax))
  }
})

test('geometryPath draws a move for one point and a curve for two', () => {
  assert.equal(geometryPath([{ x: 1, y: 2 }]), 'M1.0,2.0')
  assert.match(
    geometryPath([
      { x: 0, y: 10 },
      { x: 20, y: 0 },
    ]),
    /^M0\.0,10\.0 C/,
  )
})

test('cutoffFor all starts at April 2023', () => {
  const cutoff = cutoffFor(PERIODS[PERIODS.length - 1], new Date('2026-08-17T12:00:00'))
  assert.equal(cutoff.getFullYear(), 2023)
  assert.equal(cutoff.getMonth(), 3)
  assert.equal(cutoff.getDate(), 1)
})

test('GitHub series accumulates daily contributions', () => {
  const series = toGithubSeries([
    { date: '2024-01-02', contributions: 3 },
    { date: '2024-01-01', contributions: 2 },
  ])

  assert.deepEqual(
    series.map((point) => point.value),
    [2, 5],
  )
})
