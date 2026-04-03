import { Metadata } from "next";

import CollectionMinimalV1 from "./collection-minimal-v1";

export const metadata: Metadata = {
	title: "kyzo",
	description: "kyzo.io",
	alternates: {
		canonical: "https://kyzo.io",
	},
};

export default function Home() {
	return <CollectionMinimalV1 />;
}
