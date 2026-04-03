import type { INodeProperties } from 'n8n-workflow';

export const linkPreviewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['linkPreview'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a link preview',
			},
		],
		default: 'create',
	},
];

export const linkPreviewFields: INodeProperties[] = [
	{
		displayName: 'ID',
		name: 'id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['linkPreview'], operation: ['create'] } },
		description: 'Message ID',
	},
	{
		displayName: 'Link Previews',
		name: 'linkPreviews',
		type: 'json',
		required: true,
		default: {},
		description: 'JSON map of link previews, where each key is a `URL` received in the outgoing webhook about a new message',
		displayOptions: { show: { resource: ['linkPreview'], operation: ['create'] } },
		routing: { send: { type: 'body', property: 'link_previews' } },
	},
];