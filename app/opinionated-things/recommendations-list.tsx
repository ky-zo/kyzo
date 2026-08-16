import { recommendations, type Category, type Subcategory } from "@/content/recommendations";

function sortCategories(cats: Category[]): Category[] {
	return [...cats]
		.map((c) => ({
			...c,
			subcategories: sortSubcategories(c.subcategories),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

function sortSubcategories(subs: Subcategory[]): Subcategory[] {
	return [...subs]
		.map((s) => ({
			...s,
			items: [...s.items].sort((a, b) => a.name.localeCompare(b.name)),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export default function RecommendationsList() {
	const cats = sortCategories(recommendations);

	return (
		<div className="flex w-full flex-col gap-6">
			{cats.map((cat) => (
				<section key={cat.name}>
					<h2 className="text-base text-black">{cat.name}</h2>
					<div className="mt-2 flex flex-col gap-3 border-l border-black/10 pl-3">
						{cat.subcategories.map((sub) => (
							<div key={sub.name}>
								<h3 className="text-black/40">{sub.name}</h3>
								<ul className="mt-1 flex flex-col gap-2 border-l border-black/10 pl-3">
									{sub.items.map((item) => (
										<li key={item.name} className="flex flex-col">
											<span className="text-black">{item.name}</span>
											{item.note && (
												<span className="text-[11px] text-black/40">{item.note}</span>
											)}
											{item.url && (
												<a
													href={item.url}
													target="_blank"
													rel="noopener noreferrer"
													className="break-all text-[11px] normal-case text-black/30 hover:text-black/60 hover:underline"
												>
													{item.url}
												</a>
											)}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
