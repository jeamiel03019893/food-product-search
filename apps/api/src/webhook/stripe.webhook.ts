import { stripe } from '../libs/stripe.js';
import { env } from '../config/env.js';
import { DEMO_USER_ID } from '../config/constants.js';
import { APIError, apiResponse } from '../libs/api-responses.js';
import { createTransaction, findByStripeEventId } from '../repository/transaction.repository.js';
import { syncSubscriptionFromStripe } from '../services/subscription.service.js';

import type Stripe from 'stripe';
import type { Request, Response, NextFunction } from 'express';

export const verifyStripeEvent = (payload: Buffer, signature: string): Stripe.Event => {
	return stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
};

/**
 * The idempotency check and event dispatch — the testable core,
 * independent of Express/signature concerns. Unhandled event types
 * are acknowledged (return, no error) rather than treated as failures
 * — Stripe sends far more event types than this app cares about.
 */
export const processStripeEvent = async (event: Stripe.Event): Promise<void> => {
	if (await findByStripeEventId(event.id)) return; // already processed

	switch (event.type) {
		case 'checkout.session.completed': {
			await createTransaction({
				userId: DEMO_USER_ID,
				stripeEventId: event.id,
				type: 'CHECKOUT_COMPLETED',
			});
			return;
		}

		case 'customer.subscription.created':
		case 'customer.subscription.updated': {
			const subscription = event.data.object;
			const upserted = await syncSubscriptionFromStripe(subscription);
			await createTransaction({
				userId: DEMO_USER_ID,
				subscriptionId: upserted?.id,
				stripeEventId: event.id,
				type:
					event.type === 'customer.subscription.created'
						? 'SUBSCRIPTION_CREATED'
						: 'SUBSCRIPTION_UPDATED',
			});
			return;
		}

		case 'customer.subscription.deleted': {
			// Stripe already reports status: 'canceled' (and canceled_at
			// set) on this event, so the same upsert path applies as-is.
			const subscription = event.data.object;
			const upserted = await syncSubscriptionFromStripe(subscription);
			await createTransaction({
				userId: DEMO_USER_ID,
				subscriptionId: upserted?.id,
				stripeEventId: event.id,
				type: 'SUBSCRIPTION_CANCELED',
			});
			return;
		}

		case 'invoice.payment_succeeded': {
			const invoice = event.data.object;
			await createTransaction({
				userId: DEMO_USER_ID,
				stripeEventId: event.id,
				type: 'PAYMENT_SUCCEEDED',
				amount: invoice.amount_paid,
				currency: invoice.currency,
			});
			return;
		}

		case 'invoice.payment_failed': {
			const invoice = event.data.object;
			await createTransaction({
				userId: DEMO_USER_ID,
				stripeEventId: event.id,
				type: 'PAYMENT_FAILED',
				amount: invoice.amount_due,
				currency: invoice.currency,
			});
			return;
		}

		default:
			return;
	}
};

/**
 * Verify signature -> process -> always 200 once verified. Stripe
 * retries on any non-2xx response; the idempotency check in
 * processStripeEvent makes retries (and out-of-order redelivery) safe.
 */
export const stripeWebhookHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	const signature = req.headers['stripe-signature'];

	if (!req.rawBody || typeof signature !== 'string') {
		next(new APIError(400, { message: 'Missing Stripe signature or raw body' }));
		return;
	}

	let event: Stripe.Event;
	try {
		event = verifyStripeEvent(req.rawBody, signature);
	} catch {
		next(new APIError(400, { message: 'Invalid Stripe signature' }));
		return;
	}

	try {
		await processStripeEvent(event);
		apiResponse(res, 200, { received: true });
	} catch (err) {
		next(err);
	}
};
