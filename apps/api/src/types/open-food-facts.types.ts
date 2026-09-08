export interface OpenFoodFactsNutriments {
	[localizedField: string]: unknown;
}

export interface OpenFoodFactsProduct {
	barcode: string;
	name: string | null;
	brand: string | null;
	imageUrl: string | null;
	ingredientsText: string | null;
	nutriments: OpenFoodFactsNutriments | null;
}

export interface OpenFoodFactsSearchResult {
	products: OpenFoodFactsProduct[];
	page: number;
	pageSize: number;
	totalCount: number;
}
