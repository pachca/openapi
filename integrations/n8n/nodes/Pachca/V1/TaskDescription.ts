// ============================================================================
// TaskDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const taskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Create a task',
				value: 'create',
				action: 'Create a task',
				description: 'Create new reminder',
			},
		],
		default: 'create',
		displayOptions: {
			show: {
				resource: ['task'],
			},
		},
	},
];

export const taskFields: INodeProperties[] = [
	{
		displayName: 'Task Kind',
		name: 'taskKind',
		type: 'options',
		options: [
			{
				name: 'Call',
				value: 'call',
				description: 'Call contact',
			},
			{
				name: 'Meeting',
				value: 'meeting',
				description: 'Meeting',
			},
			{
				name: 'Reminder',
				value: 'reminder',
				description: 'Simple reminder',
			},
			{
				name: 'Event',
				value: 'event',
				description: 'Event',
			},
			{
				name: 'Email',
				value: 'email',
				description: 'Send email',
			},
		],
		default: 'reminder',
		description: 'Reminder type',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'taskContent',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		description: 'Reminder description (uses type name if not set)',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Due At',
		name: 'taskDueAt',
		type: 'dateTime',
		default: '',
		description: 'Reminder due date (ISO-8601 format)',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Priority',
		name: 'taskPriority',
		type: 'options',
		options: [
			{
				name: 'Normal',
				value: 1,
				description: 'Normal priority',
			},
			{
				name: 'Important',
				value: 2,
				description: 'Important',
			},
			{
				name: 'Very Important',
				value: 3,
				description: 'Very important',
			},
		],
		default: 1,
		description: 'Reminder priority',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Performer IDs',
		name: 'performerIds',
		type: 'string',
		default: '',
		description: 'Comma-separated responsible user IDs (if empty, you are set as responsible)',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Custom Properties',
		name: 'customProperties',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'property',
				displayName: 'Property',
				values: [
					{
						displayName: 'Field ID',
						name: 'id',
						type: 'number',
						default: 0,
						description: 'Custom field ID',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Field value',
					},
				],
			},
		],
		default: [],
		description: 'Reminder custom fields',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
];
