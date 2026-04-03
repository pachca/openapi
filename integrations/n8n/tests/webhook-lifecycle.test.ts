import { describe, it, expect, vi } from 'vitest';
import type { IDataObject, IHookFunctions } from 'n8n-workflow';
import { PachcaTrigger } from '../nodes/Pachca/PachcaTrigger.node';

// ============================================================================
// Helpers
// ============================================================================

const BASE_URL = 'https://api.pachca.com/api/shared/v1';
const WEBHOOK_URL = 'https://n8n.example.com/webhook/abc123';

function createHookCtx(overrides: {
	botId?: number;
	httpResponses?: unknown[];
	resolveBotResult?: number;
	resolveBotError?: Error;
} = {}): IHookFunctions {
	let callIndex = 0;
	const responses = overrides.httpResponses ?? [{}];

	return {
		getCredentials: vi.fn(async () => ({
			baseUrl: BASE_URL,
			accessToken: 'test-token',
			botId: overrides.botId ?? 0,
		})),
		getNodeWebhookUrl: vi.fn(() => WEBHOOK_URL),
		helpers: {
			httpRequestWithAuthentication: vi.fn(async () => {
				const idx = callIndex++;
				const resp = responses[idx % responses.length];
				if (resp instanceof Error) throw resp;
				return resp;
			}),
		},
		logger: {
			warn: vi.fn(),
			info: vi.fn(),
			error: vi.fn(),
		},
	} as unknown as IHookFunctions;
}

// ============================================================================
// checkExists
// ============================================================================

describe('PachcaTrigger.webhookMethods.checkExists', () => {
	const trigger = new PachcaTrigger();

	it('should return true when webhook URL matches', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [
				{ data: { webhook: { outgoing_url: WEBHOOK_URL } } },
			],
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(true);
	});

	it('should return false when webhook URL does not match', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [
				{ data: { webhook: { outgoing_url: 'https://other.example.com/webhook' } } },
			],
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should return false when no webhook is configured', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [{ data: {} }],
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should return false when bot ID is 0 (personal token)', async () => {
		// botId=0 + token/info returns personal token
		const ctx = createHookCtx({
			httpResponses: [
				{ data: { name: 'My Token', user_id: 99 } }, // resolveBotId → 0
			],
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
		// Should not attempt GET /bots/...
		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(1); // only token/info
	});

	it('should return false on network error during resolveBotId', async () => {
		const ctx = createHookCtx({
			httpResponses: [new Error('Network timeout')],
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should return false on network error during bot GET', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [new Error('Connection refused')],
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should call correct URL with bot ID', async () => {
		const ctx = createHookCtx({
			botId: 77,
			httpResponses: [
				{ data: { webhook: { outgoing_url: WEBHOOK_URL } } },
			],
		});

		await trigger.webhookMethods.default.checkExists.call(ctx);
		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		const callArgs = httpMock.mock.calls[0];
		expect(callArgs[1].url).toBe(`${BASE_URL}/bots/77`);
		expect(callArgs[1].method).toBe('GET');
	});
});

// ============================================================================
// create
// ============================================================================

describe('PachcaTrigger.webhookMethods.create', () => {
	const trigger = new PachcaTrigger();

	it('should register webhook via PUT /bots/:id', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [{ data: {} }],
		});

		const result = await trigger.webhookMethods.default.create.call(ctx);
		expect(result).toBe(true);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock).toHaveBeenCalledWith(
			'pachcaApi',
			expect.objectContaining({
				method: 'PUT',
				url: `${BASE_URL}/bots/42`,
				body: { bot: { webhook: { outgoing_url: WEBHOOK_URL } } },
			}),
		);
	});

	it('should warn and return true for personal token (no bot ID)', async () => {
		const ctx = createHookCtx({
			// botId=0, token/info returns personal token
			httpResponses: [
				{ data: { name: 'My Token', user_id: 99 } }, // resolveBotId → 0
			],
		});

		const result = await trigger.webhookMethods.default.create.call(ctx);
		expect(result).toBe(true);
		expect((ctx.logger as { warn: ReturnType<typeof vi.fn> }).warn).toHaveBeenCalledWith(
			expect.stringContaining('not a bot token'),
		);
	});

	it('should auto-detect bot ID from token/info', async () => {
		const ctx = createHookCtx({
			// botId=0, token/info returns bot token
			httpResponses: [
				{ data: { name: null, user_id: 55 } },  // resolveBotId → 55
				{ data: {} },                             // PUT /bots/55
			],
		});

		const result = await trigger.webhookMethods.default.create.call(ctx);
		expect(result).toBe(true);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		// Second call should be PUT /bots/55
		expect(httpMock.mock.calls[1][1].url).toBe(`${BASE_URL}/bots/55`);
	});
});

// ============================================================================
// delete
// ============================================================================

describe('PachcaTrigger.webhookMethods.delete', () => {
	const trigger = new PachcaTrigger();

	it('should clear webhook via PUT /bots/:id with empty URL', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [{ data: {} }],
		});

		const result = await trigger.webhookMethods.default.delete.call(ctx);
		expect(result).toBe(true);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock).toHaveBeenCalledWith(
			'pachcaApi',
			expect.objectContaining({
				method: 'PUT',
				url: `${BASE_URL}/bots/42`,
				body: { bot: { webhook: { outgoing_url: '' } } },
			}),
		);
	});

	it('should return true when resolveBotId throws', async () => {
		const ctx = createHookCtx({
			httpResponses: [new Error('Network timeout')],
		});

		const result = await trigger.webhookMethods.default.delete.call(ctx);
		expect(result).toBe(true);
	});

	it('should return true when bot ID is 0', async () => {
		const ctx = createHookCtx({
			httpResponses: [
				{ data: { name: 'Personal Token', user_id: 1 } }, // → 0
			],
		});

		const result = await trigger.webhookMethods.default.delete.call(ctx);
		expect(result).toBe(true);
		// Should not attempt PUT
		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(1); // only token/info
	});

	it('should ignore PUT errors on cleanup', async () => {
		const ctx = createHookCtx({
			botId: 42,
			httpResponses: [new Error('Server error')],
		});

		const result = await trigger.webhookMethods.default.delete.call(ctx);
		expect(result).toBe(true);
	});
});
