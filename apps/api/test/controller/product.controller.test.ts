import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getProductByBarcodeHandler,
	getRecentSearchesHandler,
	searchProductsHandler,
} from '../../src/controller/product.controller.js';
import { OpenFoodFactsError } from '../../src/integration/open-food-facts.integration.js';
import { DEMO_USER_ID } from '../../src/config/constants.js';

import type { Request, Response } from 'express';

vi.mock('../../src/integration/open-food-facts.integration.js', async () => {
	const actual = await vi.importActual<
		typeof import('../../src/integration/open-food-facts.integration.js')
	>('../../src/integration/open-food-facts.integration.js');
	return {
		...actual,
		searchProducts: vi.fn(),
		getProductByBarcode: vi.fn(),
	};
});

vi.mock('../../src/repository/search-history.repository.js', () => ({
	createSearchHistory: vi.fn(),
	findRecentByUserId: vi.fn(),
}));

// Not under test here (getProductByBarcodeHandler's subscription check
// is a separate, already-flagged issue) — mocked purely so importing
// product.controller.ts doesn't transitively construct a real Prisma
// client (subscription.repository.js -> libs/prisma.js), which
// requires DATABASE_URL just to load, not just to run.
vi.mock('../../src/repository/subscription.repository.js', () => ({
	findActiveByUserId: vi.fn(),
}));

const { searchProducts, getProductByBarcode } = await import(
	'../../src/integration/open-food-facts.integration.js'
);
const { createSearchHistory, findRecentByUserId } = await import(
	'../../src/repository/search-history.repository.js'
);
const mockSearchProducts = vi.mocked(searchProducts);
const mockGetProductByBarcode = vi.mocked(getProductByBarcode);
const mockCreateSearchHistory = vi.mocked(createSearchHistory);
const mockFindRecentByUserId = vi.mocked(findRecentByUserId);

const mockResponse = () => {
	const status = vi.fn();
	const json = vi.fn();
	const res = { status, json } as unknown as Response;
	status.mockReturnValue(res);
	json.mockReturnValue(res);
	return { res, status, json };
};

beforeEach(() => {
	mockSearchProducts.mockReset();
	mockGetProductByBarcode.mockReset();
	mockCreateSearchHistory.mockReset();
	mockFindRecentByUserId.mockReset();
	mockCreateSearchHistory.mockResolvedValue({
		id: 'sh_1',
		userId: DEMO_USER_ID,
		searchTerm: '',
		language: 'en',
		createdAt: new Date(),
	});
});

describe('searchProductsHandler', () => {
	it('responds with the search result on success', async () => {
		const result = { products: [], page: 1, pageSize: 20, totalCount: 0 };
		mockSearchProducts.mockResolvedValue(result);
		const req = {
			query: { search: 'cookies', lang: 'fr' },
		} as unknown as Request;
		const { res, status } = mockResponse();
		const next = vi.fn();

		await searchProductsHandler(req, res, next);

		expect(mockSearchProducts).toHaveBeenCalledWith('cookies', 'fr', { page: 1, pageSize: 20 });
		expect(status).toHaveBeenCalledWith(200);
		expect(next).not.toHaveBeenCalled();
	});

	it('defaults to "en" when lang is missing or unsupported', async () => {
		mockSearchProducts.mockResolvedValue({
			products: [],
			page: 1,
			pageSize: 20,
			totalCount: 0,
		});
		const req = {
			query: { search: 'cookies', lang: 'xx' },
		} as unknown as Request;

		await searchProductsHandler(req, mockResponse().res, vi.fn());

		expect(mockSearchProducts).toHaveBeenCalledWith('cookies', 'en', { page: 1, pageSize: 20 });
	});

	it('passes an upstream OpenFoodFactsError straight to next() unwrapped', async () => {
		const err = new OpenFoodFactsError('boom', { httpStatus: 502 });
		mockSearchProducts.mockRejectedValue(err);
		const req = { query: { search: 'cookies' } } as unknown as Request;
		const next = vi.fn();

		await searchProductsHandler(req, mockResponse().res, next);

		expect(next).toHaveBeenCalledWith(err);
	});

	it('records the search in SearchHistory for a non-empty search term', async () => {
		mockSearchProducts.mockResolvedValue({
			products: [],
			page: 1,
			pageSize: 20,
			totalCount: 0,
		});
		const req = {
			query: { search: 'cookies', lang: 'fr' },
		} as unknown as Request;

		await searchProductsHandler(req, mockResponse().res, vi.fn());

		expect(mockCreateSearchHistory).toHaveBeenCalledWith({
			userId: DEMO_USER_ID,
			searchTerm: 'cookies',
			language: 'fr',
		});
	});

	it('does not record search history for an empty search term', async () => {
		const req = { query: { search: '' } } as unknown as Request;

		await searchProductsHandler(req, mockResponse().res, vi.fn());

		expect(mockCreateSearchHistory).not.toHaveBeenCalled();
		expect(mockSearchProducts).not.toHaveBeenCalled();
	});

	it('does not fail the response when the search history write rejects', async () => {
		mockCreateSearchHistory.mockRejectedValue(new Error('db unavailable'));
		mockSearchProducts.mockResolvedValue({
			products: [],
			page: 1,
			pageSize: 20,
			totalCount: 0,
		});
		const req = { query: { search: 'cookies' } } as unknown as Request;
		const { res, status } = mockResponse();
		const next = vi.fn();

		await searchProductsHandler(req, res, next);

		expect(status).toHaveBeenCalledWith(200);
		expect(next).not.toHaveBeenCalled();
	});
});

