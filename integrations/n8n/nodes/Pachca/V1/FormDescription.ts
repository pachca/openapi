// ============================================================================
// FormDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// Saved workflows depend on it: keep every name, option value, default, nesting
// and displayOptions. Labels, descriptions, order and UI hints follow the n8n linter.
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
				name: 'Create a Form',
				value: 'createView',
				action: 'Create a form',
				description: 'Create and open modal with form',
			},
			{
				name: 'Process Form Submission',
				value: 'processSubmission',
				action: 'Process form submission',
				description: 'Handle form submit and send response',
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
		default: 'builder',
		description: 'Form creation method',
		displayOptions: {
			show: {
				resource: ['form'],
				operation: ['createView'],
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
								name: 'Checkboxes',
								value: 'checkbox',
							},
							{
								name: 'Date Picker',
								value: 'date',
							},
							{
								name: 'Divider',
								value: 'divider',
							},
							{
								name: 'File Upload',
								value: 'file_input',
							},
							{
								name: 'Header',
								value: 'header',
								description: 'Section header',
							},
							{
								name: 'Markdown Text',
								value: 'markdown',
								description: 'Formatted text',
							},
							{
								name: 'Plain Text',
								value: 'plain_text',
							},
							{
								name: 'Radio Buttons',
								value: 'radio',
							},
							{
								name: 'Select Dropdown',
								value: 'select',
								description: 'Dropdown',
							},
							{
								name: 'Text Input',
								value: 'input',
							},
							{
								name: 'Time Picker',
								value: 'time',
							},
						],
						default: 'header',
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
						displayName: 'Multiline',
						name: 'multiline',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								type: ['input'],
							},
						},
						description: 'Whether the text input takes several lines',
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
										displayName: 'Checked',
										name: 'checked',
										type: 'boolean',
										default: false,
										description: 'Whether the option is checked by default (checkbox)',
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
										description: 'Whether the option is selected by default (select/radio)',
									},
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
								],
							},
						],
						description: 'Choice options',
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
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'],
							},
						},
						description: 'Whether the field must be filled in',
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
		description: 'JSON structure for custom form. Use blocks: header, plain_text, markdown, divider, input, select, radio, checkbox, date, time, file_input.',
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
				name: '🤖 Auto-Detect (Recommended)',
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
