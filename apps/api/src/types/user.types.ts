import type { User } from '../../generated/prisma/client.js';

export type { User };

export interface CreateUserInput {
	id: string;
	email: string;
	name?: string;
}
