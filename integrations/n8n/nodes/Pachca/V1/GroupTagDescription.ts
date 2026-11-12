// ============================================================================
// GroupTagDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const groupTagOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Add Tags to Chat',
				value: 'addTags',
				action: 'Add tags to chat',
			},
			{
				name: 'Create a Group Tag',
				value: 'create',
				action: 'Create a group tag',
				description: 'Create new group tag',
			},
			{
				name: 'Delete a Group Tag',
				value: 'delete',
				action: 'Delete a group tag',
				description: 'Delete group tag',
			},
			{
				name: 'Get a Group Tag',
				value: 'getById',
				action: 'Get a group tag',
				description: 'Get group tag by ID',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many group tags',
				description: 'Get many group tags',
			},
			{
				name: 'Get Users in Group Tag',
				value: 'getUsers',
				action: 'Get users in group tag',
			},
			{
				name: 'Remove Tag From Chat',
				value: 'removeTag',
				action: 'Remove tag from chat',
			},
			{
				name: 'Update a Group Tag',
				value: 'update',
				action: 'Update a group tag',
				description: 'Update group tag',
			},
		],
		default: 'getAll',
		displayOptions: {
			show: {
				resource: ['groupTag'],
			},
		},
	},
];

export const groupTagFields: INodeProperties[] = [
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
		displayName: 'Group Tag ID',
		name: 'groupTagId',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['groupTag'],
				operation: ['getById', 'update', 'delete', 'getUsers', 'removeTag'],
			},
		},
	},
	{
		displayName: 'Group Tag Name',
		name: 'groupTagName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['groupTag'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Group Tag Color',
		name: 'groupTagColor',
		type: 'color',
		default: '#000000',
		description: 'Group tag color (hex code)',
		displayOptions: {
			show: {
				resource: ['groupTag'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Chat ID',
		name: 'groupTagChatId',
		type: 'number',
		default: 1,
		description: 'Chat ID for tag operations',
		displayOptions: {
			show: {
				resource: ['groupTag'],
				operation: ['addTags', 'removeTag'],
			},
		},
	},
	{
		displayName: 'Group Tag IDs',
		name: 'groupTagIds',
		type: 'string',
		default: '',
		description: 'Comma-separated tag IDs (e.g. 86,18)',
		displayOptions: {
			show: {
				resource: ['groupTag'],
				operation: ['addTags'],
			},
		},
	},
	{
		displayName: 'Tag ID',
		name: 'tagId',
		type: 'number',
		default: 1,
		description: 'Tag ID to remove',
		displayOptions: {
			show: {
				resource: ['groupTag'],
				operation: ['removeTag'],
			},
		},
	},
];
