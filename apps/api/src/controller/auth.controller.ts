import { apiResponse, APIError } from '../libs/api-responses.js';
import { findDemoUser } from '../repository/user.repository.js';
import { findActiveByUserId } from '../repository/subscription.repository.js';

import type { Request, Response, NextFunction } from 'express';

export const authorize = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const user = await findDemoUser();
		if (!user) {
			return next(new APIError(404, { message: 'Demo user not found' }));
		}

		const activeSubscription = await findActiveByUserId(user.id);

		return apiResponse(res, 200, {
			id: user.id,
			email: user.email,
			name: user.name,
			hasActiveSubscription: Boolean(activeSubscription),
			currentPriceId: activeSubscription?.priceId ?? null,
		});
	} catch (err) {
		next(err);
	}
};
