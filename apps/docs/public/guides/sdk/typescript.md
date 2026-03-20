
# TypeScript

[@pachca/sdk](https://www.npmjs.com/package/@pachca/sdk) npm


Типизированный клиент для Pachca API. Работает в Node.js 18+ и в любом окружении с поддержкой `fetch`. ES Module с TypeScript-декларациями.

## Быстрый старт


  ### Шаг 1. Установка

```bash
npm install @pachca/sdk
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки** > **Автоматизации** > **API** (подробнее — [Авторизация](/api/authorization)).

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```typescript
// Получение профиля
const response = client.profile.getProfile()
// → User({ id: number, firstName: string, lastName: string, nickname: string, email: string, phoneNumber: string, department: string, title: string, role: UserRole, suspended: boolean, inviteStatus: InviteStatus, listTags: string[], customProperties: CustomProperty({ id: number, name: string, dataType: CustomPropertyDataType, value: string })[], userStatus: UserStatus({ emoji: string, title: string, expiresAt: string | null, isAway: boolean, awayMessage: UserStatusAwayMessage({ text: string }) | null }) | null, bot: boolean, sso: boolean, createdAt: string, lastActivityAt: string, timeZone: string, imageUrl: string | null })
```


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

## Все методы

| Метод | Метод API |
|-------|----------|
| `client.common.requestExport()` | [Экспорт сообщений](/api/common/request-export) |
| `client.common.uploadFile()` | [Загрузка файла](/api/common/direct-url) |
| `client.common.getUploadParams()` | [Получение подписи, ключа и других параметров](/api/common/uploads) |
| `client.common.downloadExport()` | [Скачать архив экспорта](/api/common/get-exports) |
| `client.common.listProperties()` | [Список дополнительных полей](/api/common/custom-properties) |
| `client.profile.getTokenInfo()` | [Информация о токене](/api/profile/get-info) |
| `client.profile.getProfile()` | [Информация о профиле](/api/profile/get) |
| `client.profile.getStatus()` | [Текущий статус](/api/profile/get-status) |
| `client.profile.updateStatus()` | [Новый статус](/api/profile/update-status) |
| `client.profile.deleteStatus()` | [Удаление статуса](/api/profile/delete-status) |
| `client.users.createUser()` | [Создать сотрудника](/api/users/create) |
| `client.users.listUsers()` | [Список сотрудников](/api/users/list) |
| `client.users.getUser()` | [Информация о сотруднике](/api/users/get) |
| `client.users.getUserStatus()` | [Статус сотрудника](/api/users/get-status) |
| `client.users.updateUser()` | [Редактирование сотрудника](/api/users/update) |
| `client.users.updateUserStatus()` | [Новый статус сотрудника](/api/users/update-status) |
| `client.users.deleteUser()` | [Удаление сотрудника](/api/users/delete) |
| `client.users.deleteUserStatus()` | [Удаление статуса сотрудника](/api/users/remove-status) |
| `client.groupTags.createTag()` | [Новый тег](/api/group-tags/create) |
| `client.groupTags.listTags()` | [Список тегов сотрудников](/api/group-tags/list) |
| `client.groupTags.getTag()` | [Информация о теге](/api/group-tags/get) |
| `client.groupTags.getTagUsers()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.groupTags.updateTag()` | [Редактирование тега](/api/group-tags/update) |
| `client.groupTags.deleteTag()` | [Удаление тега](/api/group-tags/delete) |
| `client.chats.createChat()` | [Новый чат](/api/chats/create) |
| `client.chats.listChats()` | [Список чатов](/api/chats/list) |
| `client.chats.getChat()` | [Информация о чате](/api/chats/get) |
| `client.chats.updateChat()` | [Обновление чата](/api/chats/update) |
| `client.chats.archiveChat()` | [Архивация чата](/api/chats/archive) |
| `client.chats.unarchiveChat()` | [Разархивация чата](/api/chats/unarchive) |
| `client.members.addTags()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.members.addMembers()` | [Добавление пользователей](/api/members/add) |
| `client.members.listMembers()` | [Список участников чата](/api/members/list) |
| `client.members.updateMemberRole()` | [Редактирование роли](/api/members/update) |
| `client.members.removeTag()` | [Исключение тега](/api/members/remove-group-tag) |
| `client.members.leaveChat()` | [Выход из беседы или канала](/api/members/leave) |
| `client.members.removeMember()` | [Исключение пользователя](/api/members/remove) |
| `client.threads.createThread()` | [Новый тред](/api/threads/add) |
| `client.threads.getThread()` | [Информация о треде](/api/threads/get) |
| `client.messages.createMessage()` | [Новое сообщение](/api/messages/create) |
| `client.messages.pinMessage()` | [Закрепление сообщения](/api/messages/pin) |
| `client.messages.listChatMessages()` | [Список сообщений чата](/api/messages/list) |
| `client.messages.getMessage()` | [Информация о сообщении](/api/messages/get) |
| `client.messages.updateMessage()` | [Редактирование сообщения](/api/messages/update) |
| `client.messages.deleteMessage()` | [Удаление сообщения](/api/messages/delete) |
| `client.messages.unpinMessage()` | [Открепление сообщения](/api/messages/unpin) |
| `client.readMembers.listReadMembers()` | [Список прочитавших сообщение](/api/read-member/list-readers) |
| `client.reactions.addReaction()` | [Добавление реакции](/api/reactions/add) |
| `client.reactions.listReactions()` | [Список реакций](/api/reactions/list) |
| `client.reactions.removeReaction()` | [Удаление реакции](/api/reactions/remove) |
| `client.linkPreviews.createLinkPreviews()` | [Unfurl (разворачивание ссылок)](/api/link-previews/add) |
| `client.search.searchChats()` | [Поиск чатов](/api/search/list-chats) |
| `client.search.searchMessages()` | [Поиск сообщений](/api/search/list-messages) |
| `client.search.searchUsers()` | [Поиск сотрудников](/api/search/list-users) |
| `client.tasks.createTask()` | [Новое напоминание](/api/tasks/create) |
| `client.tasks.listTasks()` | [Список напоминаний](/api/tasks/list) |
| `client.tasks.getTask()` | [Информация о напоминании](/api/tasks/get) |
| `client.tasks.updateTask()` | [Редактирование напоминания](/api/tasks/update) |
| `client.tasks.deleteTask()` | [Удаление напоминания](/api/tasks/delete) |
| `client.views.openView()` | [Открытие представления](/api/views/open) |
| `client.bots.getWebhookEvents()` | [История событий](/api/bots/list-events) |
| `client.bots.updateBot()` | [Редактирование бота](/api/bots/update) |
| `client.bots.deleteWebhookEvent()` | [Удаление события](/api/bots/remove-event) |
| `client.security.getAuditEvents()` | [Журнал аудита событий](/api/security/list) |


## Запросы

Все методы — асинхронные и возвращают `Promise`.

**GET с параметрами:**

```typescript
import { ChatAvailability, SortOrder } from "@pachca/sdk"

// Список чатов
const response = client.chats.listChats({
  sortId: SortOrder.Desc,
  availability: ChatAvailability.IsMember,
  lastMessageAtAfter: "2025-01-01T00:00:00.000Z",
  lastMessageAtBefore: "2025-02-01T00:00:00.000Z",
  personal: false,
  limit: 1,
  cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9"
})
// → ListChatsResponse({ data: Chat[], meta?: PaginationMeta })
```


**POST с телом запроса:**

```typescript
import { ChatCreateRequest, ChatCreateRequestChat } from "@pachca/sdk"

// Создание чата
const request: ChatCreateRequest = {
  chat: {
    name: "🤿 aqua",
    memberIds: [123],
    groupTagIds: [123],
    channel: true,
    public: false
  }
}
const response = client.chats.createChat(request)
// → Chat({ id: number, name: string, createdAt: string, ownerId: number, memberIds: number[], groupTagIds: number[], channel: boolean, personal: boolean, public: boolean, lastMessageAt: string, meetRoomUrl: string })
```


**Простой вызов по ID:**

```typescript
// Получение чата
const response = client.chats.getChat(334)
// → Chat({ id: number, name: string, createdAt: string, ownerId: number, memberIds: number[], groupTagIds: number[], channel: boolean, personal: boolean, public: boolean, lastMessageAt: string, meetRoomUrl: string })
```


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
| `groupTags.getTagUsersAll()` | `User[]` |
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
| `value` | `string \| null` | Переданное значение |
| `message` | `string` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации (`blank`, `invalid`, `taken`, ...) |
| `payload` | `string \| null` | Дополнительные данные |

### OAuthError

Возникает при ошибке авторизации (`401`):

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

- До **3 повторов** на каждый запрос
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
  AuditEventKey, ChatAvailability, ChatMemberRole, ChatMemberRoleFilter,
  ChatSubtype, CustomPropertyDataType, FileType, InviteStatus,
  MemberEventType, MessageEntityType, OAuthScope, ReactionEventType,
  SearchEntityType, SearchSortOrder, SortOrder, TaskKind, TaskStatus,
  UserEventType, UserRole, ValidationErrorCode, WebhookEventType,
  // Ошибки
  ApiError, OAuthError,
} from "@pachca/sdk"
```

## Примеры

```typescript
import { Button, FileType, MessageCreateRequest, MessageCreateRequestFile, MessageCreateRequestMessage, MessageEntityType, PachcaClient, TaskCreateRequest, TaskCreateRequestCustomProperty, TaskCreateRequestTask, TaskKind } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

// Отправка сообщения
const request: MessageCreateRequest = {
  message: {
    entityType: MessageEntityType.Discussion,
    entityId: 334,
    content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
    files: [{
      key: "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
      name: "logo.png",
      fileType: FileType.Image,
      size: 12345,
      width: 800,
      height: 600
    }],
    buttons: [[{
      text: "Подробнее",
      url: "https://example.com/details",
      data: "awesome"
    }]],
    parentMessageId: 194270,
    displayAvatarUrl: "https://example.com/avatar.png",
    displayName: "Бот Поддержки",
    skipInviteMentions: false
  },
  linkPreview: false
}
const response = client.messages.createMessage(request)
// → Message({ id: number, entityType: MessageEntityType, entityId: number, chatId: number, rootChatId: number, content: string, userId: number, createdAt: string, url: string, files: File({ id: number, key: string, name: string, fileType: FileType, url: string, width?: number | null, height?: number | null })[], buttons: Button({ text: string, url?: string, data?: string })[][] | null, thread: MessageThread({ id: number, chatId: number }) | null, forwarding: Forwarding({ originalMessageId: number, originalChatId: number, authorId: number, originalCreatedAt: string, originalThreadId: number | null, originalThreadMessageId: number | null, originalThreadParentChatId: number | null }) | null, parentMessageId: number | null, displayAvatarUrl: string | null, displayName: string | null, changedAt: string | null, deletedAt: string | null })

// Список сотрудников
const response = client.users.listUsers({
  query: "Олег",
  limit: 1,
  cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9"
})
// → ListUsersResponse({ data: User[], meta?: PaginationMeta })

// Создание задачи
const request: TaskCreateRequest = {
  task: {
    kind: TaskKind.Reminder,
    content: "Забрать со склада 21 заказ",
    dueAt: "2020-06-05T12:00:00.000+03:00",
    priority: 2,
    performerIds: [123],
    chatId: 456,
    allDay: false,
    customProperties: [{ id: 78, value: "Синий склад" }]
  }
}
const response = client.tasks.createTask(request)
// → Task({ id: number, kind: TaskKind, content: string, dueAt: string | null, priority: number, userId: number, chatId: number | null, status: TaskStatus, createdAt: string, performerIds: number[], allDay: boolean, customProperties: CustomProperty({ id: number, name: string, dataType: CustomPropertyDataType, value: string })[] })
```


