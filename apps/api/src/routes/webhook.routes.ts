import { Router } from 'express';
import { stripeWebhookHandler } from '../webhook/stripe.webhook.js';

export const webhookRouter: Router = Router();

webhookRouter.post('/webhooks/stripe', stripeWebhookHandler);
