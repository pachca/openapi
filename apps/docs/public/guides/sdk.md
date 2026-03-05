
# SDK

Официальные SDK для пяти языков. Каждый SDK сгенерирован из [OpenAPI-спецификации](/openapi.yaml) и покрывает все методы API с полной типизацией.

| Язык | Пакет | Установка |
|------|-------|-----------|
| TypeScript | `@pachca/sdk` | `npm install @pachca/sdk` |
| Python | `pachca` | `pip install pachca` |
| Go | `github.com/pachca/openapi/sdk/go/generated` | `go get github.com/pachca/openapi/sdk/go/generated` |
| Kotlin | `com.pachca:pachca-sdk:1.0.0` | Gradle / Maven |
| Swift | SPM `https://github.com/pachca/openapi` | Swift Package Manager |

## Быстрый старт


  ### Шаг 1. TypeScript

**Установка**

```bash
npm install @pachca/sdk
```


    **Использование**

```typescript
import { Pachca } from "@pachca/sdk";

const pachca = new Pachca({ token: "YOUR_TOKEN" });

// Отправка сообщения
const { data } = await pachca.messages.createMessage({
  body: {
    message: { entity_type: "discussion", entity_id: 123, content: "Привет!" }
  }
});

// Получение сообщения
const { data: msg } = await pachca.messages.getMessage({
  path: { id: data!.data.id }
});

// Список всех пользователей (автопагинация)
for await (const user of pachca.users.listAllUsers()) {
  console.log(user.first_name);
}
```


  ### Шаг 2. Python

**Установка**

```bash
pip install pachca
```


    **Использование**

```python
from pachca.pachca_client import Pachca
from pachca.models.message_create_request_message import MessageCreateRequestMessage

client = Pachca("YOUR_TOKEN")

# Отправка сообщения
msg = client.messages.create_message(
    MessageCreateRequestMessage(entity_id=123, content="Привет!")
)

# Получение сообщения
fetched = client.messages.get_message(msg.id)

# Реакция (≤2 полей — передаются как kwargs)
client.reactions.add_reaction(msg.id, code="👀")

# Список пользователей
users = client.users.list_users()
```


  ### Шаг 3. Go

**Установка**

```bash
go get github.com/pachca/openapi/sdk/go/generated
```


    **Использование**

```go
import pachca "github.com/pachca/openapi/sdk/go/generated"

client, err := pachca.NewPachcaClient(
    "https://api.pachca.com/api/shared/v1",
    "YOUR_TOKEN",
)

ctx := context.Background()

// Отправка сообщения
res, err := client.Messages.CreateMessage(ctx, &pachca.MessageCreateRequest{
    Message: pachca.MessageCreateRequestMessage{
        EntityType: pachca.NewOptMessageEntityType(pachca.MessageEntityTypeDiscussion),
        EntityID:   12345,
        Content:    "Привет!",
    },
})
created := res.(*pachca.MessageOperationsCreateMessageCreated)
```


  ### Шаг 4. Kotlin

**build.gradle.kts**

```kotlin
dependencies {
    implementation("com.pachca:pachca-sdk:1.0.0")
}
```


    **Использование**

```kotlin
import com.pachca.PachcaClient
import com.pachca.models.*
import io.ktor.client.plugins.*
import io.ktor.client.request.*

val pachca = PachcaClient(
    httpClientConfig = {
        it.defaultRequest { header("Authorization", "Bearer YOUR_TOKEN") }
    }
)

// Список чатов
val chats = pachca.chats.listChats().body()

// Создание сообщения
val message = pachca.messages.createMessage(MessageCreateRequest(
    message = MessageCreateRequestMessage(
        entityId = chatId,
        content = "Привет!"
    )
)).body()
```


  ### Шаг 5. Swift

**Package.swift**

```swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.0.0")
]
```


    **Использование**

```swift
import PachcaSDK

let pachca = try PachcaClient(token)

// Список чатов
let chats = try await pachca.chats.listChats(.init())

// Создание сообщения
let message = try await pachca.messages.createMessage(.init(
    body: .json(.init(message: .init(
        entity_type: .init(value1: .discussion),
        entity_id: chatId,
        content: "Привет!"
    )))
))
```


## Сервисы

