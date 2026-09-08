import { prisma } from '../libs/prisma.js';

import type {
	CreateSubscriptionInput,
	Subscription,
	UpdateSubscriptionByStripeIdInput,
	UpsertSubscriptionByStripeIdInput,
} from '../types/subscription.types.js';

export const createSubscription = async (
	input: CreateSubscriptionInput,
): Promise<Subscription> => {
	return prisma.subscription.create({
		data: {
			userId: input.userId,
			stripeCustomerId: input.stripeCustomerId,
			stripeSubscriptionId: input.stripeSubscriptionId,
			priceId: input.priceId,
			status: input.status,
			currentPeriodStart: input.currentPeriodStart,
			currentPeriodEnd: input.currentPeriodEnd,
			cancelAtPeriodEnd: input.cancelAtPeriodEnd,
		},
	});
};

/**
 * Finds the demo user's currently active subscription, if any. Used
 * to gate detailed nutritional values behind an active subscription.
 */
export const findActiveByUserId = async (
	userId: string,
): Promise<Subscription | null> => {
	return prisma.subscription.findFirst({
		where: { userId, status: 'ACTIVE' },
		orderBy: { createdAt: 'desc' },
	});
};

export const updateByStripeSubscriptionId = async (
	input: UpdateSubscriptionByStripeIdInput,
): Promise<Subscription> => {
	const { stripeSubscriptionId, ...data } = input;

	return prisma.subscription.update({
		where: { stripeSubscriptionId },
		data,
	});
};

/**
 * Used by the Stripe webhook for created/updated/deleted subscription
 * events alike — see UpsertSubscriptionByStripeIdInput for why a real
 * upsert is needed rather than assuming create vs. update.
 */
export const upsertSubscriptionByStripeId = async (
	input: UpsertSubscriptionByStripeIdInput,
): Promise<Subscription> => {
	return prisma.subscription.upsert({
		where: { stripeSubscriptionId: input.stripeSubscriptionId },
		create: {
			userId: input.userId,
			stripeCustomerId: input.stripeCustomerId,
			stripeSubscriptionId: input.stripeSubscriptionId,
			priceId: input.priceId,
			status: input.status,
			currentPeriodStart: input.currentPeriodStart,
			currentPeriodEnd: input.currentPeriodEnd,
			cancelAtPeriodEnd: input.cancelAtPeriodEnd,
			canceledAt: input.canceledAt,
		},
		update: {
			priceId: input.priceId,
			status: input.status,
			currentPeriodStart: input.currentPeriodStart,
			currentPeriodEnd: input.currentPeriodEnd,
			cancelAtPeriodEnd: input.cancelAtPeriodEnd,
			canceledAt: input.canceledAt,
		},
	});
};
