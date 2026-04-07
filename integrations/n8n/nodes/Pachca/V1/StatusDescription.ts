// ============================================================================
// StatusDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const statusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Get my profile',
				value: 'getProfile',
				action: 'Get my profile',
				description: 'Get own profile info',
			},
			{
				name: 'Get my status',
				value: 'getStatus',
				action: 'Get my status',
				description: 'Get own status info',
			},
			{
				name: 'Set my status',
				value: 'updateStatus',
				action: 'Set my status',
				description: 'Set new status',
			},
			{
				name: 'Clear my status',
				value: 'deleteStatus',
				action: 'Clear my status',
				description: 'Delete own status',
			},
		],
		default: 'getProfile',
		displayOptions: {
			show: {
				resource: ['status'],
			},
		},
	},
];

export const statusFields: INodeProperties[] = [
	{
		displayName: 'Status Emoji',
		name: 'statusEmoji',
		type: 'string',
		default: '🎮',
		description: 'Status emoji',
		displayOptions: {
			show: {
				resource: ['status'],
				operation: ['updateStatus'],
			},
		},
	},
	{
		displayName: 'Status Title',
		name: 'statusTitle',
		type: 'string',
		default: '',
		description: 'Status text',
		displayOptions: {
			show: {
				resource: ['status'],
				operation: ['updateStatus'],
			},
		},
	},
	{
		displayName: 'Status Expires At',
		name: 'statusExpiresAt',
		type: 'dateTime',
		default: '',
		description: 'Status TTL (optional)',
		displayOptions: {
			show: {
				resource: ['status'],
				operation: ['updateStatus'],
			},
		},
	},
];
