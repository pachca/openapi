export interface SkillError {
  code: number | string;
  reason: string;
  action: string;
}

export interface SkillConfig {
  name: string;
  tags: string[];
  description: string;
  triggers: string[];
  negativeTriggers: string[];
  nearestAlternatives?: (string | { name: string; text: string })[];
  guides?: string[];
  errors?: SkillError[];
  botOnly?: boolean;
  extraSections?: { title: string; content: string }[];
  extraGotchas?: string[];
  extraEndpointContent?: string;
  isRouter?: boolean;
}

export const SKILL_TAG_MAP: SkillConfig[] = [
  {
    name: 'pachca-profile',
    tags: ['Profile'],
    description:
      'Pachca user profile, status management, custom fields, and token verification. Use this skill whenever the user wants to get their profile, check who they are, set or update their status, manage custom fields, or verify API token scopes. Also use for any "who am I" or "my account" queries. NOT for managing other employees or listing users.',
    triggers: [
      'get profile',
      'my profile',
      'set status',
      'update status',
      'clear status',
      'custom fields',
      'additional fields',
      'verify token',
      'token scopes',
    ],
    negativeTriggers: ['manage employees', 'create user', 'list employees'],
    nearestAlternatives: ['pachca-users'],
  },
  {
    name: 'pachca-users',
    tags: ['Users', 'Group tags'],
    description:
      'Pachca employee and tag (group) management. Use this skill whenever the user wants to list, create, update, suspend, or delete employees, manage tags/groups, assign tags to users, or handle onboarding/offboarding. Also use for finding specific employees by name, checking employee details, or managing team structure. NOT for viewing your own profile or status.',
    triggers: [
      'find employee',
      'create user',
      'list employees',
      'create tag',
      'manage tags',
      'assign tag',
      'suspend employee',
      'onboarding',
      'offboarding',
      'terminate employee',
      'tag members',
      'employee status',
      'set employee status',
    ],
    negativeTriggers: ['my profile', 'my status'],
    nearestAlternatives: [
      {
        name: 'pachca-profile',
        text: 'get profile, my profile, set own status',
      },
      'pachca-chats',
      {
        name: 'pachca-search',
        text: 'full-text search for employees with filters and ranking',
      },
    ],
  },
  {
    name: 'pachca-chats',
    tags: ['Chats', 'Members'],
    description:
      'Pachca chat, channel, and conversation management. Use this skill whenever the user wants to create, list, archive, or manage channels and group conversations, add or remove members, change member roles, export chat history, or check chat details. Also use for anything about chat settings, member management, or conversation structure. NOT for sending messages or replying to threads.',
    triggers: [
      'create channel',
      'create conversation',
      'create chat',
      'add member',
      'remove member',
      'archive chat',
      'member roles',
      'export messages',
      'list chats',
      'active chats',
      'inactive chats',
    ],
    negativeTriggers: ['send message', 'reply to thread', 'upload file'],
    nearestAlternatives: [
      'pachca-messages',
      'pachca-users',
      {
        name: 'pachca-search',
        text: 'full-text search for chats by name with filters',
      },
    ],
    guides: ['export'],
  },
  {
    name: 'pachca-messages',
    tags: ['Messages', 'Threads', 'Reactions', 'Read members'],
    description:
      'Pachca messaging — send, edit, delete, and manage messages. Use this skill whenever the user wants to send a message to a chat/channel/DM, reply to a thread, attach files, upload files, add reactions, pin messages, get message history, edit or delete messages, check who read a message, or send messages with inline buttons. Also use for any message-related operations including mentions, notifications, and thread subscriptions. NOT for creating channels, managing members, or configuring bots.',
    triggers: [
      'send message',
      'reply to thread',
      'attach file',
      'upload file',
      'message attachments',
      'add reaction',
      'message history',
      'pin message',
      'edit message',
      'delete message',
      'subscribe to thread',
      'send notification',
      'mention user',
      'buttons',
      'read receipts',
      'direct message',
    ],
    negativeTriggers: ['create channel', 'manage members', 'configure bot', 'webhook', 'form'],
    nearestAlternatives: [
      'pachca-chats',
      'pachca-bots',
      'pachca-forms',
      { name: 'pachca-search', text: 'find message by text, full-text search' },
    ],
  },
  {
    name: 'pachca-bots',
    tags: ['Bots', 'Link Previews'],
    description:
      'Pachca bot management, webhooks, and link unfurling. Use this skill whenever the user wants to set up a bot, configure incoming or outgoing webhooks, handle webhook events, verify webhook signatures, process button callbacks, build digest/alert bots, poll message history, or set up link previews (unfurling). Also use for any bot-related automation, event handling, or webhook integration. NOT for sending regular messages, showing interactive forms, or form submissions.',
    triggers: [
      'configure bot',
      'webhook',
      'handle event',
      'webhook signature',
      'button click',
      'callback',
      'digest',
      'alert',
      'polling',
      'unfurl',
      'link preview',
    ],
    negativeTriggers: ['send message', 'show form', 'interactive form'],
    nearestAlternatives: ['pachca-messages', 'pachca-forms'],
    guides: ['webhook'],
  },
  {
    name: 'pachca-forms',
    tags: ['Views'],
    description:
      'Pachca interactive forms (modals) for bots — input fields, selects, checkboxes, date/time pickers, file uploads. Use this skill whenever the user wants to show a form/modal to a user, handle form submissions (view_submission), validate form data, build surveys or application forms, or create any interactive UI that collects user input. Requires bot token. Also use for anything involving trigger_id, form blocks, or modal dialogs. NOT for inline buttons in messages or webhook configuration.',
    triggers: [
      'show form',
      'interactive form',
      'modal dialog',
      'modal',
      'form submit',
      'handle form submission',
      'form validation',
      'view_submission',
      'survey',
      'application form',
    ],
    negativeTriggers: ['inline buttons', 'configure bot', 'webhook'],
    nearestAlternatives: ['pachca-messages', 'pachca-bots'],
    guides: ['forms'],
    botOnly: true,
    errors: [
      {
        code: 410,
        reason: 'trigger_id expired or not found',
        action: 'trigger_id is valid for 3 seconds. Get a new one via button click (webhook)',
      },
    ],
    extraEndpointContent: `## Form block types

### input — Text field

- \`name\` (string, **required**): Field name (key in \`data\` on submit)
- \`label\` (string, **required**): Field label
- \`placeholder\` (string, optional): Placeholder text
- \`multiline\` (boolean, optional): Multiline input
- \`initial_value\` (string, optional): Initial value
- \`min_length\` (integer, optional): Minimum length
- \`max_length\` (integer, optional): Maximum length
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint below the field

### select — Dropdown list

- \`name\` (string, **required**): Field name
- \`label\` (string, **required**): Label
- \`options\` (array, **required**): Array of options
  - \`text\` (string, **required**): Option text
  - \`value\` (string, **required**): Value
  - \`description\` (string, optional): Option description
  - \`selected\` (boolean, optional): Selected by default
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint

### radio — Radio buttons

- \`name\` (string, **required**): Field name
- \`label\` (string, **required**): Label
- \`options\` (array, **required**): Array of options (same as \`select\`)
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint

### checkbox — Checkboxes

- \`name\` (string, **required**): Field name
- \`label\` (string, **required**): Label
- \`options\` (array, **required**): Array of options
  - \`text\` (string, **required**): Option text
  - \`value\` (string, **required**): Value
  - \`description\` (string, optional): Description
  - \`checked\` (boolean, optional): Checked by default
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint

### date — Date picker

- \`name\` (string, **required**): Field name
- \`label\` (string, **required**): Label
- \`initial_date\` (string, optional): Initial date (YYYY-MM-DD)
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint

### time — Time picker

- \`name\` (string, **required**): Field name
- \`label\` (string, **required**): Label
- \`initial_time\` (string, optional): Initial time (HH:MM)
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint

### file_input — File upload

- \`name\` (string, **required**): Field name
- \`label\` (string, **required**): Label
- \`filetypes\` (array[string], optional): Allowed extensions (["pdf", "jpg", "png"])
- \`max_files\` (integer, optional): Maximum number of files
- \`required\` (boolean, optional): Required field
- \`hint\` (string, optional): Hint

> Uploaded file URLs in \`data.field_name[].url\` from submit webhook expire after 1 hour — download immediately.

### header — Section header

- \`text\` (string, **required**): Header text

### plain_text — Plain text

- \`text\` (string, **required**): Text

### markdown — Formatted text

- \`text\` (string, **required**): Text with markdown (supports links, bold, italic)

### divider — Divider

Visual horizontal line. No parameters.`,
  },
  {
    name: 'pachca-tasks',
    tags: ['Tasks'],
    description:
      'Pachca task and reminder management — create, list, update, complete, and delete tasks. Use this skill whenever the user wants to create a task or reminder, list existing tasks, mark a task as done, update task details, manage custom fields on tasks, or set due dates. Also use for any to-do, reminder, or task tracking needs. NOT for sending messages or managing chats.',
    triggers: [
      'create task',
      'list tasks',
      'reminder',
      'update task',
      'mark task as done',
      'delete task',
      'task custom fields',
    ],
    negativeTriggers: ['send message', 'manage chat'],
  },
  {
    name: 'pachca-search',
    tags: ['Search'],
    description:
      'Pachca full-text search across employees, chats, and messages. Use this skill whenever the user wants to search or find something — search messages by text, find a chat by name, look up employees, or locate discussions about a topic. Also use when the user asks "where was X discussed", "find messages about Y", or any query that involves searching/finding content. NOT for listing all employees, listing all chats, or sending messages.',
    triggers: ['search messages', 'find message', 'full-text search', 'search', 'find by text'],
    negativeTriggers: ['list employees', 'list chats', 'send message'],
    nearestAlternatives: ['pachca-users', 'pachca-chats'],
  },
  {
    name: 'pachca-security',
    tags: ['Security'],
    description:
      'Pachca security audit log — track login events, user actions, message changes, and DLP violations. Requires "Corporation" plan. Use this skill whenever the user wants to view security events, audit logs, login history, suspicious activity, track who did what, export security logs, or monitor for DLP violations. Also use for any compliance, auditing, or security monitoring needs. NOT for sending messages or managing users.',
    triggers: [
      'audit',
      'event log',
      'security',
      'DLP',
      'logs',
      'suspicious logins',
      'login history',
      'login monitoring',
      'export logs',
    ],
    negativeTriggers: ['send message', 'manage users'],
    guides: ['dlp', 'audit-events'],
    extraSections: [
      {
        title: 'Available event_key values',
        content: `| Category | Keys |
|----------|------|
| Auth | \`user_login\`, \`user_logout\`, \`user_2fa_fail\`, \`user_2fa_success\` |
| Employees | \`user_created\`, \`user_deleted\`, \`user_role_changed\`, \`user_updated\` |
| Tags | \`tag_created\`, \`tag_deleted\`, \`user_added_to_tag\`, \`user_removed_from_tag\` |
| Chats | \`chat_created\`, \`chat_renamed\`, \`chat_permission_changed\` |
| Chat members | \`user_chat_join\`, \`user_chat_leave\`, \`tag_added_to_chat\`, \`tag_removed_from_chat\` |
| Messages | \`message_created\`, \`message_updated\`, \`message_deleted\` |
| Reactions and threads | \`reaction_created\`, \`reaction_deleted\`, \`thread_created\` |
| Tokens | \`access_token_created\`, \`access_token_updated\`, \`access_token_destroy\` |
| Encryption | \`kms_encrypt\`, \`kms_decrypt\` |
| Security | \`audit_events_accessed\`, \`dlp_violation_detected\` |
| Search (API) | \`search_users_api\`, \`search_chats_api\`, \`search_messages_api\` |`,
      },
    ],
    extraGotchas: ['`start_time` and `end_time` are required parameters (ISO-8601, UTC+0)'],
  },
];

