import assert from 'node:assert/strict'
import test from 'node:test'

import { cutoffFor, geometryPath, historyFrom, nextSeriesState, niceStep, niceStepDown, PERIODS, toGithubSeries } from '../app/interactive/graphs/chart'

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

test('nice steps stay on 1-2-5 and 1-2-2.5-5 scales', () => {
  assert.equal(niceStep(30), 50)
  assert.equal(niceStepDown(30), 25)
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
