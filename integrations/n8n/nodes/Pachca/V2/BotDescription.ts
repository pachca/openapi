import type { INodeProperties } from 'n8n-workflow';

export const botOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bot'] } },
		options: [
			{
				name: 'Get Many Events',
				value: 'getAllEvents',
				action: 'Get many bot events',
			},
			{
				name: 'Remove Events',
				value: 'removeEvents',
				action: 'Remove events from bot',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a bot',
			},
		],
		default: 'update',
	},
];

export const botFields: INodeProperties[] = [
	{
		displayName: 'ID',
		name: 'botId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['bot'], operation: ['update'] } },
		description: 'Bot ID',
	},
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/webhook',
		description: 'URL for the outgoing webhook',
		displayOptions: { show: { resource: ['bot'], operation: ['update'] } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['bot'], operation: ['getAllEvents'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: { minValue: 1, maxValue: 50 },
		displayOptions: { show: { resource: ['bot'], operation: ['getAllEvents'], returnAll: [false] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['bot'], operation: ['getAllEvents'] } },
	},
	{
		displayName: 'ID',
		name: 'id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['bot'], operation: ['removeEvents'] } },
		description: 'Event ID',
	},
];