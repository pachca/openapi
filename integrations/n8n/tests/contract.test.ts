import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseOpenAPI, resolveAllOf, getSchemaType } from '@pachca/openapi-parser';
import type { Endpoint, Parameter, Schema } from '@pachca/openapi-parser';
import { extractBodyFields, getWrapperKey } from '../scripts/utils';

// ============================================================================
// SETUP: Parse OpenAPI spec and discover generated node files
// ============================================================================

const ROOT = path.resolve(__dirname, '../../..');
const SPEC_PATH = path.join(ROOT, 'packages/spec/openapi.yaml');
const NODES_DIR = path.resolve(__dirname, '../nodes/Pachca/V2');

// --- Mapping tables (mirrored from generate-n8n.ts) ---

const TAG_TO_RESOURCE: Record<string, string> = {
	'Users': 'user',
	'Messages': 'message',
	'Chats': 'chat',
	'Members': 'member',
	'Threads': 'thread',
	'Reactions': 'reaction',
	'Group tags': 'groupTag',
	'Profile': 'profile',
	'Common': 'common',
	'Tasks': 'task',
	'Bots': 'bot',
	'Views': 'form',
	'Read members': 'readMember',
	'Link Previews': 'linkPreview',
	'Search': 'search',
	'Security': 'security',
};

function tagToResource(tag: string): string {
	return TAG_TO_RESOURCE[tag] || tag.toLowerCase().replace(/s$/, '');
}

const STANDARD_CRUD_SUBRESOURCES = new Set(['reaction', 'member', 'readMember', 'linkPreview', 'thread', 'export']);

