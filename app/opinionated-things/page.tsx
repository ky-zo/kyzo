import { Metadata } from "next";

import RecommendationsList from "./recommendations-list";

export const metadata: Metadata = {
	title: "opinionated things - kyzo",
	description: "things I recommend",
	alternates: {
		canonical: "https://kyzo.io/opinionated-things",
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function OpinionatedThingsPage() {
	return (
		<div className="flex w-full max-w-md flex-col pb-10">
			<RecommendationsList />
		</div>
	);
}
