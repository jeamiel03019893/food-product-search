import { Router } from 'express';
import { productRouter } from './product.routes.js';
import { authRouter } from './auth.routes.js';
import { webhookRouter } from './webhook.routes.js';
import { subscriptionRouter } from './subscription.routes.js';

const router: Router = Router();

router.use(authRouter);
router.use(productRouter);
router.use(webhookRouter);
router.use(subscriptionRouter);

export { router };
