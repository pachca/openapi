> Расположение: Исходящие вебхуки
> Краткое содержание: Поллинг исходящих вебхуков Пачки через SDK: получение новых событий без публичного webhook URL, поток событий в реальном времени по ссылке (Server-Sent Events), дедупликация доставок и пример воркера для локальной разработки
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Поллинг

Если у вас нет возможности принимать входящие HTTP-запросы (локальная разработка, жёсткие firewall-правила), используйте **поллинг** — получение событий через API или готовые helpers в SDK. Когда на событие нужно ответить сразу, подключитесь к [потоку событий](#sobytiya-v-realnom-vremeni): события придут по открытому соединению без опроса.

Включите настройку **Сохранять историю событий** на вкладке **Исходящий вебхук** в карточке бота (подробнее — в разделе [Настройка и типы событий](/guides/webhook/events#obschie-nastroyki)), чтобы получать события через метод [История событий](/api/bots/list-events). Без неё метод отдаёт пустой список. В интерфейсе настройка появляется только после включения вебхука, то есть когда указан URL. Если принимать запросы нельзя совсем, включите историю программно — полем `events_history_enabled` в методах [Новый бот](/api/bots/create) и [Редактирование бота](/api/bots/update): адрес вебхука для этого не нужен.

> SDK helpers по умолчанию начинают читать только события, созданные после запуска воркера, и дедуплицируют уже обработанные delivery ID в памяти.


## История при работающем вебхуке

История пригодится и боту с адресом вебхука. Событие сохраняется в историю ещё до отправки на адрес, а повторно Пачка отправляет его, только если к серверу не удалось подключиться. Если сервер был недоступен или ответил ошибкой, пропущенные события можно забрать методом [История событий](/api/bots/list-events). Подробнее о доставке — в разделе [Безопасность и обработчик](/guides/webhook/handler#dostavka-i-povtory).

Каждая попытка доставки записывается в историю отдельно: событие, которое Пачка отправляла повторно, окажется в истории несколько раз с разными `id` и `webhook_timestamp`. SDK helpers отсеивают записи только по их `id`, поэтому такие повторы доходят до обработчика. Отсеивайте их по ключу из полей payload, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka).

## Пример поллинга

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
import pachca "github.com/pachca/openapi/sdk/go/generated"

client := pachca.NewPachcaClient("YOUR_TOKEN")

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
import pachca "github.com/pachca/openapi/sdk/go/generated"

client := pachca.NewPachcaClient("YOUR_TOKEN")

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

## События в реальном времени

Опрос истории добавляет задержку, а на нажатие кнопки или отправку формы ответить нужно за секунды. Метод [Поток событий](/api/bots/get-stream) отдаёт ссылку, по которой события бота приходят в формате Server-Sent Events сразу, как они происходят. Публичный адрес для этого не нужен, поэтому поток подходит и для разработки на своей машине.

В поток попадают те же события, что ложатся в историю, поэтому он работает, только когда включена настройка **Сохранять историю событий**. Если она выключена или поток недоступен, метод отвечает `404` без тела, а события по-прежнему можно забирать запросами к истории.

Ссылку открывают без токена: через `EventSource`, `curl -N` или другой клиент SSE. Доступ даёт сама ссылка, поэтому храните её как секрет и не записывайте в логи. Каждое сообщение потока — JSON. Событие приходит записью истории с полями `id`, `event_type`, `payload` и `created_at`, как в ответе метода [История событий](/api/bots/list-events), а служебные сообщения подключения отличаются полем `type`: например, `confirm_subscription` подтверждает подписку.

Чтобы ничего не пропустить, работайте с потоком в таком порядке:

1. Получите ссылку методом [Поток событий](/api/bots/get-stream) с токеном бота.
2. Подключитесь к ссылке и дождитесь сообщения с `type: "confirm_subscription"`.
3. Прочитайте историю методом [История событий](/api/bots/list-events): там события, которые пришли до подключения.
4. Обрабатывайте события из потока по мере прихода. Обработанные события удаляйте из истории методом [Удаление события истории](/api/bots/remove-event), как и при поллинге.
5. Ссылка действует до `expires_at`. В последние пять минут перед этим временем получите новую ссылку, подключитесь к ней, дождитесь подтверждения, снова прочитайте историю и только потом закройте старое подключение.

Более ранний запрос новой ссылки вернёт ту же ссылку с тем же `expires_at`. После `expires_at` старое подключение не закрывается, но события по нему больше не приходят. Доставка в поток не гарантирована, поэтому после каждого переподключения тоже читайте историю заново: в ней остаются все события, которые вы не удалили.

Одно и то же событие может прийти несколько раз: в потоке и в истории, а пока меняется ссылка — по старому и новому подключению. У таких повторов один `id`, по нему их и отсеивайте. Если у бота есть адрес вебхука, событие, которое Пачка доставляла на него повторно, придёт в поток ещё раз с новым `id` и `webhook_timestamp`, как и в историю. Такие повторы отсеивайте по ключу из полей payload, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka). Запись в потоке может прийти и раньше, чем запрос с тем же событием на адрес вебхука.

Запросы ссылки расходуют тот же [лимит](/api/limits), что и чтение истории событий.


## Связанные разделы

- [Настройка и типы событий](/guides/webhook/events)
- [Безопасность и обработчик](/guides/webhook/handler)
- [Пагинация](/api/pagination)
