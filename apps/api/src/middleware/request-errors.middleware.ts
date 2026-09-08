import { validationResult } from 'express-validator';
import { APIError } from '../libs/api-responses.js';

import type { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const errors = validationResult(req);

	if (errors.isEmpty()) return next();
	const error = errors.array()[0]; // return only the first errors

	return next(
		new APIError(400, {
			message: error.msg,
			type: error.type,
		}),
	);
};
