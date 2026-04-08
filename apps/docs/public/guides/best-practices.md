
# Best Practices

Рекомендации по построению надёжных интеграций с Pachca API: идемпотентность, обработка частичных сбоев, паттерны отказоустойчивости и масштабирование.

## Идемпотентность

Операции Pachca API **не идемпотентны по умолчанию** — повторный `POST /messages` создаст дубликат сообщения. Для предотвращения дубликатов используйте клиентскую дедупликацию.

### Клиентская дедупликация с request ID

```typescript
import { PachcaClient } from "@pachca/sdk"
import crypto from "crypto"

const client = new PachcaClient("YOUR_TOKEN")

// Хранилище отправленных запросов (в production — Redis/DB с TTL)
const sentRequests = new Map<string, any>()
const REQUEST_TTL = 3600_000 // 1 час

async function sendMessageOnce(
  chatId: number,
  content: string,
  requestId: string
) {
  // Проверяем, был ли запрос уже обработан
  const existing = sentRequests.get(requestId)
  if (existing) return existing

  // Отправляем сообщение
  const response = await client.messages.createMessage({
    message: { entityType: "discussion", entityId: chatId, content }
  })

  // Сохраняем результат
  sentRequests.set(requestId, response)
  setTimeout(() => sentRequests.delete(requestId), REQUEST_TTL)
  return response
}

// Использование — один и тот же requestId = одно сообщение
const requestId = crypto.randomUUID()
await sendMessageOnce(12345, "Отчёт готов", requestId)
await sendMessageOnce(12345, "Отчёт готов", requestId) // Не создаст дубликат
```

### Python

```python
import uuid, time
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")

sent_requests: dict[str, tuple[any, float]] = {}  # request_id → (result, timestamp)
REQUEST_TTL = 3600  # 1 hour

async def send_message_once(chat_id: int, content: str, request_id: str):
    # Очистка устаревших записей
    now = time.time()
    expired = [k for k, (_, ts) in sent_requests.items() if now - ts > REQUEST_TTL]
    for k in expired:
        del sent_requests[k]

    # Проверка дубликата
    if request_id in sent_requests:
        return sent_requests[request_id][0]

    # Отправка
    from pachca.models import MessageCreateRequest, MessageCreateRequestMessage
    response = await client.messages.create_message(MessageCreateRequest(
        message=MessageCreateRequestMessage(entity_type="discussion", entity_id=chat_id, content=content)
    ))
    sent_requests[request_id] = (response, now)
    return response

# Использование
request_id = str(uuid.uuid4())
await send_message_once(12345, "Отчёт готов", request_id)
await send_message_once(12345, "Отчёт готов", request_id)  # Не создаст дубликат
```

## Обработка частичных сбоев (Saga Pattern)

При выполнении многошаговых операций (создать чат → добавить участников → отправить приветствие) используйте паттерн компенсирующих действий:

```typescript
import { PachcaClient, ApiError } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

async function createProjectChat(name: string, memberIds: number[]) {
  // Шаг 1: Создать чат (критическая операция)
  const chat = await client.chats.createChat({
    chat: { name, memberIds: [], channel: false, public: false }
  })

  // Шаг 2: Добавить участников (критическая — откатываем при сбое)
  try {
    await client.members.addMembers(chat.id, { memberIds })
  } catch (error) {
    // Компенсирующее действие: удаляем чат
    console.error("Ошибка добавления участников, удаляем чат:", error)
    await client.chats.deleteChat(chat.id)
    throw new Error(`Не удалось добавить участников: ${(error as Error).message}`)
  }

  // Шаг 3: Отправить приветствие (некритическая — не откатываем)
  try {
    await client.messages.createMessage({
      message: {
        entityType: "discussion",
        entityId: chat.id,
        content: `Добро пожаловать в ${name}! 🎉`
      }
    })
  } catch {
    console.warn("Приветственное сообщение не отправлено, продолжаем")
  }

  return chat
}
```

### Python

```python
async def create_project_chat(name: str, member_ids: list[int]):
    # Шаг 1: Создать чат
    chat = await client.chats.create_chat(ChatCreateRequest(
        chat=ChatCreateRequestChat(name=name, member_ids=[], channel=False, public=False)
    ))

    # Шаг 2: Добавить участников (откат при сбое)
    try:
        await client.members.add_members(chat.id, AddMembersRequest(member_ids=member_ids))
    except Exception as e:
        await client.chats.delete_chat(chat.id)  # Компенсирующее действие
        raise RuntimeError(f"Не удалось добавить участников: {e}")

    # Шаг 3: Приветствие (без отката)
    try:
        await client.messages.create_message(MessageCreateRequest(
            message=MessageCreateRequestMessage(
                entity_type="discussion", entity_id=chat.id, content=f"Добро пожаловать в {name}!"
            )
        ))
    except Exception:
        pass  # Некритическая операция

    return chat
```

### Принципы

- **Критические операции** (создание ресурсов, добавление участников) — при сбое выполните компенсирующее действие (удаление)
- **Некритические операции** (приветствия, уведомления) — при сбое логируйте и продолжайте
- **Порядок важен** — выполняйте критические операции первыми

## Идемпотентная обработка вебхуков

Pachca использует **at-least-once delivery** — один и тот же вебхук может прийти повторно. Обработчик должен быть идемпотентным.

