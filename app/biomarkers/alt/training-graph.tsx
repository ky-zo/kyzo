"use client";

import { useState, type PointerEvent } from "react";

import type { WeeklyVolume } from "@/lib/garmin/activities";

/**
 * Weekly training volume redrawn in the visual language of /interactive/graphs:
 * gradient area, smoothed line, hover tooltip. One chart per series so each
 * gets its own scale. Local experiment, only rendered by /biomarkers/alt.
 */

const GOALS = { gym: 2.5, run: 20 } as const;
const GOAL_LABELS = { gym: ">2", run: "20" } as const;

type SeriesKey = keyof typeof GOALS;

const SERIES: Record<
	SeriesKey,
	{ label: string; unit: string; color: string; dark: string; pick: (week: WeeklyVolume) => number }
> = {
	gym: {
		label: "gym",
		unit: "sessions",
		color: "oklch(0.61 0.205 292)",
		dark: "oklch(0.48 0.19 292)",
		pick: (week) => week.gymSessions,
	},
	run: {
		label: "running",
		unit: "km",
		color: "oklch(0.62 0.195 250)",
		dark: "oklch(0.49 0.19 251)",
		pick: (week) => week.runKm,
	},
};

const W = 720;
const H = 190;
const M = { top: 14, right: 48, bottom: 34, left: 6 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

type Point = { x: number; y: number };

/**
 * Catmull-Rom smoothed cubic segments, control points clamped between each
 * segment's endpoints so the curve never overshoots real values. Returned per
 * segment so the caller can split the path — solid through finished weeks,
 * dashed into the week in progress.
 */
function segments(points: Point[]): string[] {
	const factor = 0.28 / 6;
	const result: string[] = [];
	for (let index = 0; index < points.length - 1; index++) {
		const previous = points[Math.max(0, index - 1)];
		const current = points[index];
		const next = points[index + 1];
		const following = points[Math.min(points.length - 1, index + 2)];
		const minY = Math.min(current.y, next.y);
		const maxY = Math.max(current.y, next.y);
		const c1x = current.x + (next.x - previous.x) * factor;
		const c1y = Math.max(minY, Math.min(maxY, current.y + (next.y - previous.y) * factor));
		const c2x = next.x - (following.x - current.x) * factor;
		const c2y = Math.max(minY, Math.min(maxY, next.y - (following.y - current.y) * factor));
		result.push(
			`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`,
		);
	}
	return result;
}

function linePath(points: Point[]): string {
	if (!points.length) return "";
	if (points.length === 1) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
	return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} ${segments(points).join(" ")}`;
}

function areaPath(points: Point[], baseline: number): string {
	if (points.length < 2) return "";
	const first = points[0];
	const last = points[points.length - 1];
	return `${linePath(points)} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${first.x.toFixed(1)},${baseline.toFixed(1)} Z`;
}

/** 1/2/5/10-scaled grid step, so axis labels stay round numbers. */
function niceStep(value: number): number {
	const power = 10 ** Math.floor(Math.log10(Math.max(1, value)));
	const scaled = value / power;
	return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * power;
}

const compact = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

const weekLabel = (weekStart: string) =>
	new Date(`${weekStart}T00:00:00Z`)
		.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
		.toLowerCase();

function Chart({ seriesKey, weeks }: { seriesKey: SeriesKey; weeks: WeeklyVolume[] }) {
	const [hover, setHover] = useState<number | null>(null);
	const series = SERIES[seriesKey];
	const goal = GOALS[seriesKey];
	const count = weeks.length;
	const x = (index: number) => M.left + (index / (count - 1)) * IW;

	// Each chart gets its own axis, fitted to the series and its goal line.
	const ceiling = Math.max(1, goal, ...weeks.map(series.pick));
	const step = niceStep((ceiling * 1.2) / 4);
	const yMax = Math.ceil((ceiling * 1.2) / step) * step;
	const y = (value: number) => M.top + (1 - value / yMax) * IH;

	const ticks: number[] = [];
	for (let value = 0; value <= yMax + step * 0.001; value += step) ticks.push(Number(value.toPrecision(12)));

	// The week in progress joins the line as a dashed segment, same curve.
	const trailingPartial = Boolean(weeks[count - 1]?.partial) && count > 2;
	const points = weeks.map((week, index) => ({ x: x(index), y: y(series.pick(week)) }));
	const solid = trailingPartial ? points.slice(0, -1) : points;
	const joint = trailingPartial ? points[points.length - 2] : null;
	const lastSegment = trailingPartial ? segments(points).slice(-1)[0] : null;

	const values = weeks.map(series.pick);
	const current = values[values.length - 1];
	const delta = current - values[values.length - 2];

	const handleMove = (event: PointerEvent<SVGRectElement>) => {
		const svg = event.currentTarget.ownerSVGElement;
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const mouseX = ((event.clientX - rect.left) / rect.width) * W;
		const index = Math.round(((mouseX - M.left) / IW) * (count - 1));
		setHover(Math.max(0, Math.min(count - 1, index)));
	};

	return (
		<div className="mt-6 first:mt-3">
			<div className="flex items-center gap-2">
				<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: series.color }} />
				<span className="text-black/40">{series.label}</span>
				<span className="min-w-0 flex-1 border-b border-dotted border-black/10" />
				<strong className="shrink-0 font-semibold tabular-nums text-black/80">
					{compact(current)} {series.unit}
				</strong>
				{delta !== 0 && (
					<span
						className="shrink-0 text-xs tabular-nums"
						style={{ color: delta < 0 ? "oklch(0.61 0.205 27)" : series.color }}
					>
						{delta > 0 ? "+" : "−"}
						{compact(Math.abs(delta))}
					</span>
				)}
			</div>

			<div className="relative mt-1">
				<svg
					viewBox={`0 0 ${W} ${H}`}
					className="block w-full overflow-visible"
					role="img"
					aria-label={`Weekly ${series.label} volume`}
				>
					<defs>
						<linearGradient id={`gradient-${seriesKey}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor={series.color} stopOpacity="0.7" />
							<stop offset="95%" stopColor={series.color} stopOpacity="0.08" />
						</linearGradient>
					</defs>

					{/* grid + right-hand labels */}
					{ticks.map((value) => (
						<g key={value}>
							{value > 0 && (
								<line
									x1={M.left}
									x2={M.left + IW}
									y1={y(value)}
									y2={y(value)}
									stroke="currentColor"
									strokeWidth="1"
									strokeDasharray="2 3"
									className="text-black/10"
								/>
							)}
							<text
								x={M.left + IW + 8}
								y={y(value) + 3.5}
								fontSize="11"
								fill="currentColor"
								className="tabular-nums text-black/30"
							>
								{compact(value)}
							</text>
						</g>
					))}

					{/* goal, drawn in the series colour and labelled at the left edge */}
					<line
						x1={M.left}
						x2={M.left + IW}
						y1={y(goal)}
						y2={y(goal)}
						stroke={series.color}
						strokeWidth="1"
						strokeDasharray="4 3"
						opacity="0.45"
					/>
					<text
						x={M.left + 2}
						y={y(goal) - 4}
						fontSize="10"
						fill={series.color}
						opacity="0.8"
						className="tabular-nums"
					>
						{GOAL_LABELS[seriesKey]}
					</text>

					{/* area + line; the week in progress continues dashed */}
					{solid.length > 1 && <path d={areaPath(solid, M.top + IH)} fill={`url(#gradient-${seriesKey})`} opacity="0.4" />}
					{solid.length > 1 && (
						<path
							d={linePath(solid)}
							fill="none"
							stroke={series.color}
							strokeWidth="2.4"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					)}
					{joint && lastSegment && (
						<path
							d={`M${joint.x.toFixed(1)},${joint.y.toFixed(1)} ${lastSegment}`}
							fill="none"
							stroke={series.color}
							strokeWidth="2"
							strokeDasharray="2 4"
							strokeLinecap="round"
							opacity="0.5"
						/>
					)}

					{/* baseline + week labels, edge labels anchored inward */}
					<line
						x1={M.left}
						x2={M.left + IW}
						y1={M.top + IH}
						y2={M.top + IH}
						stroke="currentColor"
						strokeWidth="1"
						className="text-black/15"
					/>
					{weeks.map((week, index) => (
						<g key={week.weekStart}>
							<circle cx={x(index)} cy={M.top + IH + 7} r="2.4" fill="currentColor" className="text-black/15" />
							<text
								x={x(index)}
								y={M.top + IH + 26}
								textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
								fontSize="11"
								fill="currentColor"
								className="tabular-nums text-black/35"
							>
								{weekLabel(week.weekStart)}
							</text>
						</g>
					))}

					{/* hover focus */}
					{hover !== null && (
						<g>
							<line
								x1={x(hover)}
								x2={x(hover)}
								y1={M.top}
								y2={M.top + IH}
								stroke="currentColor"
								strokeWidth="1"
								strokeDasharray="3 4"
								className="text-black/20"
							/>
							<circle
								cx={x(hover)}
								cy={y(series.pick(weeks[hover]))}
								r="4.5"
								fill="white"
								stroke={series.dark}
								strokeWidth="2"
							/>
						</g>
					)}

					<rect
						x={M.left}
						y={M.top}
						width={IW}
						height={IH}
						fill="transparent"
						onPointerMove={handleMove}
						onPointerLeave={() => setHover(null)}
					/>
				</svg>

				{hover !== null && (
					<div
						className="pointer-events-none absolute z-10 rounded-[10px] border border-black/10 bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur-sm"
						style={{
							left: `${Math.min(84, Math.max(16, (x(hover) / W) * 100))}%`,
							top: `${Math.max(4, (y(series.pick(weeks[hover])) / H) * 100)}%`,
							transform: "translate(-50%, calc(-100% - 10px))",
						}}
					>
						<div className="text-[11px] text-black/40">
							week of {weekLabel(weeks[hover].weekStart)}
							{weeks[hover].partial ? " · in progress" : ""}
						</div>
						<div className="mt-1 flex items-center gap-1.5">
							<span className="h-[7px] w-[7px] rounded-full" style={{ background: series.color }} />
							<span className="text-[11px] text-black/45">{series.label}</span>
							<span className="text-[13px] font-medium tabular-nums text-black/80">
								{compact(series.pick(weeks[hover]))} {series.unit}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function TrainingGraph({ weeks, sample = false }: { weeks: WeeklyVolume[]; sample?: boolean }) {
	if (!weeks.length) return null;

	return (
		<section>
			<h3 className="mb-2 mt-6 text-[10px] uppercase tracking-[0.2em] text-black/25">training</h3>

			<Chart seriesKey="gym" weeks={weeks} />
			<Chart seriesKey="run" weeks={weeks} />

			<div className="mt-3 text-[10px] text-black/20">
				{sample
					? "sample data — garmin unavailable locally"
					: weeks[weeks.length - 1]?.partial
						? `last ${weeks.length} weeks — this week still in progress`
						: `last ${weeks.length} completed weeks`}
			</div>
		</section>
	);
}
