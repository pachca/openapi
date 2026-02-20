interface Workflow {
  title: string;
  steps: string[];
  notes?: string;
  curl?: string;
}

export const WORKFLOWS: Record<string, Workflow[]> = {
  'pachca-messages': [
    {
      title: 'Найти чат по имени и отправить сообщение',
      steps: [
        'GET /chats — перебери результаты, найди нужный по полю name',
        'Отправь POST /messages с entity_id: chat.id',
      ],
      notes:
        'entity_type по умолчанию "discussion", можно не указывать. GET /chats не поддерживает поиск по имени — перебирай страницы.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_id":12345,"content":"Текст сообщения"}}'`,
    },
    {
      title: 'Отправить сообщение в канал или беседу (если chat_id известен)',
      steps: ['Отправь POST /messages с entity_id: chat_id'],
      notes: 'entity_type: "discussion" используется по умолчанию, можно не указывать',
    },
    {
      title: 'Отправить личное сообщение пользователю',
      steps: [
        'Определи user_id получателя (GET /users или из контекста)',
        'Отправь POST /messages с entity_type: "user", entity_id: user_id',
      ],
      notes: 'Создавать чат НЕ требуется — он создаётся автоматически',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_type":"user","entity_id":186,"content":"Привет!"}}'`,
    },
    {
      title: 'Ответить в тред (комментарий к сообщению)',
      steps: [
        'Получи или создай тред: POST /messages/{message_id}/thread (message_id — id родительского сообщения)',
        'Из ответа возьми id треда (thread.id)',
        'Отправь POST /messages с entity_type: "thread", entity_id: thread.id',
      ],
      notes:
        'Если тред уже существует, POST /messages/{id}/thread вернёт существующий. Альтернативно можно использовать entity_type: "discussion" + entity_id: thread.chat_id.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/154332686/thread" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":265142,"chat_id":2637266155,"message_id":154332686,...}}

curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_type":"thread","entity_id":265142,"content":"Ответ в тред"}}'`,
    },
    {
      title: 'Отправить сообщение с файлом',
      steps: [
        'Получи параметры загрузки: POST /uploads → вернёт key (с $filename), direct_url, policy, подпись',
        'Загрузи файл: POST на direct_url (multipart/form-data, без авторизации) с параметрами из шага 1',
        'Подставь имя файла вместо $filename в key',
        'Отправь POST /messages, передав массив files с полученным key',
      ],
      notes:
        'Файлы НЕ передаются inline. Загрузка двухшаговая: сначала POST /uploads (параметры), затем POST на direct_url (сам файл на S3).',
      curl: `curl "https://api.pachca.com/api/shared/v1/uploads" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"key":".../$filename","direct_url":"https://...","policy":"...","x-amz-signature":"...",...}

curl -X POST <direct_url> \\
  -F "Content-Disposition=attachment" -F "acl=private" \\
  -F "policy=<policy>" -F "x-amz-credential=<credential>" \\
  -F "x-amz-algorithm=<algorithm>" -F "x-amz-date=<date>" \\
  -F "x-amz-signature=<signature>" \\
  -F "key=<key_с_подставленным_именем>" -F "file=@report.pdf"

curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_id":12345,"content":"Смотри файл","files":[{"key":"uploads/.../report.pdf","name":"report.pdf","file_type":"file","size":12345}]}}'`,
    },
    {
      title: 'Отправить сообщение с кнопками',
      steps: [
        'Сформируй массив buttons — массив строк, каждая строка — массив кнопок: `[[{кнопка1, кнопка2}, ...], ...]`',
        'Каждая кнопка: `{text: "Текст"}` + либо `url` (ссылка), либо `data` (callback для вебхука)',
        'Отправь POST /messages с полем buttons',
        'Нажатия кнопок приходят в исходящий вебхук (событие "Нажатие кнопок")',
      ],
      notes:
        'buttons — массив массивов (строки × кнопки). Максимум 100 кнопок, до 8 в строке. Кнопка с `url` открывает ссылку, с `data` — отправляет событие на вебхук.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_id":12345,"content":"Выбери действие","buttons":[[{"text":"Подробнее","url":"https://example.com"},{"text":"Отлично!","data":"awesome"}]]}}'`,
    },
    {
      title: 'Получить историю сообщений чата',
      steps: [
        'GET /messages?chat_id={id}',
        'Пагинация: limit (1-50, по умолчанию 50) и cursor (из meta.paginate.next_page)',
        'Сортировка: sort[id]=asc или sort[id]=desc (по умолчанию desc)',
      ],
      notes:
        'Для сообщений треда используй chat_id треда (thread.chat_id). Пагинация cursor-based, НЕ page-based.',
    },
    {
      title: 'Закрепить/открепить сообщение',
      steps: ['Закрепить: POST /messages/{id}/pin', 'Открепить: DELETE /messages/{id}/pin'],
      notes: 'В чате может быть только одно закреплённое сообщение.',
    },
    {
      title: 'Подписаться на тред сообщения',
      steps: [
        'POST /messages/{message_id}/thread — если треда нет, он будет создан; если есть — вернётся существующий',
        'Из ответа возьми chat_id треда (data.chat_id)',
        'Добавь бота (или пользователя) в участники чата треда: POST /chats/{chat_id}/members с member_ids',
        'Теперь бот будет получать вебхук-события о новых сообщениях в этом треде',
      ],
      notes:
        'POST /messages/{id}/thread идемпотентен — безопасно вызывать повторно. После добавления в участники бот получает события треда через исходящий вебхук.',
    },
  ],
  'pachca-chats': [
    {
      title: 'Создать канал и пригласить участников',
      steps: [
        'POST /chats — channel: true для канала, false (по умолчанию) для беседы',
        'Участников можно передать сразу при создании: member_ids и/или group_tag_ids в теле запроса',
        'Или добавить позже: POST /chats/{id}/members с member_ids, POST /chats/{id}/group_tags с group_tag_ids',
      ],
      notes: 'channel — boolean, не строка. member_ids и group_tag_ids — опциональны при создании.',
      curl: `curl "https://api.pachca.com/api/shared/v1/chats" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"chat":{"name":"Новый канал","channel":true,"member_ids":[1,2,3]}}'`,
    },
    {
      title: 'Архивация и управление чатом',
      steps: [
        'Архивировать: PUT /chats/{id}/archive',
        'Разархивировать: PUT /chats/{id}/unarchive',
        'Изменить роль участника: PUT /chats/{chatId}/members/{userId} с role (admin|editor|member)',
        'Удалить участника: DELETE /chats/{chatId}/members/{userId}',
        'Покинуть чат: DELETE /chats/{id}/leave',
      ],
    },
  ],
  'pachca-bots': [
    {
      title: 'Настроить бота с исходящим вебхуком',
      steps: [
        'Создай бота в интерфейсе Пачки: Автоматизации → Интеграции → Webhook',
        'Получи access_token бота во вкладке «API» настроек бота',
        'Укажи Webhook URL для получения событий',
        'Выбери типы событий: новые сообщения, реакции, кнопки, участники',
      ],
      notes:
        'Бот создаётся через UI, не через API. Единственный эндпоинт для ботов — PUT /bots/{id} (обновление webhook URL). API используется для отправки сообщений от имени бота.',
    },
    {
      title: 'Обработать входящий вебхук-событие',
      steps: [
        'Получи POST-запрос на свой Webhook URL',
        'Проверь подпись (Signing secret) для безопасности',
        'Проверь webhook_timestamp — должен быть в пределах 1 минуты',
        'Разбери JSON: тип события, данные',
        'Для полной информации сделай запрос к API (например, GET /messages/{id})',
      ],
      notes: 'Вебхук содержит минимум данных. Для полной информации используй API.',
    },
    {
      title: 'Разворачивание ссылок (unfurling)',
      steps: [
        'Настрой бота на получение событий о ссылках',
        'При получении вебхук-события с URL — извлеки данные из своей системы',
        'Отправь POST /messages/{message_id}/link_previews с превью-данными',
      ],
      notes: 'Эндпоинт привязан к конкретному сообщению. Бот должен иметь включённый unfurling.',
    },
  ],
  'pachca-forms': [
    {
      title: 'Показать интерактивную форму пользователю',
      steps: [
        'Заранее подготовь объект формы (view с title и blocks) — собери его ДО получения trigger_id',
        'Отправь сообщение с кнопкой (POST /messages с buttons, в data кнопки передай идентификатор формы)',
        'При нажатии кнопки — получи вебхук-событие с trigger_id',
        'Немедленно отправь POST /views/open с trigger_id и готовым объектом формы',
        'Пользователь заполняет форму → результат приходит на Webhook URL',
      ],
      notes:
        'trigger_id живёт 3 секунды — за это время нужно успеть отправить POST /views/open. Формируй объект формы заранее, а не после получения события. Формы работают только от бота (GET /profile → data.bot === true).',
    },
  ],
  'pachca-users': [
    {
      title: 'Массовое создание сотрудников с тегами',
      steps: [
        'Создай тег (если нужен): POST /group_tags с { group_tag: { name } }',
        'Для каждого сотрудника: POST /users — теги назначаются через поле list_tags в теле запроса',
        'Или обнови существующего: PUT /users/{id} с list_tags',
      ],
      notes:
        'Создание сотрудников доступно только администраторам и владельцам (не ботам). Нет отдельного эндпоинта "добавить юзера в тег" — теги назначаются через list_tags в POST/PUT /users.',
    },
  ],
  'pachca-security': [
    {
      title: 'Получить журнал аудита событий',
      steps: [
        'GET /audit_events с фильтрами (event_key, период, пагинация)',
        'Доступные типы событий: входы, изменения прав, действия с чатами и т.д.',
      ],
      notes: 'Доступно только владельцу пространства.',
    },
  ],
};
