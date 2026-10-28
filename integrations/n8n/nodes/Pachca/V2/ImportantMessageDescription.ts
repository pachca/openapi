import type { INodeProperties } from 'n8n-workflow';

export const importantMessageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['importantMessage'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a important message',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a important message',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many important messages',
			},
		],
		default: 'getAll',
	},
];

export const importantMessageFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['importantMessage'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: { minValue: 1, maxValue: 50 },
		displayOptions: { show: { resource: ['importantMessage'], operation: ['getAll'], returnAll: [false] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['importantMessage'], operation: ['getAll'] } },
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['importantMessage'], operation: ['create'] } },
		placeholder: '194275',
	},
	{
		displayName: 'ID',
		name: 'id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['importantMessage'], operation: ['delete'] } },
		description: 'Message ID',
	},
];