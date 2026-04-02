import { describe, it, expect, vi, beforeEach } from 'vitest';
import { router } from '../nodes/Pachca/SharedRouter';
import * as GenericFunctions from '../nodes/Pachca/GenericFunctions';

// ============================================================================
// Mock IExecuteFunctions context
// ============================================================================

interface MockCall {
	method: string;
	url: string;
	body?: unknown;
	qs?: unknown;
}

function createMockContext(opts: {
	resource: string;
	operation: string;
	nodeVersion?: number;
	params?: Record<string, unknown>;
	inputData?: unknown[];
	continueOnFail?: boolean;
}) {
	const version = opts.nodeVersion ?? 2;
	const params = opts.params ?? {};
	const calls: MockCall[] = [];

	const ctx = {
		getInputData: () =>
			(opts.inputData ?? [{}]).map((json) => ({ json: json as Record<string, unknown> })),
		getNodeParameter: vi.fn((name: string, _index: number, defaultVal?: unknown) => {
			if (name === 'resource') return opts.resource;
			if (name === 'operation') return opts.operation;
			if (name in params) return params[name];
			if (defaultVal !== undefined) return defaultVal;
			throw new Error(`Missing parameter: ${name}`);
		}),
		getNode: () => ({
			typeVersion: version,
			name: 'Pachca',
			type: 'n8n-nodes-pachca.pachca',
		}),
		getCredentials: vi.fn(async () => ({
			baseUrl: 'https://api.pachca.com/api/shared/v1',
			accessToken: 'test-token',
		})),
		helpers: {
			httpRequestWithAuthentication: vi.fn(async (_cred: string, options: { method: string; url: string; body?: unknown; qs?: unknown }) => {
				calls.push({
					method: options.method,
					url: options.url,
					body: options.body,
					qs: options.qs,
				});
				// Default successful response
				return {
					statusCode: 200,
					body: { data: { id: 1, name: 'test' } },
				};
			}),
			httpRequest: vi.fn(async () => Buffer.from('file-content')),
			assertBinaryData: vi.fn(() => ({ fileName: 'test.txt', mimeType: 'text/plain' })),
			getBinaryDataBuffer: vi.fn(async () => Buffer.from('binary-data')),
		},
		continueOnFail: () => opts.continueOnFail ?? false,
		_calls: calls,
	};

	return ctx;
}

// Helper to run router with mock context
async function runRouter(ctx: ReturnType<typeof createMockContext>) {
	return router.call(ctx as any);
}

// Helper to configure mock for paginated response
function mockPaginatedResponse(ctx: ReturnType<typeof createMockContext>, pages: { data: unknown[]; nextCursor?: string }[]) {
	let pageIndex = 0;
	ctx.helpers.httpRequestWithAuthentication.mockImplementation(async (_cred: string, options: any) => {
		ctx._calls.push({ method: options.method, url: options.url, body: options.body, qs: options.qs });
		const page = pages[pageIndex++] ?? { data: [] };
		return {
			statusCode: 200,
			body: {
				data: page.data,
				meta: page.nextCursor ? { paginate: { next_page: page.nextCursor } } : {},
			},
		};
	});
}

// Helper to override mock response while preserving call tracking
function mockResponse(ctx: ReturnType<typeof createMockContext>, response: { statusCode: number; body: unknown }) {
	ctx.helpers.httpRequestWithAuthentication.mockImplementation(async (_cred: string, options: any) => {
		ctx._calls.push({ method: options.method, url: options.url, body: options.body, qs: options.qs });
		return response;
	});
}

// ============================================================================
// ROUTER DISPATCH TESTS
// ============================================================================

describe('Router dispatch', () => {
	it('dispatches to correct resource/operation', async () => {
		const ctx = createMockContext({ resource: 'profile', operation: 'get' });
		const result = await runRouter(ctx);

		expect(result).toHaveLength(1); // single output array
		expect(result[0]).toHaveLength(1); // one item
		expect(ctx._calls).toHaveLength(1);
		expect(ctx._calls[0].method).toBe('GET');
		expect(ctx._calls[0].url).toContain('/profile');
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({ resource: 'profile', operation: 'nonexistent' });
		await expect(runRouter(ctx)).rejects.toThrow('Unknown operation');
	});

	it('continueOnFail catches errors', async () => {
		const ctx = createMockContext({
			resource: 'profile',
			operation: 'nonexistent',
			continueOnFail: true,
		});
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toHaveProperty('error');
		expect(result[0][0]).toHaveProperty('pairedItem', { item: 0 });
	});

	it('adds pairedItem to every result', async () => {
		const ctx = createMockContext({ resource: 'profile', operation: 'get' });
		const result = await runRouter(ctx);
		expect(result[0][0]).toHaveProperty('pairedItem', { item: 0 });
	});
});

