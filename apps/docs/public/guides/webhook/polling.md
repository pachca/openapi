> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Поллинг

Если у вас нет возможности принимать входящие HTTP-запросы (локальная разработка, жёсткие firewall-правила), используйте **поллинг** — получение событий через API.

Включите настройку **Сохранять историю событий** на вкладке **Исходящий Webhook** в настройках бота (подробнее — в разделе [Настройка и типы событий](/guides/webhook/events#obschie-nastroiki)), чтобы получать события через API:

- [Список событий бота](GET /webhooks/events) — получить накопленные события
- [Удалить событие](DELETE /webhooks/events/{id}) — удалить обработанное событие из очереди

> Периодически запрашивайте список событий, обрабатывайте каждое и удаляйте обработанные.


## Пример поллинга (TypeScript)

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
