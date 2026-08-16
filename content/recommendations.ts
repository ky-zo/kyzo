export type Recommendation = {
	name: string;
	url?: string;
	note?: string;
};

export type Subcategory = {
	name: string;
	items: Recommendation[];
};

export type Category = {
	name: string;
	subcategories: Subcategory[];
};

// Add your recommendations here. Sorting into alphabetical order is
// handled automatically at render time, so you can add entries in any order.
export const recommendations: Category[] = [
	{
		name: "Coffee",
		subcategories: [
			{
				name: "Grinder",
				items: [
					{
						name: "Timemore C Series",
						url: "https://timemoreeu.com/collections/manual-coffee-grinder/products/timemore-manual-coffee-grinder-chestnut-c5-series",
					},
				],
			},
		],
	},
];
