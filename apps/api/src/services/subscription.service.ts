import { DEMO_USER_ID } from '../config/constants.js';
import { upsertSubscriptionByStripeId } from '../repository/subscription.repository.js';

import type Stripe from 'stripe';
import type { Subscription, SubscriptionStatus } from '../types/subscription.types.js';

const mapStripeStatus = (status: Stripe.Subscription.Status): SubscriptionStatus => {
	return status === 'active' || status === 'trialing' ? 'ACTIVE' : 'CANCELED';
};

const customerIdOf = (
	customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string => {
	if (!customer) return '';
	return typeof customer === 'string' ? customer : customer.id;
};

/**
 * Maps a Stripe Subscription object onto our local `Subscription` row
 * and upserts it — the single place this app writes subscription state
 * from Stripe's shape, used both by the webhook handler (events
 * originating from Stripe or the customer, e.g. a dashboard
 * cancellation or automatic renewal) and directly by any controller
 * action that already has a fresh Subscription object back from a
 * synchronous Stripe API call (e.g. cancelling from our own UI) —
 * those shouldn't have to wait on an async webhook round-trip to
 * persist a result the request already knows.
 *
 * As of this Stripe API version, `current_period_start`/`current_period_end`
 * and the price live on the subscription's first line item, not on the
 * Subscription object itself (Stripe moved these to support multi-item
 * subscriptions). This app only ever creates single-item subscriptions.
 */
export const syncSubscriptionFromStripe = async (
	subscription: Stripe.Subscription,
): Promise<Subscription | null> => {
	const item = subscription.items.data[0];
	if (!item) return null; // no line item — nothing meaningful to record

	return upsertSubscriptionByStripeId({
		userId: DEMO_USER_ID,
		stripeCustomerId: customerIdOf(subscription.customer),
		stripeSubscriptionId: subscription.id,
		priceId: item.price.id,
		status: mapStripeStatus(subscription.status),
		currentPeriodStart: new Date(item.current_period_start * 1000),
		currentPeriodEnd: new Date(item.current_period_end * 1000),
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
		canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
	});
};
