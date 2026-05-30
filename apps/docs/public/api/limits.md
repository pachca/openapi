> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Лимиты

Мы следим за стабильностью API, поэтому есть лимиты на запросы (rate limiting). Они гибкие, зависят от нагрузки, но мы сделали их комфортными — должно хватить для любых ваших задач.

## Входящие вебхуки


Если за секунду отправите больше указанного количества запросов на один идентификатор, лишние получат `429 Too Many Requests`. В заголовке `Retry-After` мы укажем, через сколько секунд можно попробовать снова.

## API


Если за секунду будет больше указанных запросов с одним токеном, API вернёт `429 Too Many Requests`. В заголовке `Retry-After` мы укажем, через сколько секунд можно попробовать снова.

- **Лимиты гибкие:** они ориентировочные и могут меняться, чтобы всё работало гладко;
- **Должно хватать на всё:** мы настроили их так, чтобы вам было комфортно в любых сценариях;
- **Если упёрлись в лимит:** при ошибке `429` смотрите заголовок `Retry-After` — он подскажет, через сколько секунд повторить запрос (или используйте экспоненциальный `backoff`, если хотите перестраховаться).

## Защита от перегрузки

Если приложение продолжает слать запросы выше лимитов даже после `429`, доступ токена может быть временно ограничен — это защита от сбойных циклов и случайной перегрузки. Чтобы этого избежать:

- Соблюдайте `Retry-After` — он указывает, через сколько секунд имеет смысл повторить
- Используйте экспоненциальный backoff с jitter — готовые примеры ниже в разделе [Повторные запросы](#povtornye-zaprosy-retry)
- Если ваш сервис не успевает обрабатывать ответы, приостановите запросы, а не ускоряйте retry

## Повторные запросы (Retry)

[SDK](/guides/sdk/overview) ([TypeScript](/guides/sdk/typescript), [Python](/guides/sdk/python)) уже включают автоматический retry с экспоненциальным backoff. Ниже — реализация для кастомных HTTP-клиентов.

### TypeScript

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      // 429 Too Many Requests — ждём Retry-After или backoff
      if (error.status === 429) {
        const retryAfter = error.headers?.["retry-after"]
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt) * 1000 * (0.5 + Math.random())
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      // 5xx — серверная ошибка, backoff с jitter
      if (error.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 * (0.5 + Math.random())
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      // 4xx (кроме 429) — не повторяем
      throw error
    }
  }
  throw new Error("Max retries exceeded")
}

// Использование
const users = await withRetry(() => client.users.listUsers())
```

### Python

```python
import time, random

async def with_retry(fn, max_retries=3):
    for attempt in range(max_retries + 1):
        try:
            return await fn()
        except Exception as e:
            status = getattr(e, "status_code", getattr(e, "status", 0))
            headers = getattr(e, "headers", {})
            # 429 Too Many Requests
            if status == 429:
                retry_after = headers.get("Retry-After")
                delay = int(retry_after) if retry_after else (2 ** attempt) * (0.5 + random.random())
                time.sleep(delay)
                continue
            # 5xx — серверная ошибка
            if status >= 500 and attempt < max_retries:
                time.sleep((2 ** attempt) * (0.5 + random.random()))
                continue
            raise
    raise Exception("Max retries exceeded")

# Использование
users = await with_retry(lambda: client.users.list_users())
```

### Стратегия повторов

| Код | Действие | Задержка |
| --- | --- | --- |
| `429` | Повторить | `Retry-After` header или exponential backoff: 1с, 2с, 4с × jitter |
| `500`, `502`, `503`, `504` | Повторить | Exponential backoff с jitter: ~1с, ~2с, ~4с |
| `400`, `401`, `403`, `404`, `422` | **Не повторять** | Ошибка клиента — нужно [исправить запрос](/api/errors) |

> Максимум **3 повтора** на каждый запрос. Jitter (случайный множитель 0.5–1.5) предотвращает «thundering herd» при массовых 429.



## Связанные разделы

- [Ошибки](/api/errors)
- [Запросы и ответы](/api/requests-responses)
