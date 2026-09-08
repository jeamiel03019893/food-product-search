import { prisma } from '../libs/prisma.js';
import {
	DEMO_USER_EMAIL,
	DEMO_USER_ID,
	DEMO_USER_NAME,
} from '../config/constants.js';

import type { User } from '../types/user.types.js';

export const findDemoUser = async (): Promise<User | null> => {
	return prisma.user.findUnique({ where: { id: DEMO_USER_ID } });
};

/**
 * Idempotently ensures the single demo user exists. Called both from
 * prisma/seed.ts and on server boot, so the demo user is guaranteed
 * present regardless of whether `db seed` was run manually.
 */
export const ensureDemoUser = async (): Promise<User> => {
	return prisma.user.upsert({
		where: { id: DEMO_USER_ID },
		update: {},
		create: {
			id: DEMO_USER_ID,
			email: DEMO_USER_EMAIL,
			name: DEMO_USER_NAME,
		},
	});
};
