// ============================================================================
// FormDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const formOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Create a form',
				value: 'createView',
				action: 'Create a form',
				description: 'Create and open modal with form',
			},
			{
				name: 'Process form submission',
				value: 'processSubmission',
				action: 'Process form submission',
				description: 'Handle form submit and send response',
			},
			{
				name: 'Get form templates',
				value: 'getTemplates',
				action: 'Get form templates',
				description: 'Get list of available form templates',
			},
		],
		default: 'createView',
		displayOptions: {
			show: {
				resource: ['form'],
			},
		},
	},
];

export const formFields: INodeProperties[] = [
	{
		displayName: 'Form Builder Mode',
		name: 'formBuilderMode',
		type: 'options',
		options: [
			{
				name: '📋 Use Template',
				value: 'template',
				description: 'Use preset template',
			},
			{
				name: '🎨 Visual Builder',
				value: 'builder',
				description: 'Visual form builder',
			},
			{
				name: '🔧 Raw JSON',
				value: 'json',
				description: 'Edit JSON directly',
			},
		],
		default: 'template',
		description: 'Form creation method',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
			},
		},
	},
	{
		displayName: 'Form Template',
		name: 'formTemplate',
		type: 'options',
		options: [
			{
				name: '📋 Timeoff Request',
				value: 'timeoff_request',
				description: 'Time-off request form',
			},
			{
				name: '💬 Feedback Form',
				value: 'feedback_form',
				description: 'Feedback form',
			},
			{
				name: '📝 Task Request',
				value: 'task_request',
				description: 'Task creation form',
			},
			{
				name: '📊 Survey Form',
				value: 'survey_form',
				description: 'Survey form',
			},
			{
				name: '🔐 Access Request',
				value: 'access_request',
				description: 'Access request form',
			},
		],
		default: 'timeoff_request',
		description: 'Select form template',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
				formBuilderMode: ['template'],
			},
		},
	},
	{
		displayName: 'Form Title',
		name: 'formTitle',
		type: 'string',
		default: 'My form',
		description: 'Form title (max 24 characters)',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
				formBuilderMode: ['builder'],
			},
		},
	},
	{
		displayName: 'Close Button Text',
		name: 'closeText',
		type: 'string',
		default: 'Cancel',
		description: 'Close button text (max 24 characters)',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
				formBuilderMode: ['builder'],
			},
		},
	},
	{
		displayName: 'Submit Button Text',
		name: 'submitText',
		type: 'string',
		default: 'Submit',
		description: 'Submit button text (max 24 characters)',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
				formBuilderMode: ['builder'],
			},
		},
	},
	{
		displayName: 'Form Blocks',
		name: 'formBlocks',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		options: [
			{
				name: 'block',
				displayName: 'Block',
				values: [
					{
						displayName: 'Block Type',
						name: 'type',
						type: 'options',
						options: [
							{
								name: '📝 Header',
								value: 'header',
								description: 'Section header',
							},
							{
								name: '📄 Plain Text',
								value: 'plain_text',
								description: 'Plain text',
							},
							{
								name: '📝 Markdown Text',
								value: 'markdown',
								description: 'Formatted text',
							},
							{
								name: '➖ Divider',
								value: 'divider',
								description: 'Divider',
							},
							{
								name: '📝 Text Input',
								value: 'input',
								description: 'Text input',
							},
							{
								name: '📋 Select Dropdown',
								value: 'select',
								description: 'Dropdown',
							},
							{
								name: '🔘 Radio Buttons',
								value: 'radio',
								description: 'Radio buttons',
							},
							{
								name: '☑️ Checkboxes',
								value: 'checkbox',
								description: 'Checkboxes',
							},
							{
								name: '📅 Date Picker',
								value: 'date',
								description: 'Date picker',
							},
							{
								name: '🕐 Time Picker',
								value: 'time',
								description: 'Time picker',
							},
							{
								name: '📎 File Upload',
								value: 'file_input',
								description: 'File upload',
							},
						],
						default: 'header',
					},
					{
						displayName: 'Text Content',
						name: 'text',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['header', 'plain_text', 'markdown'],
							},
						},
						description: 'Display text',
					},
					{
						displayName: 'Field Name',
						name: 'name',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'],
							},
						},
						description: 'Field name (sent in webhook)',
					},
					{
						displayName: 'Field Label',
						name: 'label',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'],
							},
						},
						description: 'Field label',
					},
					{
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'],
							},
						},
						description: 'Required field',
					},
					{
						displayName: 'Hint',
						name: 'hint',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'],
							},
						},
						description: 'Hint below field',
					},
					{
						displayName: 'Placeholder',
						name: 'placeholder',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['input'],
							},
						},
						description: 'Placeholder text',
					},
					{
						displayName: 'Multiline',
						name: 'multiline',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								type: ['input'],
							},
						},
						description: 'Multiline field',
					},
					{
						displayName: 'Initial Value',
						name: 'initial_value',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['input'],
							},
						},
						description: 'Default value',
					},
					{
						displayName: 'Min Length',
						name: 'min_length',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								type: ['input'],
							},
						},
						description: 'Min text length',
					},
					{
						displayName: 'Max Length',
						name: 'max_length',
						type: 'number',
						default: 3000,
						displayOptions: {
							show: {
								type: ['input'],
							},
						},
						description: 'Max text length',
					},
					{
						displayName: 'Options',
						name: 'options',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: [],
						displayOptions: {
							show: {
								type: ['select', 'radio', 'checkbox'],
							},
						},
						options: [
							{
								name: 'option',
								displayName: 'Option',
								values: [
									{
										displayName: 'Text',
										name: 'text',
										type: 'string',
										default: '',
										description: 'Display text',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Value to submit',
									},
									{
										displayName: 'Description',
										name: 'description',
										type: 'string',
										default: '',
										description: 'Option description (radio/checkbox)',
									},
									{
										displayName: 'Selected',
										name: 'selected',
										type: 'boolean',
										default: false,
										description: 'Selected by default (select/radio)',
									},
									{
										displayName: 'Checked',
										name: 'checked',
										type: 'boolean',
										default: false,
										description: 'Checked by default (checkbox)',
									},
								],
							},
						],
						description: 'Choice options',
					},
					{
						displayName: 'Initial Date',
						name: 'initial_date',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['date'],
							},
						},
						description: 'Initial date (YYYY-MM-DD)',
					},
					{
						displayName: 'Initial Time',
						name: 'initial_time',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['time'],
							},
						},
						description: 'Initial time (HH:mm)',
					},
					{
						displayName: 'File Types',
						name: 'filetypes',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['file_input'],
							},
						},
						description: 'Allowed file types (comma-separated, e.g. pdf,jpg,png)',
					},
					{
						displayName: 'Max Files',
						name: 'max_files',
						type: 'number',
						default: 10,
						displayOptions: {
							show: {
								type: ['file_input'],
							},
						},
						description: 'Max number of files',
					},
				],
			},
		],
		default: [],
		description: 'Form blocks - add elements to build the form',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
				formBuilderMode: ['builder'],
			},
		},
	},
	{
		displayName: 'Custom Form JSON',
		name: 'customFormJson',
		type: 'json',
		default: '{\n  "title": "My form",\n  "close_text": "Cancel",\n  "submit_text": "Submit",\n  "blocks": [\n    {\n      "type": "header",\n      "text": "Form title"\n    },\n    {\n      "type": "input",\n      "name": "field1",\n      "label": "Input field",\n      "placeholder": "Enter text",\n      "required": true\n    },\n    {\n      "type": "select",\n      "name": "choice",\n      "label": "Choose option",\n      "options": [\n        {"text": "Option 1", "value": "option1", "selected": true},\n        {"text": "Option 2", "value": "option2"}\n      ],\n      "required": true\n    }\n  ]\n}',
		description: 'JSON structure for custom form. Use blocks: header, plain_text, markdown, divider, input, select, radio, checkbox, date, time, file_input',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
				formBuilderMode: ['json'],
			},
		},
	},
	{
		displayName: 'Trigger ID',
		name: 'triggerId',
		type: 'string',
		default: '',
		description: 'Unique event ID (from button webhook)',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
			},
		},
	},
	{
		displayName: 'Private Metadata',
		name: 'privateMetadata',
		type: 'string',
		default: '',
		description: 'Extra data to send on form submit (JSON string)',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
			},
		},
	},
	{
		displayName: 'Callback ID',
		name: 'callbackId',
		type: 'string',
		default: '',
		description: 'Form identifier for matching submitted results',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
			},
		},
	},
	{
		displayName: 'Form Type',
		name: 'formType',
		type: 'options',
		options: [
			{
				name: '🤖 Auto-detect (recommended)',
				value: 'auto',
			},
			{
				name: '📋 Timeoff Request',
				value: 'timeoff_request',
			},
			{
				name: '💬 Feedback Form',
				value: 'feedback_form',
			},
			{
				name: '📝 Task Request',
				value: 'task_request',
			},
		],
		default: 'auto',
		description: 'Form type for processing data',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['processSubmission'],
			},
		},
	},
	{
		displayName: 'Validation Errors',
		name: 'validationErrors',
		type: 'json',
		default: '{}',
		description: 'Validation errors to send to user (JSON object with field names and messages)',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['processSubmission'],
			},
		},
	},
];
