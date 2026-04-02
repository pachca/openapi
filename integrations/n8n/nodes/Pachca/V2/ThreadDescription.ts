import type { INodeProperties } from 'n8n-workflow';

export const threadOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['thread'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a thread',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a thread',
			},
		],
		default: 'create',
	},
];

export const threadFields: INodeProperties[] = [
	{
		displayName: 'ID',
		name: 'threadMessageId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['thread'], operation: ['create'] } },
		description: 'Message ID',
	},
	{
		displayName: 'ID',
		name: 'threadThreadId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['thread'], operation: ['get'] } },
		description: 'Thread ID',
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['thread'], operation: ['get'] } },
	},
];