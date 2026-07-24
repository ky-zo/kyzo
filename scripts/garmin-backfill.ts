import { GarminClient } from "../lib/garmin/client";
import { fetchActivities, mergeActivities } from "../lib/garmin/activities";
import { fetchGarminDay, fetchVo2MaxSeries } from "../lib/garmin/metrics";
import {
  mergeDays,
  mergeVo2Max,
  readActivities,
  readHistory,
  readSession,
  readVo2MaxSeries,
  writeActivities,
  writeHistory,
  writeSession,
  writeVo2MaxSeries,
} from "../lib/garmin/store";

/**
 * Backfills historical days into the stored history.
 *
 * The cron deliberately caps its window so a run always fits inside the
 * function timeout. Seeding a year of history is a one-off that doesn't belong
 * on that clock, so it runs here instead.
 *
 *   pnpm garmin:backfill 90
 */

/** Garmin rate-limits aggressive clients; a few at a time is plenty. */
const CONCURRENCY = 3;

async function main() {
  const days = Number(process.argv[2] ?? 30);
  if (!Number.isFinite(days) || days < 1) throw new Error(`Expected a day count, got "${process.argv[2]}"`);

  const session = await readSession();
  if (!session) throw new Error("No stored session — run `pnpm garmin:login` first");

  const client = new GarminClient(session);
  const timeZone = process.env.GARMIN_TIMEZONE || "UTC";
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });

  const dates = Array.from({ length: days }, (_, offset) => formatter.format(new Date(Date.now() - offset * 86_400_000))).reverse();

  console.log(`Backfilling ${dates[0]} → ${dates[dates.length - 1]} (${days} days)…`);

  const results = [];
  for (let index = 0; index < dates.length; index += CONCURRENCY) {
    const batch = dates.slice(index, index + CONCURRENCY);
    results.push(...(await Promise.all(batch.map((date) => fetchGarminDay(client, date)))));
    process.stdout.write(`\r  ${Math.min(index + CONCURRENCY, dates.length)}/${dates.length}`);
  }
  console.log();

  await writeHistory(mergeDays(await readHistory(), results));

  // Always ask for a full year of VO2max regardless of the day window — it's a
  // single monthly-resolution request, so there's no reason to ask for less.
  const seriesStart = formatter.format(new Date(Date.now() - 365 * 86_400_000));
  const series = await fetchVo2MaxSeries(client, seriesStart, dates[dates.length - 1]);
  if (series.length) await writeVo2MaxSeries(mergeVo2Max(await readVo2MaxSeries(), series));
  console.log(`VO2max series: ${series.length} monthly points.`);

  const activities = await fetchActivities(client, 200);
  if (activities.length) await writeActivities(mergeActivities(await readActivities(), activities));
  console.log(`Activities: ${activities.length} pulled.`);
  if (client.refreshed) await writeSession(client.getSession());

  const withSleep = results.filter((day) => day.sleep).length;
  const withHrv = results.filter((day) => day.hrv).length;
  const failures = results.flatMap((day) => day.errors);

  console.log(`\nStored ${results.length} days — ${withSleep} with sleep, ${withHrv} with HRV.`);
  if (failures.length) console.log(`${failures.length} endpoint errors (first few):`, failures.slice(0, 5));
}

main().catch((error) => {
  console.error(`\nBackfill failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
