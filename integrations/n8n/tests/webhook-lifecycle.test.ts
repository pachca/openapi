import { describe, it, expect, vi } from 'vitest';
import type { IDataObject, IHookFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { PachcaTrigger } from '../nodes/Pachca/PachcaTrigger.node';

// ============================================================================
// Helpers
// ============================================================================

const BASE_URL = 'https://api.pachca.com/api/shared/v1';
const PROD_WEBHOOK_URL = 'https://n8n.example.com/webhook/abc123';
const TEST_WEBHOOK_URL = 'https://n8n.example.com/webhook-test/abc123';

function createHookCtx(overrides: {
	nodeBotId?: number;
	webhookUrl?: string;
	httpResponses?: unknown[];
	staticData?: IDataObject;
	webhookSetup?: 'automatic' | 'manual';
} = {}): IHookFunctions {
	let callIndex = 0;
	const responses = overrides.httpResponses ?? [{}];
	const staticData: IDataObject = overrides.staticData ?? {};
	const setupMode = overrides.webhookSetup ?? 'automatic';
	const nodeBotId = overrides.nodeBotId ?? 0;

	return {
		getCredentials: vi.fn(async () => ({
			baseUrl: BASE_URL,
			accessToken: 'test-token',
		})),
		getNodeParameter: vi.fn((name: string, fallback?: unknown) => {
			if (name === 'webhookSetup') return setupMode;
			if (name === 'botId') return nodeBotId;
			return fallback;
		}),
		getNodeWebhookUrl: vi.fn(() => overrides.webhookUrl ?? PROD_WEBHOOK_URL),
		getWorkflowStaticData: vi.fn(() => staticData),
		getNode: vi.fn(() => ({ name: 'Pachca Trigger', type: 'n8n-nodes-pachca.pachcaTrigger' })),
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

	it('should return true when staticData has the same URL already registered', async () => {
		const ctx = createHookCtx({
			webhookUrl: PROD_WEBHOOK_URL,
			staticData: { webhookUrl: PROD_WEBHOOK_URL, botId: 42 },
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(true);
		// No HTTP calls should be made
		expect((ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
	});

	it('should return false when staticData is empty (first registration)', async () => {
		const ctx = createHookCtx({
			webhookUrl: PROD_WEBHOOK_URL,
			staticData: {},
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should return false when staticData has a different prod URL (URL changed)', async () => {
		const ctx = createHookCtx({
			webhookUrl: 'https://n8n.example.com/webhook/different-id',
			staticData: { webhookUrl: PROD_WEBHOOK_URL, botId: 42 },
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should throw NodeOperationError when test URL requested while prod URL is registered', async () => {
		const ctx = createHookCtx({
			webhookUrl: TEST_WEBHOOK_URL,
			staticData: { webhookUrl: PROD_WEBHOOK_URL, botId: 42 },
		});

		await expect(trigger.webhookMethods.default.checkExists.call(ctx)).rejects.toThrow(
			NodeOperationError,
		);
		await expect(trigger.webhookMethods.default.checkExists.call(ctx)).rejects.toThrow(
			/one webhook URL/i,
		);
	});

	it('should NOT throw when test URL requested and no prod URL is registered', async () => {
		const ctx = createHookCtx({
			webhookUrl: TEST_WEBHOOK_URL,
			staticData: {},
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(false);
	});

	it('should make no HTTP calls (staticData-only check)', async () => {
		const ctx = createHookCtx({
			webhookUrl: PROD_WEBHOOK_URL,
			staticData: {},
		});

		await trigger.webhookMethods.default.checkExists.call(ctx);
		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(0);
	});

	it('should return true immediately in manual mode (no slot protection, no HTTP)', async () => {
		// Manual mode: even with test URL requested while prod URL is stored,
		// n8n does not manage the slot — skip all logic and return true.
		const ctx = createHookCtx({
			webhookSetup: 'manual',
			webhookUrl: TEST_WEBHOOK_URL,
			staticData: { webhookUrl: PROD_WEBHOOK_URL, botId: 42 },
		});

		const result = await trigger.webhookMethods.default.checkExists.call(ctx);
		expect(result).toBe(true);
		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(0);
	});
});

// ============================================================================
// create
// ============================================================================

describe('PachcaTrigger.webhookMethods.create', () => {
	const trigger = new PachcaTrigger();

	it('should register webhook via PUT /bots/:id for personal token and update staticData', async () => {
		const staticData: IDataObject = {};
		const ctx = createHookCtx({
			nodeBotId: 42,
			webhookUrl: PROD_WEBHOOK_URL,
			staticData,
			httpResponses: [
				{ data: { id: 99, bot: false } }, // GET /profile → personal token
				{ data: {} }, // PUT /bots/42
			],
		});

		const result = await trigger.webhookMethods.default.create.call(ctx);
		expect(result).toBe(true);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		// First call: GET /profile for token detection
		expect(httpMock.mock.calls[0][1]).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/profile`,
		});
		// Second call: PUT /bots/42 to register webhook URL
		expect(httpMock.mock.calls[1][1]).toMatchObject({
			method: 'PUT',
			url: `${BASE_URL}/bots/42`,
			body: { bot: { webhook: { outgoing_url: PROD_WEBHOOK_URL } } },
		});
		expect(staticData.webhookUrl).toBe(PROD_WEBHOOK_URL);
		expect(staticData.botId).toBe(42);
	});

	it('should throw NodeOperationError when token is a bot token (not yet supported)', async () => {
		const staticData: IDataObject = {};
		const ctx = createHookCtx({
			nodeBotId: 42,
			staticData,
			httpResponses: [
				{ data: { id: 55, bot: true } }, // GET /profile → bot token
			],
		});

		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			NodeOperationError,
		);
		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			/not yet supported for bot tokens/i,
		);
		// No PUT call should have been made
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});

	it('should throw NodeOperationError when personal token is used without Bot ID', async () => {
		const staticData: IDataObject = {};
		const ctx = createHookCtx({
			nodeBotId: 0, // not provided
			staticData,
			httpResponses: [
				{ data: { id: 99, bot: false } }, // GET /profile → personal token
			],
		});

		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			NodeOperationError,
		);
		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			/Bot ID is required/i,
		);
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});

	it('should throw NodeOperationError with access hint on 403 Forbidden', async () => {
		const error = Object.assign(new Error('Forbidden'), { httpCode: 403 });
		const ctx = createHookCtx({
			nodeBotId: 42,
			httpResponses: [
				{ data: { id: 99, bot: false } }, // GET /profile → personal token
				error, // PUT /bots/42 → 403
			],
		});

		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			NodeOperationError,
		);
		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			/403|editor access/i,
		);
	});

	it('should rethrow non-403 errors unchanged', async () => {
		const error = Object.assign(new Error('Server error'), { httpCode: 500 });
		const ctx = createHookCtx({
			nodeBotId: 42,
			httpResponses: [
				{ data: { id: 99, bot: false } }, // GET /profile → personal token
				error, // PUT /bots/42 → 500
			],
		});

		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow('Server error');
	});

	it('should fall back to personal-token path when GET /profile fails and still register the webhook', async () => {
		const staticData: IDataObject = {};
		const profileError = Object.assign(new Error('profile:read scope missing'), { httpCode: 403 });
		const ctx = createHookCtx({
			nodeBotId: 42,
			webhookUrl: PROD_WEBHOOK_URL,
			staticData,
			httpResponses: [
				profileError, // GET /profile → fails
				{ data: {} }, // PUT /bots/42 → succeeds
			],
		});

		const result = await trigger.webhookMethods.default.create.call(ctx);
		expect(result).toBe(true);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(2);
		expect(httpMock.mock.calls[0][1]).toMatchObject({ method: 'GET', url: `${BASE_URL}/profile` });
		expect(httpMock.mock.calls[1][1]).toMatchObject({
			method: 'PUT',
			url: `${BASE_URL}/bots/42`,
			body: { bot: { webhook: { outgoing_url: PROD_WEBHOOK_URL } } },
		});
		// warning was logged so the user can diagnose the missing scope
		expect(
			(ctx.logger as unknown as { warn: ReturnType<typeof vi.fn> }).warn,
		).toHaveBeenCalledWith(expect.stringContaining('GET /profile'));
		expect(staticData.webhookUrl).toBe(PROD_WEBHOOK_URL);
		expect(staticData.botId).toBe(42);
	});

	it('should fall back to personal-token path when GET /profile fails, then surface 403 from PUT /bots/{id} if it is actually a bot token', async () => {
		const staticData: IDataObject = {};
		const profileError = new Error('network timeout');
		const putError = Object.assign(new Error('Forbidden'), { httpCode: 403 });
		const ctx = createHookCtx({
			nodeBotId: 42,
			staticData,
			httpResponses: [
				profileError, // GET /profile → fails
				putError, // PUT /bots/42 → 403 (bot token cannot update its own URL)
			],
		});

		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			NodeOperationError,
		);
		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow(
			/403|editor access/i,
		);
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});

	it('should NOT touch staticData when PUT fails', async () => {
		const staticData: IDataObject = {};
		const error = Object.assign(new Error('Forbidden'), { httpCode: 403 });
		const ctx = createHookCtx({
			nodeBotId: 42,
			staticData,
			httpResponses: [
				{ data: { id: 99, bot: false } }, // GET /profile → personal token
				error, // PUT /bots/42 → 403
			],
		});

		await expect(trigger.webhookMethods.default.create.call(ctx)).rejects.toThrow();
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});

	it('should log and return true without any HTTP call in manual mode', async () => {
		const staticData: IDataObject = {};
		const ctx = createHookCtx({
			webhookSetup: 'manual',
			nodeBotId: 42,
			staticData,
		});

		const result = await trigger.webhookMethods.default.create.call(ctx);
		expect(result).toBe(true);

		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(0);
		expect((ctx.logger as unknown as { info: ReturnType<typeof vi.fn> }).info).toHaveBeenCalledWith(
			expect.stringContaining('manual webhook setup'),
		);
		// staticData should NOT be populated — delete() relies on this to skip cleanup
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});
});

// ============================================================================
// delete
// ============================================================================

describe('PachcaTrigger.webhookMethods.delete', () => {
	const trigger = new PachcaTrigger();

	it('should clear webhook via PUT /bots/:id with empty URL and clear staticData', async () => {
		const staticData: IDataObject = { webhookUrl: PROD_WEBHOOK_URL, botId: 42 };
		const ctx = createHookCtx({
			staticData,
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
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});

	it('should return true without any HTTP call when staticData is empty', async () => {
		const ctx = createHookCtx({
			staticData: {},
		});

		const result = await trigger.webhookMethods.default.delete.call(ctx);
		expect(result).toBe(true);
		const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
		expect(httpMock.mock.calls).toHaveLength(0);
	});

	it('should ignore PUT errors on cleanup and still clear staticData', async () => {
		const staticData: IDataObject = { webhookUrl: PROD_WEBHOOK_URL, botId: 42 };
		const ctx = createHookCtx({
			staticData,
			httpResponses: [new Error('Server error')],
		});

		const result = await trigger.webhookMethods.default.delete.call(ctx);
		expect(result).toBe(true);
		expect(staticData.webhookUrl).toBeUndefined();
		expect(staticData.botId).toBeUndefined();
	});
});