// ============================================================================
// PATH PARAMETER TESTS
// ============================================================================

describe('Path parameters', () => {
	it('substitutes path params into URL', async () => {
		const ctx = createMockContext({
			resource: 'task',
			operation: 'get',
			params: { id: 42 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/tasks/42');
	});

	it('resolves resourceLocator params', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'get',
			params: { id: { __rl: true, value: 123, mode: 'id' } },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/chats/123');
	});

	it('uses v1Fallback when main param missing', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'get',
			nodeVersion: 1,
			params: { messageId: 999 },
		});
		// Override getNodeParameter to throw on 'id' but return messageId
		ctx.getNodeParameter.mockImplementation((name: string, _index: number, defaultVal?: unknown) => {
			if (name === 'resource') return 'message';
			if (name === 'operation') return 'get'; // v1 operation mapped via V1_OP_MAP
			if (name === 'messageId') return 999;
			if (name === 'id') throw new Error('Missing parameter: id');
			if (defaultVal !== undefined) return defaultVal;
			throw new Error(`Missing parameter: ${name}`);
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/messages/999');
	});

	it('handles multiple path params', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'removeUser',
			params: { chatId: 10, userId: 20 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/chats/10/members/20');
	});
});

// ============================================================================
// BODY WRAPPING TESTS
// ============================================================================

describe('Body wrapping', () => {
	it('wraps body in wrapperKey', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'create',
			params: { chatName: 'Test Chat', additionalFields: {} },
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as Record<string, unknown>;
		expect(body).toHaveProperty('chat');
		expect((body.chat as Record<string, unknown>).name).toBe('Test Chat');
	});

	it('keeps sibling fields outside wrapper', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'create',
			params: {
				email: 'test@test.com',
				additionalFields: { skipEmailNotify: true, firstName: 'John' },
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as Record<string, unknown>;
		expect(body).toHaveProperty('user');
		expect(body).toHaveProperty('skip_email_notify', true);
		expect((body.user as Record<string, unknown>)).toHaveProperty('first_name', 'John');
		expect((body.user as Record<string, unknown>)).not.toHaveProperty('skip_email_notify');
	});

	it('sends body without wrapper when no wrapperKey', async () => {
		const ctx = createMockContext({
			resource: 'reaction',
			operation: 'create',
			params: { reactionsMessageId: 100, reactionsReactionCode: '👍', additionalFields: {} },
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as Record<string, unknown>;
		expect(body).toHaveProperty('code', '👍');
		expect(body).not.toHaveProperty('reaction');
	});
});

// ============================================================================
// QUERY PARAMETER TESTS
// ============================================================================

describe('Query parameters', () => {
	it('sends query params from queryMap', async () => {
		const ctx = createMockContext({
			resource: 'customProperty',
			operation: 'get',
			params: { entityType: 'User' },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].qs).toEqual({ entity_type: 'User' });
	});

	it('sends optional query params from additionalFields', async () => {
		const ctx = createMockContext({
			resource: 'security',
			operation: 'getAll',
			params: {
				returnAll: true,
				additionalFields: { eventKey: 'login', actorType: 'user' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [{ id: 1 }] }]);
		await runRouter(ctx);
		const qs = ctx._calls[0].qs as Record<string, unknown>;
		expect(qs).toHaveProperty('event_key', 'login');
		expect(qs).toHaveProperty('actor_type', 'user');
	});

	it('skips empty/null query params', async () => {
		const ctx = createMockContext({
			resource: 'customProperty',
			operation: 'get',
			params: { entityType: '' },
		});
		// entityType is '' so should be skipped
		ctx.getNodeParameter.mockImplementation((name: string, _index: number, defaultVal?: unknown) => {
			if (name === 'resource') return 'customProperty';
			if (name === 'operation') return 'get';
			if (name === 'entityType') return '';
			if (defaultVal !== undefined) return defaultVal;
			throw new Error(`Missing: ${name}`);
		});
		await runRouter(ctx);
		expect(ctx._calls[0].qs).toBeUndefined();
	});
});

// ============================================================================
// COMMA-TO-ARRAY CONVERSION
// ============================================================================

describe('Comma-to-array conversion', () => {
	it('splits comma-separated IDs into integer array', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'create',
			params: { chatName: 'Test', additionalFields: { memberIds: '1,2,3' } },
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.chat.member_ids).toEqual([1, 2, 3]);
	});

	it('validates integer IDs and rejects invalid values', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'create',
			params: { chatName: 'Test', additionalFields: { memberIds: '1,abc,3' } },
		});
		await expect(runRouter(ctx)).rejects.toThrow(/must be numbers/);
	});
});

