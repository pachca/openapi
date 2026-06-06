> Расположение: Исходящие вебхуки
> Краткое содержание: Поллинг исходящих вебхуков Пачки через SDK: получение новых событий без публичного webhook URL, дедупликация доставок и пример воркера для локальной разработки
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Поллинг

Если у вас нет возможности принимать входящие HTTP-запросы (локальная разработка, жёсткие firewall-правила), используйте **поллинг** — получение событий через API или готовые helpers в SDK.

Включите настройку **Сохранять историю событий** на вкладке **Исходящий Webhook** в настройках бота (подробнее — в разделе [Настройка и типы событий](/guides/webhook/events#obschie-nastroiki)), чтобы получать события через метод [История событий](GET /webhooks/events).

> SDK helpers по умолчанию начинают читать только события, созданные после запуска воркера, и дедуплицируют уже обработанные delivery ID в памяти.


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

SDK helpers используют метод [История событий](GET /webhooks/events) и курсорную пагинацию. Если вы пишете собственный polling loop без SDK, периодически запрашивайте список событий, обрабатывайте новые delivery ID и храните дедупликацию на своей стороне. Метод [Удаление события](DELETE /webhooks/events/{id}) можно использовать для ручной очистки обработанных записей истории.


## Связанные разделы

- [Настройка и типы событий](/guides/webhook/events)
- [Безопасность и обработчик](/guides/webhook/handler)
- [Пагинация](/api/pagination)
