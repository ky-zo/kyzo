import type { Reading } from "@/content/biomarkers";

import type { GarminDay, Vo2MaxPoint } from "./metrics";

/**
 * Projects the daily Garmin history onto the biomarker model.
 *
 * Two things are being reconciled here. Biomarkers are sparse point-in-time
 * measurements — a blood panel, a DEXA scan. Garmin produces a dense daily
 * series. Publishing 365 HRV points a year would drown the list and turn a
 * health page into a sleep log.
 *
 * So noisy daily metrics are collapsed to a weekly median: enough resolution
 * to show a trend, coarse enough that it isn't a record of individual nights.
 * Body composition passes through untouched, since those are already discrete
 * measurements taken whenever you step on the scale.
 */

/** Weekly median — resistant to the one bad night that a mean would smear. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const round = (value: number, places = 1): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

/** ISO week start (Monday) for a YYYY-MM-DD date, as a YYYY-MM-DD string. */
function weekStart(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  const weekday = (parsed.getUTCDay() + 6) % 7; // Monday = 0
  parsed.setUTCDate(parsed.getUTCDate() - weekday);
  return parsed.toISOString().slice(0, 10);
}

type Selector = (day: GarminDay) => number | null | undefined;

/** One reading per week, at the median of that week's values. */
function weeklyMedian(days: GarminDay[], select: Selector, places = 1): Reading[] {
  const buckets = new Map<string, number[]>();

  for (const day of days) {
    const value = select(day);
    if (typeof value !== "number") continue;
    const week = weekStart(day.date);
    buckets.set(week, [...(buckets.get(week) ?? []), value]);
  }

  return Array.from(buckets, ([date, values]) => ({ date, value: round(median(values), places) })).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/** Readings straight off the dated VO2max series. */
function fromSeries(series: Vo2MaxPoint[], select: (point: Vo2MaxPoint) => number | null, places = 1): Reading[] {
  const byDate = new Map<string, number>();

  for (const point of series) {
    const value = select(point);
    if (typeof value !== "number") continue;
    byDate.set(point.date, round(value, places));
  }

  return Array.from(byDate, ([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

/** Every day that actually carries a measurement. */
function perMeasurement(days: GarminDay[], select: Selector, places = 1): Reading[] {
  const out: Reading[] = [];

  for (const day of days) {
    const value = select(day);
    if (typeof value !== "number") continue;
    out.push({ date: day.date, value: round(value, places) });
  }

  return out;
}

/**
 * Biomarker codes derivable from Garmin, and how each is condensed.
 *
 * Deliberately omitted: body_water. Garmin reports it as a percentage while
 * the biomarker is in kg, and converting via same-day weight would publish a
 * derived number dressed up as a measurement.
 */
export function deriveBiomarkerReadings(days: GarminDay[], vo2maxSeries: Vo2MaxPoint[] = []): Record<string, Reading[]> {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  const derived: Record<string, Reading[]> = {
    // Noisy nightly signals — weekly median.
    hrv: weeklyMedian(sorted, (day) => day.hrv?.lastNightAvg, 0),
    rhr: weeklyMedian(sorted, (day) => day.daily?.restingHeartRate ?? day.sleep?.restingHeartRate, 0),

    // VO2max comes from the endpoint that reports real history — the per-day
    // one repeats today's value for every date queried.
    vo2max: fromSeries(vo2maxSeries, (point) => point.vo2max),

    // Fitness age does answer per date, and drifts continuously because it's
    // computed from rolling averages, so it gets the same weekly smoothing.
    fitness_age: weeklyMedian(sorted, (day) => day.fitness?.age),

    // Scale measurements — already discrete events.
    weight: perMeasurement(sorted, (day) => day.body?.weightKg),
    body_fat_pct: perMeasurement(sorted, (day) => day.body?.bodyFatPct),
    muscle_mass: perMeasurement(sorted, (day) => day.body?.muscleMassKg),
    visceral_fat: perMeasurement(sorted, (day) => day.body?.visceralFat),
  };

  // Drop codes with nothing to say rather than emit empty series.
  return Object.fromEntries(Object.entries(derived).filter(([, values]) => values.length > 0));
}

/**
 * Overlays derived readings on the hand-entered ones.
 *
 * Same-date collisions resolve to the manual reading: a lab panel or a DEXA
 * scan is a better measurement than a wrist optical sensor, and those are the
 * dates where both exist.
 */
export function mergeReadings(
  manual: Record<string, Reading[]>,
  derived: Record<string, Reading[]>,
): Record<string, Reading[]> {
  const merged: Record<string, Reading[]> = { ...manual };

  for (const [code, values] of Object.entries(derived)) {
    const byDate = new Map<string, Reading>();
    for (const reading of values) byDate.set(reading.date, reading);
    for (const reading of manual[code] ?? []) byDate.set(reading.date, reading);

    merged[code] = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  return merged;
}