// ============================================================================
// fixedCollection subKey HANDLING
// ============================================================================

describe('fixedCollection subKey', () => {
	it('extracts inner array from fixedCollection object', async () => {
		const ctx = createMockContext({
			resource: 'task',
			operation: 'create',
			params: {
				taskKind: 'task',
				additionalFields: {
					customProperties: { property: [{ id: 1, value: 'val1' }] },
				},
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.task.custom_properties).toEqual([{ id: 1, value: 'val1' }]);
	});
});

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

describe('DELETE operations', () => {
	it('returns { success: true } for delete', async () => {
		const ctx = createMockContext({
			resource: 'task',
			operation: 'delete',
			params: { id: 42 },
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		const result = await runRouter(ctx);
		expect(result[0][0].json).toEqual({ success: true });
	});
});

// ============================================================================
// noDataWrapper OPERATIONS
// ============================================================================

describe('noDataWrapper operations', () => {
	it('returns full response for export.get (no .data unwrap)', async () => {
		const ctx = createMockContext({
			resource: 'export',
			operation: 'get',
			params: { id: 1 },
		});
		const rawResponse = { id: 1, status: 'completed', url: 'https://...' };
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({
			statusCode: 200,
			body: rawResponse,
		});
		const result = await runRouter(ctx);
		expect(result[0][0].json).toEqual(rawResponse);
	});
});

// ============================================================================
// SPECIAL HANDLERS
// ============================================================================

describe('Special: messageButtons', () => {
	it('calls buildButtonRows and includes buttons in body', async () => {
		const spy = vi.spyOn(GenericFunctions, 'buildButtonRows').mockReturnValue([[{ text: 'Click' }]]);
		const fileSpy = vi.spyOn(GenericFunctions, 'cleanFileAttachments').mockReturnValue([]);

		const ctx = createMockContext({
			resource: 'message',
			operation: 'create',
			params: {
				entityType: 'discussion',
				entityId: 1,
				content: 'Hello',
				additionalFields: {},
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.message.buttons).toEqual([[{ text: 'Click' }]]);

		spy.mockRestore();
		fileSpy.mockRestore();
	});

	it('calls cleanFileAttachments and includes files in body', async () => {
		const spy = vi.spyOn(GenericFunctions, 'buildButtonRows').mockReturnValue([]);
		const fileSpy = vi.spyOn(GenericFunctions, 'cleanFileAttachments').mockReturnValue([
			{ key: 'uploads/test.pdf', file_type: 'file' },
		]);

		const ctx = createMockContext({
			resource: 'message',
			operation: 'create',
			params: {
				entityType: 'discussion',
				entityId: 1,
				content: 'With file',
				additionalFields: {},
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.message.files).toEqual([{ key: 'uploads/test.pdf', file_type: 'file' }]);

		spy.mockRestore();
		fileSpy.mockRestore();
	});
});

describe('Special: formBlocks', () => {
	it('calls resolveFormBlocksFromParams and includes blocks in body', async () => {
		const spy = vi.spyOn(GenericFunctions, 'resolveFormBlocksFromParams').mockReturnValue([
			{ type: 'header', text: 'Test' },
		]);

		const ctx = createMockContext({
			resource: 'form',
			operation: 'create',
			params: {
				formTitle: 'My Form',
				type: 'modal',
				triggerId: 'abc123',
				additionalFields: {},
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.view.blocks).toEqual([{ type: 'header', text: 'Test' }]);

		spy.mockRestore();
	});
});

describe('Special: botWebhook', () => {
	it('nests webhookUrl inside webhook object', async () => {
		const ctx = createMockContext({
			resource: 'bot',
			operation: 'update',
			params: { botId: 5, webhookUrl: 'https://example.com/webhook', additionalFields: {} },
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.bot.webhook).toEqual({ outgoing_url: 'https://example.com/webhook' });
	});
});

describe('Special: fileUpload', () => {
	it('calls uploadFileToS3', async () => {
		const spy = vi.spyOn(GenericFunctions, 'uploadFileToS3').mockResolvedValue({
			key: 'uploads/test.txt',
			file_name: 'test.txt',
			content_type: 'text/plain',
			size: 100,
		});

		const ctx = createMockContext({
			resource: 'file',
			operation: 'create',
			params: { fileSource: 'binary', binaryProperty: 'data' },
		});
		const result = await runRouter(ctx);
		expect(result[0][0].json).toHaveProperty('key', 'uploads/test.txt');
		expect(spy).toHaveBeenCalledTimes(1);

		spy.mockRestore();
	});
});

describe('Special: formProcessSubmission', () => {
	it('passes through input data without API call', async () => {
		const inputData = { type: 'view_submission', payload: { values: { feedback: 'great' } } };
		const ctx = createMockContext({
			resource: 'form',
			operation: 'processSubmission',
			inputData: [inputData],
		});
		const result = await runRouter(ctx);
		expect(result[0][0].json).toEqual(inputData);
		expect(ctx._calls).toHaveLength(0); // no API call made
	});
});

describe('Special: formGetTemplates', () => {
	it('returns all templates without API call', async () => {
		const ctx = createMockContext({
			resource: 'form',
			operation: 'getTemplates',
		});
		const result = await runRouter(ctx);
		const templateNames = result[0].map((item) => item.json.name);
		expect(templateNames).toContain('feedback');
		expect(templateNames).toContain('timeoff');
		expect(templateNames).toContain('survey');
		expect(templateNames).toContain('bug_report');
		expect(ctx._calls).toHaveLength(0); // no API call
	});
});

// ============================================================================
// SIMPLIFY MODE
// ============================================================================

describe('Simplify mode', () => {
	it('v2 GET single returns simplified item when simplify=true', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'get',
			nodeVersion: 2,
			params: { id: 1, simplify: true },
		});
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({
			statusCode: 200,
			body: {
				data: {
					id: 1, entity_id: 10, chat_id: 5, content: 'Hi', user_id: 3, created_at: '2026-01-01',
					updated_at: '2026-01-02', message_chat_id: 5, files: [], buttons: [],
				},
			},
		});
		const result = await runRouter(ctx);
		const json = result[0][0].json;
		expect(json).toHaveProperty('id');
		expect(json).toHaveProperty('content');
		expect(json).not.toHaveProperty('updated_at');
		expect(json).not.toHaveProperty('files');
		expect(json).not.toHaveProperty('buttons');
	});

	it('v1 GET single does NOT simplify even with simplify=true', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'get',
			nodeVersion: 1,
			params: { id: 1, simplify: true },
		});
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({
			statusCode: 200,
			body: {
				data: {
					id: 1, entity_id: 10, chat_id: 5, content: 'Hi', user_id: 3, created_at: '2026-01-01',
					updated_at: '2026-01-02',
				},
			},
		});
		const result = await runRouter(ctx);
		const json = result[0][0].json;
		expect(json).toHaveProperty('updated_at'); // not simplified
	});
});

// ============================================================================
// V1 COMPATIBILITY: RESOURCE MAPPING
// ============================================================================

describe('V1 resource mapping', () => {
	it('maps v1 "customFields" to "customProperty"', async () => {
		const ctx = createMockContext({
			resource: 'customFields',
			operation: 'getCustomProperties', // v1 op name
			nodeVersion: 1,
			params: { entityType: 'User' },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/custom_properties');
	});

	it('maps v1 "status" to "profile"', async () => {
		const ctx = createMockContext({
			resource: 'status',
			operation: 'getProfile', // v1 op name
			nodeVersion: 1,
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/profile');
	});

	it('maps v1 "reactions" to "reaction"', async () => {
		const ctx = createMockContext({
			resource: 'reactions',
			operation: 'addReaction', // v1 op name
			nodeVersion: 1,
			params: { reactionsMessageId: 100, reactionsReactionCode: '👍', additionalFields: {} },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/messages/100/reactions');
	});
});

// ============================================================================
// V1 COMPATIBILITY: OPERATION MAPPING
// ============================================================================

describe('V1 operation mapping', () => {
	it('maps message "send" → "create"', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'send',
			nodeVersion: 1,
			params: {
				entityType: 'discussion',
				entityId: 1,
				content: 'Hello from v1',
				additionalFields: {},
			},
		});
		vi.spyOn(GenericFunctions, 'buildButtonRows').mockReturnValue([]);
		vi.spyOn(GenericFunctions, 'cleanFileAttachments').mockReturnValue([]);
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/messages');
		vi.restoreAllMocks();
	});

	it('maps message "getById" → "get"', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'getById',
			nodeVersion: 1,
			params: { messageId: 42 },
		});
		ctx.getNodeParameter.mockImplementation((name: string, _index: number, defaultVal?: unknown) => {
			if (name === 'resource') return 'message';
			if (name === 'operation') return 'getById';
			if (name === 'messageId') return 42;
			if (name === 'id') throw new Error('Missing');
			if (defaultVal !== undefined) return defaultVal;
			throw new Error(`Missing: ${name}`);
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/messages/42');
	});

	it('maps chat "getById" → "get"', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'getById',
			nodeVersion: 1,
			params: { chatId: 55 },
		});
		ctx.getNodeParameter.mockImplementation((name: string, _index: number, defaultVal?: unknown) => {
			if (name === 'resource') return 'chat';
			if (name === 'operation') return 'getById';
			if (name === 'chatId') return 55;
			if (name === 'id') throw new Error('Missing');
			if (defaultVal !== undefined) return defaultVal;
			throw new Error(`Missing: ${name}`);
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/chats/55');
	});

	it('maps user "getById" → "get"', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getById',
			nodeVersion: 1,
			params: { userId: 77 },
		});
		ctx.getNodeParameter.mockImplementation((name: string, _index: number, defaultVal?: unknown) => {
			if (name === 'resource') return 'user';
			if (name === 'operation') return 'getById';
			if (name === 'userId') return 77;
			if (name === 'id') throw new Error('Missing');
			if (defaultVal !== undefined) return defaultVal;
			throw new Error(`Missing: ${name}`);
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/users/77');
	});

	it('maps profile "updateStatus" → "updateStatus" (via status→profile resource map)', async () => {
		const ctx = createMockContext({
			resource: 'status',
			operation: 'updateStatus',
			nodeVersion: 1,
			params: { statusEmoji: '🏖️', statusTitle: 'On vacation', additionalFields: {} },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('PUT');
		expect(ctx._calls[0].url).toContain('/profile/status');
		const body = ctx._calls[0].body as any;
		expect(body.status.emoji).toBe('🏖️');
		expect(body.status.title).toBe('On vacation');
	});

	it('maps reaction "addReaction" → "create"', async () => {
		const ctx = createMockContext({
			resource: 'reactions',
			operation: 'addReaction',
			nodeVersion: 1,
			params: { reactionsMessageId: 100, reactionsReactionCode: '❤️', additionalFields: {} },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/messages/100/reactions');
	});

	it('maps file "upload" → "create"', async () => {
		const spy = vi.spyOn(GenericFunctions, 'uploadFileToS3').mockResolvedValue({
			key: 'uploads/test.txt', file_name: 'test.txt', content_type: 'text/plain', size: 42,
		});
		const ctx = createMockContext({
			resource: 'file',
			operation: 'upload',
			nodeVersion: 1,
			params: { fileSource: 'binary', binaryProperty: 'data' },
		});
		const result = await runRouter(ctx);
		expect(result[0][0].json).toHaveProperty('key', 'uploads/test.txt');
		spy.mockRestore();
	});

	it('maps form "createView" → "create"', async () => {
		const spy = vi.spyOn(GenericFunctions, 'resolveFormBlocksFromParams').mockReturnValue([]);
		const ctx = createMockContext({
			resource: 'form',
			operation: 'createView',
			nodeVersion: 1,
			params: {
				formTitle: 'Test',
				type: 'modal',
				triggerId: 'xyz',
				additionalFields: {},
			},
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/views/open');
		spy.mockRestore();
	});

	it('maps thread "createThread" → "create"', async () => {
		const ctx = createMockContext({
			resource: 'thread',
			operation: 'createThread',
			nodeVersion: 1,
			params: { threadMessageId: 50 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/messages/50/thread');
	});

	it('maps thread "getThread" → "get"', async () => {
		const ctx = createMockContext({
			resource: 'thread',
			operation: 'getThread',
			nodeVersion: 1,
			params: { threadThreadId: 60 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/threads/60');
	});

	it('maps groupTag "getById" → "get"', async () => {
		const ctx = createMockContext({
			resource: 'groupTag',
			operation: 'getById',
			nodeVersion: 1,
			params: { groupTagId: 33 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/group_tags/33');
	});
});

// ============================================================================
// V1 ALIAS OPERATIONS
// ============================================================================

describe('V1 alias operations (cross-resource)', () => {
	it('chat.getMembers hits GET /chats/{id}/members', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'getMembers',
			nodeVersion: 1,
			params: { chatId: 10, returnAll: true },
		});
		mockPaginatedResponse(ctx, [{ data: [{ id: 1 }, { id: 2 }] }]);
		const result = await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/chats/10/members');
		expect(result[0].length).toBe(2);
	});

	it('chat.addUsers hits POST /chats/{id}/members', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'addUsers',
			nodeVersion: 1,
			params: { chatId: 10, memberIds: '1,2,3', silent: false },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/chats/10/members');
		const body = ctx._calls[0].body as any;
		expect(body.member_ids).toEqual([1, 2, 3]);
	});

	it('chat.removeUser hits DELETE /chats/{id}/members/{userId}', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'removeUser',
			nodeVersion: 1,
			params: { chatId: 10, userId: 5 },
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('DELETE');
		expect(ctx._calls[0].url).toContain('/chats/10/members/5');
	});

	it('chat.updateRole hits PUT /chats/{id}/members/{userId}', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'updateRole',
			nodeVersion: 1,
			params: { chatId: 10, userId: 5, newRole: 'admin' },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('PUT');
		expect(ctx._calls[0].url).toContain('/chats/10/members/5');
	});

	it('chat.leaveChat hits DELETE /chats/{id}/leave', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'leaveChat',
			nodeVersion: 1,
			params: { chatId: 10 },
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('DELETE');
		expect(ctx._calls[0].url).toContain('/chats/10/leave');
	});

	it('message.getReadMembers hits GET /messages/{id}/read_member_ids', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'getReadMembers',
			nodeVersion: 1,
			params: { messageId: 100, returnAll: true },
		});
		mockPaginatedResponse(ctx, [{ data: [{ id: 1 }] }]);
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/messages/100/read_member_ids');
	});

	it('message.unfurl hits POST /messages/{id}/link_previews', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'unfurl',
			nodeVersion: 1,
			params: { messageId: 100, linkPreviews: [{ url: 'https://example.com' }] },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/messages/100/link_previews');
	});

	it('groupTag.addTags hits POST /chats/{id}/group_tags', async () => {
		const ctx = createMockContext({
			resource: 'groupTag',
			operation: 'addTags',
			nodeVersion: 1,
			params: { groupTagChatId: 10, groupTagIds: '1,2' },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/chats/10/group_tags');
	});

	it('groupTag.removeTag hits DELETE /chats/{id}/group_tags/{tagId}', async () => {
		const ctx = createMockContext({
			resource: 'groupTag',
			operation: 'removeTag',
			nodeVersion: 1,
			params: { groupTagChatId: 10, tagId: 5 },
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('DELETE');
		expect(ctx._calls[0].url).toContain('/chats/10/group_tags/5');
	});
});

// ============================================================================
// PAGINATION
// ============================================================================

describe('Pagination', () => {
	it('fetches all pages when returnAll=true', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			params: { returnAll: true, query: 'test', additionalFields: {} },
		});
		mockPaginatedResponse(ctx, [
			{ data: [{ id: 1 }, { id: 2 }], nextCursor: 'cursor1' },
			{ data: [{ id: 3 }] },
		]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(3);
	});

	it('limits results when returnAll=false', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			params: { returnAll: false, limit: 2, query: 'test', additionalFields: {} },
		});
		mockPaginatedResponse(ctx, [
			{ data: [{ id: 1 }, { id: 2 }, { id: 3 }] },
		]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(2);
	});
});

// ============================================================================
// ROUTES TABLE VALIDATION
// ============================================================================

describe('ROUTES table completeness', () => {
	// Verify all expected resources exist
	const expectedResources = [
		'security', 'bot', 'chat', 'member', 'groupTag', 'message',
		'linkPreview', 'reaction', 'readMember', 'thread', 'profile',
		'search', 'task', 'user', 'form', 'export', 'customProperty', 'file',
	];

	for (const res of expectedResources) {
		it(`should have resource "${res}" in ROUTES`, async () => {
			// We test this indirectly by trying to route to a known operation
			// If the resource exists, router won't throw "Unknown operation" for valid ops
			// We just verify the resource name appears in Router.ts
			const routerContent = await import('fs').then((fs) =>
				fs.readFileSync(require('path').resolve(__dirname, '../nodes/Pachca/SharedRouter.ts'), 'utf-8'),
			);
			expect(routerContent).toContain(`\t${res}: {`);
		});
	}
});

// ============================================================================
// MULTI-ITEM PROCESSING
// ============================================================================

describe('Multi-item processing', () => {
	it('processes multiple input items', async () => {
		const ctx = createMockContext({
			resource: 'profile',
			operation: 'get',
			inputData: [{}, {}, {}], // 3 items
		});
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(3);
		expect(result[0][0]).toHaveProperty('pairedItem', { item: 0 });
		expect(result[0][1]).toHaveProperty('pairedItem', { item: 1 });
		expect(result[0][2]).toHaveProperty('pairedItem', { item: 2 });
	});

	it('continues processing on error with continueOnFail', async () => {
		let callCount = 0;
		const ctx = createMockContext({
			resource: 'profile',
			operation: 'get',
			inputData: [{}, {}],
			continueOnFail: true,
		});
		ctx.helpers.httpRequestWithAuthentication.mockImplementation(async () => {
			callCount++;
			if (callCount === 1) {
				return { statusCode: 500, body: { message: 'Internal error' } };
			}
			return { statusCode: 200, body: { data: { id: 1 } } };
		});
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(2);
		expect(result[0][0].json).toHaveProperty('error'); // first failed
		expect(result[0][1].json).toHaveProperty('id', 1); // second succeeded
	});
});

// ============================================================================
// RESOURCE-SPECIFIC OPERATION TESTS
// ============================================================================

describe('Resource operations', () => {
	it('chat.create sends correct body structure', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'create',
			params: {
				chatName: 'Dev Team',
				additionalFields: { channel: true, public: false, memberIds: '1,2' },
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.chat.name).toBe('Dev Team');
		expect(body.chat.channel).toBe(true);
		expect(body.chat.public).toBe(false);
		expect(body.chat.member_ids).toEqual([1, 2]);
	});

	it('chat.archive hits PUT /chats/{id}/archive', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'archive',
			params: { id: { __rl: true, value: 10, mode: 'id' } },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('PUT');
		expect(ctx._calls[0].url).toContain('/chats/10/archive');
	});

	it('chat.unarchive hits PUT /chats/{id}/unarchive', async () => {
		const ctx = createMockContext({
			resource: 'chat',
			operation: 'unarchive',
			params: { id: { __rl: true, value: 10, mode: 'id' } },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('PUT');
		expect(ctx._calls[0].url).toContain('/chats/10/unarchive');
	});

	it('message.pin hits POST /messages/{id}/pin', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'pin',
			params: { id: 42 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/messages/42/pin');
	});

	it('message.unpin hits DELETE /messages/{id}/pin', async () => {
		const ctx = createMockContext({
			resource: 'message',
			operation: 'unpin',
			params: { id: 42 },
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('DELETE');
		expect(ctx._calls[0].url).toContain('/messages/42/pin');
	});

	it('profile.getInfo hits GET /oauth/token/info', async () => {
		const ctx = createMockContext({
			resource: 'profile',
			operation: 'getInfo',
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/oauth/token/info');
	});

	it('profile.getStatus hits GET /profile/status', async () => {
		const ctx = createMockContext({
			resource: 'profile',
			operation: 'getStatus',
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/profile/status');
	});

	it('profile.deleteStatus hits DELETE /profile/status', async () => {
		const ctx = createMockContext({
			resource: 'profile',
			operation: 'deleteStatus',
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('DELETE');
		expect(ctx._calls[0].url).toContain('/profile/status');
	});

	it('export.create sends correct body without wrapper', async () => {
		const ctx = createMockContext({
			resource: 'export',
			operation: 'create',
			params: {
				startAt: '2026-01-01',
				endAt: '2026-01-31',
				webhookUrl: 'https://example.com',
				additionalFields: {},
			},
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.start_at).toBe('2026-01-01');
		expect(body.end_at).toBe('2026-01-31');
		expect(body.webhook_url).toBe('https://example.com');
		// No wrapper key for export
		expect(body).not.toHaveProperty('export');
	});

	it('linkPreview.create sends body to correct endpoint', async () => {
		const ctx = createMockContext({
			resource: 'linkPreview',
			operation: 'create',
			params: { id: 42, linkPreviews: [{ url: 'https://example.com', title: 'Example' }] },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('POST');
		expect(ctx._calls[0].url).toContain('/messages/42/link_previews');
	});

	it('groupTag.create wraps in group_tag key', async () => {
		const ctx = createMockContext({
			resource: 'groupTag',
			operation: 'create',
			params: { groupTagName: 'Engineers' },
		});
		await runRouter(ctx);
		const body = ctx._calls[0].body as any;
		expect(body.group_tag.name).toBe('Engineers');
	});

	it('user.getStatus hits correct endpoint', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getStatus',
			params: { userId: 42 },
		});
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/users/42/status');
	});

	it('reaction.delete sends code as query param', async () => {
		const ctx = createMockContext({
			resource: 'reaction',
			operation: 'delete',
			params: { reactionsMessageId: 100, reactionsReactionCode: '👍', name: '' },
		});
		mockResponse(ctx, { statusCode: 204, body: {} });
		await runRouter(ctx);
		expect(ctx._calls[0].method).toBe('DELETE');
		expect(ctx._calls[0].url).toContain('/messages/100/reactions');
		expect(ctx._calls[0].qs).toHaveProperty('code', '👍');
	});

	it('search.getAllChats sends query', async () => {
		const ctx = createMockContext({
			resource: 'search',
			operation: 'getAllChats',
			params: { returnAll: false, limit: 10, query: 'dev', additionalFields: {} },
		});
		mockPaginatedResponse(ctx, [{ data: [{ id: 1, name: 'dev-team' }] }]);
		await runRouter(ctx);
		expect(ctx._calls[0].url).toContain('/search/chats');
		expect(ctx._calls[0].qs).toHaveProperty('query', 'dev');
	});
});

// ============================================================================
// BUG FIX REGRESSION TESTS
// ============================================================================

describe('BUG 1: v1 user.getAll reads query from additionalOptions', () => {
	it('sends query param when stored in additionalOptions (v1 compat)', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: false,
				limit: 10,
				additionalOptions: { query: 'john' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [{ id: 1, first_name: 'John' }] }]);
		await runRouter(ctx);
		expect(ctx._calls[0].qs).toHaveProperty('query', 'john');
	});

	it('sends query param from top-level (v2)', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 2,
			params: {
				returnAll: false,
				limit: 10,
				query: 'jane',
				additionalFields: {},
			},
		});
		mockPaginatedResponse(ctx, [{ data: [{ id: 2, first_name: 'Jane' }] }]);
		await runRouter(ctx);
		expect(ctx._calls[0].qs).toHaveProperty('query', 'jane');
	});
});

describe('BUG 2: v1 user.getAll applies filterOptions client-side', () => {
	it('filters by role', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterRole: ['admin'] },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, role: 'admin', bot: false, suspended: false },
			{ id: 2, role: 'user', bot: false, suspended: false },
			{ id: 3, role: 'admin', bot: false, suspended: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(2);
		expect(result[0].map(r => r.json.id)).toEqual([1, 3]);
	});

	it('filters bots only', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterBot: 'bots' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, bot: true, role: 'user', suspended: false },
			{ id: 2, bot: false, role: 'user', suspended: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json.id).toBe(1);
	});

	it('filters users only (excludes bots)', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterBot: 'users' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, bot: true, role: 'user', suspended: false },
			{ id: 2, bot: false, role: 'user', suspended: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json.id).toBe(2);
	});

	it('filters suspended only', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterSuspended: 'suspended' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, suspended: true, role: 'user', bot: false },
			{ id: 2, suspended: false, role: 'user', bot: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json.id).toBe(1);
	});

	it('filters active only', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterSuspended: 'active' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, suspended: true, role: 'user', bot: false },
			{ id: 2, suspended: false, role: 'user', bot: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json.id).toBe(2);
	});

	it('filters by invite_status', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterInviteStatus: ['confirmed'] },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, invite_status: 'confirmed', role: 'user', bot: false, suspended: false },
			{ id: 2, invite_status: 'sent', role: 'user', bot: false, suspended: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json.id).toBe(1);
	});

	it('does NOT apply filters in v2 mode', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 2,
			params: {
				returnAll: true,
				additionalFields: {},
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, role: 'admin' },
			{ id: 2, role: 'user' },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(2); // no filtering
	});

	it('combines multiple filters', async () => {
		const ctx = createMockContext({
			resource: 'user',
			operation: 'getAll',
			nodeVersion: 1,
			params: {
				returnAll: true,
				additionalOptions: {},
				filterOptions: { filterRole: ['admin'], filterSuspended: 'active' },
			},
		});
		mockPaginatedResponse(ctx, [{ data: [
			{ id: 1, role: 'admin', suspended: false, bot: false },
			{ id: 2, role: 'admin', suspended: true, bot: false },
			{ id: 3, role: 'user', suspended: false, bot: false },
		] }]);
		const result = await runRouter(ctx);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json.id).toBe(1);
	});
});
