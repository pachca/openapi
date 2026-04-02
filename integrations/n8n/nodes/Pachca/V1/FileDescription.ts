// ============================================================================
// FileDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Upload a file',
				value: 'upload',
				action: 'Upload a file',
				description: 'Upload file (full flow: get params + upload)',
			},
		],
		default: 'upload',
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
	},
];

export const fileFields: INodeProperties[] = [
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		options: [
			{
				name: 'URL',
				value: 'url',
				description: 'Download file from URL',
			},
			{
				name: 'Binary Data',
				value: 'binary',
				description: 'Use binary data from previous node',
			},
		],
		default: 'url',
		description: 'File source for upload',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
			},
		},
	},
	{
		displayName: 'File URL',
		name: 'fileUrl',
		type: 'string',
		default: '',
		description: 'File URL to download and upload to Pachca',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				fileSource: ['url'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		default: 'data',
		description: 'Binary property name from previous node',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				fileSource: ['binary'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		description: 'File name (if not set, taken from URL or binary data)',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
			},
		},
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'string',
		default: 'application/octet-stream',
		description: 'File MIME type (auto-detected if not set)',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
			},
		},
	},
];
