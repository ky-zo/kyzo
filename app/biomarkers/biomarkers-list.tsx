"use client";

import { useRef, useState } from "react";
import { codes, readings, categories, type BiomarkerCode, type Reading } from "@/content/biomarkers";

type Status = "optimal" | "borderline" | "abnormal";

function getStatus(value: number | string, code: BiomarkerCode): Status | null {
	if (!code.reference || !code.threshold || typeof value !== "number") return null;
	const { low, high } = code.reference;
	const { borderline, abnormal } = code.threshold;

	if (low !== undefined && value < low) {
		const pctBelow = ((low - value) / low) * 100;
		if (pctBelow >= abnormal) return "abnormal";
		if (pctBelow >= borderline) return "borderline";
		return "optimal";
	}

	if (high !== undefined && value > high) {
		const pctAbove = ((value - high) / high) * 100;
		if (pctAbove >= abnormal) return "abnormal";
		if (pctAbove >= borderline) return "borderline";
		return "optimal";
	}

	return "optimal";
}

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
function getRangePosition(value: number, code: BiomarkerCode): number | null {
	if (!code.reference) return null;
	const { low, high } = code.reference;
	if (low !== undefined && high !== undefined) {
		const range = high - low;
		const padding = range * 0.3;
		const min = low - padding;
		const max = high + padding;
		return Math.max(0, Math.min(1, (value - min) / (max - min)));
	}
	if (high !== undefined) {
		const max = high * 1.4;
		return Math.max(0, Math.min(1, value / max));
	}
	if (low !== undefined) {
		const max = low * 2;
		return Math.max(0, Math.min(1, value / max));
	}
	return null;
}

/** Green zone start/end as fractions of the bar */
function getGreenZone(code: BiomarkerCode): { start: number; end: number } | null {
	if (!code.reference) return null;
	const { low, high } = code.reference;
	if (low !== undefined && high !== undefined) {
		const range = high - low;
		const padding = range * 0.3;
		const min = low - padding;
		const max = high + padding;
		return { start: (low - min) / (max - min), end: (high - min) / (max - min) };
	}
	if (high !== undefined) {
		const max = high * 1.4;
		return { start: 0, end: high / max };
	}
	if (low !== undefined) {
		const max = low * 2;
		return { start: low / max, end: 1 };
	}
	return null;
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
	const zone = getGreenZone(code);
	if (pos === null || zone === null) return null;

	return (
		<div className="relative mt-2 h-2 w-full rounded-full bg-red-400">
			{/* borderline zones */}
			<div
				className="absolute inset-y-0 rounded-full bg-amber-400"
				style={{
					left: `${Math.max(0, zone.start - 0.08) * 100}%`,
					right: `${Math.max(0, (1 - zone.end - 0.08)) * 100}%`,
				}}
			/>
			{/* green zone */}
			<div
				className="absolute inset-y-0 rounded-full bg-emerald-400"
				style={{
					left: `${zone.start * 100}%`,
					width: `${(zone.end - zone.start) * 100}%`,
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
	const markerReadings = readings[codeKey] || [];
	if (!code || !markerReadings.length) return null;

	const latest = markerReadings[markerReadings.length - 1];
	const hasGraph = markerReadings.length > 1;
	const hasRange = code.reference && typeof latest.value === "number";

	return (
		<div className="flex w-[180px] flex-col gap-2 border border-black p-3">
			<div className="text-[11px] text-black">{code.name}</div>
			<div className="flex items-baseline justify-between">
				<span className="text-[10px] text-black/50">last read</span>
				<span className="text-[10px] tabular-nums text-black">{latest.date}</span>
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
			<span className="w-[72px] shrink-0 text-right text-[11px] text-black/20">
				{code.unit || ""}
			</span>
			{ref && (
				<span className="w-[80px] shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums text-black/15">
					{ref}
				</span>
			)}
			{!ref && <span className="w-[80px] shrink-0" />}
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
					const markerReadings = readings[code];
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
				.filter(([key, c]) => c.category === cat && readings[key]?.length)
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
