// ============================================================================
// UserDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Get all users',
				value: 'getAll',
				action: 'Get all users',
				description: 'Get list of all users',
			},
			{
				name: 'Get a user',
				value: 'getById',
				action: 'Get a user',
				description: 'Get user by ID',
			},
			{
				name: 'Create a user',
				value: 'create',
				action: 'Create a user',
				description: 'Create new user (Admin/Owner tokens only)',
			},
			{
				name: 'Update a user',
				value: 'update',
				action: 'Update a user',
				description: 'Update user (Admin/Owner tokens only)',
			},
			{
				name: 'Delete a user',
				value: 'delete',
				action: 'Delete a user',
				description: 'Delete user (Admin/Owner tokens only)',
			},
		],
		default: 'getAll',
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
	},
];

export const userFields: INodeProperties[] = [
	{
		displayName: 'Get All Users (No Limit)',
		name: 'getAllUsersNoLimit',
		type: 'boolean',
		default: false,
		description: 'Get all users with full pagination (ignores per/page)',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
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
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Search phrase to filter users',
			},
		],
		default: {},
		placeholder: 'Add option',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getAll'],
				getAllUsersNoLimit: [false],
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
				resource: ['user'],
				operation: ['getById', 'update', 'delete'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		description: 'User email',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		description: 'User first name',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		description: 'User last name',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Additional Options',
		name: 'filterOptions',
		type: 'collection',
		options: [
			{
				displayName: 'Filter Role',
				name: 'filterRole',
				type: 'multiOptions',
				options: [
					{
						name: 'Admin',
						value: 'admin',
					},
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Multi Guest',
						value: 'multi_guest',
					},
				],
				default: [],
				description: 'Filter by user roles (if not set - all roles)',
			},
			{
				displayName: 'Filter Bot',
				name: 'filterBot',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Users Only',
						value: 'users',
					},
					{
						name: 'Bots Only',
						value: 'bots',
					},
				],
				default: 'all',
				description: 'Filter by type: users or bots',
			},
			{
				displayName: 'Filter Suspended',
				name: 'filterSuspended',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Active Only (suspended=false)',
						value: 'active',
					},
					{
						name: 'Suspended Only (suspended=true)',
						value: 'suspended',
					},
				],
				default: 'all',
				description: 'Filter by block status',
			},
			{
				displayName: 'Filter Invite Status',
				name: 'filterInviteStatus',
				type: 'multiOptions',
				options: [
					{
						name: 'Confirmed',
						value: 'confirmed',
					},
					{
						name: 'Sent',
						value: 'sent',
					},
				],
				default: [],
				description: 'Filter by invitation status (if not set - all statuses)',
			},
		],
		default: {},
		placeholder: 'Add option',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getAll'],
				getAllUsersNoLimit: [true],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		options: [
			{
				displayName: 'Nickname',
				name: 'nickname',
				type: 'string',
				default: '',
				description: 'User nickname',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				description: 'Phone number',
			},
			{
				displayName: 'Department',
				name: 'department',
				type: 'string',
				default: '',
				description: 'Department',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Job title',
			},
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
						name: 'User',
						value: 'user',
						description: 'Employee',
					},
					{
						name: 'Multi Guest',
						value: 'multi_guest',
						description: 'Multi-guest',
					},
				],
				default: 'user',
				description: 'Access level',
			},
			{
				displayName: 'Suspended',
				name: 'suspended',
				type: 'boolean',
				default: false,
				description: 'User deactivation',
			},
			{
				displayName: 'List Tags',
				name: 'listTags',
				type: 'string',
				default: '',
				description: 'User tags (comma-separated)',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
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
								description: 'Custom field identifier',
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
				description: 'User custom fields',
			},
		],
		default: {},
		placeholder: 'Add field',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['create', 'update'],
			},
		},
	},
];
