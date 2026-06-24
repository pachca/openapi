import type { INodeProperties } from 'n8n-workflow';

export const oauthOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['oauth'] } },
		options: [
			{
				name: 'Get Info',
				value: 'getInfo',
				action: 'Get oauth info',
			},
		],
		default: 'getInfo',
	},
];

export const oauthFields: INodeProperties[] = [
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['oauth'], operation: ['getInfo'] } },
	},
];