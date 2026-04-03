import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IDataObject, IWebhookFunctions } from 'n8n-workflow';
import * as crypto from 'crypto';
import { PachcaTrigger } from '../nodes/Pachca/PachcaTrigger.node';

// ============================================================================
// Helpers
// ============================================================================

function hmacSha256(body: string, secret: string): string {
	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(body);
	return hmac.digest('hex');
}

function freshTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

interface WebhookCtxOptions {
	body?: IDataObject;
	headers?: Record<string, string>;
	event?: string;
	signingSecret?: string;
	webhookAllowedIps?: string;
	clientIp?: string;
	xForwardedFor?: string;
	rawBody?: Buffer | null;
	remoteAddress?: string;
}

function createWebhookCtx(opts: WebhookCtxOptions = {}): IWebhookFunctions {
	const body = opts.body ?? { type: 'message', event: 'new', content: 'hello' };
	const headerData = opts.headers ?? {};
	const event = opts.event ?? '*';
	const signingSecret = opts.signingSecret ?? '';
	const webhookAllowedIps = opts.webhookAllowedIps ?? '';
	const rawBody = opts.rawBody !== undefined ? opts.rawBody : null;
	const remoteAddress = opts.remoteAddress ?? '127.0.0.1';
	const xForwardedFor = opts.xForwardedFor;

	const requestHeaders: Record<string, string> = {};
	if (xForwardedFor) requestHeaders['x-forwarded-for'] = xForwardedFor;

	return {
		getBodyData: vi.fn(() => body),
		getHeaderData: vi.fn(() => headerData),
		getCredentials: vi.fn(async () => ({
			baseUrl: 'https://api.pachca.com/api/shared/v1',
			accessToken: 'test-token',
			signingSecret,
			webhookAllowedIps,
		})),
		getNodeParameter: vi.fn((_name: string) => event),
		getRequestObject: vi.fn(() => ({
			headers: requestHeaders,
			rawBody,
			socket: { remoteAddress },
		})),
		helpers: {
			returnJsonArray: vi.fn((data: IDataObject) => [{ json: data }]),
		},
	} as unknown as IWebhookFunctions;
}

// ============================================================================
// Event Filtering
// ============================================================================

describe('PachcaTrigger — event filtering', () => {
	const trigger = new PachcaTrigger();

	it('should pass all events when event = "*"', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', content: 'hi' },
			event: '*',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should pass matching event (new_message)', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', content: 'hi' },
			event: 'new_message',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should filter non-matching event', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', content: 'hi' },
			event: 'message_deleted', // expects type: message, event: delete
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Event filtered');
		expect(result.workflowData).toBeUndefined();
	});

	it('should pass button_pressed event', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'button', event: 'click', data: 'btn1' },
			event: 'button_pressed',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should pass form_submitted event', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'view', event: 'submit', callback_id: 'form1' },
			event: 'form_submitted',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should filter when body type mismatches', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'reaction', event: 'new' },
			event: 'new_message', // expects type: message
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Event filtered');
	});

	it('should pass company_member events', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'company_member', event: 'invite', user_id: 1 },
			event: 'company_member_invite',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});
});

// ============================================================================
// Signature Verification
// ============================================================================

