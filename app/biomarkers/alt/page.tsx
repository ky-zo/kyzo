import { Metadata } from "next";

import { readings } from "@/content/biomarkers";
import { weeklyVolume, type WeeklyVolume } from "@/lib/garmin/activities";
import { deriveBiomarkerReadings, mergeReadings } from "@/lib/garmin/biomarkers";
import { readActivities, readHistory, readVo2MaxSeries } from "@/lib/garmin/store";

import BiomarkersList from "../biomarkers-list";
import TrainingGraph from "./training-graph";

export const metadata: Metadata = {
	title: "health data (alt) - kyzo",
	description: "local experiment: training volume in the /interactive/graphs style",
	robots: { index: false, follow: false },
};

export const revalidate = 3600;

/**
 * Local-only variant of /biomarkers with the training section redrawn in the
 * follower-graph style. Data loading mirrors the real page; when Garmin isn't
 * reachable (no storage creds locally) it falls back to sample weeks so the
 * preview always renders.
 */
async function getLiveReadings() {
	try {
		const [history, vo2max] = await Promise.all([readHistory({ revalidate }), readVo2MaxSeries({ revalidate })]);
		return mergeReadings(readings, deriveBiomarkerReadings(history, vo2max));
	} catch (error) {
		console.error("Garmin readings unavailable, falling back to static:", error);
		return readings;
	}
}

/** Eight plausible weeks ending in an in-progress one, for offline preview. */
function sampleWeeks(): WeeklyVolume[] {
	const gym = [2, 3, 2, 4, 3, 2, 3, 1];
	const run = [32, 28, 41, 36, 22, 38, 26, 8.5];
	const now = new Date();
	const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
	return gym.map((sessions, index) => {
		const start = new Date(monday.getTime() - (gym.length - 1 - index) * 7 * 86_400_000);
		return {
			weekStart: start.toISOString().slice(0, 10),
			gymSessions: sessions,
			runKm: run[index],
			partial: index === gym.length - 1,
		};
	});
}

async function getWeeklyVolume(): Promise<{ weeks: WeeklyVolume[]; sample: boolean }> {
	try {
		const timeZone = process.env.GARMIN_TIMEZONE || "UTC";
		const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
		const now = new Date(`${today}T00:00:00Z`);
		const activities = await readActivities({ revalidate });
		const weeks = weeklyVolume(activities, 8, now, { includeCurrent: true });
		// Same rule as the real page: an untouched week isn't rendered.
		const current = weeks[weeks.length - 1];
		const trimmed =
			current?.partial && current.gymSessions === 0 && current.runKm === 0 ? weeklyVolume(activities, 8, now) : weeks;
		// Empty storage (typical locally) would draw a flat zero line — show the shape instead.
		if (trimmed.every((week) => week.gymSessions === 0 && week.runKm === 0)) return { weeks: sampleWeeks(), sample: true };
		return { weeks: trimmed, sample: false };
	} catch {
		return { weeks: sampleWeeks(), sample: true };
	}
}

export default async function BiomarkersAltPage() {
	const [liveReadings, { weeks, sample }] = await Promise.all([getLiveReadings(), getWeeklyVolume()]);

	return (
		<div className="flex w-full max-w-md flex-col pb-10">
			<BiomarkersList readings={liveReadings} afterPerformance={<TrainingGraph weeks={weeks} sample={sample} />} />
		</div>
	);
}
