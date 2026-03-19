
# Kotlin

[com.pachca:pachca-sdk](https://github.com/pachca/openapi/tree/main/sdk/kotlin) JitPack


Типизированный клиент для Pachca API на Kotlin. Построен на Ktor с корутинами (`suspend`), kotlinx.serialization и встроенным retry. Требуется Kotlin 2.2+ и Java 11+.

## Быстрый старт


  ### Шаг 1. Установка

Добавьте зависимость в `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.pachca:pachca-sdk:1.0.1")
}
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки** > **Автоматизации** > **API** (подробнее — [Авторизация](/api/authorization)).

```kotlin
import com.pachca.sdk.PachcaClient

val client = PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```kotlin
// Получение профиля
val response = client.profile.getProfile()
// → User(id: Int, firstName: String, lastName: String, nickname: String, email: String, phoneNumber: String, department: String, title: String, role: UserRole, suspended: Boolean, inviteStatus: InviteStatus, listTags: List<String>, customProperties: List<CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String)>, userStatus: UserStatus(emoji: String, title: String, expiresAt: String?, isAway: Boolean, awayMessage: UserStatusAwayMessage(text: String)?)?, bot: Boolean, sso: Boolean, createdAt: String, lastActivityAt: String, timeZone: String, imageUrl: String?)
```


> Все методы SDK — `suspend`-функции. Вызывайте их из корутин (`runBlocking`, `launch`, `async`).


## Инициализация

```kotlin
import com.pachca.sdk.PachcaClient

// Стандартное подключение
val client = PachcaClient("YOUR_TOKEN")

// С кастомным базовым URL
val client = PachcaClient("YOUR_TOKEN", "https://custom-api.example.com/api/shared/v1")
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `token` | `String` | — | Bearer-токен для авторизации |
| `baseUrl` | `String` | `https://api.pachca.com/api/shared/v1` | Базовый URL API |

Клиент реализует `Closeable` — закройте его после использования:

```kotlin
client.use { c ->
    val profile = c.profile.getProfile()
    println(profile.firstName)
}

// Или вручную
client.close()
```

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

Все методы — `suspend`-функции.

**GET с параметрами:**

```kotlin
import com.pachca.sdk.ChatAvailability
import com.pachca.sdk.SortOrder

// Список чатов
val response = client.chats.listChats(sortId = SortOrder.DESC, availability = ChatAvailability.IS_MEMBER, lastMessageAtAfter = "2025-01-01T00:00:00.000Z", lastMessageAtBefore = "2025-02-01T00:00:00.000Z", personal = false, limit = 1, cursor = "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListChatsResponse(data: List<Chat>, meta: PaginationMeta?)
```


**POST с телом запроса:**

```kotlin
import com.pachca.sdk.ChatCreateRequest
import com.pachca.sdk.ChatCreateRequestChat

// Создание чата
val request = ChatCreateRequest(
    chat = ChatCreateRequestChat(
        name = "🤿 aqua",
        memberIds = listOf(123),
        groupTagIds = listOf(123),
        channel = true,
        public = false
    )
)
val response = client.chats.createChat(request = request)
// → Chat(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: List<Int>, groupTagIds: List<Int>, channel: Boolean, personal: Boolean, public: Boolean, lastMessageAt: String, meetRoomUrl: String)
```


**Простой вызов по ID:**

```kotlin
// Получение чата
val response = client.chats.getChat(id = 334)
// → Chat(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: List<Int>, groupTagIds: List<Int>, channel: Boolean, personal: Boolean, public: Boolean, lastMessageAt: String, meetRoomUrl: String)
```


## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ содержит `meta?.paginate?.nextPage` — курсор для следующей страницы.

### Ручная пагинация

```kotlin
var cursor: String? = null
do {
    val response = client.users.listUsers(limit = 50, cursor = cursor)
    for (user in response.data) {
        println("${user.firstName} ${user.lastName}")
    }
    cursor = response.meta?.paginate?.nextPage
} while (cursor != null)
```

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант:

```kotlin
// Все пользователи одним списком
val users = client.users.listUsersAll()
println("Всего: ${users.size}")
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.getAuditEventsAll()` | `List<AuditEvent>` |
| `bots.getWebhookEventsAll()` | `List<WebhookEvent>` |
| `chats.listChatsAll()` | `List<Chat>` |
| `groupTags.listTagsAll()` | `List<GroupTag>` |
| `groupTags.getTagUsersAll()` | `List<User>` |
| `members.listMembersAll()` | `List<User>` |
| `messages.listChatMessagesAll()` | `List<Message>` |
| `reactions.listReactionsAll()` | `List<Reaction>` |
| `search.searchChatsAll()` | `List<Chat>` |
| `search.searchMessagesAll()` | `List<Message>` |
| `search.searchUsersAll()` | `List<User>` |
| `tasks.listTasksAll()` | `List<Task>` |
| `users.listUsersAll()` | `List<User>` |

## Обработка ошибок

SDK выбрасывает два типа исключений:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422`:

```kotlin
import com.pachca.sdk.ApiError

try {
    client.chats.createChat(request)
} catch (error: ApiError) {
    for (e in error.errors) {
        println("${e.key}: ${e.message}")  // "name: не может быть пустым"
        println(e.code)                    // ValidationErrorCode.BLANK
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

```kotlin
import com.pachca.sdk.OAuthError

try {
    client.profile.getProfile()
} catch (error: OAuthError) {
    println(error.error)              // "Token not found"
    println(error.errorDescription)   // описание ошибки
}
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests` или серверной ошибки (`5xx`):

- До **3 повторов** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — линейный backoff: 1 сек, 2 сек, 3 сек
- Реализовано через плагин Ktor `HttpRequestRetry`

## Типы

Все типы — `@Serializable` data class'ы:

```kotlin
import com.pachca.sdk.*

// Модели
val chat: Chat
val message: Message
val user: User

// Запросы
val req: ChatCreateRequest

// Перечисления
val key: AuditEventKey = AuditEventKey.USER_LOGIN
val availability: ChatAvailability = ChatAvailability.IS_OPEN
val role: ChatMemberRole = ChatMemberRole.ADMIN
val status: TaskStatus = TaskStatus.DONE

// Ошибки
val apiError: ApiError
val oauthError: OAuthError
```

Доступные перечисления: `AuditEventKey`, `ChatAvailability`, `ChatMemberRole`, `ChatMemberRoleFilter`, `ChatSubtype`, `CustomPropertyDataType`, `FileType`, `InviteStatus`, `MemberEventType`, `MessageEntityType`, `OAuthScope`, `ReactionEventType`, `SearchEntityType`, `SearchSortOrder`, `SortOrder`, `TaskKind`, `TaskStatus`, `UserEventType`, `UserRole`, `ValidationErrorCode`, `WebhookEventType`.

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `kotlinx-serialization-json` | 1.9.0 | JSON-сериализация |
| `ktor-client-core` | 3.2.3 | HTTP-клиент |
| `ktor-client-cio` | 3.2.3 | CIO-движок |
| `ktor-client-auth` | 3.2.3 | Bearer-авторизация |
| `ktor-client-content-negotiation` | 3.2.3 | Content negotiation |

## Примеры

```kotlin
import com.pachca.sdk.Button
import com.pachca.sdk.FileType
import com.pachca.sdk.MessageCreateRequest
import com.pachca.sdk.MessageCreateRequestFile
import com.pachca.sdk.MessageCreateRequestMessage
import com.pachca.sdk.MessageEntityType
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.TaskCreateRequest
import com.pachca.sdk.TaskCreateRequestCustomProperty
import com.pachca.sdk.TaskCreateRequestTask
import com.pachca.sdk.TaskKind

val client = PachcaClient("YOUR_TOKEN")

// Отправка сообщения
val request = MessageCreateRequest(
    message = MessageCreateRequestMessage(
        entityType = MessageEntityType.DISCUSSION,
        entityId = 334,
        content = "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
        files = listOf(MessageCreateRequestFile(
            key = "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
            name = "logo.png",
            fileType = FileType.IMAGE,
            size = 12345,
            width = 800,
            height = 600
        )),
        buttons = listOf(listOf(Button(
            text = "Подробнее",
            url = "https://example.com/details",
            data = "awesome"
        ))),
        parentMessageId = 194270,
        displayAvatarUrl = "https://example.com/avatar.png",
        displayName = "Бот Поддержки",
        skipInviteMentions = false,
        linkPreview = false
    )
)
val response = client.messages.createMessage(request = request)
// → Message(id: Int, entityType: MessageEntityType, entityId: Int, chatId: Int, rootChatId: Int, content: String, userId: Int, createdAt: String, url: String, files: List<File(id: Int, key: String, name: String, fileType: FileType, url: String, width: Int?, height: Int?)>, buttons: List<List<Button(text: String, url: String?, data: String?)>>?, thread: MessageThread(id: Long, chatId: Long)?, forwarding: Forwarding(originalMessageId: Int, originalChatId: Int, authorId: Int, originalCreatedAt: String, originalThreadId: Int?, originalThreadMessageId: Int?, originalThreadParentChatId: Int?)?, parentMessageId: Int?, displayAvatarUrl: String?, displayName: String?, changedAt: String?, deletedAt: String?)

// Список сотрудников
val response = client.users.listUsers(query = "Олег", limit = 1, cursor = "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListUsersResponse(data: List<User>, meta: PaginationMeta?)

// Создание задачи
val request = TaskCreateRequest(
    task = TaskCreateRequestTask(
        kind = TaskKind.REMINDER,
        content = "Забрать со склада 21 заказ",
        dueAt = "2020-06-05T12:00:00.000+03:00",
        priority = 2,
        performerIds = listOf(123),
        chatId = 456,
        allDay = false,
        customProperties = listOf(TaskCreateRequestCustomProperty(id = 78, value = "Синий склад"))
    )
)
val response = client.tasks.createTask(request = request)
// → Task(id: Int, kind: TaskKind, content: String, dueAt: String?, priority: Int, userId: Int, chatId: Int?, status: TaskStatus, createdAt: String, performerIds: List<Int>, allDay: Boolean, customProperties: List<CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String)>)
```


