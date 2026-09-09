import { Router } from 'express';
import { param, query } from 'express-validator';
import {
	getProductByBarcodeHandler,
	getRecentSearchesHandler,
	searchProductsHandler,
} from '../controller/product.controller.js';
import { handleValidationErrors } from '../middleware/request-errors.middleware.js';

export const productRouter: Router = Router();

productRouter.get(
	'/products',
	// No .notEmpty() — an empty/missing search term is valid and lists
	// products (name/brand/imageUrl) rather than filtering by keyword.
	query('search').optional().trim(),
	handleValidationErrors,
	searchProductsHandler,
);

productRouter.get('/products/recent-searches', getRecentSearchesHandler);

productRouter.get(
	'/product/:barcode',
	param('barcode')
		.trim()
		.notEmpty()
		.isNumeric()
		.withMessage('barcode must be a numeric code'),
	handleValidationErrors,
	getProductByBarcodeHandler,
);
