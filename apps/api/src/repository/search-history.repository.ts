import { prisma } from '../libs/prisma.js';

import type {
	CreateSearchHistoryInput,
	SearchHistory,
} from '../types/search-history.types.js';

export const createSearchHistory = async (
	input: CreateSearchHistoryInput,
): Promise<SearchHistory> => {
	return prisma.searchHistory.create({
		data: {
			userId: input.userId,
			searchTerm: input.searchTerm,
			language: input.language ?? 'en',
		},
	});
};

/**
 * Returns up to `limit` of a user's most recent searches, deduplicated
 * by searchTerm — i.e. at most one row per unique searchTerm, keeping
 * only the most recent occurrence of that term (by createdAt) when the
 * same term was searched more than once. Ordered most-recent-first.
 */
export const findRecentByUserId = async (
	userId: string,
	limit = 10,
): Promise<SearchHistory[]> => {
	return prisma.searchHistory.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		distinct: ['searchTerm'],
		take: limit,
	});
};
