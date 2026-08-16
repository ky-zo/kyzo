import assert from 'node:assert/strict'
import test from 'node:test'

import {
  KILOGRAM_VALUES,
  kilogramsToPounds,
  POUND_VALUES,
  poundsToKilograms,
  stepVisualIndex,
  valueToVisualIndex,
  visualIndexToStopIndex,
} from '../app/random/weight-converter/conversion'

test('uses the requested native stops for pounds and kilograms', () => {
  assert.deepEqual(POUND_VALUES, [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100])
  assert.deepEqual(KILOGRAM_VALUES.slice(0, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(KILOGRAM_VALUES.slice(10, 26), [12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50])
  assert.deepEqual(KILOGRAM_VALUES.slice(26), [55, 60, 65, 70, 75, 80, 85, 90, 95, 100])
})

test('converts exactly from either source unit', () => {
  assert.ok(Math.abs(poundsToKilograms(100) - 45.359237001) < 1e-9)
  assert.equal(kilogramsToPounds(100), 220.46226218)
})

test('places a converted value between the linked unit’s native stops', () => {
  const kilograms = poundsToKilograms(20)
  const visualIndex = valueToVisualIndex(kilograms, KILOGRAM_VALUES)

  assert.ok(visualIndex > 8)
  assert.ok(visualIndex < 9)
  assert.equal(valueToVisualIndex(kilogramsToPounds(100), POUND_VALUES), POUND_VALUES.length - 1)
})

test('snaps a dragged visual position to the nearest native stop', () => {
  assert.equal(visualIndexToStopIndex(8.49, KILOGRAM_VALUES), 8)
  assert.equal(visualIndexToStopIndex(8.5, KILOGRAM_VALUES), 9)
  assert.equal(visualIndexToStopIndex(-2, POUND_VALUES), 0)
  assert.equal(visualIndexToStopIndex(100, POUND_VALUES), POUND_VALUES.length - 1)
})

test('keyboard movement chooses the adjacent native stop', () => {
  assert.equal(stepVisualIndex(8.07, 1, KILOGRAM_VALUES.length), 9)
  assert.equal(stepVisualIndex(8.07, -1, KILOGRAM_VALUES.length), 8)
  assert.equal(stepVisualIndex(7, 1, POUND_VALUES.length), 8)
  assert.equal(stepVisualIndex(7, -1, POUND_VALUES.length), 6)
})
