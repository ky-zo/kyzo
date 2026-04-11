type expProps = {
	id: string;
	dates: string;
	title?: string;
	company: {
		name: string;
		href: string;
	};

	oneLiner?: string;
	label?: string;
	status: "closed" | "quit" | "active" | "acquired";
	year: number;
};

export const exp: expProps[] = [
	{
		id: "agentic-engineer",
		dates: "04.2026",
		company: {
			name: "Agentic Engineer",
			href: "https://agentic-engineer.ai",
		},
		oneLiner: "fractional AI consulting for engineering teams",
		label: "consulting",
		status: "active",
		year: 2026,
	},
	{
		id: "pretty-sports",
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
		id: "goose-game",
		dates: "03.2024",
		company: {
			name: "Goose Game",
			href: "https://quack.kyzo.io",
		},
		oneLiner: "🪿 Game",
		label: "game",
		status: "active",
		year: 2025,
	},
	{
		id: "fluar",
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