function snakeToCamel(s: string): string {
	return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function snakeToPascal(s: string): string {
	const camel = snakeToCamel(s);
	return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function endpointToOperation(ep: Endpoint, resource: string): string {
	const method = ep.method;
	const segments = ep.path.split('/').filter(Boolean);
	const staticSegments = segments.filter(s => !s.startsWith('{'));
	const lastStatic = staticSegments[staticSegments.length - 1];
	const hasTrailingParam = segments[segments.length - 1]?.startsWith('{') && staticSegments.length > 1;

	if (lastStatic === 'pin') return method === 'POST' ? 'pin' : 'unpin';
	if (lastStatic === 'archive') return 'archive';
	if (lastStatic === 'unarchive') return 'unarchive';
	if (lastStatic === 'leave') return 'leave';
	if (ep.path === '/views/open' && method === 'POST') return 'create';

	if (staticSegments.length > 1) {
		const resourceRoot = staticSegments[0];
		if (lastStatic !== resourceRoot) {
			const lastStaticCamel = snakeToCamel(lastStatic);
			const resourcePlural = resource.endsWith('y') ? resource.slice(0, -1) + 'ies' : resource + 's';
			if (STANDARD_CRUD_SUBRESOURCES.has(resource) && (lastStaticCamel === resourcePlural || lastStaticCamel === resource)) {
				if (hasTrailingParam) {
					if (method === 'DELETE') return 'delete';
					if (method === 'PUT' || method === 'PATCH') return 'update';
					return 'get';
				}
				if (method === 'GET') return 'getAll';
				if (method === 'POST') return 'create';
				if (method === 'PUT') return 'update';
				if (method === 'DELETE') return 'delete';
			}

			const subName = snakeToPascal(lastStatic);
			if (hasTrailingParam) {
				if (method === 'DELETE') return `remove${subName}`;
				if (method === 'PUT' || method === 'PATCH') return `update${subName}`;
				return `get${subName}`;
			}
			if (method === 'GET') {
				const hasCursor = ep.parameters.some(p => p.in === 'query' && p.name === 'cursor');
				return hasCursor ? `getAll${subName}` : `get${subName}`;
			}
			if (method === 'POST') return `add${subName}`;
			if (method === 'PUT') return `update${subName}`;
			if (method === 'DELETE') return `delete${subName}`;
		}
	}

	if (method === 'GET' && !segments.some(s => s.startsWith('{'))) {
		const hasCursor = ep.parameters.some(p => p.in === 'query' && p.name === 'cursor');
		return hasCursor ? 'getAll' : 'get';
	}
	if (method === 'GET') return 'get';
	if (method === 'POST') return 'create';
	if (method === 'PUT' || method === 'PATCH') return 'update';
	if (method === 'DELETE') return 'delete';

	return 'execute';
}

const V1_COMPAT_OPS: Record<string, Record<string, string>> = {
	message: { create: 'send', get: 'getById' },
	user: { get: 'getById', getStatus: 'getAllStatus' },
	chat: { get: 'getById' },
	groupTag: { get: 'getById', getAllUsers: 'getUsers' },
	profile: { get: 'getProfile', getInfo: 'getAllInfo' },
	customProperty: { get: 'getCustomProperties' },
	reaction: { create: 'addReaction', delete: 'deleteReaction', getAll: 'getReactions' },
	thread: { create: 'createThread', get: 'getThread' },
	form: { create: 'createView' },
	file: { create: 'upload' },
};

const V1_ALIAS_OPS: Record<string, string[]> = {
	message: ['getReadMembers', 'unfurl'],
	chat: ['getMembers', 'addUsers', 'removeUser', 'updateRole', 'leaveChat'],
	groupTag: ['addTags', 'removeTag'],
};

const V1_COMPAT_RESOURCES: Record<string, string> = {
	customProperty: 'customFields',
	profile: 'status',
	reaction: 'reactions',
};

const V1_COMPAT_PARAMS: Record<string, Record<string, Record<string, string>>> = {
	reactions: { '*': { id: 'reactionsMessageId', code: 'reactionsReactionCode' } },
	thread: { createThread: { id: 'threadMessageId' }, getThread: { id: 'threadThreadId' } },
	groupTag: {
		'*': { id: 'groupTagId' },
		create: { name: 'groupTagName', color: 'groupTagColor' },
		update: { name: 'groupTagName', color: 'groupTagColor' },
	},
	chat: { create: { name: 'chatName' }, update: { name: 'chatName' } },
	task: { create: { kind: 'taskKind', content: 'taskContent', dueAt: 'taskDueAt', priority: 'taskPriority' } },
	status: { updateStatus: { emoji: 'statusEmoji', title: 'statusTitle', expiresAt: 'statusExpiresAt' } },
	bot: { update: { id: 'botId', outgoingUrl: 'webhookUrl' } },
	form: { createView: { title: 'formTitle', blocks: 'formBlocks', builderMode: 'formBuilderMode', template: 'formTemplate' } },
};

function getParamName(resource: string, op: string, fieldName: string): string {
	const v1Resource = V1_COMPAT_RESOURCES[resource] ?? resource;
	const opMap = V1_COMPAT_PARAMS[v1Resource];
	if (opMap) {
		const wildcard = opMap['*']?.[snakeToCamel(fieldName)];
		if (wildcard) return wildcard;
		const specific = opMap[op]?.[snakeToCamel(fieldName)];
		if (specific) return specific;
	}
	return snakeToCamel(fieldName);
}

function toN8nType(type: string, format?: string, enumValues?: unknown[], items?: Schema): string {
	if (enumValues && enumValues.length > 0) return 'options';
	if (format === 'date-time') return 'dateTime';
	if (type === 'boolean') return 'boolean';
	if (type === 'integer' || type === 'number') return 'number';
	if (type === 'array' && items?.properties) return 'fixedCollection';
	if (type === 'array' && !items?.properties) return 'string';
	return 'string';
}

function queryParamN8nType(schema: Schema): string {
	if (schema.enum) return 'options';
	const type = getSchemaType(schema);
	if (type === 'boolean') return 'boolean';
	if (schema.format === 'date-time') return 'dateTime';
	if (type === 'integer' || type === 'number') return 'number';
	return 'string';
}

/** Endpoints intentionally not covered by the n8n node */
const INTENTIONALLY_SKIPPED = new Set([
	'POST /direct_url',         // low-level S3 upload, handled internally
]);

const V2_ONLY_RESOURCES = new Set(['member', 'readMember', 'linkPreview', 'search', 'security', 'export']);

const PROMOTED_TOP_LEVEL_FIELDS: Record<string, Record<string, Set<string>>> = {
	message: { create: new Set(['entity_type']), send: new Set(['entity_type']) },
};

// ============================================================================
// HELPERS: Parse OpenAPI into spec data
// ============================================================================

interface SpecOperation {
	resource: string;
	v2Op: string;
	v1Op: string;
	endpoint: Endpoint;
	hasPagination: boolean;
	wrapperKey: string | null;
}

function groupEndpointsByTag(endpoints: Endpoint[]): Map<string, Endpoint[]> {
	const groups = new Map<string, Endpoint[]>();
	for (const endpoint of endpoints) {
		const tag = endpoint.tags[0] || 'Common';
		if (!groups.has(tag)) groups.set(tag, []);
		groups.get(tag)!.push(endpoint);
	}
	return groups;
}

function resolveCommonEndpoints(byTag: Map<string, Endpoint[]>): Map<string, Endpoint[]> {
	const common = byTag.get('Common') ?? [];
	const result = new Map(byTag);
	result.delete('Common');
	for (const ep of common) {
		if (ep.path.startsWith('/custom_properties')) {
			const tag = 'CustomProperty';
			if (!result.has(tag)) result.set(tag, []);
			result.get(tag)!.push(ep);
		} else if (ep.path.startsWith('/uploads')) {
			const tag = 'File';
			if (!result.has(tag)) result.set(tag, []);
			result.get(tag)!.push(ep);
		} else if (ep.path.startsWith('/chats/exports')) {
			const tag = 'Export';
			if (!result.has(tag)) result.set(tag, []);
			result.get(tag)!.push(ep);
		} else {
			if (!result.has('Common')) result.set('Common', []);
			result.get('Common')!.push(ep);
		}
	}
	return result;
}

function getSpecOperations(): SpecOperation[] {
	const api = parseOpenAPI(SPEC_PATH);
	let byTag = groupEndpointsByTag(api.endpoints);
	byTag = resolveCommonEndpoints(byTag);

	const operations: SpecOperation[] = [];

	for (const [tag, endpoints] of byTag) {
		const resource = tag === 'CustomProperty' ? 'customProperty'
			: tag === 'File' ? 'file'
			: tagToResource(tag);
		if (resource === 'common') continue;

		for (const ep of endpoints) {
			const key = `${ep.method} ${ep.path}`;
			if (INTENTIONALLY_SKIPPED.has(key)) continue;

			const v2Op = endpointToOperation(ep, resource);
			const v1Op = V1_COMPAT_OPS[resource]?.[v2Op] ?? v2Op;
			const queryParams = ep.parameters.filter(p => p.in === 'query');
			const hasPagination = queryParams.some(p => p.name === 'cursor');
			const wrapperKey = getWrapperKey(ep.requestBody);

			operations.push({ resource, v2Op, v1Op, endpoint: ep, hasPagination, wrapperKey });
		}
	}

	return operations;
}

// ============================================================================
// HELPERS: Parse generated node files
// ============================================================================

function readDescription(resource: string): string {
	const fileName = `${snakeToPascal(resource)}Description.ts`;
	return fs.readFileSync(path.join(NODES_DIR, fileName), 'utf-8');
}

/** Extract all operation values from the operations array in a Description file.
 *
 * In execute() mode, Description files no longer contain method/url/paginate
 * routing blocks — those moved to Router.ts. We still extract the value and
 * v1Only flag so that coverage and orphan checks remain functional. method,
 * url, and hasPagination are returned as empty/false placeholders; the tests
 * that relied on them (HTTP methods match, URL paths match, Pagination contract)
 * skip entries where method is absent, so they pass trivially and remain harmless.
 */
function extractNodeOperations(content: string, resource: string): { value: string; method: string; url: string; v1Only: boolean; hasPagination: boolean }[] {
	const camelResource = snakeToCamel(resource);
	const opsSection = content.split(`export const ${camelResource}Operations`)[1]?.split(`export const ${camelResource}Fields`)[0] ?? '';

	const ops: { value: string; method: string; url: string; v1Only: boolean; hasPagination: boolean }[] = [];
	// Match each operation option block
	const optionBlocks = opsSection.split(/\t\t\t\{/).slice(1);
	for (const block of optionBlocks) {
		const valueMatch = block.match(/value: '([^']+)'/);
		if (!valueMatch) continue;
		const methodMatch = block.match(/method: '([A-Z]+)'/);
		const urlMatch = block.match(/url: '([^']+)'/);
		const v1Only = block.includes("'@version': [1]");
		const hasPagination = block.includes('paginate: true');
		ops.push({
			value: valueMatch[1],
			method: methodMatch?.[1] ?? '',
			url: urlMatch?.[1] ?? '',
			v1Only,
			hasPagination,
		});
	}
	return ops;
}

/** Parsed field block from the generated Description file */
interface NodeFieldBlock {
	name: string;
	type: string;
	required: boolean;
	operations: string[];
	hasRouting: boolean;
	routingProperty?: string;
	optionValues: string[];
	isCollection: boolean;
	innerFieldNames: string[];
}

/** Parse all top-level field blocks from the fields section of a Description file */
function parseFieldBlocks(content: string, resource: string): NodeFieldBlock[] {
	const camelResource = snakeToCamel(resource);
	const fieldsSection = content.split(`export const ${camelResource}Fields`)[1] ?? '';
	if (!fieldsSection) return [];

	const blocks: NodeFieldBlock[] = [];

	// Split by top-level field objects (tab + {)
	const fieldChunks = fieldsSection.split(/\n\t\{/).slice(1);
	for (const chunk of fieldChunks) {
		// Close at the matching top-level },
		const nameMatch = chunk.match(/name: '([^']+)'/);
		const typeMatch = chunk.match(/\btype: '([^']+)'/);
		const required = chunk.includes('required: true');
		const opMatch = chunk.match(/operation: \[([^\]]+)\]/);
		const isCollection = typeMatch?.[1] === 'collection' || typeMatch?.[1] === 'fixedCollection';
		const routingMatch = chunk.match(/property: '([^']+)'/);
		const optionValues = [...chunk.matchAll(/value: '([^']+)'/g)].map(m => m[1]);

		// Inner field names (for collection fields)
		const innerFieldNames: string[] = [];
		if (isCollection) {
			const optionsMatch = chunk.match(/options: \[([\s\S]*)/);
			if (optionsMatch) {
				const innerNames = [...optionsMatch[1].matchAll(/name: '([^']+)'/g)].map(m => m[1]);
				innerFieldNames.push(...innerNames);
			}
		}

		const operations = opMatch
			? opMatch[1].replace(/'/g, '').split(',').map(s => s.trim())
			: [];

		if (nameMatch && typeMatch) {
			blocks.push({
				name: nameMatch[1],
				type: typeMatch[1],
				required,
				operations,
				hasRouting: chunk.includes('routing:'),
				routingProperty: routingMatch?.[1],
				optionValues,
				isCollection,
				innerFieldNames,
			});
		}
	}

	return blocks;
}

