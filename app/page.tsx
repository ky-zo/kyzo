import { Metadata } from "next";

import { AnimatedStatusBadge } from "@/components/animated-status-badge";
import { Badge } from "@/components/ui/badge";
import { exp } from "@/content/exp";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "kyzo",
	description: "kyzo.io",
	alternates: {
		canonical: "https://kyzo.io",
	},
};

export default function Home() {
	return (
		<ul className="w-full max-w-md space-y-2">
			{exp.map((e) => {
				return (
					<li
						key={e.id}
						className={cn(
							"shadow-neumorphic flex min-h-[50px] w-full flex-col gap-1 rounded-2xl border-[0.5px] p-4",
							{
								"bg-gray-50": e.status === "quit" || e.status === "closed",
							},
						)}
					>
						<div className="flex flex-col items-start">
							<div className="flex w-full items-center justify-between">
								<div>
									{e.title && e.title + "@"}
									<a
										href={e.company.href}
										className="font-bold hover:underline"
										target="_blank"
									>
										{e.company.name}
									</a>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-xs text-black/30">{e.year}</span>
									{e.company.name === "fluar" ? (
										<AnimatedStatusBadge from="active" to="acquired" delay={300} />
									) : (
										<Badge
											variant={"outline"}
											className={cn("font-normal", {
												"border-red-300 bg-red-50 text-red-500":
													e.status === "closed",
												"border-green-300 bg-green-50 text-green-500":
													e.status === "acquired",
												"border-blue-300 bg-blue-50 text-blue-500":
													e.status === "active",
												"border-gray-300 bg-gray-50 text-gray-500":
													e.status === "quit",
											})}
										>
											{e.status}
										</Badge>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-1 text-xs text-black/50">
							{e.status !== "closed" && (
								<>
									<a href={e.company.href} target="_blank" className="shrink-0 hover:underline">{e.company.href.replace(/^https?:\/\/(www\.)?/, "")}</a>
									{e.oneLiner && <span>•</span>}
								</>
							)}
							<span>{e.oneLiner}</span>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
