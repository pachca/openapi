import type { INodeProperties } from 'n8n-workflow';

export const companyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['company'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a workspace',
			},
			{
				name: 'Get Invite Link',
				value: 'getInviteLink',
				action: 'Get the workspace invite link',
			},
			{
				name: 'Reissue Invite Link',
				value: 'reissueInviteLink',
				action: 'Reissue the workspace invite link',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a workspace',
			},
		],
		default: 'get',
	},
];

export const companyFields: INodeProperties[] = [
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['company'], operation: ['get'] } },
	},
	{
		displayName: 'Requires admin permissions',
		name: 'companyUpdateNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['company'], operation: ['update'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['company'], operation: ['update'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: "",
				description: 'New workspace name',
				placeholder: 'Blue warehouse',
			},
			{
				displayName: 'Show Personal Data',
				name: 'showPersonalData',
				type: 'boolean',
				default: false,
				description: 'Whether employees and bots see the `email` and `phone_number` of their colleagues',
			},
			{
				displayName: 'Use Global Threads',
				name: 'useGlobalThreads',
				type: 'boolean',
				default: false,
				description: 'Whether the "Use cross-chat threads" setting is on',
			},
		],
	},
	{
		displayName: 'Requires admin permissions',
		name: 'companyGetInviteLinkNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['company'], operation: ['getInviteLink'] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['company'], operation: ['getInviteLink'] } },
	},
	{
		displayName: 'Requires admin permissions',
		name: 'companyReissueInviteLinkNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['company'], operation: ['reissueInviteLink'] } },
	},
];