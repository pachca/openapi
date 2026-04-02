
# Go

[github.com/pachca/openapi/sdk/go](https://pkg.go.dev/github.com/pachca/openapi/sdk/go/generated) pkg.go.dev


Типизированный клиент для Pachca API на Go. Синхронный, с контекстами (`context.Context`), автопагинацией и обработкой retry. Требуется Go 1.24+.

## Быстрый старт


  ### Шаг 1. Установка

```bash
go get github.com/pachca/openapi/sdk/go/generated
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки** > **Автоматизации** > **API** (подробнее — [Авторизация](/api/authorization)).

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

client := pachca.NewPachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

// Получение профиля
response, err := client.Profile.GetProfile(ctx)
// → User{ID: int32, FirstName: string, LastName: string, Nickname: string, Email: string, PhoneNumber: string, Department: string, Title: string, Role: UserRole, Suspended: bool, InviteStatus: InviteStatus, ListTags: []string, CustomProperties: []CustomProperty{ID: int32, Name: string, DataType: CustomPropertyDataType, Value: string}, UserStatus: *UserStatus{Emoji: string, Title: string, ExpiresAt: *string, IsAway: bool, AwayMessage: *UserStatusAwayMessage{Text: string}}, Bot: bool, Sso: bool, CreatedAt: string, LastActivityAt: string, TimeZone: string, ImageURL: *string}
```


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

| Метод | Метод API |
|-------|----------|
| `client.Common.RequestExport()` | [Экспорт сообщений](/api/common/request-export) |
| `client.Common.UploadFile()` | [Загрузка файла](/api/common/direct-url) |
| `client.Common.GetUploadParams()` | [Получение подписи, ключа и других параметров](/api/common/uploads) |
| `client.Common.DownloadExport()` | [Скачать архив экспорта](/api/common/get-exports) |
| `client.Common.ListProperties()` | [Список дополнительных полей](/api/common/custom-properties) |
| `client.Profile.GetTokenInfo()` | [Информация о токене](/api/profile/get-info) |
| `client.Profile.GetProfile()` | [Информация о профиле](/api/profile/get) |
| `client.Profile.GetStatus()` | [Текущий статус](/api/profile/get-status) |
| `client.Profile.UpdateStatus()` | [Новый статус](/api/profile/update-status) |
| `client.Profile.DeleteStatus()` | [Удаление статуса](/api/profile/delete-status) |
| `client.Users.CreateUser()` | [Создать сотрудника](/api/users/create) |
| `client.Users.ListUsers()` | [Список сотрудников](/api/users/list) |
| `client.Users.GetUser()` | [Информация о сотруднике](/api/users/get) |
| `client.Users.GetUserStatus()` | [Статус сотрудника](/api/users/get-status) |
| `client.Users.UpdateUser()` | [Редактирование сотрудника](/api/users/update) |
| `client.Users.UpdateUserStatus()` | [Новый статус сотрудника](/api/users/update-status) |
| `client.Users.DeleteUser()` | [Удаление сотрудника](/api/users/delete) |
| `client.Users.DeleteUserStatus()` | [Удаление статуса сотрудника](/api/users/remove-status) |
| `client.GroupTags.CreateTag()` | [Новый тег](/api/group-tags/create) |
| `client.GroupTags.ListTags()` | [Список тегов сотрудников](/api/group-tags/list) |
| `client.GroupTags.GetTag()` | [Информация о теге](/api/group-tags/get) |
| `client.GroupTags.GetTagUsers()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.GroupTags.UpdateTag()` | [Редактирование тега](/api/group-tags/update) |
| `client.GroupTags.DeleteTag()` | [Удаление тега](/api/group-tags/delete) |
| `client.Chats.CreateChat()` | [Новый чат](/api/chats/create) |
| `client.Chats.ListChats()` | [Список чатов](/api/chats/list) |
| `client.Chats.GetChat()` | [Информация о чате](/api/chats/get) |
| `client.Chats.UpdateChat()` | [Обновление чата](/api/chats/update) |
| `client.Chats.ArchiveChat()` | [Архивация чата](/api/chats/archive) |
| `client.Chats.UnarchiveChat()` | [Разархивация чата](/api/chats/unarchive) |
| `client.Members.AddTags()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.Members.AddMembers()` | [Добавление пользователей](/api/members/add) |
| `client.Members.ListMembers()` | [Список участников чата](/api/members/list) |
| `client.Members.UpdateMemberRole()` | [Редактирование роли](/api/members/update) |
| `client.Members.RemoveTag()` | [Исключение тега](/api/members/remove-group-tag) |
| `client.Members.LeaveChat()` | [Выход из беседы или канала](/api/members/leave) |
| `client.Members.RemoveMember()` | [Исключение пользователя](/api/members/remove) |
| `client.Threads.CreateThread()` | [Новый тред](/api/threads/add) |
| `client.Threads.GetThread()` | [Информация о треде](/api/threads/get) |
| `client.Messages.CreateMessage()` | [Новое сообщение](/api/messages/create) |
| `client.Messages.PinMessage()` | [Закрепление сообщения](/api/messages/pin) |
| `client.Messages.ListChatMessages()` | [Список сообщений чата](/api/messages/list) |
| `client.Messages.GetMessage()` | [Информация о сообщении](/api/messages/get) |
| `client.Messages.UpdateMessage()` | [Редактирование сообщения](/api/messages/update) |
| `client.Messages.DeleteMessage()` | [Удаление сообщения](/api/messages/delete) |
| `client.Messages.UnpinMessage()` | [Открепление сообщения](/api/messages/unpin) |
| `client.ReadMembers.ListReadMembers()` | [Список прочитавших сообщение](/api/read-member/list-readers) |
| `client.Reactions.AddReaction()` | [Добавление реакции](/api/reactions/add) |
| `client.Reactions.ListReactions()` | [Список реакций](/api/reactions/list) |
| `client.Reactions.RemoveReaction()` | [Удаление реакции](/api/reactions/remove) |
| `client.LinkPreviews.CreateLinkPreviews()` | [Unfurl (разворачивание ссылок)](/api/link-previews/add) |
| `client.Search.SearchChats()` | [Поиск чатов](/api/search/list-chats) |
| `client.Search.SearchMessages()` | [Поиск сообщений](/api/search/list-messages) |
| `client.Search.SearchUsers()` | [Поиск сотрудников](/api/search/list-users) |
| `client.Tasks.CreateTask()` | [Новое напоминание](/api/tasks/create) |
| `client.Tasks.ListTasks()` | [Список напоминаний](/api/tasks/list) |
| `client.Tasks.GetTask()` | [Информация о напоминании](/api/tasks/get) |
| `client.Tasks.UpdateTask()` | [Редактирование напоминания](/api/tasks/update) |
| `client.Tasks.DeleteTask()` | [Удаление напоминания](/api/tasks/delete) |
| `client.Views.OpenView()` | [Открытие представления](/api/views/open) |
| `client.Bots.GetWebhookEvents()` | [История событий](/api/bots/list-events) |
| `client.Bots.UpdateBot()` | [Редактирование бота](/api/bots/update) |
| `client.Bots.DeleteWebhookEvent()` | [Удаление события](/api/bots/remove-event) |
| `client.Security.GetAuditEvents()` | [Журнал аудита событий](/api/security/list) |


## Запросы

Все методы — синхронные и возвращают `(*T, error)`.

**GET с параметрами:**

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

// Список чатов
params := &ListChatsParams{
	SortID: Ptr(SortOrderDesc),
	Availability: Ptr(ChatAvailabilityIsMember),
	LastMessageAtAfter: Ptr("2025-01-01T00:00:00.000Z"),
	LastMessageAtBefore: Ptr("2025-02-01T00:00:00.000Z"),
	Personal: Ptr(false),
	Limit: Ptr(int32(1)),
	Cursor: Ptr("eyJpZCI6MTAsImRpciI6ImFzYyJ9"),
}
response, err := client.Chats.ListChats(ctx, params)
// → ListChatsResponse{Data: []Chat, Meta: *PaginationMeta}
```


**POST с телом запроса:**

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

// Создание чата
request := ChatCreateRequest{
	Chat: ChatCreateRequestChat{
		Name: "🤿 aqua",
		MemberIDs: []int32{int32(123)},
		GroupTagIDs: []int32{int32(123)},
		Channel: Ptr(true),
		Public: Ptr(false),
	},
}
response, err := client.Chats.CreateChat(ctx, request)
// → Chat{ID: int32, Name: string, CreatedAt: string, OwnerID: int32, MemberIDs: []int32, GroupTagIDs: []int32, Channel: bool, Personal: bool, Public: bool, LastMessageAt: string, MeetRoomURL: string}
```


**Простой вызов по ID:**

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

// Получение чата
response, err := client.Chats.GetChat(ctx, int32(334))
// → Chat{ID: int32, Name: string, CreatedAt: string, OwnerID: int32, MemberIDs: []int32, GroupTagIDs: []int32, Channel: bool, Personal: bool, Public: bool, LastMessageAt: string, MeetRoomURL: string}
```


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

SDK автоматически повторяет запрос при получении `429 Too Many Requests` и ошибок сервера `5xx` (`500`, `502`, `503`, `504`):

- До **3 повторов** на каждый запрос
- **429:** если сервер вернул заголовок `Retry-After` — ждёт указанное время, иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- **5xx:** экспоненциальный backoff с jitter: ~10 сек, ~20 сек, ~40 сек
- Тело запроса пересоздаётся через `req.GetBody()` при каждой попытке
- Ошибки клиента (4xx, кроме 429) возвращаются сразу без повторов

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

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

client := pachca.NewPachcaClient("YOUR_TOKEN")

// Отправка сообщения
request := MessageCreateRequest{
	Message: MessageCreateRequestMessage{
		EntityType: Ptr(MessageEntityTypeDiscussion),
		EntityID: int32(334),
		Content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
		Files: []MessageCreateRequestFile{MessageCreateRequestFile{
			Key: "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
			Name: "logo.png",
			FileType: FileTypeImage,
			Size: int32(12345),
			Width: Ptr(int32(800)),
			Height: Ptr(int32(600)),
		}},
		Buttons: [][]Button{[]Button{Button{
			Text: "Подробнее",
			URL: Ptr("https://example.com/details"),
			Data: Ptr("awesome"),
		}}},
		ParentMessageID: Ptr(int32(194270)),
		DisplayAvatarURL: Ptr("https://example.com/avatar.png"),
		DisplayName: Ptr("Бот Поддержки"),
		SkipInviteMentions: Ptr(false),
	},
	LinkPreview: Ptr(false),
}
response, err := client.Messages.CreateMessage(ctx, request)
// → Message{ID: int32, EntityType: MessageEntityType, EntityID: int32, ChatID: int32, RootChatID: int32, Content: string, UserID: int32, CreatedAt: string, URL: string, Files: []File{ID: int32, Key: string, Name: string, FileType: FileType, URL: string, Width: *int32, Height: *int32}, Buttons: *[][]Button{Text: string, URL: *string, Data: *string}, Thread: *MessageThread{ID: int64, ChatID: int64}, Forwarding: *Forwarding{OriginalMessageID: int32, OriginalChatID: int32, AuthorID: int32, OriginalCreatedAt: string, OriginalThreadID: *int32, OriginalThreadMessageID: *int32, OriginalThreadParentChatID: *int32}, ParentMessageID: *int32, DisplayAvatarURL: *string, DisplayName: *string, ChangedAt: *string, DeletedAt: *string}

// Список сотрудников
params := &ListUsersParams{
	Query: Ptr("Олег"),
	Limit: Ptr(int32(1)),
	Cursor: Ptr("eyJpZCI6MTAsImRpciI6ImFzYyJ9"),
}
response, err := client.Users.ListUsers(ctx, params)
// → ListUsersResponse{Data: []User, Meta: *PaginationMeta}

// Создание задачи
request := TaskCreateRequest{
	Task: TaskCreateRequestTask{
		Kind: TaskKindReminder,
		Content: Ptr("Забрать со склада 21 заказ"),
		DueAt: Ptr("2020-06-05T12:00:00.000+03:00"),
		Priority: Ptr(int32(2)),
		PerformerIDs: []int32{int32(123)},
		ChatID: Ptr(int32(456)),
		AllDay: Ptr(false),
		CustomProperties: []TaskCreateRequestCustomProperty{TaskCreateRequestCustomProperty{
			ID: int32(78),
			Value: "Синий склад",
		}},
	},
}
response, err := client.Tasks.CreateTask(ctx, request)
// → Task{ID: int32, Kind: TaskKind, Content: string, DueAt: *string, Priority: int32, UserID: int32, ChatID: *int32, Status: TaskStatus, CreatedAt: string, PerformerIDs: []int32, AllDay: bool, CustomProperties: []CustomProperty{ID: int32, Name: string, DataType: CustomPropertyDataType, Value: string}}
```


