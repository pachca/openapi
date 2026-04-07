import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseOpenAPI, resolveAllOf } from '@pachca/openapi-parser';
import type { Endpoint, Schema } from '@pachca/openapi-parser';
import { getWrapperKey } from '../scripts/utils';

// ============================================================================
// SETUP: Paths
// ============================================================================

const ROOT = path.resolve(__dirname, '../../..');
const SPEC_PATH = path.join(ROOT, 'packages/spec/openapi.yaml');
const ROUTER_PATH = path.resolve(__dirname, '../nodes/Pachca/SharedRouter.ts');

// ============================================================================
// Mapping tables (mirrored from generate-n8n.ts / contract.test.ts)
// ============================================================================

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

/** Endpoints intentionally not covered by the n8n node */
const INTENTIONALLY_SKIPPED = new Set([
	'POST /direct_url',         // low-level S3 upload, handled internally
]);

// V1 alias operations that exist in ROUTES but NOT in the spec (they are
// duplicates of v2 sub-resource operations kept for backward compatibility)
const V1_ALIAS_OPS: Record<string, string[]> = {
	message: ['getReadMembers', 'unfurl'],
	chat: ['getMembers', 'addUsers', 'removeUser', 'updateRole', 'leaveChat'],
	groupTag: ['addTags', 'removeTag'],
};

// Special operations that don't map directly to an API endpoint
const SPECIAL_NON_API_OPS = new Set([
	'form.processSubmission',
]);

// ============================================================================
// HELPERS: Parse OpenAPI spec
// ============================================================================

interface SpecOperation {
	resource: string;
	v2Op: string;
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
			: tag === 'Export' ? 'export'
			: tagToResource(tag);
		if (resource === 'common') continue;

		for (const ep of endpoints) {
			const key = `${ep.method} ${ep.path}`;
			if (INTENTIONALLY_SKIPPED.has(key)) continue;

			const v2Op = endpointToOperation(ep, resource);
			const queryParams = ep.parameters.filter(p => p.in === 'query');
			const hasPagination = queryParams.some(p => p.name === 'cursor');
			const wrapperKey = getWrapperKey(ep.requestBody);

			operations.push({ resource, v2Op, endpoint: ep, hasPagination, wrapperKey });
		}
	}

	return operations;
}

// ============================================================================
// HELPERS: Parse ROUTES table from Router.ts
// ============================================================================

interface ParsedRoute {
	resource: string;
	operation: string;
	method: string;
	path: string;
	paginated: boolean;
	wrapperKey: string | null;
	special: string | null;
}

function parseRoutesFromFile(): ParsedRoute[] {
	const content = fs.readFileSync(ROUTER_PATH, 'utf-8');

	// Extract the ROUTES block: starts with `const ROUTES: Record<...> = {`
	// and ends before `// ===...` section (Router Entry Point)
	const routesStart = content.indexOf('const ROUTES: Record<');
	if (routesStart === -1) throw new Error('Could not find ROUTES table in Router.ts');

	const routesSection = content.slice(routesStart);
	// Find the closing `};` of the ROUTES object — it's followed by the Router section
	const routerSectionIdx = routesSection.indexOf('\n// ============================================================================\n// Router Entry Point');
	const routesBlock = routerSectionIdx !== -1
		? routesSection.slice(0, routerSectionIdx)
		: routesSection;

	const routes: ParsedRoute[] = [];

	// Parse resource blocks: top-level keys like `security: {`, `bot: {`, etc.
	// Match: <resource>: { ... at top level (one tab indent)
	const resourceRegex = /^\t(\w+): \{$/gm;
	let resourceMatch: RegExpExecArray | null;

	while ((resourceMatch = resourceRegex.exec(routesBlock)) !== null) {
		const resource = resourceMatch[1];
		const resourceStart = resourceMatch.index + resourceMatch[0].length;

		// Find the end of this resource block by tracking brace depth
		let depth = 1;
		let pos = resourceStart;
		while (pos < routesBlock.length && depth > 0) {
			if (routesBlock[pos] === '{') depth++;
			if (routesBlock[pos] === '}') depth--;
			pos++;
		}
		const resourceBody = routesBlock.slice(resourceStart, pos - 1);

		// Parse operation blocks within the resource: `<operation>: {`
		const opRegex = /^\t\t(\w+): \{$/gm;
		let opMatch: RegExpExecArray | null;

		while ((opMatch = opRegex.exec(resourceBody)) !== null) {
			const operation = opMatch[1];
			const opStart = opMatch.index + opMatch[0].length;

			// Find the end of this operation block
			let opDepth = 1;
			let opPos = opStart;
			while (opPos < resourceBody.length && opDepth > 0) {
				if (resourceBody[opPos] === '{') opDepth++;
				if (resourceBody[opPos] === '}') opDepth--;
				opPos++;
			}
			const opBody = resourceBody.slice(opStart, opPos - 1);

			// Extract method
			const methodMatch = opBody.match(/method: '([A-Z]+)'/);
			const method = methodMatch?.[1] ?? '';

			// Extract path
			const pathMatch = opBody.match(/path: '([^']+)'/);
			const routePath = pathMatch?.[1] ?? '';

			// Extract paginated
			const paginated = /paginated: true/.test(opBody);

			// Extract wrapperKey
			const wrapperKeyMatch = opBody.match(/wrapperKey: '([^']+)'/);
			const wrapperKey = wrapperKeyMatch?.[1] ?? null;

			// Extract special
			const specialMatch = opBody.match(/special: '([^']+)'/);
			const special = specialMatch?.[1] ?? null;

			routes.push({ resource, operation, method, path: routePath, paginated, wrapperKey, special });
		}
	}

	return routes;
}

