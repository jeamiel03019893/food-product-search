import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stripeWebhookHandler } from '../../src/webhook/stripe.webhook.js';
import { DEMO_USER_ID } from '../../src/config/constants.js';

import type { Request, Response } from 'express';
import type Stripe from 'stripe';

vi.mock('../../src/libs/stripe.js', () => ({
	stripe: { webhooks: { constructEvent: vi.fn() } },
}));

// env.ts validates every required var (including DATABASE_URL) the
// moment it's imported, regardless of which field is actually needed
// — mocked here so importing it for stripeWebhookSecret doesn't force
// a real DATABASE_URL to exist in the test environment.
vi.mock('../../src/config/env.js', () => ({
	env: {
		databaseUrl: 'mysql://test',
		port: 3001,
		frontendUrl: 'http://localhost:3000',
		stripeSecretKey: 'sk_test_mock',
		stripeWebhookSecret: 'whsec_mock',
	},
}));

vi.mock('../../src/repository/transaction.repository.js', () => ({
	createTransaction: vi.fn(),
	findByStripeEventId: vi.fn(),
}));

vi.mock('../../src/repository/subscription.repository.js', () => ({
	upsertSubscriptionByStripeId: vi.fn(),
}));

const { stripe } = await import('../../src/libs/stripe.js');
const { createTransaction, findByStripeEventId } = await import(
	'../../src/repository/transaction.repository.js'
);
const { upsertSubscriptionByStripeId } = await import(
	'../../src/repository/subscription.repository.js'
);

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent);
const mockCreateTransaction = vi.mocked(createTransaction);
const mockFindByStripeEventId = vi.mocked(findByStripeEventId);
const mockUpsertSubscription = vi.mocked(upsertSubscriptionByStripeId);

const mockResponse = () => {
	const status = vi.fn();
	const json = vi.fn();
	const res = { status, json } as unknown as Response;
	status.mockReturnValue(res);
	json.mockReturnValue(res);
	return { res, status, json };
};

const fakeReq = (): Request => {
	return {
		rawBody: Buffer.from('payload'),
		headers: { 'stripe-signature': 't=1,v1=abc' },
	} as unknown as Request;
};

const fakeEvent = (type: string, object: Record<string, unknown>): Stripe.Event => {
	return { id: `evt_${type}`, type, data: { object } } as unknown as Stripe.Event;
};

const fakeSubscription = (overrides: Record<string, unknown> = {}) => ({
	id: 'sub_123',
	customer: 'cus_123',
	status: 'active',
	cancel_at_period_end: false,
	canceled_at: null,
	items: {
		data: [
			{
				price: { id: 'price_123' },
				current_period_start: 1700000000,
				current_period_end: 1702592000,
			},
		],
	},
	...overrides,
});

beforeEach(() => {
	mockConstructEvent.mockReset();
	mockCreateTransaction.mockReset();
	mockFindByStripeEventId.mockReset();
	mockUpsertSubscription.mockReset();
	mockFindByStripeEventId.mockResolvedValue(null);
	mockCreateTransaction.mockResolvedValue({} as never);
	mockUpsertSubscription.mockResolvedValue({ id: 'internal_sub_1' } as never);
});

describe('stripeWebhookHandler', () => {
	it('rejects with 400 when rawBody or signature is missing', async () => {
		const req = { headers: {} } as unknown as Request;
		const next = vi.fn();

		await stripeWebhookHandler(req, mockResponse().res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0] as [{ httpStatus: number }];
		expect(err.httpStatus).toBe(400);
		expect(mockConstructEvent).not.toHaveBeenCalled();
	});

	it('rejects with 400 when the Stripe signature is invalid', async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error('invalid signature');
		});
		const next = vi.fn();

		await stripeWebhookHandler(fakeReq(), mockResponse().res, next);

		const [err] = next.mock.calls[0] as [{ httpStatus: number }];
		expect(err.httpStatus).toBe(400);
	});

	it('skips processing (no repository writes) for an already-processed event', async () => {
		mockFindByStripeEventId.mockResolvedValue({} as never);
		mockConstructEvent.mockReturnValue(fakeEvent('invoice.payment_succeeded', {}));
		const { res, status } = mockResponse();

		await stripeWebhookHandler(fakeReq(), res, vi.fn());

		expect(mockCreateTransaction).not.toHaveBeenCalled();
		expect(status).toHaveBeenCalledWith(200);
	});

	it('records a CHECKOUT_COMPLETED transaction for checkout.session.completed', async () => {
		mockConstructEvent.mockReturnValue(fakeEvent('checkout.session.completed', {}));

		await stripeWebhookHandler(fakeReq(), mockResponse().res, vi.fn());

		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ userId: DEMO_USER_ID, type: 'CHECKOUT_COMPLETED' }),
		);
	});

	it('upserts an ACTIVE subscription and logs SUBSCRIPTION_CREATED for a trialing subscription', async () => {
		mockConstructEvent.mockReturnValue(
			fakeEvent('customer.subscription.created', fakeSubscription({ status: 'trialing' })),
		);

		await stripeWebhookHandler(fakeReq(), mockResponse().res, vi.fn());

		expect(mockUpsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'ACTIVE', stripeSubscriptionId: 'sub_123' }),
		);
		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'SUBSCRIPTION_CREATED', subscriptionId: 'internal_sub_1' }),
		);
	});

	it('upserts a CANCELED subscription for a past_due status', async () => {
		mockConstructEvent.mockReturnValue(
			fakeEvent('customer.subscription.updated', fakeSubscription({ status: 'past_due' })),
		);

		await stripeWebhookHandler(fakeReq(), mockResponse().res, vi.fn());

		expect(mockUpsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'CANCELED' }),
		);
	});

	it('upserts CANCELED with canceledAt for customer.subscription.deleted', async () => {
		mockConstructEvent.mockReturnValue(
			fakeEvent(
				'customer.subscription.deleted',
				fakeSubscription({ status: 'canceled', canceled_at: 1700000500 }),
			),
		);

		await stripeWebhookHandler(fakeReq(), mockResponse().res, vi.fn());

		expect(mockUpsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'CANCELED', canceledAt: new Date(1700000500 * 1000) }),
		);
		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'SUBSCRIPTION_CANCELED' }),
		);
	});

	it('records a PAYMENT_SUCCEEDED transaction with amount/currency for invoice.payment_succeeded', async () => {
		mockConstructEvent.mockReturnValue(
			fakeEvent('invoice.payment_succeeded', { amount_paid: 999, currency: 'usd' }),
		);

		await stripeWebhookHandler(fakeReq(), mockResponse().res, vi.fn());

		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'PAYMENT_SUCCEEDED', amount: 999, currency: 'usd' }),
		);
	});

	it('records a PAYMENT_FAILED transaction with amount/currency for invoice.payment_failed', async () => {
		mockConstructEvent.mockReturnValue(
			fakeEvent('invoice.payment_failed', { amount_due: 500, currency: 'usd' }),
		);

		await stripeWebhookHandler(fakeReq(), mockResponse().res, vi.fn());

		expect(mockCreateTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'PAYMENT_FAILED', amount: 500, currency: 'usd' }),
		);
	});

	it('acknowledges an unhandled event type without any repository writes', async () => {
		mockConstructEvent.mockReturnValue(fakeEvent('customer.updated', {}));
		const { res, status } = mockResponse();

		await stripeWebhookHandler(fakeReq(), res, vi.fn());

		expect(mockCreateTransaction).not.toHaveBeenCalled();
		expect(mockUpsertSubscription).not.toHaveBeenCalled();
		expect(status).toHaveBeenCalledWith(200);
	});
});
