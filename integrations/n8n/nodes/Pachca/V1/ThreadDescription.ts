// ============================================================================
// ThreadDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const threadOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Create a Thread',
				value: 'createThread',
				action: 'Create a thread',
				description: 'Create thread to message',
			},
			{
				name: 'Get a Thread',
				value: 'getThread',
				action: 'Get a thread',
				description: 'Get thread info',
			},
		],
		default: 'createThread',
		displayOptions: {
			show: {
				resource: ['thread'],
			},
		},
	},
];

export const threadFields: INodeProperties[] = [
	{
		displayName: 'Message ID',
		name: 'threadMessageId',
		type: 'number',
		default: '',
		description: 'Message ID for creating thread',
		displayOptions: {
			show: {
				resource: ['thread'],
				operation: ['createThread'],
			},
		},
	},
	{
		displayName: 'Thread ID',
		name: 'threadThreadId',
		type: 'number',
		default: '',
		description: 'Thread ID to get info for',
		displayOptions: {
			show: {
				resource: ['thread'],
				operation: ['getThread'],
			},
		},
	},
];
