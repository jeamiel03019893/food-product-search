import 'dotenv/config';
import { DateTime } from 'luxon';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './src/config/env.js';
import { ensureDemoUser } from './src/repository/user.repository.js';
import { router } from './src/routes/index.js';
import { errorResponse } from './src/libs/api-responses.js';

const app = express();

const corsConfig = cors({
	origin: env.frontendUrl,
	credentials: true,
});

// Middlewares
app.use(helmet());
app.use(corsConfig);
app.use(
	express.json({
		// Stripe webhook signature verification needs the exact raw
		// bytes — stashed here on every request rather than special-
		// casing the webhook route's body parser.
		verify: (req: express.Request, _res, buf) => {
			req.rawBody = buf;
		},
	}),
);
app.use(cookieParser());

// Routes
app.use('/api', router);

// Error handling
app.use(errorResponse);

// Handle unhandled promises and exceptions
process.on('unhandledRejection', (err) => {
	throw err;
});

process.on('uncaughtException', (err) => {
	console.log('\r\n');
	console.log(`${DateTime.now().toFormat('yyyy-LL-dd : HH:mm:ss')}`);
	console.log('uncaught exception');
	console.log(err);
	console.log('\n');

	process.exit(1);
});

// Start server
const start = async (): Promise<void> => {
	await ensureDemoUser();

	const successMessage = `${DateTime.now().toFormat(
		'yyyy-LL-dd : HH:mm:ss',
	)} | listening on port ${env.port}`;

	app.listen(env.port, () => console.log(successMessage));
};

start();
