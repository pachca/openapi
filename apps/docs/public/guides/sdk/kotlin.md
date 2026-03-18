
# Kotlin SDK

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

Получите API-токен в интерфейсе Пачки: **Настройки → Автоматизации → API** (подробнее — [Авторизация](/api/authorization)).

```kotlin
import com.pachca.sdk.PachcaClient

val client = PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

*Endpoint not found*


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

Все методы — `suspend`-функции.

**GET с параметрами:**

*Endpoint not found*


**POST с телом запроса:**

*Endpoint not found*


**Простой вызов по ID:**

*Endpoint not found*


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

Возникает при ошибках авторизации (`401`, `403`):

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

SDK автоматически повторяет запрос при получении `429 Too Many Requests`:

- До **3 попыток** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — линейный backoff: 1 сек, 2 сек, 3 сек
- Реализовано через плагин Ktor `HttpRequestRetry`

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `kotlinx-serialization-json` | 1.9.0 | JSON-сериализация |
| `ktor-client-core` | 3.2.3 | HTTP-клиент |
| `ktor-client-cio` | 3.2.3 | CIO-движок |
| `ktor-client-auth` | 3.2.3 | Bearer-авторизация |
| `ktor-client-content-negotiation` | 3.2.3 | Content negotiation |

## Примеры

*Endpoint not found*


## Исходный код

- [SDK на GitHub](https://github.com/pachca/openapi/tree/main/sdk/kotlin)