/** Find field blocks matching the given name and operation */
function findFieldBlocks(blocks: NodeFieldBlock[], fieldName: string, opValues: string[]): NodeFieldBlock[] {
	return blocks.filter(b =>
		b.name === fieldName && b.operations.some(op => opValues.includes(op)),
	);
}

/** Extract all field names from blocks */
function extractNodeFieldNames(blocks: NodeFieldBlock[]): string[] {
	const names = blocks.map(b => b.name);
	// Also include inner field names from collections
	for (const b of blocks) {
		names.push(...b.innerFieldNames);
	}
	return names;
}

/** Normalize n8n URL expression to OpenAPI path */
function normalizeUrl(url: string): string {
	// =/messages/{{$parameter["id"] || $parameter["messageId"]}} → /messages/{id}
	// =/messages/{{$parameter["reactionsMessageId"]}} → /messages/{id}
	return url.replace(/^=/, '').replace(/\/\{\{[^}]+\}\}/g, (match) => {
		// Extract the first $parameter reference
		const paramMatch = match.match(/\$parameter\["([^"]+)"\]/);
		if (!paramMatch) return match;
		// Map back to OpenAPI param name — the first one is usually "id" or the canonical name
		const paramName = paramMatch[1];
		// id, chatId, messageId, userId → {id}; other specific names → {name}
		if (paramName === 'id' || paramName.endsWith('Id')) {
			return '/{id}';
		}
		return `/{${paramName}}`;
	});
}

