import type { INodeProperties } from 'n8n-workflow';

export const profileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['profile'] } },
		options: [
			{
				name: 'Delete Status',
				value: 'deleteStatus',
				action: 'Delete profile status',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a profile',
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				action: 'Get profile info',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				action: 'Get profile status',
			},
			{
				name: 'Update Status',
				value: 'updateStatus',
				action: 'Update profile status',
			},
		],
		default: 'getInfo',
	},
];

export const profileFields: INodeProperties[] = [
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['profile'], operation: ['getInfo'] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['profile'], operation: ['get'] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['profile'], operation: ['getStatus'] } },
	},
	{
		displayName: 'Emoji',
		name: 'statusEmoji',
		type: 'string',
		required: true,
		default: "",
		description: 'Status emoji character',
		displayOptions: { show: { resource: ['profile'], operation: ['updateStatus'] } },
		placeholder: '🎮',
		routing: { send: { type: 'body', property: 'emoji' } },
	},
	{
		displayName: 'Title',
		name: 'statusTitle',
		type: 'string',
		required: true,
		default: "",
		description: 'Status text',
		displayOptions: { show: { resource: ['profile'], operation: ['updateStatus'] } },
		placeholder: 'Very busy',
		routing: { send: { type: 'body', property: 'title' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['profile'], operation: ['updateStatus'] } },
		options: [
			{
				displayName: 'Away Message',
				name: 'awayMessage',
				type: 'string',
				default: "",
				description: 'Away mode message text. Displayed in the profile and in direct messages/mentions.',
				placeholder: 'Back after 3 PM',
				routing: { send: { type: 'body', property: 'away_message' } },
			},
			{
				displayName: 'Expires At',
				name: 'statusExpiresAt',
				type: 'dateTime',
				default: "",
				description: 'Status expiration date and time (ISO-8601, UTC+0) in YYYY-MM-DDThh:mm:ss.sssZ format',
				placeholder: '2024-04-08T10:00:00.000Z',
				routing: { send: { type: 'body', property: 'expires_at' } },
			},
			{
				displayName: 'Is Away',
				name: 'isAway',
				type: 'boolean',
				default: false,
				description: 'Whether to "Away" mode',
				routing: { send: { type: 'body', property: 'is_away' } },
			},
		],
	},
];