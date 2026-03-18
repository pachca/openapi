
# TypeScript SDK

[@pachca/sdk](https://www.npmjs.com/package/@pachca/sdk) npm


Типизированный клиент для Pachca API. Работает в Node.js 18+ и в любом окружении с поддержкой `fetch`. ES Module с TypeScript-декларациями.

## Быстрый старт


  ### Шаг 1. Установка

```bash
npm install @pachca/sdk
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки → Автоматизации → API** (подробнее — [Авторизация](/api/authorization)).

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

*Endpoint not found*


## Инициализация

```typescript
import { PachcaClient } from "@pachca/sdk"

// Стандартное подключение
const client = new PachcaClient("YOUR_TOKEN")

// С кастомным базовым URL
const client = new PachcaClient("YOUR_TOKEN", "https://custom-api.example.com/api/shared/v1")
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `token` | `string` | — | Bearer-токен для авторизации |
| `baseUrl` | `string` | `https://api.pachca.com/api/shared/v1` | Базовый URL API |

Клиент не требует явного закрытия — все запросы используют глобальный `fetch`.

## Сервисы

Клиент предоставляет 16 сервисов — по одному на каждую группу API-методов:

| Сервис | Описание | Документация |
|--------|----------|-------------|
| `client.security` | Журнал аудита | [/api/security/list](/api/security/list) |
| `client.bots` | Вебхуки и настройки бота | [/api/bots/list-events](/api/bots/list-events) |
| `client.chats` | Чаты, каналы, беседы | [/api/chats/list](/api/chats/list) |
| `client.common` | Кастомные поля, загрузки, экспорт | [/api/common/custom-properties](/api/common/custom-properties) |
| `client.groupTags` | Теги (группы сотрудников) | [/api/group-tags/list](/api/group-tags/list) |
| `client.linkPreviews` | Разворачивание ссылок | [/api/link-previews/add](/api/link-previews/add) |
| `client.members` | Участники чатов | [/api/members/list](/api/members/list) |
| `client.messages` | Сообщения | [/api/messages/list](/api/messages/list) |
| `client.profile` | Профиль и статус текущего пользователя | [/api/profile/get](/api/profile/get) |
| `client.reactions` | Реакции на сообщения | [/api/reactions/list](/api/reactions/list) |
| `client.readMembers` | Прочитавшие сообщение | [/api/read-member/list-readers](/api/read-member/list-readers) |
| `client.search` | Поиск по чатам, сообщениям, пользователям | [/api/search/chats](/api/search/chats) |
| `client.tasks` | Задачи и напоминания | [/api/tasks/list](/api/tasks/list) |
| `client.threads` | Треды | [/api/threads/get](/api/threads/get) |
| `client.users` | Сотрудники | [/api/users/list](/api/users/list) |
| `client.views` | Формы и представления | [/api/views/open](/api/views/open) |

## Запросы

Все методы — асинхронные и возвращают `Promise`.

**GET с параметрами:**

*Endpoint not found*


**POST с телом запроса:**

*Endpoint not found*


**Простой вызов по ID:**

*Endpoint not found*


## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ содержит поле `meta.paginate.nextPage` — курсор для следующей страницы.

### Ручная пагинация

```typescript
let cursor: string | undefined

do {
  const response = await client.users.listUsers({ limit: 50, cursor })
  for (const user of response.data) {
    console.log(user.firstName, user.lastName)
  }
  cursor = response.meta?.paginate?.nextPage
} while (cursor)
```

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант, который автоматически обходит все страницы и возвращает плоский массив:

```typescript
// Все пользователи одним массивом
const users = await client.users.listUsersAll()
console.log(`Всего: ${users.length}`)
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.getAuditEventsAll()` | `AuditEvent[]` |
| `bots.getWebhookEventsAll()` | `WebhookEvent[]` |
| `chats.listChatsAll()` | `Chat[]` |
| `groupTags.listTagsAll()` | `GroupTag[]` |
| `members.listMembersAll()` | `User[]` |
| `messages.listChatMessagesAll()` | `Message[]` |
| `reactions.listReactionsAll()` | `Reaction[]` |
| `search.searchChatsAll()` | `Chat[]` |
| `search.searchMessagesAll()` | `Message[]` |
| `search.searchUsersAll()` | `User[]` |
| `tasks.listTasksAll()` | `Task[]` |
| `users.listUsersAll()` | `User[]` |

## Обработка ошибок

SDK выбрасывает два типа ошибок:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422`:

```typescript
import { PachcaClient, ApiError } from "@pachca/sdk"

try {
  await client.chats.createChat(request)
} catch (error) {
  if (error instanceof ApiError) {
    for (const e of error.errors) {
      console.log(e.key, e.message)   // "name", "не может быть пустым"
      console.log(e.code)             // "blank"
    }
  }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `string` | Поле, вызвавшее ошибку |
| `value` | `string` | Переданное значение |
| `message` | `string` | Текст ошибки |
| `code` | `string` | Код валидации (`blank`, `invalid`, `taken`, ...) |
| `payload` | `object` | Дополнительные данные |

### OAuthError

Возникает при ошибках авторизации (`401`, `403`):

```typescript
import { OAuthError } from "@pachca/sdk"

try {
  await client.profile.getProfile()
} catch (error) {
  if (error instanceof OAuthError) {
    console.log(error.message) // "Token not found"
  }
}
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests`:

- До **3 попыток** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- Все остальные ошибки возвращаются сразу без retry

## Сериализация

SDK автоматически конвертирует имена полей между camelCase (TypeScript) и snake_case (API):

```typescript
// Вы пишете:
{ memberIds: [123], groupTagIds: [456] }

// SDK отправляет:
{ "member_ids": [123], "group_tag_ids": [456] }

// API возвращает:
{ "last_message_at": "2025-01-01T00:00:00Z" }

// Вы получаете:
{ lastMessageAt: "2025-01-01T00:00:00Z" }
```

## Типы

Все типы экспортируются из пакета:

```typescript
import {
  // Модели
  Chat, Message, User, Task, GroupTag, Thread, Reaction,
  // Запросы
  ChatCreateRequest, MessageCreateRequest, TaskCreateRequest,
  // Параметры
  ListChatsParams, ListUsersParams, SearchMessagesParams,
  // Ответы
  ListChatsResponse, ListMembersResponse,
  // Перечисления
  AuditEventKey, ChatAvailability, SortOrder,
  // Ошибки
  ApiError, OAuthError,
} from "@pachca/sdk"
```

## Примеры

*Endpoint not found*


## Исходный код

- [SDK на GitHub](https://github.com/pachca/openapi/tree/main/sdk/typescript)
- [npm](https://www.npmjs.com/package/@pachca/sdk)
