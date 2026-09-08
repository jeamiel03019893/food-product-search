import type { Request, Response, NextFunction } from 'express';

interface ErrorDetails {
	message?: string;
	[key: string]: unknown;
}

interface ApiResponse {
	success: boolean;
	status: number;
}

interface ErrorApiResponse extends ApiResponse {
	error: Record<string, unknown> | ErrorDetails | Error;
}

interface SuccessApiResponse extends ApiResponse {
	results?: unknown;
	message?: string;
}

export class APIError extends Error {
	public httpStatus: number;
	public details?: ErrorDetails | Error;

	constructor(_httpStatus: number, _errorData: ErrorDetails | Error) {
		super(_errorData.message || 'Undefined error');
		this.name = 'APIError';
		this.httpStatus = _httpStatus;
		if (_errorData) this.details = _errorData;

		// ensure proper inheritance
		Object.setPrototypeOf(this, APIError.prototype);
	}
}

interface HttpStatusError extends Error {
	httpStatus: number;
}

/**
 * Duck-typed rather than `instanceof APIError` — lets any error that
 * self-describes its HTTP status (e.g. an integration-layer error
 * that has no reason to import APIError/Express) get the clean
 * {status, message} treatment below, not just APIError itself.
 */
const hasHttpStatus = (err: unknown): err is HttpStatusError => {
	return err instanceof Error && typeof (err as { httpStatus?: unknown }).httpStatus === 'number';
};

export const errorResponse = (
	err: unknown,
	req: Request,
	res: Response,
	_next: NextFunction,
) => {
	const apiErrorResponse: ErrorApiResponse = {
		success: false,
		status: 500,
		error: { message: 'Internal Server Error' },
	};

	if (hasHttpStatus(err)) {
		apiErrorResponse.status = err.httpStatus;
		apiErrorResponse.error = { message: err.message };
	} else {
		apiErrorResponse.error.message = String((err as Error).stack);
	}

	res.status(apiErrorResponse.status).json(apiErrorResponse);
};

export const apiResponse = (
	res: Response,
	httpStatus: number,
	data?: unknown,
	message?: string,
) => {
	const response: SuccessApiResponse = {
		success: true,
		status: httpStatus,
	};

	if (data) response.results = data;
	if (message) response.message = message;

	res.status(httpStatus).json(response);
};
