// ============================================================================
// GroupTagDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
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
				name: 'Get all group tags',
				value: 'getAll',
				action: 'Get all group tags',
				description: 'Get list of all group tags',
			},
			{
				name: 'Get a group tag',
				value: 'getById',
				action: 'Get a group tag',
				description: 'Get group tag by ID',
			},
			{
				name: 'Create a group tag',
				value: 'create',
				action: 'Create a group tag',
				description: 'Create new group tag',
			},
			{
				name: 'Update a group tag',
				value: 'update',
				action: 'Update a group tag',
				description: 'Update group tag',
			},
			{
				name: 'Delete a group tag',
				value: 'delete',
				action: 'Delete a group tag',
				description: 'Delete group tag',
			},
			{
				name: 'Get users in group tag',
				value: 'getUsers',
				action: 'Get users in group tag',
				description: 'Get users in group tag',
			},
			{
				name: 'Add tags to chat',
				value: 'addTags',
				action: 'Add tags to chat',
				description: 'Add tags to chat',
			},
			{
				name: 'Remove tag from chat',
				value: 'removeTag',
				action: 'Remove tag from chat',
				description: 'Remove tag from chat',
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
		description: 'Group tag ID',
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
		description: 'Group tag name',
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
		type: 'string',
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
