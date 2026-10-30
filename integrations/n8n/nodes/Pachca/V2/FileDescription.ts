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
			{
				name: 'Get',
				value: 'get',
				action: 'Get a file',
			},
		],
		default: 'get',
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
		displayOptions: { show: { resource: ['file'], operation: ['create'] } },
	},
	{
		displayName: 'File URL',
		name: 'fileUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'URL of the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['create'], fileSource: ['url'] } },
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryProperty',
		type: 'string',
		required: true,
		default: 'data',
		hint: 'The name of the input binary field containing the file to be uploaded',
		displayOptions: { show: { resource: ['file'], operation: ['create'], fileSource: ['binary'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['file'], operation: ['create'] } },
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
	{
		displayName: 'ID',
		name: 'id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['file'], operation: ['get'] } },
		description: 'File ID from the attachment\'s ID field',
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of all fields',
		displayOptions: { show: { resource: ['file'], operation: ['get'] } },
	},
	{
		displayName: 'Target',
		name: 'target',
		type: 'options',
		options: [{ name: 'Image', value: 'image', description: 'The image as it is' },
{ name: 'Pdf First Page', value: 'pdf_first_page', description: 'The first page of the document as an image' },
{ name: 'Pdf Preview', value: 'pdf_preview', description: 'The document converted to PDF' },
{ name: 'Thumb', value: 'thumb', description: 'A scaled-down copy of the image' }],
		default: "",
		description: 'What to return instead of the original file: `pdf_preview` — the document converted to PDF, `pdf_first_page` — the first page as an image, `thumb` — a scaled-down copy of the image, `image` — the image as it is. Without the parameter the original file comes. A variant this file does not have leads to `400`.',
		displayOptions: { show: { resource: ['file'], operation: ['get'] } },
	},
];