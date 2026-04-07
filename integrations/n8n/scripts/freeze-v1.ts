#!/usr/bin/env tsx
/**
 * One-time script: generates frozen V1 description files from v1 compiled node.
 * Reads /tmp/v1-description.json (extracted from n8n-nodes-pachca@1.0.27)
 * and outputs nodes/Pachca/V1/*Description.ts files.
 *
 * Run: npx tsx scripts/freeze-v1.ts
 * Then delete this script — V1 files are frozen forever.
 */

import * as fs from 'fs';
import * as path from 'path';

const V1_DIR = path.resolve(__dirname, '../nodes/Pachca/V1');
const description = JSON.parse(fs.readFileSync('/tmp/v1-description.json', 'utf-8'));
const properties: any[] = description.properties;

// Resource name → PascalCase for file naming
const RESOURCE_FILE_NAMES: Record<string, string> = {
	message: 'Message',
	thread: 'Thread',
	reactions: 'Reactions',
	chat: 'Chat',
	user: 'User',
	groupTag: 'GroupTag',
	status: 'Status',
	customFields: 'CustomFields',
	task: 'Task',
	bot: 'Bot',
	file: 'File',
	form: 'Form',
};

// Serialize a value to TypeScript literal
function toTS(value: unknown, indent: number = 0): string {
	const pad = '\t'.repeat(indent);
	const pad1 = '\t'.repeat(indent + 1);

	if (value === null || value === undefined) return 'undefined';
	if (typeof value === 'string') {
		// Use single quotes, escape internal single quotes
		const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
		return `'${escaped}'`;
	}
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);

	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		// Check if it's a simple array (all primitives)
		const allPrimitive = value.every(v => typeof v !== 'object' || v === null);
		if (allPrimitive) {
			return `[${value.map(v => toTS(v)).join(', ')}]`;
		}
		const items = value.map(v => `${pad1}${toTS(v, indent + 1)},`).join('\n');
		return `[\n${items}\n${pad}]`;
	}

	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const keys = Object.keys(obj);
		if (keys.length === 0) return '{}';

		const entries = keys.map(k => {
			const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`;
			return `${pad1}${key}: ${toTS(obj[k], indent + 1)},`;
		}).join('\n');
		return `{\n${entries}\n${pad}}`;
	}

	return String(value);
}

// Clean up property for output — remove undefined fields, normalize
function cleanProp(prop: any): any {
	const clean: any = {};
	// Ordered keys for n8n convention
	const keyOrder = [
		'displayName', 'name', 'type', 'required', 'noDataExpression',
		'typeOptions', 'options', 'default', 'description', 'placeholder',
		'displayOptions', 'routing', 'modes',
	];
	for (const key of keyOrder) {
		if (prop[key] !== undefined) {
			clean[key] = prop[key];
		}
	}
	// Any remaining keys
	for (const key of Object.keys(prop)) {
		if (!(key in clean) && prop[key] !== undefined) {
			clean[key] = prop[key];
		}
	}
	return clean;
}

// Group properties by resource
const resourceProp = properties.find((p: any) => p.name === 'resource');
const resources: string[] = resourceProp.options.map((o: any) => o.value);

for (const resource of resources) {
	const pascalName = RESOURCE_FILE_NAMES[resource];
	if (!pascalName) {
		console.error(`Unknown resource: ${resource}, skipping`);
		continue;
	}

	// Find operation definition for this resource
	const operationProps = properties.filter(
		(p: any) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes(resource),
	);

	// Find field definitions for this resource
	const fieldProps = properties.filter(
		(p: any) =>
			p.name !== 'resource' &&
			p.name !== 'operation' &&
			p.displayOptions?.show?.resource?.includes(resource),
	);

	// Build the operations export
	const opsVarName = `${resource}Operations`;
	const fieldsVarName = `${resource}Fields`;

	let output = `// ============================================================================\n`;
	output += `// ${pascalName}Description.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)\n`;
	output += `// DO NOT EDIT — this file is frozen for backward compatibility\n`;
	output += `// ============================================================================\n\n`;
	output += `import type { INodeProperties } from 'n8n-workflow';\n\n`;

	// Operations
	output += `export const ${opsVarName}: INodeProperties[] = [\n`;
	for (const op of operationProps) {
		output += `\t${toTS(cleanProp(op), 1)},\n`;
	}
	output += `];\n\n`;

	// Fields
	output += `export const ${fieldsVarName}: INodeProperties[] = [\n`;
	for (const field of fieldProps) {
		output += `\t${toTS(cleanProp(field), 1)},\n`;
	}
	output += `];\n`;

	const filePath = path.join(V1_DIR, `${pascalName}Description.ts`);
	fs.writeFileSync(filePath, output);
	console.log(`  ${pascalName}Description.ts — ${operationProps.length} ops, ${fieldProps.length} fields`);
}

// Now generate PachcaV1.node.ts
const v1NodeContent = `// ============================================================================
// PachcaV1.node.ts — FROZEN V1 node class (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type {
\tINodeType,
\tINodeTypeBaseDescription,
\tINodeTypeDescription,
\tIExecuteFunctions,
\tINodeExecutionData,
\tILoadOptionsFunctions,
\tINodeListSearchResult,
\tINodePropertyOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { router } from '../SharedRouter';

${resources.map(r => {
	const pascal = RESOURCE_FILE_NAMES[r];
	return `import { ${r}Operations, ${r}Fields } from './${pascal}Description';`;
}).join('\n')}

function formatUserName(u: { first_name: string; last_name: string; nickname: string }): string {
\tconst fullName = [u.first_name, u.last_name]
\t\t.filter((v) => v != null && v !== '' && v !== 'null')
\t\t.join(' ');
\tconst display = fullName || u.nickname || 'User';
\treturn u.nickname ? \`\${display} (@\${u.nickname})\` : display;
}

export class PachcaV1 implements INodeType {
\tdescription: INodeTypeDescription;

\tconstructor(baseDescription: INodeTypeBaseDescription) {
\t\tthis.description = {
\t\t\t...baseDescription,
\t\t\tversion: 1,
\t\t\tdefaults: { name: 'Pachca' },
\t\t\tinputs: [NodeConnectionTypes.Main],
\t\t\toutputs: [NodeConnectionTypes.Main],
\t\t\tcredentials: [{ name: 'pachcaApi', required: true }],
\t\t\tproperties: [
\t\t\t\t{
\t\t\t\t\tdisplayName: 'Resource',
\t\t\t\t\tname: 'resource',
\t\t\t\t\ttype: 'options',
\t\t\t\t\tnoDataExpression: true,
\t\t\t\t\toptions: [
${resourceProp.options.map((o: any) => `\t\t\t\t\t\t{ name: ${toTS(o.name)}, value: ${toTS(o.value)} },`).join('\n')}
\t\t\t\t\t],
\t\t\t\t\tdefault: 'message',
\t\t\t\t},
${resources.map(r => `\t\t\t\t...${r}Operations,\n\t\t\t\t...${r}Fields,`).join('\n')}
\t\t\t],
\t\t};
\t}

\tasync execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
\t\treturn router.call(this);
\t}

\tmethods = {
\t\tlistSearch: {
\t\t\tasync searchChats(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tconst url = filter
\t\t\t\t\t? \`\${credentials.baseUrl}/search/chats?query=\${encodeURIComponent(filter)}\`
\t\t\t\t\t: \`\${credentials.baseUrl}/chats?per=50\`;
\t\t\t\tconst response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
\t\t\t\t\tmethod: 'GET',
\t\t\t\t\turl,
\t\t\t\t});
\t\t\t\tconst items = response.data ?? [];
\t\t\t\treturn {
\t\t\t\t\tresults: items.map((c: { id: number; name: string }) => ({
\t\t\t\t\t\tname: c.name,
\t\t\t\t\t\tvalue: c.id,
\t\t\t\t\t})),
\t\t\t\t};
\t\t\t},
\t\t\tasync searchUsers(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tif (!filter) return { results: [] };
\t\t\t\tconst url = \`\${credentials.baseUrl}/search/users?query=\${encodeURIComponent(filter)}\`;
\t\t\t\tconst response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
\t\t\t\t\tmethod: 'GET',
\t\t\t\t\turl,
\t\t\t\t});
\t\t\t\tconst items = response.data ?? [];
\t\t\t\treturn {
\t\t\t\t\tresults: items.map((u: { id: number; first_name: string; last_name: string; nickname: string }) => ({
\t\t\t\t\t\tname: formatUserName(u),
\t\t\t\t\t\tvalue: u.id,
\t\t\t\t\t})),
\t\t\t\t};
\t\t\t},
\t\t\tasync searchEntities(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
\t\t\t\tlet entityType = 'discussion';
\t\t\t\ttry {
\t\t\t\t\tentityType = (this.getNodeParameter('entityType') as string) || 'discussion';
\t\t\t\t} catch {
\t\t\t\t\ttry {
\t\t\t\t\t\tentityType = (this.getCurrentNodeParameter('entityType') as string) || 'discussion';
\t\t\t\t\t} catch { /* parameter may not exist yet */ }
\t\t\t\t}
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tif (entityType === 'user') {
\t\t\t\t\tif (!filter) return { results: [] };
\t\t\t\t\tconst url = \`\${credentials.baseUrl}/search/users?query=\${encodeURIComponent(filter)}\`;
\t\t\t\t\tconst response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', { method: 'GET', url });
\t\t\t\t\tconst items = response.data ?? [];
\t\t\t\t\treturn {
\t\t\t\t\t\tresults: items.map((u: { id: number; first_name: string; last_name: string; nickname: string }) => ({
\t\t\t\t\t\t\tname: formatUserName(u),
\t\t\t\t\t\t\tvalue: u.id,
\t\t\t\t\t\t})),
\t\t\t\t\t};
\t\t\t\t}
\t\t\t\tif (entityType === 'thread') {
\t\t\t\t\treturn { results: [] };
\t\t\t\t}
\t\t\t\tconst url = filter
\t\t\t\t\t? \`\${credentials.baseUrl}/search/chats?query=\${encodeURIComponent(filter)}\`
\t\t\t\t\t: \`\${credentials.baseUrl}/chats?per=50\`;
\t\t\t\tconst response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', { method: 'GET', url });
\t\t\t\tconst items = response.data ?? [];
\t\t\t\treturn {
\t\t\t\t\tresults: items.map((c: { id: number; name: string }) => ({
\t\t\t\t\t\tname: c.name,
\t\t\t\t\t\tvalue: c.id,
\t\t\t\t\t})),
\t\t\t\t};
\t\t\t},
\t\t},
\t\tloadOptions: {
\t\t\tasync getCustomProperties(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tconst resource = this.getNodeParameter('resource') as string;
\t\t\t\tconst entityType = resource === 'task' ? 'Task' : 'User';
\t\t\t\ttry {
\t\t\t\t\tconst response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
\t\t\t\t\t\tmethod: 'GET',
\t\t\t\t\t\turl: \`\${credentials.baseUrl}/custom_properties?entity_type=\${entityType}\`,
\t\t\t\t\t});
\t\t\t\t\tconst items = response.data ?? [];
\t\t\t\t\treturn items.map((p: { id: number; name: string }) => ({
\t\t\t\t\t\tname: p.name,
\t\t\t\t\t\tvalue: p.id,
\t\t\t\t\t}));
\t\t\t\t} catch {
\t\t\t\t\treturn [];
\t\t\t\t}
\t\t\t},
\t\t},
\t};
}
`;

fs.writeFileSync(path.join(V1_DIR, 'PachcaV1.node.ts'), v1NodeContent);
console.log('  PachcaV1.node.ts — wrapper with execute + loadOptions');

console.log('\nDone! V1 files frozen in', V1_DIR);
