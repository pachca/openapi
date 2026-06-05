/**
 * Validate that overlay.en.yaml covers ALL translatable strings in openapi.yaml.
 * Exits with code 1 if ANY translation is missing.
 *
 * Usage: tsx scripts/validate-overlay.ts [--base openapi.yaml] [--overlay overlay.en.yaml]
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Extract all translatable JSONPath targets from the OpenAPI spec
// ---------------------------------------------------------------------------

function extractTranslatablePaths(doc: any): Set<string> {
	const paths = new Set<string>();

	// Info description
	if (doc.info?.description) {
		paths.add('$.info.description');
	}

	// Walk paths (operations)
	if (doc.paths) {
		for (const [route, methods] of Object.entries(doc.paths as Record<string, any>)) {
			const routeKey = `['${route}']`;
			for (const [method, op] of Object.entries(methods as Record<string, any>)) {
				if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].indexOf(method) === -1) continue;
				const opPrefix = `$.paths${routeKey}.${method}`;

				// Operation description
				if (op.description) {
					paths.add(`${opPrefix}.description`);
				}

				// Parameters
				if (Array.isArray(op.parameters)) {
					for (const param of op.parameters) {
						if (param.description) {
							paths.add(`${opPrefix}.parameters[?(@.name=='${param.name}')].description`);
						}
					}
				}

				// Request body — walk schema properties
				if (op.requestBody?.content) {
					for (const [, mediaType] of Object.entries(op.requestBody.content as Record<string, any>)) {
						if ((mediaType as any).schema) {
							walkSchema((mediaType as any).schema, `${opPrefix}.requestBody`, paths, doc);
						}
					}
				}
			}
		}
	}

	// Walk component schemas
	if (doc.components?.schemas) {
		for (const [schemaName, schema] of Object.entries(doc.components.schemas as Record<string, any>)) {
			const prefix = `$.components.schemas.${schemaName}`;

			// Schema-level description
			if (schema.description) {
				paths.add(`${prefix}.description`);
			}

			// x-enum-descriptions
			if (schema['x-enum-descriptions']) {
				paths.add(`${prefix}.x-enum-descriptions`);
			}

			// Schema properties (recursive)
			walkProperties(schema, prefix, paths, doc);
		}
	}

	return paths;
}

/**
 * Walk schema properties recursively to find all description fields.
 */
function walkProperties(schema: any, prefix: string, paths: Set<string>, doc: any): void {
	if (!schema || typeof schema !== 'object') return;

	// Handle allOf — merges properties into parent, so walk with parent prefix
	if (Array.isArray(schema.allOf)) {
		for (const sub of schema.allOf) {
			const resolved = resolveRef(sub, doc);
			walkProperties(resolved, prefix, paths, doc);
		}
	}
	// NOTE: oneOf/anyOf reference separate schemas that are walked independently
	// in the top-level schema loop. Do NOT walk them here with the parent prefix,
	// as the properties exist in the referenced schemas, not in the union schema.

	if (schema.properties) {
		for (const [propName, propSchema] of Object.entries(schema.properties as Record<string, any>)) {
			const resolved = resolveRef(propSchema, doc);
			const propPrefix = `${prefix}.properties.${propName}`;

			if (resolved.description) {
				paths.add(`${propPrefix}.description`);
			}

			// x-enum-descriptions on property
			if (resolved['x-enum-descriptions']) {
				paths.add(`${propPrefix}.x-enum-descriptions`);
			}

			// Nested object properties
			walkProperties(resolved, propPrefix, paths, doc);

			// Array items
			if (resolved.items) {
				const itemResolved = resolveRef(resolved.items, doc);
				walkProperties(itemResolved, `${propPrefix}.items`, paths, doc);
			}
		}
	}
}

/**
 * Walk request body schema (skip $ref to component schemas — those are handled separately).
 */
