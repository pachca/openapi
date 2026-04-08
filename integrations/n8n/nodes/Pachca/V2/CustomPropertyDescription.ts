import type { INodeProperties } from 'n8n-workflow';

export const customPropertyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['customProperty'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a custom property',
			},
		],
		default: 'get',
	},
];

export const customPropertyFields: INodeProperties[] = [
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['customProperty'], operation: ['get'] } },
	},
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		required: true,
		options: [{ name: 'Task', value: 'Task' },
{ name: 'User', value: 'User' }],
		default: "",
		displayOptions: { show: { resource: ['customProperty'], operation: ['get'] } },
	},
];