import { Metadata } from "next";

import { readings } from "@/content/biomarkers";
import { deriveBiomarkerReadings, mergeReadings } from "@/lib/garmin/biomarkers";
import { readHistory, readVo2MaxSeries } from "@/lib/garmin/store";

import BiomarkersList from "./biomarkers-list";

export const metadata: Metadata = {
	title: "biomarkers - kyzo",
	description: "open-source bloodwork and health biomarkers",
	alternates: {
		canonical: "https://kyzo.io/biomarkers",
	},
};

/** The Garmin sync runs daily; hourly revalidation keeps R2 reads negligible. */
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

export default async function BiomarkersPage() {
	return (
		<div className="flex w-full max-w-md flex-col pb-10">
			<BiomarkersList readings={await getLiveReadings()} />
		</div>
	);
}