export const ROUTER_SKILL_CONFIG: SkillConfig = {
  name: 'pachca',
  tags: [],
  description:
    'Pachca — corporate messenger with REST API and CLI. Router: determines the right skill for any Pachca-related task. Use this skill whenever the user mentions Pachca, wants to interact with Pachca API, or needs help with any Pachca operation. This skill routes to the appropriate sub-skill. Do NOT make API calls directly — route to the correct skill.',
  triggers: [],
  negativeTriggers: [],
  isRouter: true,
};

export const TOP_OPERATIONS: { comment: string; command: string }[] = [
  {
    comment: 'Send a message',
    command: 'pachca messages create --entity-id=<chat_id> --content="Hello"',
  },
  { comment: 'Search chats', command: 'pachca search list-chats --query="..."' },
  { comment: 'My profile', command: 'pachca profile get' },
  { comment: 'Search messages', command: 'pachca search list-messages --query="..."' },
  {
    comment: 'Create a chat',
    command: 'pachca chats create --name="Project" --member-ids=1,2,3',
  },
];

export const COMMON_ENDPOINT_MAP: Record<string, string> = {
  '/custom_properties': 'pachca-profile',
  '/uploads': 'pachca-messages',
  '/direct_url': 'pachca-messages',
  '/chats/exports': 'pachca-chats',
  '/chats/exports/{id}': 'pachca-chats',
};
