export const POUNDS_PER_KILOGRAM = 2.2046226218

export const POUND_VALUES = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100]

export const KILOGRAM_VALUES = [
  ...Array.from({ length: 10 }, (_, index) => index + 1),
  ...Array.from({ length: 16 }, (_, index) => 12.5 + index * 2.5),
  ...Array.from({ length: 10 }, (_, index) => 55 + index * 5),
]

export function poundsToKilograms(pounds: number) {
  return pounds / POUNDS_PER_KILOGRAM
}

export function kilogramsToPounds(kilograms: number) {
  return kilograms * POUNDS_PER_KILOGRAM
}

export function valueToVisualIndex(value: number, stops: readonly number[]) {
  if (value <= stops[0]) return 0
  if (value >= stops[stops.length - 1]) return stops.length - 1

  const upperIndex = stops.findIndex((stop) => stop >= value)
  const lowerIndex = upperIndex - 1
  const lower = stops[lowerIndex]
  const upper = stops[upperIndex]

  return lowerIndex + (value - lower) / (upper - lower)
}

export function visualIndexToStopIndex(index: number, stops: readonly number[]) {
  return Math.min(stops.length - 1, Math.max(0, Math.round(index)))
}

export function stepVisualIndex(index: number, direction: -1 | 1, stopCount: number) {
  const target = Number.isInteger(index) ? index + direction : direction > 0 ? Math.ceil(index) : Math.floor(index)

  return Math.min(stopCount - 1, Math.max(0, target))
}
