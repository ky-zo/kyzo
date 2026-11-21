type expProps = {
	id: string;
	dates: string;
	title?: string;
	company: {
		name: string;
		href: string;
	};

	// Square icon under /public/logos. Without one the row shows the first letter.
	logo?: string;
	oneLiner?: string;
	label?: string;
	status: "closed" | "quit" | "active" | "acquired";
	year: number;
};

export const exp: expProps[] = [
	{
		id: "pinyin-everything",
		logo: "/logos/pinyin-everything.png",
		dates: "11.2026",
		company: {
			name: "Pinyin Everything",
			href: "https://apps.apple.com/app/pinyin-everything/id6832428944",
		},
		oneLiner: "screenshot any Chinese, read it with pinyin and meanings",
		label: "iOS app",
		status: "active",
		year: 2026,
	},
	{
		id: "one",
		logo: "/logos/one.png",
		dates: "09.2026",
		company: {
			name: "One",
			href: "https://getone.one",
		},
		oneLiner: "one toolbar for AI terminal agents",
		label: "macOS app",
		status: "active",
		year: 2026,
	},
	{
		id: "kumo",
		logo: "/logos/kumo.svg",
		dates: "07.2026",
		company: {
			name: "kumo",
			href: "https://kumo.so",
		},
		oneLiner: "cloud agents",
		status: "closed",
		year: 2026,
	},
	{
		id: "agentic-engineer",
		logo: "/logos/agentic-engineer.png",
		dates: "04.2026",
		company: {
			name: "Agentic Engineer",
			href: "https://agentic-engineer.ai",
		},
		oneLiner: "never really did anything with it but landing is nice",
		label: "consulting",
		status: "closed",
		year: 2026,
	},
	{
		id: "pretty-sports",
		logo: "/logos/pretty-sports.png",
		dates: "03.2026",
		company: {
			name: "Pretty Sports",
			href: "https://prettysports.app",
		},
		oneLiner: "iOS widgets with Strava/Garmin goals",
		label: "iOS app",
		status: "active",
		year: 2026,
	},
	{
		id: "pretty-timezones",
		logo: "/logos/pretty-timezones.svg",
		dates: "02.2026",
		company: {
			name: "Pretty Timezones",
			href: "https://prettytimezones.com",
		},
		oneLiner: "macOS menu bar app for timezone comparison",
		label: "macOS app",
		status: "active",
		year: 2026,
	},
	{
		id: "openrec",
		logo: "/logos/openrec.png",
		dates: "01.2026",
		company: {
			name: "OpenRec",
			href: "https://openrec.com",
		},
		oneLiner: "open source screen recording",
		label: "macOS app",
		status: "active",
		year: 2026,
	},
	{
		id: "stravisuals",
		logo: "/logos/stravisuals.png",
		dates: "03.2024",
		company: {
			name: "Stravisuals",
			href: "https://stravisuals.com",
		},
		oneLiner: "Visuals for Strava Activities",
		label: "web app",
		status: "closed",
		year: 2025,
	},
	{
		id: "fluar",
		logo: "/logos/fluar.png",
		dates: "02.2025",
		company: {
			name: "fluar",
			href: "https://fluar.com",
		},
		oneLiner: "AI-powered data enrichment",
		label: "SaaS",
		status: "acquired",
		year: 2025,
	},
	{
		id: "copycopter",
		logo: "/logos/copycopter.png",
		dates: "01.2024",
		company: {
			name: "copycopter",
			href: "https://copycopter.ai",
		},
		oneLiner: "generate AI videos from simple text prompts",
		label: "SaaS",
		status: "acquired",
		year: 2024,
	},
	{
		id: "yove",
		logo: "/logos/yove.png",
		dates: "08.2023",
		company: {
			name: "Yove",
			href: "https://www.hiyove.com",
		},
		oneLiner: "reach your personal goals with a little help from AI",
		label: "SaaS",
		status: "closed",
		year: 2023,
	},
	{
		id: "finey",
		dates: "06.2023",
		company: {
			name: "finey",
			href: "https://finey.io",
		},
		oneLiner: "classify, sort and categorize your invoices automatically",
		label: "SaaS",
		status: "closed",
		year: 2023,
	},
	{
		id: "flyfile",
		logo: "/logos/flyfile.svg",
		dates: "06.2023",
		company: {
			name: "flyfile",
			href: "https://flyfile.io",
		},
		oneLiner: "sort out your email attachments automatically",
		label: "SaaS",
		status: "closed",
		year: 2023,
	},
	{
		id: "epinote",
		logo: "/logos/epinote.png",
		dates: "07.2020-02.2023",
		title: "COO & co-founder",
		company: {
			name: "epinote",
			href: "https://epinote.io",
		},
		oneLiner: "automated remote workforce. raised $1.6m",
		label: "SaaS",
		status: "quit",
		year: 2022,
	},
];
