import 'dotenv/config';
import { ensureDemoUser } from '../src/repository/user.repository.js';
import { disconnectPrisma } from '../src/libs/prisma.js';

async function main(): Promise<void> {
	const user = await ensureDemoUser();
	console.log(`Seeded demo user: ${user.email} (${user.id})`);
}

main()
	.catch((err: unknown) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => {
		void disconnectPrisma();
	});
