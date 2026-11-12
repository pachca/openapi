// ============================================================================
// ChatDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
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
				name: 'Add Users to Chat',
				value: 'addUsers',
				action: 'Add users to chat',
			},
			{
				name: 'Archive a Chat',
				value: 'archive',
				action: 'Archive a chat',
				description: 'Archive chat',
			},
			{
				name: 'Create a Chat',
				value: 'create',
				action: 'Create a chat',
				description: 'Create new chat',
			},
			{
				name: 'Get a Chat',
				value: 'getById',
				action: 'Get a chat',
				description: 'Get chat by ID',
			},
			{
				name: 'Get Chat Members',
				value: 'getMembers',
				action: 'Get chat members',
				description: 'Get chat members list',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many chats',
				description: 'Get many chats',
			},
			{
				name: 'Leave a Chat',
				value: 'leaveChat',
				action: 'Leave a chat',
				description: 'Leave chat',
			},
			{
				name: 'Remove User From Chat',
				value: 'removeUser',
				action: 'Remove user from chat',
			},
			{
				name: 'Unarchive a Chat',
				value: 'unarchive',
				action: 'Unarchive a chat',
				description: 'Unarchive chat',
			},
			{
				name: 'Update a Chat',
				value: 'update',
				action: 'Update a chat',
				description: 'Update chat',
			},
			{
				name: 'Update User Role in Chat',
				value: 'updateRole',
				action: 'Update user role in chat',
				description: 'Change user role in chat',
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
		description: 'Whether to create a channel instead of a chat',
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
		description: 'Whether the chat is open: every employee of the workspace except guests and multi-guests sees it and can join it on their own. Without this flag the chat is closed, and only the members added to it are in it.',
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
						name: 'Admin',
						value: 'admin',
						description: 'Administrator',
					},
					{
						name: 'All',
						value: 'all',
						description: 'Any role',
					},
					{
						name: 'Editor',
						value: 'editor',
					},
					{
						name: 'Member',
						value: 'member',
						description: 'Member/Subscriber',
					},
					{
						name: 'Owner',
						value: 'owner',
						description: 'Creator',
					},
				],
				default: 'all',
				description: 'Chat role filter',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				default: 50,
				description: 'Max number of results to return',
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
		description: 'Whether to skip the system message about the added members',
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
