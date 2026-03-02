---
name: pachca-messages
description: >
  Отправка сообщений в каналы, беседы и личные чаты Пачки. Ответы в треды,
  загрузка файлов, кнопки, реакции, закрепление, прочтения. Используй когда нужно:
  отправить сообщение, ответить в тред, прикрепить файл, добавить реакцию,
  получить историю чата, закрепить сообщение. НЕ используй для: создания каналов
  (→ pachca-chats), управления ботами (→ pachca-bots).
allowed-tools: Bash(curl *)
---

# pachca-messages

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Когда НЕ использовать

- создать канал, создать беседу, создать чат → **pachca-chats**
- настроить бота, вебхук, webhook → **pachca-bots**
- показать форму, интерактивная форма, модальное окно → **pachca-forms**

## Пошаговые сценарии

### Найти чат по имени и отправить сообщение

1. GET /chats — перебери результаты, найди нужный по полю `name`
2. Отправь POST /messages с `"entity_id": chat.id`

```bash
curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"entity_id":12345,"content":"Текст сообщения"}}'
```

> `entity_type` по умолчанию `"discussion"`, можно не указывать. GET /chats не поддерживает поиск по имени — перебирай страницы.

### Отправить сообщение в канал или беседу (если chat_id известен)

1. Отправь POST /messages с `"entity_id": chat_id`

> `"entity_type": "discussion"` используется по умолчанию, можно не указывать

### Отправить личное сообщение пользователю

1. Определи `user_id` получателя (GET /users или из контекста)
2. Отправь POST /messages с `"entity_type": "user"`, `"entity_id": user_id`

```bash
curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"entity_type":"user","entity_id":186,"content":"Привет!"}}'
```

> Создавать чат не требуется — он создаётся автоматически

### Ответить в тред (комментарий к сообщению)

1. Получи или создай тред: POST /messages/{id}/thread (`id` — id родительского сообщения)
2. Из ответа возьми id треда (`thread.id`)
3. Отправь POST /messages с `"entity_type": "thread"`, `"entity_id": thread.id`

```bash
curl "https://api.pachca.com/api/shared/v1/messages/154332686/thread" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":265142,"chat_id":2637266155,"message_id":154332686,...}}

curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"entity_type":"thread","entity_id":265142,"content":"Ответ в тред"}}'
```

> Если тред уже существует, POST /messages/{id}/thread вернёт существующий. Альтернативно можно использовать `"entity_type": "discussion"` + `"entity_id": thread.chat_id`. `skip_invite_mentions: true` — не добавлять упомянутых пользователей в тред автоматически.

### Ответить пользователю, который написал боту

1. Вебхук содержит `entity_type` — он однозначно определяет контекст: `"user"` — личное сообщение боту, `"thread"` — сообщение в треде, `"discussion"` — сообщение в канале или беседе
2. DM (`entity_type: "user"`): ответь POST /messages с `"entity_type": "user"`, `"entity_id"`: `user_id` из вебхука
3. Тред (`entity_type: "thread"`): вложенных тредов нет — ответь в тот же тред: POST /messages с `"entity_type": "thread"`, `"entity_id"`: `entity_id` из вебхука, `"parent_message_id"`: `id` сообщения пользователя из вебхука
4. Беседа/канал (`entity_type: "discussion"`): выбери стратегию — inline-ответ (POST /messages c `"parent_message_id"`: `id` сообщения) или тред (POST /messages/{id}/thread → ответ в тред)

> `parent_message_id` визуально привязывает ответ к конкретному сообщению (показывается как «в ответ на…»). В треде обязателен для цепочки диалога. В обычном чате — альтернатива треду. Если бота вызвали в треде и других сообщений в треде нет — основной контекст в родительском сообщении треда. В вебхуке уже есть `thread.message_id` — получи родительское сообщение: GET /messages/{id}.

### Отправить сообщение с файлами

1. Для каждого файла: POST /uploads → получи `key` (с `${filename}`), `direct_url`, `policy`, подпись
2. Для каждого файла: подставь имя файла вместо `${filename}` в `key`, затем загрузи файл POST на `direct_url` (`multipart/form-data`, без авторизации)
3. Собери массив `files` из всех загруженных файлов (`key`, `name`, `file_type`, `size`)
4. Отправь POST /messages с массивом `files` — одно сообщение со всеми файлами

