import { APIError, apiResponse } from '../libs/api-responses.js';
import { DEMO_USER_ID, SUPPORTED_LANGUAGES } from '../config/constants.js';
import { findActiveByUserId } from '../repository/subscription.repository.js';
import {
	createSearchHistory,
	findRecentByUserId,
} from '../repository/search-history.repository.js';
import {
	getProductByBarcode,
	searchProducts,
} from '../integration/open-food-facts.integration.js';
import { readString } from '../utils/string.js';

import type { Request, Response, NextFunction } from 'express';
import type { SupportedLanguage } from '../types/language.types.js';

const isLanguageValid = (str: unknown): str is SupportedLanguage => {
	const lang = readString(str);
	if (!lang) return false;
	return SUPPORTED_LANGUAGES.includes(lang);
};

export const searchProductsHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const { search, lang = 'en', page = 1, pageSize = 20 } = req.query;
	const searchStr = readString(search);
	const language = isLanguageValid(lang) ? lang : 'en';
	const queryOptions = { page: Number(page), pageSize: Number(pageSize) };

	if (!searchStr) {
		return apiResponse(res, 200, {
			products: [],
			page: 1,
			pageSize: 20,
			totalCount: 0,
		});
	}

	// Fire-and-forget: a slow or failing history write should never
	// delay or break the actual search response. Caught explicitly so
	// a rejection doesn't reach the process-level unhandledRejection
	// handler in server.ts, which rethrows and would crash the server.
	createSearchHistory({
		userId: DEMO_USER_ID,
		searchTerm: searchStr,
		language,
	}).catch((err: unknown) => {
		console.error('Failed to record search history', err);
	});

	try {
		const result = await searchProducts(searchStr, language, queryOptions);
		return apiResponse(res, 200, result);
	} catch (err) {
		next(err);
	}
};

export const getRecentSearchesHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const recentSearches = await findRecentByUserId(DEMO_USER_ID);
		const results = recentSearches.map((entry) => ({
			searchTerm: entry.searchTerm,
			searchedAt: entry.createdAt,
		}));
		return apiResponse(res, 200, results);
	} catch (err) {
		next(err);
	}
};

export const getProductByBarcodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const lang = isLanguageValid(req.query.lang) ? req.query.lang : 'en';
	let product;
	try {
		product = await getProductByBarcode(String(req.params.barcode), lang);
	} catch (err) {
		next(err);
	}
	if (!product) {
		return next(new APIError(404, { message: 'Product not found' }));
	}

	let hasActiveSubscription = false;
	try {
		const subscriptionDetails = await findActiveByUserId(DEMO_USER_ID);
		if (subscriptionDetails) hasActiveSubscription = true;
	} catch (err) {
		next(err);
	}

	if (hasActiveSubscription) return apiResponse(res, 200, product);
	else {
		return apiResponse(res, 200, {
			name: product.name,
			brand: product.brand,
			imageUrl: product.imageUrl,
		});
	}
};
