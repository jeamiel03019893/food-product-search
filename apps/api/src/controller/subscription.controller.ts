import { stripe } from '../libs/stripe.js';
import { env } from '../config/env.js';
import { DEMO_USER_EMAIL, DEMO_USER_ID } from '../config/constants.js';
import { APIError, apiResponse } from '../libs/api-responses.js';
import { findActiveByUserId } from '../repository/subscription.repository.js';
import { syncSubscriptionFromStripe } from '../services/subscription.service.js';

import type { Request, Response, NextFunction } from 'express';

export const getPricesHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const prices = await stripe.prices.list({
			product: env.stripeProductId,
			active: true,
		});

		// This app only ever offers a recurring subscription (see the
		// project's technical decisions) — a one-time price left active on
		// the same Stripe product by mistake would otherwise leak into the
		// picker and fail at checkout, since createCheckoutSessionHandler
		// always uses mode: 'subscription'.
		const results = prices.data
			.filter((price) => price.recurring)
			.map((price) => ({
				id: price.id,
				nickname: price.nickname,
				unitAmount: price.unit_amount,
				currency: price.currency,
				interval: price.recurring?.interval ?? price.type,
			}));

		return apiResponse(res, 200, results);
	} catch (err) {
		next(err);
	}
};

export const createCheckoutSessionHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { priceId } = req.body;
		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [{ price: priceId, quantity: 1 }],
			client_reference_id: DEMO_USER_ID,
			customer_email: DEMO_USER_EMAIL,
			success_url: `${env.frontendUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${env.frontendUrl}?checkout=cancelled`,
		});

		if (!session.url) {
			return next(
				new APIError(502, {
					message: 'Stripe did not return a checkout URL',
				}),
			);
		}

		return apiResponse(res, 200, { url: session.url });
	} catch (err) {
		next(err);
	}
};

export const cancelSubscriptionHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const subscription = await findActiveByUserId(DEMO_USER_ID);
		if (!subscription) {
			return next(
				new APIError(404, {
					message: 'No active subscription to cancel',
				}),
			);
		}

		const canceled = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

		// Persist the result directly from Stripe's synchronous response
		// rather than waiting on the customer.subscription.deleted webhook
		// to arrive — this is our own server-initiated action, and the
		// webhook (still processed as usual, harmlessly idempotent here)
		// exists for events we don't otherwise learn about synchronously,
		// not for confirming our own API calls.
		await syncSubscriptionFromStripe(canceled);

		return apiResponse(res, 200, { cancelled: true });
	} catch (err) {
		next(err);
	}
};
