> Расположение: Исходящие вебхуки
> Краткое содержание: Поллинг исходящих вебхуков Пачки через SDK: получение новых событий без публичного webhook URL, поток событий в реальном времени по ссылке (Server-Sent Events) с примером подключения и сменой ссылки, дедупликация доставок и пример воркера для локальной разработки
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Поллинг

Если у вас нет возможности принимать входящие HTTP-запросы (локальная разработка, жёсткие firewall-правила), используйте **поллинг** — получение событий через API или готовые helpers в SDK. Когда на событие нужно ответить сразу, подключитесь к [потоку событий](#sobytiya-v-realnom-vremeni): события придут по открытому соединению без опроса.

Включите настройку **Сохранять историю событий** на вкладке **Исходящий вебхук** в карточке бота (подробнее — в разделе [Настройка и типы событий](/guides/webhook/events#obschie-nastroyki)), чтобы получать события через метод [История событий](/api/bots/list-events). Без неё новые события в историю не попадают, а уже сохранённые записи метод отдаёт, пока вы их не удалите. В интерфейсе настройка появляется только после включения вебхука, то есть когда указан URL. Если принимать запросы нельзя совсем, включите историю программно — полем `events_history_enabled` в методах [Новый бот](/api/bots/create) и [Редактирование бота](/api/bots/update): адрес вебхука для этого не нужен.

## События в реальном времени

Опрос истории добавляет задержку, а на нажатие кнопки или отправку формы ответить нужно за секунды (все сроки — в разделе [Сроки ответа](/guides/webhook/handler#sroki-otveta)). Метод [Поток событий](/api/bots/get-stream) отдаёт ссылку, по которой события бота приходят в формате Server-Sent Events сразу, как они происходят. Публичный адрес для этого не нужен, поэтому поток подходит и для разработки на своей машине.

В поток попадают те же события, что ложатся в историю, поэтому он работает, когда включена настройка **Сохранять историю событий**. Если она выключена или поток недоступен, метод отвечает `404` без тела, а события по-прежнему можно забирать запросами к истории.

Ссылку открывают без токена: через `EventSource`, `curl -N` или другой клиент SSE. Доступ даёт сама ссылка, поэтому храните её как секрет и не записывайте в логи. Ссылка действует от одного до двух часов, точное время приходит в поле `expires_at`.

Каждое сообщение потока — JSON. Событие бота приходит сообщением без имени, в `EventSource` его получает обработчик `message`. В нём запись истории с полями `id`, `event_type`, `payload` и `created_at`, как в ответе метода [История событий](/api/bots/list-events). Служебные сообщения подключения приходят именованными событиями SSE, а в JSON их отличает поле `type`:

- `confirm_subscription` — подписка подтверждена, и события пойдут по этому подключению
- `disconnect` — ссылка истекла и сервер закрыл подключение, после него `EventSource` сам не переподключается

Сообщение о закрытии выглядит так: `{"type":"disconnect","reason":"remote","reconnect":false}`. Остальные служебные сообщения, например `welcome` и `ping`, можно пропускать.

Чтобы ничего не пропустить, работайте с потоком в таком порядке:

1. Получите ссылку методом [Поток событий](/api/bots/get-stream) с токеном бота
2. Подключитесь к ссылке и дождитесь сообщения `confirm_subscription`
3. Прочитайте историю методом [История событий](/api/bots/list-events): там события, которые пришли до подключения
4. Обрабатывайте события из потока по мере прихода, а обработанные удаляйте из истории методом [Удаление события истории](/api/bots/remove-event)
5. Примерно за пять минут до `expires_at` получите новую ссылку, подключитесь к ней, дождитесь подтверждения, снова прочитайте историю и только потом закройте старое подключение
6. Если пришло сообщение `disconnect`, закройте подключение, получите новую ссылку и вернитесь ко второму шагу

Запрос ссылки в пределах того же часа по UTC возвращает ту же ссылку с тем же `expires_at`. Запрос в последний час перед `expires_at` уже даёт новую ссылку, которая действует на час дольше, а старая работает до своего `expires_at`. Поэтому сменить ссылку можно в любой момент этого часа, и пять минут до `expires_at` — удобный запас. В момент `expires_at` сервер присылает по старой ссылке `disconnect` и закрывает подключение.

Доставка в поток не гарантирована, поэтому после каждого переподключения тоже читайте историю заново: в ней остаются все события, которые вы не удалили. Одно и то же событие может прийти несколько раз: в потоке и в истории, а пока меняется ссылка — по старому и новому подключению. У таких повторов один `id`, по нему их и отсеивайте. Если у бота есть адрес вебхука, событие, которое Пачка доставляла на него повторно, придёт в поток ещё раз с новым `id` и `webhook_timestamp`, как и в историю. Такие повторы отсеивайте по ключу из полей payload, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka). Запись в потоке может прийти и раньше, чем запрос с тем же событием на адрес вебхука.

Запросы ссылки расходуют тот же [лимит](/api/limits), что и чтение истории событий.

### Пример подключения

Пример на TypeScript для Node.js проходит все шаги: ждёт подтверждения, дочитывает историю, меняет ссылку до `expires_at` и подключается заново после `disconnect`. Если ссылку получить не удалось, пример повторяет запрос через пять секунд. `EventSource` в Node.js даёт пакет `eventsource`. Если подключение оборвалось, `EventSource` переподключается сам, а Пачка снова присылает `confirm_subscription`, и пример ещё раз дочитывает историю.

```typescript title="Подключение к потоку событий"
import { EventSource } from "eventsource" // npm install eventsource

const API = "https://api.pachca.com/api/shared/v1"
const headers = { Authorization: `Bearer ${process.env.PACHCA_BOT_TOKEN}` } // токен бота

type HistoryEvent = { id: string; event_type: string; payload: any; created_at: string }

// id обработанных записей: одно событие приходит и потоком, и из истории
// В рабочем коде храните их в базе или Redis
const processed = new Set<string>()
let current: EventSource | null = null

async function handle(record: HistoryEvent) {
  if (processed.has(record.id)) return
  processed.add(record.id)
  console.log(record.event_type, record.payload) // payload — тот же JSON, что приходит на адрес вебхука
  await fetch(`${API}/webhooks/events/${record.id}`, { method: "DELETE", headers })
}

// История отдаёт новые записи первыми: собираем все страницы и обрабатываем от старых к новым
async function readHistory() {
  const records: HistoryEvent[] = []
  let cursor = ""
  while (true) {
    const query = new URLSearchParams({ limit: "50" })
    if (cursor) query.set("cursor", cursor)
    const body = await (await fetch(`${API}/webhooks/events?${query}`, { headers })).json()
    records.push(...body.data)
    if (!body.meta.paginate.has_next) break
    cursor = body.meta.paginate.next_page
  }
  for (const record of records.reverse()) await handle(record)
}

async function connect() {
  const response = await fetch(`${API}/webhooks/events/stream`, { headers })
  if (!response.ok) throw new Error(`Поток недоступен: ${response.status}`) // 404 — история событий выключена
  const { url, expires_at } = (await response.json()).data

  const stream = new EventSource(url)

  // События бота приходят сообщениями без имени
  stream.addEventListener("message", (e) => {
    handle(JSON.parse(e.data)).catch(console.error)
  })

  // Подписка подтверждена: дочитываем историю и закрываем прежнее подключение
  stream.addEventListener("confirm_subscription", async () => {
    const previous = current
    current = stream
    await readHistory().catch(console.error)
    if (previous && previous !== stream) previous.close()
  })

  // Ссылка истекла, сервер закрыл подключение: берём новую ссылку
  stream.addEventListener("disconnect", () => {
    stream.close()
    if (current === stream) reconnect()
  })

  // EventSource не смог переподключиться сам, например после долгого обрыва связи
  stream.addEventListener("error", () => {
    if (stream.readyState !== EventSource.CLOSED) return
    if (current !== stream && current !== null) return
    current = null
    reconnect(5_000)
  })

  // Новая ссылка примерно за пять минут до expires_at
  const renewIn = new Date(expires_at).getTime() - Date.now() - 5 * 60_000
  setTimeout(() => {
    if (current === stream) reconnect()
  }, Math.max(renewIn, 0))
}

// Новое подключение, а если запрос ссылки не удался — ещё одна попытка через 5 секунд
function reconnect(delay = 0) {
  setTimeout(() => {
    connect().catch((error) => {
      console.error(error)
      reconnect(5_000)
    })
  }, delay)
}

reconnect()
```

## Пример поллинга

> SDK helpers по умолчанию начинают читать только события, созданные после запуска воркера, и дедуплицируют уже обработанные delivery ID в памяти.


**Polling событий**

### typescript

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

for await (const event of client.bots.pollWebhookEvents({ intervalMs: 5_000 })) {
  console.log(event)
}
```

### python

```python
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")

async for event in client.bots.poll_webhook_events(interval_seconds=5.0):
    print(event)
```

### go

```go
import (
	"context"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

client := pachca.NewPachcaClient("YOUR_TOKEN")
ctx := context.Background()

err := client.Bots.PollWebhookEvents(ctx, nil, func(event pachca.WebhookEvent) error {
	_ = event
	return nil
})
```

### kotlin

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.pollWebhookEvents

val client = PachcaClient("YOUR_TOKEN")

client.bots.pollWebhookEvents().collect { event ->
    println(event)
}
```

### swift

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

for try await event in client.bots.pollWebhookEvents(interval: 5) {
    print(event)
}
```

### csharp

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

await foreach (var webhookEvent in client.Bots.PollWebhookEventsAsync())
{
    _ = webhookEvent;
}
```


Если вам нужен только payload вебхука, используйте helper для polling payload'ов:

**Polling payload'ов**

### typescript

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

for await (const payload of client.bots.pollWebhookPayloads({ intervalMs: 5_000 })) {
  console.log(payload)
}
```

### python

```python
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")

async for payload in client.bots.poll_webhook_payloads(interval_seconds=5.0):
    print(payload)
```

### go

```go
import (
	"context"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

client := pachca.NewPachcaClient("YOUR_TOKEN")
ctx := context.Background()

err := client.Bots.PollWebhookPayloads(ctx, nil, func(payload pachca.WebhookPayloadUnion) error {
	_ = payload
	return nil
})
```

### kotlin

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.WebhookPayloadUnion
import com.pachca.sdk.pollWebhookPayloads

val client = PachcaClient("YOUR_TOKEN")

client.bots.pollWebhookPayloads<WebhookPayloadUnion>().collect { payload ->
    println(payload)
}
```

### swift

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

for try await payload in client.bots.pollWebhookPayloads(interval: 5) {
    print(payload)
}
```

### csharp

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

await foreach (var payload in client.Bots.PollWebhookPayloadsAsync<WebhookPayloadUnion>())
{
    _ = payload;
}
```


## Ручная работа через API

SDK helpers используют метод [История событий](/api/bots/list-events) и курсорную пагинацию. Если вы пишете собственный polling loop без SDK, периодически запрашивайте список событий, обрабатывайте новые записи и храните дедупликацию по ключу события на своей стороне. Метод [Удаление события истории](/api/bots/remove-event) можно использовать для ручной очистки обработанных записей истории.

## История при работающем вебхуке

История пригодится и боту с адресом вебхука. Событие сохраняется в историю ещё до отправки на адрес, а повторно Пачка отправляет его, только если к серверу не удалось подключиться. Если сервер был недоступен или ответил ошибкой, пропущенные события можно забрать методом [История событий](/api/bots/list-events). Подробнее о доставке — в разделе [Доставка и повторы](/guides/webhook/handler#dostavka-i-povtory).

Каждая попытка доставки записывается в историю отдельно: событие, которое Пачка отправляла повторно, окажется в истории несколько раз с разными `id` и `webhook_timestamp`. SDK helpers отсеивают записи только по их `id`, поэтому такие повторы доходят до обработчика. Отсеивайте их по ключу из полей payload, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka).


## Связанные разделы

- [Настройка и типы событий](/guides/webhook/events)
- [Безопасность и обработчик](/guides/webhook/handler)
- [Пагинация](/api/pagination)
