import { GarminClient } from "./client";

/**
 * Pulls one day of wellness data and flattens it into a shape that's stable
 * regardless of what Garmin renames next.
 *
 * Every endpoint is fetched independently and allowed to fail: Garmin's
 * internal API drifts, and a broken VO2max path shouldn't cost us the night's
 * sleep and HRV. Missing sections come back as null.
 */

export type GarminDay = {
  date: string;
  /** When this record was pulled, for debugging drift. */
  syncedAt: string;
  hrv: {
    lastNightAvg: number | null;
    lastNight5MinHigh: number | null;
    weeklyAvg: number | null;
    status: string | null;
    baselineLow: number | null;
    baselineHigh: number | null;
  } | null;
  sleep: {
    score: number | null;
    qualifier: string | null;
    durationSeconds: number | null;
    deepSeconds: number | null;
    lightSeconds: number | null;
    remSeconds: number | null;
    awakeSeconds: number | null;
    restingHeartRate: number | null;
    avgSpo2: number | null;
    avgRespiration: number | null;
    avgStress: number | null;
  } | null;
  daily: {
    steps: number | null;
    restingHeartRate: number | null;
    minHeartRate: number | null;
    maxHeartRate: number | null;
    avgStress: number | null;
    maxStress: number | null;
    bodyBatteryHigh: number | null;
    bodyBatteryLow: number | null;
    calories: number | null;
    activeCalories: number | null;
    floors: number | null;
    intensityMinutes: number | null;
    avgRespiration: number | null;
  } | null;
  readiness: {
    score: number | null;
    level: string | null;
    feedback: string | null;
    recoveryTimeHours: number | null;
  } | null;
  training: {
    vo2max: number | null;
    vo2maxCycling: number | null;
    fitnessAge: number | null;
    acuteLoad: number | null;
    status: string | null;
  } | null;
  body: {
    weightKg: number | null;
    bodyFatPct: number | null;
    bodyWaterPct: number | null;
    muscleMassKg: number | null;
    visceralFat: number | null;
  } | null;
  /** Endpoints that errored on this run, so a silent gap is never mistaken for "no data". */
  errors: string[];
};

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const str = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

/** Garmin reports weight in grams. */
const gramsToKg = (value: unknown): number | null => {
  const grams = num(value);
  return grams === null ? null : Math.round(grams / 10) / 100;
};

type Section = keyof Omit<GarminDay, "date" | "syncedAt" | "errors">;

