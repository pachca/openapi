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
      'User profile, status management, custom fields, token verification. Use when: get own profile, set/reset status, check custom fields, verify token scopes.',
    triggers: [
      'получить профиль',
      'мой профиль',
      'установить статус',
      'обновить статус',
      'сбросить статус',
      'кастомные поля',
      'дополнительные поля',
      'проверить токен',
      'скоупы токена',
    ],
    negativeTriggers: ['управление сотрудниками', 'создать пользователя', 'список сотрудников'],
    nearestAlternatives: ['pachca-users'],
  },
  {
    name: 'pachca-users',
    tags: ['Users', 'Group tags'],
    description:
      'Employee and tag (group) management. Create, update, delete, search employees. Onboarding and offboarding. Tag management and employee status. Use when: find employee, create user, onboard/offboard, manage tags, set employee status.',
    triggers: [
      'найти сотрудника',
      'создать пользователя',
      'список сотрудников',
      'создать тег',
      'управлять тегами',
      'назначить тег',
      'приостановить сотрудника',
      'онбординг',
      'offboarding',
      'уволить сотрудника',
      'участники тега',
      'статус сотрудника',
      'установить статус сотруднику',
    ],
    negativeTriggers: ['мой профиль', 'мой статус'],
    nearestAlternatives: [
      {
        name: 'pachca-profile',
        text: 'получить профиль, мой профиль, установить свой статус',
      },
      'pachca-chats',
      {
        name: 'pachca-search',
        text: 'полнотекстовый поиск по сотрудникам с фильтрами и ранжированием',
      },
    ],
  },
  {
    name: 'pachca-chats',
    tags: ['Chats', 'Members'],
    description:
      'Channel and conversation management, chat members. Create, update, archive chats. Add/remove members, roles, message export. Use when: create channel, add member, archive chat, find active/inactive chats, export messages.',
    triggers: [
      'создать канал',
      'создать беседу',
      'создать чат',
      'добавить участника',
      'удалить участника',
      'архивировать чат',
      'роли участников',
      'экспорт сообщений',
      'список чатов',
      'активные чаты',
      'неактивные чаты',
    ],
    negativeTriggers: ['отправить сообщение', 'ответить в тред', 'загрузить файл'],
    nearestAlternatives: [
      'pachca-messages',
      'pachca-users',
      {
        name: 'pachca-search',
        text: 'полнотекстовый поиск чатов по названию с фильтрами',
      },
    ],
    guides: ['export'],
  },
  {
    name: 'pachca-messages',
    tags: ['Messages', 'Thread', 'Reactions', 'Read member'],
    description:
      'Send messages to channels, conversations, and DMs. Reply to threads, upload files, buttons, reactions, pin, read receipts. Use when: send message, reply to thread, attach file, add reaction, get chat history, pin message.',
    triggers: [
      'отправить сообщение',
      'ответить в тред',
      'прикрепить файл',
      'загрузить файл',
      'вложения сообщения',
      'добавить реакцию',
      'история сообщений',
      'закрепить сообщение',
      'редактировать сообщение',
      'удалить сообщение',
      'подписаться на тред',
      'разослать уведомление',
      'упомянуть пользователя',
      'кнопки',
      'прочтения',
      'личное сообщение',
    ],
    negativeTriggers: [
      'создать канал',
      'управлять участниками',
      'настроить бота',
      'вебхук',
      'форма',
    ],
    nearestAlternatives: [
      'pachca-chats',
      'pachca-bots',
      'pachca-forms',
      { name: 'pachca-search', text: 'найти сообщение по тексту, полнотекстовый поиск' },
    ],
  },
  {
    name: 'pachca-bots',
    tags: ['Bots', 'Link Previews'],
    description:
      'Bot management, incoming/outgoing webhooks, link unfurling. Use when: set up bot, handle webhook, handle button click, periodic digest, alerts, polling events, unfurl link.',
    triggers: [
      'настроить бота',
      'вебхук',
      'webhook',
      'обработать событие',
      'подпись вебхука',
      'нажатие кнопки',
      'callback',
      'дайджест',
      'алерт',
      'polling',
      'unfurl',
      'развернуть ссылку',
      'link preview',
    ],
    negativeTriggers: ['отправить сообщение', 'показать форму', 'интерактивная форма'],
    nearestAlternatives: ['pachca-messages', 'pachca-forms'],
    guides: ['webhook'],
  },
  {
    name: 'pachca-forms',
    tags: ['Views'],
    description:
      'Interactive forms with input fields and buttons for bots. Use when: show form, handle form submit, validate fields, create modal, employee survey.',
    triggers: [
      'показать форму',
      'интерактивная форма',
      'модальное окно',
      'modal',
      'submit формы',
      'обработать отправку формы',
      'валидация формы',
      'view_submission',
      'опрос',
      'заявка через форму',
    ],
    negativeTriggers: ['кнопки в сообщении', 'настроить бота', 'вебхук'],
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
      'Create, get, update, and delete tasks (reminders). Use when: create task, list tasks, update task, mark task done, delete task.',
    triggers: [
      'создать задачу',
      'список задач',
      'напоминание',
      'обновить задачу',
      'отметить задачу выполненной',
      'удалить задачу',
      'кастомные поля задачи',
    ],
    negativeTriggers: ['отправить сообщение', 'управлять чатом'],
  },
  {
    name: 'pachca-search',
    tags: ['Search'],
    description:
      'Full-text search across employees, chats, and messages. Use when: find message by text, find chat by name, find employee by name.',
    triggers: [
      'поиск сообщений',
      'найти сообщение',
      'полнотекстовый поиск',
      'search',
      'найти по тексту',
    ],
    negativeTriggers: ['список сотрудников', 'список чатов', 'отправить сообщение'],
    nearestAlternatives: ['pachca-users', 'pachca-chats'],
  },
  {
    name: 'pachca-security',
    tags: ['Security'],
    description:
      'Security audit event log. Use when: get audit log, review security events, monitor logins, export logs. Requires "Corporation" plan.',
    triggers: [
      'аудит',
      'журнал событий',
      'безопасность',
      'DLP',
      'логи',
      'подозрительные входы',
      'история входов',
      'мониторинг входов',
      'экспорт логов',
    ],
    negativeTriggers: ['отправить сообщение', 'управлять пользователями'],
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
    "Pachca — corporate messenger with REST API and CLI. Router skill: determines the right skill for the user's task. Use when user mentions Pachca, messenger, channels, messages, bots, tasks. Do NOT make API calls from this skill — route to the appropriate specialized skill.",
  triggers: [],
  negativeTriggers: [],
  isRouter: true,
};

export const TOP_OPERATIONS: { comment: string; command: string }[] = [
  {
    comment: 'Send message',
    command: 'pachca messages create --entity-id=<chat_id> --content="Hello"',
  },
  { comment: 'Search chats', command: 'pachca search list-chats --query="..."' },
  { comment: 'Get profile', command: 'pachca profile get' },
  { comment: 'Search messages', command: 'pachca search list-messages --query="..."' },
  {
    comment: 'Create chat',
    command: 'pachca chats create --name="Project X" --member-ids=1,2,3',
  },
];

export const COMMON_ENDPOINT_MAP: Record<string, string> = {
  '/custom_properties': 'pachca-profile',
  '/uploads': 'pachca-messages',
  '/direct_url': 'pachca-messages',
  '/chats/exports': 'pachca-chats',
  '/chats/exports/{id}': 'pachca-chats',
};