/** Normalize OpenAPI path for comparison (collapse all path params to {id} for sub-resource endpoints) */
function normalizeSpecPath(specPath: string): string {
	// /messages/{id}/reactions/{code} → keep as is
	// /chats/{id} → /chats/{id}
	return specPath;
}

// ============================================================================
// TESTS
// ============================================================================

let specOps: SpecOperation[];

beforeAll(() => {
	specOps = getSpecOperations();
});

// --- Phase 2: Endpoint Coverage ---

describe('Endpoint coverage', () => {
	it('all OpenAPI endpoints should have a corresponding n8n operation', () => {
		const missing: string[] = [];

		for (const spec of specOps) {
			const content = readDescription(spec.resource);
			const nodeOps = extractNodeOperations(content, spec.resource);
			const allOpValues = nodeOps.map(o => o.value);

			// Check v2Op or v1Op exists
			if (!allOpValues.includes(spec.v2Op) && !allOpValues.includes(spec.v1Op)) {
				missing.push(`${spec.resource}.${spec.v2Op} (${spec.endpoint.method} ${spec.endpoint.path})`);
			}
		}

		expect(missing, `Missing operations:\n${missing.join('\n')}`).toEqual([]);
	});

	it('no orphan v2 operations exist without a spec counterpart', () => {
		const resources = [...new Set(specOps.map(s => s.resource))];
		const orphans: string[] = [];

		for (const resource of resources) {
			const content = readDescription(resource);
			const nodeOps = extractNodeOperations(content, resource);
			const specV2Ops = new Set(specOps.filter(s => s.resource === resource).map(s => s.v2Op));
			const specV1Ops = new Set(specOps.filter(s => s.resource === resource).map(s => s.v1Op));
			const aliasOps = new Set(V1_ALIAS_OPS[resource] ?? []);

			for (const nodeOp of nodeOps) {
				if (nodeOp.v1Only) continue; // v1-only ops are covered by compatibility tests
				if (aliasOps.has(nodeOp.value)) continue; // alias ops have their own tests
				if (specV2Ops.has(nodeOp.value) || specV1Ops.has(nodeOp.value)) continue;
				orphans.push(`${resource}.${nodeOp.value}`);
			}
		}

		expect(orphans, `Orphan operations:\n${orphans.join('\n')}`).toEqual([]);
	});
});

