import { Metadata } from "next";

import BiomarkersList from "./biomarkers-list";

export const metadata: Metadata = {
	title: "biomarkers - kyzo",
	description: "open-source bloodwork and health biomarkers",
	alternates: {
		canonical: "https://kyzo.io/biomarkers",
	},
};

export default function BiomarkersPage() {
	return (
		<div className="flex w-full max-w-md flex-col pb-10">
			<BiomarkersList />
		</div>
	);
}
