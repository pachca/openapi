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
        'GET /chats — перебери результаты, найди нужный по полю `name`',
        'Отправь POST /messages с `"entity_id": chat.id`',
      ],
      notes:
        '`entity_type` по умолчанию `"discussion"`, можно не указывать. GET /chats не поддерживает поиск по имени — перебирай страницы.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_id":12345,"content":"Текст сообщения"}}'`,
    },
    {
      title: 'Отправить сообщение в канал или беседу (если chat_id известен)',
      steps: ['Отправь POST /messages с `"entity_id": chat_id`'],
      notes: '`"entity_type": "discussion"` используется по умолчанию, можно не указывать',
    },
    {
      title: 'Отправить личное сообщение пользователю',
      steps: [
        'Определи `user_id` получателя (GET /users или из контекста)',
        'Отправь POST /messages с `"entity_type": "user"`, `"entity_id": user_id`',
      ],
      notes: 'Создавать чат не требуется — он создаётся автоматически',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_type":"user","entity_id":186,"content":"Привет!"}}'`,
    },
    {
      title: 'Ответить в тред (комментарий к сообщению)',
      steps: [
        'Получи или создай тред: POST /messages/{id}/thread (`id` — id родительского сообщения)',
        'Из ответа возьми id треда (`thread.id`)',
        'Отправь POST /messages с `"entity_type": "thread"`, `"entity_id": thread.id`',
      ],
      notes:
        'Если тред уже существует, POST /messages/{id}/thread вернёт существующий. Альтернативно можно использовать `"entity_type": "discussion"` + `"entity_id": thread.chat_id`. `skip_invite_mentions: true` — не добавлять упомянутых пользователей в тред автоматически.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/154332686/thread" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":265142,"chat_id":2637266155,"message_id":154332686,...}}

curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_type":"thread","entity_id":265142,"content":"Ответ в тред"}}'`,
    },
    {
      title: 'Ответить пользователю, который написал боту',
      steps: [
        'Вебхук содержит `entity_type` — он однозначно определяет контекст: `"user"` — личное сообщение боту, `"thread"` — сообщение в треде, `"discussion"` — сообщение в канале или беседе',
        'DM (`entity_type: "user"`): ответь POST /messages с `"entity_type": "user"`, `"entity_id"`: `user_id` из вебхука',
        'Тред (`entity_type: "thread"`): вложенных тредов нет — ответь в тот же тред: POST /messages с `"entity_type": "thread"`, `"entity_id"`: `entity_id` из вебхука, `"parent_message_id"`: `id` сообщения пользователя из вебхука',
        'Беседа/канал (`entity_type: "discussion"`): выбери стратегию — inline-ответ (POST /messages c `"parent_message_id"`: `id` сообщения) или тред (POST /messages/{id}/thread → ответ в тред)',
      ],
      notes:
        '`parent_message_id` визуально привязывает ответ к конкретному сообщению (показывается как «в ответ на…»). В треде обязателен для цепочки диалога. В обычном чате — альтернатива треду. Если бота вызвали в треде и других сообщений в треде нет — основной контекст в родительском сообщении треда. В вебхуке уже есть `thread.message_id` — получи родительское сообщение: GET /messages/{id}.',
    },
    {
      title: 'Отправить сообщение с файлами',
      steps: [
        'Для каждого файла: POST /uploads → получи `key` (с `${filename}`), `direct_url`, `policy`, подпись',
        'Для каждого файла: подставь имя файла вместо `${filename}` в `key`, затем загрузи файл POST на `direct_url` (`multipart/form-data`, без авторизации)',
        'Собери массив `files` из всех загруженных файлов (`key`, `name`, `file_type`, `size`)',
        'Отправь POST /messages с массивом `files` — одно сообщение со всеми файлами',
      ],
      notes:
        'Файлы не передаются inline. Загрузка двухшаговая: сначала POST /uploads (параметры), затем POST на `direct_url` (сам файл на S3). Шаги 1-2 повторяются для каждого файла отдельно, а сообщение отправляется один раз со всеми файлами.',
      curl: `curl "https://api.pachca.com/api/shared/v1/uploads" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"key":".../\${filename}","direct_url":"https://...","policy":"...","x-amz-signature":"...",...}

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
        'Сформируй массив `buttons` — массив строк, каждая строка — массив кнопок: `[[{кнопка1, кнопка2}, ...], ...]`',
        'Каждая кнопка: `{"text": "Текст"}` + либо `url` (ссылка), либо `data` (callback для вебхука)',
        'Отправь POST /messages с полем `buttons`',
        'Нажатия кнопок приходят в исходящий вебхук (событие "Нажатие кнопок")',
      ],
      notes:
        '`buttons` — массив массивов (строки × кнопки). Максимум 100 кнопок, до 8 в строке. Кнопка с `url` открывает ссылку, с `data` — отправляет событие на вебхук.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_id":12345,"content":"Выбери действие","buttons":[[{"text":"Подробнее","url":"https://example.com"},{"text":"Отлично!","data":"awesome"}]]}}'`,
    },
    {
      title: 'Получить историю сообщений чата',
      steps: [
        'GET /messages?chat_id={id}',
        'Пагинация: `limit` (1-50, по умолчанию 50) и `cursor` (из `meta.paginate.next_page`)',
        'Сортировка: `sort[id]=asc` или `sort[id]=desc` (по умолчанию `"desc"`)',
      ],
      notes:
        'Для сообщений треда используй `chat_id` треда (`thread.chat_id`). Пагинация cursor-based, не page-based.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages?chat_id=12345&limit=50&sort[id]=asc" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Получить вложения из сообщения',
      steps: [
        'GET /messages/{id} — в поле `files[]` каждый объект содержит `url` (прямая ссылка), `name`, `file_type`, `size`',
        'Скачай нужные файлы по `files[].url` — ссылка прямая, авторизация не требуется',
      ],
      notes:
        'Вебхук о новом сообщении НЕ содержит вложений — поле `files` отсутствует даже если файлы есть. При анализе любого сообщения (из вебхука, из истории чата) всегда проверяй вложения через GET /messages/{id} — если `files` непустой, в сообщении есть файлы, которые могут быть важны для контекста.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/154332686" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":154332686,"content":"Смотри файл","files":[{"url":"https://...","name":"report.pdf","file_type":"file","size":12345}],...}}`,
    },
    {
      title: 'Закрепить/открепить сообщение',
      steps: ['Закрепить: POST /messages/{id}/pin', 'Открепить: DELETE /messages/{id}/pin'],
      notes: 'В чате может быть несколько закреплённых сообщений.',
    },
    {
      title: 'Подписаться на тред сообщения',
      steps: [
        'POST /messages/{id}/thread — если треда нет, он будет создан; если есть — вернётся существующий',
        'Из ответа возьми `chat_id` треда (`data.chat_id`)',
        'Добавь бота (или пользователя) в участники чата треда: POST /chats/{id}/members с `member_ids`',
        'Теперь бот будет получать вебхук-события о новых сообщениях в этом треде',
      ],
      notes:
        'POST /messages/{id}/thread идемпотентен — безопасно вызывать повторно. После добавления в участники бот получает события треда через исходящий вебхук.',
    },
    {
      title: 'Упомянуть пользователя по имени',
      steps: [
        'Определи поисковый запрос — используй фамилию, она уникальнее. Имена не склоняются в API, приводи к именительному падежу: «упомяни Пашу» → ищи `Паша` или `Павел`, «тегни Голубева» → ищи `Голубев`',
        'Ищи сначала среди участников целевого чата: GET /chats/{id}/members (для треда тоже работает, у него свои участники) — фильтруй по имени на клиенте',
        'Если пишешь в тред: также проверь участников родительского чата (GET /chats/{id}/members с `id=message_chat_id`)',
        'Не нашёл — ищи по всей компании: GET /users?query={запрос}',
        'Один подходящий результат → используй `nickname`. Несколько → уточни у пользователя (имя + фамилия). Ничего → попробуй другую форму имени (уменьшительное ↔ полное)',
        'Вставь `@nickname` в текст сообщения',
      ],
      notes:
        'Поиск среди участников чата точнее — пользователь явно связан с контекстом, меньше вероятность спутать однофамильцев. GET /users?query — последний fallback для поиска по всей компании.',
      curl: `curl "https://api.pachca.com/api/shared/v1/chats/12345/members" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: [{"id":42,"first_name":"Павел","last_name":"Голубев","nickname":"golubevpn",...}]

curl "https://api.pachca.com/api/shared/v1/messages" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"entity_id":12345,"content":"@golubevpn, митинг перенесён"}}'`,
    },
    {
      title: 'Отредактировать сообщение',
      steps: ['PUT /messages/{id} с полем `content` (и/или `buttons`, `files`)'],
      notes: 'Редактировать можно только свои сообщения (или от имени бота).',
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/messages/154332686" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"content":"Обновлённый текст"}}'`,
    },
    {
      title: 'Изменить вложения сообщения',
      steps: [
        'GET /messages/{id} — получи текущие вложения из поля `files[]`, сохрани нужные объекты (`key`, `name`, `file_type`, `size`)',
        'Если нужно добавить новый файл: POST /uploads → загрузи файл → добавь объект в список',
        'PUT /messages/{id} с массивом `files` — только те файлы, которые должны остаться (+ новые при необходимости)',
      ],
      notes:
        '`files` при редактировании работает по принципу replace-all: присылаемый массив полностью заменяет текущие вложения, отсутствующие файлы удаляются. `files: []` удаляет все вложения. Если поле `files` не передавать — вложения не меняются.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/154332686" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"files":[{"key":"uploads/.../a.pdf","name":"a.pdf","file_type":"file","size":1000},{"key":"uploads/.../b.pdf","name":"b.pdf","file_type":"file","size":2000}],...}}

curl -X PUT "https://api.pachca.com/api/shared/v1/messages/154332686" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":{"files":[{"key":"uploads/.../a.pdf","name":"a.pdf","file_type":"file","size":1000}]}}'`,
    },
    {
      title: 'Удалить сообщение',
      steps: ['DELETE /messages/{id}'],
      curl: `curl -X DELETE "https://api.pachca.com/api/shared/v1/messages/154332686" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Добавить реакцию на сообщение',
      steps: [
        'POST /messages/{id}/reactions с полем `code` (emoji)',
        'Убрать реакцию: DELETE /messages/{id}/reactions с полем `code`',
      ],
      notes: '`code` — emoji-символ, не его текстовое название.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/154332686/reactions" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"code":"👍"}'`,
    },
    {
      title: 'Проверить, кто прочитал сообщение',
      steps: [
        'GET /messages/{id}/read_member_ids — возвращает массив `user_id` прочитавших',
        'При необходимости сопоставь с GET /users для получения имён',
      ],
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/154332686/read_member_ids" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Разослать уведомление нескольким пользователям',
      steps: [
        'Определи список `user_id` получателей (GET /users или из контекста)',
        'Для каждого: POST /messages с `"entity_type": "user"`, `"entity_id": user_id`',
      ],
      notes: 'Соблюдай rate limit: ~4 req/sec для сообщений. Добавляй паузы при большом списке.',
    },
  ],
  'pachca-chats': [
    {
      title: 'Создать канал и пригласить участников',
      steps: [
        'POST /chats — `"channel": true` для канала, `false` (по умолчанию) для беседы',
        'Участников можно передать сразу при создании: `member_ids` и/или `group_tag_ids` в теле запроса',
        'Или добавить позже: POST /chats/{id}/members с `member_ids`, POST /chats/{id}/group_tags с `group_tag_ids`',
      ],
      notes:
        '`channel` — boolean, не строка. `member_ids` и `group_tag_ids` — опциональны при создании.',
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
        'Изменить роль участника: PUT /chats/{id}/members/{user_id} с `role` (`"admin"` | `"member"`; `"editor"` — только для каналов). Роль создателя чата изменить нельзя.',
        'Удалить участника: DELETE /chats/{id}/members/{user_id}',
        'Покинуть чат: DELETE /chats/{id}/leave',
      ],
    },
    {
      title: 'Переименовать или обновить чат',
      steps: [
        'PUT /chats/{id} с нужными параметрами: `name` (название) и/или `public` (открытый доступ)',
      ],
      notes:
        'Доступные для обновления поля: `name`, `public`. Для изменения состава участников используй POST/DELETE /chats/{id}/members.',
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/chats/12345" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"chat":{"name":"Новое название канала","public":true}}'`,
    },
    {
      title: 'Создать проектную беседу из шаблона',
      steps: [
        'POST /chats с `name`, `"channel": false` и `group_tag_ids` (добавить всех участников тега сразу)',
        'Или POST /chats → затем POST /chats/{id}/members с `member_ids` + POST /chats/{id}/group_tags с `group_tag_ids`',
        'Отправь приветственное сообщение: POST /messages с `"entity_id": chat.id`',
      ],
      notes:
        '`group_tag_ids` при создании добавляет всех участников тега сразу — удобнее, чем добавлять поштучно.',
      curl: `curl "https://api.pachca.com/api/shared/v1/chats" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"chat":{"name":"Проект Alpha","channel":false,"group_tag_ids":[42],"member_ids":[186,187]}}'`,
    },
    {
      title: 'Экспорт истории чата',
      steps: [
        'POST /chats/exports с `start_at`, `end_at` (формат YYYY-MM-DD) и обязательным `webhook_url` — запрос выполняется асинхронно',
        'Дождись вебхука на `webhook_url`: придёт JSON с `"type": "export"`, `"event": "ready"` и полем `export_id` — по `"type": "export"` можно отличить от других вебхуков',
        'GET /chats/exports/{id} — сервер вернёт 302, большинство HTTP-клиентов скачают файл автоматически',
      ],
      notes:
        '`webhook_url` обязателен — без него невозможно получить `export_id`. POST не возвращает id в ответе. Экспорт доступен только Владельцу пространства на тарифе «Корпорация». Максимальный период: 45 дней (366 дней при указании конкретных чатов).',
      curl: `curl "https://api.pachca.com/api/shared/v1/chats/exports" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"start_at":"$START_DATE","end_at":"$END_DATE","webhook_url":"$WEBHOOK_URL"}'`,
    },
    {
      title: 'Найти активные чаты за период',
      steps: [
        'GET /chats с `last_message_at_after={дата}` — только чаты с активностью после указанной даты',
        'Для диапазона добавь `last_message_at_before={дата}` — чаты с активностью между двумя датами',
        'Перебери страницы: `cursor` из `meta.paginate.next_page`, пока он не пустой',
      ],
      notes:
        'Дата в формате ISO-8601 UTC+0: `YYYY-MM-DDThh:mm:ss.sssZ`. Для «последних N дней» вычисли `now - N days` в UTC.',
      curl: `curl "https://api.pachca.com/api/shared/v1/chats?last_message_at_after=$DATE_FROM&limit=50" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Найти и заархивировать неактивные чаты',
      steps: [
        'GET /chats с `last_message_at_before={порог}` — сразу только чаты без активности с нужной даты',
        'Перебери страницы: `cursor` из `meta.paginate.next_page`, пока он не пустой',
        'Для каждого чата: PUT /chats/{id}/archive',
      ],
      notes:
        'Проверяй `"channel": false` — архивация каналов может быть нежелательной. Уточняй у владельца перед массовой архивацией.',
      curl: `curl "https://api.pachca.com/api/shared/v1/chats?last_message_at_before=$DATE_BEFORE&limit=50" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
  ],
  'pachca-bots': [
    {
      title: 'Настроить бота с исходящим вебхуком',
      steps: [
        'Создай бота в интерфейсе Пачки: Автоматизации → Интеграции → Webhook',
        'Получи `access_token` бота во вкладке «API» настроек бота',
        'Укажи Webhook URL для получения событий',
        'Выбери типы событий: новые сообщения, реакции, кнопки, участники',
      ],
      notes:
        'Бот создаётся через UI, не через API. Единственный эндпоинт для ботов — PUT /bots/{id} (обновление webhook URL). API используется для отправки сообщений от имени бота.',
    },
    {
      title: 'Обновить Webhook URL бота',
      steps: [
        'PUT /bots/{id} с новым `outgoing_url` — `id` бота (его `user_id`) можно узнать во вкладке «API» настроек бота',
      ],
      notes:
        'Обновлять настройки может только тот, кому разрешено редактирование бота (поле «Кто может редактировать настройки бота» во вкладке «Основное»).',
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/bots/1738816" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"bot":{"webhook":{"outgoing_url":"https://example.com/webhook"}}}'`,
    },
    {
      title: 'Обработать входящий вебхук-событие',
      steps: [
        'Получи POST-запрос на свой Webhook URL',
        'Проверь подпись (Signing secret) для безопасности',
        'Проверь `webhook_timestamp` — должен быть в пределах 1 минуты',
        'Разбери JSON: тип события, данные',
        'Для полной информации сделай запрос к API: GET /messages/{id} — особенно важно для получения вложений (`files[]`), которых нет в вебхуке',
      ],
      notes:
        'Вебхук содержит минимум данных — файлы (`files`) в нём отсутствуют. Если сообщение может содержать вложения, всегда запрашивай GET /messages/{id}.',
    },
    {
      title: 'Разворачивание ссылок (unfurling)',
      steps: [
        'Создай специального Unfurl-бота и укажи отслеживаемые домены в его настройках',
        'При появлении ссылки бот получает вебхук `"event": "link_shared"` с массивом `links` (`url` + `domain`) и `message_id`',
        'Извлеки данные из своей системы по URL из `links`',
        'Отправь POST /messages/{id}/link_previews с превью-данными',
      ],
      notes:
        'Эндпоинт привязан к конкретному сообщению. Необходим специальный Unfurl-бот с указанными доменами.',
      curl: `curl "https://api.pachca.com/api/shared/v1/messages/56431/link_previews" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"link_previews":{"https://example.com/article":{"title":"Заголовок статьи","description":"Краткое описание","image_url":"https://example.com/img.png"}}}'`,
    },
    {
      title: 'Обработать нажатие кнопки (callback)',
      steps: [
        'Получи вебхук с `"event": "message_button_clicked"` — в payload: `data` (из кнопки), `user_id`, `message_id`',
        'Выполни нужное действие (запись в БД, запрос к API и т.д.)',
        'Ответь пользователю: POST /messages с `"entity_type": "user"`, `"entity_id": user_id` из вебхука',
        'Опционально: обнови исходное сообщение через PUT /messages/{id} — чтобы убрать кнопки передай `"buttons": []`, чтобы изменить текст — передай `"content"`',
      ],
      notes:
        'Кнопка с `data` отправляет событие на вебхук. Кнопка с `url` — открывает ссылку (вебхука не будет).',
    },
    {
      title: 'Периодический дайджест/отчёт',
      steps: [
        'По расписанию (cron/scheduler): собери данные из своей системы',
        'Сформируй текст сообщения с нужными метриками или сводкой',
        'POST /messages с `"entity_id": chat_id` нужного канала',
      ],
      notes:
        'Нет встроенного планировщика — используй cron, celery, sidekiq и т.п. на своей стороне.',
    },
    {
      title: 'Мониторинг и алерты',
      steps: [
        'Внешняя система (CI, мониторинг, сервис) обнаруживает событие (ошибка, деплой, порог метрики)',
        'Делает POST запрос к твоему боту или напрямую вызывает Pachca API',
        'POST /messages в канал алертов с описанием события и кнопками «Взять в работу» / «Игнорировать»',
        'При нажатии кнопки — обработай callback и обнови статус алерта',
      ],
    },
    {
      title: 'Обработка событий через историю (polling)',
      steps: [
        'В настройках бота включи «Сохранять историю событий» (вкладка «Исходящий webhook»). Webhook URL указывать не обязательно.',
        'По расписанию или по запросу: GET /webhooks/events — получи накопленные события с пагинацией (`limit`, `cursor`)',
        'Обработай каждое событие (тот же формат payload, что и в real-time вебхуке)',
        'После обработки: DELETE /webhooks/events/{id} — удали событие, чтобы не обработать повторно',
      ],
      notes:
        'Polling — альтернатива real-time вебхуку, если у бота нет публичного URL или нужна отложенная обработка. Подходит для batch-сценариев, скриптов, serverless-функций по расписанию.',
      curl: `curl "https://api.pachca.com/api/shared/v1/webhooks/events?limit=50" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
  ],
  'pachca-forms': [
    {
      title: 'Показать интерактивную форму пользователю',
      steps: [
        'Заранее подготовь объект формы: `view` с `title`, `blocks` (типы: `input`, `select`, `radio`, `checkbox`, `date`, `time`, `file_input`, `header`, `plain_text`, `markdown`, `divider`), опционально `callback_id` (идентификатор формы) и `private_metadata` (контекст, например id сообщения)',
        'Отправь сообщение с кнопкой (POST /messages с `buttons`, в `data` кнопки передай идентификатор формы)',
        'При нажатии кнопки — получи вебхук-событие с `trigger_id`',
        'Немедленно отправь POST /views/open с `trigger_id` и готовым объектом формы',
        'Пользователь заполняет форму → при отправке получи вебхук — обработай по сценарию «Обработать отправку формы»',
      ],
      notes:
        '`trigger_id` живёт 3 секунды — за это время нужно успеть отправить POST /views/open. Формируй объект формы заранее, а не после получения события. Формы работают только от бота.',
      curl: `curl "https://api.pachca.com/api/shared/v1/views/open" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"modal","trigger_id":"abc123","view":{"title":"Заявка на отпуск","callback_id":"vacation_form","private_metadata":"{\\"msg_id\\":154332686}","blocks":[{"type":"input","name":"date_start","label":"Дата начала"},{"type":"input","name":"date_end","label":"Дата окончания"},{"type":"select","name":"reason","label":"Причина","options":[{"text":"Отпуск","value":"vacation"},{"text":"Больничный","value":"sick"}]}]}}'`,
    },
    {
      title: 'Обработать отправку формы (view_submission)',
      steps: [
        'Получи вебхук с `"type": "view"`, `"event": "submit"` — содержит `callback_id`, `user_id`, `private_metadata` и `data` (значения полей, ключи совпадают с полем `name` каждого блока)',
        'Извлеки значения из `data`: например, для блока с `"name": "comment"` значение в `data.comment`',
        'Если форма содержит `file_input` — скачай файлы по `data.field_name[].url` немедленно: ссылки истекают через 1 час',
        'Если данные валидны → ответь HTTP 200 (пустое тело) — форма закроется у пользователя',
        'Если есть ошибки → ответь HTTP 400 с `{"errors": {"field_name": "текст ошибки"}}` — пользователь увидит ошибки в форме и сможет исправить и отправить повторно',
      ],
      notes:
        'Ответ должен быть дан в течение 3 секунд — иначе пользователь увидит ошибку отправки, но все значения сохранятся и он повторит попытку. `callback_id` — идентифицирует какая форма отправлена (если ботов несколько). `private_metadata` — контекст, переданный при открытии (до 3000 символов).',
    },
    {
      title: 'Опрос сотрудников через форму',
      steps: [
        'Отправь сообщение с кнопкой «Пройти опрос» в канал или ЛС: POST /messages с `"data": "survey_start"` в кнопке',
        'При нажатии кнопки получи вебхук с `trigger_id` и `user_id` нажавшего',
        'Немедленно отправь POST /views/open с формой (поля: `input`, `select`, `radio` и т.д.)',
        'При отправке формы получи вебхук с `"event": "submit"` — значения полей в `data`',
        'Обработай ответы: сохрани в базу или отправь итоговым сообщением в канал',
        'Ответь HTTP 200 — форма закроется',
      ],
      notes:
        'Каждый пользователь должен нажать кнопку сам — у каждого свой `trigger_id`. Нельзя открыть форму принудительно.',
    },
    {
      title: 'Форма заявки/запроса',
      steps: [
        'Размести в канале сообщение с кнопкой «Создать заявку» (`"data": "new_request"`)',
        'При нажатии открой форму с полями: тема, описание, приоритет (`select`)',
        'При submit-вебхуке: создай задачу (POST /tasks) или отправь уведомление ответственному (POST /messages с `"entity_type": "user"`)',
        'Отправь подтверждение автору: POST /messages с `"entity_type": "user"`, `"entity_id": user_id` из вебхука',
        'Ответь HTTP 200 — форма закроется',
      ],
    },
  ],
  'pachca-users': [
    {
      title: 'Получить сотрудника по ID',
      steps: ['GET /users/{id} — полная информация о сотруднике'],
      notes:
        'Часто нужно после получения `user_id` из вебхука или другого API-вызова. Возвращает все поля сотрудника, включая `custom_properties`, `user_status`, `list_tags`.',
      curl: `curl "https://api.pachca.com/api/shared/v1/users/186" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":186,"first_name":"Иван","last_name":"Петров","email":"ivan@example.com","nickname":"ivanp",...}}`,
    },
    {
      title: 'Массовое создание сотрудников с тегами',
      steps: [
        'Создай тег (если нужен): POST /group_tags с `{"group_tag": {"name": ...}}`',
        'Для каждого сотрудника: POST /users — теги назначаются через поле `list_tags` в теле запроса',
        'Или обнови существующего: PUT /users/{id} с `list_tags`',
      ],
      notes:
        'Создание сотрудников доступно только администраторам и владельцам (не ботам). Нет отдельного эндпоинта "добавить юзера в тег" — теги назначаются через `list_tags` при создании (POST /users) или обновлении (PUT /users/{id}).',
    },
    {
      title: 'Найти сотрудника по имени или email',
      steps: [
        'GET /users?query=Иван — поиск по имени/email (частичное совпадение)',
        'Если нужен точный поиск по email — перебери страницы и отфильтруй на клиенте',
      ],
      notes:
        'GET /users поддерживает параметр `query` для поиска. Пагинация cursor-based: используй `limit` и `cursor` из `meta`.',
      curl: `curl "https://api.pachca.com/api/shared/v1/users?query=Иван&limit=50" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":[{"id":186,"first_name":"Иван","last_name":"Петров","email":"ivan@example.com",...}]}`,
    },
    {
      title: 'Онбординг нового сотрудника',
      steps: [
        'POST /users с `email`, именем, тегами (`list_tags`) — создать аккаунт',
        'POST /chats/{id}/members с `member_ids` — добавить в нужные каналы (онбординг, общий, тематические)',
        'POST /messages с `"entity_type": "user"`, `"entity_id": user.id` — отправить welcome-сообщение в личные сообщения',
      ],
      notes: 'Шаг 1 требует токена администратора/владельца. Шаги 2-3 можно делать ботом.',
    },
    {
      title: 'Offboarding сотрудника',
      steps: [
        'PUT /users/{id} с `"suspended": true` — заблокировать доступ',
        'Опционально: DELETE /users/{id} — удалить аккаунт полностью',
      ],
      notes:
        'Приостановка (`suspended`) сохраняет данные, удаление — необратимо. Уточняй политику перед удалением.',
    },
    {
      title: 'Получить всех сотрудников тега/департамента',
      steps: [
        'GET /group_tags?names[]=Backend — найти тег по названию',
        'Из ответа взять `id` тега',
        'GET /group_tags/{id}/users с пагинацией (`limit` + `cursor`) — получить всех участников',
      ],
    },
    {
      title: 'Управление статусом сотрудника',
      steps: [
        'GET /users/{user_id}/status — получить текущий статус сотрудника',
        'PUT /users/{user_id}/status с `emoji`, `title` и опционально `is_away: true`, `away_message: "текст"` — установить статус',
        'DELETE /users/{user_id}/status — удалить статус сотрудника',
      ],
      notes:
        'Для установки режима «Нет на месте» передай `is_away: true`. `away_message` — сообщение, отображаемое в профиле и при личных сообщениях/упоминаниях (макс 1024 символа). Скоупы: `user_status:read` для чтения, `user_status:write` для записи/удаления.',
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/users/13/status" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status":{"emoji":"🏖️","title":"В отпуске","is_away":true,"away_message":"Я в отпуске до 15 апреля"}}'`,
    },
  ],
  'pachca-tasks': [
    {
      title: 'Создать напоминание',
      steps: [
        'POST /tasks с `kind`, `content` и `due_at`',
        'Чтобы привязать к чату — добавь `chat_id`',
        'Чтобы заполнить дополнительные поля — добавь `custom_properties: [{"id": <field_id>, "value": "..."}]` (список полей: GET /custom_properties?entity_type=Task)',
      ],
      notes:
        'Для привязки к чату нужно быть его участником. Если чат не найден — 404. Тип значения `custom_properties[].value` всегда строка (даже для числовых и date-полей). Дополнительные поля настраиваются администратором пространства.',
      curl: `curl "https://api.pachca.com/api/shared/v1/tasks" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"task":{"kind":"reminder","content":"Позвонить клиенту","due_at":"$DUE_AT","chat_id":$CHAT_ID,"custom_properties":[{"id":78,"value":"Синий склад"}]}}'`,
    },
    {
      title: 'Получить список предстоящих задач',
      steps: [
        'GET /tasks с пагинацией (`limit`, `cursor`)',
        'Отфильтруй на клиенте по полю `status`: `"undone"` — не выполнена, `"done"` — выполнена',
      ],
      notes:
        'Фильтрация по `status` на стороне API не поддерживается — фильтруй самостоятельно после получения.',
      curl: `curl "https://api.pachca.com/api/shared/v1/tasks?limit=50" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Получить задачу по ID',
      steps: [
        'GET /tasks/{id} — полная информация о задаче, включая `custom_properties`, `performer_ids`, `status`',
      ],
      curl: `curl "https://api.pachca.com/api/shared/v1/tasks/12345" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":12345,"kind":"reminder","content":"Позвонить клиенту","due_at":"2025-03-10T12:00:00.000Z","status":"undone","performer_ids":[186],...}}`,
    },
    {
      title: 'Отметить задачу выполненной',
      steps: ['PUT /tasks/{id} с `"status": "done"`'],
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/tasks/12345" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"task":{"status":"done"}}'`,
    },
    {
      title: 'Обновить задачу (перенести срок, сменить ответственных)',
      steps: [
        'PUT /tasks/{id} с нужными полями: `content`, `due_at`, `kind`, `priority`, `performer_ids`, `custom_properties`',
      ],
      notes:
        'Можно обновлять любые поля по отдельности. `performer_ids` заменяет весь список ответственных. `priority`: 1 (обычный), 2 (важно), 3 (очень важно).',
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/tasks/12345" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"task":{"due_at":"2025-03-15T14:00:00.000+03:00","priority":2,"performer_ids":[186,187]}}'`,
    },
    {
      title: 'Удалить задачу',
      steps: ['DELETE /tasks/{id}'],
      notes: 'Удаление необратимо. Если нужно просто закрыть — используй PUT с `"status": "done"`.',
      curl: `curl -X DELETE "https://api.pachca.com/api/shared/v1/tasks/12345" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Создать серию напоминаний',
      steps: [
        'Подготовь список дат (ежедневно, еженедельно и т.д.)',
        'Для каждой даты: POST /tasks с нужным `kind`, `content` и `due_at`',
      ],
    },
  ],
  'pachca-profile': [
    {
      title: 'Получить свой профиль',
      steps: ['GET /profile — возвращает полную информацию о текущем пользователе'],
      notes:
        'Возвращает `id`, `first_name`, `last_name`, `nickname`, `email`, `phone_number`, `department`, `title`, `role`, `suspended`, `invite_status`, `list_tags`, `custom_properties`, `user_status`, `bot`, `sso`, `created_at`, `last_activity_at`, `time_zone`, `image_url`.',
      curl: `curl "https://api.pachca.com/api/shared/v1/profile" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":186,"first_name":"Иван","last_name":"Петров","email":"ivan@example.com","nickname":"ivanp","department":"Разработка","title":"Разработчик","role":"admin",...}}`,
    },
    {
      title: 'Проверить свой токен',
      steps: [
        'GET /oauth/token/info — возвращает информацию о текущем токене: скоупы, дату создания, срок жизни',
      ],
      notes:
        'Полезно для диагностики: какие скоупы доступны токену, когда он истекает. Токен маскируется — видны первые 8 и последние 4 символа.',
      curl: `curl "https://api.pachca.com/api/shared/v1/oauth/token/info" \\
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":123,"token":"abcd1234...ef56","name":"Мой токен","user_id":186,"scopes":["messages:create","chats:read"],"expires_in":7776000,...}}`,
    },
    {
      title: 'Установить статус',
      steps: [
        'PUT /profile/status с `emoji` и `title`',
        'Чтобы включить режим «Нет на месте» — добавь `is_away: true`',
        'Чтобы задать сообщение о недоступности — добавь `away_message: "текст"` (макс 1024 символа, отображается в профиле и при личных сообщениях/упоминаниях)',
        'Чтобы статус автоматически сбросился — добавь `expires_at: "2024-04-08T10:00:00.000Z"` (ISO-8601, UTC+0)',
      ],
      curl: `curl -X PUT "https://api.pachca.com/api/shared/v1/profile/status" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status":{"emoji":"🏖️","title":"В отпуске до 10 марта","is_away":true,"away_message":"Я в отпуске. По срочным вопросам — @ivanov","expires_at":"2025-03-10T23:59:59.000Z"}}'`,
    },
    {
      title: 'Сбросить статус',
      steps: ['DELETE /profile/status'],
      curl: `curl -X DELETE "https://api.pachca.com/api/shared/v1/profile/status" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Получить кастомные поля профиля',
      steps: [
        'GET /custom_properties?entity_type=User — список дополнительных полей для сотрудников (`id`, `name`, `data_type`)',
        'GET /profile — в ответе поле `custom_properties` содержит значения для текущего пользователя',
      ],
      notes:
        'Параметр `entity_type=User` фильтрует поля по типу сущности. Кастомные поля настраиваются администратором пространства. Значения хранятся в массиве `custom_properties` объекта `user`.',
    },
  ],
  'pachca-search': [
    {
      title: 'Найти сообщение по тексту',
      steps: [
        'GET /search/messages?query=текст — полнотекстовый поиск',
        'Пагинация: `limit` (до 200) и `cursor` (из `meta.paginate.next_page`)',
        'Общее количество результатов — в `meta.total`',
      ],
      notes:
        'Поиск возвращает сообщения из всех доступных чатов. Фильтры: `chat_ids[]` (конкретные чаты), `user_ids[]` (авторы), `active` (true — активные чаты, false — архивированные), `created_from`/`created_to` (период). Поле `root_chat_id` в ответе показывает корневой чат для сообщений из тредов.',
      curl: `curl "https://api.pachca.com/api/shared/v1/search/messages?query=отчёт&limit=10" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Найти чат по названию',
      steps: [
        'GET /search/chats?query=название — полнотекстовый поиск по чатам',
        'Пагинация: `limit` (до 100) и `cursor`',
      ],
      notes:
        'Фильтры: `active` (true — активные, false — архивированные), `chat_subtype` (`discussion` или `thread`), `personal` (true — только личные), `created_from`/`created_to` (период). Результаты сортируются по релевантности.',
      curl: `curl "https://api.pachca.com/api/shared/v1/search/chats?query=Разработка&limit=10" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Найти сотрудника по имени',
      steps: [
        'GET /search/users?query=имя — полнотекстовый поиск по сотрудникам',
        'Пагинация: `limit` (до 200) и `cursor`',
        'Сортировка: `sort=alphabetical` для алфавитного порядка, `sort=by_score` (по умолчанию) для релевантности',
      ],
      notes:
        'Фильтры: `company_roles[]` (`user`, `admin`, `multi_guest`, `guest`), `created_from`/`created_to` (период). Альтернатива GET /users?query= с более точным ранжированием.',
      curl: `curl "https://api.pachca.com/api/shared/v1/search/users?query=Олег&limit=10" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
  ],
  'pachca-security': [
    {
      title: 'Получить журнал аудита событий',
      steps: [
        'GET /audit_events с обязательными `start_time` и `end_time` (ISO-8601, UTC+0)',
        'Опциональные фильтры: `event_key`, `actor_id`, `actor_type`, `entity_id`, `entity_type`',
      ],
      notes:
        'Доступно только владельцу пространства. `start_time` (включительно) и `end_time` (исключительно) — обязательные параметры.',
      curl: `curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-03-01T00:00:00Z&end_time=2025-03-02T00:00:00Z&limit=50" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Мониторинг подозрительных входов',
      steps: [
        'GET /audit_events с `event_key=user_2fa_fail` (или `user_login`) за нужный период',
        'Пагинируй с `cursor` до получения всех записей',
        'Если найдены аномалии (много неудачных 2FA с одного аккаунта) — отправь уведомление администратору через POST /messages',
      ],
      curl: `curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-03-01T00:00:00Z&end_time=2025-03-02T00:00:00Z&event_key=user_2fa_fail&limit=50" \\
  -H "Authorization: Bearer $TOKEN"`,
    },
    {
      title: 'Экспорт логов за период',
      steps: [
        'GET /audit_events с `start_time` и `end_time` (ISO-8601, UTC+0)',
        'Пагинируй с `cursor` до получения всех записей (`limit` до 50)',
        'Собери все события в массив → сохрани в файл или отправь во внешнюю систему (SIEM, таблицы)',
      ],
    },
  ],
};
