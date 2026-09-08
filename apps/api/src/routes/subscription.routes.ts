import { Router } from 'express';
import { body } from 'express-validator';
import {
	cancelSubscriptionHandler,
	createCheckoutSessionHandler,
	getPricesHandler,
} from '../controller/subscription.controller.js';
import { handleValidationErrors } from '../middleware/request-errors.middleware.js';

export const subscriptionRouter: Router = Router();

subscriptionRouter.get('/subscriptions/prices', getPricesHandler);

subscriptionRouter.post(
	'/subscriptions/checkout',
	body('priceId').trim().notEmpty().withMessage('priceId is required'),
	handleValidationErrors,
	createCheckoutSessionHandler,
);

subscriptionRouter.post('/subscriptions/cancel', cancelSubscriptionHandler);
