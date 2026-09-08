import { describe, expect, it, vi } from 'vitest';
import { APIError, apiResponse, errorResponse } from '../../src/libs/api-responses.js';

import type { Request, Response } from 'express';

const mockResponse = () => {
	const status = vi.fn();
	const json = vi.fn();
	const res = { status, json } as unknown as Response;
	status.mockReturnValue(res);
	json.mockReturnValue(res);
	return { res, status, json };
};

describe('errorResponse', () => {
	it('gives a clean {status, message} body for an APIError', () => {
		const { res, status, json } = mockResponse();
		const err = new APIError(404, { message: 'Product not found' });

		errorResponse(err, {} as Request, res, vi.fn());

		expect(status).toHaveBeenCalledWith(404);
		expect(json).toHaveBeenCalledWith({
			success: false,
			status: 404,
			error: { message: 'Product not found' },
		});
	});

	it('gives the same clean treatment to any error with a numeric httpStatus, not just APIError', () => {
		const { res, status, json } = mockResponse();
		const err = Object.assign(new Error('Upstream failed'), { httpStatus: 502 });

		errorResponse(err, {} as Request, res, vi.fn());

		expect(status).toHaveBeenCalledWith(502);
		expect(json).toHaveBeenCalledWith({
			success: false,
			status: 502,
			error: { message: 'Upstream failed' },
		});
	});

	it('falls back to a generic 500 with the stack trace for an error with no httpStatus', () => {
		const { res, status, json } = mockResponse();
		const err = new Error('unexpected');

		errorResponse(err, {} as Request, res, vi.fn());

		expect(status).toHaveBeenCalledWith(500);
		const [body] = json.mock.calls[0] as [{ status: number; error: { message: string } }];
		expect(body.status).toBe(500);
		expect(body.error.message).toContain('Error: unexpected');
	});
});

describe('apiResponse', () => {
	it('sends a success envelope with results and message', () => {
		const { res, status, json } = mockResponse();

		apiResponse(res, 200, { foo: 'bar' }, 'ok');

		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith({
			success: true,
			status: 200,
			results: { foo: 'bar' },
			message: 'ok',
		});
	});
});
