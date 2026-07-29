import type { WeeklyVolume } from "@/lib/garmin/activities";

/**
 * Weekly training volume against a target.
 *
 * Drawn as a line so the shape of the trend reads first — bars invited
 * comparing individual weeks, which isn't the question. The goal is the only
 * other reference on the chart, labelled on the line itself so the header can
 * carry what actually happened: the six-week average.
 *
 * Only finished weeks are plotted. Mid-week a running total sits below a
 * finished week by construction, so a point for the week in progress would
 * read as a collapse rather than an incomplete week.
 */

const GOALS = {
	gym: 2.5,
	run: 40,
};

const WIDTH = 400;
const HEIGHT = 64;
const PAD_Y = 8;

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
	// Points sit at the centre of equal columns, matching the label row below.
	// Spacing them edge-to-edge instead would put every dot out of step with
	// the number under it.
	const x = (index: number) => ((index + 0.5) / values.length) * WIDTH;
	const y = (value: number) => PAD_Y + (1 - value / ceiling) * (HEIGHT - PAD_Y * 2);

	const average = values.reduce((total, value) => total + value, 0) / (values.length || 1);

	const points = values.map((value, index) => `${x(index)},${y(value)}`);

	return (
		<div className="mt-5">
			<div className="flex items-baseline gap-2">
				<span className="text-black/40">{label}</span>
				<span className="min-w-0 flex-1 border-b border-dotted border-black/10" />
				<span className="shrink-0 tabular-nums text-black/50">
					{format(average)} {unit}
				</span>
			</div>

			<svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full overflow-visible">
				{/* goal, labelled on the line so it reads as the target rather than a result */}
				<line
					x1="0"
					x2={WIDTH - 22}
					y1={y(goal)}
					y2={y(goal)}
					stroke="currentColor"
					strokeWidth="1"
					strokeDasharray="3 3"
					className="text-black/25"
				/>
				<text
					x={WIDTH}
					y={y(goal) + 3}
					textAnchor="end"
					fontSize="10"
					fill="currentColor"
					className="tabular-nums text-black/30"
				>
					{format(goal)}
				</text>

				{points.length > 1 && (
					<polyline
						points={points.join(" ")}
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-black/35"
					/>
				)}

				{values.map((value, index) => (
					<circle
						key={weeks[index].weekStart}
						cx={x(index)}
						cy={y(value)}
						r="2.5"
						strokeWidth="1.5"
						className={value >= goal ? "fill-emerald-400" : "fill-black/30"}
					/>
				))}
			</svg>

			<div className="mt-1 flex">
				{values.map((value, index) => (
					<div key={weeks[index].weekStart} className="flex-1 text-center">
						<div className="text-[10px] tabular-nums text-black/45">{format(value)}</div>
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

			<div className="mt-3 text-[10px] text-black/20">last 6 completed weeks</div>
		</section>
	);
}
