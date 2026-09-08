import { prisma } from '../libs/prisma.js';

import type { Prisma } from '../../generated/prisma/client.js';
import type {
	CreateTransactionInput,
	Transaction,
} from '../types/transaction.types.js';

export const createTransaction = async (
	input: CreateTransactionInput,
): Promise<Transaction> => {
	return prisma.transaction.create({
		data: {
			userId: input.userId,
			subscriptionId: input.subscriptionId,
			stripeEventId: input.stripeEventId,
			type: input.type,
			amount: input.amount,
			currency: input.currency,
			metadata: input.metadata as Prisma.InputJsonValue | undefined,
		},
	});
};

/**
 * Stripe can redeliver the same webhook event. Checking this first
 * gives webhook handling idempotency without extra bookkeeping.
 */
export const findByStripeEventId = async (
	stripeEventId: string,
): Promise<Transaction | null> => {
	return prisma.transaction.findUnique({ where: { stripeEventId } });
};
