/**
 * Loads and validates required environment variables once, at import
 * time, so the process fails fast on boot instead of throwing deep
 * inside a request handler.
 */

const requireEnv = (name: string): string => {
	const value = process.env[name];

	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
};

export interface Env {
	readonly databaseUrl: string;
	readonly port: number;
	readonly frontendUrl: string;
	readonly stripeSecretKey: string;
	readonly stripeWebhookSecret: string;
	readonly stripeProductId: string;
}

export const env: Env = {
	databaseUrl: requireEnv('DATABASE_URL'),
	port: Number(process.env.PORT) || 3001,
	frontendUrl: requireEnv('FRONTEND_URL'),
	stripeSecretKey: requireEnv('STRIPE_SECRET_KEY'),
	stripeWebhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
	stripeProductId: requireEnv('STRIPE_PRODUCT_ID'),
};