Методы API сгруппированы по сервисам. Имена сервисов зависят от языка:

| Домен | TypeScript | Python | Go | Kotlin | Swift |
|-------|-----------|--------|-----|--------|-------|
| Сообщения | `messages` | `messages` | `Messages` | `messages` | `messages` |
| Чаты | `chats` | `chats` | `Chats` | `chats` | `chats` |
| Участники | `members` | `members` | `ChatMembers` | `members` | `chatMembers` |
| Пользователи | `users` | `users` | `Users` | `users` | `users` |
| Теги | `tags` | `group_tags` | `Tags` | `tags` | `groupTags` |
| Задачи | `tasks` | `tasks` | `Tasks` | `tasks` | `tasks` |
| Реакции | `reactions` | `reactions` | `Reactions` | `reactions` | `reactions` |
| Треды | `threads` | `thread` | `Threads` | `threads` | `threads` |
| Профиль | `profile` | `profile` | `Profile` | `profile` | `profile` |
| Боты | `bots` | `bots` | `Bots` | `bots` | `bots` |
| Безопасность | `security` | `security` | `Security` | `security` | `security` |
| Поиск | `common` | `search` | `Search` | `search` | `search` |
| Загрузки | `common` | `common` | `Uploads` | `uploads` | `uploads` |
| Формы | `common` | `views` | `Forms` | `forms` | `forms` |

## Пагинация

Пачка использует cursor-based пагинацию. Ответ содержит `meta.paginate.next_page` — курсор следующей страницы или `null`.

### TypeScript — async generator

TypeScript SDK предоставляет методы `listAll*` / `getAll*` / `searchAll*`, которые автоматически итерируют все страницы:

**Автопагинация**

```typescript
// Перебор всех пользователей (автопагинация)
for await (const user of pachca.users.listAllUsers()) {
  console.log(user.first_name);
}

// Или вручную — первая страница
const { data } = await pachca.users.listUsers({
  query: { limit: 50 }
});
const nextCursor = data?.meta?.paginate?.next_page;
```


Методы с автопагинацией: `listAllUsers`, `listAllChats`, `listAllChatMessages`, `listAllTasks`, `listAllTags`, `listAllMembers`, `listAllReactions`, `getAllWebhookEvents`, `getAllAuditEvents`, `getAllTagUsers`, `listAllReadMembers`, `searchAllChats`, `searchAllMessages`, `searchAllUsers`.

### Python — PaginatedResponse

Python SDK возвращает `PaginatedResponse` — подкласс `list` с атрибутом `next_cursor`:

**Пагинация**

```python
# Первая страница
users = client.users.list_users(limit=50)
print(users)             # список User
print(users.next_cursor) # курсор следующей страницы или None

# Ручная итерация всех страниц
cursor = None
while True:
    page = client.users.list_users(limit=50, cursor=cursor)
    for user in page:
        print(user.first_name)
    cursor = page.next_cursor
    if not cursor:
        break
```


### Go — ручная итерация

**Пагинация**

```go
params := pachca.ListUsersParams{}
for {
    res, err := client.Users.ListUsers(ctx, params)
    if err != nil {
        log.Fatal(err)
    }
    for _, u := range res.Data {
        fmt.Println(u.FirstName)
    }
    next, ok := res.Meta.Get()
    if !ok || next.Paginate.NextPage.IsZero() {
        break
    }
    params.Cursor = next.Paginate.NextPage
}
```


### Kotlin

**Пагинация**

```kotlin
var cursor: String? = null
do {
    val response = pachca.users.listUsers(cursor = cursor).body()
    response.data.forEach { println(it.firstName) }
    cursor = response.meta?.paginate?.nextPage
} while (cursor != null)
```


### Swift

**Пагинация**

```swift
var cursor: String? = nil
repeat {
    let response = try await pachca.users.listUsers(.init(
        query: .init(cursor: cursor, limit: 50)
    ))
    let body = try response.ok.body.json
    for user in body.data { print(user.first_name) }
    cursor = body.meta?.paginate?.next_page
} while cursor != nil
```


## Обработка ошибок

### TypeScript

TypeScript SDK не бросает исключения — возвращает `{ data, error }`:

**Обработка ошибок**

