import type { WeeklyVolume } from "@/lib/garmin/activities";

/**
 * Weekly training volume against a target.
 *
 * Drawn as a line so the shape of the trend reads first — bars invited
 * comparing individual weeks, which isn't the question. The goal is the only
 * other reference on the chart, and colour marks which weeks cleared it.
 *
 * The in-progress week is drawn hollow on a dashed segment: mid-week it will
 * almost always sit under target, and plotting it like a finished week would
 * read as a miss.
 */

const GOALS = {
	gym: 2.5,
	run: 40,
};

const WIDTH = 400;
const HEIGHT = 64;
const PAD_Y = 8;

function formatWeek(weekStart: string): string {
	const [, month, day] = weekStart.split("-");
	return `${Number(day)}.${Number(month)}`;
}

function Chart({
	label,
	unit,
	goal,
	weeks,
	values,
	format,
}: {
	label: string;
	unit: string;
	goal: number;
	weeks: WeeklyVolume[];
	values: number[];
	format: (value: number) => string;
}) {
	// Headroom so a week that beats the goal doesn't touch the top edge.
	const ceiling = Math.max(goal, ...values) * 1.25 || 1;
	const x = (index: number) => (index / Math.max(values.length - 1, 1)) * WIDTH;
	const y = (value: number) => PAD_Y + (1 - value / ceiling) * (HEIGHT - PAD_Y * 2);

	const points = values.map((value, index) => `${x(index)},${y(value)}`);
	const lastComplete = weeks.findIndex((week) => week.partial);
	// Split the line so the unfinished week trails off dashed.
	const solid = lastComplete === -1 ? points : points.slice(0, lastComplete);
	const dashed = lastComplete === -1 ? [] : points.slice(Math.max(lastComplete - 1, 0));

	const hit = values.filter((value, index) => value >= goal && !weeks[index].partial).length;
	const scored = weeks.filter((week) => !week.partial).length;

	return (
		<div className="mt-5">
			<div className="flex items-baseline gap-2">
				<span className="text-black/40">{label}</span>
				<span className="min-w-0 flex-1 border-b border-dotted border-black/10" />
				<span className="shrink-0 tabular-nums text-black/50">
					{format(goal)} {unit}
				</span>
				<span className="w-[60px] shrink-0 text-right text-[11px] tabular-nums text-black/15">
					{hit}/{scored} hit
				</span>
			</div>

			<svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full overflow-visible">
				{/* goal */}
				<line
					x1="0"
					x2={WIDTH}
					y1={y(goal)}
					y2={y(goal)}
					stroke="currentColor"
					strokeWidth="1"
					strokeDasharray="3 3"
					className="text-black/25"
				/>

				{solid.length > 1 && (
					<polyline
						points={solid.join(" ")}
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-black/35"
					/>
				)}
				{dashed.length > 1 && (
					<polyline
						points={dashed.join(" ")}
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeDasharray="3 3"
						strokeLinecap="round"
						className="text-black/20"
					/>
				)}

				{values.map((value, index) => {
					const week = weeks[index];
					const met = value >= goal;
					return (
						<circle
							key={week.weekStart}
							cx={x(index)}
							cy={y(value)}
							r="2.5"
							strokeWidth="1.5"
							{...(week.partial
								? { fill: "white", stroke: "currentColor", className: "text-black/25" }
								: { className: met ? "fill-emerald-400" : "fill-black/30" })}
						/>
					);
				})}
			</svg>

			<div className="mt-1 flex">
				{values.map((value, index) => (
					<div key={weeks[index].weekStart} className="flex-1 text-center first:text-left last:text-right">
						<div className={`text-[10px] tabular-nums ${weeks[index].partial ? "text-black/25" : "text-black/45"}`}>
							{format(value)}
						</div>
						<div className="text-[9px] tabular-nums text-black/15">{formatWeek(weeks[index].weekStart)}</div>
					</div>
				))}
			</div>
		</div>
	);
}

const compact = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export default function TrainingCharts({ weeks }: { weeks: WeeklyVolume[] }) {
	if (!weeks.length) return null;

	return (
		<section>
			<h3 className="mb-2 mt-6 text-[10px] uppercase tracking-[0.2em] text-black/25">training</h3>

			<Chart
				label="Gym"
				unit="/ week"
				goal={GOALS.gym}
				weeks={weeks}
				values={weeks.map((week) => week.gymSessions)}
				format={compact}
			/>

			<Chart
				label="Running"
				unit="km / week"
				goal={GOALS.run}
				weeks={weeks}
				values={weeks.map((week) => week.runKm)}
				format={compact}
			/>

			<div className="mt-3 text-[10px] text-black/20">last 6 weeks · current week in progress</div>
		</section>
	);
}
