import type { GarminClient } from "./client";

/**
 * Activity history, reduced to weekly training volume.
 *
 * The daily wellness endpoints describe what the body did passively; this is
 * what was trained on purpose. Only two questions are being answered — how
 * often the gym happened, and how far the running went — so activities are
 * stored lean and aggregated into weeks for display.
 */

export type GarminActivity = {
  id: number;
  type: string;
  name: string;
  /** Local start date, YYYY-MM-DD — weeks should follow the athlete, not UTC. */
  date: string;
  distanceKm: number;
  durationMin: number;
};

export type WeeklyVolume = {
  /** Monday of the week, YYYY-MM-DD */
  weekStart: string;
  gymSessions: number;
  runKm: number;
  /** True for the week still in progress, whose totals are not yet comparable. */
  partial: boolean;
};

/** Garmin type keys that count as a gym session. */
const GYM_TYPES = new Set(["strength_training", "fitness_equipment", "indoor_cardio"]);

/** Garmin type keys that count toward running distance. */
const RUN_TYPES = new Set(["running", "trail_running", "treadmill_running", "indoor_running", "track_running"]);

export async function fetchActivities(client: GarminClient, limit = 100): Promise<GarminActivity[]> {
  const data = await client.get<Record<string, unknown>[]>(`/activitylist-service/activities/search/activities?start=0&limit=${limit}`);
  if (!Array.isArray(data)) return [];

  const activities: GarminActivity[] = [];
  for (const entry of data) {
    const startLocal = typeof entry.startTimeLocal === "string" ? entry.startTimeLocal : null;
    const id = typeof entry.activityId === "number" ? entry.activityId : null;
    if (!startLocal || id === null) continue;

    const type = (entry.activityType as { typeKey?: string } | undefined)?.typeKey ?? "unknown";
    const distance = typeof entry.distance === "number" ? entry.distance : 0;
    const duration = typeof entry.duration === "number" ? entry.duration : 0;

    activities.push({
      id,
      type,
      name: typeof entry.activityName === "string" ? entry.activityName : "",
      date: startLocal.slice(0, 10),
      distanceKm: Math.round((distance / 1000) * 100) / 100,
      durationMin: Math.round(duration / 60),
    });
  }

  return activities.sort((a, b) => a.date.localeCompare(b.date));
}

/** Merges freshly pulled activities over the stored set, oldest first. */
export function mergeActivities(existing: GarminActivity[], incoming: GarminActivity[]): GarminActivity[] {
  const byId = new Map(existing.map((activity) => [activity.id, activity]));
  for (const activity of incoming) byId.set(activity.id, activity);
  return Array.from(byId.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Monday of the week containing `date`, as YYYY-MM-DD. */
function weekStart(date: Date): string {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (copy.getUTCDay() + 6) % 7; // Monday = 0
  copy.setUTCDate(copy.getUTCDate() - weekday);
  return copy.toISOString().slice(0, 10);
}

/**
 * Training volume for the last `weeks` weeks, oldest first.
 *
 * Weeks with no activity are emitted as zeroes rather than skipped — a blank
 * week is a real signal, and dropping it would silently compress the axis.
 */
export function weeklyVolume(activities: GarminActivity[], weeks = 6, now = new Date()): WeeklyVolume[] {
  const currentWeek = weekStart(now);

  const buckets = new Map<string, WeeklyVolume>();
  for (let index = weeks - 1; index >= 0; index--) {
    const start = weekStart(new Date(now.getTime() - index * 7 * 86_400_000));
    buckets.set(start, { weekStart: start, gymSessions: 0, runKm: 0, partial: start === currentWeek });
  }

  for (const activity of activities) {
    const start = weekStart(new Date(`${activity.date}T00:00:00Z`));
    const bucket = buckets.get(start);
    if (!bucket) continue;

    if (GYM_TYPES.has(activity.type)) bucket.gymSessions += 1;
    if (RUN_TYPES.has(activity.type)) bucket.runKm += activity.distanceKm;
  }

  return Array.from(buckets.values()).map((week) => ({ ...week, runKm: Math.round(week.runKm * 10) / 10 }));
}
