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
      'Pachca — МОЙ профиль, МОЙ статус, МОЙ токен, кастомные поля. Всегда только про себя — без параметров, данные определяются по токену. Используй, когда пользователь хочет получить свой профиль, узнать кто он, установить или убрать свой статус, посмотреть свой email/отдел, проверить свой токен и его скоупы, или узнать какие кастомные/дополнительные поля существуют (custom_properties). Также для запросов «кто я», «мой аккаунт», «мой email». НЕ для управления другими сотрудниками, НЕ для изменения статуса другого сотрудника.',
    triggers: [
      'мой профиль',
      'покажи профиль',
      'мой статус',
      'установить статус',
      'убрать статус',
      'кто я',
      'мой email',
      'мои данные',
      'проверить токен',
      'дополнительные поля',
      'кастомные поля',
    ],
    negativeTriggers: [
      'сотрудники',
      'список сотрудников',
      'создать сотрудника',
      'статус сотрудника',
    ],
    nearestAlternatives: ['pachca-users'],
  },
  {
    name: 'pachca-users',
    tags: ['Users', 'Group tags'],
    description:
      'Pachca — управление сотрудниками (участниками пространства) и тегами (группами). Используй, когда пользователь хочет вывести список сотрудников, создать, обновить, заблокировать или удалить сотрудника, установить статус другому сотруднику по ID, управлять тегами/группами, назначить теги или провести онбординг/оффбординг. НЕ для своего профиля или своего статуса (используй pachca-profile), НЕ для поиска сотрудника по имени (используй pachca-search).',
    triggers: [
      'сотрудник',
      'сотрудники',
      'список сотрудников',
      'создать сотрудника',
      'заблокировать сотрудника',
      'уволить сотрудника',
      'тег',
      'теги',
      'группа сотрудников',
      'добавить в тег',
      'онбординг',
      'оффбординг',
    ],
    negativeTriggers: [
      'мой профиль',
      'мой статус',
      'найди сотрудника',
      'найти сотрудника',
      'кастомные поля',
      'дополнительные поля',
    ],
    nearestAlternatives: [
      {
        name: 'pachca-profile',
        text: 'получить профиль, мой профиль, установить свой статус',
      },
      'pachca-chats',
      {
        name: 'pachca-search',
        text: 'найти сообщение по тексту, полнотекстовый поиск',
      },
    ],
  },
  {
    name: 'pachca-chats',
    tags: ['Chats', 'Members'],
    description:
      'Pachca — управление чатами, каналами и беседами. Используй этот скилл, когда пользователь хочет создать канал, создать беседу, вывести или архивировать чаты, добавить или удалить участников, изменить роли участников, экспортировать историю чата или проверить настройки чата. НЕ для отправки сообщений или ответов в тред.',
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
      'каналы',
    ],
    negativeTriggers: ['отправить сообщение', 'ответить в тред', 'загрузить файл'],
    nearestAlternatives: [
      'pachca-messages',
      'pachca-users',
      {
        name: 'pachca-search',
        text: 'полнотекстовый поиск чатов по названию',
      },
    ],
    guides: ['export'],
  },
  {
    name: 'pachca-messages',
    tags: ['Messages', 'Threads', 'Reactions', 'Read members'],
    description:
      'Pachca — сообщения: отправка, редактирование, удаление. Используй этот скилл, когда пользователь хочет отправить сообщение, написать в чат или в личку, ответить в тред, прикрепить файл, поставить реакцию, закрепить сообщение, получить историю сообщений, изменить или удалить сообщение, узнать кто прочитал или отправить сообщение с кнопками. Также для упоминаний (@), уведомлений и подписки на тред. НЕ для создания каналов, управления участниками или настройки ботов.',
    triggers: [
      'отправить сообщение',
      'написать в чат',
      'написать в личку',
      'ответить в тред',
      'тред',
      'прикрепить файл',
      'загрузить файл',
      'поставить реакцию',
      'история сообщений',
      'закрепить сообщение',
      'изменить сообщение',
      'удалить сообщение',
      'упомянуть',
      'кнопки в сообщении',
      'кто прочитал',
      'ответь в тред',
    ],
    negativeTriggers: [
      'создать канал',
      'управление участниками',
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
      'Pachca — управление ботами, вебхуки и превью ссылок. Используй этот скилл, когда пользователь хочет настроить бота, создать бота, настроить вебхуки, обработать вебхук, проверить подпись вебхука (X-Signature), обработать callback нажатия кнопки, создать дайджест-бота или настроить превью ссылок. НЕ для отправки обычных сообщений, показа форм или модальных окон.',
    triggers: [
      'настроить бота',
      'создать бота',
      'вебхук',
      'обработать вебхук',
      'подпись вебхука',
      'callback',
      'обработать callback',
      'нажатие кнопки',
      'дайджест',
      'оповещение',
      'превью ссылки',
    ],
    negativeTriggers: ['отправить сообщение', 'показать форму', 'модальное окно'],
    nearestAlternatives: ['pachca-messages', 'pachca-forms'],
    guides: ['webhook'],
  },
  {
    name: 'pachca-forms',
    tags: ['Views'],
    description:
      'Pachca — интерактивные формы и модальные окна для ботов. Создание форм, модальных окон, опросов, анкет и заявок с полями ввода, выпадающими списками, чекбоксами, выбором даты/времени, загрузкой файлов. Используй, когда пользователь хочет показать форму, открыть модальное окно, создать опрос или анкету, обработать отправку формы (view_submission) или валидацию полей. Также для trigger_id и dropdown/select. Требует токен бота. НЕ для инлайн-кнопок в сообщениях или настройки вебхуков.',
    triggers: [
      'показать форму',
      'открыть форму',
      'собрать форму',
      'модальное окно',
      'модалка',
      'отправка формы',
      'обработать форму',
      'валидация формы',
      'валидация поля',
      'view_submission',
      'опрос',
      'анкета',
      'заявка',
      'форма заявки',
      'form',
      'modal',
      'interactive form',
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
      'Pachca — задачи и напоминания: создание, список, обновление, выполнение, удаление. Используй этот скилл, когда пользователь хочет создать задачу или напоминание, вывести список задач, отметить задачу как выполненную, обновить задачу, управлять дополнительными полями задач или установить дедлайн. Также для еженедельных напоминаний и серии напоминаний. НЕ для отправки сообщений или управления чатами.',
    triggers: [
      'создать задачу',
      'список задач',
      'напоминание',
      'поставить напоминание',
      'создать напоминание',
      'обновить задачу',
      'выполнить задачу',
      'удалить задачу',
      'дедлайн',
      'кастомные поля задач',
      'еженедельное напоминание',
      'серия напоминаний',
    ],
    negativeTriggers: ['отправить сообщение', 'управление чатом'],
  },
  {
    name: 'pachca-search',
    tags: ['Search'],
    description:
      'Pachca — полнотекстовый поиск по сотрудникам, чатам и сообщениям. Используй этот скилл, когда пользователь хочет найти что-то — найти сотрудника по имени, найти сообщение по тексту, найти чат по названию или узнать где обсуждали тему. Также когда пользователь спрашивает «найди сотрудника», «где обсуждали X», «найди сообщения про Y» или любой запрос с поиском/нахождением контента. НЕ для вывода всех сотрудников, всех чатов или отправки сообщений.',
    triggers: [
      'поиск',
      'найти сообщение',
      'найти чат',
      'найти сотрудника',
      'искать',
      'где обсуждали',
      'кто писал',
      'полнотекстовый поиск',
    ],
    negativeTriggers: ['список сотрудников', 'список чатов', 'отправить сообщение'],
    nearestAlternatives: ['pachca-users', 'pachca-chats'],
  },
  {
    name: 'pachca-security',
    tags: ['Security'],
    description:
      'Pachca — журнал безопасности: отслеживание входов, действий пользователей, изменений сообщений и нарушений DLP. Требуется тариф «Корпорация». Используй этот скилл, когда пользователь хочет посмотреть события безопасности, журнал аудита, историю входов, подозрительную активность, узнать кто что делал, экспортировать логи безопасности или отслеживать нарушения DLP. НЕ для отправки сообщений или управления сотрудниками.',
    triggers: [
      'журнал безопасности',
      'аудит',
      'события безопасности',
      'кто заходил',
      'история входов',
      'подозрительная активность',
      'DLP',
      'экспорт логов',
      'токены API',
    ],
    negativeTriggers: ['отправить сообщение', 'управление сотрудниками'],
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
    'Pachca — корпоративный мессенджер с REST API и CLI. Роутер: определяет нужный скилл для любой задачи, связанной с Pachca. Используй этот скилл, когда пользователь упоминает Pachca, хочет взаимодействовать с API Pachca или нуждается в помощи с любой операцией Pachca. Этот скилл маршрутизирует к нужному под-скиллу. НЕ делай API-вызовы напрямую — направь к нужному скиллу.',
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
