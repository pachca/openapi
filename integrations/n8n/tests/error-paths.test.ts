import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IDataObject, IExecuteFunctions, IHookFunctions, INode } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import {
  makeApiRequest,
  makeApiRequestAllPages,
  sanitizeBaseUrl,
  resolveBotId,
} from '../nodes/Pachca/GenericFunctions';

// ============================================================================
// Mock helpers
// ============================================================================

const MOCK_NODE: INode = {
  id: 'test-node-id',
  name: 'Pachca',
  type: 'n8n-nodes-pachca.pachca',
  typeVersion: 2,
  position: [0, 0],
  parameters: {},
};

function createExecCtx(overrides: {
  httpResponse?: unknown;
  httpResponses?: unknown[];
  params?: Record<string, unknown>;
}): IExecuteFunctions & { _callIndex: number } {
  const params = overrides.params ?? {};
  let callIndex = 0;
  const responses = overrides.httpResponses ?? [overrides.httpResponse ?? { statusCode: 200, body: { data: {} } }];

  return {
    _callIndex: 0,
    getCredentials: vi.fn(async () => ({
      baseUrl: 'https://api.pachca.com/api/shared/v1',
      accessToken: 'test-token',
    })),
    getNodeParameter: vi.fn((name: string, _index: number, defaultVal?: unknown) => {
      if (name in params) return params[name];
      if (defaultVal !== undefined) return defaultVal;
      throw new Error(`Missing parameter: ${name}`);
    }),
    getNode: vi.fn(() => MOCK_NODE),
    helpers: {
      httpRequestWithAuthentication: vi.fn(async () => {
        const idx = callIndex++;
        const resp = responses[idx % responses.length];
        if (resp instanceof Error) throw resp;
        return resp;
      }),
    },
  } as unknown as IExecuteFunctions & { _callIndex: number };
}

// ============================================================================
// sanitizeBaseUrl
// ============================================================================

describe('sanitizeBaseUrl', () => {
  it('should strip trailing slashes', () => {
    expect(sanitizeBaseUrl('https://api.example.com/')).toBe('https://api.example.com');
    expect(sanitizeBaseUrl('https://api.example.com///')).toBe('https://api.example.com');
  });

  it('should pass through clean URLs', () => {
    expect(sanitizeBaseUrl('https://api.example.com')).toBe('https://api.example.com');
  });

  it('should throw for non-http URLs', () => {
    expect(() => sanitizeBaseUrl('ftp://files.example.com')).toThrow('Invalid Base URL');
    expect(() => sanitizeBaseUrl('javascript:alert(1)')).toThrow('Invalid Base URL');
    expect(() => sanitizeBaseUrl('')).toThrow('Invalid Base URL');
  });

  it('should accept http:// URLs', () => {
    expect(sanitizeBaseUrl('http://localhost:8080')).toBe('http://localhost:8080');
  });
});

// ============================================================================
// makeApiRequest — error paths
// ============================================================================

describe('makeApiRequest error paths', () => {
  it('should throw NodeApiError on 401', async () => {
    const ctx = createExecCtx({
      httpResponse: {
        statusCode: 401,
        body: { error: 'Unauthorized' },
        headers: {},
      },
    });

    await expect(
      makeApiRequest.call(ctx, 'GET', '/users', undefined, undefined, 0),
    ).rejects.toThrow(NodeApiError);
  });

  it('should throw NodeApiError on 404', async () => {
    const ctx = createExecCtx({
      httpResponse: {
        statusCode: 404,
        body: { error: 'Not found' },
        headers: {},
      },
    });

    await expect(
      makeApiRequest.call(ctx, 'GET', '/users/999', undefined, undefined, 0),
    ).rejects.toThrow(NodeApiError);
  });

  it('should format field-level validation errors (422)', async () => {
    const ctx = createExecCtx({
      httpResponse: {
        statusCode: 422,
        body: {
          errors: [
            { key: 'entity_id', value: 'is required' },
            { key: 'first_name', value: 'is too short' },
          ],
        },
        headers: {},
      },
    });

    try {
      await makeApiRequest.call(ctx, 'POST', '/users', {}, undefined, 0);
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NodeApiError);
      const apiError = error as NodeApiError;
      // Should use display names from FIELD_DISPLAY_NAMES
      expect(apiError.message).toContain('Entity ID');
      expect(apiError.message).toContain('First Name');
    }
  });

  it('should attach Retry-After header to error', async () => {
    const ctx = createExecCtx({
      httpResponse: {
        statusCode: 429,
        body: { error: 'Rate limited' },
        headers: { 'retry-after': '5' },
      },
    });

    try {
      await makeApiRequest.call(ctx, 'GET', '/users', undefined, undefined, 0);
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NodeApiError);
      expect((error as NodeApiError & { retryAfter?: number }).retryAfter).toBe(5);
    }
  });

  it('should handle 204 No Content as success', async () => {
    const ctx = createExecCtx({
      httpResponse: {
        statusCode: 204,
        body: null,
        headers: {},
      },
    });

    const result = await makeApiRequest.call(ctx, 'DELETE', '/messages/1', undefined, undefined, 0);
    expect(result).toEqual({ success: true });
  });

  it('should handle 500 with generic error message', async () => {
    const ctx = createExecCtx({
      httpResponse: {
        statusCode: 500,
        body: {},
        headers: {},
      },
    });

    try {
      await makeApiRequest.call(ctx, 'GET', '/users', undefined, undefined, 0);
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NodeApiError);
      expect((error as NodeApiError).message).toContain('500');
    }
  });

  it('should not send Content-Type or body for GET requests', async () => {
    const ctx = createExecCtx({
      httpResponse: { statusCode: 200, body: { data: [] }, headers: {} },
    });
    const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;

    await makeApiRequest.call(ctx, 'GET', '/users', { should: 'be-ignored' }, { per: 50 }, 0);

    const callArgs = httpMock.mock.calls[0];
    const options = callArgs[1];
    expect(options.body).toBeUndefined();
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.qs).toEqual({ per: 50 });
  });

  it('should not send Content-Type or body for DELETE requests', async () => {
    const ctx = createExecCtx({
      httpResponse: { statusCode: 204, body: null, headers: {} },
    });
    const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;

    await makeApiRequest.call(ctx, 'DELETE', '/messages/1', undefined, undefined, 0);

    const options = httpMock.mock.calls[0][1];
    expect(options.body).toBeUndefined();
    expect(options.headers['Content-Type']).toBeUndefined();
  });
});

