"use client";

import { useRef, useState } from "react";
import { codes, readings, categories, BIRTH_DATE, type BiomarkerCode, type Reading } from "@/content/biomarkers";

function getReadings(code: string): Reading[] {
	if (code === "age") {
		const now = new Date();
		const ageMs = now.getTime() - BIRTH_DATE.getTime();
		const age = Math.round((ageMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
		return [{ date: now.toISOString().slice(0, 10), value: age }];
	}
	return readings[code] || [];
}

type Status = "optimal" | "borderline" | "abnormal";

function getStatus(value: number | string, code: BiomarkerCode): Status | null {
	if (!code.reference || !code.threshold || typeof value !== "number") return null;
	const { low, high } = code.reference;
	const { borderline, abnormal } = code.threshold;

	if (low !== undefined && value < low) {
		const pctBelow = ((low - value) / (Math.abs(low) || 1)) * 100;
		if (pctBelow >= abnormal) return "abnormal";
		return "borderline";
	}

	if (high !== undefined && value > high) {
		const pctAbove = ((value - high) / high) * 100;
		if (pctAbove >= abnormal) return "abnormal";
		return "borderline";
	}

	return "optimal";
}

type Freshness = "fresh" | "stale" | "old";

function getFreshness(dateStr: string): Freshness {
	const now = new Date();
	const date = new Date(dateStr);
	const months = (now.getTime() - date.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
	if (months <= 3) return "fresh";
	if (months <= 12) return "stale";
	return "old";
}

function formatAge(dateStr: string): string {
	const now = new Date();
	const date = new Date(dateStr);
	const days = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
	if (days < 1) return "today";
	if (days < 30) return `${days}d`;
	const months = Math.floor(days / 30.44);
	if (months < 24) return `${months}mo`;
	return `${Math.floor(months / 12)}y`;
}

const freshnessText: Record<Freshness, string> = {
	fresh: "text-black/20",
	stale: "text-amber-600/40",
	old: "text-amber-800/45",
};

function formatRef(code: BiomarkerCode) {
	if (!code.reference) return null;
	const { low, high } = code.reference;
	if (low !== undefined && high !== undefined) return `${low}\u2013${high}`;
	if (high !== undefined) return `< ${high}`;
	if (low !== undefined) return `> ${low}`;
	return null;
}

const statusDot: Record<Status, string> = {
	optimal: "bg-emerald-400",
	borderline: "bg-amber-400",
	abnormal: "bg-red-400",
};

/** Position of value on the range bar as 0–1 */
function getBarExtents(code: BiomarkerCode) {
	if (!code.reference || !code.threshold) return null;
	const { low, high } = code.reference;
	const { abnormal } = code.threshold;

	// Calculate the bar min/max based on abnormal threshold so bar covers full range
	const abnormalFrac = abnormal / 100;
	if (low !== undefined && high !== undefined) {
		const min = low - abnormalFrac * 1.2 * (Math.abs(low) || 1);
		const max = high + abnormalFrac * 1.2 * (Math.abs(high) || 1);
		return { min, max };
	}
	if (high !== undefined) {
		return { min: 0, max: high + abnormalFrac * 1.2 * (Math.abs(high) || 1) };
	}
	if (low !== undefined) {
		return { min: low - abnormalFrac * 1.2 * (Math.abs(low) || 1), max: low * 2 };
	}
	return null;
}

function getRangePosition(value: number, code: BiomarkerCode): number | null {
	const extents = getBarExtents(code);
	if (!extents) return null;
	return Math.max(0, Math.min(1, (value - extents.min) / (extents.max - extents.min)));
}

/** Zone boundaries as fractions of the bar, derived from actual thresholds */
function getZones(code: BiomarkerCode): { greenStart: number; greenEnd: number; borderlineStart: number; borderlineEnd: number } | null {
	if (!code.reference || !code.threshold) return null;
	const extents = getBarExtents(code);
	if (!extents) return null;
	const { low, high } = code.reference;
	const { borderline, abnormal } = code.threshold;
	const { min, max } = extents;
	const range = max - min;

	const toFrac = (v: number) => (v - min) / range;

	const borderlineFrac = borderline / 100;
	const abnormalFrac = abnormal / 100;

	const greenStart = low !== undefined ? toFrac(low) : 0;
	const greenEnd = high !== undefined ? toFrac(high) : 1;

	const borderlineStart = low !== undefined ? toFrac(low - borderlineFrac * (Math.abs(low) || 1)) : 0;
	const borderlineEnd = high !== undefined ? toFrac(high + borderlineFrac * (Math.abs(high) || 1)) : 1;

	return { greenStart, greenEnd, borderlineStart, borderlineEnd };
}

function Sparkline({ data }: { data: Reading[] }) {
	const values = data
		.map((r) => (typeof r.value === "number" ? r.value : null))
		.filter((v): v is number => v !== null);
	if (values.length < 2) return null;

	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	const w = 120;
	const h = 32;
	const padding = 4;

	const points = values.map((v, i) => {
		const x = (i / (values.length - 1)) * w;
		const y = padding + (1 - (v - min) / range) * (h - padding * 2);
		return `${x},${y}`;
	});

	return (
		<svg width={w} height={h} className="mt-1">
			<polyline
				points={points.join(" ")}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="text-black/20"
			/>
			{values.map((v, i) => {
				const x = (i / (values.length - 1)) * w;
				const y = padding + (1 - (v - min) / range) * (h - padding * 2);
				return (
					<circle
						key={i}
						cx={x}
						cy={y}
						r="2"
						className="fill-black/30"
					/>
				);
			})}
		</svg>
	);
}

function RangeBar({ value, code }: { value: number; code: BiomarkerCode }) {
	const pos = getRangePosition(value, code);
	const zones = getZones(code);
	if (pos === null || zones === null) return null;

	return (
		<div className="relative mt-2 h-2 w-full rounded-full bg-red-400">
			{/* borderline zones */}
			<div
				className="absolute inset-y-0 rounded-full bg-amber-400"
				style={{
					left: `${zones.borderlineStart * 100}%`,
					width: `${(zones.borderlineEnd - zones.borderlineStart) * 100}%`,
				}}
			/>
			{/* green zone */}
			<div
				className="absolute inset-y-0 rounded-full bg-emerald-400"
				style={{
					left: `${zones.greenStart * 100}%`,
					width: `${(zones.greenEnd - zones.greenStart) * 100}%`,
				}}
			/>
			{/* indicator */}
			<div
				className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/70 shadow-sm"
				style={{ left: `${pos * 100}%` }}
			/>
		</div>
	);
}

function InfoPanel({ codeKey }: { codeKey: string }) {
	const code = codes[codeKey];
	const markerReadings = getReadings(codeKey);
	if (!code || !markerReadings.length) return null;

	const latest = markerReadings[markerReadings.length - 1];
	const freshness = getFreshness(latest.date);
	const hasGraph = markerReadings.length > 1;
	const hasRange = code.reference && typeof latest.value === "number";

	return (
		<div className="flex w-[180px] flex-col gap-2 border border-black p-3">
			<div className="text-[11px] text-black">{code.name}</div>
			{code.unit && (
				<div className="text-[10px] text-black/30">{code.unit}</div>
			)}
			<div className="flex items-baseline justify-between">
				<span className={`text-[10px] ${
					freshness === "fresh" ? "text-emerald-600" :
					freshness === "stale" ? "text-amber-600" : "text-amber-800"
				}`}>{freshness}</span>
				<span className="text-[10px] tabular-nums text-black/50">{latest.date}</span>
			</div>
			{hasGraph && <Sparkline data={markerReadings} />}
			{hasRange && (
				<RangeBar value={latest.value as number} code={code} />
			)}
		</div>
	);
}

function MarkerRow({
	codeKey,
	latest,
	isActive,
	onHover,
	onLeave,
}: {
	codeKey: string;
	latest: Reading;
	isActive: boolean;
	onHover: (el: HTMLDivElement) => void;
	onLeave: () => void;
}) {
	const code = codes[codeKey];
	if (!code) return null;
	const ref = formatRef(code);
	const status = getStatus(latest.value, code);
	const freshness = getFreshness(latest.date);
	const age = formatAge(latest.date);

	return (
		<div
			className={`flex items-center gap-2 py-1.5 transition-colors duration-100 ${
				isActive ? "bg-black/[0.02]" : ""
			}`}
			onMouseEnter={(e) => onHover(e.currentTarget)}
			onMouseLeave={onLeave}
		>
			{status ? (
				<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[status]}`} />
			) : (
				<span className="w-1.5 shrink-0" />
			)}
			<span className="shrink-0 text-black/40">{code.name}</span>
			<span className="min-w-0 flex-1 border-b border-dotted border-black/10" />
			<span className="shrink-0 tabular-nums">{latest.estimated ? "~" : ""}{latest.value}</span>
			<span className="w-[52px] shrink-0 text-right text-[11px] text-black/20">
				{code.shortUnit || code.unit || ""}
			</span>
			{ref && (
				<span className="w-[60px] shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums text-black/15">
					{ref}
				</span>
			)}
			{!ref && <span className="w-[60px] shrink-0" />}
			<span className={`w-[44px] shrink-0 text-right text-[10px] tabular-nums ${freshnessText[freshness]}`}>
				{codeKey !== "age" && codeKey !== "height" ? age : ""}
			</span>
		</div>
	);
}

function CategorySection({
	category,
	markerCodes,
	activeCode,
	onHover,
	onLeave,
}: {
	category: string;
	markerCodes: string[];
	activeCode: string | null;
	onHover: (code: string, el: HTMLDivElement) => void;
	onLeave: () => void;
}) {
	return (
		<section>
			<h3 className="mb-2 mt-6 text-[10px] uppercase tracking-[0.2em] text-black/25">
				{category}
			</h3>
			<div className="flex flex-col">
				{markerCodes.map((code) => {
					const markerReadings = getReadings(code);
					if (!markerReadings?.length) return null;
					const latest = markerReadings[markerReadings.length - 1];
					return (
						<MarkerRow
							key={code}
							codeKey={code}
							latest={latest}
							isActive={activeCode === code}
							onHover={(el) => onHover(code, el)}
							onLeave={onLeave}
						/>
					);
				})}
			</div>
		</section>
	);
}

export default function BiomarkersList() {
	const [activeCode, setActiveCode] = useState<string | null>(null);
	const [panelY, setPanelY] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const grouped = Object.keys(categories).reduce(
		(acc, cat) => {
			const markerCodes = Object.entries(codes)
				.filter(([key, c]) => c.category === cat && getReadings(key).length)
				.map(([key]) => key);
			if (markerCodes.length > 0) acc[cat] = markerCodes;
			return acc;
		},
		{} as Record<string, string[]>,
	);

	function handleHover(code: string, el: HTMLDivElement) {
		setActiveCode(code);
		if (containerRef.current) {
			const containerRect = containerRef.current.getBoundingClientRect();
			const rowRect = el.getBoundingClientRect();
			setPanelY(rowRect.top - containerRect.top);
		}
	}

	return (
		<div className="relative" ref={containerRef}>
			<div className="flex w-full flex-col">
				{Object.entries(grouped).map(([category, markerCodes]) => (
					<CategorySection
						key={category}
						category={category}
						markerCodes={markerCodes}
						activeCode={activeCode}
						onHover={handleHover}
						onLeave={() => setActiveCode(null)}
					/>
				))}
			</div>

			{/* floating info panel — aligned with hovered row */}
			{activeCode && (
				<div
					className="pointer-events-none absolute left-full z-10 ml-4 hidden sm:block"
					style={{ top: panelY }}
				>
					<InfoPanel codeKey={activeCode} />
				</div>
			)}
		</div>
	);
}
