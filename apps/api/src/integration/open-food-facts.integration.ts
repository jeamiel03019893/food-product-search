import got from 'got';
import { readString, toCamelCase } from '../utils/string.js';

import type { SupportedLanguage } from '../types/language.types.js';
import type {
	OpenFoodFactsNutriments,
	OpenFoodFactsProduct,
	OpenFoodFactsSearchResult,
} from '../types/open-food-facts.types.js';

const SEARCH_BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PRODUCT_BASE_URL = 'https://world.openfoodfacts.org/api/v3/product';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Open Food Facts asks integrators to identify themselves via
 * User-Agent (https://openfoodfacts.github.io/openfoodfacts-server/api/).
 */
const USER_AGENT = 'FoodProductSearchAssessment';

/**
 * OFF's own language codes happen to match ours 1:1, but this map is
 * kept explicit and typed (rather than passing `language` straight
 * through) so an unsupported language can never silently reach OFF.
 */
const OFF_LANGUAGE_CODE: Record<SupportedLanguage, string> = {
	en: 'en',
	de: 'de',
	fr: 'fr',
};

export class OpenFoodFactsError extends Error {
	public readonly httpStatus: number;

	constructor(
		message: string,
		options?: { cause?: unknown; httpStatus?: number },
	) {
		super(message, { cause: options?.cause });
		this.name = 'OpenFoodFactsError';
		this.httpStatus = options?.httpStatus ?? 502;
		Object.setPrototypeOf(this, OpenFoodFactsError.prototype);
	}
}

// --- Raw Open Food Facts response shapes (only the fields we read) ---
interface RawOpenFoodFactsNutriments {
	[localizedField: string]: unknown;
}

interface RawOpenFoodFactsProduct {
	code?: unknown;
	brands?: unknown;
	image_url?: unknown;
	image_front_url?: unknown;
	nutriments?: RawOpenFoodFactsNutriments;
	[localizedField: string]: unknown;
}

interface RawOpenFoodFactsSearchResponse {
	count?: unknown;
	page?: unknown;
	page_size?: unknown;
	products?: RawOpenFoodFactsProduct[];
}

interface RawOpenFoodFactsProductResponse {
	status?: unknown;
	product?: RawOpenFoodFactsProduct;
}

// --- Normalization helpers ---
const readNumber = (value: unknown): number | null => {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

/**
 * Open Food Facts stores per-language fields as `${baseKey}_${lc}`
 * alongside a generic `${baseKey}`. Prefers the localized value,
 * falling back to the generic one, then `null`.
 */
const readLocalizedField = (
	raw: RawOpenFoodFactsProduct,
	baseKey: string,
	lc: string,
): string | null => {
	return readString(raw[`${baseKey}_${lc}`]) ?? readString(raw[baseKey]);
};

const readImageUrl = (raw: RawOpenFoodFactsProduct): string | null => {
	return readString(raw.image_front_url) ?? readString(raw.image_url);
};

const normalizeNutriments = (
	raw: RawOpenFoodFactsNutriments | undefined,
): OpenFoodFactsNutriments | null => {
	if (!raw) return null;

	const nutriments: Record<string, string | number | null> = {};
	for (const key of Object.keys(raw)) {
		if (readString(raw[key])) {
			nutriments[toCamelCase(key)] = readString(raw[key]);
		} else nutriments[toCamelCase(key)] = readNumber(raw[key]);
	}

	const hasAnyValue = Object.values(nutriments).some(
		(value) => value !== null,
	);
	return hasAnyValue ? nutriments : null;
};

/**
 * Returns `null` for entries with no barcode — without one there's no
 * way to identify the product, so it's dropped rather than surfaced
 * as a broken result. Every other field degrades to `null` instead.
 */
const normalizeProduct = (
	raw: RawOpenFoodFactsProduct,
	lc: string,
): OpenFoodFactsProduct | null => {
	const barcode = readString(raw.code);
	if (!barcode) return null;

	return {
		barcode,
		name: readLocalizedField(raw, 'product_name', lc),
		brand: readString(raw.brands),
		imageUrl: readImageUrl(raw),
		ingredientsText: readLocalizedField(raw, 'ingredients_text', lc),
		nutriments: normalizeNutriments(raw.nutriments),
	};
};

// --- HTTP ---
const apiRequest = async <T>(
	endpoint: string,
	searchParams: Record<string, string | number>,
): Promise<T> => {
	try {
		return await got(endpoint, {
			searchParams,
			headers: { 'User-Agent': USER_AGENT },
			timeout: { request: REQUEST_TIMEOUT_MS },
			retry: { limit: 0 },
		}).json<T>();
	} catch (err) {
		throw new OpenFoodFactsError(
			`Open Food Facts request failed: ${err instanceof Error ? err.message : String(err)}`,
			{ cause: err },
		);
	}
};

interface HttpErrorLike {
	response?: { statusCode?: number };
}

/**
 * Checked structurally rather than via `instanceof got.HTTPError` —
 * keeps this decoupled from got's internal error-class shapes (same
 * reasoning as the test mocks not constructing them either).
 *
 * `apiRequest` always wraps whatever got throws into a fresh
 * `OpenFoodFactsError` (with the original attached as `.cause`), so
 * the `response.statusCode` a real 404 carries lives one level down —
 * check `.cause` first, falling back to the error itself for a raw,
 * unwrapped error.
 */
const isHttpNotFound = (err: unknown): boolean => {
	const candidate =
		err instanceof Error && err.cause !== undefined ? err.cause : err;
	return (candidate as HttpErrorLike)?.response?.statusCode === 404;
};

// --- Public API ---

export const searchProducts = async (
	searchTerm: string,
	language: SupportedLanguage,
	options?: { page?: number; pageSize?: number },
): Promise<OpenFoodFactsSearchResult> => {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 20;

	// An empty search term isn't a keyword filter to send to OFF — OFF's
	// search API has no defined "list everything" behavior for it. It
	// means "no results yet" (e.g. a default/list view before the user
	// has typed anything), so short-circuit locally instead of guessing
	// what OFF would do with `search_terms=`.
	if (searchTerm.trim().length === 0) {
		return { products: [], page, pageSize, totalCount: 0 };
	}

	const lc = OFF_LANGUAGE_CODE[language];
	const searchParams = {
		search_terms: searchTerm,
		json: 1,
		page,
		page_size: pageSize,
		lc,
	};

	const raw = await apiRequest<RawOpenFoodFactsSearchResponse>(
		SEARCH_BASE_URL,
		searchParams,
	);

	const products = (raw.products ?? [])
		.map((product) => normalizeProduct(product, lc))
		.filter((product): product is OpenFoodFactsProduct => product !== null);

	return {
		products,
		page: readNumber(raw.page) ?? page,
		pageSize: readNumber(raw.page_size) ?? pageSize,
		totalCount: readNumber(raw.count) ?? products.length,
	};
};

export const getProductByBarcode = async (
	barcode: string,
	language: SupportedLanguage,
): Promise<OpenFoodFactsProduct | null> => {
	if (barcode.trim().length === 0) {
		throw new OpenFoodFactsError('barcode must not be empty', {
			httpStatus: 400,
		});
	}

	const lc = OFF_LANGUAGE_CODE[language];
	const endpoint = `${PRODUCT_BASE_URL}/${encodeURIComponent(barcode)}.json`;
	let raw: RawOpenFoodFactsProductResponse;

	try {
		raw = await apiRequest<RawOpenFoodFactsProductResponse>(endpoint, {
			lc,
		});
	} catch (err) {
		if (isHttpNotFound(err)) return null;
		throw new OpenFoodFactsError(
			`Open Food Facts request failed: ${err instanceof Error ? err.message : String(err)}`,
			{ cause: err },
		);
	}

	if (readString(raw.status) !== 'success' || !raw.product) {
		return null;
	}

	return normalizeProduct(raw.product, lc);
};
