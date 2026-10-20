/**
 * JSONPath subset shared by apply-overlay.ts and validate-overlay.ts.
 *
 * Supports: $, .key, ['key'], [N], [?(@.name=='value')].
 *
 * Resolution is strict. A target must name the node where the text lives:
 * - it must not pass through a `$ref`. A path such as
 *   `Message.properties.files.items.properties.url` lands in the shared `File`
 *   component, so several targets end up writing the same node and the last one
 *   silently wins. Translate the component itself (`File.properties.url`);
 * - every segment, the last one included, must exist in the base spec. A typo in
 *   the last segment would otherwise create a phantom property in the English
 *   spec, and the MCP manifest and the English docs are built from it.
 */

export interface Resolved {
	parent: any;
	key: string | number;
	/** Canonical path of the node: filters replaced by the matched index. */
	path: (string | number)[];
}

/** Parse a JSONPath target string into segments. */
export function parseTarget(target: string): string[] {
	const segments: string[] = [];
	let i = 0;
	if (target[i] === '$') i++; // skip root

	while (i < target.length) {
		if (target[i] === '.') {
			i++;
			// Read dotted property name (stops at . or [)
			let name = '';
			while (i < target.length && target[i] !== '.' && target[i] !== '[') {
				name += target[i++];
			}
			if (name) segments.push(name);
		} else if (target[i] === '[') {
			i++; // skip [
			if (target[i] === "'") {
				// Bracket string: ['key']
				i++; // skip opening '
				let name = '';
				while (i < target.length && target[i] !== "'") {
					name += target[i++];
				}
				i++; // skip closing '
				i++; // skip ]
				segments.push(name);
			} else if (target[i] === '?') {
				// Filter: [?(@.name=='value')] — find matching ) then ]
				let depth = 0;
				let filterEnd = i;
				while (filterEnd < target.length) {
					if (target[filterEnd] === '(') depth++;
					if (target[filterEnd] === ')') {
						depth--;
						if (depth === 0) {
							filterEnd = target.indexOf(']', filterEnd);
							break;
						}
					}
					filterEnd++;
				}
				segments.push(target.substring(i, filterEnd));
				i = filterEnd + 1;
			} else {
				// Numeric index: [0]
				let num = '';
				while (i < target.length && target[i] !== ']') {
					num += target[i++];
				}
				i++; // skip ]
				segments.push(num);
			}
		} else {
			i++;
		}
	}
	return segments;
}

/** Parse a filter expression like ?(@.name=='value') and return {prop, value}. */
function parseFilter(filter: string): { prop: string; value: string } | null {
	const m = filter.match(/\?\(@\.(\w+)==['"](.*?)['"]\)/);
	if (!m) return null;
	return { prop: m[1], value: m[2] };
}

/**
 * Resolve a JSONPath target to {parent, key} in the document.
 * Throws when the path passes through a `$ref`, when a segment is missing
 * (the last one included) or when a filter matches nothing.
 */
export function resolveTarget(doc: any, target: string): Resolved {
	const segments = parseTarget(target);
	const resolvedPath: (string | number)[] = [];
	let current = doc;

	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		const isLast = i === segments.length - 1;

		if (current === null || typeof current !== 'object') {
			throw new Error(`Segment "${seg}" not found: the parent is not an object. Target: ${target}`);
		}
		if (typeof current.$ref === 'string') {
			throw new Error(
				`Target passes through $ref "${current.$ref}" before "${seg}". ` +
					`Write the target at the component path instead. Target: ${target}`
			);
		}

		let key: string | number;
		if (seg.startsWith('?')) {
			const filter = parseFilter(seg);
			if (!filter || !Array.isArray(current)) {
				throw new Error(`Cannot apply filter "${seg}" — current value is not an array or filter is invalid. Target: ${target}`);
			}
			key = current.findIndex((item: any) => String(item?.[filter.prop]) === filter.value);
			if (key === -1) {
				throw new Error(`Filter "${seg}" matched no elements in array. Target: ${target}`);
			}
		} else if (/^\d+$/.test(seg) && Array.isArray(current)) {
			key = parseInt(seg, 10);
		} else {
			key = seg;
		}

		if (current[key] === undefined) {
			throw new Error(`Segment "${seg}" not found${isLast ? ' (last segment)' : ''}. Target: ${target}`);
		}
		resolvedPath.push(key);
		if (isLast) {
			return { parent: current, key, path: resolvedPath };
		}
		current = current[key];
	}

	throw new Error(`Could not resolve target: ${target}`);
}
