import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, toApiError } from '../errors';

const config = { headers: new AxiosHeaders() };

describe('toApiError', () => {
  it('returns ApiError instances unchanged', () => {
    const err = new ApiError({ message: 'x', status: 400 });
    expect(toApiError(err)).toBe(err);
  });

  it('maps network errors', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK', config);
    const result = toApiError(err);
    expect(result.isNetworkError).toBe(true);
    expect(result.code).toBe('NETWORK_ERROR');
  });

  it('maps timeouts', () => {
    const err = new AxiosError('timeout', 'ECONNABORTED', config);
    expect(toApiError(err).code).toBe('TIMEOUT');
  });

  it('reads ASP.NET ProblemDetails (title + field errors)', () => {
    const err = new AxiosError('Bad', 'ERR_BAD_REQUEST', config, null, {
      status: 400,
      statusText: 'Bad Request',
      data: { title: 'One or more validation errors occurred.', status: 400, errors: { subject: ['Required'] } },
      headers: {},
      config,
    });
    const result = toApiError(err);
    expect(result.status).toBe(400);
    expect(result.message).toBe('One or more validation errors occurred.');
    expect(result.fieldErrors).toEqual({ subject: ['Required'] });
  });

  it('reads auth `{ ok:false, error }` bodies and 429 resendIn', () => {
    const err = new AxiosError('Too many', 'ERR_BAD_REQUEST', config, null, {
      status: 429,
      statusText: 'Too Many Requests',
      data: { ok: false, error: 'Please wait before requesting another code.', resendIn: 21 },
      headers: {},
      config,
    });
    const result = toApiError(err);
    expect(result.message).toBe('Please wait before requesting another code.');
    expect(result.retryAfterSec).toBe(21);
  });

  it('flags 401 as unauthorized with a default message', () => {
    const err = new AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      },
    );
    const result = toApiError(err);
    expect(result.isUnauthorized).toBe(true);
    expect(result.message).toMatch(/session has expired/i);
  });

  it('wraps unknown errors', () => {
    expect(toApiError(new Error('boom')).message).toBe('boom');
  });
});
