import type { INodeProperties } from 'n8n-workflow';

export const readMemberOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['readMember'] } },
		options: [
			{
				name: 'Get Many Read Member IDs',
				value: 'getAllReadMemberIds',
				action: 'Get many read member ids',
			},
		],
		default: 'getAllReadMemberIds',
	},
];

export const readMemberFields: INodeProperties[] = [
	{
		displayName: 'ID',
		name: 'id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['readMember'], operation: ['getAllReadMemberIds'] } },
		description: 'Message ID',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['readMember'], operation: ['getAllReadMemberIds'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: { minValue: 1, maxValue: 300 },
		displayOptions: { show: { resource: ['readMember'], operation: ['getAllReadMemberIds'], returnAll: [false] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['readMember'], operation: ['getAllReadMemberIds'] } },
	},
];