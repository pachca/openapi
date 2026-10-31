> Расположение: SDK
> Краткое содержание: Типизированный клиент для Pachca API на Kotlin: Ktor с корутинами, kotlinx.serialization и встроенным retry. JitPack, требуется Kotlin 2.2+ и Java 11+
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Kotlin

- [com.github.pachca:openapi](https://github.com/pachca/openapi/tree/main/sdk/kotlin) JitPack


Типизированный клиент для Pachca API на Kotlin. Построен на Ktor с корутинами (`suspend`), kotlinx.serialization и встроенным retry. Требуется Kotlin 2.2+ и Java 11+.

## Быстрый старт


  ### Шаг 1. Установка

Пакет публикуется через JitPack. Добавьте его репозиторий в `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        mavenCentral()
        maven("https://jitpack.io")
    }
}
```

И зависимость в `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.github.pachca:openapi:1.8.0")
}
```

Версия — номер выпуска SDK, все выпуски перечислены в [обновлениях](/updates).


  ### Шаг 2. Создание клиента

Клиенту нужен токен бота или персональный токен. Какой выбрать и кто может его выпустить, описано в разделе [Какой токен выбрать](/api/authorization#kakoy-token-vybrat).

```kotlin
import com.pachca.sdk.PachcaClient

val client = PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```kotlin
// Получение профиля
val response = client.profile.getProfile()
// → User(id: Int, firstName: String?, lastName: String?, nickname: String, email: String?, phoneNumber: String?, department: String?, title: String?, role: UserRole, suspended: Boolean, inviteStatus: InviteStatus, inviterId: Int?, listTags: List<String>, customProperties: List<CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String?)>, userStatus: UserStatus(emoji: String, title: String, expiresAt: OffsetDateTime?, isAway: Boolean, awayMessage: UserStatusAwayMessage(text: String)?)?, bot: Boolean, sso: Boolean, createdAt: OffsetDateTime, lastActivityAt: OffsetDateTime?, timeZone: String?, imageUrl: String?)
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

Все методы — `suspend`-функции.

**GET с параметрами:**

```kotlin
import com.pachca.sdk.ChatAvailability
import com.pachca.sdk.ChatSortField
import com.pachca.sdk.SortOrder
import java.time.OffsetDateTime

// Список чатов
val lastMessageAtAfter = OffsetDateTime.parse("2025-01-01T00:00:00.000Z")
val lastMessageAtBefore = OffsetDateTime.parse("2025-02-01T00:00:00.000Z")
val response = client.chats.listChats(sort = ChatSortField.ID, order = SortOrder.DESC, availability = ChatAvailability.IS_MEMBER, archived = true, lastMessageAtAfter = lastMessageAtAfter, lastMessageAtBefore = lastMessageAtBefore, personal = false, limit = 1, cursor = "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListChatsResponse(data: List<Chat>, meta: PaginationMeta)
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
// → CreateChatResponse(data: Chat(id: Int, name: String, createdAt: OffsetDateTime, ownerId: Int, memberIds: List<Int>, groupTagIds: List<Int>, channel: Boolean, archived: Boolean, personal: Boolean, public: Boolean, lastMessageAt: OffsetDateTime, meetRoomUrl: String, avatarUrl: String?), meta: CreateChatResponseMeta(notFoundMemberIds: List<Int>, notFoundGroupTagIds: List<Int>))
```


**Простой вызов по ID:**

```kotlin
// Получение чата
val response = client.chats.getChat(id = 334)
// → Chat(id: Int, name: String, createdAt: OffsetDateTime, ownerId: Int, memberIds: List<Int>, groupTagIds: List<Int>, channel: Boolean, archived: Boolean, personal: Boolean, public: Boolean, lastMessageAt: OffsetDateTime, meetRoomUrl: String, avatarUrl: String?)
```


### Значение null

Необязательное поле, которое не задано, в запрос не попадает, поэтому метод обновления меняет только то, что вы передали. Некоторые поля API принимают `null`: например, `null` в `oauth_client` выключает у бота авторизацию от имени сотрудника, а в `webhook.kind` удаляет входящий вебхук. Чтобы отправить `null`, назовите поле в `nullFields` той же модели запроса так, как оно называется в Kotlin:

```kotlin
val request = BotUpdateRequest(
    webhook = BotUpdateRequestWebhook(nullFields = setOf("kind")),
)
```

`nullFields` есть у моделей запроса с такими полями, а в его описании перечислены имена, которые в нём можно указать. С другим именем SDK выбрасывает `SerializationException` и запрос не отправляет.

## Пагинация

Поля пагинации называются как в API, но в camelCase: `meta.paginate.nextPage`, `prevPage`, `hasNext` и `hasPrev`, а у методов поиска ещё `meta.total`. Какие поля приходят у каждого метода и как понять, что страницы закончились, описано в разделе [Пагинация](/api/pagination).

### Ручная пагинация

```kotlin
var cursor: String? = null
var hasNext = true
while (hasNext) {
    val response = client.chats.listChats(limit = 50, cursor = cursor)
    if (response.data.isEmpty()) break
    for (chat in response.data) {
        println("${chat.id} ${chat.name}")
    }
    cursor = response.meta.paginate.nextPage
    hasNext = response.meta.paginate.hasNext ?: true
}
```

В модели поле `hasNext` имеет тип `Boolean?`. Если оно `null`, цикл идёт дальше и останавливается на пустой странице. Так же обходят страницы методы `*All()`.

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант:

```kotlin
// Все чаты одним списком
val chats = client.chats.listChatsAll()
println("Всего: ${chats.size}")
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.getAuditEventsAll()` | `List<AuditEvent>` |
| `bots.listBotsAll()` | `List<BotResponse>` |
| `bots.listBotTokensAll()` | `List<BotAccessToken>` |
| `bots.listCompanyBotsAll()` | `List<CompanyBotResponse>` |
| `bots.getWebhookEventsAll()` | `List<WebhookEvent>` |
| `chats.listChatsAll()` | `List<Chat>` |
| `chats.listCompanyChatsAll()` | `List<Chat>` |
| `drafts.listDraftsAll()` | `List<Draft>` |
| `groupTags.listTagsAll()` | `List<GroupTag>` |
| `groupTags.getTagUsersAll()` | `List<User>` |
| `importantMessages.listImportantMessagesAll()` | `List<Message>` |
| `members.listMembersAll()` | `List<User>` |
| `messages.listChatMessagesAll()` | `List<Message>` |
| `reactions.listReactionsAll()` | `List<Reaction>` |
| `search.searchChatsAll()` | `List<Chat>` |
| `search.searchMessagesAll()` | `List<Message>` |
| `search.searchUsersAll()` | `List<User>` |
| `tasks.listTasksAll()` | `List<Task>` |
| `threads.listThreadsAll()` | `List<Thread>` |
| `users.listUsersAll()` | `List<User>` |

## Обработка ошибок

SDK выбрасывает два типа исключений:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422` с массивом `errors` в теле:

```kotlin
import com.pachca.sdk.ApiError

try {
    client.chats.createChat(request)
} catch (error: ApiError) {
    for (e in error.errors) {
        println("${e.key}: ${e.message}")  // name: не может быть пустым
        println(e.code)                    // blank
    }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `String` | Поле, вызвавшее ошибку |
| `value` | `JsonElement?` | Переданное значение |
| `message` | `String` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации |
| `payload` | `Map<String, JsonElement>?` | Дополнительные данные |

Код статуса ответа — в поле `statusCode`. Если ответ с ошибкой пришёл без тела или не в JSON, SDK тоже выбрасывает `ApiError`: с кодом статуса и пустым `errors`. Так бывает с ответом `404` без тела от метода [Поток событий](/api/bots/get-stream), когда история событий выключена, и со страницей прокси при `502`.

### OAuthError

Возникает при ошибке авторизации: `401`, а также `403` с кодом `insufficient_scope` или `role_forbidden` и отказе при обмене кода на токен. Код — в поле `error`, список кодов — в разделе [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii):

```kotlin
import com.pachca.sdk.OAuthError

try {
    client.profile.getProfile()
} catch (error: OAuthError) {
    println(error.error)              // "insufficient_scope"
    println(error.errorDescription)   // описание ошибки
}
```

Поле `error` — перечисление `OAuthErrorCode`: его сравнивают с константой, например `error.error == OAuthErrorCode.INSUFFICIENT_SCOPE`, а строку кода даёт `error.error.value`.

## Повторные запросы

Паузы между попытками, к каждой SDK добавляет случайную величину до 25%:

- **429 с заголовком `Retry-After`:** срок из заголовка
- **429 без заголовка:** 1 сек, 2 сек, 4 сек
- **5xx:** ~10 сек, ~20 сек, ~40 сек
- **Сетевая ошибка у GET, PUT и DELETE:** ~10 сек, ~20 сек, ~40 сек

Таймаут запроса и сетевую ошибку у POST SDK не повторяет. Повторы делает плагин Ktor `HttpRequestRetry`.

Общие правила повторов — в разделе [Повторные запросы](/api/limits#povtornye-zaprosy-retry).

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
val availability: ChatAvailability = ChatAvailability.PUBLIC
val role: ChatMemberRole = ChatMemberRole.ADMIN
val status: TaskStatus = TaskStatus.DONE

// Ошибки
val apiError: ApiError
val oauthError: OAuthError
```

Перечисление в ответе — `value class` со строкой `value`: значение, которого SDK ещё не знает, приходит как есть, и `isKnown` у него `false`. Поэтому `when` по такому перечислению заканчивается веткой `else`. Строку значения возвращает и `toString()`, а имя константы даёт `name`.

Все перечисления SDK: `AuditEventKey`, `AuditLoginGrantDenyReason`, `AuditLoginGrantDevicePlatform`, `BotCanEdit`, `BotEventName`, `BotTemplateEngine`, `BotTriggerOn`, `BotWebhookKind`, `BotWhoCanAdd`, `ChatActivity`, `ChatAvailability`, `ChatMemberRole`, `ChatMemberRoleFilter`, `ChatSortField`, `ChatSubtype`, `CustomPropertyDataType`, `DraftRepetitionInterval`, `DraftType`, `FileTarget`, `FileType`, `InviteStatus`, `MemberEventType`, `MessageEntityType`, `MessageSearchSort`, `MessageSortField`, `OAuthErrorCode`, `OAuthScope`, `OAuthTokenTypeHint`, `ReactionEventType`, `SearchEntityType`, `SearchSortOrder`, `SortOrder`, `TaskKind`, `TaskStatus`, `UserCreateRole`, `UserEventType`, `UserRole`, `UserRoleInput`, `ValidationErrorCode`, `VideoCallEventType` и `WebhookEventType`.

## Тело вебхука

Тела событий вебхука описаны классами `MessageWebhookPayload`, `ReactionWebhookPayload`, `ButtonWebhookPayload`, `ViewSubmitWebhookPayload`, `ChatMemberWebhookPayload`, `CompanyMemberWebhookPayload`, `LinkSharedWebhookPayload` и `VideoCallWebhookPayload`. Их общий интерфейс `WebhookPayloadUnion` разбирается своим сериализатором: класс он выбирает по полям `type` и `event`. Разбирает тело `Json` из kotlinx.serialization, эта библиотека приходит в проект вместе с SDK:

```kotlin
import com.pachca.sdk.ButtonWebhookPayload
import com.pachca.sdk.WebhookPayloadUnion
import kotlinx.serialization.json.Json

val json = Json { ignoreUnknownKeys = true }

// body — тело запроса строкой
when (val payload = json.decodeFromString<WebhookPayloadUnion>(body)) {
    is ButtonWebhookPayload -> println("${payload.messageId} ${payload.data}")
    else -> {}
}
```

Подпись проверяйте по исходному телу до разбора, как в разделе [Безопасность](/guides/webhook/handler#bezopasnost). Те же классы отдают функции `pollWebhookEvents` и `pollWebhookPayloads`, которые забирают события из истории: пример — в разделе [Пример поллинга](/guides/webhook/polling#primer-pollinga).

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `kotlinx-serialization-json` | 1.9.0 | JSON-сериализация |
| `kotlinx-coroutines-core` | 1.10.2 | Корутины |
| `ktor-client-core` | 3.2.3 | HTTP-клиент |
| `ktor-client-cio` | 3.2.3 | CIO-движок |
| `ktor-client-auth` | 3.2.3 | Bearer-авторизация |
| `ktor-client-content-negotiation` | 3.2.3 | Content negotiation |
| `ktor-serialization-kotlinx-json` | 3.2.3 | JSON для Ktor |

Первые три пакета приходят в проект вместе с SDK и доступны в вашем коде: их типы есть в API SDK (`JsonElement`, `Flow` и `HttpClient`), поэтому отдельно их подключать не нужно. Остальные SDK использует внутри.

## Примеры

**Отправка сообщения:**

```kotlin
import com.pachca.sdk.MessageCreateRequest
import com.pachca.sdk.MessageCreateRequestMessage
import com.pachca.sdk.PachcaClient

val client = PachcaClient("YOUR_TOKEN")

val request = MessageCreateRequest(message = MessageCreateRequestMessage(entityId = 334, content = "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)"))
val response = client.messages.createMessage(request = request)
// → Message(id: Int, entityType: MessageEntityType, entityId: Int, chatId: Int, rootChatId: Int, content: String, userId: Int, createdAt: OffsetDateTime, url: String, files: List<File(id: Int, key: String, name: String, fileType: FileType, url: String, width: Int?, height: Int?, durationMs: Int?)>, voiceContent: VoiceContent(durationMs: Int, waveform: String, transcript: String?)?, buttons: List<List<Button(text: String, url: String?, data: String?)>>?, thread: MessageThread(id: Long, chatId: Long)?, forwarding: Forwarding(originalMessageId: Int, originalChatId: Int, authorId: Int, originalCreatedAt: OffsetDateTime, originalThreadId: Int?, originalThreadMessageId: Int?, originalThreadParentChatId: Int?)?, parentMessageId: Int?, displayAvatarUrl: String?, displayName: String?, changedAt: OffsetDateTime?, deletedAt: OffsetDateTime?, important: Boolean)
```


**Список сотрудников:**

```kotlin
import com.pachca.sdk.PachcaClient

val client = PachcaClient("YOUR_TOKEN")

val response = client.users.listUsers(query = "Олег", limit = 1, cursor = "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
// → ListUsersResponse(data: List<User>, meta: PaginationMeta)
```


**Создание напоминания:**

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.TaskCreateRequest
import com.pachca.sdk.TaskCreateRequestCustomProperty
import com.pachca.sdk.TaskCreateRequestTask
import com.pachca.sdk.TaskKind
import java.time.OffsetDateTime

val client = PachcaClient("YOUR_TOKEN")

val request = TaskCreateRequest(
    task = TaskCreateRequestTask(
        kind = TaskKind.REMINDER,
        content = "Забрать со склада 21 заказ",
        dueAt = OffsetDateTime.parse("2020-06-05T12:00:00.000+03:00"),
        priority = 2,
        performerIds = listOf(123),
        chatId = 456,
        allDay = false,
        customProperties = listOf(TaskCreateRequestCustomProperty(id = 78, value = "Синий склад"))
    )
)
val response = client.tasks.createTask(request = request)
// → Task(id: Int, kind: TaskKind, content: String, dueAt: OffsetDateTime?, priority: Int, userId: Int, chatId: Int?, status: TaskStatus, createdAt: OffsetDateTime, performerIds: List<Int>, allDay: Boolean, customProperties: List<CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String?)>)
```



## Связанные разделы

- [SDK](/guides/sdk/overview)
- [Авторизация](/api/authorization)
- [Пагинация](/api/pagination)