```typescript
const { data, error } = await pachca.messages.getMessage({
  path: { id: 999999 }
});

if (error) {
  console.error(error);
} else {
  console.log(data.data.content);
}
```


### Python

Python SDK бросает `PachcaAuthError` (401/403) и `PachcaAPIError` (остальные 4xx/5xx):

**Обработка ошибок**

```python
from pachca.pachca_client import Pachca, PachcaAPIError, PachcaAuthError

try:
    msg = client.messages.get_message(999999)
except PachcaAuthError as e:
    print(f"Ошибка авторизации: {e.message}")
except PachcaAPIError as e:
    print(f"Ошибка API: {e.errors}")  # list[dict]
```


### Go

**Обработка ошибок**

```go
msg, err := client.Messages.GetMessage(ctx, msgID)
if err != nil {
    var apiErr *pachca.ApiError
    if errors.As(err, &apiErr) {
        fmt.Println("API ошибка:", apiErr.Error())
    }
    log.Fatal(err)
}
```


### Kotlin

**Обработка ошибок**

```kotlin
try {
    val msg = pachca.messages.getMessage(id = 999999).body()
} catch (e: ResponseException) {
    println("Ошибка HTTP: \${e.response.status}")
}
```


### Swift

**Обработка ошибок**

```swift
do {
    let msg = try await pachca.messages.getMessage(.init(path: .init(id: 999999)))
} catch {
    print("Ошибка: \\(error)")
}
```


> Подробнее о кодах ошибок и структуре ответов — в руководстве [Ошибки и лимиты](/guides/errors).


## Справочник методов

Полный список методов по всем SDK. Имена соответствуют [страницам документации](/) — сопоставление прямое.

### Сообщения

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список сообщений чата](GET /messages) | `messages.listChatMessages` | `messages.list_chat_messages` | `Messages.ListChatMessages` |
| [Новое сообщение](POST /messages) | `messages.createMessage` | `messages.create_message` | `Messages.CreateMessage` |
| [Получить сообщение](GET /messages/{id}) | `messages.getMessage` | `messages.get_message` | `Messages.GetMessage` |
| [Изменить сообщение](PUT /messages/{id}) | `messages.updateMessage` | `messages.update_message` | `Messages.UpdateMessage` |
| [Удалить сообщение](DELETE /messages/{id}) | `messages.deleteMessage` | `messages.delete_message` | `Messages.DeleteMessage` |
| [Закрепить](POST /messages/{id}/pin) | `messages.pinMessage` | `messages.pin_message` | `Messages.PinMessage` |
| [Открепить](DELETE /messages/{id}/pin) | `messages.unpinMessage` | `messages.unpin_message` | `Messages.UnpinMessage` |

### Чаты

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список чатов](GET /chats) | `chats.listChats` | `chats.list_chats` | `Chats.ListChats` |
| [Новый чат](POST /chats) | `chats.createChat` | `chats.create_chat` | `Chats.CreateChat` |
| [Получить чат](GET /chats/{id}) | `chats.getChat` | `chats.get_chat` | `Chats.GetChat` |
| [Изменить чат](PUT /chats/{id}) | `chats.updateChat` | `chats.update_chat` | `Chats.UpdateChat` |
| [Архивировать](POST /chats/{id}/archive) | `chats.archiveChat` | `chats.archive_chat` | `Chats.ArchiveChat` |
| [Разархивировать](POST /chats/{id}/unarchive) | `chats.unarchiveChat` | `chats.unarchive_chat` | `Chats.UnarchiveChat` |

### Пользователи

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список](GET /users) | `users.listUsers` | `users.list_users` | `Users.ListUsers` |
| [Создать](POST /users) | `users.createUser` | `users.create_user` | `Users.CreateUser` |
| [Получить](GET /users/{id}) | `users.getUser` | `users.get_user` | `Users.GetUser` |
| [Изменить](PUT /users/{id}) | `users.updateUser` | `users.update_user` | `Users.UpdateUser` |
| [Удалить](DELETE /users/{id}) | `users.deleteUser` | `users.delete_user` | `Users.DeleteUser` |
| [Статус пользователя](GET /users/{id}/status) | `users.getUserStatus` | `users.get_user_status` | `Users.GetUserStatus` |
| [Изменить статус](PUT /users/{id}/status) | `users.updateUserStatus` | `users.update_user_status` | `Users.UpdateUserStatus` |
| [Удалить статус](DELETE /users/{id}/status) | `users.deleteUserStatus` | `users.delete_user_status` | `Users.DeleteUserStatus` |

