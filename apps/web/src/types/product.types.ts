// Mirrors apps/api/src/types/open-food-facts.types.ts
export interface OpenFoodFactsNutriments {
  [localizedField: string]: string | number | null;
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

// GET /api/product/:barcode returns the full product when the demo user
// has an active subscription, or just these three fields when they don't.
export type BasicProductInfo = Pick<
  OpenFoodFactsProduct,
  "name" | "brand" | "imageUrl"
>;

export type ProductDetailResponse = OpenFoodFactsProduct | BasicProductInfo;

export const isFullProduct = (
  product: ProductDetailResponse,
): product is OpenFoodFactsProduct => "nutriments" in product;
