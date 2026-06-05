// ============================================================================
// ChatDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Get all chats',
				value: 'getAll',
				action: 'Get all chats',
				description: 'Get list of all chats',
			},
			{
				name: 'Get a chat',
				value: 'getById',
				action: 'Get a chat',
				description: 'Get chat by ID',
			},
			{
				name: 'Create a chat',
				value: 'create',
				action: 'Create a chat',
				description: 'Create new chat',
			},
			{
				name: 'Update a chat',
				value: 'update',
				action: 'Update a chat',
				description: 'Update chat',
			},
			{
				name: 'Archive a chat',
				value: 'archive',
				action: 'Archive a chat',
				description: 'Archive chat',
			},
			{
				name: 'Unarchive a chat',
				value: 'unarchive',
				action: 'Unarchive a chat',
				description: 'Unarchive chat',
			},
			{
				name: 'Get chat members',
				value: 'getMembers',
				action: 'Get chat members',
				description: 'Get chat members list',
			},
			{
				name: 'Add users to chat',
				value: 'addUsers',
				action: 'Add users to chat',
				description: 'Add users to chat',
			},
			{
				name: 'Remove user from chat',
				value: 'removeUser',
				action: 'Remove user from chat',
				description: 'Remove user from chat',
			},
			{
				name: 'Update user role in chat',
				value: 'updateRole',
				action: 'Update user role in chat',
				description: 'Change user role in chat',
			},
			{
				name: 'Leave a chat',
				value: 'leaveChat',
				action: 'Leave a chat',
				description: 'Leave chat',
			},
		],
		default: 'getAll',
		displayOptions: {
			show: {
				resource: ['chat'],
			},
		},
	},
];

export const chatFields: INodeProperties[] = [
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
		displayName: 'Chat ID',
		name: 'chatId',
		type: 'number',
		default: 1,
		description: 'Chat ID',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['getById', 'update', 'archive', 'unarchive', 'getMembers', 'addUsers', 'removeUser', 'updateRole', 'leaveChat'],
			},
		},
	},
	{
		displayName: 'Chat Name',
		name: 'chatName',
		type: 'string',
		default: '',
		description: 'Chat name',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'boolean',
		default: false,
		description: 'Create channel (true) or chat (false)',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Public',
		name: 'public',
		type: 'boolean',
		default: false,
		description: 'Open (true) or closed (false) access',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Options',
		name: 'chatMembersOptions',
		type: 'collection',
		options: [
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
						description: 'Any role',
					},
					{
						name: 'Owner',
						value: 'owner',
						description: 'Creator',
					},
					{
						name: 'Admin',
						value: 'admin',
						description: 'Administrator',
					},
					{
						name: 'Editor',
						value: 'editor',
						description: 'Editor',
					},
					{
						name: 'Member',
						value: 'member',
						description: 'Member/Subscriber',
					},
				],
				default: 'all',
				description: 'Chat role filter',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Number of members to return (max 50)',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor (from meta.paginate.next_page)',
			},
		],
		default: {},
		placeholder: 'Add option',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['getMembers'],
			},
		},
	},
	{
		displayName: 'Member IDs',
		name: 'memberIds',
		type: 'string',
		default: '',
		description: 'Comma-separated user IDs (e.g. 186,187)',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['addUsers'],
			},
		},
	},
	{
		displayName: 'Silent',
		name: 'silent',
		type: 'boolean',
		default: false,
		description: 'Do not create system message about adding member',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['addUsers'],
			},
		},
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'number',
		default: 1,
		description: 'User ID',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['removeUser', 'updateRole'],
			},
		},
	},
	{
		displayName: 'New Role',
		name: 'newRole',
		type: 'options',
		options: [
			{
				name: 'Admin',
				value: 'admin',
				description: 'Administrator',
			},
			{
				name: 'Editor',
				value: 'editor',
				description: 'Editor (channels only)',
			},
			{
				name: 'Member',
				value: 'member',
				description: 'Member/Subscriber',
			},
		],
		default: 'member',
		description: 'New user role',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['updateRole'],
			},
		},
	},
];
