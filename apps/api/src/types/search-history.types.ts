import type { SearchHistory } from '../../generated/prisma/client.js';

export type { SearchHistory };

export interface CreateSearchHistoryInput {
	userId: string;
	searchTerm: string;
	language?: string;
}
