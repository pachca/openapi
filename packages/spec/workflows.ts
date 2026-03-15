export interface WorkflowStep {
  description: string;
  descriptionEn?: string;
  command?: string;
  apiMethod?: string;
  apiPath?: string;
  notes?: string;
  notesEn?: string;
}

export interface Workflow {
  title: string;
  titleEn?: string;
  steps: WorkflowStep[];
  notes?: string;
  notesEn?: string;

  related?: string[];
  relatedEn?: string[];
  inline?: boolean;
}

export const WORKFLOWS: Record<string, Workflow[]> = {
  'pachca-messages': [
    {
      title: 'Найти чат по имени и отправить сообщение',
      titleEn: 'Find chat by name and send message',
      steps: [
        {
          description: 'Найди чат по названию через поиск',
          descriptionEn: 'Find chat by name via search',
          command: 'pachca search list-chats --query="название"',
          apiMethod: 'GET',
          apiPath: '/search/chats',
          notes: 'Если результатов несколько — выбери наиболее подходящий по `name`',
          notesEn: 'If multiple results — pick the best match by `name`',
        },
        {
          description: 'Отправь сообщение в найденный чат',
          descriptionEn: 'Send message to the found chat',
          command: 'pachca messages create --entity-id=<chat_id> --content="Текст сообщения"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes: '`entity_type` по умолчанию `"discussion"`, можно не указывать.',
      notesEn: '`entity_type` defaults to `"discussion"`, can be omitted.',
      related: [
        'Отправить личное сообщение пользователю',
        'Найти чат по названию',
        'Отправить сообщение с файлами',
      ],
      relatedEn: ['Send direct message to user', 'Find chat by name', 'Send message with files'],
    },
    {
      title: 'Отправить сообщение в канал или беседу (если chat_id известен)',
      titleEn: 'Send message to channel or conversation (if chat_id is known)',
      steps: [
        {
          description: 'Отправь сообщение в чат',
          descriptionEn: 'Send message to chat',
          command: 'pachca messages create --entity-id=<chat_id> --content="Текст сообщения"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes: '`"entity_type": "discussion"` используется по умолчанию, можно не указывать',
      notesEn: '`"entity_type": "discussion"` is used by default, can be omitted',
      related: [
        'Отправить сообщение с файлами',
        'Отправить сообщение с кнопками',
        'Ответить в тред (комментарий к сообщению)',
      ],
      relatedEn: ['Send message with files', 'Send message with buttons', 'Reply to thread'],
    },
    {
      title: 'Отправить личное сообщение пользователю',
      titleEn: 'Send direct message to user',
      steps: [
        {
          description: 'Определи `user_id` получателя',
          descriptionEn: 'Determine recipient `user_id`',
          command: 'pachca search list-users --query="имя"',
          apiMethod: 'GET',
          apiPath: '/search/users',
          notes: 'Или возьми user_id из контекста (вебхук, предыдущий запрос)',
          notesEn: 'Or take user_id from context (webhook, previous request)',
        },
        {
          description: 'Отправь личное сообщение',
          descriptionEn: 'Send direct message',
          command:
            'pachca messages create --entity-type=user --entity-id=<user_id> --content="Привет!"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes: 'Создавать чат не требуется — он создаётся автоматически',
      notesEn: 'No need to create a chat — it is created automatically',
      related: [
        'Найти сотрудника по имени или email',
        'Разослать уведомление нескольким пользователям',
      ],
      relatedEn: ['Find employee by name or email', 'Send notification to multiple users'],
    },
    {
      title: 'Ответить в тред (комментарий к сообщению)',
      titleEn: 'Reply to thread',
      steps: [
        {
          description: 'Получи или создай тред, возьми `thread.id` из ответа',
          descriptionEn: 'Get or create thread, take `thread.id` from response',
          command: 'pachca thread add <ID>',
          apiMethod: 'POST',
          apiPath: '/messages/{id}/thread',
          notes: 'Если тред уже существует, вернётся существующий',
          notesEn: 'If thread already exists, the existing one is returned',
        },
        {
          description: 'Отправь сообщение в тред',
          descriptionEn: 'Send message to thread',
          command:
            'pachca messages create --entity-type=thread --entity-id=<thread_id> --content="Ответ в тред"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes:
        '`skip_invite_mentions: true` — не добавлять упомянутых пользователей в тред автоматически.',
      notesEn: '`skip_invite_mentions: true` — do not automatically add mentioned users to thread.',
    },
    {
      title: 'Ответить пользователю, который написал боту',
      titleEn: 'Reply to user who messaged the bot',
      inline: false,
      related: [
        'Настроить бота с исходящим вебхуком',
        'Обработать входящий вебхук-событие',
        'Отправить сообщение с кнопками',
      ],
      relatedEn: [
        'Set up bot with outgoing webhook',
        'Handle incoming webhook event',
        'Send message with buttons',
      ],
      steps: [
        {
          description:
            'Вебхук содержит `entity_type` — он однозначно определяет контекст: `"user"` — личное сообщение боту, `"thread"` — сообщение в треде, `"discussion"` — сообщение в канале или беседе',
          descriptionEn:
            'Webhook contains `entity_type` that determines context: `"user"` — DM to bot, `"thread"` — message in thread, `"discussion"` — message in channel or conversation',
        },
        {
          description: 'DM (`entity_type: "user"`): ответь личным сообщением',
          descriptionEn: 'DM (`entity_type: "user"`): reply with direct message',
          command:
            'pachca messages create --entity-type=user --entity-id=<user_id> --content="Ответ"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'Тред (`entity_type: "thread"`): ответь в тот же тред',
          descriptionEn: 'Thread (`entity_type: "thread"`): reply in the same thread',
          command:
            'pachca messages create --entity-type=thread --entity-id=<entity_id> --parent-message-id=<id> --content="Ответ"',
          apiMethod: 'POST',
          apiPath: '/messages',
          notes: 'Вложенных тредов нет — ответ идёт в тот же тред',
          notesEn: 'No nested threads — reply goes to the same thread',
        },
        {
          description: 'Беседа/канал (`entity_type: "discussion"`): inline-ответ или тред',
          descriptionEn:
            'Conversation/channel (`entity_type: "discussion"`): inline reply or thread',
          command:
            'pachca messages create --entity-id=<entity_id> --parent-message-id=<id> --content="Ответ"',
          apiMethod: 'POST',
          apiPath: '/messages',
          notes: '`parent_message_id` визуально привязывает ответ к сообщению',
          notesEn: '`parent_message_id` visually links reply to the message',
        },
      ],
      notes:
        'Если бота вызвали в треде — основной контекст в родительском сообщении треда. В вебхуке есть `thread.message_id` — получи родительское сообщение: `pachca messages get <message_id>`.',
      notesEn:
        'If bot was called in a thread — main context is in thread parent message. Webhook has `thread.message_id` — get parent message: `pachca messages get <message_id>`.',
    },
    {
      title: 'Отправить сообщение с файлами',
      titleEn: 'Send message with files',
      inline: false,
      related: ['Получить вложения из сообщения', 'Изменить вложения сообщения'],
      relatedEn: ['Get attachments from message', 'Update message attachments'],
      steps: [
        {
          description: 'Загрузи каждый файл — команда вернёт `key`',
          descriptionEn: 'Upload each file — command returns `key`',
          command: 'pachca upload report.pdf',
          notes: 'Команда автоматически получает подпись и загружает файл на S3',
          notesEn: 'Command automatically gets signature and uploads file to S3',
        },
        {
          description: 'Отправь сообщение со всеми файлами',
          descriptionEn: 'Send message with all files',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Смотри файл" --files=\'[{"key":"attaches/files/.../report.pdf","name":"report.pdf","file_type":"file","size":12345}]\'',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes:
        '`pachca upload` автоматически получает подпись (POST /uploads), подставляет имя файла в `key` и загружает на S3. Возвращает готовый `key` для использования в `files`.',
      notesEn:
        '`pachca upload` automatically gets signature (POST /uploads), substitutes filename in `key`, and uploads to S3. Returns ready-to-use `key` for `files`.',
    },
    {
      title: 'Отправить сообщение с кнопками',
      titleEn: 'Send message with buttons',
      steps: [
        {
          description: 'Сформируй массив `buttons` — массив строк, каждая строка — массив кнопок',
          descriptionEn: 'Build `buttons` array — array of rows, each row is an array of buttons',
          notes: 'Каждая кнопка: `{"text": "Текст"}` + либо `url` (ссылка), либо `data` (callback)',
          notesEn: 'Each button: `{"text": "Label"}` + either `url` (link) or `data` (callback)',
        },
        {
          description: 'Отправь сообщение с кнопками',
          descriptionEn: 'Send message with buttons',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Выбери действие" --buttons=\'[[{"text":"Подробнее","url":"https://example.com"},{"text":"Отлично!","data":"awesome"}]]\'',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes:
        '`buttons` — массив массивов (строки × кнопки). Максимум 100 кнопок, до 8 в строке. Кнопка с `url` открывает ссылку, с `data` — отправляет событие на вебхук.',
      notesEn:
        '`buttons` — array of arrays (rows × buttons). Max 100 buttons, up to 8 per row. Button with `url` opens link, with `data` — sends event to webhook.',
      related: [
        'Обработать нажатие кнопки (callback)',
        'Показать интерактивную форму пользователю',
      ],
      relatedEn: ['Handle button click (callback)', 'Show interactive form to user'],
    },
    {
      title: 'Получить историю сообщений чата',
      titleEn: 'Get chat message history',
      steps: [
        {
          description: 'Получи сообщения чата с пагинацией',
          descriptionEn: 'Get chat messages with pagination',
          command: 'pachca messages list --chat-id=<chat_id>',
          apiMethod: 'GET',
          apiPath: '/messages',
          notes: '`limit` (1-50), `cursor`, `sort[id]=asc` или `desc` (по умолчанию)',
          notesEn: '`limit` (1-50), `cursor`, `sort[id]=asc` or `desc` (default)',
        },
      ],
      notes:
        'Для сообщений треда используй `chat_id` треда (`thread.chat_id`). Пагинация cursor-based, не page-based.',
      notesEn:
        'For thread messages use thread `chat_id` (`thread.chat_id`). Pagination is cursor-based, not page-based.',
    },
    {
      title: 'Получить вложения из сообщения',
      titleEn: 'Get attachments from message',
      steps: [
        {
          description:
            'Получи сообщение — в `files[]` каждый объект содержит `url`, `name`, `file_type`, `size`',
          descriptionEn:
            'Get message — `files[]` contains objects with `url`, `name`, `file_type`, `size`',
          command: 'pachca messages get <ID>',
          apiMethod: 'GET',
          apiPath: '/messages/{id}',
        },
        {
          description: 'Скачай нужные файлы по `files[].url`',
          descriptionEn: 'Download files via `files[].url`',
          notes: 'Ссылка прямая, авторизация не требуется',
          notesEn: 'Direct link, no auth required',
        },
      ],
      notes:
        'Вебхук о новом сообщении НЕ содержит вложений — поле `files` отсутствует. Всегда проверяй вложения через GET /messages/{id}.',
      notesEn:
        'Webhook for new message does NOT contain attachments — `files` field is absent. Always check attachments via GET /messages/{id}.',
    },
    {
      title: 'Закрепить/открепить сообщение',
      titleEn: 'Pin/unpin message',
      steps: [
        {
          description: 'Закрепить сообщение',
          descriptionEn: 'Pin message',
          command: 'pachca messages pin <ID>',
          apiMethod: 'POST',
          apiPath: '/messages/{id}/pin',
        },
        {
          description: 'Открепить сообщение',
          descriptionEn: 'Unpin message',
          command: 'pachca messages unpin <ID> --force',
          apiMethod: 'DELETE',
          apiPath: '/messages/{id}/pin',
        },
      ],
      notes: 'В чате может быть несколько закреплённых сообщений.',
      notesEn: 'A chat can have multiple pinned messages.',
    },
    {
      title: 'Подписаться на тред сообщения',
      titleEn: 'Subscribe to message thread',
      steps: [
        {
          description: 'Получи или создай тред, возьми `chat_id` из ответа',
          descriptionEn: 'Get or create thread, take `chat_id` from response',
          command: 'pachca thread add <ID>',
          apiMethod: 'POST',
          apiPath: '/messages/{id}/thread',
        },
        {
          description: 'Добавь бота в участники чата треда',
          descriptionEn: 'Add bot to thread chat members',
          command: "pachca members add <thread_chat_id> --member-ids='[<bot_user_id>]'",
          apiMethod: 'POST',
          apiPath: '/chats/{id}/members',
        },
        {
          description: 'Теперь бот будет получать вебхук-события о новых сообщениях в этом треде',
          descriptionEn:
            'Now the bot will receive webhook events about new messages in this thread',
        },
      ],
      notes: 'POST /messages/{id}/thread идемпотентен — безопасно вызывать повторно.',
      notesEn: 'POST /messages/{id}/thread is idempotent — safe to call repeatedly.',
    },
    {
      title: 'Упомянуть пользователя по имени',
      titleEn: 'Mention user by name',
      inline: false,
      steps: [
        {
          description:
            'Определи поисковый запрос — используй фамилию (она уникальнее). Имена не склоняются в API, приводи к именительному падежу',
          descriptionEn:
            'Determine search query — use last name (more unique). Names are not declined in API, use nominative case',
        },
        {
          description: 'Ищи среди участников целевого чата',
          descriptionEn: 'Search among target chat members',
          command: 'pachca members list <chat_id>',
          apiMethod: 'GET',
          apiPath: '/chats/{id}/members',
          notes: 'Фильтруй по имени на клиенте',
          notesEn: 'Filter by name on client side',
        },
        {
          description: 'Если пишешь в тред: также проверь участников родительского чата',
          descriptionEn: 'If writing to thread: also check parent chat members',
          command: 'pachca members list <parent_chat_id>',
          apiMethod: 'GET',
          apiPath: '/chats/{id}/members',
        },
        {
          description: 'Не нашёл — ищи по всей компании',
          descriptionEn: 'Not found — search entire company',
          command: 'pachca search list-users --query=<запрос>',
          apiMethod: 'GET',
          apiPath: '/search/users',
        },
        {
          description: 'Один результат → используй `nickname`. Несколько → уточни у пользователя',
          descriptionEn: 'One result → use `nickname`. Multiple → ask user to clarify',
        },
        {
          description: 'Вставь `@nickname` в текст сообщения',
          descriptionEn: 'Insert `@nickname` into message text',
        },
      ],
      notes: 'Поиск среди участников чата точнее — пользователь явно связан с контекстом.',
      notesEn:
        'Searching among chat members is more precise — user is explicitly linked to context.',
    },
    {
      title: 'Отредактировать сообщение',
      titleEn: 'Edit message',
      steps: [
        {
          description: 'Обнови сообщение',
          descriptionEn: 'Update message',
          command: 'pachca messages update <ID> --content="Обновлённый текст"',
          apiMethod: 'PUT',
          apiPath: '/messages/{id}',
        },
      ],
      notes: 'Редактировать можно только свои сообщения (или от имени бота).',
      notesEn: 'Can only edit own messages (or on behalf of bot).',
    },
    {
      title: 'Изменить вложения сообщения',
      titleEn: 'Update message attachments',
      steps: [
        {
          description: 'Получи текущие вложения из `files[]`',
          descriptionEn: 'Get current attachments from `files[]`',
          command: 'pachca messages get <ID>',
          apiMethod: 'GET',
          apiPath: '/messages/{id}',
          notes: 'Сохрани нужные объекты (`key`, `name`, `file_type`, `size`)',
          notesEn: 'Save needed objects (`key`, `name`, `file_type`, `size`)',
        },
        {
          description: 'Если нужно добавить новый файл — загрузи его',
          descriptionEn: 'If adding new file — upload it',
          command: 'pachca common uploads',
          apiMethod: 'POST',
          apiPath: '/uploads',
        },
        {
          description: 'Обнови сообщение с новым массивом `files`',
          descriptionEn: 'Update message with new `files` array',
          command: "pachca messages update <ID> --files='[...]'",
          apiMethod: 'PUT',
          apiPath: '/messages/{id}',
          notes:
            '`files` при редактировании — replace-all: присылаемый массив полностью заменяет текущие',
          notesEn:
            '`files` on edit is replace-all: the sent array completely replaces current attachments',
        },
      ],
      notes:
        '`files: []` удаляет все вложения. Если поле `files` не передавать — вложения не меняются.',
      notesEn:
        '`files: []` removes all attachments. If `files` field is omitted — attachments are unchanged.',
    },
    {
      title: 'Удалить сообщение',
      titleEn: 'Delete message',
      steps: [
        {
          description: 'Удали сообщение',
          descriptionEn: 'Delete message',
          command: 'pachca messages delete <ID> --force',
          apiMethod: 'DELETE',
          apiPath: '/messages/{id}',
        },
      ],
    },
    {
      title: 'Добавить реакцию на сообщение',
      titleEn: 'Add reaction to message',
      steps: [
        {
          description: 'Добавь реакцию',
          descriptionEn: 'Add reaction',
          command: 'pachca reactions add <ID> --code="👍"',
          apiMethod: 'POST',
          apiPath: '/messages/{id}/reactions',
        },
        {
          description: 'Убрать реакцию',
          descriptionEn: 'Remove reaction',
          command: 'pachca reactions remove <ID> --code="👍" --force',
          apiMethod: 'DELETE',
          apiPath: '/messages/{id}/reactions',
        },
      ],
      notes: '`code` — emoji-символ, не его текстовое название.',
      notesEn: '`code` — emoji character, not its text name.',
    },
    {
      title: 'Проверить, кто прочитал сообщение',
      titleEn: 'Check who read a message',
      steps: [
        {
          description: 'Получи массив `user_id` прочитавших',
          descriptionEn: 'Get array of `user_id` who read the message',
          command: 'pachca read-member list-readers <ID>',
          apiMethod: 'GET',
          apiPath: '/messages/{id}/read_member_ids',
        },
        {
          description: 'При необходимости сопоставь с именами сотрудников',
          descriptionEn: 'If needed, match with employee names',
          command: 'pachca users list',
          apiMethod: 'GET',
          apiPath: '/users',
        },
      ],
    },
    {
      title: 'Разослать уведомление нескольким пользователям',
      titleEn: 'Send notification to multiple users',
      related: [
        'Отправить личное сообщение пользователю',
        'Получить всех сотрудников тега/департамента',
      ],
      relatedEn: ['Send direct message to user', 'Get all employees of a tag/department'],
      steps: [
        {
          description: 'Определи список `user_id` получателей',
          descriptionEn: 'Determine list of recipient `user_id`s',
          command: 'pachca users list --all',
          apiMethod: 'GET',
          apiPath: '/users',
          notes: 'Или получи user_id из тега — см. «Получить всех сотрудников тега/департамента»',
          notesEn: 'Or get user_ids from tag — see "Get all employees of a tag/department"',
        },
        {
          description: 'Для каждого: отправь личное сообщение',
          descriptionEn: 'For each: send direct message',
          command:
            'pachca messages create --entity-type=user --entity-id=<user_id> --content="Уведомление"',
          apiMethod: 'POST',
          apiPath: '/messages',
          notes: 'Для каждого получателя',
          notesEn: 'For each recipient',
        },
      ],
      notes: 'Соблюдай rate limit: ~4 req/sec для сообщений. Добавляй паузы при большом списке.',
      notesEn: 'Respect rate limit: ~4 req/sec for messages. Add delays for large lists.',
    },
  ],
  'pachca-chats': [
    {
      title: 'Создать канал и пригласить участников',
      titleEn: 'Create channel and invite members',
      related: ['Создать проектную беседу из шаблона', 'Архивация и управление чатом'],
      relatedEn: ['Create project conversation from template', 'Archive and manage chat'],
      steps: [
        {
          description: 'Создай канал с участниками',
          descriptionEn: 'Create channel with members',
          command: 'pachca chats create --name="Новый канал" --channel --member-ids=\'[1,2,3]\'',
          apiMethod: 'POST',
          apiPath: '/chats',
          notes:
            '`"channel": true` для канала, `false` (по умолчанию) для беседы. Участников можно передать сразу: `member_ids` и/или `group_tag_ids`',
          notesEn:
            '`"channel": true` for channel, `false` (default) for conversation. Members can be passed immediately: `member_ids` and/or `group_tag_ids`',
        },
        {
          description: 'Или добавь участников позже',
          descriptionEn: 'Or add members later',
          command: "pachca members add <chat_id> --member-ids='[1,2,3]'",
          apiMethod: 'POST',
          apiPath: '/chats/{id}/members',
        },
      ],
      notes:
        '`channel` — boolean, не строка. `member_ids` и `group_tag_ids` — опциональны при создании.',
      notesEn:
        '`channel` — boolean, not string. `member_ids` and `group_tag_ids` — optional on creation.',
    },
    {
      title: 'Архивация и управление чатом',
      titleEn: 'Archive and manage chat',
      inline: false,
      steps: [
        {
          description: 'Архивировать чат',
          descriptionEn: 'Archive chat',
          command: 'pachca chats archive <ID>',
          apiMethod: 'PUT',
          apiPath: '/chats/{id}/archive',
        },
        {
          description: 'Разархивировать чат',
          descriptionEn: 'Unarchive chat',
          command: 'pachca chats unarchive <ID>',
          apiMethod: 'PUT',
          apiPath: '/chats/{id}/unarchive',
        },
        {
          description: 'Изменить роль участника',
          descriptionEn: 'Change member role',
          command: 'pachca members update <chat_id> <user_id> --role=admin',
          apiMethod: 'PUT',
          apiPath: '/chats/{id}/members/{user_id}',
          notes:
            '`role`: `"admin"` | `"member"` | `"editor"` (только каналы). Роль создателя изменить нельзя.',
          notesEn:
            '`role`: `"admin"` | `"member"` | `"editor"` (channels only). Creator role cannot be changed.',
        },
        {
          description: 'Удалить участника',
          descriptionEn: 'Remove member',
          command: 'pachca members remove <chat_id> <user_id> --force',
          apiMethod: 'DELETE',
          apiPath: '/chats/{id}/members/{user_id}',
        },
        {
          description: 'Покинуть чат',
          descriptionEn: 'Leave chat',
          command: 'pachca members leave <chat_id> --force',
          apiMethod: 'DELETE',
          apiPath: '/chats/{id}/leave',
        },
      ],
    },
    {
      title: 'Переименовать или обновить чат',
      titleEn: 'Rename or update chat',
      steps: [
        {
          description: 'Обнови чат',
          descriptionEn: 'Update chat',
          command: 'pachca chats update <ID> --name="Новое название"',
          apiMethod: 'PUT',
          apiPath: '/chats/{id}',
          notes: 'Доступные поля: `name`, `public`',
          notesEn: 'Available fields: `name`, `public`',
        },
      ],
      notes: 'Для изменения состава участников используй POST/DELETE /chats/{id}/members.',
      notesEn: 'To change members use POST/DELETE /chats/{id}/members.',
    },
    {
      title: 'Создать проектную беседу из шаблона',
      titleEn: 'Create project conversation from template',
      steps: [
        {
          description: 'Создай беседу с участниками из тега',
          descriptionEn: 'Create conversation with members from tag',
          command:
            "pachca chats create --name=\"Проект Alpha\" --group-tag-ids='[42]' --member-ids='[186,187]'",
          apiMethod: 'POST',
          apiPath: '/chats',
        },
        {
          description: 'Отправь приветственное сообщение',
          descriptionEn: 'Send welcome message',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Добро пожаловать в проект!"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes: '`group_tag_ids` при создании добавляет всех участников тега сразу.',
      notesEn: '`group_tag_ids` on creation adds all tag members at once.',
    },
    {
      title: 'Экспорт истории чата',
      titleEn: 'Export chat history',
      inline: false,
      steps: [
        {
          description: 'Запроси экспорт',
          descriptionEn: 'Request export',
          command:
            'pachca common request-export --start-at=<YYYY-MM-DD> --end-at=<YYYY-MM-DD> --webhook-url=<URL>',
          apiMethod: 'POST',
          apiPath: '/chats/exports',
          notes: '`start_at`, `end_at` (YYYY-MM-DD), `webhook_url` обязателен — запрос асинхронный',
          notesEn: '`start_at`, `end_at` (YYYY-MM-DD), `webhook_url` required — request is async',
        },
        {
          description:
            'Дождись вебхука: придёт JSON с `"type": "export"`, `"event": "ready"` и `export_id`',
          descriptionEn:
            'Wait for webhook: JSON with `"type": "export"`, `"event": "ready"` and `export_id`',
        },
        {
          description: 'Скачай файл экспорта',
          descriptionEn: 'Download export file',
          command: 'pachca common get-exports <export_id>',
          apiMethod: 'GET',
          apiPath: '/chats/exports/{id}',
          notes: 'Сервер вернёт 302, HTTP-клиент скачает файл автоматически',
          notesEn: 'Server returns 302, HTTP client downloads file automatically',
        },
      ],
      notes:
        '`webhook_url` обязателен — POST не возвращает id в ответе. Экспорт доступен только Владельцу на тарифе «Корпорация». Макс период: 45 дней (366 при указании конкретных чатов).',
      notesEn:
        '`webhook_url` required — POST does not return id in response. Export available only to Owner on "Corporation" plan. Max period: 45 days (366 when specific chats are specified).',
    },
    {
      title: 'Найти активные чаты за период',
      titleEn: 'Find active chats for period',

      steps: [
        {
          description: 'Получи чаты с активностью после указанной даты',
          descriptionEn: 'Get chats with activity after specified date',
          command: 'pachca chats list --last-message-at-after=<дата> --all',
          apiMethod: 'GET',
          apiPath: '/chats',
          notes: 'Для диапазона добавь `--last-message-at-before`. Дата в ISO-8601 UTC+0',
          notesEn: 'For range add `--last-message-at-before`. Date in ISO-8601 UTC+0',
        },
      ],
    },
    {
      title: 'Найти и заархивировать неактивные чаты',
      titleEn: 'Find and archive inactive chats',
      related: ['Найти активные чаты за период', 'Архивация и управление чатом'],
      relatedEn: ['Find active chats for period', 'Archive and manage chat'],
      steps: [
        {
          description: 'Получи чаты без активности с нужной даты',
          descriptionEn: 'Get chats with no activity since specified date',
          command: 'pachca chats list --last-message-at-before=<порог> --all',
          apiMethod: 'GET',
          apiPath: '/chats',
        },
        {
          description: 'Для каждого чата: архивируй',
          descriptionEn: 'For each chat: archive',
          command: 'pachca chats archive <ID>',
          apiMethod: 'PUT',
          apiPath: '/chats/{id}/archive',
          notes: 'Проверяй `"channel": false` — архивация каналов может быть нежелательной',
          notesEn: 'Check `"channel": false` — archiving channels may be undesirable',
        },
      ],
    },
  ],
  'pachca-bots': [
    {
      title: 'Настроить бота с исходящим вебхуком',
      titleEn: 'Set up bot with outgoing webhook',
      related: [
        'Обработать входящий вебхук-событие',
        'Обновить Webhook URL бота',
        'Ответить пользователю, который написал боту',
      ],
      relatedEn: [
        'Handle incoming webhook event',
        'Update bot webhook URL',
        'Reply to user who messaged the bot',
      ],
      steps: [
        {
          description: 'Создай бота в интерфейсе Пачки: Автоматизации → Интеграции → Webhook',
          descriptionEn: 'Create bot in Pachca UI: Automations → Integrations → Webhook',
        },
        {
          description: 'Получи `access_token` бота во вкладке «API» настроек бота',
          descriptionEn: 'Get bot `access_token` from "API" tab in bot settings',
        },
        {
          description: 'Укажи Webhook URL для получения событий',
          descriptionEn: 'Set Webhook URL for receiving events',
        },
      ],
      notes:
        'Бот создаётся через UI, не через API. Единственный эндпоинт для ботов — PUT /bots/{id} (обновление webhook URL). API используется для отправки сообщений от имени бота.',
      notesEn:
        'Bot is created via UI, not API. The only bot endpoint is PUT /bots/{id} (update webhook URL). API is used to send messages on behalf of bot.',
    },
    {
      title: 'Обновить Webhook URL бота',
      titleEn: 'Update bot webhook URL',
      steps: [
        {
          description: 'Обнови webhook URL бота',
          descriptionEn: 'Update bot webhook URL',
          command:
            'pachca bots update <bot_id> --webhook=\'{"outgoing_url":"https://example.com/webhook"}\'',
          apiMethod: 'PUT',
          apiPath: '/bots/{id}',
          notes: '`id` бота (его `user_id`) можно узнать во вкладке «API» настроек бота',
          notesEn: 'Bot `id` (its `user_id`) can be found in "API" tab of bot settings',
        },
      ],
      notes: 'Обновлять настройки может только тот, кому разрешено редактирование бота.',
      notesEn: 'Only users with bot edit permissions can update settings.',
    },
    {
      title: 'Обработать входящий вебхук-событие',
      titleEn: 'Handle incoming webhook event',
      inline: false,
      related: [
        'Настроить бота с исходящим вебхуком',
        'Ответить пользователю, который написал боту',
        'Обработка событий через историю (polling)',
      ],
      relatedEn: [
        'Set up bot with outgoing webhook',
        'Reply to user who messaged the bot',
        'Process events via history (polling)',
      ],
      steps: [
        {
          description: 'Получи POST-запрос на свой Webhook URL',
          descriptionEn: 'Receive POST request on your Webhook URL',
        },
        {
          description: 'Проверь подпись (Signing secret) для безопасности',
          descriptionEn: 'Verify signature (Signing secret) for security',
        },
        {
          description: 'Проверь `webhook_timestamp` — должен быть в пределах 1 минуты',
          descriptionEn: 'Check `webhook_timestamp` — must be within 1 minute',
        },
        {
          description: 'Разбери JSON: тип события, данные',
          descriptionEn: 'Parse JSON: event type, data',
        },
        {
          description:
            'Для полной информации запроси сообщение — особенно для вложений (`files[]`)',
          descriptionEn: 'For full info request message — especially for attachments (`files[]`)',
          command: 'pachca messages get <message_id>',
          apiMethod: 'GET',
          apiPath: '/messages/{id}',
          notes: 'Вебхук НЕ содержит файлов — `files` отсутствует',
          notesEn: 'Webhook does NOT contain files — `files` is absent',
        },
      ],
      notes: 'Вебхук содержит минимум данных — файлы (`files`) в нём отсутствуют.',
      notesEn: 'Webhook contains minimal data — files (`files`) are absent.',
    },
    {
      title: 'Разворачивание ссылок (unfurling)',
      titleEn: 'Link unfurling',
      inline: false,
      steps: [
        {
          description: 'Создай специального Unfurl-бота и укажи отслеживаемые домены',
          descriptionEn: 'Create a special Unfurl bot and specify tracked domains',
        },
        {
          description:
            'При появлении ссылки бот получает вебхук `"event": "link_shared"` с массивом `links`',
          descriptionEn:
            'When a link appears, bot receives webhook `"event": "link_shared"` with `links` array',
        },
        {
          description: 'Извлеки данные из своей системы по URL из `links`',
          descriptionEn: 'Extract data from your system by URL from `links`',
        },
        {
          description: 'Отправь превью-данные',
          descriptionEn: 'Send preview data',
          command: `pachca link-previews add <message_id> --link-previews='{"https://example.com":{"title":"Example","description":"Description"}}'`,
          apiMethod: 'POST',
          apiPath: '/messages/{id}/link_previews',
        },
      ],
      notes:
        'Эндпоинт привязан к конкретному сообщению. Необходим специальный Unfurl-бот с указанными доменами.',
      notesEn:
        'Endpoint is bound to a specific message. Requires a special Unfurl bot with specified domains.',
    },
    {
      title: 'Обработать нажатие кнопки (callback)',
      titleEn: 'Handle button click (callback)',
      inline: false,
      related: ['Отправить сообщение с кнопками', 'Показать интерактивную форму пользователю'],
      relatedEn: ['Send message with buttons', 'Show interactive form to user'],
      steps: [
        {
          description:
            'Получи вебхук с `"event": "message_button_clicked"` — в payload: `data`, `user_id`, `message_id`',
          descriptionEn:
            'Receive webhook with `"event": "message_button_clicked"` — payload: `data`, `user_id`, `message_id`',
        },
        {
          description: 'Выполни нужное действие (запись в БД, запрос к API и т.д.)',
          descriptionEn: 'Perform required action (DB write, API call, etc.)',
        },
        {
          description: 'Ответь пользователю',
          descriptionEn: 'Reply to user',
          command:
            'pachca messages create --entity-type=user --entity-id=<user_id> --content="Принято!"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'Опционально: обнови исходное сообщение',
          descriptionEn: 'Optionally: update original message',
          command: 'pachca messages update <message_id> --buttons=\'[]\' --content="Обработано"',
          apiMethod: 'PUT',
          apiPath: '/messages/{id}',
          notes: '`"buttons": []` убирает кнопки',
          notesEn: '`"buttons": []` removes buttons',
        },
      ],
      notes:
        'Кнопка с `data` отправляет событие на вебхук. Кнопка с `url` — открывает ссылку (вебхука не будет).',
      notesEn:
        'Button with `data` sends event to webhook. Button with `url` — opens link (no webhook).',
    },
    {
      title: 'Периодический дайджест/отчёт',
      titleEn: 'Periodic digest/report',
      related: ['Мониторинг и алерты', 'Настроить бота с исходящим вебхуком'],
      relatedEn: ['Monitoring and alerts', 'Set up bot with outgoing webhook'],
      steps: [
        {
          description: 'По расписанию (cron/scheduler): собери данные из своей системы',
          descriptionEn: 'On schedule (cron/scheduler): collect data from your system',
        },
        {
          description: 'Сформируй текст сообщения с нужными метриками или сводкой',
          descriptionEn: 'Compose message text with metrics or summary',
        },
        {
          description: 'Отправь сообщение в канал',
          descriptionEn: 'Send message to channel',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Дайджест за сегодня: ..."',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes:
        'Нет встроенного планировщика — используй cron, celery, sidekiq и т.п. на своей стороне.',
      notesEn: 'No built-in scheduler — use cron, celery, sidekiq, etc. on your side.',
    },
    {
      title: 'Мониторинг и алерты',
      titleEn: 'Monitoring and alerts',
      inline: false,
      related: ['Настроить бота с исходящим вебхуком', 'Обработать нажатие кнопки (callback)'],
      relatedEn: ['Set up bot with outgoing webhook', 'Handle button click (callback)'],
      steps: [
        {
          description: 'Внешняя система обнаруживает событие (ошибка, деплой, порог метрики)',
          descriptionEn: 'External system detects event (error, deploy, metric threshold)',
        },
        {
          description: 'Делает POST запрос к боту или напрямую вызывает Pachca API',
          descriptionEn: 'Makes POST request to bot or directly calls Pachca API',
        },
        {
          description: 'Отправь алерт с кнопками в канал',
          descriptionEn: 'Send alert with buttons to channel',
          command:
            'pachca messages create --entity-id=<alert_chat_id> --content="Алерт: ..." --buttons=\'[[{"text":"Взять в работу","data":"take"},{"text":"Игнорировать","data":"ignore"}]]\'',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'При нажатии кнопки — обработай callback и обнови статус алерта',
          descriptionEn: 'On button click — handle callback and update alert status',
        },
      ],
    },
    {
      title: 'Обработка событий через историю (polling)',
      titleEn: 'Process events via history (polling)',
      inline: false,
      related: ['Обработать входящий вебхук-событие', 'Настроить бота с исходящим вебхуком'],
      relatedEn: ['Handle incoming webhook event', 'Set up bot with outgoing webhook'],
      steps: [
        {
          description:
            'В настройках бота включи «Сохранять историю событий». Webhook URL указывать не обязательно.',
          descriptionEn: 'In bot settings enable "Save event history". Webhook URL is optional.',
        },
        {
          description: 'Получи накопленные события',
          descriptionEn: 'Get accumulated events',
          command: 'pachca bots list-events --all',
          apiMethod: 'GET',
          apiPath: '/webhooks/events',
        },
        {
          description: 'Обработай каждое событие (тот же формат, что и в real-time вебхуке)',
          descriptionEn: 'Process each event (same format as real-time webhook)',
        },
        {
          description: 'Удали обработанное событие',
          descriptionEn: 'Delete processed event',
          command: 'pachca bots remove-event <event_id> --force',
          apiMethod: 'DELETE',
          apiPath: '/webhooks/events/{id}',
          notes: 'Удаляй, чтобы не обработать повторно',
          notesEn: 'Delete to avoid reprocessing',
        },
      ],
      notes: 'Polling — альтернатива real-time вебхуку, если у бота нет публичного URL.',
      notesEn: 'Polling — alternative to real-time webhook if bot has no public URL.',
    },
  ],
  'pachca-forms': [
    {
      title: 'Показать интерактивную форму пользователю',
      titleEn: 'Show interactive form to user',

      inline: false,
      related: [
        'Обработать отправку формы (view_submission)',
        'Отправить сообщение с кнопками',
        'Опрос сотрудников через форму',
      ],
      relatedEn: [
        'Handle form submission (view_submission)',
        'Send message with buttons',
        'Employee survey via form',
      ],
      steps: [
        {
          description:
            'Подготовь объект формы: `view` с `title`, `blocks`, опционально `callback_id` и `private_metadata`',
          descriptionEn:
            'Prepare form object: `view` with `title`, `blocks`, optionally `callback_id` and `private_metadata`',
          notes:
            'Типы блоков: `input`, `select`, `radio`, `checkbox`, `date`, `time`, `file_input`, `header`, `plain_text`, `markdown`, `divider`',
          notesEn:
            'Block types: `input`, `select`, `radio`, `checkbox`, `date`, `time`, `file_input`, `header`, `plain_text`, `markdown`, `divider`',
        },
        {
          description: 'Отправь сообщение с кнопкой',
          descriptionEn: 'Send message with button',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Заполните форму" --buttons=\'[[{"text":"Открыть форму","data":"open_form"}]]\'',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'При нажатии кнопки — получи вебхук-событие с `trigger_id`',
          descriptionEn: 'On button click — receive webhook event with `trigger_id`',
        },
        {
          description: 'Немедленно открой форму',
          descriptionEn: 'Immediately open form',
          command:
            'pachca views open --type=modal --trigger-id=<trigger_id> --title="Заявка" --blocks=\'[...]\'',
          apiMethod: 'POST',
          apiPath: '/views/open',
          notes: '`trigger_id` живёт 3 секунды — формируй объект формы заранее',
          notesEn: '`trigger_id` expires in 3 seconds — prepare form object in advance',
        },
        {
          description:
            'При отправке формы получи вебхук — обработай по сценарию «Обработать отправку формы»',
          descriptionEn:
            'On form submission receive webhook — handle per "Handle form submission" scenario',
        },
      ],
      notes: 'Формы работают только от бота.',
      notesEn: 'Forms only work from bot.',
    },
    {
      title: 'Обработать отправку формы (view_submission)',
      titleEn: 'Handle form submission (view_submission)',
      inline: false,
      related: ['Показать интерактивную форму пользователю', 'Форма заявки/запроса'],
      relatedEn: ['Show interactive form to user', 'Request/application form'],
      steps: [
        {
          description:
            'Получи вебхук с `"type": "view"`, `"event": "submit"` — содержит `callback_id`, `user_id`, `private_metadata` и `data`',
          descriptionEn:
            'Receive webhook with `"type": "view"`, `"event": "submit"` — contains `callback_id`, `user_id`, `private_metadata` and `data`',
          notes: 'Значения полей: ключи совпадают с `name` каждого блока',
          notesEn: 'Field values: keys match `name` of each block',
        },
        {
          description: 'Извлеки значения из `data`',
          descriptionEn: 'Extract values from `data`',
        },
        {
          description:
            'Если есть `file_input` — скачай файлы по `data.field_name[].url` немедленно',
          descriptionEn:
            'If `file_input` exists — download files via `data.field_name[].url` immediately',
          notes: 'Ссылки истекают через 1 час',
          notesEn: 'Links expire in 1 hour',
        },
        {
          description: 'Если данные валидны → ответь HTTP 200 (пустое тело) — форма закроется',
          descriptionEn: 'If data is valid → respond HTTP 200 (empty body) — form will close',
        },
        {
          description:
            'Если есть ошибки → ответь HTTP 400 с `{"errors": {"field_name": "текст ошибки"}}`',
          descriptionEn:
            'If errors exist → respond HTTP 400 with `{"errors": {"field_name": "error text"}}`',
          notes: 'Пользователь увидит ошибки в форме и сможет исправить',
          notesEn: 'User will see errors in form and can fix them',
        },
      ],
      notes:
        'Ответ должен быть дан в течение 3 секунд. `private_metadata` — контекст, до 3000 символов.',
      notesEn:
        'Response must be given within 3 seconds. `private_metadata` — context, up to 3000 chars.',
    },
    {
      title: 'Опрос сотрудников через форму',
      titleEn: 'Employee survey via form',
      inline: false,
      related: [
        'Показать интерактивную форму пользователю',
        'Обработать отправку формы (view_submission)',
      ],
      relatedEn: ['Show interactive form to user', 'Handle form submission (view_submission)'],
      steps: [
        {
          description: 'Отправь сообщение с кнопкой «Пройти опрос»',
          descriptionEn: 'Send message with "Take survey" button',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Пройди опрос" --buttons=\'[[{"text":"Пройти опрос","data":"survey_start"}]]\'',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'При нажатии кнопки получи вебхук с `trigger_id`',
          descriptionEn: 'On button click receive webhook with `trigger_id`',
        },
        {
          description: 'Открой форму с полями опроса',
          descriptionEn: 'Open form with survey fields',
          command:
            'pachca views open --type=modal --trigger-id=<trigger_id> --title="Опрос" --blocks=\'[...]\'',
          apiMethod: 'POST',
          apiPath: '/views/open',
        },
        {
          description: 'При submit-вебхуке обработай ответы',
          descriptionEn: 'On submit webhook process answers',
        },
        {
          description: 'Сохрани в базу или отправь итоговым сообщением в канал',
          descriptionEn: 'Save to database or send summary message to channel',
        },
        {
          description: 'Ответь HTTP 200 — форма закроется',
          descriptionEn: 'Respond HTTP 200 — form will close',
        },
      ],
      notes: 'Каждый пользователь должен нажать кнопку сам — у каждого свой `trigger_id`.',
      notesEn: 'Each user must click button themselves — each has their own `trigger_id`.',
    },
    {
      title: 'Форма заявки/запроса',
      titleEn: 'Request/application form',
      inline: false,
      related: [
        'Показать интерактивную форму пользователю',
        'Обработать отправку формы (view_submission)',
        'Создать напоминание',
      ],
      relatedEn: [
        'Show interactive form to user',
        'Handle form submission (view_submission)',
        'Create reminder',
      ],
      steps: [
        {
          description: 'Размести сообщение с кнопкой «Создать заявку»',
          descriptionEn: 'Post message with "Create request" button',
          command:
            'pachca messages create --entity-id=<chat_id> --content="Создать заявку" --buttons=\'[[{"text":"Создать заявку","data":"new_request"}]]\'',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'При нажатии открой форму с полями: тема, описание, приоритет',
          descriptionEn: 'On click open form with fields: subject, description, priority',
          command:
            'pachca views open --type=modal --trigger-id=<trigger_id> --title="Заявка" --blocks=\'[...]\'',
          apiMethod: 'POST',
          apiPath: '/views/open',
        },
        {
          description: 'При submit: создай задачу или отправь уведомление ответственному',
          descriptionEn: 'On submit: create task or send notification to assignee',
          command: 'pachca tasks create --kind=reminder --content="Заявка: ..." --due-at=<дата>',
          apiMethod: 'POST',
          apiPath: '/tasks',
        },
        {
          description: 'Отправь подтверждение автору',
          descriptionEn: 'Send confirmation to author',
          command:
            'pachca messages create --entity-type=user --entity-id=<user_id> --content="Заявка принята"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
        {
          description: 'Ответь HTTP 200 — форма закроется',
          descriptionEn: 'Respond HTTP 200 — form will close',
        },
      ],
    },
  ],
  'pachca-users': [
    {
      title: 'Получить сотрудника по ID',
      titleEn: 'Get employee by ID',
      steps: [
        {
          description: 'Получи информацию о сотруднике',
          descriptionEn: 'Get employee info',
          command: 'pachca users get <ID>',
          apiMethod: 'GET',
          apiPath: '/users/{id}',
        },
      ],
      notes: 'Возвращает все поля, включая `custom_properties`, `user_status`, `list_tags`.',
      notesEn: 'Returns all fields including `custom_properties`, `user_status`, `list_tags`.',
    },
    {
      title: 'Массовое создание сотрудников с тегами',
      titleEn: 'Bulk create employees with tags',
      related: ['Онбординг нового сотрудника', 'Получить всех сотрудников тега/департамента'],
      relatedEn: ['Onboard new employee', 'Get all employees of a tag/department'],
      steps: [
        {
          description: 'Создай тег (если нужен)',
          descriptionEn: 'Create tag (if needed)',
          command: 'pachca group-tags create --name="Backend"',
          apiMethod: 'POST',
          apiPath: '/group_tags',
        },
        {
          description: 'Для каждого сотрудника: создай аккаунт с тегами',
          descriptionEn: 'For each employee: create account with tags',
          command:
            'pachca users create --first-name="Иван" --last-name="Петров" --email="ivan@example.com" --list-tags=\'[{"name":"Backend"}]\'',
          apiMethod: 'POST',
          apiPath: '/users',
          notes: 'Теги назначаются через поле `list_tags` в теле запроса',
          notesEn: 'Tags are assigned via `list_tags` field in request body',
        },
        {
          description: 'Или обнови существующего',
          descriptionEn: 'Or update existing',
          command: 'pachca users update <ID> --list-tags=\'[{"name":"Backend"}]\'',
          apiMethod: 'PUT',
          apiPath: '/users/{id}',
        },
      ],
      notes:
        'Создание доступно только администраторам и владельцам (не ботам). Нет отдельного эндпоинта "добавить юзера в тег".',
      notesEn:
        'Creation available only to admins and owners (not bots). No separate "add user to tag" endpoint.',
    },
    {
      title: 'Найти сотрудника по имени или email',
      titleEn: 'Find employee by name or email',
      steps: [
        {
          description: 'Поиск по имени/email (частичное совпадение)',
          descriptionEn: 'Search by name/email (partial match)',
          command: 'pachca users list --query=Иван',
          apiMethod: 'GET',
          apiPath: '/users',
        },
      ],
      notes:
        'Пагинация cursor-based: `limit` и `cursor` из `meta`. Для точного email — перебери страницы.',
      notesEn:
        'Cursor-based pagination: `limit` and `cursor` from `meta`. For exact email — iterate pages.',
    },
    {
      title: 'Онбординг нового сотрудника',
      titleEn: 'Onboard new employee',
      related: [
        'Массовое создание сотрудников с тегами',
        'Offboarding сотрудника',
        'Создать канал и пригласить участников',
      ],
      relatedEn: [
        'Bulk create employees with tags',
        'Offboard employee',
        'Create channel and invite members',
      ],
      steps: [
        {
          description: 'Создай аккаунт',
          descriptionEn: 'Create account',
          command:
            'pachca users create --email="new@example.com" --first-name="Иван" --last-name="Петров"',
          apiMethod: 'POST',
          apiPath: '/users',
        },
        {
          description: 'Добавь в нужные каналы',
          descriptionEn: 'Add to required channels',
          command: "pachca members add <chat_id> --member-ids='[<user_id>]'",
          apiMethod: 'POST',
          apiPath: '/chats/{id}/members',
        },
        {
          description: 'Отправь welcome-сообщение',
          descriptionEn: 'Send welcome message',
          command:
            'pachca messages create --entity-type=user --entity-id=<user_id> --content="Добро пожаловать!"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
      notes: 'Шаг 1 требует токена администратора/владельца. Шаги 2-3 можно делать ботом.',
      notesEn: 'Step 1 requires admin/owner token. Steps 2-3 can be done by bot.',
    },
    {
      title: 'Offboarding сотрудника',
      titleEn: 'Offboard employee',
      related: ['Онбординг нового сотрудника'],
      relatedEn: ['Onboard new employee'],
      steps: [
        {
          description: 'Заблокировать доступ',
          descriptionEn: 'Suspend access',
          command: 'pachca users update <ID> --suspended',
          apiMethod: 'PUT',
          apiPath: '/users/{id}',
        },
        {
          description: 'Опционально: удалить аккаунт полностью',
          descriptionEn: 'Optionally: delete account permanently',
          command: 'pachca users delete <ID> --force',
          apiMethod: 'DELETE',
          apiPath: '/users/{id}',
        },
      ],
      notes: 'Приостановка (`suspended`) сохраняет данные, удаление — необратимо.',
      notesEn: 'Suspension (`suspended`) preserves data, deletion is irreversible.',
    },
    {
      title: 'Получить всех сотрудников тега/департамента',
      titleEn: 'Get all employees of a tag/department',
      steps: [
        {
          description: 'Найди тег по названию, возьми `id`',
          descriptionEn: 'Find tag by name, take `id`',
          command: 'pachca group-tags list --names=\'["Backend"]\'',
          apiMethod: 'GET',
          apiPath: '/group_tags',
          notes: 'Фильтр `names` — серверная фильтрация по названию тега',
          notesEn: '`names` filter — server-side filtering by tag name',
        },
        {
          description: 'Получи всех участников тега',
          descriptionEn: 'Get all tag members',
          command: 'pachca group-tags list-users <tag_id> --all',
          apiMethod: 'GET',
          apiPath: '/group_tags/{id}/users',
        },
      ],
    },
    {
      title: 'Управление статусом сотрудника',
      titleEn: 'Manage employee status',
      steps: [
        {
          description: 'Получить текущий статус',
          descriptionEn: 'Get current status',
          command: 'pachca users get-status <user_id>',
          apiMethod: 'GET',
          apiPath: '/users/{user_id}/status',
        },
        {
          description: 'Установить статус',
          descriptionEn: 'Set status',
          command:
            'pachca users update-status <user_id> --emoji="🏖️" --title="В отпуске" --is-away',
          apiMethod: 'PUT',
          apiPath: '/users/{user_id}/status',
          notes: '`is_away: true` — режим «Нет на месте». `away_message` — макс 1024 символа',
          notesEn: '`is_away: true` — away mode. `away_message` — max 1024 chars',
        },
        {
          description: 'Удалить статус',
          descriptionEn: 'Delete status',
          command: 'pachca users remove-status <user_id> --force',
          apiMethod: 'DELETE',
          apiPath: '/users/{user_id}/status',
        },
      ],
    },
  ],
  'pachca-tasks': [
    {
      title: 'Создать напоминание',
      titleEn: 'Create reminder',

      related: ['Получить список предстоящих задач', 'Создать серию напоминаний'],
      relatedEn: ['Get list of upcoming tasks', 'Create series of reminders'],
      steps: [
        {
          description: 'Создай задачу',
          descriptionEn: 'Create task',
          command:
            'pachca tasks create --kind=reminder --content="Позвонить клиенту" --due-at=<дата> --chat-id=<chat_id>',
          apiMethod: 'POST',
          apiPath: '/tasks',
          notes: '`chat_id` для привязки к чату, `custom_properties` для дополнительных полей',
          notesEn: '`chat_id` to link to chat, `custom_properties` for additional fields',
        },
      ],
      notes:
        'Тип `custom_properties[].value` всегда строка. Дополнительные поля: GET /custom_properties?entity_type=Task.',
      notesEn:
        '`custom_properties[].value` type is always string. Additional fields: GET /custom_properties?entity_type=Task.',
    },
    {
      title: 'Получить список предстоящих задач',
      titleEn: 'Get list of upcoming tasks',
      steps: [
        {
          description: 'Получи все задачи, фильтруй по `status` на клиенте',
          descriptionEn: 'Get all tasks, filter by `status` on client side',
          command: 'pachca tasks list --all',
          apiMethod: 'GET',
          apiPath: '/tasks',
          notes:
            '`status`: `"undone"` — не выполнена, `"done"` — выполнена. Фильтрация на API не поддерживается',
          notesEn:
            '`status`: `"undone"` — not completed, `"done"` — completed. API-side filtering not supported',
        },
      ],
    },
    {
      title: 'Получить задачу по ID',
      titleEn: 'Get task by ID',
      steps: [
        {
          description: 'Получи информацию о задаче',
          descriptionEn: 'Get task info',
          command: 'pachca tasks get <ID>',
          apiMethod: 'GET',
          apiPath: '/tasks/{id}',
        },
      ],
    },
    {
      title: 'Отметить задачу выполненной',
      titleEn: 'Mark task as completed',
      steps: [
        {
          description: 'Обнови статус задачи',
          descriptionEn: 'Update task status',
          command: 'pachca tasks update <ID> --status=done',
          apiMethod: 'PUT',
          apiPath: '/tasks/{id}',
        },
      ],
    },
    {
      title: 'Обновить задачу (перенести срок, сменить ответственных)',
      titleEn: 'Update task (reschedule, change assignees)',
      steps: [
        {
          description: 'Обнови нужные поля задачи',
          descriptionEn: 'Update task fields',
          command:
            "pachca tasks update <ID> --due-at=<дата> --priority=2 --performer-ids='[186,187]'",
          apiMethod: 'PUT',
          apiPath: '/tasks/{id}',
          notes:
            '`performer_ids` заменяет весь список. `priority`: 1 (обычный), 2 (важно), 3 (очень важно)',
          notesEn:
            '`performer_ids` replaces entire list. `priority`: 1 (normal), 2 (important), 3 (very important)',
        },
      ],
    },
    {
      title: 'Удалить задачу',
      titleEn: 'Delete task',
      steps: [
        {
          description: 'Удали задачу',
          descriptionEn: 'Delete task',
          command: 'pachca tasks delete <ID> --force',
          apiMethod: 'DELETE',
          apiPath: '/tasks/{id}',
        },
      ],
      notes: 'Удаление необратимо. Чтобы просто закрыть — используй PUT с `"status": "done"`.',
      notesEn: 'Deletion is irreversible. To just close — use PUT with `"status": "done"`.',
    },
    {
      title: 'Создать серию напоминаний',
      titleEn: 'Create series of reminders',
      steps: [
        {
          description: 'Подготовь список дат (ежедневно, еженедельно и т.д.)',
          descriptionEn: 'Prepare list of dates (daily, weekly, etc.)',
        },
        {
          description: 'Для каждой даты: создай задачу',
          descriptionEn: 'For each date: create task',
          command: 'pachca tasks create --kind=reminder --content="Напоминание" --due-at=<дата>',
          apiMethod: 'POST',
          apiPath: '/tasks',
        },
      ],
    },
  ],
  'pachca-profile': [
    {
      title: 'Получить свой профиль',
      titleEn: 'Get own profile',
      steps: [
        {
          description: 'Получи информацию о текущем пользователе',
          descriptionEn: 'Get current user info',
          command: 'pachca profile get',
          apiMethod: 'GET',
          apiPath: '/profile',
        },
      ],
      notes:
        'Возвращает `id`, `first_name`, `last_name`, `nickname`, `email`, `phone_number`, `department`, `title`, `role`, `suspended`, `invite_status`, `list_tags`, `custom_properties`, `user_status`, `bot`, `sso`, `created_at`, `last_activity_at`, `time_zone`, `image_url`.',
      notesEn:
        'Returns `id`, `first_name`, `last_name`, `nickname`, `email`, `phone_number`, `department`, `title`, `role`, `suspended`, `invite_status`, `list_tags`, `custom_properties`, `user_status`, `bot`, `sso`, `created_at`, `last_activity_at`, `time_zone`, `image_url`.',
    },
    {
      title: 'Проверить свой токен',
      titleEn: 'Verify own token',
      steps: [
        {
          description: 'Получи информацию о токене: скоупы, дату создания, срок жизни',
          descriptionEn: 'Get token info: scopes, creation date, lifetime',
          command: 'pachca profile get-info',
          apiMethod: 'GET',
          apiPath: '/oauth/token/info',
        },
      ],
      notes: 'Полезно для диагностики: какие скоупы доступны токену, когда он истекает.',
      notesEn: 'Useful for diagnostics: which scopes the token has, when it expires.',
    },
    {
      title: 'Установить статус',
      titleEn: 'Set status',
      steps: [
        {
          description: 'Установи статус',
          descriptionEn: 'Set status',
          command:
            'pachca profile update-status --emoji="🏖️" --title="В отпуске" --is-away --away-message="Я в отпуске до 10 марта" --expires-at="2025-03-10T23:59:59.000Z"',
          apiMethod: 'PUT',
          apiPath: '/profile/status',
          notes:
            '`is_away: true` — режим «Нет на месте». `expires_at` — автосброс (ISO-8601, UTC+0). `away_message` — макс 1024 символа',
          notesEn:
            '`is_away: true` — away mode. `expires_at` — auto-reset (ISO-8601, UTC+0). `away_message` — max 1024 chars',
        },
      ],
    },
    {
      title: 'Сбросить статус',
      titleEn: 'Reset status',
      steps: [
        {
          description: 'Удали статус',
          descriptionEn: 'Delete status',
          command: 'pachca profile delete-status --force',
          apiMethod: 'DELETE',
          apiPath: '/profile/status',
        },
      ],
    },
    {
      title: 'Получить кастомные поля профиля',
      titleEn: 'Get custom profile fields',

      steps: [
        {
          description: 'Получи список дополнительных полей для сотрудников',
          descriptionEn: 'Get list of additional fields for employees',
          command: 'pachca common custom-properties --entity-type=User',
          apiMethod: 'GET',
          apiPath: '/custom_properties',
          notes: 'Добавь `entity_type=User` для фильтрации',
          notesEn: 'Add `entity_type=User` to filter',
        },
        {
          description: 'Получи профиль — в `custom_properties` содержатся значения полей',
          descriptionEn: 'Get profile — `custom_properties` contains field values',
          command: 'pachca profile get',
          apiMethod: 'GET',
          apiPath: '/profile',
        },
      ],
      notes: 'Кастомные поля настраиваются администратором пространства.',
      notesEn: 'Custom fields are configured by workspace admin.',
    },
  ],
  'pachca-search': [
    {
      title: 'Найти сообщение по тексту',
      titleEn: 'Find message by text',
      steps: [
        {
          description: 'Полнотекстовый поиск по сообщениям',
          descriptionEn: 'Full-text search across messages',
          command: 'pachca search list-messages --query="текст"',
          apiMethod: 'GET',
          apiPath: '/search/messages',
          notes:
            '`limit` (до 200), `cursor`. Фильтры: `chat_ids[]`, `user_ids[]`, `active`, `created_from`/`created_to`',
          notesEn:
            '`limit` (up to 200), `cursor`. Filters: `chat_ids[]`, `user_ids[]`, `active`, `created_from`/`created_to`',
        },
      ],
      notes: 'Поиск по всем доступным чатам. `root_chat_id` в ответе — корневой чат для тредов.',
      notesEn: 'Searches all accessible chats. `root_chat_id` in response — root chat for threads.',
    },
    {
      title: 'Найти чат по названию',
      titleEn: 'Find chat by name',
      steps: [
        {
          description: 'Полнотекстовый поиск по чатам',
          descriptionEn: 'Full-text search across chats',
          command: 'pachca search list-chats --query="название"',
          apiMethod: 'GET',
          apiPath: '/search/chats',
          notes:
            '`limit` (до 100), `cursor`. Фильтры: `active`, `chat_subtype`, `personal`, `created_from`/`created_to`',
          notesEn:
            '`limit` (up to 100), `cursor`. Filters: `active`, `chat_subtype`, `personal`, `created_from`/`created_to`',
        },
      ],
    },
    {
      title: 'Найти сотрудника по имени',
      titleEn: 'Find employee by name',
      steps: [
        {
          description: 'Полнотекстовый поиск по сотрудникам',
          descriptionEn: 'Full-text search across employees',
          command: 'pachca search list-users --query="имя"',
          apiMethod: 'GET',
          apiPath: '/search/users',
          notes:
            '`sort=alphabetical` для алфавитного порядка, `sort=by_score` (по умолчанию). Фильтры: `company_roles[]`, `created_from`/`created_to`',
          notesEn:
            '`sort=alphabetical` for alphabetical order, `sort=by_score` (default). Filters: `company_roles[]`, `created_from`/`created_to`',
        },
      ],
      notes: 'Поиск по имени, email, должности и другим полям. Поддерживает сортировку по релевантности.',
      notesEn: 'Searches by name, email, title and other fields. Supports sorting by relevance.',
    },
  ],
  'pachca-security': [
    {
      title: 'Получить журнал аудита событий',
      titleEn: 'Get audit event log',
      related: ['Мониторинг подозрительных входов', 'Экспорт логов за период'],
      relatedEn: ['Monitor suspicious logins', 'Export logs for period'],
      steps: [
        {
          description: 'Получи журнал аудита',
          descriptionEn: 'Get audit log',
          command: 'pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601>',
          apiMethod: 'GET',
          apiPath: '/audit_events',
          notes:
            '`start_time` и `end_time` обязательны (ISO-8601, UTC+0). Фильтры: `event_key`, `actor_id`, `actor_type`, `entity_id`, `entity_type`',
          notesEn:
            '`start_time` and `end_time` required (ISO-8601, UTC+0). Filters: `event_key`, `actor_id`, `actor_type`, `entity_id`, `entity_type`',
        },
      ],
      notes: 'Доступно только владельцу пространства.',
      notesEn: 'Available only to workspace owner.',
    },
    {
      title: 'Мониторинг подозрительных входов',
      titleEn: 'Monitor suspicious logins',
      related: ['Получить журнал аудита событий', 'Мониторинг и алерты'],
      relatedEn: ['Get audit event log', 'Monitoring and alerts'],
      steps: [
        {
          description: 'Получи события неудачных 2FA за период',
          descriptionEn: 'Get failed 2FA events for period',
          command:
            'pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --event-key=user_2fa_fail --all',
          apiMethod: 'GET',
          apiPath: '/audit_events',
        },
        {
          description: 'Если найдены аномалии — отправь уведомление администратору',
          descriptionEn: 'If anomalies found — send notification to admin',
          command:
            'pachca messages create --entity-type=user --entity-id=<admin_id> --content="Обнаружены подозрительные входы"',
          apiMethod: 'POST',
          apiPath: '/messages',
        },
      ],
    },
    {
      title: 'Экспорт логов за период',
      titleEn: 'Export logs for period',
      related: ['Получить журнал аудита событий'],
      relatedEn: ['Get audit event log'],
      steps: [
        {
          description: 'Получи все события за период с пагинацией',
          descriptionEn: 'Get all events for period with pagination',
          command: 'pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --all',
          apiMethod: 'GET',
          apiPath: '/audit_events',
        },
        {
          description:
            'Собери все события в массив → сохрани в файл или отправь во внешнюю систему',
          descriptionEn: 'Collect all events into array → save to file or send to external system',
        },
      ],
    },
  ],
};
