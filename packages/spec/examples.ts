/**
 * Shared example data for n8n node, docs, skills, and CLI.
 *
 * This file provides high-level preset data that is NOT derivable from OpenAPI schemas:
 * form templates, validation rules, button presets, file upload examples.
 *
 * For automatic per-field examples (types, formats, heuristics), see:
 * apps/docs/lib/openapi/example-generator.ts
 */

export const EXAMPLES = {
  /** Button examples — used in docs, skills, n8n node (default values) */
  buttons: [
    {
      text: 'Approve',
      action_type: 'url' as const,
      url: 'https://example.com/approve',
    },
    {
      text: 'Reject',
      action_type: 'action' as const,
      action_name: 'reject_request',
    },
  ],

  /** Form templates — used in n8n node (preset forms), docs, skills */
  formTemplates: {
    timeoff_request: {
      name: 'Time Off Request',
      blocks: [
        {
          type: 'input',
          element: { type: 'datepicker', action_id: 'date_start' },
          label: { type: 'plain_text', text: 'Start date' },
        },
        {
          type: 'input',
          element: { type: 'datepicker', action_id: 'date_end' },
          label: { type: 'plain_text', text: 'End date' },
        },
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'reason' },
          label: { type: 'plain_text', text: 'Reason' },
          optional: true,
        },
      ],
      submit: { type: 'plain_text', text: 'Request' },
    },
    feedback_form: {
      name: 'Feedback Form',
      blocks: [
        {
          type: 'input',
          element: {
            type: 'radio',
            action_id: 'rating',
            options: [
              { text: { type: 'plain_text', text: '1 — Poor' }, value: '1' },
              { text: { type: 'plain_text', text: '2 — Fair' }, value: '2' },
              { text: { type: 'plain_text', text: '3 — Good' }, value: '3' },
              { text: { type: 'plain_text', text: '4 — Great' }, value: '4' },
              { text: { type: 'plain_text', text: '5 — Excellent' }, value: '5' },
            ],
          },
          label: { type: 'plain_text', text: 'Rating' },
        },
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'comment', multiline: true },
          label: { type: 'plain_text', text: 'Comment' },
          optional: true,
        },
      ],
      submit: { type: 'plain_text', text: 'Send' },
    },
    task_request: {
      name: 'Task Request',
      blocks: [
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'title' },
          label: { type: 'plain_text', text: 'Title' },
        },
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'description', multiline: true },
          label: { type: 'plain_text', text: 'Description' },
        },
      ],
      submit: { type: 'plain_text', text: 'Create' },
    },
    survey_form: {
      name: 'Employee Survey',
      blocks: [
        {
          type: 'input',
          element: {
            type: 'radio',
            action_id: 'satisfaction',
            options: [
              { text: { type: 'plain_text', text: '1' }, value: '1' },
              { text: { type: 'plain_text', text: '2' }, value: '2' },
              { text: { type: 'plain_text', text: '3' }, value: '3' },
              { text: { type: 'plain_text', text: '4' }, value: '4' },
              { text: { type: 'plain_text', text: '5' }, value: '5' },
            ],
          },
          label: { type: 'plain_text', text: 'Overall satisfaction (1-5)' },
        },
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'suggestions', multiline: true },
          label: { type: 'plain_text', text: 'Suggestions' },
          optional: true,
        },
      ],
      submit: { type: 'plain_text', text: 'Submit' },
    },
    access_request: {
      name: 'Access Request',
      blocks: [
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'resource' },
          label: { type: 'plain_text', text: 'Resource name' },
        },
        {
          type: 'input',
          element: { type: 'plain_text_input', action_id: 'justification', multiline: true },
          label: { type: 'plain_text', text: 'Justification' },
        },
      ],
      submit: { type: 'plain_text', text: 'Request access' },
    },
  },

  /** Client-side form validation rules — n8n node */
  formValidationRules: {
    timeoff_request: {
      date_end: {
        rule: 'after_field' as const,
        field: 'date_start',
        message: 'End date must be after start date',
      },
    },
    feedback_form: {
      comment: {
        rule: 'min_length' as const,
        value: 10,
        message: 'Comment must be at least 10 characters',
      },
    },
    task_request: {
      title: {
        rule: 'min_length' as const,
        value: 5,
        message: 'Title must be at least 5 characters',
      },
      description: {
        rule: 'min_length' as const,
        value: 20,
        message: 'Description must be at least 20 characters',
      },
    },
  },

  /** Upload response example — from POST /uploads */
  upload: {
    direct_url: 'https://s3.amazonaws.com/...',
    key: 'uploads/abc123/file.pdf',
  },

  /** Message with file attachments */
  messageWithFiles: {
    content: 'Here is the report',
    files: [{ key: 'uploads/abc123/file.pdf', name: 'report.pdf' }],
  },

  /** MIME types for file upload detection */
  mimeTypes: {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
  } as Record<string, string>,
} as const;
