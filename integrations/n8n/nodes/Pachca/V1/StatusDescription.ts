// ============================================================================
// StatusDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
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
				name: 'Get My Profile',
				value: 'getProfile',
				action: 'Get my profile',
				description: 'Get own profile info',
			},
			{
				name: 'Get My Status',
				value: 'getStatus',
				action: 'Get my status',
				description: 'Get own status info',
			},
			{
				name: 'Set My Status',
				value: 'updateStatus',
				action: 'Set my status',
				description: 'Set new status',
			},
			{
				name: 'Clear My Status',
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
