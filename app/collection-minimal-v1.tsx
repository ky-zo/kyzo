import { exp } from "@/content/exp";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
	active: "text-blue-500",
	acquired: "text-green-500",
	quit: "text-gray-400",
	closed: "text-red-400",
};

export default function CollectionMinimalV1() {
	return (
		<div className="flex w-full max-w-md flex-col">
			{exp.map((e) => (
				<div key={e.id} className="group flex flex-col py-1.5">
					<div className="flex items-center gap-2">
						<a
							href={e.company.href}
							target="_blank"
							className={cn(
								"shrink-0 hover:underline",
								e.status === "closed" || e.status === "quit"
									? "text-black/30"
									: "text-black/70",
							)}
						>
							{e.title ? `${e.title} @ ` : ""}{e.company.name}
						</a>
						<span className="min-w-0 flex-1 border-b border-dotted border-black/10" />
						<span className="shrink-0 tabular-nums text-black/25">{e.year}</span>
						<span className={cn("shrink-0 text-[11px]", statusColor[e.status])}>
							{e.status}
						</span>
					</div>
					{e.oneLiner && (
						<span className="text-[11px] text-black/25">
							{e.oneLiner}
						</span>
					)}
				</div>
			))}
		</div>
	);
}
