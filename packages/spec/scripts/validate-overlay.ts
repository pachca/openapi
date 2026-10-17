/**
 * Validate overlay.en.yaml against openapi.yaml. Exits with code 1 when:
 * - a translatable string has no translation (missing);
 * - a target does not resolve strictly or adds a field absent in the base spec (stale),
 *   see overlay-target.ts;
 * - two targets write the same field of the same node (duplicate);
 * - a translation lost or gained a code token, a link, a `METHOD /path`, a number or a
 *   snake_case identifier compared with the Russian text (parity, reads openapi.en.yaml,
 *   so run overlay:apply first);
 * - the Russian text behind a translation changed since the translation was confirmed
 *   (fingerprints in overlay.en.fingerprints.json). After updating the translation, record
 *   the new state with `bun run overlay:fingerprints`.
 *
 * Usage: bun scripts/validate-overlay.ts [--base openapi.yaml] [--overlay overlay.en.yaml]
 *        [--en openapi.en.yaml] [--write-fingerprints]
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { resolveTarget } from './overlay-target';

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

				// Request body — inline schemas only, a $ref to a component is walked with the components
				if (op.requestBody?.content) {
					for (const [mediaType, media] of Object.entries(op.requestBody.content as Record<string, any>)) {
						const schema = (media as any)?.schema;
						if (schema && !schema.$ref) {
							walkProperties(schema, `${opPrefix}.requestBody.content['${mediaType}'].schema`, paths);
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
			walkProperties(schema, prefix, paths);
		}
	}

	return paths;
}

/**
 * Walk schema properties recursively to find all description fields.
 *
 * Only texts that live at this path are collected. A property or an array item given
 * by `$ref` belongs to its component, which the top-level loop walks on its own:
 * requiring a copy under every container would make several targets write the same
 * component node (see overlay-target.ts). A wrapper `{allOf: [{$ref}], description}`
 * contributes only its own description.
 */
function walkProperties(schema: any, prefix: string, paths: Set<string>): void {
	if (!schema || typeof schema !== 'object') return;

	// An inline allOf member keeps its texts under its own index: `X.allOf[0].properties.y`
	// is the only target the strict resolver reaches it by (overlay-target.ts)
	if (Array.isArray(schema.allOf)) {
		schema.allOf.forEach((sub: any, i: number) => {
			if (sub && !sub.$ref) walkProperties(sub, `${prefix}.allOf[${i}]`, paths);
		});
	}
	// NOTE: oneOf/anyOf reference separate schemas that are walked independently
	// in the top-level schema loop. Do NOT walk them here with the parent prefix,
	// as the properties exist in the referenced schemas, not in the union schema.

	if (schema.properties) {
		for (const [propName, propSchema] of Object.entries(schema.properties as Record<string, any>)) {
			if (!propSchema || typeof propSchema !== 'object') continue;
			const propPrefix = `${prefix}.properties.${propName}`;

			if (propSchema.description) {
				paths.add(`${propPrefix}.description`);
			}
			if (propSchema.$ref) continue;

			// x-enum-descriptions on property
			if (propSchema['x-enum-descriptions']) {
				paths.add(`${propPrefix}.x-enum-descriptions`);
			}

			// Nested object properties
			walkProperties(propSchema, propPrefix, paths);

			// Inline array items
			if (propSchema.items && !propSchema.items.$ref) {
				walkProperties(propSchema.items, `${propPrefix}.items`, paths);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Overlay targets: strict resolution, stale and duplicate fields
// ---------------------------------------------------------------------------

interface OverlayField {
	/** `${target}.${field}` — the form translatable paths are collected in. */
	id: string;
	/** The base-spec value the translation replaces. */
	ru: unknown;
}

function normalizeTarget(target: string): string {
	return target.replace(/\s+/g, ' ').trim();
}

/** Resolve every action strictly; collect translated fields, stale targets and duplicates. */
function checkOverlayActions(overlay: any, doc: any) {
	const fields: OverlayField[] = [];
	const stale: string[] = [];
	const duplicates: string[] = [];
	const writtenBy = new Map<string, string>();

	for (const action of overlay.actions ?? []) {
		if (!action?.target) continue;
		const update = action.update;
		if (update === null || typeof update !== 'object' || Array.isArray(update)) {
			stale.push(`${action.target} — only "update" with an object of fields is supported`);
			continue;
		}
		let node: any;
		let nodePath: string;
		try {
			const resolved = resolveTarget(doc, action.target);
			node = resolved.parent[resolved.key];
			nodePath = JSON.stringify(resolved.path);
		} catch (err) {
			stale.push((err as Error).message);
			continue;
		}
		for (const field of Object.keys(update)) {
			const id = normalizeTarget(`${action.target}.${field}`);
			if (node?.[field] === undefined) {
				stale.push(`${id} — the base spec has no "${field}" here`);
				continue;
			}
			const nodeField = `${nodePath}#${field}`;
			const first = writtenBy.get(nodeField);
			if (first !== undefined) {
				duplicates.push(first === id ? id : `${id} (same node as ${first})`);
				continue;
			}
			writtenBy.set(nodeField, id);
			fields.push({ id, ru: node[field] });
		}
	}
	return { fields, stale, duplicates };
}

// ---------------------------------------------------------------------------
// Parity: code tokens, links, METHOD /path, numbers and identifiers
// ---------------------------------------------------------------------------

const CYRILLIC_RE = /[а-яА-ЯёЁ]/;

/** Localized placeholders: the Russian code token and the English one it becomes. */
const PARITY_ALLOW: Record<string, string> = {
	'@ник': '@nickname',
	'@тег': '@tag',
};

const TEXT_KEYS = new Set(['description', 'summary', 'title', 'x-enum-descriptions']);

const withoutCode = (text: string) => text.replace(/`[^`]+`/g, ' ').replace(/\]\([^)]*\)/g, ']');

const PARITY_TOKENS: [string, (text: string) => string[]][] = [
	['code', (t) => [...t.matchAll(/`([^`]+)`/g)].map((m) => PARITY_ALLOW[m[1]] ?? m[1])],
	['link', (t) => [...t.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])],
	['method', (t) => [...withoutCode(t).matchAll(/\b(?:GET|POST|PUT|PATCH|DELETE) \/[^\s)\],;]*/g)].map((m) => m[0])],
	[
		'number',
		(t) =>
			[...withoutCode(t).replace(/(\d)[\s ,](?=\d{3}\b)/g, '$1').matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]),
	],
	['identifier', (t) => [...withoutCode(t).matchAll(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g)].map((m) => m[0])],
];

