import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../app/interactive/graphs/graphs.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../app/interactive/graphs/graphs.module.css', import.meta.url), 'utf8')

test('the follower slider animates one shared progress element', () => {
  assert.match(css, /\.sliderProgress[\s\S]*?\.sliderFill[\s\S]*?\.sliderThumb/)

  const updateSliderPosition = source.match(/function updateSliderPosition[\s\S]*?(?=\n  function drawIn)/)?.[0]

  assert.ok(updateSliderPosition)
  assert.match(updateSliderPosition, /progress\.animate/)
  assert.doesNotMatch(updateSliderPosition, /sliderFill\.animate|sliderThumb\.animate|clipPath|targetTransform/)
})

test('followers and cumulative GitHub contributions share one chart', () => {
  assert.match(source, /toggleSeries\('followers'\)/)
  assert.match(source, /toggleSeries\('github'\)/)
  assert.match(source, /followersLine/)
  assert.match(source, /githubLine/)
  assert.match(source, /toGithubSeries/)
  assert.doesNotMatch(source, /githubChart|contribution-bar/)
})