// ============================================================================
// Build a lookup from parsed routes
// ============================================================================

function buildRoutesMap(routes: ParsedRoute[]): Map<string, ParsedRoute> {
	const map = new Map<string, ParsedRoute>();
	for (const route of routes) {
		map.set(`${route.resource}.${route.operation}`, route);
	}
	return map;
}

// ============================================================================
// Normalize OpenAPI path to match ROUTES path format
// ============================================================================

/**
 * OpenAPI paths use `{param_name}` notation, ROUTES may use the same or
 * slightly different param names. We normalize both to compare the URL
 * structure by replacing all `{...}` segments with a placeholder.
 */
function normalizePath(p: string): string {
	return p.replace(/\{[^}]+\}/g, '{*}');
}

// ============================================================================
// TESTS
// ============================================================================

let specOps: SpecOperation[];
let parsedRoutes: ParsedRoute[];
let routesMap: Map<string, ParsedRoute>;

beforeAll(() => {
	specOps = getSpecOperations();
	parsedRoutes = parseRoutesFromFile();
	routesMap = buildRoutesMap(parsedRoutes);
});

describe('ROUTES table vs OpenAPI spec', () => {
	describe('every spec endpoint has a ROUTES entry', () => {
		it('all OpenAPI endpoints should exist in ROUTES', () => {
			const missing: string[] = [];

			for (const spec of specOps) {
				const key = `${spec.resource}.${spec.v2Op}`;
				if (!routesMap.has(key)) {
					missing.push(`${key} (${spec.endpoint.method} ${spec.endpoint.path})`);
				}
			}

			expect(missing, `Missing ROUTES entries:\n${missing.join('\n')}`).toEqual([]);
		});
	});

	describe('HTTP methods match', () => {
		it('each ROUTES entry should have the correct HTTP method from spec', () => {
			const mismatches: string[] = [];

			for (const spec of specOps) {
				const key = `${spec.resource}.${spec.v2Op}`;
				const route = routesMap.get(key);
				if (!route) continue;

				// Skip special-only operations whose method/path are placeholders
				if (SPECIAL_NON_API_OPS.has(key)) continue;
				if (route.special === 'fileUpload') continue;

				const expectedMethod = spec.endpoint.method.toUpperCase();
				if (route.method !== expectedMethod) {
					mismatches.push(
						`${key}: ROUTES has ${route.method}, spec has ${expectedMethod}`,
					);
				}
			}

			expect(mismatches, `Method mismatches:\n${mismatches.join('\n')}`).toEqual([]);
		});
	});

	describe('URL paths match', () => {
		it('each ROUTES entry should have the correct URL path structure from spec', () => {
			const mismatches: string[] = [];

			for (const spec of specOps) {
				const key = `${spec.resource}.${spec.v2Op}`;
				const route = routesMap.get(key);
				if (!route) continue;

				// Skip special-only operations whose path is a placeholder
				if (SPECIAL_NON_API_OPS.has(key)) continue;
				if (route.special === 'fileUpload') continue;

				const normalizedRoute = normalizePath(route.path);
				const normalizedSpec = normalizePath(spec.endpoint.path);

				if (normalizedRoute !== normalizedSpec) {
					mismatches.push(
						`${key}: ROUTES has "${route.path}" (normalized: "${normalizedRoute}"), spec has "${spec.endpoint.path}" (normalized: "${normalizedSpec}")`,
					);
				}
			}

			expect(mismatches, `Path mismatches:\n${mismatches.join('\n')}`).toEqual([]);
		});
	});

	describe('pagination flags match', () => {
		it('paginated spec endpoints should have paginated: true in ROUTES', () => {
			const mismatches: string[] = [];

			for (const spec of specOps) {
				const key = `${spec.resource}.${spec.v2Op}`;
				const route = routesMap.get(key);
				if (!route) continue;

				if (SPECIAL_NON_API_OPS.has(key)) continue;
				if (route.special === 'fileUpload') continue;

				if (spec.hasPagination && !route.paginated) {
					mismatches.push(`${key}: spec is paginated but ROUTES missing paginated: true`);
				}
				if (!spec.hasPagination && route.paginated) {
					mismatches.push(`${key}: ROUTES has paginated: true but spec has no cursor param`);
				}
			}

			expect(mismatches, `Pagination mismatches:\n${mismatches.join('\n')}`).toEqual([]);
		});
	});

	describe('wrapperKey matches', () => {
		it('body-wrapped spec endpoints should have the correct wrapperKey in ROUTES', () => {
			const mismatches: string[] = [];

			for (const spec of specOps) {
				const key = `${spec.resource}.${spec.v2Op}`;
				const route = routesMap.get(key);
				if (!route) continue;

				if (SPECIAL_NON_API_OPS.has(key)) continue;
				if (route.special === 'fileUpload') continue;

				// noDataWrapper routes intentionally skip the wrapper
				if (route.wrapperKey === null && spec.wrapperKey !== null) {
					// Check if noDataWrapper is set — if so, the route intentionally omits the wrapper
					// We need to re-check from the parsed route; noDataWrapper means body is sent flat
					const fullRoute = parsedRoutes.find(r => r.resource === spec.resource && r.operation === spec.v2Op);
					if (fullRoute) {
						// Read Router.ts to check noDataWrapper — but we already parsed the fields we need
						// For simplicity, skip noDataWrapper routes (export resource)
						if (spec.resource === 'export') continue;
					}
					mismatches.push(
						`${key}: spec has wrapperKey "${spec.wrapperKey}" but ROUTES has none`,
					);
				}
				if (route.wrapperKey !== null && spec.wrapperKey === null) {
					mismatches.push(
						`${key}: ROUTES has wrapperKey "${route.wrapperKey}" but spec has no wrapper`,
					);
				}
				if (route.wrapperKey !== null && spec.wrapperKey !== null && route.wrapperKey !== spec.wrapperKey) {
					mismatches.push(
						`${key}: ROUTES has wrapperKey "${route.wrapperKey}", spec has "${spec.wrapperKey}"`,
					);
				}
			}

			expect(mismatches, `WrapperKey mismatches:\n${mismatches.join('\n')}`).toEqual([]);
		});
	});

	describe('no orphan routes', () => {
		it('every ROUTES entry should correspond to a spec endpoint, a v1 alias, or a special handler', () => {
			const specKeys = new Set(specOps.map(s => `${s.resource}.${s.v2Op}`));

			// Build set of all known v1 alias keys
			const v1AliasKeys = new Set<string>();
			for (const [resource, ops] of Object.entries(V1_ALIAS_OPS)) {
				for (const op of ops) {
					v1AliasKeys.add(`${resource}.${op}`);
				}
			}

			const orphans: string[] = [];

			for (const route of parsedRoutes) {
				const key = `${route.resource}.${route.operation}`;

				// Skip if it matches a spec endpoint
				if (specKeys.has(key)) continue;

				// Skip if it's a known v1 alias operation
				if (v1AliasKeys.has(key)) continue;

				// Skip if it's a special non-API operation
				if (SPECIAL_NON_API_OPS.has(key)) continue;

				orphans.push(`${key} (${route.method} ${route.path})`);
			}

			expect(orphans, `Orphan ROUTES entries:\n${orphans.join('\n')}`).toEqual([]);
		});
	});
});