/** Items of `a` not matched by an item of `b` (multiset difference). */
function multisetMinus(a: string[], b: string[]): string[] {
	const left = new Map<string, number>();
	for (const x of b) left.set(x, (left.get(x) ?? 0) + 1);
	const out: string[] = [];
	for (const x of a) {
		const n = left.get(x) ?? 0;
		if (n > 0) left.set(x, n - 1);
		else out.push(x);
	}
	return out;
}

function compareTexts(ru: string, en: string): string[] {
	const problems: string[] = [];
	for (const [name, extract] of PARITY_TOKENS) {
		const ruTokens = extract(ru);
		const enTokens = extract(en);
		const lost = multisetMinus(ruTokens, enTokens);
		const added = multisetMinus(enTokens, ruTokens);
		if (lost.length > 0) problems.push(`${name} lost: ${lost.join(' | ')}`);
		if (added.length > 0) problems.push(`${name} added: ${added.join(' | ')}`);
	}
	return problems;
}

/**
 * Walk RU and EN in parallel and compare every Russian text outside examples.
 * `propsMap` marks a `properties` map: its keys are property names, so a property
 * called `description` or `example` is a schema, not a text.
 */
function findParityProblems(ru: any, en: any, at: string, inText: boolean, propsMap: boolean, out: string[]): void {
	if (typeof ru === 'string') {
		if (!inText || !CYRILLIC_RE.test(ru)) return;
		if (typeof en !== 'string') {
			out.push(`${at}: no English text`);
			return;
		}
		const problems = compareTexts(ru, en);
		if (problems.length > 0) out.push(`${at}: ${problems.join('; ')}`);
		return;
	}
	if (ru === null || typeof ru !== 'object' || en === null || typeof en !== 'object') return;
	const keywordLevel = !inText && !propsMap && !Array.isArray(ru);
	for (const key of Object.keys(ru)) {
		if (keywordLevel && (key === 'example' || key === 'examples')) continue;
		const childAt = Array.isArray(ru) ? `${at}[${key}]` : `${at}.${key}`;
		const childInText = inText || (keywordLevel && TEXT_KEYS.has(key));
		const childPropsMap = keywordLevel && key === 'properties';
		findParityProblems(ru[key], en[key], childAt, childInText, childPropsMap, out);
	}
}

// ---------------------------------------------------------------------------
// Fingerprints of the Russian texts behind the translations
// ---------------------------------------------------------------------------

const FINGERPRINTS_COMMENT =
	'Fingerprints of the Russian texts that overlay.en.yaml translates: target field → sha256 prefix. ' +
	'overlay:validate fails when a Russian text changes and the fingerprint does not. ' +
	'Update the English text first, then run `bun run overlay:fingerprints` in packages/spec.';