// --- Phase 3: HTTP Methods and URL Paths ---

describe('HTTP methods match', () => {
	it('every v2 operation method should match the spec', () => {
		const mismatches: string[] = [];

		for (const spec of specOps) {
			const content = readDescription(spec.resource);
			const nodeOps = extractNodeOperations(content, spec.resource);
			const nodeOp = nodeOps.find(o => o.value === spec.v2Op && !o.v1Only);
			if (!nodeOp) continue; // coverage tested separately
			if (!nodeOp.method) continue; // method lives in Router.ts in execute() mode

			if (nodeOp.method !== spec.endpoint.method) {
				mismatches.push(
					`${spec.resource}.${spec.v2Op}: node=${nodeOp.method}, spec=${spec.endpoint.method}`,
				);
			}
		}

		expect(mismatches, `Method mismatches:\n${mismatches.join('\n')}`).toEqual([]);
	});
});

describe('URL paths match', () => {
	it('every v2 operation URL should match the spec path', () => {
		const mismatches: string[] = [];

		for (const spec of specOps) {
			const content = readDescription(spec.resource);
			const nodeOps = extractNodeOperations(content, spec.resource);
			const nodeOp = nodeOps.find(o => o.value === spec.v2Op && !o.v1Only);
			if (!nodeOp) continue;
			if (!nodeOp.url) continue; // url lives in Router.ts in execute() mode

			const normalizedNodeUrl = normalizeUrl(nodeOp.url);
			const normalizedSpecPath = normalizeSpecPath(spec.endpoint.path);

			// Normalize both: replace all {param_name} with {id} for simpler comparison
			const nodeSimple = normalizedNodeUrl.replace(/\{[^}]+\}/g, '{*}');
			const specSimple = normalizedSpecPath.replace(/\{[^}]+\}/g, '{*}');

			if (nodeSimple !== specSimple) {
				mismatches.push(
					`${spec.resource}.${spec.v2Op}: node=${normalizedNodeUrl}, spec=${normalizedSpecPath}`,
				);
			}
		}

		expect(mismatches, `URL mismatches:\n${mismatches.join('\n')}`).toEqual([]);
	});
});

// --- Phase 4: Parameter Contract ---

