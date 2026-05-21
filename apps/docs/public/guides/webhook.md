> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Исходящие вебхуки

Исходящие вебхуки позволяют вам получать информацию о событиях в вашем пространстве в реальном времени. Это могут быть новые сообщения, реакции, чаты, участники и тд.

Вебхук представляет собой `JSON` объект, отправляемый в момент наступления события на указанный в настройках бота `URL`, содержащий небольшое количество информации, которой достаточно для написания автоматизаций. Если требуется получить больше информации об объектах, указанных в `JSON` - вы можете воспользоваться `API` и получить полную информацию.

Каждый исходящий вебхук защищён с помощью подписи, основанной на хешировании содержимого. Подробнее об этом, а также о других методах проверки подлинности исходящего вебхука, вы можете прочитать в блоке [Безопасность](#bezopasnost).

## Как это работает


  ### Шаг 1. Создайте бота

Перейдите в **Автоматизации** > **Интеграции** > **Чат-боты и Вебхуки** и создайте бота. Подробнее — в разделе [Боты](/guides/bots).


  ### Шаг 2. Укажите Webhook URL

В настройках бота перейдите на вкладку **Исходящий Webhook** и укажите URL вашего сервера, на который Пачка будет отправлять события.


  ### Шаг 3. Выберите типы событий

Отметьте события, которые вас интересуют: новые сообщения, реакции, нажатия кнопок и другие.


  ### Шаг 4. Добавьте бота в чаты

Большинство событий приходят только из чатов, в которых состоит бот. Глобальные события (например, изменение состава участников пространства) не требуют добавления в чат.


## Настройки

Настройки исходящего вебхука находятся на вкладке **Исходящий Webhook** в настройках бота.

![Вкладка Исходящий Webhook в настройках бота](/images/outgoing-webhook.png)

*Вкладка Исходящий Webhook в настройках бота*


### Сохранять историю событий

Включите эту настройку, чтобы бот сохранял все исходящие вебхуки в очередь. Сохранённые события можно получить через API — подробнее в разделе [Поллинг](#polling).

### Игнорировать свои сообщения

Включите эту настройку, чтобы не получать вебхуки о сообщениях, отправленных самим ботом. Это предотвращает зацикливание, когда бот реагирует на собственные сообщения. Нажатия кнопок обрабатываются всегда, вне зависимости от этой настройки.

## Типы событий

### Сообщения

В настройках доступны два отдельных пункта:

- **Новые сообщения** — создание сообщений в чатах, где состоит бот, и в тредах этих чатов
- **Редактирование и удаление сообщений** — изменение текста, файлов или удаление сообщений в чатах, где состоит бот, и в тредах этих чатов

Для новых сообщений доступны два режима отслеживания:

- **О любых сообщениях** — все новые сообщения, включая треды
- **Сообщения, начинающиеся с команд** — только сообщения, начинающиеся с указанных команд (например, `/help`, `/deploy`). Команды начинаются с `/` и пишутся на английском. Полезно, если вы не хотите получать поток событий, а вам нужно вызвать сценарий только по требованию пользователя

#### MessageWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"message"`
  Значения: `message` — Для сообщений всегда message
- `id: integer, int32` (required) — Идентификатор сообщения. Пример: `1245817`
- `event: string` (required) — Тип события
  Значения: `new` — Создание, `update` — Обновление, `delete` — Удаление
- `entity_type: string` (required) — Тип сущности, к которой относится сообщение
  Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
- `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение. Пример: `5678`
- `content: string` (required) — Текст сообщения. Пример: `"Текст сообщения"`
- `user_id: integer, int32` (required) — Идентификатор отправителя сообщения. Пример: `2345`
- `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
- `url: string` (required) — Прямая ссылка на сообщение. Пример: `"https://pachca.com/chats/1245817/messages/5678"`
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Пример: `9012`
- `parent_message_id: integer, int32` — Идентификатор сообщения, к которому написан ответ. Пример: `3456`
- `thread: object` — Объект с параметрами треда
  - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому был создан тред. Пример: `12345`
  - `message_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому был создан тред. Пример: `67890`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`


### Реакции

Вебхук отправляется при добавлении или удалении реакции на сообщение в чате, где состоит бот.

#### ReactionWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"reaction"`
  Значения: `reaction` — Для реакций всегда reaction
- `event: string` (required) — Тип события
  Значения: `new` — Создание, `delete` — Удаление
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Поле всегда присутствует в payload. В редких случаях (например, если сообщение было удалено к моменту отправки вебхука) может быть `null`.. Пример: `9012`
- `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится реакция. Пример: `1245817`
- `code: string` (required) — Emoji символ реакции. Пример: `"👍"`
- `name: string` (required) — Название реакции. Пример: `"thumbsup"`
- `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил или удалил реакцию. Пример: `2345`
- `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`


### Нажатие кнопок

Вебхук отправляется при нажатии `Data`-кнопки в сообщении от бота. После получения вы можете [отредактировать сообщение](PUT /messages/{id}) — например, изменить или удалить кнопки — или [отправить новое](POST /messages) как ответ пользователю. Подробнее — в разделе [Кнопки в сообщениях](/guides/buttons).

#### ButtonWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"button"`
  Значения: `button` — Для кнопки всегда button
- `event: string` (required) — Тип события. Пример: `"click"`
  Значения: `click` — Нажатие кнопки
- `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится кнопка. Пример: `1245817`
- `trigger_id: string` (required) — Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю. Пример: `"a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14"`
- `data: string` (required) — Данные нажатой кнопки. Пример: `"button_data"`
- `user_id: integer, int32` (required) — Идентификатор пользователя, который нажал кнопку. Пример: `2345`
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором была нажата кнопка. Пример: `9012`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`


### Заполнение формы

Вебхук отправляется при отправке пользователем заполненной формы ([представления](/guides/forms/overview)). Подробнее об обработке результатов — в разделе [Обработка форм](/guides/forms/handling).

> Поле `chat_id` фиксируется в момент **открытия** формы (нажатия кнопки), а не её отправки — если форма провисела открытой длительное время, поле всё равно ссылается на чат с кнопкой. Для форм, открытых до выкатки этого изменения, `chat_id` может приходить как `null`, потому что чат не был зафиксирован при открытии.


#### ViewSubmitWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"view"`
  Значения: `view` — Для формы всегда view
- `event: string` (required) — Тип события. Пример: `"submit"`
  Значения: `submit` — Отправка формы
- `callback_id: string` (required) — Идентификатор обратного вызова, указанный при открытии представления. Пример: `"timeoff_request_form"`
- `private_metadata: string` (required) — Приватные метаданные, указанные при открытии представления. Пример: `"{'timeoff_id':4378}"`
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором было нажатие кнопки, открывшей форму. Значение фиксируется в момент **открытия** формы, а не отправки — если форма провисела открытой длительное время, `chat_id` всё равно ссылается на чат с кнопкой. Поле всегда присутствует в payload. Для форм, открытых до выкатки этого изменения, `chat_id` придёт как `null` — такие формы постепенно вымоются по TTL сохранённого представления (30 дней).. Пример: `9012`
- `user_id: integer, int32` (required) — Идентификатор пользователя, который отправил форму. Пример: `1235523`
- `data: Record<string, object>` (required) — Данные заполненных полей представления. Ключ — `action_id` поля, значение — введённые данные
  **Структура значений Record:**
  - Тип значения: `any`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1755075544`


### Изменение участников чатов

Вебхук отправляется при изменении состава участников чатов, где состоит бот, и в тредах этих чатов.

#### ChatMemberWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"chat_member"`
  Значения: `chat_member` — Для участника чата всегда chat_member
- `event: string` (required) — Тип события
  Значения: `add` — Добавление, `remove` — Удаление
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором изменился состав участников. Пример: `9012`
- `thread_id: integer, int32` — Идентификатор треда. Пример: `5678`
- `user_ids: array of integer` (required) — Массив идентификаторов пользователей, с которыми произошло событие. Пример: `[2345,6789]`
- `created_at: date-time` (required) — Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`


### Изменение участников пространства

Вебхук отправляется при добавлении, удалении или приостановке участников пространства. Не требует добавления бота в чат.

#### CompanyMemberWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"company_member"`
  Значения: `company_member` — Для участника пространства всегда company_member
- `event: string` (required) — Тип события
  Значения: `invite` — Приглашение, `confirm` — Подтверждение, `update` — Обновление, `suspend` — Приостановка, `activate` — Активация, `delete` — Удаление
- `user_ids: array of integer` (required) — Массив идентификаторов пользователей, с которыми произошло событие. Пример: `[2345,6789]`
- `created_at: date-time` (required) — Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`


### Отправка ссылок

Вебхук отправляется при появлении ссылки на один из доменов, указанных в настройках Unfurl-бота. Для получения таких событий необходимо создать специального Unfurl-бота. После получения вы можете воспользоваться методом [Unfurl (разворачивание ссылок)](POST /messages/{id}/link_previews) и создать предпросмотр ссылки в сообщении. Подробнее — в разделе [Разворачивание ссылок](/guides/link-previews).

#### LinkSharedWebhookPayload

- `type: string` (required) — Тип объекта. Пример: `"message"`
  Значения: `message` — Для разворачивания ссылок всегда message
- `event: string` (required) — Тип события. Пример: `"link_shared"`
  Значения: `link_shared` — Обнаружена ссылка на отслеживаемый домен
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором обнаружена ссылка. Пример: `23438`
- `message_id: integer, int32` (required) — Идентификатор сообщения, содержащего ссылку. Пример: `268092`
- `links: array of object` (required) — Массив обнаруженных ссылок на отслеживаемые домены
  - `url: string` (required) — URL ссылки. Пример: `"https://example.com/page1"`
  - `domain: string` (required) — Домен ссылки. Пример: `"example.com"`
  - `skip: boolean` (required) — Признак того, что автор сообщения скрыл превью для этой ссылки. Если `true` — бот не должен создавать превью. Пример: `false`
- `user_id: integer, int32` (required) — Идентификатор отправителя сообщения. Пример: `2345`
- `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-09-18T19:53:14.000Z"`
- `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1726685594`


## Безопасность

Каждый исходящий вебхук защищён с помощью подписи, основанной на хешировании содержимого. Подпись `HMAC` с использованием алгоритма `SHA256` вычисляется из тела запроса и передаётся в заголовке `Pachca-Signature`.

В теле вебхука также содержится поле `webhook_timestamp` — метка времени в формате UNIX, указывающая момент отправки вебхука. Рекомендуется проверять, что это значение находится в пределах одной минуты от времени получения запроса, чтобы предотвратить атаки повторной отправки (replay attacks).

```http title="Пример исходящего вебхука (новое сообщение)"
POST https://yourweb.site/read HTTP/1.1
host: yourweb.site
content-Type: application/json
pachca-signature: a805d3470c263f4628cafc4ed66235d8fe2229891d1fcf4e400331adff5d8e5a
user-agent: Faraday v2.12.2
content-length: 358

{
    "event": "new",
    "type": "message",
    "webhook_timestamp": 1744618734,
    "chat_id": 918264,
    "content": "Клиент просит поправить шапку, подробности в документе",
    "user_id": 134412,
    "id": 56431,
    "created_at": "2025-04-14T08:18:54.000Z",
    "parent_message_id": null,
    "entity_type": "discussion",
    "entity_id": 918264,
    "thread": null,
    "url": "https://app.pachca.com/chats/124511?message=56431"
}
```


  ### Шаг 1. Проверьте подпись

Для проверки подписи необходимо вычислить её самостоятельно, используя секрет вебхука `Signing secret`, который доступен в настройках бота во вкладке «Исходящий webhook». Рекомендуется использовать сырой (raw) контент тела запроса для вычисления хеша, так как при JSON-парсинге содержимое может быть изменено.

```javascript title="Вычисление и сравнение подписи"
// WEBHOOK_SECRET - значение поля Signing secret во вкладке «Исходящий webhook» в настройках бота

const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
if (signature !== request.headers['pachca-signature']) {
    throw "Invalid signature"
}
```


  ### Шаг 2. Валидируйте IP-адрес отправителя

Кроме проверки подписи, также рекомендуется валидировать IP-адреса отправителя.

IP-адрес Пачки: `37.200.70.177`


## Реализация webhook handler

Полный пример обработки вебхуков на TypeScript (Express.js) и Python (Flask) с проверкой подписи, защитой от replay-атак и обработкой всех типов событий.

### TypeScript (Express.js)

```typescript
import express from "express"
import crypto from "crypto"

const SIGNING_SECRET = "your_signing_secret" // Из настроек бота → Исходящий Webhook → Signing Secret
const app = express()

// Важно: используем express.raw для получения сырого тела запроса (для корректной проверки HMAC)
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  // 1. Проверка подписи HMAC-SHA256
  const signature = crypto.createHmac("sha256", SIGNING_SECRET)
    .update(req.body).digest("hex")
  if (signature !== req.headers["pachca-signature"]) {
    return res.status(401).send("Invalid signature")
  }

  // 2. Защита от replay-атак (±60 секунд)
  const event = JSON.parse(req.body.toString())
  if (Math.abs(Date.now() / 1000 - event.webhook_timestamp) > 60) {
    return res.status(401).send("Expired event")
  }

  // 3. Обработка события по типу
  switch (event.type) {
    case "message":
      if (event.event === "new") {
        console.log(`Новое сообщение от ${event.user_id}: ${event.content}`)
      } else if (event.event === "update") {
        console.log(`Сообщение ${event.id} отредактировано`)
      } else if (event.event === "delete") {
        console.log(`Сообщение ${event.id} удалено`)
      }
      break
    case "reaction":
      console.log(`${event.event === "new" ? "Добавлена" : "Удалена"} реакция ${event.emoji}`)
      break
    case "button":
      console.log(`Нажата кнопка: ${event.data}`)
      // trigger_id доступен 3 секунды — используйте его для открытия формы
      break
    case "view_submit":
      console.log(`Форма заполнена:`, event.payload)
      break
  }

  res.status(200).send("OK")
})
app.listen(3000)
```

### Python (Flask)

```python
import hmac, hashlib, json, time
from flask import Flask, request, abort

SIGNING_SECRET = "your_signing_secret"  # Из настроек бота → Исходящий Webhook → Signing Secret
app = Flask(__name__)

@app.route("/webhook", methods=["POST"])
def webhook():
    raw_body = request.get_data()

    # 1. Проверка подписи HMAC-SHA256
    expected = hmac.new(SIGNING_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    if expected != request.headers.get("Pachca-Signature"):
        abort(401)

    # 2. Защита от replay-атак (±60 секунд)
    event = json.loads(raw_body)
    if abs(time.time() - event["webhook_timestamp"]) > 60:
        abort(401)

    # 3. Обработка события
    if event["type"] == "message" and event["event"] == "new":
        print(f"Новое сообщение от {event['user_id']}: {event['content']}")
    elif event["type"] == "button":
        print(f"Нажата кнопка: {event['data']}")
    elif event["type"] == "view_submit":
        print(f"Форма заполнена: {event['payload']}")

    return "OK", 200
```

### Идемпотентная обработка

Пачка использует **at-least-once delivery** — один и тот же вебхук может прийти повторно. Обработчик должен быть идемпотентным:

```typescript
// Дедупликация по уникальным полям события
const processed = new Set<string>()

function getEventKey(event: any): string {
  // Уникальный ключ: тип + событие + id объекта
  return `${event.type}:${event.event}:${event.id || event.message_id || ""}`
}

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  // ... проверка подписи ...
  const event = JSON.parse(req.body.toString())
  const key = getEventKey(event)
  if (processed.has(key)) {
    return res.status(200).send("Already processed")
  }
  processed.add(key)
  processEvent(event) // Ваша логика обработки
  res.status(200).send("OK")
})
```

### Обработка ошибок доставки

Если ваш сервер не ответил `2xx` в течение таймаута, Пачка повторит попытку доставки. Рекомендации:

- Отвечайте `200 OK` как можно быстрее — выносите тяжёлую обработку в фоновую очередь
- При временных ошибках отвечайте `503` — Пачка повторит позже
- При постоянных ошибках (невалидные данные) — `200 OK` чтобы избежать бесконечных повторов

## Поллинг

Если у вас нет возможности принимать входящие HTTP-запросы (локальная разработка, жёсткие firewall-правила), используйте **поллинг** — получение событий через API.

Включите настройку [Сохранять историю событий](#sohranyat-istoriyu-sobytiy), чтобы получать события через API:

- [Список событий бота](GET /webhooks/events) — получить накопленные события
- [Удалить событие](DELETE /webhooks/events/{id}) — удалить обработанное событие из очереди

> Периодически запрашивайте список событий, обрабатывайте каждое и удаляйте обработанные.


### Пример поллинга (TypeScript)

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_BOT_TOKEN")

async function pollEvents() {
  const events = await client.bots.getWebhookEvents()
  for (const event of events.data) {
    console.log("Событие:", event.type, event.event)
    // Обработать событие...
    await client.bots.deleteWebhookEvent(event.id) // Удалить из очереди
  }
}

// Запускать каждые 5 секунд
setInterval(pollEvents, 5000)
```
