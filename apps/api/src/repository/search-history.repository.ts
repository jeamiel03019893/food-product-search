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

export const findRecentByUserId = async (
	userId: string,
	limit = 10,
): Promise<SearchHistory[]> => {
	return prisma.searchHistory.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		take: limit,
	});
};
