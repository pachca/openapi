import { describe, it, expect, vi } from 'vitest';
import type { ILoadOptionsFunctions } from 'n8n-workflow';
import {
	formatUserName,
	searchChats,
	searchUsers,
	searchEntities,
	getCustomProperties,
} from '../nodes/Pachca/GenericFunctions';

// ============================================================================
// Helpers
// ============================================================================

const BASE_URL = 'https://api.pachca.com/api/shared/v1';

function createLoadCtx(overrides: {
	httpResponses?: unknown[];
	params?: Record<string, unknown>;
} = {}): ILoadOptionsFunctions {
	let callIndex = 0;
	const responses = overrides.httpResponses ?? [{ data: [] }];
	const params = overrides.params ?? {};

	return {
		getCredentials: vi.fn(async () => ({
			baseUrl: BASE_URL,
			accessToken: 'test-token',
		})),
		getNodeParameter: vi.fn((name: string) => {
			if (name in params) return params[name];
			throw new Error(`Missing parameter: ${name}`);
		}),
		getCurrentNodeParameter: vi.fn((name: string) => {
			if (name in params) return params[name];
			throw new Error(`Missing parameter: ${name}`);
		}),
		helpers: {
			httpRequestWithAuthentication: vi.fn(async () => {
				const idx = callIndex++;
				const resp = responses[idx % responses.length];
				if (resp instanceof Error) throw resp;
				return resp;
			}),
		},
	} as unknown as ILoadOptionsFunctions;
}

// ============================================================================
// formatUserName
// ============================================================================

describe('formatUserName', () => {
	it('should format full name with nickname', () => {
		expect(formatUserName({ first_name: 'John', last_name: 'Doe', nickname: 'jdoe' }))
			.toBe('John Doe (@jdoe)');
	});

	it('should format full name without nickname', () => {
		expect(formatUserName({ first_name: 'John', last_name: 'Doe', nickname: '' }))
			.toBe('John Doe');
	});

	it('should use only first name when last name is empty', () => {
		expect(formatUserName({ first_name: 'John', last_name: '', nickname: '' }))
			.toBe('John');
	});

	it('should use nickname when name is empty', () => {
		expect(formatUserName({ first_name: '', last_name: '', nickname: 'jdoe' }))
			.toBe('jdoe (@jdoe)');
	});

	it('should fall back to "User" when everything is empty', () => {
		expect(formatUserName({ first_name: '', last_name: '', nickname: '' }))
			.toBe('User');
	});

	it('should filter out "null" string values', () => {
		expect(formatUserName({ first_name: 'null', last_name: 'null', nickname: 'real' }))
			.toBe('real (@real)');
	});

	it('should handle null values via != null check', () => {
		expect(formatUserName({ first_name: null as unknown as string, last_name: 'Smith', nickname: '' }))
			.toBe('Smith');
	});
});

// ============================================================================
// searchChats
// ============================================================================

describe('searchChats', () => {
	it('should search chats with filter query', async () => {
		const ctx = createLoadCtx({
			httpResponses: [{
				data: [
					{ id: 1, name: 'General' },
					{ id: 2, name: 'Dev Team' },
				],
			}],
		});

		const result = await searchChats.call(ctx, 'dev');
		expect(result.results).toEqual([
			{ name: 'General', value: 1 },
			{ name: 'Dev Team', value: 2 },
		]);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('/search/chats?query=dev');
	});

	it('should encode filter query', async () => {
		const ctx = createLoadCtx({ httpResponses: [{ data: [] }] });
		await searchChats.call(ctx, 'hello world');

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('query=hello%20world');
	});

	it('should list chats without filter (paginated)', async () => {
		const ctx = createLoadCtx({
			httpResponses: [{
				data: [{ id: 1, name: 'Chat 1' }],
				meta: { paginate: { next_page: 'cursor-abc' } },
			}],
		});

		const result = await searchChats.call(ctx, undefined);
		expect(result.results).toEqual([{ name: 'Chat 1', value: 1 }]);
		expect(result.paginationToken).toBe('cursor-abc');

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('/chats?per=50');
	});

	it('should pass pagination cursor', async () => {
		const ctx = createLoadCtx({
			httpResponses: [{
				data: [{ id: 2, name: 'Chat 2' }],
				meta: { paginate: {} },
			}],
		});

		const result = await searchChats.call(ctx, undefined, 'cursor-abc');
		expect(result.paginationToken).toBeUndefined();

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('cursor=cursor-abc');
	});

	it('should return empty results when data is missing', async () => {
		const ctx = createLoadCtx({ httpResponses: [{}] });
		const result = await searchChats.call(ctx, 'test');
		expect(result.results).toEqual([]);
	});
});

