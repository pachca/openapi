// ============================================================================
// CustomFieldsDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const customFieldsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Get Custom Properties',
				value: 'getCustomProperties',
				action: 'Get custom properties',
				description: 'Get list of custom fields for entity',
			},
		],
		default: 'getCustomProperties',
		displayOptions: {
			show: {
				resource: ['customFields'],
			},
		},
	},
];

export const customFieldsFields: INodeProperties[] = [
	{
		displayName: 'Additional Options',
		name: 'paginationOptions',
		type: 'collection',
		options: [
			{
				displayName: 'Per Page',
				name: 'per',
				type: 'number',
				default: 25,
				description: 'Items per page (max 50)',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				description: 'Page number',
			},
		],
		default: {},
		placeholder: 'Add option',
		displayOptions: {
			show: {
				resource: ['message', 'chat', 'groupTag', 'customFields'],
				operation: ['getAll', 'getUsers'],
			},
		},
	},
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		options: [
			{
				name: 'User',
				value: 'User',
				description: 'Member',
			},
			{
				name: 'Task',
				value: 'Task',
				description: 'Reminder',
			},
		],
		default: 'User',
		description: 'Entity type for custom fields',
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['getCustomProperties'],
			},
		},
	},
];