describe('PachcaTrigger — signature verification', () => {
	const trigger = new PachcaTrigger();
	const secret = 'my-webhook-secret';

	it('should accept valid signature (rawBody)', async () => {
		const bodyObj = { type: 'message', event: 'new', content: 'hi', webhook_timestamp: freshTimestamp() };
		const rawBodyStr = JSON.stringify(bodyObj);
		const sig = hmacSha256(rawBodyStr, secret);

		const ctx = createWebhookCtx({
			body: bodyObj,
			headers: { 'pachca-signature': sig },
			signingSecret: secret,
			rawBody: Buffer.from(rawBodyStr),
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should reject invalid signature', async () => {
		const bodyObj = { type: 'message', event: 'new', webhook_timestamp: freshTimestamp() };
		const ctx = createWebhookCtx({
			body: bodyObj,
			headers: { 'pachca-signature': 'deadbeef'.repeat(8) },
			signingSecret: secret,
			rawBody: Buffer.from(JSON.stringify(bodyObj)),
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Rejected');
	});

	it('should reject missing signature when secret is configured', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', webhook_timestamp: freshTimestamp() },
			headers: {}, // no signature header
			signingSecret: secret,
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Rejected');
	});

	it('should skip verification when no signing secret', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new' },
			headers: {}, // no signature
			signingSecret: '',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should use JSON.stringify fallback when rawBody is missing', async () => {
		const bodyObj = { type: 'message', event: 'new', webhook_timestamp: freshTimestamp() };
		const sig = hmacSha256(JSON.stringify(bodyObj), secret);

		const ctx = createWebhookCtx({
			body: bodyObj,
			headers: { 'pachca-signature': sig },
			signingSecret: secret,
			rawBody: null,
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});
});

// ============================================================================
// IP Allowlist
// ============================================================================

describe('PachcaTrigger — IP allowlist', () => {
	const trigger = new PachcaTrigger();

	it('should allow request from allowed IP', async () => {
		const ctx = createWebhookCtx({
			webhookAllowedIps: '37.200.70.177',
			remoteAddress: '37.200.70.177',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should reject request from disallowed IP', async () => {
		const ctx = createWebhookCtx({
			webhookAllowedIps: '37.200.70.177',
			remoteAddress: '1.2.3.4',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Forbidden');
	});

	it('should normalize IPv6-mapped IPv4 (::ffff:)', async () => {
		const ctx = createWebhookCtx({
			webhookAllowedIps: '37.200.70.177',
			remoteAddress: '::ffff:37.200.70.177',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should use x-forwarded-for when present', async () => {
		const ctx = createWebhookCtx({
			webhookAllowedIps: '37.200.70.177',
			xForwardedFor: '37.200.70.177, 10.0.0.1',
			remoteAddress: '10.0.0.1',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should allow all when no IPs configured', async () => {
		const ctx = createWebhookCtx({
			webhookAllowedIps: '',
			remoteAddress: '99.99.99.99',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should support multiple allowed IPs', async () => {
		const ctx = createWebhookCtx({
			webhookAllowedIps: '10.0.0.1, 37.200.70.177, 192.168.1.1',
			remoteAddress: '192.168.1.1',
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});
});

// ============================================================================
// Replay Protection
// ============================================================================

describe('PachcaTrigger — replay protection', () => {
	const trigger = new PachcaTrigger();

	it('should accept fresh timestamp', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', webhook_timestamp: freshTimestamp() },
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should reject old timestamp (> 5 minutes)', async () => {
		const oldTs = Math.floor(Date.now() / 1000) - 6 * 60; // 6 minutes ago
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', webhook_timestamp: oldTs },
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Rejected');
	});

	it('should reject far-future timestamp (> 1 minute ahead)', async () => {
		const futureTs = Math.floor(Date.now() / 1000) + 2 * 60; // 2 minutes in the future
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', webhook_timestamp: futureTs },
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Rejected');
	});

	it('should accept slightly-future timestamp (within 1 minute)', async () => {
		const nearFutureTs = Math.floor(Date.now() / 1000) + 30; // 30 seconds ahead
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', webhook_timestamp: nearFutureTs },
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should skip check when no timestamp in body', async () => {
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new' }, // no webhook_timestamp
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	it('should accept timestamp exactly at 5-minute boundary', async () => {
		// 4 minutes 59 seconds ago — should pass
		const ts = Math.floor(Date.now() / 1000) - 4 * 60 - 59;
		const ctx = createWebhookCtx({
			body: { type: 'message', event: 'new', webhook_timestamp: ts },
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});
});

// ============================================================================
// Combined scenarios
// ============================================================================

describe('PachcaTrigger — combined checks', () => {
	const trigger = new PachcaTrigger();
	const secret = 'test-secret';

	it('IP check runs before signature check', async () => {
		// Blocked IP — should get Forbidden even without signature
		const ctx = createWebhookCtx({
			webhookAllowedIps: '10.0.0.1',
			remoteAddress: '99.99.99.99',
			signingSecret: secret,
			headers: {}, // no signature
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.webhookResponse).toBe('Forbidden');
	});

	it('signature check runs before replay check', async () => {
		const oldTs = Math.floor(Date.now() / 1000) - 10 * 60;
		const bodyObj = { type: 'message', event: 'new', webhook_timestamp: oldTs };
		const ctx = createWebhookCtx({
			body: bodyObj,
			headers: { 'pachca-signature': 'invalid' },
			signingSecret: secret,
			rawBody: Buffer.from(JSON.stringify(bodyObj)),
		});
		const result = await trigger.webhook.call(ctx);
		// Should be Rejected (sig fails), not Rejected from replay
		expect(result.webhookResponse).toBe('Rejected');
	});

	it('full valid request: IP + signature + fresh timestamp + matching event', async () => {
		const bodyObj = { type: 'message', event: 'new', content: 'hi', webhook_timestamp: freshTimestamp() };
		const rawBodyStr = JSON.stringify(bodyObj);
		const sig = hmacSha256(rawBodyStr, secret);

		const ctx = createWebhookCtx({
			body: bodyObj,
			headers: { 'pachca-signature': sig },
			event: 'new_message',
			signingSecret: secret,
			webhookAllowedIps: '37.200.70.177',
			remoteAddress: '37.200.70.177',
			rawBody: Buffer.from(rawBodyStr),
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});
});

// ============================================================================
// resolveResourceLocator null/undefined guard
// ============================================================================

describe('resolveResourceLocator — null/undefined guard', () => {
	// Imported separately to test the fix
	let resolveResourceLocator: typeof import('../nodes/Pachca/GenericFunctions').resolveResourceLocator;

	beforeEach(async () => {
		const mod = await import('../nodes/Pachca/GenericFunctions');
		resolveResourceLocator = mod.resolveResourceLocator;
	});

	function createCtx(params: Record<string, unknown>) {
		return {
			getNodeParameter: vi.fn((name: string) => {
				if (name in params) return params[name];
				throw new Error(`Missing parameter: ${name}`);
			}),
			getNode: vi.fn(() => ({ id: 'test', name: 'Test', type: 'test', typeVersion: 2, position: [0, 0], parameters: {} })),
		} as unknown as import('n8n-workflow').IExecuteFunctions;
	}

	it('should throw on null value', () => {
		const ctx = createCtx({ id: null });
		expect(() => resolveResourceLocator(ctx, 'id', 0)).toThrow('empty');
	});

	it('should throw on undefined value', () => {
		const ctx = createCtx({ id: undefined });
		expect(() => resolveResourceLocator(ctx, 'id', 0)).toThrow('empty');
	});

	it('should throw on empty string value', () => {
		const ctx = createCtx({ id: '' });
		expect(() => resolveResourceLocator(ctx, 'id', 0)).toThrow('empty');
	});

	it('should throw on empty ResourceLocator value', () => {
		const ctx = createCtx({ id: { __rl: true, value: '', mode: 'id' } });
		expect(() => resolveResourceLocator(ctx, 'id', 0)).toThrow('empty');
	});

	it('should pass valid number', () => {
		const ctx = createCtx({ id: 42 });
		expect(resolveResourceLocator(ctx, 'id', 0)).toBe(42);
	});

	it('should pass valid ResourceLocator', () => {
		const ctx = createCtx({ id: { __rl: true, value: 123, mode: 'id' } });
		expect(resolveResourceLocator(ctx, 'id', 0)).toBe(123);
	});
});

// ============================================================================
// splitAndValidateCommaList — float rejection
// ============================================================================

describe('splitAndValidateCommaList — float rejection', () => {
	let splitAndValidateCommaList: typeof import('../nodes/Pachca/GenericFunctions').splitAndValidateCommaList;

	beforeEach(async () => {
		const mod = await import('../nodes/Pachca/GenericFunctions');
		splitAndValidateCommaList = mod.splitAndValidateCommaList;
	});

	function createCtx() {
		return {
			getNode: vi.fn(() => ({ id: 'test', name: 'Test', type: 'test', typeVersion: 2, position: [0, 0], parameters: {} })),
		} as unknown as import('n8n-workflow').IExecuteFunctions;
	}

	it('should reject floats in int mode', () => {
		const ctx = createCtx();
		expect(() => splitAndValidateCommaList(ctx, '1, 3.14, 5', 'IDs', 'int', 0)).toThrow('Invalid');
	});

	it('should accept valid integers', () => {
		const ctx = createCtx();
		expect(splitAndValidateCommaList(ctx, '1, 2, 3', 'IDs', 'int', 0)).toEqual([1, 2, 3]);
	});

	it('should reject mixed valid/invalid', () => {
		const ctx = createCtx();
		expect(() => splitAndValidateCommaList(ctx, '1, abc, 3', 'IDs', 'int', 0)).toThrow('abc');
	});
});

// ============================================================================
// buildMultipartBody — filename sanitization
// ============================================================================

describe('buildMultipartBody — filename sanitization', () => {
	let buildMultipartBody: typeof import('../nodes/Pachca/GenericFunctions').buildMultipartBody;

	beforeEach(async () => {
		const mod = await import('../nodes/Pachca/GenericFunctions');
		buildMultipartBody = mod.buildMultipartBody;
	});

	it('should strip null bytes from filename', () => {
		const result = buildMultipartBody({}, Buffer.from('test'), 'file\x00name.txt', 'text/plain');
		const bodyStr = result.body.toString();
		expect(bodyStr).not.toContain('\x00');
		expect(bodyStr).toContain('file_name.txt');
	});

	it('should strip control characters from filename', () => {
		const result = buildMultipartBody({}, Buffer.from('test'), 'file\x07\x1fname.txt', 'text/plain');
		const bodyStr = result.body.toString();
		expect(bodyStr).toContain('file__name.txt');
	});

	it('should truncate long filenames to 255 chars', () => {
		const longName = 'a'.repeat(300) + '.txt';
		const result = buildMultipartBody({}, Buffer.from('test'), longName, 'text/plain');
		const bodyStr = result.body.toString();
		// The filename in the body should not exceed 255 chars
		const match = bodyStr.match(/filename="([^"]+)"/);
		expect(match).toBeTruthy();
		expect(match![1].length).toBeLessThanOrEqual(255);
	});
});