function walkSchema(schema: any, prefix: string, paths: Set<string>, doc: any): void {
	// Request body schemas are usually $ref to components — skip, they're already covered
	// Only handle inline schemas
	if (schema.$ref) return;
	walkProperties(schema, prefix, paths, doc);
}

/**
 * Resolve a $ref to the actual schema object. Only handles local refs.
 */
function resolveRef(schema: any, doc: any): any {
	if (!schema || !schema.$ref) return schema || {};
	const ref = schema.$ref;
	if (!ref.startsWith('#/')) return schema;

	const parts = ref.replace('#/', '').split('/');
	let current = doc;
	for (const part of parts) {
		current = current?.[part];
	}
	return current || {};
}

// ---------------------------------------------------------------------------
// Extract overlay targets
// ---------------------------------------------------------------------------

function extractOverlayTargets(overlay: any): Set<string> {
	const targets = new Set<string>();
	if (!Array.isArray(overlay.actions)) return targets;

	for (const action of overlay.actions) {
		if (!action.target) continue;

		if (action.update && typeof action.update === 'object') {
			// If update has specific fields, create targets for each
			for (const key of Object.keys(action.update)) {
				targets.add(`${action.target}.${key}`);
			}
		} else {
			targets.add(action.target);
		}
	}
	return targets;
}

// ---------------------------------------------------------------------------
// Normalize targets for comparison
// ---------------------------------------------------------------------------

function normalizeTarget(target: string): string {
	// Normalize whitespace and quotes
	return target.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
	const specDir = path.resolve(__dirname, '..');
	let basePath = path.join(specDir, 'openapi.yaml');
	let overlayPath = path.join(specDir, 'overlay.en.yaml');

	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--base' && args[i + 1]) basePath = path.resolve(args[++i]);
		if (args[i] === '--overlay' && args[i + 1]) overlayPath = path.resolve(args[++i]);
	}

	const baseDoc = yaml.load(fs.readFileSync(basePath, 'utf8')) as any;
	const overlay = yaml.load(fs.readFileSync(overlayPath, 'utf8')) as any;

	const translatablePaths = extractTranslatablePaths(baseDoc);
	const overlayTargets = extractOverlayTargets(overlay);

	// Normalize both sets
	const normalizedTranslatable = new Map<string, string>();
	for (const p of translatablePaths) {
		normalizedTranslatable.set(normalizeTarget(p), p);
	}

	const normalizedOverlay = new Map<string, string>();
	for (const t of overlayTargets) {
		normalizedOverlay.set(normalizeTarget(t), t);
	}

	// Find missing and stale
	const missing: string[] = [];
	for (const [norm, original] of normalizedTranslatable) {
		if (!normalizedOverlay.has(norm)) {
			missing.push(original);
		}
	}

	const stale: string[] = [];
	for (const [norm, original] of normalizedOverlay) {
		if (!normalizedTranslatable.has(norm)) {
			stale.push(original);
		}
	}

	// Sort for readability
	missing.sort();
	stale.sort();

	const total = translatablePaths.size;
	const translated = total - missing.length;

	// Report
	if (missing.length === 0 && stale.length === 0) {
		console.log(`✓ Overlay validation passed: ${translated}/${total} strings translated (100%)`);
		process.exit(0);
	}

	if (missing.length > 0) {
		console.error(`\nMissing translations (${missing.length}):`);
		for (const m of missing) {
			console.error(`  ✗ ${m}`);
		}
	}

	if (stale.length > 0) {
		console.warn(`\nStale translations (${stale.length}):`);
		for (const s of stale) {
			console.warn(`  ⚠ ${s}`);
		}
	}

	console.log(`\nTotal: ${translated}/${total} translated (${((translated / total) * 100).toFixed(1)}%)`);

	if (missing.length > 0) {
		console.error(`\nMissing: ${missing.length} — BUILD FAILED`);
		process.exit(1);
	}

	// Only stale warnings — still pass
	process.exit(0);
}

main();