```typescript
import express from "express"
import crypto from "crypto"

const SIGNING_SECRET = "your_secret"

// В production используйте Redis с TTL вместо Set
const processedEvents = new Set<string>()

function getEventKey(event: any): string {
  return `${event.type}:${event.event}:${event.id || event.message_id || ""}:${event.webhook_timestamp}`
}

const app = express()
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  // Проверка подписи
  const sig = crypto.createHmac("sha256", SIGNING_SECRET).update(req.body).digest("hex")
  if (sig !== req.headers["pachca-signature"]) return res.status(401).send("Invalid")

  const event = JSON.parse(req.body.toString())

  // Дедупликация
  const key = getEventKey(event)
  if (processedEvents.has(key)) {
    return res.status(200).send("Already processed")
  }

  // Отвечаем быстро, обрабатываем в фоне
  res.status(200).send("OK")
  processedEvents.add(key)

  try {
    await processEvent(event)
  } catch (error) {
    console.error("Ошибка обработки:", error)
    // Сохраните в Dead Letter Queue для повторной обработки
  }
})
```

## Circuit Breaker

Если внешний сервис (включая Pachca API) временно недоступен, Circuit Breaker предотвращает каскадные сбои:

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private readonly threshold = 5       // Порог последовательных сбоев
  private readonly cooldown = 30_000   // Пауза перед повторной попыткой (30с)

  async call<T>(fn: () => Promise<T>): Promise<T> {
    // Проверяем, открыт ли circuit
    if (this.failures >= this.threshold) {
      if (Date.now() - this.lastFailure < this.cooldown) {
        throw new Error("Circuit breaker open — service unavailable")
      }
      // Cooldown прошёл — пробуем снова (half-open state)
    }

    try {
      const result = await fn()
      this.failures = 0 // Сброс при успехе
      return result
    } catch (error) {
      this.failures++
      this.lastFailure = Date.now()
      throw error
    }
  }
}

// Использование
const breaker = new CircuitBreaker()
try {
  const users = await breaker.call(() => client.users.listUsers())
} catch (error) {
  // Graceful degradation: показать кэшированные данные
  console.warn("API недоступен, используем кэш")
}
```

## Dead Letter Queue (DLQ)

Для операций, которые не должны быть потеряны, используйте очередь:

```typescript
interface DLQEntry {
  id: string
  operation: string
  payload: any
  attempts: number
  lastError: string
  createdAt: Date
}

// В production — Redis, RabbitMQ, SQS или БД
const dlq: DLQEntry[] = []

async function executeWithDLQ(
  operation: string,
  payload: any,
  fn: () => Promise<void>
) {
  try {
    await fn()
  } catch (error) {
    dlq.push({
      id: crypto.randomUUID(),
      operation,
      payload,
      attempts: 1,
      lastError: (error as Error).message,
      createdAt: new Date()
    })
    console.error(`Операция ${operation} в DLQ:`, (error as Error).message)
  }
}

// Фоновый worker обрабатывает DLQ
async function processDLQ() {
  for (const entry of [...dlq]) {
    if (entry.attempts >= 5) {
      console.error(`DLQ: ${entry.operation} исчерпал попытки, требуется ручное вмешательство`)
      continue
    }
    try {
      await retryOperation(entry)
      dlq.splice(dlq.indexOf(entry), 1)
    } catch {
      entry.attempts++
    }
  }
}

// Запускать каждую минуту
setInterval(processDLQ, 60_000)
```

## Рекомендации по масштабированию

### Rate Limiting на стороне клиента

```typescript
class RateLimiter {
  private queue: Array<() => void> = []
  private running = 0
  private readonly maxPerSecond: number

  constructor(maxPerSecond: number) {
    this.maxPerSecond = maxPerSecond
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this.running++
        try {
          resolve(await fn())
        } catch (e) {
          reject(e)
        } finally {
          this.running--
          setTimeout(() => {
            const next = this.queue.shift()
            if (next) next()
          }, 1000 / this.maxPerSecond)
        }
      }
      if (this.running < this.maxPerSecond) {
        run()
      } else {
        this.queue.push(run)
      }
    })
  }
}

// Ограничиваем отправку сообщений — 3 req/sec (с запасом от лимита ~4)
const messageLimiter = new RateLimiter(3)
for (const chatId of chatIds) {
  await messageLimiter.execute(() =>
    client.messages.createMessage({
      message: { entityType: "discussion", entityId: chatId, content: "Уведомление" }
    })
  )
}
```

### Разделение критичных и некритичных операций

```typescript
async function onboardUser(userId: number, chatIds: number[]) {
  // Критичные: добавляем пользователя во все обязательные чаты
  const criticalErrors: Error[] = []
  for (const chatId of chatIds) {
    try {
      await client.members.addMembers(chatId, { memberIds: [userId] })
    } catch (error) {
      criticalErrors.push(error as Error)
    }
  }
  if (criticalErrors.length > 0) {
    throw new AggregateError(criticalErrors, "Не удалось добавить в часть чатов")
  }

  // Некритичные: приветственное сообщение
  for (const chatId of chatIds) {
    try {
      await client.messages.createMessage({
        message: { entityType: "discussion", entityId: chatId, content: `Добро пожаловать! 👋` }
      })
    } catch {
      // Логируем, но не падаем
    }
  }
}
```
