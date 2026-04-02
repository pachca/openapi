// ============================================================================
// MessageDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Send a message',
				value: 'send',
				action: 'Send a message',
				description: 'Send message',
			},
			{
				name: 'Get a message',
				value: 'getById',
				action: 'Get a message',
				description: 'Get message by ID',
			},
			{
				name: 'Get messages from a chat',
				value: 'getAll',
				action: 'Get messages from a chat',
				description: 'Get chat messages',
			},
			{
				name: 'Update a message',
				value: 'update',
				action: 'Update a message',
				description: 'Edit message',
			},
			{
				name: 'Delete a message',
				value: 'delete',
				action: 'Delete a message',
				description: 'Delete message (Admin/Owner tokens only)',
			},
			{
				name: 'Pin a message',
				value: 'pin',
				action: 'Pin a message',
				description: 'Pin message',
			},
			{
				name: 'Unpin a message',
				value: 'unpin',
				action: 'Unpin a message',
				description: 'Unpin message',
			},
			{
				name: 'Get message readers',
				value: 'getReadMembers',
				action: 'Get message readers',
				description: 'Get list of message readers',
			},
			{
				name: 'Unfurl message links',
				value: 'unfurl',
				action: 'Unfurl message links',
				description: 'Create link previews in message (unfurl)',
			},
		],
		default: 'send',
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
	},
];

export const messageFields: INodeProperties[] = [
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		options: [
			{
				name: 'Discussion',
				value: 'discussion',
				description: 'Chat or channel',
			},
			{
				name: 'User',
				value: 'user',
				description: 'Direct message to user',
			},
			{
				name: 'Thread',
				value: 'thread',
				description: 'Thread comment',
			},
		],
		default: 'discussion',
		description: 'Entity type for sending message',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
	},
	{
		displayName: 'Entity ID',
		name: 'entityId',
		type: 'number',
		default: '',
		description: 'Chat, user or thread ID',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Message text',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send', 'update'],
			},
		},
	},
	{
		displayName: 'Files',
		name: 'files',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'file',
				displayName: 'File',
				values: [
					{
						displayName: 'File Key',
						name: 'key',
						type: 'string',
						default: '',
						description: 'File path/key from file upload result',
						required: true,
					},
					{
						displayName: 'File Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'File name shown to user',
						required: true,
					},
					{
						displayName: 'File Type',
						name: 'fileType',
						type: 'options',
						options: [
							{
								name: 'File',
								value: 'file',
							},
							{
								name: 'Image',
								value: 'image',
							},
						],
						default: 'file',
						description: 'File type',
						required: true,
					},
					{
						displayName: 'File Size (bytes)',
						name: 'size',
						type: 'number',
						default: 0,
						description: 'File size in bytes',
						required: true,
					},
					{
						displayName: 'Width (px)',
						name: 'width',
						type: 'number',
						default: '',
						displayOptions: {
							show: {
								fileType: ['image'],
							},
						},
						description: 'Image width in pixels (images only)',
					},
					{
						displayName: 'Height (px)',
						name: 'height',
						type: 'number',
						default: '',
						displayOptions: {
							show: {
								fileType: ['image'],
							},
						},
						description: 'Image height in pixels (images only)',
					},
				],
			},
		],
		default: [],
		description: 'Attached files',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send', 'update'],
			},
		},
	},
	{
		displayName: 'Button Layout',
		name: 'buttonLayout',
		type: 'options',
		options: [
			{
				name: 'Single Row (all buttons in one row)',
				value: 'single_row',
			},
			{
				name: 'Multiple Rows (each button on its own row)',
				value: 'multiple_rows',
			},
			{
				name: 'Raw JSON',
				value: 'raw_json',
				description: 'Enter button JSON directly',
			},
		],
		default: 'single_row',
		description: 'Button layout style',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send', 'update'],
			},
		},
	},
	{
		displayName: 'Buttons',
		name: 'buttons',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'button',
				displayName: 'Button',
				values: [
					{
						displayName: 'Button Text',
						name: 'text',
						type: 'string',
						default: '',
						description: 'Button text',
					},
					{
						displayName: 'Button Type',
						name: 'type',
						type: 'options',
						options: [
							{
								name: 'Data Button (for forms)',
								value: 'data',
							},
							{
								name: 'URL Button',
								value: 'url',
							},
						],
						default: 'data',
					},
					{
						displayName: 'Data Value',
						name: 'data',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['data'],
							},
						},
						description: 'Value for Data button (sent in webhook)',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['url'],
							},
						},
						description: 'URL to open',
					},
				],
			},
		],
		default: [],
		description: 'Message buttons (Data buttons for forms, URL buttons for links)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send', 'update'],
				buttonLayout: ['single_row', 'multiple_rows'],
			},
		},
	},
	{
		displayName: 'Raw JSON Buttons',
		name: 'rawJsonButtons',
		type: 'json',
		default: '[\n  [\n    {"text": "👍 Agree", "data": "vote_yes"},\n    {"text": "❌ Decline", "data": "vote_no"}\n  ],\n  [\n    {"text": "🕒 Postpone by a week", "data": "pause_week"}\n  ],\n  [\n    {"text": "My projects", "url": "https://projects.com/list"}\n  ]\n]',
		description: 'Raw JSON for buttons in API format: array of arrays (each row is an array of buttons). Use button array [{...}, {...}] or rows [[{...}, {...}], [{...}]]. See example above.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send', 'update'],
				buttonLayout: ['raw_json'],
			},
		},
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'number',
		default: '',
		description: 'Message ID',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getById', 'update', 'delete', 'pin', 'unpin', 'getReadMembers'],
			},
		},
	},
	{
		displayName: 'Chat ID',
		name: 'chatId',
		type: 'number',
		default: '',
		description: 'Chat ID to get messages from',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getAll'],
			},
		},
	},
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
		displayName: 'Additional Options',
		name: 'readMembersOptions',
		type: 'collection',
		options: [
			{
				displayName: 'Per Page',
				name: 'readMembersPer',
				type: 'number',
				default: 300,
				description: 'Number of users to return (max 300)',
			},
			{
				displayName: 'Page',
				name: 'readMembersPage',
				type: 'number',
				default: 1,
				description: 'Page of readers to fetch',
			},
		],
		default: {},
		placeholder: 'Add option',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getReadMembers'],
			},
		},
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'number',
		default: '',
		description: 'Message ID for creating link previews (unfurl)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['unfurl'],
			},
		},
	},
	{
		displayName: 'Link Previews',
		name: 'linkPreviews',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'preview',
				displayName: 'Preview',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'Link URL for preview (unfurl)',
						required: true,
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Link preview title',
						required: true,
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Link preview description',
						required: true,
					},
					{
						displayName: 'Image URL',
						name: 'imageUrl',
						type: 'string',
						default: '',
						description: 'Public image URL (used when no file is provided)',
					},
					{
						displayName: 'Binary Property',
						name: 'image',
						type: 'string',
						default: '',
						description: 'Binary property with image (overrides Image URL)',
					},
				],
			},
		],
		default: {},
		description: 'Link previews to create (unfurl). Each URL must be from the message the preview is created for.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['unfurl'],
			},
		},
	},
];
