import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, ApiError, formatDryRun, getExitCode, downloadFile } from '../src/client.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('client', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Suppress spinner by setting non-TTY
    Object.defineProperty(process.stdin, 'isTTY', { value: false, writable: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true, configurable: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it('should make successful GET request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    const result = await request(
      { method: 'GET', path: '/profile', token: 'test-token' },
      { quiet: true },
    );
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data: { id: 1 } });
  });

  it('should throw ApiError on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json', 'x-request-id': 'req123' }),
      json: () => Promise.resolve({ error: 'invalid_token', error_description: 'Token is invalid' }),
    });

    try {
      await request({ method: 'GET', path: '/profile', token: 'bad-token' }, { quiet: true });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.details.code).toBe(401);
      expect(apiError.details.type).toBe('PACHCA_AUTH_ERROR');
      expect(apiError.details.request_id).toBe('req123');
    }
  });

  it('should handle 302 redirect', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 302,
      headers: new Headers({ location: 'https://s3.amazonaws.com/file.zip' }),
    });

    const result = await request(
      { method: 'GET', path: '/exports/1', token: 'test', isRedirect: true },
      { quiet: true },
    );
    expect(result.status).toBe(302);
    expect((result.data as Record<string, unknown>).url).toBe('https://s3.amazonaws.com/file.zip');
  });

  it('should use redirect: manual when isRedirect is true', async () => {
    let capturedRedirect: string | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedRedirect = opts?.redirect;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: {} }),
      });
    });

    await request({ method: 'GET', path: '/test', token: 'test', isRedirect: true }, { quiet: true });
    expect(capturedRedirect).toBe('manual');
  });

  it('should use redirect: follow by default', async () => {
    let capturedRedirect: string | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedRedirect = opts?.redirect;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: {} }),
      });
    });

    await request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true });
    expect(capturedRedirect).toBe('follow');
  });

  it('should retry on 429 with Retry-After', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': '0' }),
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'success' }),
      });
    });

    const result = await request(
      { method: 'GET', path: '/test', token: 'test' },
      { quiet: true },
    );
    expect(result.data).toEqual({ data: 'success' });
    expect(callCount).toBe(2);
  });

  it('should retry on 503 with exponential backoff', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ errors: [{ message: 'Unavailable' }] }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'recovered' }),
      });
    });

    const result = await request(
      { method: 'GET', path: '/test', token: 'test' },
      { quiet: true },
    );
    expect(result.data).toEqual({ data: 'recovered' });
    expect(callCount).toBe(3);
  });

  it('should not retry on 400 errors', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ errors: [{ message: 'Bad request' }] }),
      });
    });

    await expect(
      request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true }),
    ).rejects.toThrow(ApiError);
    expect(callCount).toBe(1);
  });

  it('should not retry on 404 errors', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ errors: [{ message: 'Not found' }] }),
      });
    });

    await expect(
      request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true }),
    ).rejects.toThrow(ApiError);
    expect(callCount).toBe(1);
  });

  it('should not retry when noRetry=true', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ errors: [{ message: 'Unavailable' }] }),
      });
    });

    await expect(
      request({ method: 'GET', path: '/test', token: 'test', noRetry: true }, { quiet: true }),
    ).rejects.toThrow(ApiError);
    expect(callCount).toBe(1);
  });

  it('should handle timeout', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      // Simulate abort
      return new Promise((_resolve, reject) => {
        if (opts?.signal) {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }
        // Simulate triggering the abort
        setTimeout(() => {
          if (opts?.signal?.aborted) {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          }
        }, 10);
      });
    });

    await expect(
      request({ method: 'GET', path: '/test', token: 'test', timeout: 0.001 }, { quiet: true }),
    ).rejects.toThrow('timed out');
  });

  it('should use PACHCA_TIMEOUT env when no explicit timeout', async () => {
    process.env.PACHCA_TIMEOUT = '5';
    let capturedSignal: AbortSignal | undefined;

    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedSignal = opts?.signal;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: {} }),
      });
    });

    await request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true });
    // The request should have completed — signal should not be aborted
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal!.aborted).toBe(false);
  });

  it('should throw PACHCA_TIMEOUT_ERROR on abort', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts?.signal) {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }
        setTimeout(() => {
          if (opts?.signal?.aborted) {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          }
        }, 10);
      });
    });

    try {
      await request({ method: 'GET', path: '/test', token: 'test', timeout: 0.001 }, { quiet: true });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).details.type).toBe('PACHCA_TIMEOUT_ERROR');
    }
  });

  it('should throw PACHCA_NETWORK_ERROR on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    try {
      await request({ method: 'GET', path: '/test', token: 'test', noRetry: true }, { quiet: true });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).details.type).toBe('PACHCA_NETWORK_ERROR');
    }
  });

  it('should parse OAuthError format (error + error_description)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({ 'content-type': 'application/json', 'x-request-id': 'req_abc' }),
      json: () => Promise.resolve({ error: 'insufficient_scope', error_description: 'Missing scope' }),
    });

    try {
      await request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true });
      expect.unreachable('Should have thrown');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.details.type).toBe('PACHCA_AUTH_ERROR');
      expect(apiError.details.message).toBe('insufficient_scope');
      expect(apiError.details.request_id).toBe('req_abc');
    }
  });

  it('should parse ApiError format (errors array)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ errors: [{ message: 'Access denied for export' }] }),
    });

    try {
      await request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true });
      expect.unreachable('Should have thrown');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.details.type).toBe('PACHCA_API_ERROR');
      expect(apiError.details.error).toBe('Access denied for export');
    }
  });

  it('should handle 204 No Content', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const result = await request(
      { method: 'DELETE', path: '/messages/1', token: 'test' },
      { quiet: true },
    );
    expect(result.status).toBe(204);
    expect(result.data).toBeNull();
  });

  it('should send FormData without manually setting Content-Type', async () => {
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: unknown = null;

    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedHeaders = opts?.headers ?? {};
      capturedBody = opts?.body;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: { id: 1 } }),
      });
    });

    const formData = new FormData();
    formData.append('message', 'hello');

    const result = await request(
      { method: 'POST', path: '/uploads', token: 'test-token', formData },
      { quiet: true },
    );

    expect(result.status).toBe(200);
    expect(capturedBody).toBeInstanceOf(FormData);
    // Content-Type must NOT be set manually — fetch adds it with the correct boundary
    expect(capturedHeaders['Content-Type']).toBeUndefined();
  });

  it('should build correct URL with query params', async () => {
    let capturedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: [] }),
      });
    });

    await request(
      { method: 'GET', path: '/messages', token: 'test', query: { chat_id: 123, per: 10 } },
      { quiet: true },
    );

    expect(capturedUrl).toContain('/messages');
    expect(capturedUrl).toContain('chat_id=123');
    expect(capturedUrl).toContain('per=10');
  });

  it('should skip undefined query values', async () => {
    let capturedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: [] }),
      });
    });

    await request(
      { method: 'GET', path: '/messages', token: 'test', query: { chat_id: 123, cursor: undefined } },
      { quiet: true },
    );

    expect(capturedUrl).toContain('chat_id=123');
    expect(capturedUrl).not.toContain('cursor');
  });

  describe('formatDryRun', () => {
    it('should format dry run as string', () => {
      const result = formatDryRun(
        { method: 'POST', path: '/messages', token: 'test', body: { message: { content: 'hi' } } },
        false,
      );
      expect(typeof result).toBe('string');
      expect(result).toContain('POST');
      expect(result).toContain('/messages');
    });

    it('should format dry run as JSON', () => {
      const result = formatDryRun(
        { method: 'GET', path: '/profile', token: 'test' },
        true,
      );
      expect(typeof result).toBe('object');
      expect((result as Record<string, unknown>).dry_run).toBe(true);
      expect((result as Record<string, unknown>).method).toBe('GET');
    });

    it('should mask token in dry run output', () => {
      const result = formatDryRun(
        { method: 'GET', path: '/profile', token: 'super-secret-token-12345' },
        false,
      ) as string;
      expect(result).not.toContain('super-secret-token-12345');
      expect(result).toContain('••••••••');
    });

    it('should include body in JSON dry run', () => {
      const body = { message: { chat_id: 123, content: 'test' } };
      const result = formatDryRun(
        { method: 'POST', path: '/messages', token: 'test', body },
        true,
      ) as Record<string, unknown>;
      expect(result.body).toEqual(body);
    });

    it('should include query params in URL', () => {
      const result = formatDryRun(
        { method: 'GET', path: '/messages', token: 'test', query: { chat_id: '123' } },
        false,
      ) as string;
      expect(result).toContain('chat_id=123');
    });
  });

  describe('getExitCode', () => {
    it('should return 3 for auth errors', () => {
      expect(getExitCode(new ApiError({ error: 'Unauthorized', code: 401, type: 'PACHCA_AUTH_ERROR' }))).toBe(3);
    });

    it('should return 3 for auth login errors', () => {
      expect(getExitCode(new ApiError({ error: 'Invalid token', code: 401, type: 'PACHCA_AUTH_LOGIN_ERROR' }))).toBe(3);
    });

    it('should return 4 for not found', () => {
      expect(getExitCode(new ApiError({ error: 'Not found', code: 404, type: 'PACHCA_API_ERROR' }))).toBe(4);
    });

    it('should return 2 for validation errors', () => {
      expect(getExitCode(new ApiError({ error: 'Invalid', code: null, type: 'PACHCA_VALIDATION_ERROR' }))).toBe(2);
    });

    it('should return 2 for usage errors', () => {
      expect(getExitCode(new ApiError({ error: 'Bad usage', code: null, type: 'PACHCA_USAGE_ERROR' }))).toBe(2);
    });

    it('should return 1 for other errors', () => {
      expect(getExitCode(new ApiError({ error: 'Server error', code: 500, type: 'PACHCA_API_ERROR' }))).toBe(1);
    });

    it('should return 1 for network errors', () => {
      expect(getExitCode(new ApiError({ error: 'Network error', code: null, type: 'PACHCA_NETWORK_ERROR' }))).toBe(1);
    });

    it('should return 1 for timeout errors', () => {
      expect(getExitCode(new ApiError({ error: 'Timeout', code: null, type: 'PACHCA_TIMEOUT_ERROR' }))).toBe(1);
    });
  });

  describe('PACHCA_API_URL', () => {
    it('should use default base URL when PACHCA_API_URL is not set', async () => {
      delete process.env.PACHCA_API_URL;
      let capturedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: {} }),
        });
      });

      await request({ method: 'GET', path: '/profile', token: 'test' }, { quiet: true });
      expect(capturedUrl).toBe('https://api.pachca.com/api/shared/v1/profile');
    });

    it('should use PACHCA_API_URL when set', async () => {
      process.env.PACHCA_API_URL = 'https://custom.example.com/api/v1';
      let capturedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: {} }),
        });
      });

      await request({ method: 'GET', path: '/profile', token: 'test' }, { quiet: true });
      expect(capturedUrl).toBe('https://custom.example.com/api/v1/profile');
    });

    it('should strip trailing slash from PACHCA_API_URL', async () => {
      process.env.PACHCA_API_URL = 'https://custom.example.com/api/v1/';
      let capturedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: {} }),
        });
      });

      await request({ method: 'GET', path: '/profile', token: 'test' }, { quiet: true });
      expect(capturedUrl).toBe('https://custom.example.com/api/v1/profile');
    });

    it('should fall back to default on invalid PACHCA_API_URL', async () => {
      process.env.PACHCA_API_URL = 'not-a-url';
      let capturedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: {} }),
        });
      });

      await request({ method: 'GET', path: '/profile', token: 'test' }, { quiet: true });
      expect(capturedUrl).toBe('https://api.pachca.com/api/shared/v1/profile');
    });

    it('should allow http for localhost', async () => {
      process.env.PACHCA_API_URL = 'http://localhost:3000/api/v1';
      let capturedUrl = '';
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: {} }),
        });
      });

      await request({ method: 'GET', path: '/profile', token: 'test' }, { quiet: true });
      expect(capturedUrl).toBe('http://localhost:3000/api/v1/profile');
      // Should NOT warn about non-HTTPS for localhost
      const warnings = stderrSpy.mock.calls.map((c) => String(c[0]));
      expect(warnings.some((w) => w.includes('non-HTTPS'))).toBe(false);
      stderrSpy.mockRestore();
    });

    it('should warn on non-HTTPS for non-localhost', async () => {
      process.env.PACHCA_API_URL = 'http://example.com/api/v1';
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: {} }),
        });
      });

      await request({ method: 'GET', path: '/profile', token: 'test' }, { quiet: true });
      const warnings = stderrSpy.mock.calls.map((c) => String(c[0]));
      expect(warnings.some((w) => w.includes('non-HTTPS'))).toBe(true);
      stderrSpy.mockRestore();
    });
  });

  it('should not produce NaN timeout when PACHCA_TIMEOUT is unset', async () => {
    delete process.env.PACHCA_TIMEOUT;
    let capturedSignal: AbortSignal | undefined;

    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedSignal = opts?.signal;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: {} }),
      });
    });

    await request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true });
    expect(capturedSignal).toBeDefined();
    // Signal must NOT be immediately aborted (NaN timeout would cause instant abort)
    expect(capturedSignal!.aborted).toBe(false);
  });

  it('should not produce NaN timeout when PACHCA_TIMEOUT is empty string', async () => {
    process.env.PACHCA_TIMEOUT = '';
    let capturedSignal: AbortSignal | undefined;

    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      capturedSignal = opts?.signal;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: {} }),
      });
    });

    await request({ method: 'GET', path: '/test', token: 'test' }, { quiet: true });
    expect(capturedSignal!.aborted).toBe(false);
  });

  it('should handle retry-after with non-numeric value', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': 'invalid' }),
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'ok' }),
      });
    });

    const result = await request(
      { method: 'GET', path: '/test', token: 'test' },
      { quiet: true },
    );
    expect(result.data).toEqual({ data: 'ok' });
    expect(callCount).toBe(2);
  });

  it('should not retry POST on network error', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(new TypeError('fetch failed'));
    });

    await expect(
      request({ method: 'POST', path: '/messages', token: 'test' }, { quiet: true }),
    ).rejects.toThrow();
    expect(callCount).toBe(1);
  });

  it('should not retry DELETE on network error', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(new TypeError('fetch failed'));
    });

    await expect(
      request({ method: 'DELETE', path: '/messages/1', token: 'test' }, { quiet: true }),
    ).rejects.toThrow();
    expect(callCount).toBe(1);
  });

  it('should retry GET on network error', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new TypeError('fetch failed'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'ok' }),
      });
    });

    const result = await request(
      { method: 'GET', path: '/test', token: 'test' },
      { quiet: true },
    );
    expect(result.data).toEqual({ data: 'ok' });
    expect(callCount).toBe(3);
  });

  it('should retry PUT on network error', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new TypeError('fetch failed'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'ok' }),
      });
    });

    const result = await request(
      { method: 'PUT', path: '/users/1', token: 'test' },
      { quiet: true },
    );
    expect(result.data).toEqual({ data: 'ok' });
    expect(callCount).toBe(3);
  });

  it('should not retry PATCH on network error', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(new TypeError('fetch failed'));
    });

    await expect(
      request({ method: 'PATCH', path: '/test', token: 'test' }, { quiet: true }),
    ).rejects.toThrow();
    expect(callCount).toBe(1);
  });

  it('should handle non-JSON error response (HTML)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve('<html>Bad Gateway</html>'),
    });

    try {
      await request({ method: 'GET', path: '/test', token: 'test', noRetry: true }, { quiet: true });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).details.code).toBe(502);
    }
  });

  it('should return null data when content-length is 0', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-length': '0' }),
    });

    const result = await request(
      { method: 'POST', path: '/test', token: 'test' },
      { quiet: true },
    );
    expect(result.data).toBeNull();
  });

  describe('downloadFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-dl-test-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function mockStream(content: Buffer) {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(content));
          controller.close();
        },
      });
    }

    it('should download file to specified path', async () => {
      const content = Buffer.from('file content here');
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: mockStream(content),
      });

      const filePath = path.join(tmpDir, 'output.zip');
      const result = await downloadFile('https://example.com/file.zip', filePath);

      expect(result.size).toBe(content.length);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('file content here');
    });

    it('should derive filename from URL when saving to directory', async () => {
      const content = Buffer.from('data');
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: mockStream(content),
      });

      const result = await downloadFile('https://example.com/archive-123.zip', tmpDir + '/');

      expect(result.size).toBe(4);
      expect(fs.existsSync(path.join(tmpDir, 'archive-123.zip'))).toBe(true);
    });

    it('should use Content-Disposition filename when saving to directory', async () => {
      const content = Buffer.from('data');
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-disposition': 'attachment; filename="export.csv"' }),
        body: mockStream(content),
      });

      await downloadFile('https://example.com/download', tmpDir + '/');
      expect(fs.existsSync(path.join(tmpDir, 'export.csv'))).toBe(true);
    });

    it('should throw on failed download', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(downloadFile('https://example.com/missing.zip', path.join(tmpDir, 'out.zip'))).rejects.toThrow('Download failed');
    });

    it('should throw when response body is null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: null,
      });

      await expect(
        downloadFile('https://example.com/file.zip', path.join(tmpDir, 'out.zip')),
      ).rejects.toThrow();
    });

    it('should throw when target directory does not exist', async () => {
      const content = Buffer.from('data');
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: mockStream(content),
      });

      await expect(
        downloadFile('https://example.com/file.zip', '/nonexistent-dir-xyz/'),
      ).rejects.toThrow();
    });
  });
});
