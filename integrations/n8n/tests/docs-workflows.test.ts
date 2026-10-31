import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { INodeProperties, INodeTypeBaseDescription } from 'n8n-workflow';
import { PachcaV2 } from '../nodes/Pachca/V2/PachcaV2.node';
import { PachcaTrigger } from '../nodes/Pachca/PachcaTrigger.node';

/**
 * The ready-made workflows on dev.pachca.com/guides/n8n/workflows are imported
 * into n8n as is. n8n keeps a parameter the node does not declare without a
 * word, and the node then falls back to the default, so a renamed field turns a
 * workflow into one that runs and does the wrong thing. Every parameter of every
 * Pachca node in those files has to exist for its resource and operation.
 */

const WORKFLOWS_DIR = path.resolve(__dirname, '../../../apps/docs/public/workflows/n8n');

interface WorkflowNode {
	name: string;
	type: string;
	typeVersion: number;
	parameters: Record<string, unknown>;
}

const v2 = new PachcaV2({ displayName: 'Pachca', name: 'pachca' } as INodeTypeBaseDescription);
const trigger = new PachcaTrigger();

function isExpression(value: unknown): boolean {
	return typeof value === 'string' && value.startsWith('=');
}

/** A property applies when every `show` condition matches the node's parameters. */
function applies(prop: INodeProperties, params: Record<string, unknown>): boolean {
	const show = prop.displayOptions?.show ?? {};
	return Object.entries(show).every(([key, allowed]) => {
		const value = params[key] ?? v2.description.properties.find((p) => p.name === key)?.default;
		return (allowed as unknown[]).includes(value);
	});
}

function checkValue(prop: INodeProperties, value: unknown, where: string): string[] {
	// Without the leading `=` n8n sends `{{ … }}` as literal text.
	if (typeof value === 'string' && value.includes('{{') && !isExpression(value)) {
		return [`${where}: has {{ }} but does not start with "=", so it is not an expression`];
	}
	if (isExpression(value)) return [];
	if (prop.type === 'options') {
		const values = (prop.options ?? []).map((o) => (o as { value: unknown }).value);
		return values.includes(value) ? [] : [`${where}: "${String(value)}" is not one of ${values.join(', ')}`];
	}
	if (prop.type === 'collection') {
		const options = (prop.options ?? []) as INodeProperties[];
		return Object.entries(value as Record<string, unknown>).flatMap(([key, inner]) => {
			const option = options.find((o) => o.name === key);
			return option ? checkValue(option, inner, `${where}.${key}`) : [`${where}.${key}: no such field`];
		});
	}
	if (prop.type === 'fixedCollection') {
		const groups = (prop.options ?? []) as Array<{ name: string; values: INodeProperties[] }>;
		return Object.entries(value as Record<string, unknown>).flatMap(([groupName, entries]) => {
			const group = groups.find((g) => g.name === groupName);
			if (!group) return [`${where}.${groupName}: no such group`];
			return (entries as Array<Record<string, unknown>>).flatMap((entry, i) =>
				Object.entries(entry).flatMap(([key, inner]) => {
					const field = group.values.find((v) => v.name === key);
					const at = `${where}.${groupName}[${i}].${key}`;
					return field ? checkValue(field, inner, at) : [`${at}: no such field`];
				}),
			);
		});
	}
	if (prop.type === 'resourceLocator') {
		const locator = value as { __rl?: boolean; mode?: string };
		const modes = (prop.modes ?? []).map((m) => m.name);
		return locator.__rl && modes.includes(locator.mode ?? '') ? [] : [`${where}: not a resource locator in mode ${modes.join('/')}`];
	}
	if (prop.type === 'json' && typeof value === 'string') {
		try {
			JSON.parse(value);
			return [];
		} catch {
			return [`${where}: not valid JSON`];
		}
	}
	return [];
}

function problems(node: WorkflowNode): string[] {
	const params = node.parameters;
	return Object.entries(params).flatMap(([key, value]) => {
		const prop = v2.description.properties.find((p) => p.name === key && applies(p, params));
		if (!prop) return [`${node.name}: parameter "${key}" does not exist for ${String(params.resource)} > ${String(params.operation)}`];
		return checkValue(prop, value, `${node.name}.${key}`);
	});
}

const files = fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.json'));

describe('workflows on the docs page match the node', () => {
	it('has the workflow files', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		describe(file, () => {
			const workflow = JSON.parse(fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf-8')) as { nodes: WorkflowNode[] };
			const pachcaNodes = workflow.nodes.filter((n) => n.type === 'n8n-nodes-pachca.pachca');
			const triggerNodes = workflow.nodes.filter((n) => n.type === 'n8n-nodes-pachca.pachcaTrigger');

			it('uses one Pachca Trigger at most: a bot has one webhook URL', () => {
				expect(triggerNodes.length).toBeLessThanOrEqual(1);
			});

			for (const node of triggerNodes) {
				it(`${node.name}: trigger version and event exist`, () => {
					expect(node.typeVersion).toBe(trigger.description.version);
					const eventProp = trigger.description.properties.find((p) => p.name === 'event')!;
					expect(Object.keys(node.parameters)).toEqual(['event']);
					expect(checkValue(eventProp, node.parameters.event, `${node.name}.event`)).toEqual([]);
				});
			}

			for (const node of pachcaNodes) {
				it(`${node.name}: every parameter exists in Pachca v2`, () => {
					expect(node.typeVersion).toBe(v2.description.version);
					expect(problems(node)).toEqual([]);
				});
			}
		});
	}
});