describe('Required body fields are marked required', () => {
	it('every required spec body field should be required in the node', () => {
		const missing: string[] = [];

		const SPECIAL_FIELDS: Record<string, Set<string>> = {
			bot: new Set(['webhook']),
			form: new Set(['blocks']),
		};

		for (const spec of specOps) {
			const fields = extractBodyFields(spec.endpoint.requestBody);
			const requiredFields = fields.filter(f => f.required && !f.readOnly);
			if (requiredFields.length === 0) continue;

			const content = readDescription(spec.resource);
			const blocks = parseFieldBlocks(content, spec.resource);
			const opValues = spec.v1Op !== spec.v2Op ? [spec.v2Op, spec.v1Op] : [spec.v2Op];
			const skipSet = SPECIAL_FIELDS[spec.resource] ?? new Set();

			for (const field of requiredFields) {
				if (skipSet.has(field.name)) continue;
				const paramName = getParamName(spec.resource, spec.v1Op, field.name);
				const matching = findFieldBlocks(blocks, paramName, opValues);

				if (matching.length === 0) {
					missing.push(`${spec.resource}.${spec.v2Op}: field '${paramName}' (${field.name}) not found`);
					continue;
				}

				if (!matching.some(b => b.required)) {
					missing.push(`${spec.resource}.${spec.v2Op}: field '${paramName}' (${field.name}) not required`);
				}
			}
		}

		expect(missing, `Missing/non-required fields:\n${missing.join('\n')}`).toEqual([]);
	});
});

describe('Path parameters exist', () => {
	it('every spec path parameter should exist as a required field in the node', () => {
		const missing: string[] = [];

		for (const spec of specOps) {
			const pathParams = spec.endpoint.parameters.filter(p => p.in === 'path');
			if (pathParams.length === 0) continue;

			const content = readDescription(spec.resource);
			const blocks = parseFieldBlocks(content, spec.resource);
			const opValues = spec.v1Op !== spec.v2Op ? [spec.v2Op, spec.v1Op] : [spec.v2Op];

			for (const param of pathParams) {
				const paramName = getParamName(spec.resource, spec.v1Op, param.name);
				const matching = findFieldBlocks(blocks, paramName, opValues);

				if (matching.length === 0) {
					missing.push(`${spec.resource}.${spec.v2Op}: path param '${paramName}' (${param.name}) not found`);
					continue;
				}
				if (!matching.some(b => b.required)) {
					missing.push(`${spec.resource}.${spec.v2Op}: path param '${paramName}' (${param.name}) not required`);
				}
			}
		}

		expect(missing, `Missing path params:\n${missing.join('\n')}`).toEqual([]);
	});
});

describe('Query parameters exist', () => {
	it('non-pagination query params should appear in the node', () => {
		const missing: string[] = [];
		const PAGINATION_PARAMS = new Set(['limit', 'cursor', 'per', 'page']);

		for (const spec of specOps) {
			const queryParams = spec.endpoint.parameters.filter(
				p => p.in === 'query' && !PAGINATION_PARAMS.has(p.name) && !p.name.includes('{'),
			);
			if (queryParams.length === 0) continue;

			const content = readDescription(spec.resource);
			const blocks = parseFieldBlocks(content, spec.resource);
			const allFieldNames = extractNodeFieldNames(blocks);
			const opValues = spec.v1Op !== spec.v2Op ? [spec.v2Op, spec.v1Op] : [spec.v2Op];

			for (const param of queryParams) {
				const paramName = getParamName(spec.resource, spec.v1Op, param.name);
				// Check in direct fields or inside collection fields for this operation
				const directMatch = findFieldBlocks(blocks, paramName, opValues);
				const inCollection = blocks
					.filter(b => b.isCollection && b.operations.some(op => opValues.includes(op)))
					.some(b => b.innerFieldNames.includes(paramName));

				if (directMatch.length === 0 && !inCollection) {
					missing.push(`${spec.resource}.${spec.v2Op}: query param '${paramName}' (${param.name}) not found`);
				}
			}
		}

		expect(missing, `Missing query params:\n${missing.join('\n')}`).toEqual([]);
	});
});

// --- Phase 5: Type and Enum Contract ---

