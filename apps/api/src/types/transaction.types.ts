import type { Transaction, TransactionType } from '../../generated/prisma/client.js';

export type { Transaction, TransactionType };

export interface CreateTransactionInput {
	userId: string;
	subscriptionId?: string;
	stripeEventId: string;
	type: TransactionType;
	amount?: number;
	currency?: string;
	metadata?: Record<string, unknown>;
}
