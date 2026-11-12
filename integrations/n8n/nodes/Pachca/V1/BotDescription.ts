// ============================================================================
// BotDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const botOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Update a Bot',
				value: 'update',
				action: 'Update a bot',
				description: 'Edit bot settings',
			},
		],
		default: 'update',
		displayOptions: {
			show: {
				resource: ['bot'],
			},
		},
	},
];

export const botFields: INodeProperties[] = [
	{
		displayName: 'Bot ID',
		name: 'botId',
		type: 'number',
		default: 1,
		description: 'Bot ID to edit',
		displayOptions: {
			show: {
				resource: ['bot'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		default: '',
		description: 'Outgoing webhook URL',
		displayOptions: {
			show: {
				resource: ['bot'],
				operation: ['update'],
			},
		},
	},
];
