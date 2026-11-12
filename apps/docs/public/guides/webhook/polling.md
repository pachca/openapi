> Расположение: Исходящие вебхуки
> Краткое содержание: Поллинг исходящих вебхуков Пачки без публичного webhook URL: команда CLI pachca bots listen-events, SDK, поток событий в реальном времени по ссылке (Server-Sent Events) с примером подключения и сменой ссылки, дедупликация доставок и пример воркера для локальной разработки
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Поллинг

Пачка создаёт события для бота, а получать их можно двумя способами, в том числе сразу обоими: запросами на адрес вебхука или из истории событий, которую ваш сервер читает сам. Как выбрать способ на вкладке **Исходящий вебхук**, описано в разделе [Как получать события](/guides/webhook/events#kak-poluchat-sobytiya). Историю удобно читать, если принимать входящие HTTP-запросы нельзя (локальная разработка, жёсткие правила firewall). Проще всего это сделать одной командой [через CLI](#cherez-cli): она получает события сразу, как они происходят, и может пересылать их вашему обработчику. В своём коде события получают [потоком](#sobytiya-v-realnom-vremeni) по открытому соединению или опросом истории через API и готовые helpers в SDK, это и есть **поллинг**.

Историю включает настройка **Сохранять историю событий** на вкладке **Исходящий вебхук** в карточке бота, и **Webhook URL** для неё не нужен. Кнопка **Включить** на вкладке включает историю сразу. Через API это поле `events_history_enabled` в методах [Новый бот](/api/bots/create) и [Редактирование бота](/api/bots/update). Пока история выключена, новые события в неё не попадают, а уже сохранённые записи метод [История событий](/api/bots/list-events) отдаёт, пока вы их не удалите. Если у бота нет ни адреса вебхука, ни истории, Пачка не создаёт для него события, и то, что произошло за это время, потом не забрать.

## Через CLI

Быстрее всего получать события одной командой CLI `pachca bots listen-events`, без своего кода. Она подключается к [потоку событий](#sobytiya-v-realnom-vremeni), дожидается подтверждения подписки, дочитывает историю от старых событий к новым и меняет ссылку до истечения срока. Нужен токен бота с правом `webhooks:events:read` и включённая настройка **Сохранять историю событий**. Если команда отвечает `404`, токен не принадлежит боту, у бота выключена история событий или поток недоступен. Если переменная `PACHCA_BOT_TOKEN` пуста, команда берёт токен сохранённого профиля CLI, а он обычно персональный.

```bash title="События в терминале"
PACHCA_TOKEN=$PACHCA_BOT_TOKEN pachca bots listen-events
```

```bash title="Пересылка на свой обработчик"
PACHCA_TOKEN=$PACHCA_BOT_TOKEN PACHCA_SIGNING_SECRET=$PACHCA_SIGNING_SECRET \
  pachca bots listen-events --forward-to http://localhost:3000/webhook
```

| Режим | Что делает команда | Что с историей |
| --- | --- | --- |
| Без `--forward-to` | Печатает каждую запись истории строкой JSON: `id`, `event_type`, `payload` и `created_at`. | Записи остаются. При запуске команда печатает всю накопленную историю, а после переподключения только новые записи. |
| С `--forward-to` | Отправляет `payload` запросом POST на ваш адрес, как исходящий вебхук. | Запись удаляется после ответа `2xx`. Для этого нужно право `webhooks:events:delete`. |

Пересылка устроена как доставка вебхука, поэтому подходит [обработчик из руководства](/guides/webhook/handler#realizatsiya-webhook-handler):

- Тело подписано заголовком `Pachca-Signature`, если в переменной `PACHCA_SIGNING_SECRET` задан **Signing secret** бота. Секрет виден на вкладке **Исходящий вебхук** и у бота без адреса вебхука, а через API приходит в поле `webhook.secret_token` метода [Информация о боте](/api/bots/get), если у токена есть скоуп `bots:write` и вы можете управлять токенами бота. Токен бота для этого не подходит. Без переменной запрос уходит без подписи, и проверку подписи в обработчике придётся отключить.
- В поле `webhook_timestamp` стоит время пересылки, поэтому проверку на минуту проходят и старые записи.
- Запрос приходит с машины, на которой запущена команда, а не с адресов Пачки, поэтому проверку IP-адреса отправителя из раздела [Безопасность](/guides/webhook/handler#bezopasnost) отключите.
- Нажатие кнопки, которое пролежало в истории дольше 3 секунд, приходит со свежим `webhook_timestamp`, но форму по его `trigger_id` уже не открыть: метод [Открытие представления](/api/views/open) ответит `410`.
- В заголовке `Idempotency-Key` приходит `id` записи истории. Он одинаков при каждой пересылке этой записи, в том числе после перезапуска команды.
- На отправку формы обработчик отвечает так же, как на вебхук: кодом `2xx`, чтобы закрыть форму, или кодом `400` или `422` с объектом `errors`. Команда передаёт ответ в Пачку методом [Ответ на отправку формы](/api/views/submit-response), для этого токену нужно право `views:write`. Без него команда предупреждает при запуске, а сотрудник после отправки формы видит ошибку.
- Пачка принимает ответ на форму в течение 5 секунд с отправки, подробнее в разделе [Сроки ответа](/guides/webhook/handler#sroki-otveta). Отправку формы старше 10 секунд команда обработчику не пересылает и удаляет из истории: сотрудник к этому времени уже видел ошибку и мог отправить форму снова.

Другой ответ, ошибка соединения или таймаут останавливают команду, а запись остаётся в истории. Редиректы команда не выполняет. После перезапуска то же событие придёт снова с тем же `Idempotency-Key`. Ключ из полей payload нужен всё равно, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka): событие `update` без правки и повторное `link_shared` ложатся в историю отдельными записями с другим `id`.

В сообщении об ошибке команда называет `id` записи. Если обработчик отвечает ошибкой на одну и ту же запись при каждом запуске, например на старое нажатие кнопки, удалите её из истории и запустите команду снова.

```bash title="Удаление записи из истории"
PACHCA_TOKEN=$PACHCA_BOT_TOKEN pachca bots remove-event <id> --force
```

`--forward-to` рассчитан на бота без адреса исходящего вебхука. Если адрес задан, история служит запасом на случай сбоя доставки, а пересылка удаляет её записи. Каждое событие при этом уйдёт дважды: на адрес вебхука и на адрес из `--forward-to`. Если вебхук ведёт на рабочий сервер, на каждое событие ответят и сервер, и ваш обработчик. История у всех слушателей одного бота общая, поэтому запускайте для бота одну команду с `--forward-to`.

`--timeout` задаёт в секундах таймаут запросов к API и к обработчику и время ожидания подтверждения подписки. По умолчанию действует значение `defaults.timeout` из настроек CLI, затем переменная `PACHCA_TIMEOUT`, а без них 30 секунд. `--no-retry` отключает переподключение к потоку. Завершить команду можно через Ctrl+C.

## События в реальном времени

Опрос истории добавляет задержку, а на нажатие кнопки или отправку формы ответить нужно за секунды (все сроки — в разделе [Сроки ответа](/guides/webhook/handler#sroki-otveta)). Метод [Поток событий](/api/bots/get-stream) отдаёт ссылку, по которой события бота приходят в формате Server-Sent Events сразу, как они происходят. Публичный адрес для этого не нужен, поэтому поток подходит и для разработки на своей машине.

В поток попадают те же события, что ложатся в историю, поэтому он работает, когда включена настройка **Сохранять историю событий**. Если она выключена или поток недоступен, метод отвечает `404` без тела, а события по-прежнему можно забирать запросами к истории.

Ссылку открывают без токена: через `EventSource`, `curl -N` или другой клиент SSE. Доступ даёт сама ссылка, поэтому храните её как секрет и не записывайте в логи. Ссылка действует от одного до двух часов, точное время приходит в поле `expires_at`.

Каждое сообщение потока — JSON. Событие бота приходит сообщением без имени, в `EventSource` его получает обработчик `message`. В нём запись истории с полями `id`, `event_type`, `payload` и `created_at`, как в ответе метода [История событий](/api/bots/list-events). Служебные сообщения подключения приходят именованными событиями SSE, а в JSON их отличает поле `type`:

- `confirm_subscription` — подписка подтверждена, и события пойдут по этому подключению
- `disconnect` — ссылка истекла и сервер закрыл подключение, после него `EventSource` сам не переподключается

Сообщение о закрытии выглядит так: `{"type":"disconnect","reason":"remote","reconnect":false}`. Остальные служебные сообщения, например `welcome` и `ping`, можно пропускать.

Чтобы ничего не пропустить, работайте с потоком в таком порядке.


  ### Шаг 1. Получите ссылку

Вызовите метод [Поток событий](/api/bots/get-stream) с токеном бота.


  ### Шаг 2. Подключитесь и дождитесь подтверждения

Подключитесь к ссылке и дождитесь сообщения `confirm_subscription`.


  ### Шаг 3. Дочитайте историю

Прочитайте историю методом [История событий](/api/bots/list-events): там события, которые пришли до подключения.


  ### Шаг 4. Обрабатывайте события

Обрабатывайте события из потока по мере прихода, а обработанные удаляйте из истории методом [Удаление события истории](/api/bots/remove-event).


  ### Шаг 5. Смените ссылку заранее

Примерно за пять минут до `expires_at` получите новую ссылку, подключитесь к ней, дождитесь подтверждения, снова прочитайте историю и только потом закройте старое подключение.

Запрос ссылки в пределах того же часа по UTC возвращает ту же ссылку с тем же `expires_at`. Запрос в последний час перед `expires_at` уже даёт новую ссылку, которая действует на час дольше, а старая работает до своего `expires_at`. Поэтому сменить ссылку можно в любой момент этого часа, и пять минут до `expires_at` — удобный запас. В момент `expires_at` сервер присылает по старой ссылке `disconnect` и закрывает подключение.


  ### Шаг 6. Переподключитесь после закрытия

Если пришло сообщение `disconnect`, закройте подключение, получите новую ссылку и вернитесь ко второму шагу.


Доставка в поток не гарантирована, поэтому после каждого переподключения тоже читайте историю заново: в ней остаются все события, которые вы не удалили. Одно и то же событие может прийти несколько раз: в потоке и в истории, а пока меняется ссылка — по старому и новому подключению. У таких повторов один `id`, по нему их и отсеивайте. Если у бота есть адрес вебхука, а запись вы удалили до того, как Пачка повторила доставку на него, повтор ляжет в историю заново и придёт в поток ещё раз с новым `id`. Такие повторы отсеивайте по ключу из полей payload, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka). Запись в потоке может прийти и раньше, чем запрос с тем же событием на адрес вебхука.

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

Историю можно оставить включённой и вместе с адресом вебхука. Тогда событие сохраняется в историю ещё до отправки на адрес, а повторно Пачка отправляет его, только если к серверу не удалось подключиться. Если сервер был недоступен или ответил ошибкой, пропущенные события можно забрать методом [История событий](/api/bots/list-events). Подробнее о доставке — в разделе [Доставка и повторы](/guides/webhook/handler#dostavka-i-povtory).

Пока запись первой попытки лежит в истории, повторная доставка на адрес вебхука новой записи не создаёт, и событие остаётся в истории одной записью с одним `id`. Повтор несёт сообщение таким, каким оно было при первой попытке, даже если его успели изменить или удалить. Если запись удалили методом [Удаление события истории](/api/bots/remove-event) до повтора, повтор соберётся заново и ляжет в историю новой записью с новым `id`. Изредка так бывает и без удаления. SDK helpers отсеивают записи по `id`, поэтому такой повтор дойдёт до обработчика. Отсеивайте его по ключу из полей payload, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka).


## Связанные разделы

- [Настройка и типы событий](/guides/webhook/events)
- [Безопасность и обработчик](/guides/webhook/handler)
- [Пагинация](/api/pagination)
