export {};

declare global {
	namespace Express {
		interface Request {
			/**
			 * The exact raw request body bytes, captured by express.json()'s
			 * `verify` callback in server.ts. Stripe webhook signature
			 * verification needs these exact bytes — the re-serialized
			 * `req.body` would produce a different signature.
			 */
			rawBody?: Buffer;
		}
	}
}
