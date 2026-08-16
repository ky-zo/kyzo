import assert from 'node:assert/strict'
import test from 'node:test'

import { parseContributionYear } from '../lib/github/contributions'

function calendarFixture(year: number, firstDayCount = 2) {
  const start = Date.UTC(year, 0, 1)
  const end = Date.UTC(year + 1, 0, 1)
  const days = (end - start) / 86_400_000
  const cells = Array.from({ length: days }, (_, index) => {
    const date = new Date(start + index * 86_400_000).toISOString().slice(0, 10)
    const count = index === 0 ? `${firstDayCount} contributions` : 'No contributions'
    return `<td id="day-${index}" data-date="${date}" class="ContributionCalendar-day"></td><tool-tip for="day-${index}">${count} on ${date}.</tool-tip>`
  }).join('')

  return `<h2 id="js-contribution-activity-description">${firstDayCount} contributions in ${year}</h2>${cells}`
}

test('parses and validates every day in a GitHub contribution year', () => {
  const points = parseContributionYear(calendarFixture(2024), 2024)

  assert.equal(points.length, 366)
  assert.deepEqual(points[0], { date: '2024-01-01', contributions: 2 })
  assert.deepEqual(points.at(-1), { date: '2024-12-31', contributions: 0 })
})

test('rejects an incomplete GitHub contribution year', () => {
  const incomplete = calendarFixture(2025).replace(/<td id="day-364"[\s\S]*?<\/tool-tip>/, '')

  assert.throws(() => parseContributionYear(incomplete, 2025), /incomplete/)
})

test('rejects daily counts that disagree with GitHub’s published total', () => {
  const mismatched = calendarFixture(2025).replace('2 contributions in 2025', '3 contributions in 2025')

  assert.throws(() => parseContributionYear(mismatched, 2025), /published total/)
})
