
# Swift

[PachcaSDK](https://github.com/pachca/openapi/tree/main/sdk/swift) Swift Package


Типизированный клиент для Pachca API на Swift. Построен на URLSession с `async throws`, Codable-моделями и встроенным retry. Требуется Swift 5.9+, macOS 13+ или iOS 16+.

## Быстрый старт


  ### Шаг 1. Установка

Добавьте пакет в `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.0.1")
]
```

Или через Xcode: **File** > **Add Package Dependencies** > `https://github.com/pachca/openapi`.


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки** > **Автоматизации** > **API** (подробнее — [Авторизация](/api/authorization)).

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```swift
import PachcaSDK

// Получение профиля
let response = try await client.profile.getProfile()
// → User(id: Int, firstName: String, lastName: String, nickname: String, email: String, phoneNumber: String, department: String, title: String, role: UserRole, suspended: Bool, inviteStatus: InviteStatus, listTags: [String], customProperties: [CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String)], userStatus: UserStatus(emoji: String, title: String, expiresAt: String?, isAway: Bool, awayMessage: UserStatusAwayMessage(text: String)?)?, bot: Bool, sso: Bool, createdAt: String, lastActivityAt: String, timeZone: String, imageUrl: String?)
```


## Инициализация

```swift
import PachcaSDK

// Стандартное подключение
let client = PachcaClient(token: "YOUR_TOKEN")

// С кастомным базовым URL
let client = PachcaClient(token: "YOUR_TOKEN", baseURL: "https://custom-api.example.com/api/shared/v1")
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `token` | `String` | — | Bearer-токен для авторизации |
| `baseURL` | `String` | `https://api.pachca.com/api/shared/v1` | Базовый URL API |

Клиент — value type (`struct`), использует `URLSession.shared`. Явного закрытия не требует.

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

Все методы — `async throws`.

**GET с параметрами:**

```swift
import PachcaSDK

// Список чатов
let response = try await client.chats.listChats(sortId: .desc, availability: .isMember, lastMessageAtAfter: "2025-01-01T00:00:00.000Z", lastMessageAtBefore: "2025-02-01T00:00:00.000Z", personal: false, limit: 1, cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListChatsResponse(data: [Chat], meta: PaginationMeta?)
```


**POST с телом запроса:**

```swift
import PachcaSDK

// Создание чата
let body = ChatCreateRequest(
    chat: ChatCreateRequestChat(
        name: "🤿 aqua",
        memberIds: [123],
        groupTagIds: [123],
        channel: true,
        `public`: false
    )
)
let response = try await client.chats.createChat(body: body)
// → Chat(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: [Int], groupTagIds: [Int], channel: Bool, personal: Bool, `public`: Bool, lastMessageAt: String, meetRoomUrl: String)
```


**Простой вызов по ID:**

```swift
import PachcaSDK

// Получение чата
let response = try await client.chats.getChat(id: 334)
// → Chat(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: [Int], groupTagIds: [Int], channel: Bool, personal: Bool, `public`: Bool, lastMessageAt: String, meetRoomUrl: String)
```


## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ содержит `meta?.paginate?.nextPage` — курсор для следующей страницы.

### Ручная пагинация

```swift
var cursor: String? = nil
repeat {
    let response = try await client.users.listUsers(limit: 50, cursor: cursor)
    for user in response.data {
        print("\(user.firstName) \(user.lastName)")
    }
    cursor = response.meta?.paginate?.nextPage
} while cursor != nil
```

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант:

```swift
// Все пользователи одним массивом
let users = try await client.users.listUsersAll()
print("Всего: \(users.count)")
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.getAuditEventsAll()` | `[AuditEvent]` |
| `bots.getWebhookEventsAll()` | `[WebhookEvent]` |
| `chats.listChatsAll()` | `[Chat]` |
| `groupTags.listTagsAll()` | `[GroupTag]` |
| `groupTags.getTagUsersAll()` | `[User]` |
| `members.listMembersAll()` | `[User]` |
| `messages.listChatMessagesAll()` | `[Message]` |
| `reactions.listReactionsAll()` | `[Reaction]` |
| `search.searchChatsAll()` | `[Chat]` |
| `search.searchMessagesAll()` | `[Message]` |
| `search.searchUsersAll()` | `[User]` |
| `tasks.listTasksAll()` | `[Task]` |
| `users.listUsersAll()` | `[User]` |

## Обработка ошибок

SDK выбрасывает два типа ошибок (реализуют протокол `Error`):

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422`:

```swift
do {
    try await client.chats.createChat(request)
} catch let error as ApiError {
    for e in error.errors {
        print("\(e.key): \(e.message)")  // "name: не может быть пустым"
        print(e.code)                    // .blank
    }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `String` | Поле, вызвавшее ошибку |
| `value` | `String?` | Переданное значение |
| `message` | `String` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации |
| `payload` | `String?` | Дополнительные данные |

### OAuthError

Возникает при ошибке авторизации (`401`):

```swift
do {
    try await client.profile.getProfile()
} catch let error as OAuthError {
    print(error.error)              // "Token not found"
    print(error.errorDescription)   // описание ошибки
}
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests`:

- До **3 повторов** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- Ожидание через `Task.sleep(nanoseconds:)` — не блокирует поток

## Типы

Все типы — `Codable` struct'ы:

```swift
import PachcaSDK

// Модели
let chat: Chat
let message: Message
let user: User

// Перечисления
let key: AuditEventKey = .userLogin
let availability: ChatAvailability = .isOpen
let role: ChatMemberRole = .admin
let status: TaskStatus = .done

// Ошибки
let apiError: ApiError
let oauthError: OAuthError
```

Доступные перечисления: `AuditEventKey`, `ChatAvailability`, `ChatMemberRole`, `ChatMemberRoleFilter`, `ChatSubtype`, `CustomPropertyDataType`, `FileType`, `InviteStatus`, `MemberEventType`, `MessageEntityType`, `OAuthScope`, `ReactionEventType`, `SearchEntityType`, `SearchSortOrder`, `SortOrder`, `TaskKind`, `TaskStatus`, `UserEventType`, `UserRole`, `ValidationErrorCode`, `WebhookEventType`.

## Платформы

| Платформа | Минимальная версия |
|-----------|-------------------|
| macOS | 13.0+ |
| iOS | 16.0+ |
| Swift | 5.9+ |

## Примеры

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

// Отправка сообщения
let body = MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityType: .discussion,
        entityId: 334,
        content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
        files: [MessageCreateRequestFile(
            key: "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
            name: "logo.png",
            fileType: .image,
            size: 12345,
            width: 800,
            height: 600
        )],
        buttons: [[Button(
            text: "Подробнее",
            url: "https://example.com/details",
            data: "awesome"
        )]],
        parentMessageId: 194270,
        displayAvatarUrl: "https://example.com/avatar.png",
        displayName: "Бот Поддержки",
        skipInviteMentions: false
    ),
    linkPreview: false
)
let response = try await client.messages.createMessage(body: body)
// → Message(id: Int, entityType: MessageEntityType, entityId: Int, chatId: Int, rootChatId: Int, content: String, userId: Int, createdAt: String, url: String, files: [File(id: Int, key: String, name: String, fileType: FileType, url: String, width: Int?, height: Int?)], buttons: [[Button(text: String, url: String?, data: String?)]]?, thread: MessageThread(id: Int64, chatId: Int64)?, forwarding: Forwarding(originalMessageId: Int, originalChatId: Int, authorId: Int, originalCreatedAt: String, originalThreadId: Int?, originalThreadMessageId: Int?, originalThreadParentChatId: Int?)?, parentMessageId: Int?, displayAvatarUrl: String?, displayName: String?, changedAt: String?, deletedAt: String?)

// Список сотрудников
let response = try await client.users.listUsers(query: "Олег", limit: 1, cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListUsersResponse(data: [User], meta: PaginationMeta?)

// Создание задачи
let body = TaskCreateRequest(
    task: TaskCreateRequestTask(
        kind: .reminder,
        content: "Забрать со склада 21 заказ",
        dueAt: "2020-06-05T12:00:00.000+03:00",
        priority: 2,
        performerIds: [123],
        chatId: 456,
        allDay: false,
        customProperties: [TaskCreateRequestCustomProperty(id: 78, value: "Синий склад")]
    )
)
let response = try await client.tasks.createTask(body: body)
// → Task(id: Int, kind: TaskKind, content: String, dueAt: String?, priority: Int, userId: Int, chatId: Int?, status: TaskStatus, createdAt: String, performerIds: [Int], allDay: Bool, customProperties: [CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String)])
```


