
# Swift SDK

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

Или через Xcode: **File → Add Package Dependencies → `https://github.com/pachca/openapi`**.


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки → Автоматизации → API** (подробнее — [Авторизация](/api/authorization)).

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

*Endpoint not found*


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

Все методы — `async throws`.

**GET с параметрами:**

*Endpoint not found*


**POST с телом запроса:**

*Endpoint not found*


**Простой вызов по ID:**

*Endpoint not found*


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

Возникает при ошибках авторизации (`401`, `403`):

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

- До **3 попыток** на каждый запрос
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

// Ошибки
let apiError: ApiError
let oauthError: OAuthError
```

## Платформы

| Платформа | Минимальная версия |
|-----------|-------------------|
| macOS | 13.0+ |
| iOS | 16.0+ |
| Swift | 5.9+ |

## Примеры

*Endpoint not found*


## Исходный код

- [SDK на GitHub](https://github.com/pachca/openapi/tree/main/sdk/swift)
