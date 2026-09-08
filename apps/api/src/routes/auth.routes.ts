import { Router } from 'express';
import { authorize } from '../controller/auth.controller.js';

export const authRouter: Router = Router();

authRouter.get('/auth', authorize);
