import type { Subscription, SubscriptionStatus } from '../../generated/prisma/client.js';

export type { Subscription, SubscriptionStatus };

export interface CreateSubscriptionInput {
	userId: string;
	stripeCustomerId: string;
	stripeSubscriptionId: string;
	priceId: string;
	status: SubscriptionStatus;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd?: boolean;
}

export interface UpdateSubscriptionByStripeIdInput {
	stripeSubscriptionId: string;
	status?: SubscriptionStatus;
	currentPeriodStart?: Date;
	currentPeriodEnd?: Date;
	cancelAtPeriodEnd?: boolean;
	canceledAt?: Date | null;
}

/**
 * Create-or-update by stripeSubscriptionId — a subscription's first
 * webhook event isn't guaranteed to be "created" (it may arrive as
 * "updated" first, or the subscription may have been created outside
 * this app's not-yet-built Checkout flow), so this uses a real upsert
 * rather than assuming a row already exists.
 */
export interface UpsertSubscriptionByStripeIdInput extends CreateSubscriptionInput {
	canceledAt?: Date | null;
}
