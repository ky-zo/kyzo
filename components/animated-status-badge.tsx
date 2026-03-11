"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
	active: "border-blue-300 bg-blue-50 text-blue-500",
	acquired: "border-green-300 bg-green-50 text-green-500",
	closed: "border-red-300 bg-red-50 text-red-500",
	quit: "border-gray-300 bg-gray-50 text-gray-500",
};

export function AnimatedStatusBadge({
	from,
	to,
	delay = 5000,
}: {
	from: string;
	to: string;
	delay?: number;
}) {
	const [status, setStatus] = useState(from);

	useEffect(() => {
		const timer = setTimeout(() => {
			setStatus(to);
		}, delay);
		return () => clearTimeout(timer);
	}, [delay, to]);

	return (
		<Badge
			variant="outline"
			className={cn("relative overflow-hidden font-normal", statusColors[status])}
		>
			<AnimatePresence mode="wait">
				<motion.span
					key={status}
					initial={{ y: 12, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -12, opacity: 0 }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					{status}
				</motion.span>
			</AnimatePresence>
		</Badge>
	);
}