export async function fetchGarminDay(client: GarminClient, date: string): Promise<GarminDay> {
  const errors: string[] = [];

  /** Runs one endpoint, recording rather than throwing on failure. */
  async function section<T>(name: Section, fetcher: () => Promise<T | null>): Promise<T | null> {
    try {
      return await fetcher();
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  const [hrv, sleep, daily, readiness, training, body] = await Promise.all([
    section("hrv", () => fetchHrv(client, date)),
    section("sleep", () => fetchSleep(client, date)),
    section("daily", () => fetchDailySummary(client, date)),
    section("readiness", () => fetchReadiness(client, date)),
    section("training", () => fetchTraining(client, date)),
    section("body", () => fetchBody(client, date)),
  ]);

  return { date, syncedAt: new Date().toISOString(), hrv, sleep, daily, readiness, training, body, errors };
}

async function fetchHrv(client: GarminClient, date: string): Promise<GarminDay["hrv"]> {
  const data = await client.get<{ hrvSummary?: Record<string, unknown> }>(`/hrv-service/hrv/${date}`);
  const summary = data?.hrvSummary;
  if (!summary) return null;

  const baseline = (summary.baseline ?? {}) as Record<string, unknown>;
  return {
    lastNightAvg: num(summary.lastNightAvg),
    lastNight5MinHigh: num(summary.lastNight5MinHigh),
    weeklyAvg: num(summary.weeklyAvg),
    status: str(summary.status),
    baselineLow: num(baseline.balancedLow ?? baseline.lowUpper),
    baselineHigh: num(baseline.balancedUpper),
  };
}

async function fetchSleep(client: GarminClient, date: string): Promise<GarminDay["sleep"]> {
  const data = await client.get<{ dailySleepDTO?: Record<string, unknown> }>(`/sleep-service/sleep/dailySleepData?date=${date}`);
  const dto = data?.dailySleepDTO;
  if (!dto) return null;

  const scores = (dto.sleepScores ?? {}) as Record<string, unknown>;
  const overall = (scores.overall ?? {}) as Record<string, unknown>;

  return {
    score: num(overall.value),
    qualifier: str(overall.qualifierKey),
    durationSeconds: num(dto.sleepTimeSeconds),
    deepSeconds: num(dto.deepSleepSeconds),
    lightSeconds: num(dto.lightSleepSeconds),
    remSeconds: num(dto.remSleepSeconds),
    awakeSeconds: num(dto.awakeSleepSeconds),
    restingHeartRate: num(dto.restingHeartRate),
    avgSpo2: num(dto.averageSpO2Value),
    avgRespiration: num(dto.averageRespirationValue),
    avgStress: num(dto.avgSleepStress),
  };
}

async function fetchDailySummary(client: GarminClient, date: string): Promise<GarminDay["daily"]> {
  const data = await client.get<Record<string, unknown>>(`/usersummary-service/usersummary/daily/?calendarDate=${date}`);
  if (!data) return null;

  const moderate = num(data.moderateIntensityMinutes) ?? 0;
  const vigorous = num(data.vigorousIntensityMinutes) ?? 0;

  return {
    steps: num(data.totalSteps),
    restingHeartRate: num(data.restingHeartRate),
    minHeartRate: num(data.minHeartRate),
    maxHeartRate: num(data.maxHeartRate),
    avgStress: num(data.averageStressLevel),
    maxStress: num(data.maxStressLevel),
    bodyBatteryHigh: num(data.bodyBatteryHighestValue),
    bodyBatteryLow: num(data.bodyBatteryLowestValue),
    calories: num(data.totalKilocalories),
    activeCalories: num(data.activeKilocalories),
    floors: num(data.floorsAscended),
    // Garmin double-counts vigorous minutes; this is the number the watch shows.
    intensityMinutes: moderate + vigorous * 2,
    avgRespiration: num(data.avgWakingRespirationValue),
  };
}

async function fetchReadiness(client: GarminClient, date: string): Promise<GarminDay["readiness"]> {
  const data = await client.get<Record<string, unknown>[]>(`/metrics-service/metrics/trainingreadiness/${date}`);
  const latest = Array.isArray(data) ? data[0] : null;
  if (!latest) return null;

  const recoveryMinutes = num(latest.recoveryTime);
  return {
    score: num(latest.score),
    level: str(latest.level),
    feedback: str(latest.feedbackShort),
    recoveryTimeHours: recoveryMinutes === null ? null : Math.round((recoveryMinutes / 60) * 10) / 10,
  };
}

/** The mobile gateway fans out to several services and wraps each in an envelope. */
function payloadOf(section: unknown): Record<string, unknown> {
  const envelope = (section ?? {}) as Record<string, unknown>;
  return (envelope.payload ?? {}) as Record<string, unknown>;
}

async function fetchTraining(client: GarminClient, date: string): Promise<GarminDay["training"]> {
  const data = await client.get<Record<string, unknown>>(`/mobile-gateway/usersummary/trainingstatus/latest/${date}`);
  if (!data) return null;

  // "Most recent", not necessarily measured on `date` — VO2max updates only
  // after a qualifying activity, so it can trail by days. That's Garmin's own
  // semantics and the number the watch shows.
  const vo2 = payloadOf(data.mostRecentVO2Max);
  const generic = (vo2.generic ?? {}) as Record<string, unknown>;
  const cycling = (vo2.cycling ?? {}) as Record<string, unknown>;

  // Training status is keyed by device id; prefer the primary watch.
  const byDevice = (payloadOf(data.mostRecentTrainingStatus).latestTrainingStatusData ?? {}) as Record<string, Record<string, unknown>>;
  const devices = Object.values(byDevice);
  const device = devices.find((entry) => entry.primaryTrainingDevice) ?? devices[0] ?? {};
  const acute = (device.acuteTrainingLoadDTO ?? {}) as Record<string, unknown>;

  return {
    vo2max: num(generic.vo2MaxPreciseValue) ?? num(generic.vo2MaxValue),
    vo2maxCycling: num(cycling.vo2MaxPreciseValue) ?? num(cycling.vo2MaxValue),
    fitnessAge: num(generic.fitnessAge),
    acuteLoad: num(acute.dailyTrainingLoadAcute),
    status: str(device.trainingStatusFeedbackPhrase),
  };
}

async function fetchBody(client: GarminClient, date: string): Promise<GarminDay["body"]> {
  const data = await client.get<{ totalAverage?: Record<string, unknown> }>(`/weight-service/weight/dayview/${date}`);
  const average = data?.totalAverage;
  if (!average) return null;

  const weightKg = gramsToKg(average.weight);
  // A dayview with no measurement still returns an empty average object.
  if (weightKg === null) return null;

  return {
    weightKg,
    bodyFatPct: num(average.bodyFat),
    bodyWaterPct: num(average.bodyWater),
    muscleMassKg: gramsToKg(average.muscleMass),
    visceralFat: num(average.visceralFat),
  };
}
