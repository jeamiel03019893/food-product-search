import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authorize } from '../../src/controller/auth.controller.js';

import type { Request, Response } from 'express';

vi.mock('../../src/repository/user.repository.js', () => ({
	findDemoUser: vi.fn(),
}));

vi.mock('../../src/repository/subscription.repository.js', () => ({
	findActiveByUserId: vi.fn(),
}));

const { findDemoUser } = await import('../../src/repository/user.repository.js');
const { findActiveByUserId } = await import(
	'../../src/repository/subscription.repository.js'
);

const mockFindDemoUser = vi.mocked(findDemoUser);
const mockFindActiveByUserId = vi.mocked(findActiveByUserId);

const mockResponse = () => {
	const status = vi.fn();
	const json = vi.fn();
	const res = { status, json } as unknown as Response;
	status.mockReturnValue(res);
	json.mockReturnValue(res);
	return { res, status, json };
};

const fakeUser = {
	id: 'demo-user',
	email: 'demo@example.com',
	name: 'Demo User',
	createdAt: new Date(),
	updatedAt: new Date(),
};

beforeEach(() => {
	mockFindDemoUser.mockReset();
	mockFindActiveByUserId.mockReset();
});

describe('authorize', () => {
	it('responds with the demo user and hasActiveSubscription: true when an active subscription exists', async () => {
		mockFindDemoUser.mockResolvedValue(fakeUser);
		mockFindActiveByUserId.mockResolvedValue({ id: 'sub_1' } as never);
		const { res, status, json } = mockResponse();

		await authorize({} as Request, res, vi.fn());

		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				results: expect.objectContaining({
					id: 'demo-user',
					email: 'demo@example.com',
					name: 'Demo User',
					hasActiveSubscription: true,
				}) as unknown,
			}),
		);
	});

	it('responds with hasActiveSubscription: false when there is no active subscription', async () => {
		mockFindDemoUser.mockResolvedValue(fakeUser);
		mockFindActiveByUserId.mockResolvedValue(null);
		const { res, json } = mockResponse();

		await authorize({} as Request, res, vi.fn());

		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				results: expect.objectContaining({ hasActiveSubscription: false }) as unknown,
			}),
		);
	});

	it('calls next() with a 404 APIError when the demo user is not found', async () => {
		mockFindDemoUser.mockResolvedValue(null);
		const next = vi.fn();

		await authorize({} as Request, mockResponse().res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0] as [{ httpStatus: number }];
		expect(err.httpStatus).toBe(404);
		expect(mockFindActiveByUserId).not.toHaveBeenCalled();
	});
});