// ============================================================================
// makeApiRequestAllPages — retry and pagination error paths
// ============================================================================

describe('makeApiRequestAllPages error paths', () => {
  // Stub setTimeout to resolve immediately so retry tests don't wait
  beforeEach(() => {
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler) => {
      if (typeof fn === 'function') fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should retry on 429 and succeed', async () => {
    const rateLimitResponse = {
      statusCode: 429,
      body: { error: 'Rate limited' },
      headers: { 'retry-after': '1' },
    };
    const successResponse = {
      statusCode: 200,
      body: { data: [{ id: 1 }], meta: { paginate: {} } },
      headers: {},
    };

    const ctx = createExecCtx({
      httpResponses: [rateLimitResponse, successResponse],
      params: { returnAll: false, limit: 10 },
    });

    const results = await makeApiRequestAllPages.call(
      ctx, 'GET', '/users', {}, 0, 'user', 2,
    );
    expect(results).toEqual([{ json: { id: 1 } }]);
    expect((ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
  });

  it('should retry on 502 and succeed', async () => {
    const errorResponse = {
      statusCode: 502,
      body: { error: 'Bad Gateway' },
      headers: {},
    };
    const successResponse = {
      statusCode: 200,
      body: { data: [{ id: 1 }], meta: { paginate: {} } },
      headers: {},
    };

    const ctx = createExecCtx({
      httpResponses: [errorResponse, successResponse],
      params: { returnAll: false, limit: 10 },
    });

    const results = await makeApiRequestAllPages.call(
      ctx, 'GET', '/users', {}, 0, 'user', 2,
    );
    expect(results).toEqual([{ json: { id: 1 } }]);
  });

  it('should throw after MAX_RETRIES exceeded', async () => {
    const rateLimitResponse = {
      statusCode: 429,
      body: { error: 'Rate limited' },
      headers: { 'retry-after': '1' },
    };

    // initial + 5 retries = 6 calls, then 7th throws
    const ctx = createExecCtx({
      httpResponses: Array(7).fill(rateLimitResponse),
      params: { returnAll: false, limit: 10 },
    });

    await expect(
      makeApiRequestAllPages.call(ctx, 'GET', '/users', {}, 0, 'user', 2),
    ).rejects.toThrow(NodeApiError);
    // 6 calls total: 1 initial + 5 retries, 6th exceeds MAX_RETRIES
    expect((ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(6);
  });

  it('should throw non-retryable errors immediately (e.g. 403)', async () => {
    const ctx = createExecCtx({
      httpResponses: [{
        statusCode: 403,
        body: { error: 'Forbidden' },
        headers: {},
      }],
      params: { returnAll: false, limit: 10 },
    });

    await expect(
      makeApiRequestAllPages.call(ctx, 'GET', '/users', {}, 0, 'user', 2),
    ).rejects.toThrow(NodeApiError);
    // Only 1 call — no retries
    expect((ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('should break on duplicate cursor (infinite loop guard)', async () => {
    const page1 = {
      statusCode: 200,
      body: { data: [{ id: 1 }], meta: { paginate: { next_page: 'cursor-A' } } },
      headers: {},
    };
    const page2 = {
      statusCode: 200,
      body: { data: [{ id: 2 }], meta: { paginate: { next_page: 'cursor-A' } } },
      headers: {},
    };

    const ctx = createExecCtx({
      httpResponses: [page1, page2],
      params: { returnAll: true },
    });

    const results = await makeApiRequestAllPages.call(
      ctx, 'GET', '/users', {}, 0, 'user', 2,
    );
    // Guard compares nextCursor with current cursor:
    // Page 1: cursor=undefined, nextCursor=cursor-A → no match → cursor becomes cursor-A
    // Page 2: cursor=cursor-A, nextCursor=cursor-A → match → break
    expect(results).toHaveLength(2);
  });

  it('should respect limit and not fetch extra pages', async () => {
    const page1 = {
      statusCode: 200,
      body: {
        data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
        meta: { paginate: { next_page: 'cursor-B' } },
      },
      headers: {},
    };

    const ctx = createExecCtx({
      httpResponses: [page1],
      params: { returnAll: false, limit: 10 },
    });

    const results = await makeApiRequestAllPages.call(
      ctx, 'GET', '/users', {}, 0, 'user', 2,
    );
    // Should slice to limit
    expect(results).toHaveLength(10);
    // Only 1 HTTP call — didn't fetch page 2 because 50 >= limit(10)
    expect((ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('should handle empty data array gracefully', async () => {
    const ctx = createExecCtx({
      httpResponses: [{
        statusCode: 200,
        body: { data: [], meta: { paginate: {} } },
        headers: {},
      }],
      params: { returnAll: true },
    });

    const results = await makeApiRequestAllPages.call(
      ctx, 'GET', '/users', {}, 0, 'user', 2,
    );
    expect(results).toEqual([]);
  });

  it('should pass Retry-After value to setTimeout', async () => {
    const rateLimitResponse = {
      statusCode: 429,
      body: { error: 'Rate limited' },
      headers: { 'retry-after': '3' },
    };
    const successResponse = {
      statusCode: 200,
      body: { data: [{ id: 1 }], meta: {} },
      headers: {},
    };

    const ctx = createExecCtx({
      httpResponses: [rateLimitResponse, successResponse],
      params: { returnAll: false, limit: 10 },
    });

    const setTimeoutSpy = globalThis.setTimeout as unknown as ReturnType<typeof vi.fn>;
    const results = await makeApiRequestAllPages.call(ctx, 'GET', '/users', {}, 0, 'user', 2);

    expect(results).toEqual([{ json: { id: 1 } }]);
    // Retry-After: 3 → retryAfter = parseInt('3') || 2 = 3 → setTimeout(fn, 3000)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
  });
});

// ============================================================================
// resolveBotId
// ============================================================================

describe('resolveBotId', () => {
  function createHookCtx(httpResponse: unknown) {
    return {
      helpers: {
        httpRequestWithAuthentication: vi.fn(async () => httpResponse),
      },
    } as unknown as IHookFunctions;
  }

  it('should return explicit botId from credentials', async () => {
    const ctx = createHookCtx({});
    const credentials = { botId: 42, baseUrl: 'https://api.pachca.com/api/shared/v1' };
    const result = await resolveBotId(ctx, credentials);
    expect(result).toBe(42);
    // Should not make any HTTP call
    expect((ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('should detect bot token via token/info API', async () => {
    const ctx = createHookCtx({
      data: { name: null, user_id: 12345 },
    });
    const credentials = { botId: 0, baseUrl: 'https://api.pachca.com/api/shared/v1' };
    const result = await resolveBotId(ctx, credentials);
    expect(result).toBe(12345);
  });

  it('should return 0 for personal token (name is not null)', async () => {
    const ctx = createHookCtx({
      data: { name: 'My Token', user_id: 99 },
    });
    const credentials = { botId: 0, baseUrl: 'https://api.pachca.com/api/shared/v1' };
    const result = await resolveBotId(ctx, credentials);
    expect(result).toBe(0);
  });

  it('should return 0 when data is missing', async () => {
    const ctx = createHookCtx({});
    const credentials = { botId: 0, baseUrl: 'https://api.pachca.com/api/shared/v1' };
    const result = await resolveBotId(ctx, credentials);
    expect(result).toBe(0);
  });

  it('should propagate network errors (no silent catch)', async () => {
    const ctx = {
      helpers: {
        httpRequestWithAuthentication: vi.fn(async () => {
          throw new Error('Network timeout');
        }),
      },
    } as unknown as IHookFunctions;
    const credentials = { botId: 0, baseUrl: 'https://api.pachca.com/api/shared/v1' };

    await expect(resolveBotId(ctx, credentials)).rejects.toThrow('Network timeout');
  });
});