### Задачи

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список](GET /tasks) | `tasks.listTasks` | `tasks.list_tasks` | `Tasks.ListTasks` |
| [Создать](POST /tasks) | `tasks.createTask` | `tasks.create_task` | `Tasks.CreateTask` |
| [Получить](GET /tasks/{id}) | `tasks.getTask` | `tasks.get_task` | `Tasks.GetTask` |
| [Изменить](PUT /tasks/{id}) | `tasks.updateTask` | `tasks.update_task` | `Tasks.UpdateTask` |
| [Удалить](DELETE /tasks/{id}) | `tasks.deleteTask` | `tasks.delete_task` | `Tasks.DeleteTask` |

### Теги

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список](GET /group_tags) | `tags.listTags` | `group_tags.list_tags` | `Tags.ListTags` |
| [Создать](POST /group_tags) | `tags.createTag` | `group_tags.create_tag` | `Tags.CreateTag` |
| [Получить](GET /group_tags/{id}) | `tags.getTag` | `group_tags.get_tag` | `Tags.GetTag` |
| [Изменить](PUT /group_tags/{id}) | `tags.updateTag` | `group_tags.update_tag` | `Tags.UpdateTag` |
| [Удалить](DELETE /group_tags/{id}) | `tags.deleteTag` | `group_tags.delete_tag` | `Tags.DeleteTag` |
| [Пользователи тега](GET /group_tags/{id}/users) | `tags.getTagUsers` | `group_tags.get_tag_users` | `Tags.GetTagUsers` |

### Участники чата

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список](GET /chats/{id}/members) | `members.listMembers` | `members.list_members` | `ChatMembers.ListMembers` |
| [Добавить](POST /chats/{id}/members) | `members.addMembers` | `members.add_members` | `ChatMembers.AddMembers` |
| [Удалить](DELETE /chats/{id}/members/{member_id}) | `members.removeMember` | `members.remove_member` | `ChatMembers.RemoveMember` |
| [Изменить роль](PUT /chats/{id}/members/{member_id}) | `members.updateMemberRole` | `members.update_member_role` | `ChatMembers.UpdateMemberRole` |
| [Покинуть](DELETE /chats/{id}/members/me) | `members.leaveChat` | `members.leave_chat` | `ChatMembers.LeaveChat` |
| [Добавить теги](POST /chats/{id}/group_tags) | `members.addTags` | `members.add_tags` | `ChatMembers.AddTags` |
| [Удалить тег](DELETE /chats/{id}/group_tags/{tag_id}) | `members.removeTag` | `members.remove_tag` | `ChatMembers.RemoveTag` |

### Реакции

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Список](GET /messages/{id}/reactions) | `reactions.listReactions` | `reactions.list_reactions` | `Reactions.ListReactions` |
| [Добавить](POST /messages/{id}/reactions) | `reactions.addReaction` | `reactions.add_reaction` | `Reactions.AddReaction` |
| [Удалить](DELETE /messages/{id}/reactions) | `reactions.removeReaction` | `reactions.remove_reaction` | `Reactions.RemoveReaction` |

### Треды

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Создать](POST /messages/{id}/thread) | `threads.createThread` | `thread.create_thread` | `Threads.CreateThread` |
| [Получить](GET /messages/{id}/thread) | `threads.getThread` | `thread.get_thread` | `Threads.GetThread` |

### Профиль и статус

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Мой профиль](GET /me) | `profile.getProfile` | `profile.get_profile` | `Profile.GetProfile` |
| [Мой статус](GET /me/status) | `profile.getStatus` | `profile.get_status` | `Profile.GetStatus` |
| [Изменить статус](PUT /me/status) | `profile.updateStatus` | `profile.update_status` | `Profile.UpdateStatus` |
| [Удалить статус](DELETE /me/status) | `profile.deleteStatus` | `profile.delete_status` | `Profile.DeleteStatus` |
| [Инфо о токене](GET /me/access_token) | `profile.getTokenInfo` | `profile.get_token_info` | `Profile.GetTokenInfo` |

