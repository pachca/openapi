> Расположение: SDK
> Краткое содержание: Типизированный клиент для Pachca API на TypeScript: Node.js 18+ или любое окружение с fetch. Автодополнение, автопагинация и retry. npm-пакет @pachca/sdk
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# TypeScript

- [@pachca/sdk](https://www.npmjs.com/package/@pachca/sdk) npm


Типизированный клиент для Pachca API. Работает в Node.js 18+ и в любом окружении с поддержкой `fetch`. Пакет подключается и как ES Module (`import`), и как CommonJS (`require`). TypeScript-декларации входят в пакет.

## Быстрый старт


  ### Шаг 1. Установка

```bash
npm install @pachca/sdk
```


  ### Шаг 2. Создание клиента

Клиенту нужен токен бота или персональный токен. Какой выбрать и кто может его выпустить, описано в разделе [Какой токен выбрать](/api/authorization#kakoy-token-vybrat).

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```typescript
// Получение профиля
const response = await client.profile.getProfile()
// → User({ id: number, firstName: string | null, lastName: string | null, nickname: string, email: string | null, phoneNumber: string | null, department: string | null, title: string | null, role: UserRole, suspended: boolean, inviteStatus: InviteStatus, inviterId: number | null, listTags: string[], customProperties: CustomProperty({ id: number, name: string, dataType: CustomPropertyDataType, value: string | null })[], userStatus: UserStatus({ emoji: string, title: string, expiresAt: string | null, isAway: boolean, awayMessage: UserStatusAwayMessage({ text: string }) | null }) | null, bot: boolean, sso: boolean, createdAt: string, lastActivityAt: string | null, timeZone: string | null, imageUrl: string | null })
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
| `client.oauth.revokeToken()` | [Отзыв токена](/api/oauth/revoke-token) |
| `client.oauth.exchangeToken()` | [Обмен кода на токен](/api/oauth/exchange-token) |
| `client.oauth.getTokenInfo()` | [Информация о токене](/api/oauth/token-info) |
| `client.chats.createChat()` | [Новый чат](/api/chats/create) |
| `client.chats.requestExport()` | [Экспорт сообщений](/api/chats/request-export) |
| `client.chats.listChats()` | [Список чатов](/api/chats/list) |
| `client.chats.getChat()` | [Информация о чате](/api/chats/get) |
| `client.chats.listCompanyChats()` | [Список чатов пространства](/api/chats/list-company) |
| `client.chats.downloadExport()` | [Скачать архив экспорта](/api/chats/download-export) |
| `client.chats.updateChat()` | [Редактирование чата](/api/chats/update) |
| `client.chats.archiveChat()` | [Архивация чата](/api/chats/archive) |
| `client.chats.updateChatAvatar()` | [Загрузка аватара чата](/api/chats/update-avatar) |
| `client.chats.unarchiveChat()` | [Разархивация чата](/api/chats/unarchive) |
| `client.chats.markChatUnread()` | [Отметка чата непрочитанным](/api/chats/mark-unread) |
| `client.chats.deleteChatAvatar()` | [Удаление аватара чата](/api/chats/remove-avatar) |
| `client.profile.getProfile()` | [Свой профиль](/api/profile/get) |
| `client.profile.getStatus()` | [Свой статус](/api/profile/get-status) |
| `client.profile.updateProfileAvatar()` | [Загрузка своего аватара](/api/profile/update-avatar) |
| `client.profile.updateStatus()` | [Новый свой статус](/api/profile/update-status) |
| `client.profile.deleteProfileAvatar()` | [Удаление своего аватара](/api/profile/delete-avatar) |
| `client.profile.deleteStatus()` | [Удаление своего статуса](/api/profile/delete-status) |
| `client.users.createUser()` | [Новый сотрудник](/api/users/create) |
| `client.users.listUsers()` | [Список сотрудников](/api/users/list) |
| `client.users.getUser()` | [Информация о сотруднике](/api/users/get) |
| `client.users.getUserStatus()` | [Статус сотрудника](/api/users/get-status) |
| `client.users.updateUser()` | [Редактирование сотрудника](/api/users/update) |
| `client.users.updateUserAvatar()` | [Загрузка аватара сотрудника](/api/users/update-avatar) |
| `client.users.updateUserStatus()` | [Новый статус сотрудника](/api/users/update-status) |
| `client.users.deleteUser()` | [Удаление сотрудника](/api/users/delete) |
| `client.users.deleteUserAvatar()` | [Удаление аватара сотрудника](/api/users/remove-avatar) |
| `client.users.deleteUserStatus()` | [Удаление статуса сотрудника](/api/users/remove-status) |
| `client.groupTags.createTag()` | [Новый тег](/api/group-tags/create) |
| `client.groupTags.listTags()` | [Список тегов](/api/group-tags/list) |
| `client.groupTags.getTag()` | [Информация о теге](/api/group-tags/get) |
| `client.groupTags.getTagUsers()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.groupTags.updateTag()` | [Редактирование тега](/api/group-tags/update) |
| `client.groupTags.deleteTag()` | [Удаление тега](/api/group-tags/delete) |
| `client.members.addTags()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.members.addMembers()` | [Добавление участников](/api/members/add) |
| `client.members.listMembers()` | [Список участников чата](/api/members/list) |
| `client.members.updateMemberRole()` | [Редактирование роли участника](/api/members/update) |
| `client.members.leaveChat()` | [Выход из чата](/api/members/leave) |
| `client.members.removeTag()` | [Исключение тега из чата](/api/members/remove-group-tag) |
| `client.members.removeMember()` | [Исключение участника](/api/members/remove) |
| `client.threads.createStandaloneThread()` | [Новый самостоятельный тред](/api/threads/create) |
| `client.threads.createThread()` | [Новый тред](/api/threads/add) |
| `client.threads.listThreads()` | [Список тредов](/api/threads/list) |
| `client.threads.getThread()` | [Информация о треде](/api/threads/get) |
| `client.messages.createMessage()` | [Новое сообщение](/api/messages/create) |
| `client.messages.unfurl()` | [Unfurl (разворачивание ссылок)](/api/messages/unfurl) |
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
| `client.importantMessages.addMessageToImportant()` | [Добавление сообщения в важные](/api/important-messages/create) |
| `client.importantMessages.listImportantMessages()` | [Список важных сообщений](/api/important-messages/list) |
| `client.importantMessages.removeMessageFromImportant()` | [Удаление сообщения из важных](/api/important-messages/delete) |
| `client.search.searchChats()` | [Поиск чатов](/api/search/list-chats) |
| `client.search.searchMessages()` | [Поиск сообщений](/api/search/list-messages) |
| `client.search.searchUsers()` | [Поиск сотрудников](/api/search/list-users) |
| `client.tasks.createTask()` | [Новое напоминание](/api/tasks/create) |
| `client.tasks.listTasks()` | [Список напоминаний](/api/tasks/list) |
| `client.tasks.getTask()` | [Информация о напоминании](/api/tasks/get) |
| `client.tasks.updateTask()` | [Редактирование напоминания](/api/tasks/update) |
| `client.tasks.deleteTask()` | [Удаление напоминания](/api/tasks/delete) |
| `client.drafts.createDraft()` | [Новый черновик](/api/drafts/create) |
| `client.drafts.listDrafts()` | [Список черновиков](/api/drafts/list) |
| `client.drafts.getDraft()` | [Информация о черновике](/api/drafts/get) |
| `client.drafts.updateDraft()` | [Редактирование черновика](/api/drafts/update) |
| `client.drafts.deleteDraft()` | [Удаление черновика](/api/drafts/delete) |
| `client.views.openView()` | [Открытие представления](/api/views/open) |
| `client.views.submitViewResponse()` | [Ответ на отправку формы](/api/views/submit-response) |
| `client.bots.createBot()` | [Новый бот](/api/bots/create) |
| `client.bots.selfRecreateBotToken()` | [Ротация собственного токена бота](/api/bots/recreate-token-self) |
| `client.bots.recreateBotToken()` | [Ротация токена бота](/api/bots/recreate-token) |
| `client.bots.rotateBotClientSecret()` | [Ротация секрета клиента](/api/bots/rotate-client-secret) |
| `client.bots.createBotToken()` | [Новый токен бота](/api/bots/create-token) |
| `client.bots.reissueBotToken()` | [Перевыпуск токена бота](/api/bots/reissue-token) |
| `client.bots.listBots()` | [Список ботов](/api/bots/list) |
| `client.bots.getBot()` | [Информация о боте](/api/bots/get) |
| `client.bots.listCompanyBots()` | [Список ботов пространства](/api/bots/list-company) |
| `client.bots.getWebhookEvents()` | [История событий](/api/bots/list-events) |
| `client.bots.getBotScopes()` | [Каталог прав бота](/api/bots/list-scopes) |
| `client.bots.listBotTokens()` | [Список токенов бота](/api/bots/list-tokens) |
| `client.bots.getWebhookEventsStream()` | [Поток событий](/api/bots/get-stream) |
| `client.bots.selfUpdateBotWebhook()` | [Саморегистрация вебхука бота](/api/bots/update-webhook) |
| `client.bots.updateBot()` | [Редактирование бота](/api/bots/update) |
| `client.bots.updateBotAvatar()` | [Загрузка аватара бота](/api/bots/update-avatar) |
| `client.bots.updateBotToken()` | [Изменение токена бота](/api/bots/update-token) |
| `client.bots.deleteBot()` | [Удаление бота](/api/bots/delete) |
| `client.bots.deleteBotAvatar()` | [Удаление аватара бота](/api/bots/remove-avatar) |
| `client.bots.deleteWebhookEvent()` | [Удаление события истории](/api/bots/remove-event) |
| `client.bots.deleteBotToken()` | [Удаление токена бота](/api/bots/delete-token) |
| `client.security.getAuditEvents()` | [Журнал аудита событий](/api/security/list) |
| `client.customProperties.listProperties()` | [Список дополнительных полей](/api/custom-properties/list) |
| `client.files.uploadFile()` | [Загрузка файла](/api/files/direct-url) |
| `client.files.getUploadParams()` | [Получение подписи, ключа и других параметров](/api/files/uploads) |
| `client.files.downloadFile()` | [Скачивание файла](/api/files/get) |


## Запросы

Все методы — асинхронные и возвращают `Promise`.

**GET с параметрами:**

```typescript
import { ChatAvailability, ChatSortField, SortOrder } from "@pachca/sdk"

// Список чатов
const response = await client.chats.listChats({
  sort: ChatSortField.Id,
  order: SortOrder.Desc,
  availability: ChatAvailability.IsMember,
  archived: true,
  lastMessageAtAfter: "2025-01-01T00:00:00.000Z",
  lastMessageAtBefore: "2025-02-01T00:00:00.000Z",
  personal: false,
  limit: 1,
  cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9"
})
// → ListChatsResponse({ data: Chat[], meta: PaginationMeta })
```


**POST с телом запроса:**

```typescript
import { ChatCreateRequest } from "@pachca/sdk"

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
const response = await client.chats.createChat(request)
// → CreateChatResponse({ data: Chat({ id: number, name: string, createdAt: string, ownerId: number, memberIds: number[], groupTagIds: number[], channel: boolean, archived: boolean, personal: boolean, public: boolean, lastMessageAt: string, meetRoomUrl: string, avatarUrl: string | null }), meta: CreateChatResponseMeta({ notFoundMemberIds: number[], notFoundGroupTagIds: number[] }) })
```


**Простой вызов по ID:**

```typescript
// Получение чата
const response = await client.chats.getChat(334)
// → Chat({ id: number, name: string, createdAt: string, ownerId: number, memberIds: number[], groupTagIds: number[], channel: boolean, archived: boolean, personal: boolean, public: boolean, lastMessageAt: string, meetRoomUrl: string, avatarUrl: string | null })
```


## Пагинация

Поля пагинации называются как в API, но в camelCase: `meta.paginate.nextPage`, `prevPage`, `hasNext` и `hasPrev`, а у методов поиска ещё `meta.total`. Какие поля приходят у каждого метода и как понять, что страницы закончились, описано в разделе [Пагинация](/api/pagination).

### Ручная пагинация

```typescript
let cursor: string | undefined
let hasNext = true

while (hasNext) {
  const response = await client.chats.listChats({ limit: 50, cursor })
  if (response.data.length === 0) break
  for (const chat of response.data) {
    console.log(chat.id, chat.name)
  }
  cursor = response.meta.paginate.nextPage
  hasNext = response.meta.paginate.hasNext ?? true
}
```

В типах поле `hasNext` необязательное. Если его нет, цикл идёт дальше и останавливается на пустой странице. Так же обходят страницы методы `*All()`.

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант, который автоматически обходит все страницы и возвращает плоский массив:

```typescript
// Все чаты одним массивом
const chats = await client.chats.listChatsAll()
console.log(`Всего: ${chats.length}`)
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.getAuditEventsAll()` | `AuditEvent[]` |
| `bots.listBotsAll()` | `BotResponse[]` |
| `bots.listBotTokensAll()` | `BotAccessToken[]` |
| `bots.listCompanyBotsAll()` | `CompanyBotResponse[]` |
| `bots.getWebhookEventsAll()` | `WebhookEvent[]` |
| `chats.listChatsAll()` | `Chat[]` |
| `chats.listCompanyChatsAll()` | `Chat[]` |
| `drafts.listDraftsAll()` | `Draft[]` |
| `groupTags.listTagsAll()` | `GroupTag[]` |
| `groupTags.getTagUsersAll()` | `User[]` |
| `importantMessages.listImportantMessagesAll()` | `Message[]` |
| `members.listMembersAll()` | `User[]` |
| `messages.listChatMessagesAll()` | `Message[]` |
| `reactions.listReactionsAll()` | `Reaction[]` |
| `search.searchChatsAll()` | `Chat[]` |
| `search.searchMessagesAll()` | `Message[]` |
| `search.searchUsersAll()` | `User[]` |
| `tasks.listTasksAll()` | `Task[]` |
| `threads.listThreadsAll()` | `Thread[]` |
| `users.listUsersAll()` | `User[]` |

## Обработка ошибок

SDK выбрасывает два типа ошибок:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422` с массивом `errors` в теле:

```typescript
import { PachcaClient, ApiError } from "@pachca/sdk"

try {
  await client.chats.createChat(request)
} catch (error) {
  if (error instanceof ApiError) {
    for (const e of error.errors) {
      console.log(e.key, e.message)   // name не может быть пустым
      console.log(e.code)             // blank
    }
  }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `string` | Поле, вызвавшее ошибку |
| `value` | `unknown` | Переданное значение |
| `message` | `string` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации (`blank`, `invalid`, `taken`, ...) |
| `payload` | `Record<string, unknown> \| null` | Дополнительные данные |

Код статуса ответа — в поле `status`. Если ответ с ошибкой пришёл без тела или не в JSON, SDK тоже выбрасывает `ApiError`: с кодом статуса и пустым `errors`. Так бывает с ответом `404` без тела от метода [Поток событий](/api/bots/get-stream), когда история событий выключена, и со страницей прокси при `502`.

### OAuthError

Возникает при ошибке авторизации: `401`, а также `403` с кодом `insufficient_scope` или `role_forbidden` и отказе при обмене кода на токен. Код — в поле `error`, список кодов — в разделе [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii):

```typescript
import { OAuthError } from "@pachca/sdk"

try {
  await client.profile.getProfile()
} catch (error) {
  if (error instanceof OAuthError) {
    console.log(error.error) // "insufficient_scope"
  }
}
```

Поле `error` — строка, её значения перечисляет `OAuthErrorCode`.

## Повторные запросы

Паузы между попытками, к каждой SDK добавляет случайную величину до 25%:

- **429 с заголовком `Retry-After`:** срок из заголовка
- **429 без заголовка:** 1 сек, 2 сек, 4 сек
- **5xx:** 1 сек, 2 сек, 3 сек

Сетевую ошибку без ответа сервера SDK не повторяет: исключение из `fetch` приходит сразу.

Общие правила повторов — в разделе [Повторные запросы](/api/limits#povtornye-zaprosy-retry).

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
  ListChatsResponse, ListMembersResponse, CreateChatResponse,
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

Перечисление в ответе принимает и значение, которого SDK ещё не знает: такое значение приходит строкой как есть.

## Тело вебхука

Тела событий вебхука описаны типами `MessageWebhookPayload`, `ReactionWebhookPayload`, `ButtonWebhookPayload`, `ViewSubmitWebhookPayload`, `ChatMemberWebhookPayload`, `CompanyMemberWebhookPayload`, `LinkSharedWebhookPayload` и `VideoCallWebhookPayload`. Тип `WebhookPayloadUnion` объединяет их, а вид события задают поля `type` и `event`. Поля в этих типах названы в camelCase, поэтому тело запроса сначала пропустите через функцию `deserialize`:

```typescript
import { deserialize, WebhookPayloadUnion } from "@pachca/sdk"

// rawBody — тело запроса строкой
const payload = deserialize(JSON.parse(rawBody)) as WebhookPayloadUnion
if (payload.type === "button") {
  console.log(payload.messageId, payload.data)
}
```

Подпись проверяйте по исходному телу до разбора, как в разделе [Безопасность](/guides/webhook/handler#bezopasnost). Те же типы отдают методы `pollWebhookEvents` и `pollWebhookPayloads`, которые забирают события из истории: пример — в разделе [Пример поллинга](/guides/webhook/polling#primer-pollinga).

## Примеры

**Отправка сообщения:**

```typescript
import { MessageCreateRequest, PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

const request: MessageCreateRequest = { message: { entityId: 334, content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)" } }
const response = await client.messages.createMessage(request)
// → Message({ id: number, entityType: MessageEntityType, entityId: number, chatId: number, rootChatId: number, content: string, userId: number, createdAt: string, url: string, files: File({ id: number, key: string, name: string, fileType: FileType, url: string, width?: number | null, height?: number | null, durationMs?: number | null })[], voiceContent: VoiceContent({ durationMs: number, waveform: string, transcript: string | null }) | null, buttons: Button({ text: string, url?: string, data?: string })[][] | null, thread: MessageThread({ id: number, chatId: number }) | null, forwarding: Forwarding({ originalMessageId: number, originalChatId: number, authorId: number, originalCreatedAt: string, originalThreadId: number | null, originalThreadMessageId: number | null, originalThreadParentChatId: number | null }) | null, parentMessageId: number | null, displayAvatarUrl?: string | null, displayName?: string | null, changedAt: string | null, deletedAt: string | null, important: boolean })
```


**Список сотрудников:**

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

const response = await client.users.listUsers({
  query: "Олег",
  limit: 1,
  cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9"
})
// → ListUsersResponse({ data: User[], meta: PaginationMeta })
```


**Создание задачи:**

```typescript
import { PachcaClient, TaskCreateRequest, TaskCreateRequestCustomProperty, TaskKind } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

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
const response = await client.tasks.createTask(request)
// → Task({ id: number, kind: TaskKind, content: string, dueAt: string | null, priority: number, userId: number, chatId: number | null, status: TaskStatus, createdAt: string, performerIds: number[], allDay: boolean, customProperties: CustomProperty({ id: number, name: string, dataType: CustomPropertyDataType, value: string | null })[] })
```



## Связанные разделы

- [SDK](/guides/sdk/overview)
- [Авторизация](/api/authorization)
- [Пагинация](/api/pagination)
