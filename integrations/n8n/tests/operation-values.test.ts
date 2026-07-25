import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Operation VALUES are persisted inside users' saved workflows — renaming one
 * silently breaks every workflow that used it.
 *
 * Some values are derived from the spec rather than pinned: a collection GET
 * becomes `getAll<Sub>` only when the endpoint declares a `cursor` query param,
 * and plain `get<Sub>` otherwise. So a backend change that merely adds or drops
 * pagination would flip `getAllUsers` ↔ `getUsers` with no code change here.
 *
 * This guard freezes the values that currently ship. A failure is not
 * necessarily a bug — it means a saved-workflow-visible identifier changed and
 * someone has to decide whether that is intended (and add a v1-compat alias).
 */

const NODES_DIR = path.resolve(__dirname, '../nodes/Pachca/V2');

/** Every operation value declared in the generated V2 descriptions, by resource. */
function shippedOperationValues(): Map<string, Set<string>> {
	const byResource = new Map<string, Set<string>>();
	for (const file of fs.readdirSync(NODES_DIR)) {
		if (!file.endsWith('Description.ts')) continue;
		const resource = file.replace('Description.ts', '');
		const content = fs.readFileSync(path.join(NODES_DIR, file), 'utf-8');
		// Only the operation selector block, not per-field option lists.
		const opBlock = content.match(/name: 'operation'[\s\S]*?\n\t\tdefault: '[^']*',/);
		if (!opBlock) continue;
		const values = new Set(
			[...opBlock[0].matchAll(/\n\t\t\t\tvalue: '([^']+)',/g)].map((m) => m[1]),
		);
		byResource.set(resource, values);
	}
	return byResource;
}

/** Values that must keep working — derived ones (cursor-dependent) included. */
const PINNED: Record<string, string[]> = {
	Chat: ['getAll', 'get', 'create', 'update', 'archive', 'unarchive'],
	GroupTag: ['getAll', 'get', 'create', 'update', 'delete', 'getAllUsers'],
	User: ['getAll', 'get', 'create', 'update', 'delete'],
	Member: ['create', 'delete', 'getAll', 'leave', 'update', 'addGroupTags', 'removeGroupTags'],
	Message: ['create', 'get', 'getAll', 'update', 'delete', 'pin', 'unpin', 'unfurl'],
	Bot: ['getAll', 'recreateTokenSelf'],
};

describe('operation values (saved-workflow contract)', () => {
	const shipped = shippedOperationValues();

	it('discovers the generated descriptions', () => {
		expect(shipped.size).toBeGreaterThan(5);
	});

	for (const [resource, values] of Object.entries(PINNED)) {
		it(`${resource}: keeps its published operation values`, () => {
			const actual = shipped.get(resource);
			expect(actual, `no ${resource}Description.ts found`).toBeDefined();
			for (const value of values) {
				expect(
					actual!.has(value),
					`${resource}: operation value "${value}" disappeared — saved workflows reference it`,
				).toBe(true);
			}
		});
	}

	it('never lands a destructive operation as a resource default', () => {
		// A resource's default operation is what runs if someone drops the node in
		// and hits Execute. `bot` used to default to recreateTokenSelf.
		const destructive = /^(delete|remove|recreateToken|recreateTokenSelf|archive|leave)/;
		for (const file of fs.readdirSync(NODES_DIR)) {
			if (!file.endsWith('Description.ts')) continue;
			const content = fs.readFileSync(path.join(NODES_DIR, file), 'utf-8');
			const opBlock = content.match(/name: 'operation'[\s\S]*?\n\t\tdefault: '([^']*)',/);
			if (!opBlock) continue;
			expect(
				destructive.test(opBlock[1]),
				`${file}: default operation "${opBlock[1]}" is destructive`,
			).toBe(false);
		}
	});
});