describe('getProductByBarcodeHandler', () => {
	it('responds with the product when found', async () => {
		const product = {
			barcode: '123',
			name: 'Cookies',
			brand: null,
			imageUrl: null,
			ingredientsText: null,
			nutriments: null,
		};
		mockGetProductByBarcode.mockResolvedValue(product);
		const req = {
			params: { barcode: '123' },
			query: {},
		} as unknown as Request;
		const { res, status } = mockResponse();
		const next = vi.fn();

		await getProductByBarcodeHandler(req, res, next);

		expect(mockGetProductByBarcode).toHaveBeenCalledWith('123', 'en');
		expect(status).toHaveBeenCalledWith(200);
		expect(next).not.toHaveBeenCalled();
	});

	it('calls next() with a 404 APIError when the product is not found', async () => {
		mockGetProductByBarcode.mockResolvedValue(null);
		const req = {
			params: { barcode: '000' },
			query: {},
		} as unknown as Request;
		const next = vi.fn();

		await getProductByBarcodeHandler(req, mockResponse().res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0] as [{ httpStatus: number }];
		expect(err.httpStatus).toBe(404);
	});

	it('passes an upstream OpenFoodFactsError straight to next() unwrapped', async () => {
		const err = new OpenFoodFactsError('boom', { httpStatus: 502 });
		mockGetProductByBarcode.mockRejectedValue(err);
		const req = {
			params: { barcode: '123' },
			query: {},
		} as unknown as Request;
		const next = vi.fn();

		await getProductByBarcodeHandler(req, mockResponse().res, next);

		expect(next).toHaveBeenCalledWith(err);
	});
});

describe('getRecentSearchesHandler', () => {
	it('responds with the deduplicated recent searches mapped to searchTerm/searchedAt', async () => {
		const createdAt1 = new Date('2026-09-01T00:00:00.000Z');
		const createdAt2 = new Date('2026-09-02T00:00:00.000Z');
		mockFindRecentByUserId.mockResolvedValue([
			{
				id: 'sh_2',
				userId: DEMO_USER_ID,
				searchTerm: 'cookies',
				language: 'en',
				createdAt: createdAt2,
			},
			{
				id: 'sh_1',
				userId: DEMO_USER_ID,
				searchTerm: 'chips',
				language: 'en',
				createdAt: createdAt1,
			},
		]);
		const req = {} as unknown as Request;
		const { res, status, json } = mockResponse();
		const next = vi.fn();

		await getRecentSearchesHandler(req, res, next);

		expect(mockFindRecentByUserId).toHaveBeenCalledWith(DEMO_USER_ID);
		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				results: [
					{ searchTerm: 'cookies', searchedAt: createdAt2 },
					{ searchTerm: 'chips', searchedAt: createdAt1 },
				],
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it('responds with an empty list when the user has no search history', async () => {
		mockFindRecentByUserId.mockResolvedValue([]);
		const req = {} as unknown as Request;
		const { res, status, json } = mockResponse();
		const next = vi.fn();

		await getRecentSearchesHandler(req, res, next);

		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({ results: [] }),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it('calls next() with the error when the repository call rejects', async () => {
		const err = new Error('db unavailable');
		mockFindRecentByUserId.mockRejectedValue(err);
		const req = {} as unknown as Request;
		const next = vi.fn();

		await getRecentSearchesHandler(req, mockResponse().res, next);

		expect(next).toHaveBeenCalledWith(err);
	});
});
