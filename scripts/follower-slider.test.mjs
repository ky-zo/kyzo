import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('../public/follower-counter/index.html', import.meta.url),
  'utf8',
)

test('the follower slider animates one shared progress element', () => {
  assert.match(
    source,
    /<span class="slider-progress"[^>]*>[\s\S]*?<span class="slider-fill"><\/span>[\s\S]*?<span class="slider-thumb"/,
  )

  const updateSliderPosition = source.match(
    /function updateSliderPosition[\s\S]*?(?=\n    function render)/,
  )?.[0]

  assert.ok(updateSliderPosition)
  assert.match(updateSliderPosition, /progressMotion=sliderProgress\.animate/)
  assert.doesNotMatch(
    updateSliderPosition,
    /sliderFill\.animate|sliderThumb\.animate|clipPath|targetTransform/,
  )
})
