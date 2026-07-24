import type { WeeklyVolume } from "@/lib/garmin/activities";

/**
 * Weekly training volume against a target.
 *
 * Deliberately plain: the value of these charts is whether the bar clears the
 * goal line, so the goal is the only reference drawn and colour carries the
 * verdict. The in-progress week is dimmed — it will almost always sit under
 * target, and rendering it identically would read as a miss.
 */

const GOALS = {
	gym: 2.5,
	run: 40,
};

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
	// Headroom so a bar that beats the goal doesn't touch the top edge.
	const ceiling = Math.max(goal, ...values) * 1.25 || 1;
	const goalFrac = goal / ceiling;
	const height = 56;

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

			<div className="relative mt-2" style={{ height }}>
				{/* goal line */}
				<div
					className="absolute inset-x-0 border-t border-dashed border-black/25"
					style={{ bottom: `${goalFrac * 100}%` }}
				/>
				<div className="flex h-full items-end gap-1.5">
					{values.map((value, index) => {
						const week = weeks[index];
						const met = value >= goal;
						return (
							<div key={week.weekStart} className="flex flex-1 items-end" style={{ height }}>
								<div
									className={`w-full rounded-sm ${
										week.partial
											? "bg-black/10"
											: met
												? "bg-emerald-400/70"
												: "bg-black/20"
									}`}
									style={{ height: `${Math.max((value / ceiling) * 100, value > 0 ? 2 : 0)}%` }}
								/>
							</div>
						);
					})}
				</div>
			</div>

			<div className="mt-1 flex gap-1.5">
				{values.map((value, index) => (
					<div key={weeks[index].weekStart} className="flex-1 text-center">
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
				format={(value) => (Number.isInteger(value) ? String(value) : value.toFixed(1))}
			/>

			<Chart
				label="Running"
				unit="km / week"
				goal={GOALS.run}
				weeks={weeks}
				values={weeks.map((week) => week.runKm)}
				format={(value) => (Number.isInteger(value) ? String(value) : value.toFixed(1))}
			/>

			<div className="mt-3 text-[10px] text-black/20">last 6 weeks · current week in progress</div>
		</section>
	);
}