```bash
curl "https://api.pachca.com/api/shared/v1/uploads" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"key":".../${filename}","direct_url":"https://...","policy":"...","x-amz-signature":"...",...}

curl -X POST <direct_url> \
  -F "Content-Disposition=attachment" -F "acl=private" \
  -F "policy=<policy>" -F "x-amz-credential=<credential>" \
  -F "x-amz-algorithm=<algorithm>" -F "x-amz-date=<date>" \
  -F "x-amz-signature=<signature>" \
  -F "key=<key_с_подставленным_именем>" -F "file=@report.pdf"

curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"entity_id":12345,"content":"Смотри файл","files":[{"key":"uploads/.../report.pdf","name":"report.pdf","file_type":"file","size":12345}]}}'
```

> Файлы не передаются inline. Загрузка двухшаговая: сначала POST /uploads (параметры), затем POST на `direct_url` (сам файл на S3). Шаги 1-2 повторяются для каждого файла отдельно, а сообщение отправляется один раз со всеми файлами.

### Отправить сообщение с кнопками

1. Сформируй массив `buttons` — массив строк, каждая строка — массив кнопок: `[[{кнопка1, кнопка2}, ...], ...]`
2. Каждая кнопка: `{"text": "Текст"}` + либо `url` (ссылка), либо `data` (callback для вебхука)
3. Отправь POST /messages с полем `buttons`
4. Нажатия кнопок приходят в исходящий вебхук (событие "Нажатие кнопок")

```bash
curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"entity_id":12345,"content":"Выбери действие","buttons":[[{"text":"Подробнее","url":"https://example.com"},{"text":"Отлично!","data":"awesome"}]]}}'
```

> `buttons` — массив массивов (строки × кнопки). Максимум 100 кнопок, до 8 в строке. Кнопка с `url` открывает ссылку, с `data` — отправляет событие на вебхук.

### Получить историю сообщений чата

1. GET /messages?chat_id={id}
2. Пагинация: `limit` (1-50, по умолчанию 50) и `cursor` (из `meta.paginate.next_page`)
3. Сортировка: `sort[id]=asc` или `sort[id]=desc` (по умолчанию `"desc"`)

```bash
curl "https://api.pachca.com/api/shared/v1/messages?chat_id=12345&limit=50&sort[id]=asc" \
  -H "Authorization: Bearer $TOKEN"
```

> Для сообщений треда используй `chat_id` треда (`thread.chat_id`). Пагинация cursor-based, не page-based.

### Получить вложения из сообщения

1. GET /messages/{id} — в поле `files[]` каждый объект содержит `url` (прямая ссылка), `name`, `file_type`, `size`
2. Скачай нужные файлы по `files[].url` — ссылка прямая, авторизация не требуется

```bash
curl "https://api.pachca.com/api/shared/v1/messages/154332686" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":154332686,"content":"Смотри файл","files":[{"url":"https://...","name":"report.pdf","file_type":"file","size":12345}],...}}
```

> Вебхук о новом сообщении НЕ содержит вложений — поле `files` отсутствует даже если файлы есть. При анализе любого сообщения (из вебхука, из истории чата) всегда проверяй вложения через GET /messages/{id} — если `files` непустой, в сообщении есть файлы, которые могут быть важны для контекста.

### Закрепить/открепить сообщение

1. Закрепить: POST /messages/{id}/pin
2. Открепить: DELETE /messages/{id}/pin

> В чате может быть несколько закреплённых сообщений.

### Подписаться на тред сообщения

1. POST /messages/{id}/thread — если треда нет, он будет создан; если есть — вернётся существующий
2. Из ответа возьми `chat_id` треда (`data.chat_id`)
3. Добавь бота (или пользователя) в участники чата треда: POST /chats/{id}/members с `member_ids`
4. Теперь бот будет получать вебхук-события о новых сообщениях в этом треде

> POST /messages/{id}/thread идемпотентен — безопасно вызывать повторно. После добавления в участники бот получает события треда через исходящий вебхук.

### Упомянуть пользователя по имени

1. Определи поисковый запрос — используй фамилию, она уникальнее. Имена не склоняются в API, приводи к именительному падежу: «упомяни Пашу» → ищи `Паша` или `Павел`, «тегни Голубева» → ищи `Голубев`
2. Ищи сначала среди участников целевого чата: GET /chats/{id}/members (для треда тоже работает, у него свои участники) — фильтруй по имени на клиенте
3. Если пишешь в тред: также проверь участников родительского чата (GET /chats/{id}/members с `id=message_chat_id`)
4. Не нашёл — ищи по всей компании: GET /users?query={запрос}
5. Один подходящий результат → используй `nickname`. Несколько → уточни у пользователя (имя + фамилия). Ничего → попробуй другую форму имени (уменьшительное ↔ полное)
6. Вставь `@nickname` в текст сообщения

