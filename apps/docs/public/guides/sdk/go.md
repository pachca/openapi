
# Go

[github.com/pachca/openapi/sdk/go](https://pkg.go.dev/github.com/pachca/openapi/sdk/go/generated) pkg.go.dev


Типизированный клиент для Pachca API на Go. Синхронный, с контекстами (`context.Context`), автопагинацией и обработкой retry. Требуется Go 1.24+.

## Быстрый старт


  ### Шаг 1. Установка

```bash
go get github.com/pachca/openapi/sdk/go/generated
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки → Автоматизации → API** (подробнее — [Авторизация](/api/authorization)).

*Endpoint not found*


  ### Шаг 3. Первый запрос

*Endpoint not found*


## Инициализация

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

// Стандартное подключение
client := pachca.NewPachcaClient("YOUR_TOKEN")

// С кастомным базовым URL
client := pachca.NewPachcaClient("YOUR_TOKEN", "https://custom-api.example.com/api/shared/v1")
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `token` | `string` | — | Bearer-токен для авторизации |
| `baseURL` | `...string` | `https://api.pachca.com/api/shared/v1` | Базовый URL API (необязательный) |

Все методы принимают `context.Context` первым аргументом — используйте его для таймаутов и отмены:

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

user, err := client.Profile.GetProfile(ctx)
```

## Все методы

<SdkCommands lang="go" />

## Запросы

Все методы — синхронные и возвращают `(*T, error)`.

**GET с параметрами:**

*Endpoint not found*


**POST с телом запроса:**

*Endpoint not found*


**Простой вызов по ID:**

*Endpoint not found*


### Указатели для необязательных полей

Для необязательных полей используйте функцию `Ptr()`:

```go
request := pachca.ChatUpdateRequest{
    Chat: pachca.ChatUpdateRequestChat{
        Name:   pachca.Ptr("Новое название"),
        Public: pachca.Ptr(true),
    },
}
```

## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ содержит `Meta.Paginate.NextPage` — курсор для следующей страницы.

### Ручная пагинация

```go
var cursor *string
for {
    params := &pachca.ListUsersParams{Limit: pachca.Ptr(int32(50)), Cursor: cursor}
    response, err := client.Users.ListUsers(ctx, params)
    if err != nil {
        log.Fatal(err)
    }
    for _, user := range response.Data {
        fmt.Println(user.FirstName, user.LastName)
    }
    if response.Meta == nil || response.Meta.Paginate == nil || response.Meta.Paginate.NextPage == nil {
        break
    }
    cursor = response.Meta.Paginate.NextPage
}
```

### Автопагинация

Для каждого метода с пагинацией есть `*All()` вариант:

```go
// Все пользователи одним слайсом
users, err := client.Users.ListUsersAll(ctx, nil)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Всего: %d\n", len(users))
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `Security.GetAuditEventsAll()` | `[]AuditEvent` |
| `Bots.GetWebhookEventsAll()` | `[]WebhookEvent` |
| `Chats.ListChatsAll()` | `[]Chat` |
| `GroupTags.ListTagsAll()` | `[]GroupTag` |
| `GroupTags.GetTagUsersAll()` | `[]User` |
| `Members.ListMembersAll()` | `[]User` |
| `Messages.ListChatMessagesAll()` | `[]Message` |
| `Reactions.ListReactionsAll()` | `[]Reaction` |
| `Search.SearchChatsAll()` | `[]Chat` |
| `Search.SearchMessagesAll()` | `[]Message` |
| `Search.SearchUsersAll()` | `[]User` |
| `Tasks.ListTasksAll()` | `[]Task` |
| `Users.ListUsersAll()` | `[]User` |

## Обработка ошибок

SDK возвращает два типа ошибок (реализуют интерфейс `error`):

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422`:

```go
chat, err := client.Chats.CreateChat(ctx, request)
if err != nil {
    var apiErr *pachca.ApiError
    if errors.As(err, &apiErr) {
        for _, e := range apiErr.Errors {
            fmt.Println(e.Key, e.Message)   // "name", "не может быть пустым"
            fmt.Println(e.Code)             // ValidationErrorCodeBlank
        }
    }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `Key` | `string` | Поле, вызвавшее ошибку |
| `Value` | `*string` | Переданное значение |
| `Message` | `string` | Текст ошибки |
| `Code` | `ValidationErrorCode` | Код валидации |
| `Payload` | `*string` | Дополнительные данные |

### OAuthError

Возникает при ошибке авторизации (`401`):

```go
user, err := client.Profile.GetProfile(ctx)
if err != nil {
    var oauthErr *pachca.OAuthError
    if errors.As(err, &oauthErr) {
        fmt.Println(oauthErr.Err)              // "Token not found"
        fmt.Println(oauthErr.ErrorDescription)  // описание ошибки
    }
}
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests`:

- До **3 повторов** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- Тело запроса пересоздаётся через `req.GetBody()` при каждой попытке

## Типы

Все типы экспортируются из пакета:

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

// Модели
var chat pachca.Chat
var msg  pachca.Message
var user pachca.User

// Запросы
var req pachca.ChatCreateRequest

// Перечисления
key := pachca.AuditEventKeyUserLogin
availability := pachca.ChatAvailabilityIsOpen
role := pachca.ChatMemberRoleAdmin
status := pachca.TaskStatusDone

// Ошибки
var apiErr *pachca.ApiError
var oauthErr *pachca.OAuthError
```

Доступные перечисления: `AuditEventKey`, `ChatAvailability`, `ChatMemberRole`, `ChatMemberRoleFilter`, `ChatSubtype`, `CustomPropertyDataType`, `FileType`, `InviteStatus`, `MemberEventType`, `MessageEntityType`, `OAuthScope`, `ReactionEventType`, `SearchEntityType`, `SearchSortOrder`, `SortOrder`, `TaskKind`, `TaskStatus`, `UserEventType`, `UserRole`, `ValidationErrorCode`, `WebhookEventType`.

## Примеры

*Endpoint not found*