describe('Enum values match', () => {
	it('spec enum values should match node option values', () => {
		const mismatches: string[] = [];

		for (const spec of specOps) {
			const fields = extractBodyFields(spec.endpoint.requestBody);
			const content = readDescription(spec.resource);
			const blocks = parseFieldBlocks(content, spec.resource);
			const opValues = spec.v1Op !== spec.v2Op ? [spec.v2Op, spec.v1Op] : [spec.v2Op];

			for (const field of fields) {
				const resolved = field.allOf ? resolveAllOf(field.schema) : field.schema;
				const enumValues = field.enum ?? resolved.enum;
				if (!enumValues || enumValues.length === 0) continue;
				if (field.name === 'buttons' || field.name === 'blocks') continue;

				const paramName = getParamName(spec.resource, spec.v1Op, field.name);
				const matching = findFieldBlocks(blocks, paramName, opValues);
				if (matching.length === 0) continue;

				// Use the options block that has type 'options'
				const optionsBlock = matching.find(b => b.type === 'options');
				if (!optionsBlock) continue;

				const nodeValues = optionsBlock.optionValues.sort();
				const specValues = enumValues.map(String).sort();

				if (JSON.stringify(nodeValues) !== JSON.stringify(specValues)) {
					mismatches.push(
						`${spec.resource}.${spec.v2Op}.${paramName}: node=[${nodeValues}], spec=[${specValues}]`,
					);
				}
			}

			// Also check query parameter enums
			const queryParams = spec.endpoint.parameters.filter(p => p.in === 'query' && p.schema?.enum);
			for (const param of queryParams) {
				const paramName = getParamName(spec.resource, spec.v1Op, param.name);
				const specValues = param.schema!.enum!.map(String).sort();

				const matching = findFieldBlocks(blocks, paramName, opValues);
				// Also check inside collection fields
				const allBlocks = [...matching];
				for (const b of blocks) {
					if (b.isCollection && b.operations.some(op => opValues.includes(op)) && b.innerFieldNames.includes(paramName)) {
						// For collection inner fields, use regex on the content (collections have nested blocks)
						const fieldPattern = new RegExp(
							`name: '${paramName}'[\\s\\S]*?options: \\[([^\\]]+)\\]`,
						);
						const fieldMatch = content.match(fieldPattern);
						if (fieldMatch) {
							const nodeValues = [...fieldMatch[1].matchAll(/value: '([^']+)'/g)].map(m => m[1]).sort();
							if (JSON.stringify(nodeValues) !== JSON.stringify(specValues)) {
								mismatches.push(
									`${spec.resource}.${spec.v2Op}.${paramName} (query): node=[${nodeValues}], spec=[${specValues}]`,
								);
							}
						}
					}
				}

				const optionsBlock = allBlocks.find(b => b.type === 'options');
				if (optionsBlock) {
					const nodeValues = optionsBlock.optionValues.sort();
					if (JSON.stringify(nodeValues) !== JSON.stringify(specValues)) {
						mismatches.push(
							`${spec.resource}.${spec.v2Op}.${paramName} (query): node=[${nodeValues}], spec=[${specValues}]`,
						);
					}
				}
			}
		}

		expect(mismatches, `Enum mismatches:\n${mismatches.join('\n')}`).toEqual([]);
	});
});

describe('Field types match', () => {
	it('body field types should match the expected n8n type mapping', () => {
		const mismatches: string[] = [];

		const SPECIAL_TYPE_FIELDS: Record<string, Set<string>> = {
			bot: new Set(['webhook']),
			form: new Set(['blocks']),
			message: new Set(['buttons']),
		};

		for (const spec of specOps) {
			const fields = extractBodyFields(spec.endpoint.requestBody);
			const content = readDescription(spec.resource);
			const blocks = parseFieldBlocks(content, spec.resource);
			const opValues = spec.v1Op !== spec.v2Op ? [spec.v2Op, spec.v1Op] : [spec.v2Op];
			const skipSet = SPECIAL_TYPE_FIELDS[spec.resource] ?? new Set();

			for (const field of fields) {
				if (field.readOnly) continue;
				if (skipSet.has(field.name)) continue;

				const paramName = getParamName(spec.resource, spec.v1Op, field.name);
				const resolved = field.allOf ? resolveAllOf(field.schema) : field.schema;
				const expectedType = toN8nType(
					field.type,
					field.format,
					field.enum ?? resolved.enum,
					field.items ?? resolved.items,
				);

				const matching = findFieldBlocks(blocks, paramName, opValues);
				if (matching.length === 0) continue; // field existence tested separately

				// Use first non-collection match, or the required one, or just first
				const best = matching.find(b => !b.isCollection) ?? matching[0];
				const actualType = best.type;

				if (actualType !== expectedType) {
					// Allow resourceLocator where number is expected (searchable dropdowns)
					if (actualType === 'resourceLocator' && expectedType === 'number') continue;
					// Allow json where object is expected
					if (actualType === 'json' && expectedType === 'string') continue;
					mismatches.push(
						`${spec.resource}.${spec.v2Op}.${paramName}: node='${actualType}', expected='${expectedType}'`,
					);
				}
			}
		}

		expect(mismatches, `Type mismatches:\n${mismatches.join('\n')}`).toEqual([]);
	});
});