```bash
curl "https://api.pachca.com/api/shared/v1/chats/12345/members" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: [{"id":42,"first_name":"Павел","last_name":"Голубев","nickname":"golubevpn",...}]

curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"entity_id":12345,"content":"@golubevpn, митинг перенесён"}}'
```

> Поиск среди участников чата точнее — пользователь явно связан с контекстом, меньше вероятность спутать однофамильцев. GET /users?query — последний fallback для поиска по всей компании.

### Отредактировать сообщение

1. PUT /messages/{id} с полем `content` (и/или `buttons`, `files`)

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/messages/154332686" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"content":"Обновлённый текст"}}'
```

> Редактировать можно только свои сообщения (или от имени бота).

### Изменить вложения сообщения

1. GET /messages/{id} — получи текущие вложения из поля `files[]`, сохрани нужные объекты (`key`, `name`, `file_type`, `size`)
2. Если нужно добавить новый файл: POST /uploads → загрузи файл → добавь объект в список
3. PUT /messages/{id} с массивом `files` — только те файлы, которые должны остаться (+ новые при необходимости)

```bash
curl "https://api.pachca.com/api/shared/v1/messages/154332686" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"files":[{"key":"uploads/.../a.pdf","name":"a.pdf","file_type":"file","size":1000},{"key":"uploads/.../b.pdf","name":"b.pdf","file_type":"file","size":2000}],...}}

curl -X PUT "https://api.pachca.com/api/shared/v1/messages/154332686" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"files":[{"key":"uploads/.../a.pdf","name":"a.pdf","file_type":"file","size":1000}]}}'
```

> `files` при редактировании работает по принципу replace-all: присылаемый массив полностью заменяет текущие вложения, отсутствующие файлы удаляются. `files: []` удаляет все вложения. Если поле `files` не передавать — вложения не меняются.

### Удалить сообщение

1. DELETE /messages/{id}

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/messages/154332686" \
  -H "Authorization: Bearer $TOKEN"
```

### Добавить реакцию на сообщение

1. POST /messages/{id}/reactions с полем `code` (emoji)
2. Убрать реакцию: DELETE /messages/{id}/reactions с полем `code`

```bash
curl "https://api.pachca.com/api/shared/v1/messages/154332686/reactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"👍"}'
```

> `code` — emoji-символ, не его текстовое название.

### Проверить, кто прочитал сообщение

1. GET /messages/{id}/read_member_ids — возвращает массив `user_id` прочитавших
2. При необходимости сопоставь с GET /users для получения имён

```bash
curl "https://api.pachca.com/api/shared/v1/messages/154332686/read_member_ids" \
  -H "Authorization: Bearer $TOKEN"
```

### Разослать уведомление нескольким пользователям

1. Определи список `user_id` получателей (GET /users или из контекста)
2. Для каждого: POST /messages с `"entity_type": "user"`, `"entity_id": user_id`

> Соблюдай rate limit: ~4 req/sec для сообщений. Добавляй паузы при большом списке.

## Ограничения и gotchas

- Rate limit: ~50 req/sec, сообщения ~4 req/sec. При 429 — подожди и повтори.
- `message.entity_type`: допустимые значения — `discussion` (Беседа или канал), `thread` (Тред), `user` (Пользователь)
- `message.display_avatar_url`: максимум 255 символов
- `message.display_name`: максимум 255 символов
- `limit`: максимум — 50 (GET /messages), 50 (GET /messages/{id}/reactions), 300 (GET /messages/{id}/read_member_ids)
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| POST | /direct_url | — |
| POST | /messages | messages:create |
| GET | /messages | messages:read |
| GET | /messages/{id} | messages:read |
| PUT | /messages/{id} | messages:update |
| DELETE | /messages/{id} | messages:delete |
| POST | /messages/{id}/pin | pins:write |
| DELETE | /messages/{id}/pin | pins:write |
| POST | /messages/{id}/reactions | reactions:write |
| DELETE | /messages/{id}/reactions | reactions:write |
| GET | /messages/{id}/reactions | reactions:read |
| GET | /messages/{id}/read_member_ids | messages:read |
| POST | /messages/{id}/thread | threads:create |
| GET | /threads/{id} | threads:read |
| POST | /uploads | uploads:write |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
