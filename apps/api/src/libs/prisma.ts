import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client.js';
import { env } from '../config/env.js';

/**
 * Prisma 7 requires a driver adapter rather than a plain connection
 * string on the datasource block. `@prisma/adapter-mariadb` speaks
 * the MySQL wire protocol (its `provider` is "mysql"), so it's the
 * adapter Prisma documents for MySQL, not just MariaDB.
 */
const adapter = new PrismaMariaDb(env.databaseUrl);

/**
 * Single shared PrismaClient instance for the whole process. Prisma
 * recommends exactly one client per app rather than one per module.
 */
export const prisma = new PrismaClient({ adapter });

export const disconnectPrisma = async (): Promise<void> => {
	await prisma.$disconnect();
};