### Поиск

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Пользователи](GET /search/users) | `common.searchUsers` | `search.search_users` | `Search.SearchUsers` |
| [Чаты](GET /search/chats) | `common.searchChats` | `search.search_chats` | `Search.SearchChats` |
| [Сообщения](GET /search/messages) | `common.searchMessages` | `search.search_messages` | `Search.SearchMessages` |

### Боты и вебхуки

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Обновить бота](PUT /bots/{id}) | `bots.updateBot` | `bots.update_bot` | `Bots.UpdateBot` |
| [События вебхука](GET /bots/{id}/events) | `bots.getWebhookEvents` | `bots.get_webhook_events` | `Bots.GetWebhookEvents` |
| [Удалить событие](DELETE /bots/{id}/events/{event_id}) | `bots.deleteWebhookEvent` | `bots.delete_webhook_event` | `Bots.DeleteWebhookEvent` |

### Безопасность

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Журнал аудита](GET /security/audit_events) | `security.getAuditEvents` | `security.get_audit_events` | `Security.GetAuditEvents` |

### Загрузки и экспорт

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Параметры загрузки](POST /uploads/params) | `common.getUploadParams` | `common.get_upload_params` | `Uploads.GetUploadParams` |
| [Загрузить файл](POST /uploads) | `common.uploadFile` | `common.upload_file` | `Uploads.UploadFile` |
| [Запросить экспорт](POST /message_exports) | `common.requestExport` | `common.request_export` | `Exports.RequestExport` |
| [Скачать экспорт](GET /message_exports/{id}) | `common.downloadExport` | `common.download_export` | `Exports.DownloadExport` |
| [Кастомные свойства](GET /custom_properties) | `common.listProperties` | `common.list_properties` | `Common.ListProperties` |

### Ссылки

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Добавить превью](POST /link_previews) | `common.createLinkPreviews` | `link_previews.add_link_preview` | `LinkPreviews.CreateLinkPreviews` |

### Формы

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Открыть форму](POST /views) | `common.openView` | `views.open_view` | `Forms.OpenView` |

### Прочтение сообщений

| Действие | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| [Кто прочитал](GET /messages/{id}/read_members) | `common.listReadMembers` | `read_member.list_readers` | `ReadMembers.ListReadMembers` |

## Прямой импорт функций (TypeScript)

Для tree-shaking можно импортировать функции напрямую, минуя класс-фасад:

**Tree-shaking**

```typescript
import { createClient, listUsers, createMessage } from "@pachca/sdk";

const client = createClient({
  baseUrl: "https://api.pachca.com/api/shared/v1",
  auth: () => "YOUR_TOKEN",
});

const { data } = await listUsers({ client });
```


## Контекстный менеджер (Python)

**Context manager**

```python
with Pachca("YOUR_TOKEN") as client:
    users = client.users.list_users()
    for user in users:
        print(user.first_name)
```


## Загрузка файлов (Go)

Загрузка файла в Go SDK — трёхшаговый процесс:

**Загрузка файла**

```go
// 1. Получить параметры загрузки
res, err := client.Uploads.GetUploadParams(ctx)
params := res.(*pachca.UploadParams)

// 2. Загрузить файл на S3
file, _ := os.Open("photo.png")
err = client.Uploads.UploadFile(ctx, params, file, "photo.png")

// 3. Прикрепить к сообщению (используя key из params)
```


## Примеры

Каждый SDK содержит echo-бот из 8 шагов, демонстрирующий основные паттерны: создание, чтение, обновление, удаление сообщений, реакции, треды и пины.

| SDK | Файл |
|-----|------|
| TypeScript | `sdk/typescript/examples/main.ts` |
| Python | `sdk/python/examples/main.py` |
| Go | `sdk/go/examples/main.go` |

**Запуск примеров**

```bash
# TypeScript
PACHCA_TOKEN=<token> PACHCA_CHAT_ID=<id> bun run sdk/typescript/examples/main.ts

# Python
PACHCA_TOKEN=<token> PACHCA_CHAT_ID=<id> python sdk/python/examples/main.py

# Go
PACHCA_TOKEN=<token> PACHCA_CHAT_ID=<id> go run sdk/go/examples/main.go
```

