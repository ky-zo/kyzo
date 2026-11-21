import Image from "next/image";

import { exp } from "@/content/exp";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
	active: "text-blue-500",
	acquired: "text-green-500",
	quit: "text-gray-400",
	closed: "text-red-400",
};

// Past projects show their logo faded until the row is hovered.
function Logo({ src, name, faded }: { src?: string; name: string; faded: boolean }) {
	const box = cn(
		"size-4 shrink-0 rounded-[4px] transition duration-300",
		faded && "opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0",
	);
	if (!src) {
		return (
			<span
				aria-hidden
				className={cn(box, "grid place-items-center bg-black/[0.06] text-[9px] font-medium text-black/50")}
			>
				{name[0]}
			</span>
		);
	}
	return (
		<Image
			src={src}
			alt=""
			width={16}
			height={16}
			unoptimized={src.endsWith(".svg")}
			className={cn(box, "object-contain")}
		/>
	);
}

export default function CollectionMinimalV1() {
	return (
		<div className="flex w-full max-w-md flex-col">
			{exp.map((e) => {
				const past = e.status === "closed" || e.status === "quit";
				return (
					<div key={e.id} className="group flex flex-col py-1.5">
						<div className="flex items-center gap-2">
							<a
								href={e.company.href}
								target="_blank"
								className={cn(
									"flex shrink-0 items-center gap-2 hover:underline",
									past ? "text-black/30" : "text-black/70",
								)}
							>
								<Logo src={e.logo} name={e.company.name} faded={past} />
								<span>
									{e.title ? `${e.title} @ ` : ""}
									{e.company.name}
								</span>
							</a>
							<span className="min-w-0 flex-1 border-b border-dotted border-black/10" />
							{e.label && (
								<span className="shrink-0 text-[11px] text-black/25">
									{e.label}
								</span>
							)}
							<span className="shrink-0 tabular-nums text-black/25">{e.year}</span>
							<span className={cn("shrink-0 text-[11px]", statusColor[e.status])}>
								{e.status}
							</span>
						</div>
						{e.oneLiner && (
							<span className="pl-6 text-[11px] text-black/25">
								{e.oneLiner}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
