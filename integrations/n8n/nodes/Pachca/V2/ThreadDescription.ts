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
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many threads',
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
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['thread'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: { minValue: 1, maxValue: 50 },
		displayOptions: { show: { resource: ['thread'], operation: ['getAll'], returnAll: [false] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['thread'], operation: ['getAll'] } },
	},
	{
		displayName: 'Last Message At After',
		name: 'lastMessageAtAfter',
		type: 'dateTime',
		default: "",
		description: 'Filter by the time of the last message in the thread. Returns only threads whose last message time is no earlier than the specified time (in YYYY-MM-DDThh:mm:ss.sssZ format).',
		placeholder: '2025-01-01T00:00:00.000Z',
		displayOptions: { show: { resource: ['thread'], operation: ['getAll'] } },
	},
	{
		displayName: 'Last Message At Before',
		name: 'lastMessageAtBefore',
		type: 'dateTime',
		default: "",
		description: 'Filter by the time of the last message in the thread. Returns only threads whose last message time is no later than the specified time (in YYYY-MM-DDThh:mm:ss.sssZ format).',
		placeholder: '2025-02-01T00:00:00.000Z',
		displayOptions: { show: { resource: ['thread'], operation: ['getAll'] } },
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