// ============================================================================
// searchUsers
// ============================================================================

describe('searchUsers', () => {
	it('should search users with filter', async () => {
		const ctx = createLoadCtx({
			httpResponses: [{
				data: [
					{ id: 10, first_name: 'Alice', last_name: 'Smith', nickname: 'alice' },
					{ id: 20, first_name: 'Bob', last_name: '', nickname: 'bob' },
				],
			}],
		});

		const result = await searchUsers.call(ctx, 'ali');
		expect(result.results).toEqual([
			{ name: 'Alice Smith (@alice)', value: 10 },
			{ name: 'Bob (@bob)', value: 20 },
		]);
	});

	it('should return empty results without filter', async () => {
		const ctx = createLoadCtx();
		const result = await searchUsers.call(ctx, undefined);
		expect(result.results).toEqual([]);
	});

	it('should return empty results for empty filter', async () => {
		const ctx = createLoadCtx();
		const result = await searchUsers.call(ctx, '');
		expect(result.results).toEqual([]);
	});

	it('should call search endpoint with encoded query', async () => {
		const ctx = createLoadCtx({ httpResponses: [{ data: [] }] });
		await searchUsers.call(ctx, 'Иван');

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('/search/users?query=');
		expect(httpMock.mock.calls[0][1].url).toContain(encodeURIComponent('Иван'));
	});
});

// ============================================================================
// searchEntities
// ============================================================================

describe('searchEntities', () => {
	it('should dispatch to searchUsers when entityType = user', async () => {
		const ctx = createLoadCtx({
			params: { entityType: 'user' },
			httpResponses: [{
				data: [{ id: 1, first_name: 'Test', last_name: 'User', nickname: 'tu' }],
			}],
		});

		const result = await searchEntities.call(ctx, 'test');
		expect(result.results[0].name).toContain('Test User');
	});

	it('should return empty for thread entityType', async () => {
		const ctx = createLoadCtx({ params: { entityType: 'thread' } });
		const result = await searchEntities.call(ctx, 'test');
		expect(result.results).toEqual([]);
	});

	it('should dispatch to searchChats for discussion entityType', async () => {
		const ctx = createLoadCtx({
			params: { entityType: 'discussion' },
			httpResponses: [{
				data: [{ id: 5, name: 'General' }],
			}],
		});

		const result = await searchEntities.call(ctx, 'gen');
		expect(result.results).toEqual([{ name: 'General', value: 5 }]);
	});

	it('should default to discussion when entityType parameter is missing', async () => {
		const ctx = createLoadCtx({
			params: {}, // no entityType
			httpResponses: [{
				data: [{ id: 1, name: 'Chat' }],
			}],
		});

		const result = await searchEntities.call(ctx, 'chat');
		expect(result.results).toEqual([{ name: 'Chat', value: 1 }]);
	});
});

// ============================================================================
// getCustomProperties
// ============================================================================

describe('getCustomProperties', () => {
	it('should load custom properties for task resource', async () => {
		const ctx = createLoadCtx({
			params: { resource: 'task' },
			httpResponses: [{
				data: [
					{ id: 1, name: 'Priority' },
					{ id: 2, name: 'Sprint' },
				],
			}],
		});

		const result = await getCustomProperties.call(ctx);
		expect(result).toEqual([
			{ name: 'Priority', value: 1 },
			{ name: 'Sprint', value: 2 },
		]);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('entity_type=Task');
	});

	it('should use User entity type for non-task resources', async () => {
		const ctx = createLoadCtx({
			params: { resource: 'user' },
			httpResponses: [{ data: [{ id: 3, name: 'Department' }] }],
		});

		const result = await getCustomProperties.call(ctx);
		expect(result).toEqual([{ name: 'Department', value: 3 }]);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls[0][1].url).toContain('entity_type=User');
	});

	it('should return empty array when no properties exist', async () => {
		const ctx = createLoadCtx({
			params: { resource: 'user' },
			httpResponses: [{ data: [] }],
		});

		const result = await getCustomProperties.call(ctx);
		expect(result).toEqual([]);
	});

	it('should handle missing data in response', async () => {
		const ctx = createLoadCtx({
			params: { resource: 'user' },
			httpResponses: [{}],
		});

		const result = await getCustomProperties.call(ctx);
		expect(result).toEqual([]);
	});
});
