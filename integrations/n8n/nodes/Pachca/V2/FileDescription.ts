import type { INodeProperties } from 'n8n-workflow';

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['file'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a file',
			},
		],
		default: 'create',
	},
];

export const fileFields: INodeProperties[] = [
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		options: [
			{ name: 'Binary Data', value: 'binary' },
			{ name: 'URL', value: 'url' },
		],
		default: 'binary',
		description: 'Where to get the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['create', 'upload'] } },
	},
	{
		displayName: 'File URL',
		name: 'fileUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'URL of the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['create', 'upload'], fileSource: ['url'] } },
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryProperty',
		type: 'string',
		required: true,
		default: 'data',
		hint: 'The name of the input binary field containing the file to be uploaded',
		displayOptions: { show: { resource: ['file'], operation: ['create', 'upload'], fileSource: ['binary'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['file'], operation: ['create', 'upload'] } },
		options: [
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'string',
				default: '',
				description: 'MIME type of the file (e.g. image/png). If not set, auto-detected from file extension.',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				description: 'Name of the file. If not set, auto-detected from source.',
			},
		],
	},
];