import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	cancelSubscriptionHandler,
	createCheckoutSessionHandler,
	getPricesHandler,
} from '../../src/controller/subscription.controller.js';
import { DEMO_USER_EMAIL, DEMO_USER_ID } from '../../src/config/constants.js';

import type { Request, Response } from 'express';

vi.mock('../../src/config/env.js', () => ({
	env: {
		databaseUrl: 'mysql://test',
		port: 3001,
		frontendUrl: 'http://localhost:3000',
		stripeSecretKey: 'sk_test_mock',
		stripeWebhookSecret: 'whsec_mock',
		stripeProductId: 'prod_mock',
	},
}));

// vi.mock() factories are hoisted above regular declarations, so
// these need vi.hoisted() to survive being referenced inside one.
// Holding them directly (rather than re-deriving via
// vi.mocked(stripe.prices.list) etc.) also avoids eslint's
// unbound-method warning on the chained member access.
const { mockPricesList, mockSessionsCreate, mockSubscriptionsCancel } = vi.hoisted(() => ({
	mockPricesList: vi.fn(),
	mockSessionsCreate: vi.fn(),
	mockSubscriptionsCancel: vi.fn(),
}));

vi.mock('../../src/libs/stripe.js', () => ({
	stripe: {
		prices: { list: mockPricesList },
		checkout: { sessions: { create: mockSessionsCreate } },
		subscriptions: { cancel: mockSubscriptionsCancel },
	},
}));

vi.mock('../../src/repository/subscription.repository.js', () => ({
	findActiveByUserId: vi.fn(),
}));

vi.mock('../../src/services/subscription.service.js', () => ({
	syncSubscriptionFromStripe: vi.fn(),
}));

const { findActiveByUserId } = await import(
	'../../src/repository/subscription.repository.js'
);
const { syncSubscriptionFromStripe } = await import(
	'../../src/services/subscription.service.js'
);

const mockFindActiveByUserId = vi.mocked(findActiveByUserId);
const mockSyncSubscriptionFromStripe = vi.mocked(syncSubscriptionFromStripe);

const mockResponse = () => {
	const status = vi.fn();
	const json = vi.fn();
	const res = { status, json } as unknown as Response;
	status.mockReturnValue(res);
	json.mockReturnValue(res);
	return { res, status, json };
};

beforeEach(() => {
	mockPricesList.mockReset();
	mockSessionsCreate.mockReset();
	mockSubscriptionsCancel.mockReset();
	mockFindActiveByUserId.mockReset();
	mockSyncSubscriptionFromStripe.mockReset();
});

describe('getPricesHandler', () => {
	it('maps Stripe prices to the flat DTO and filters out non-recurring prices', async () => {
		mockPricesList.mockResolvedValue({
			data: [
				{
					id: 'price_monthly',
					nickname: 'Monthly',
					unit_amount: 499,
					currency: 'usd',
					recurring: { interval: 'month' },
				},
				{
					id: 'price_onetime',
					nickname: 'One-time add-on',
					unit_amount: 1000,
					currency: 'usd',
					recurring: null,
				},
			],
		});
		const { res, status, json } = mockResponse();

		await getPricesHandler({} as Request, res, vi.fn());

		expect(mockPricesList).toHaveBeenCalledWith({ product: 'prod_mock', active: true });
		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				results: [
					{
						id: 'price_monthly',
						nickname: 'Monthly',
						unitAmount: 499,
						currency: 'usd',
						interval: 'month',
					},
				],
			}),
		);
	});
});

describe('createCheckoutSessionHandler', () => {
	it('creates a subscription Checkout Session for the given priceId and returns its url', async () => {
		mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session_123' });
		const req = { body: { priceId: 'price_monthly' } } as unknown as Request;
		const { res, status, json } = mockResponse();

		await createCheckoutSessionHandler(req, res, vi.fn());

		expect(mockSessionsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: 'subscription',
				line_items: [{ price: 'price_monthly', quantity: 1 }],
				client_reference_id: DEMO_USER_ID,
				customer_email: DEMO_USER_EMAIL,
			}),
		);
		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({ results: { url: 'https://checkout.stripe.com/session_123' } }),
		);
	});

	it('calls next() with a 502 APIError when Stripe returns no url', async () => {
		mockSessionsCreate.mockResolvedValue({ url: null });
		const req = { body: { priceId: 'price_monthly' } } as unknown as Request;
		const next = vi.fn();

		await createCheckoutSessionHandler(req, mockResponse().res, next);

		const [err] = next.mock.calls[0] as [{ httpStatus: number }];
		expect(err.httpStatus).toBe(502);
	});
});

describe('cancelSubscriptionHandler', () => {
	it('cancels the active subscription via Stripe', async () => {
		mockFindActiveByUserId.mockResolvedValue({
			id: 'sub_internal_1',
			stripeSubscriptionId: 'sub_stripe_1',
		} as never);
		const canceledSubscription = { id: 'sub_stripe_1', status: 'canceled' };
		mockSubscriptionsCancel.mockResolvedValue(canceledSubscription);
		mockSyncSubscriptionFromStripe.mockResolvedValue(null);
		const { res, status, json } = mockResponse();

		await cancelSubscriptionHandler({} as Request, res, vi.fn());

		expect(mockFindActiveByUserId).toHaveBeenCalledWith(DEMO_USER_ID);
		expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_stripe_1');
		expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(canceledSubscription);
		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(expect.objectContaining({ results: { cancelled: true } }));
	});

	it('calls next() with a 404 APIError and never calls Stripe when there is no active subscription', async () => {
		mockFindActiveByUserId.mockResolvedValue(null);
		const next = vi.fn();

		await cancelSubscriptionHandler({} as Request, mockResponse().res, next);

		const [err] = next.mock.calls[0] as [{ httpStatus: number }];
		expect(err.httpStatus).toBe(404);
		expect(mockSubscriptionsCancel).not.toHaveBeenCalled();
	});
});
