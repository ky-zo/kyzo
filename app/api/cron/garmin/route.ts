import { NextResponse } from "next/server";

import { GarminClient } from "@/lib/garmin/client";
import { fetchGarminDay, fetchVo2MaxSeries } from "@/lib/garmin/metrics";
import { mergeDays, mergeVo2Max, readHistory, readSession, readVo2MaxSeries, writeHistory, writeSession, writeVo2MaxSeries } from "@/lib/garmin/store";

/**
 * Daily Garmin sync, triggered by the cron in vercel.json.
 *
 * Re-pulls the last few days rather than just yesterday: the watch syncs late,
 * sleep gets re-scored, and a weight-in lands whenever it lands. Re-fetching is
 * cheap and makes the history self-healing.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_BACKFILL_DAYS = 3;
const MAX_BACKFILL_DAYS = 30;

/** Calendar dates the way the watch records them, not the way UTC sees them. */
function recentDates(count: number, timeZone: string): string[] {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dates: string[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    dates.push(formatter.format(new Date(Date.now() - offset * 86_400_000)));
  }
  return dates;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "No stored Garmin session — run `pnpm garmin:login` to mint one" }, { status: 412 });
  }

  const requested = Number(new URL(request.url).searchParams.get("days"));
  const backfill = Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_BACKFILL_DAYS) : DEFAULT_BACKFILL_DAYS;
  const dates = recentDates(backfill, process.env.GARMIN_TIMEZONE || "UTC");

  const client = new GarminClient(session);

  try {
    const days = [];
    for (const date of dates) {
      days.push(await fetchGarminDay(client, date));
    }

    await writeHistory(mergeDays(await readHistory(), days));

    // VO2max only moves after a qualifying activity, and its own endpoint
    // carries the history, so refresh the trailing year alongside the days.
    const yearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
    const series = await fetchVo2MaxSeries(client, yearAgo, dates[dates.length - 1]);
    if (series.length) await writeVo2MaxSeries(mergeVo2Max(await readVo2MaxSeries(), series));

    // Persist after the pull so a rotated access token survives to the next run.
    if (client.refreshed) await writeSession(client.getSession());

    return NextResponse.json({
      ok: true,
      dates,
      errors: days.flatMap((day) => day.errors.map((error) => `${day.date} ${error}`)),
    });
  } catch (error) {
    // A refresh can succeed even when a later call fails; don't waste the new token.
    if (client.refreshed) await writeSession(client.getSession()).catch(() => {});
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
