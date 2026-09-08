import { beforeEach, describe, expect, it, vi } from 'vitest';
import got from 'got';
import {
	getProductByBarcode,
	searchProducts,
} from '../../src/integration/open-food-facts.integration.js';

vi.mock('got', () => ({ default: vi.fn() }));

const mockGot = vi.mocked(got);

/** Shapes a return value matching what `got(url, options).json<T>()` resolves to. */
const gotJsonResolves = (body: unknown) => {
	return { json: () => Promise.resolve(body) } as never;
};

/** Shapes a return value matching a failed got request/parse — the exact
 * error class doesn't matter here, since `requestJson` wraps anything
 * `.json()` rejects with into `OpenFoodFactsError` uniformly. */
const gotJsonRejects = (error: Error) => {
	return { json: () => Promise.reject(error) } as never;
};

/** A got HTTPError-shaped 404, as OFF actually returns for an unknown
 * barcode (confirmed live) — a real Error with a `response.statusCode`
 * property, matching what `isHttpNotFound` checks for. */
const notFoundError = () => {
	return Object.assign(new Error('Response code 404 (Not Found)'), {
		response: { statusCode: 404 },
	});
};

beforeEach(() => {
	mockGot.mockReset();
});

describe('searchProducts', () => {
	it('normalizes a successful search response', async () => {
		mockGot.mockReturnValue(
			gotJsonResolves({
				count: 1,
				page: 1,
				page_size: 20,
				products: [
					{
						code: '1234567890123',
						product_name_fr: 'Nom du produit',
						product_name: 'Product name',
						brands: 'Acme',
						image_front_url: 'https://example.com/front.jpg',
						ingredients_text_fr: 'Ingrédients',
						nutriments: {
							'energy-kcal_100g': 250,
							fat_100g: 10,
							'saturated-fat_100g': 4,
							carbohydrates_100g: 30,
							sugars_100g: 12,
							proteins_100g: 5,
							salt_100g: 1.1,
						},
					},
				],
			}),
		);

		const result = await searchProducts('cookies', 'fr');

		expect(result.totalCount).toBe(1);
		expect(result.products).toHaveLength(1);
		expect(result.products[0]).toEqual({
			barcode: '1234567890123',
			name: 'Nom du produit',
			brand: 'Acme',
			imageUrl: 'https://example.com/front.jpg',
			ingredientsText: 'Ingrédients',
			nutriments: {
				energyKcal100g: 250,
				fat100g: 10,
				saturatedFat100g: 4,
				carbohydrates100g: 30,
				sugars100g: 12,
				proteins100g: 5,
				salt100g: 1.1,
			},
		});
	});

	it('returns an empty result set without throwing when there are no matches', async () => {
		mockGot.mockReturnValue(
			gotJsonResolves({ count: 0, page: 1, page_size: 20, products: [] }),
		);

		const result = await searchProducts('nonexistent product xyz', 'en');

		expect(result).toEqual({
			products: [],
			page: 1,
			pageSize: 20,
			totalCount: 0,
		});
	});

	it('returns an empty result set for an empty search term without calling got', async () => {
		const result = await searchProducts('   ', 'en');

		expect(result).toEqual({ products: [], page: 1, pageSize: 20, totalCount: 0 });
		expect(mockGot).not.toHaveBeenCalled();
	});

	it('throws OpenFoodFactsError on a non-OK HTTP response', async () => {
		mockGot.mockReturnValue(
			gotJsonRejects(
				new Error('Response code 503 (Service Unavailable)'),
			),
		);

		await expect(searchProducts('cookies', 'en')).rejects.toMatchObject({
			name: 'OpenFoodFactsError',
			httpStatus: 502,
		});
	});
});

describe('getProductByBarcode', () => {
	it('normalizes a found product, defaulting missing fields to null', async () => {
		mockGot.mockReturnValue(
			gotJsonResolves({
				status: 'success',
				errors: [],
				product: {
					code: '9999999999999',
					// no product_name, no brands, no image, no nutriments —
					// exercises "handle missing or incomplete data"
				},
			}),
		);

		const product = await getProductByBarcode('9999999999999', 'en');

		expect(product).toEqual({
			barcode: '9999999999999',
			name: null,
			brand: null,
			imageUrl: null,
			ingredientsText: null,
			nutriments: null,
		});
	});

	it('returns null when Open Food Facts responds 404 for an unknown barcode', async () => {
		mockGot.mockReturnValue(gotJsonRejects(notFoundError()));

		const product = await getProductByBarcode('0000000000000', 'en');

		expect(product).toBeNull();
	});

	it('rejects an empty barcode without calling got', async () => {
		await expect(getProductByBarcode('', 'en')).rejects.toMatchObject({
			name: 'OpenFoodFactsError',
			httpStatus: 400,
		});
		expect(mockGot).not.toHaveBeenCalled();
	});

	it('wraps a network failure in OpenFoodFactsError', async () => {
		mockGot.mockReturnValue(
			gotJsonRejects(
				new Error('getaddrinfo ENOTFOUND world.openfoodfacts.org'),
			),
		);

		await expect(
			getProductByBarcode('1111111111111', 'en'),
		).rejects.toMatchObject({
			name: 'OpenFoodFactsError',
			httpStatus: 502,
		});
	});
});
