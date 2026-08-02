import { Metadata } from "next";

import { readings } from "@/content/biomarkers";
import { deriveBiomarkerReadings, mergeReadings } from "@/lib/garmin/biomarkers";
import { weeklyVolume } from "@/lib/garmin/activities";
import { readActivities, readHistory, readVo2MaxSeries } from "@/lib/garmin/store";

import BiomarkersList from "./biomarkers-list";
import TrainingCharts from "./training-charts";

export const metadata: Metadata = {
	title: "health data - kyzo",
	description: "open-source bloodwork and health biomarkers",
	alternates: {
		canonical: "https://kyzo.io/biomarkers",
	},
};

/**
 * The Garmin sync and this page both run on the hour, so a workout surfaces
 * within roughly two hours of the watch uploading it. Storage reads are cheap;
 * matching the cron's cadence costs nothing and keeps the two in step.
 */
export const revalidate = 3600;

/**
 * Blends the hand-entered readings with whatever Garmin has synced.
 *
 * A storage problem must never take the page down — an unreachable bucket or a
 * revoked token degrades to the static readings, which is exactly what the page
 * showed before any of this existed.
 */
async function getLiveReadings() {
	try {
		const [history, vo2max] = await Promise.all([
			readHistory({ revalidate }),
			readVo2MaxSeries({ revalidate }),
		]);
		return mergeReadings(readings, deriveBiomarkerReadings(history, vo2max));
	} catch (error) {
		console.error("Garmin readings unavailable, falling back to static:", error);
		return readings;
	}
}

/** Training volume is decorative next to the markers — absent beats broken. */
async function getWeeklyVolume() {
	try {
		// The week in progress is included but marked partial, so the chart can
		// draw it as unfinished rather than as a collapse.
		return weeklyVolume(await readActivities({ revalidate }), 6, new Date(), { includeCurrent: true });
	} catch (error) {
		console.error("Garmin activities unavailable:", error);
		return [];
	}
}

export default async function BiomarkersPage() {
	const [liveReadings, weeks] = await Promise.all([getLiveReadings(), getWeeklyVolume()]);

	return (
		<div className="flex w-full max-w-md flex-col pb-10">
			<BiomarkersList readings={liveReadings} afterPerformance={<TrainingCharts weeks={weeks} />} />
		</div>
	);
}