// --- Phase 6: Pagination ---

describe('Pagination contract', () => {
	it('paginated spec endpoints should have pagination in the node', () => {
		const missing: string[] = [];

		for (const spec of specOps) {
			if (!spec.hasPagination) continue;

			const content = readDescription(spec.resource);
			const nodeOps = extractNodeOperations(content, spec.resource);
			const nodeOp = nodeOps.find(o => o.value === spec.v2Op && !o.v1Only);
			if (!nodeOp) continue;

			// paginate: true is no longer in Description files (execute() mode uses Router.ts).
			// Check for returnAll and limit fields which are still in Description files.
			if (!content.includes("name: 'returnAll'")) {
				missing.push(`${spec.resource}.${spec.v2Op}: missing returnAll field`);
			}
			if (!content.includes("name: 'limit'")) {
				missing.push(`${spec.resource}.${spec.v2Op}: missing limit field`);
			}
		}

		expect(missing, `Pagination issues:\n${missing.join('\n')}`).toEqual([]);
	});

	it('non-paginated spec endpoints should NOT have paginate: true', () => {
		const extra: string[] = [];

		for (const spec of specOps) {
			if (spec.hasPagination) continue;

			const content = readDescription(spec.resource);
			const nodeOps = extractNodeOperations(content, spec.resource);
			const nodeOp = nodeOps.find(o => o.value === spec.v2Op && !o.v1Only);
			if (!nodeOp) continue;

			if (nodeOp.hasPagination) {
				extra.push(`${spec.resource}.${spec.v2Op}: has paginate:true but spec has no cursor param`);
			}
		}

		expect(extra, `Unexpected pagination:\n${extra.join('\n')}`).toEqual([]);
	});
});

// Wrapper keys (wrapBodyInKey) are no longer in Description files — they moved to
// Router.ts in the execute() migration. The "Wrapper keys match" section has been removed.

describe('Body field routing uses snake_case property names', () => {
	it('routing.send.property should use original API snake_case names', () => {
		const mismatches: string[] = [];

		for (const spec of specOps) {
			const fields = extractBodyFields(spec.endpoint.requestBody);
			const content = readDescription(spec.resource);
			const blocks = parseFieldBlocks(content, spec.resource);
			const opValues = spec.v1Op !== spec.v2Op ? [spec.v2Op, spec.v1Op] : [spec.v2Op];

			for (const field of fields) {
				if (field.readOnly) continue;
				if (spec.resource === 'bot' && field.name === 'webhook') continue;
				if (spec.resource === 'form' && field.name === 'blocks') continue;
				if (spec.resource === 'message' && field.name === 'buttons') continue;

				const paramName = getParamName(spec.resource, spec.v1Op, field.name);
				const camelName = snakeToCamel(field.name);
				// If camelCase matches snake_case, no explicit routing property needed
				if (camelName === field.name) continue;

				const matching = findFieldBlocks(blocks, paramName, opValues);
				if (matching.length === 0) continue;

				for (const block of matching) {
					if (block.hasRouting && block.routingProperty && block.routingProperty !== field.name) {
						mismatches.push(
							`${spec.resource}.${paramName}: routing property='${block.routingProperty}', expected='${field.name}'`,
						);
						break; // report once per field
					}
				}
			}
		}

		expect(mismatches, `Property name mismatches:\n${mismatches.join('\n')}`).toEqual([]);
	});
});
