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
		displayName: 'ID',
		name: 'id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['file'], operation: ['get'] } },
		description: 'File ID as it comes in the attachment object',
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