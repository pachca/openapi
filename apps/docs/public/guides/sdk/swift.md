> Расположение: SDK
> Краткое содержание: Типизированный клиент для Pachca API на Swift: URLSession, async throws, Codable и встроенный retry. Swift Package, Swift 5.9+, macOS 13+ или iOS 16+
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Swift

- [PachcaSDK](https://github.com/pachca/openapi/tree/main/sdk/swift) Swift Package


Типизированный клиент для Pachca API на Swift. Построен на URLSession с `async throws`, Codable-моделями и встроенным retry. Требуется Swift 5.9+, macOS 13+ или iOS 16+.

## Быстрый старт


  ### Шаг 1. Установка

Добавьте пакет и его продукт `PachcaSDK` в `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.8.0")
],
targets: [
    .target(name: "MyApp", dependencies: [
        .product(name: "PachcaSDK", package: "openapi")
    ])
]
```

Или через Xcode: **File** > **Add Package Dependencies** > `https://github.com/pachca/openapi`.


  ### Шаг 2. Создание клиента

Клиенту нужен токен бота или персональный токен. Какой выбрать и кто может его выпустить, описано в разделе [Какой токен выбрать](/api/authorization#kakoy-token-vybrat).

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```swift
import PachcaSDK

// Получение профиля
let response = try await client.profile.getProfile()
// → User(id: Int, firstName: String?, lastName: String?, nickname: String, email: String?, phoneNumber: String?, department: String?, title: String?, role: UserRole, suspended: Bool, inviteStatus: InviteStatus, inviterId: Int?, listTags: [String], customProperties: [CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String?)], userStatus: UserStatus(emoji: String, title: String, expiresAt: String?, isAway: Bool, awayMessage: UserStatusAwayMessage(text: String)?)?, bot: Bool, sso: Bool, createdAt: String, lastActivityAt: String?, timeZone: String?, imageUrl: String?)
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

Все методы — `async throws`.

**GET с параметрами:**

```swift
import PachcaSDK

// Список чатов
let response = try await client.chats.listChats(sort: .id, order: .desc, availability: .isMember, archived: true, lastMessageAtAfter: "2025-01-01T00:00:00.000Z", lastMessageAtBefore: "2025-02-01T00:00:00.000Z", personal: false, limit: 1, cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListChatsResponse(data: [Chat], meta: PaginationMeta)
```


**POST с телом запроса:**

```swift
import PachcaSDK

// Создание чата
let request = ChatCreateRequest(
    chat: ChatCreateRequestChat(
        name: "🤿 aqua",
        memberIds: [123],
        groupTagIds: [123],
        channel: true,
        `public`: false
    )
)
let response = try await client.chats.createChat(request: request)
// → CreateChatResponse(data: Chat(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: [Int], groupTagIds: [Int], channel: Bool, archived: Bool, personal: Bool, `public`: Bool, lastMessageAt: String, meetRoomUrl: String, avatarUrl: String?), meta: CreateChatResponseMeta(notFoundMemberIds: [Int], notFoundGroupTagIds: [Int]))
```


**Простой вызов по ID:**

```swift
import PachcaSDK

// Получение чата
let response = try await client.chats.getChat(id: 334)
// → Chat(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: [Int], groupTagIds: [Int], channel: Bool, archived: Bool, personal: Bool, `public`: Bool, lastMessageAt: String, meetRoomUrl: String, avatarUrl: String?)
```


## Пагинация

Поля пагинации называются как в API, но в camelCase: `meta.paginate.nextPage`, `prevPage`, `hasNext` и `hasPrev`, а у методов поиска ещё `meta.total`. Какие поля приходят у каждого метода и как понять, что страницы закончились, описано в разделе [Пагинация](/api/pagination).

### Ручная пагинация

```swift
var cursor: String? = nil
var hasNext = true
while hasNext {
    let response = try await client.chats.listChats(limit: 50, cursor: cursor)
    if response.data.isEmpty { break }
    for chat in response.data {
        print(chat.id, chat.name)
    }
    cursor = response.meta.paginate.nextPage
    hasNext = response.meta.paginate.hasNext ?? true
}
```

В модели поле `hasNext` имеет тип `Bool?`. Если оно `nil`, цикл идёт дальше и останавливается на пустой странице. Так же обходят страницы методы `*All()`.

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант:

```swift
// Все чаты одним массивом
let chats = try await client.chats.listChatsAll()
print("Всего: \(chats.count)")
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.getAuditEventsAll()` | `[AuditEvent]` |
| `bots.listBotsAll()` | `[BotResponse]` |
| `bots.listBotTokensAll()` | `[BotAccessToken]` |
| `bots.listCompanyBotsAll()` | `[CompanyBotResponse]` |
| `bots.getWebhookEventsAll()` | `[WebhookEvent]` |
| `chats.listChatsAll()` | `[Chat]` |
| `chats.listCompanyChatsAll()` | `[Chat]` |
| `drafts.listDraftsAll()` | `[Draft]` |
| `groupTags.listTagsAll()` | `[GroupTag]` |
| `groupTags.getTagUsersAll()` | `[User]` |
| `importantMessages.listImportantMessagesAll()` | `[Message]` |
| `members.listMembersAll()` | `[User]` |
| `messages.listChatMessagesAll()` | `[Message]` |
| `reactions.listReactionsAll()` | `[Reaction]` |
| `search.searchChatsAll()` | `[Chat]` |
| `search.searchMessagesAll()` | `[Message]` |
| `search.searchUsersAll()` | `[User]` |
| `tasks.listTasksAll()` | `[Task]` |
| `threads.listThreadsAll()` | `[Thread]` |
| `users.listUsersAll()` | `[User]` |

## Обработка ошибок

SDK выбрасывает два типа ошибок (реализуют протокол `Error`):

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422` с массивом `errors` в теле:

```swift
do {
    _ = try await client.chats.createChat(request: request)
} catch let error as ApiError {
    for e in error.errors {
        print("\(e.key): \(e.message)")  // name: не может быть пустым
        print(e.code)                    // blank
    }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `String` | Поле, вызвавшее ошибку |
| `value` | `AnyCodable?` | Переданное значение |
| `message` | `String` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации |
| `payload` | `[String: AnyCodable]?` | Дополнительные данные |

Код статуса ответа — в поле `statusCode`. Если ответ с ошибкой пришёл без тела или не в JSON, SDK тоже выбрасывает `ApiError`: с кодом статуса и пустым `errors`. Так бывает с ответом `404` без тела от метода [Поток событий](/api/bots/get-stream), когда история событий выключена, и со страницей прокси при `502`.

### OAuthError

Возникает при ошибке авторизации: `401`, а также `403` с кодом `insufficient_scope` или `role_forbidden` и отказе при обмене кода на токен. Код — в поле `error`, список кодов — в разделе [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii):

```swift
do {
    _ = try await client.profile.getProfile()
} catch let error as OAuthError {
    print(error.error.rawValue)     // "insufficient_scope"
    print(error.errorDescription)   // описание ошибки
}
```

Поле `error` — перечисление `OAuthErrorCode`: его сравнивают со случаем, например `error.error == .insufficientScope`, или со строковым литералом, а строку кода даёт `rawValue`.

## Повторные запросы

Паузы между попытками, к каждой SDK добавляет случайную величину до 25%:

- **429 с заголовком `Retry-After`:** срок из заголовка
- **429 без заголовка:** 1 сек, 2 сек, 4 сек
- **5xx:** 1 сек, 2 сек, 3 сек

Сетевую ошибку без ответа сервера SDK не повторяет: ошибка URLSession приходит сразу. Паузы идут через `_Concurrency.Task.sleep(nanoseconds:)` и поток не блокируют.

Общие правила повторов — в разделе [Повторные запросы](/api/limits#povtornye-zaprosy-retry).

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
let availability: ChatAvailability = .public
let role: ChatMemberRole = .admin
let status: TaskStatus = .done

// Ошибки
let apiError: ApiError
let oauthError: OAuthError
```

Перечисление в ответе принимает и значение, которого SDK ещё не знает: оно приходит случаем `.unknown(String)`, а `rawValue` возвращает исходную строку. Поэтому `switch` по такому перечислению включает `case .unknown` или `default`. Незнакомую строку и `init?(rawValue:)` превращает в случай `.unknown`: проверить, знает ли SDK значение, помогает `allCases.contains(value)`.

Все перечисления SDK: `AuditEventKey`, `AuditLoginGrantDenyReason`, `AuditLoginGrantDevicePlatform`, `BotCanEdit`, `BotEventName`, `BotTemplateEngine`, `BotTriggerOn`, `BotWebhookKind`, `BotWhoCanAdd`, `ChatActivity`, `ChatAvailability`, `ChatMemberRole`, `ChatMemberRoleFilter`, `ChatSortField`, `ChatSubtype`, `CustomPropertyDataType`, `DraftRepetitionInterval`, `DraftType`, `FileTarget`, `FileType`, `InviteStatus`, `MemberEventType`, `MessageEntityType`, `MessageSearchSort`, `MessageSortField`, `OAuthErrorCode`, `OAuthScope`, `OAuthTokenTypeHint`, `ReactionEventType`, `SearchEntityType`, `SearchSortOrder`, `SortOrder`, `TaskKind`, `TaskStatus`, `UserCreateRole`, `UserEventType`, `UserRole`, `UserRoleInput`, `ValidationErrorCode`, `VideoCallEventType` и `WebhookEventType`.

### Имена Task и Thread

В SDK есть типы `Task` и `Thread`. В файле с `import PachcaSDK` имя `Task` означает задачу Пачки, поэтому задачу Swift Concurrency записывайте полностью: `_Concurrency.Task`. Имя `Thread` рядом с `import Foundation` неоднозначно, его записывайте как `PachcaSDK.Thread` или `Foundation.Thread`:

```swift
import Foundation
import PachcaSDK

_Concurrency.Task {
    let threads: [PachcaSDK.Thread] = try await client.threads.listThreadsAll()
    print(threads.count)
}
```

## Тело вебхука

Тела событий вебхука описаны структурами `MessageWebhookPayload`, `ReactionWebhookPayload`, `ButtonWebhookPayload`, `ViewSubmitWebhookPayload`, `ChatMemberWebhookPayload`, `CompanyMemberWebhookPayload`, `LinkSharedWebhookPayload` и `VideoCallWebhookPayload`. Перечисление `WebhookPayloadUnion` объединяет их: при разборе JSON оно выбирает случай по полям `type` и `event`.

```swift
import Foundation
import PachcaSDK

// body — тело запроса, Data
let payload = try JSONDecoder().decode(WebhookPayloadUnion.self, from: body)
if case .buttonWebhookPayload(let button) = payload {
    print(button.messageId, button.data)
}
```

Подпись проверяйте по исходному телу до разбора, как в разделе [Безопасность](/guides/webhook/handler#bezopasnost). Те же типы отдают методы `pollWebhookEvents` и `pollWebhookPayloads`, которые забирают события из истории: пример — в разделе [Пример поллинга](/guides/webhook/polling#primer-pollinga).

## Платформы

| Платформа | Минимальная версия |
|-----------|-------------------|
| macOS | 13.0+ |
| iOS | 16.0+ |
| Swift | 5.9+ |

## Примеры

**Отправка сообщения:**

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

let request = MessageCreateRequest(message: MessageCreateRequestMessage(entityId: 334, content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)"))
let response = try await client.messages.createMessage(request: request)
// → Message(id: Int, entityType: MessageEntityType, entityId: Int, chatId: Int, rootChatId: Int, content: String, userId: Int, createdAt: String, url: String, files: [File(id: Int, key: String, name: String, fileType: FileType, url: String, width: Int?, height: Int?, durationMs: Int?)], voiceContent: VoiceContent(durationMs: Int, waveform: String, transcript: String?)?, buttons: [[Button(text: String, url: String?, data: String?)]]?, thread: MessageThread(id: Int64, chatId: Int64)?, forwarding: Forwarding(originalMessageId: Int, originalChatId: Int, authorId: Int, originalCreatedAt: String, originalThreadId: Int?, originalThreadMessageId: Int?, originalThreadParentChatId: Int?)?, parentMessageId: Int?, displayAvatarUrl: String?, displayName: String?, changedAt: String?, deletedAt: String?, important: Bool)
```


**Список сотрудников:**

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

let response = try await client.users.listUsers(query: "Олег", limit: 1, cursor: "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListUsersResponse(data: [User], meta: PaginationMeta)
```


**Создание задачи:**

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

let request = TaskCreateRequest(
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
let response = try await client.tasks.createTask(request: request)
// → Task(id: Int, kind: TaskKind, content: String, dueAt: String?, priority: Int, userId: Int, chatId: Int?, status: TaskStatus, createdAt: String, performerIds: [Int], allDay: Bool, customProperties: [CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String?)])
```



## Связанные разделы

- [SDK](/guides/sdk/overview)
- [Авторизация](/api/authorization)
- [Пагинация](/api/pagination)
