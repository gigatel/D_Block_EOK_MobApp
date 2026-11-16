import axios from 'axios';

/** Normalised error thrown by every API call. Screens only deal with this type. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly isNetworkError: boolean;
  /** Field errors from ASP.NET ProblemDetails `errors`. */
  readonly fieldErrors?: Record<string, string[]>;
  /** Seconds until retry is allowed (429 bodies may include `resendIn`). */
  readonly retryAfterSec?: number;

  constructor(params: {
    message: string;
    status?: number | null;
    code?: string;
    isNetworkError?: boolean;
    fieldErrors?: Record<string, string[]>;
    retryAfterSec?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status ?? null;
    this.code = params.code ?? 'UNKNOWN';
    this.isNetworkError = params.isNetworkError ?? false;
    this.fieldErrors = params.fieldErrors;
    this.retryAfterSec = params.retryAfterSec;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/** ASP.NET ProblemDetails or the auth endpoints' `{ ok: false, error }`. */
type ServerErrorBody = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
  error?: string;
  resendIn?: number;
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isCancel(error)) {
    return new ApiError({ message: 'Request cancelled', code: 'CANCELLED' });
  }
  if (axios.isAxiosError<ServerErrorBody>(error)) {
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED';
      return new ApiError({
        message: timedOut
          ? 'The request timed out. Please try again.'
          : 'No internet connection. Check your network and try again.',
        code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        isNetworkError: true,
      });
    }
    const { status, data } = error.response;
    return new ApiError({
      message: data?.error ?? data?.title ?? data?.detail ?? defaultMessageForStatus(status),
      status,
      code: `HTTP_${status}`,
      fieldErrors: data?.errors,
      retryAfterSec: typeof data?.resendIn === 'number' ? data.resendIn : undefined,
    });
  }
  return new ApiError({
    message: error instanceof Error ? error.message : 'Unexpected error',
  });
}

export function defaultMessageForStatus(status: number): string {
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    return 'You do not have permission to do that.';
  }
  if (status === 404) {
    return 'The requested item was not found.';
  }
  if (status === 409) {
    return 'This was changed by someone else. Please refresh.';
  }
  if (status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'Server error. Please try again later.';
  }
  return 'Something went wrong. Please try again.';
}