function fingerprint(value: unknown): string {
	const text = typeof value === 'string' ? value : JSON.stringify(value);
	return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function buildFingerprints(fields: OverlayField[]): Record<string, string> {
	const entries = fields.map((f) => [f.id, fingerprint(f.ru)] as const);
	entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return Object.fromEntries(entries);
}

function compareFingerprints(current: Record<string, string>, recorded: Record<string, string>, fields: OverlayField[]) {
	const ruById = new Map(fields.map((f) => [f.id, f.ru]));
	const changed: string[] = [];
	const unrecorded: string[] = [];
	for (const [id, hash] of Object.entries(current)) {
		if (recorded[id] === undefined) unrecorded.push(id);
		else if (recorded[id] !== hash) {
			const ru = ruById.get(id);
			const excerpt = typeof ru === 'string' ? ru.replace(/\s+/g, ' ').slice(0, 100) : 'x-enum-descriptions';
			changed.push(`${id}\n      RU now: ${excerpt}`);
		}
	}
	const gone = Object.keys(recorded).filter((id) => current[id] === undefined);
	return { changed, unrecorded, gone };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printList(title: string, items: string[], log: (msg: string) => void = console.error) {
	if (items.length === 0) return;
	log(`\n${title} (${items.length}):`);
	for (const item of items) log(`  ✗ ${item}`);
}

function main() {
	const specDir = path.resolve(__dirname, '..');
	let basePath = path.join(specDir, 'openapi.yaml');
	let overlayPath = path.join(specDir, 'overlay.en.yaml');
	let enPath = path.join(specDir, 'openapi.en.yaml');
	const fingerprintsPath = path.join(specDir, 'overlay.en.fingerprints.json');
	let writeFingerprints = false;

	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--base' && args[i + 1]) basePath = path.resolve(args[++i]);
		if (args[i] === '--overlay' && args[i + 1]) overlayPath = path.resolve(args[++i]);
		if (args[i] === '--en' && args[i + 1]) enPath = path.resolve(args[++i]);
		if (args[i] === '--write-fingerprints') writeFingerprints = true;
	}

	const baseDoc = yaml.load(fs.readFileSync(basePath, 'utf8')) as any;
	const overlay = yaml.load(fs.readFileSync(overlayPath, 'utf8')) as any;

	// 1. Coverage, stale targets, duplicates
	const translatable = new Set([...extractTranslatablePaths(baseDoc)].map(normalizeTarget));
	const { fields, stale, duplicates } = checkOverlayActions(overlay, baseDoc);
	const covered = new Set(fields.map((f) => f.id));
	const missing = [...translatable].filter((p) => !covered.has(p)).sort();

	printList('Missing translations', missing);
	printList('Stale targets', stale);
	printList('Duplicate targets (one node field written twice; keep the one at the component path)', duplicates);
	if (missing.length + stale.length + duplicates.length > 0) {
		console.error('\nOverlay targets — BUILD FAILED');
		process.exit(1);
	}

	const current = buildFingerprints(fields);
	if (writeFingerprints) {
		const body = { $comment: FINGERPRINTS_COMMENT, fingerprints: current };
		fs.writeFileSync(fingerprintsPath, `${JSON.stringify(body, null, '\t')}\n`);
		console.log(`✓ Recorded ${fields.length} fingerprints → ${path.basename(fingerprintsPath)}`);
		return;
	}

	// 2. Parity of code tokens, links, numbers and identifiers (needs a fresh openapi.en.yaml)
	if (!fs.existsSync(enPath)) {
		console.error(`✗ ${path.basename(enPath)} not found — run overlay:apply first`);
		process.exit(1);
	}
	const enDoc = yaml.load(fs.readFileSync(enPath, 'utf8')) as any;
	const parity: string[] = [];
	findParityProblems(baseDoc, enDoc, '$', false, false, parity);
	printList('RU/EN parity: the translation lost or gained a token', parity);

	// 3. Fingerprints of the Russian texts
	const recorded = fs.existsSync(fingerprintsPath)
		? ((JSON.parse(fs.readFileSync(fingerprintsPath, 'utf8')).fingerprints ?? {}) as Record<string, string>)
		: {};
	const { changed, unrecorded, gone } = compareFingerprints(current, recorded, fields);
	printList('Russian text changed since the translation was confirmed — update the English text', changed);
	printList('Translations without a fingerprint', unrecorded);
	printList('Fingerprints of targets that no longer exist', gone);

	if (parity.length + changed.length + unrecorded.length + gone.length > 0) {
		if (changed.length + unrecorded.length + gone.length > 0) {
			console.error(
				'\nFix: update the English texts in overlay.en.yaml, then record the state with ' +
					'`bun run overlay:fingerprints` (packages/spec).'
			);
		}
		console.error('\nOverlay validation — BUILD FAILED');
		process.exit(1);
	}

	console.log(
		`✓ Overlay validation passed: ${translatable.size}/${translatable.size} strings translated, ` +
			`${fields.length} targets, parity and fingerprints match`
	);
}

main();
