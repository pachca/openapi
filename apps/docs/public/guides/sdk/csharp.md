
# CSharp

[Pachca.Sdk](https://www.nuget.org/packages/Pachca.Sdk) NuGet


Типизированный клиент для Pachca API. Работает в .NET 8+ с поддержкой `async/await` и `CancellationToken`.

## Быстрый старт


  ### Шаг 1. Установка

```bash
dotnet add package Pachca.Sdk
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки** > **Автоматизации** > **API** (подробнее — [Авторизация](/api/authorization)).

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");
```


  ### Шаг 3. Первый запрос

```csharp
using Pachca.Sdk;

// Получение профиля
var response = await client.Profile.GetProfileAsync();
// → User(Id: int, FirstName: string, LastName: string, Nickname: string, Email: string, PhoneNumber: string, Department: string, Title: string, Role: UserRole, Suspended: bool, InviteStatus: InviteStatus, ListTags: List<string>, CustomProperties: List<CustomProperty(Id: int, Name: string, DataType: CustomPropertyDataType, Value: string)>, UserStatus: UserStatus(Emoji: string, Title: string, ExpiresAt: DateTimeOffset?, IsAway: bool, AwayMessage: UserStatusAwayMessage(Text: string)?)?, Bot: bool, Sso: bool, CreatedAt: DateTimeOffset, LastActivityAt: DateTimeOffset, TimeZone: string, ImageUrl: string?)
```


## Инициализация

```csharp
using Pachca.Sdk;

// Стандартное подключение
using var client = new PachcaClient("YOUR_TOKEN");

// С кастомным базовым URL
using var client = new PachcaClient("YOUR_TOKEN", "https://custom-api.example.com/api/shared/v1");
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `token` | `string` | — | Bearer-токен для авторизации |
| `baseUrl` | `string` | `https://api.pachca.com/api/shared/v1` | Базовый URL API |

Клиент реализует `IDisposable` — рекомендуется использовать `using` для автоматического освобождения ресурсов.

## Все методы

| Метод | Метод API |
|-------|----------|
| `client.Common.RequestExportAsync()` | [Экспорт сообщений](/api/common/request-export) |
| `client.Common.UploadFileAsync()` | [Загрузка файла](/api/common/direct-url) |
| `client.Common.GetUploadParamsAsync()` | [Получение подписи, ключа и других параметров](/api/common/uploads) |
| `client.Common.DownloadExportAsync()` | [Скачать архив экспорта](/api/common/get-exports) |
| `client.Common.ListPropertiesAsync()` | [Список дополнительных полей](/api/common/custom-properties) |
| `client.Profile.GetTokenInfoAsync()` | [Информация о токене](/api/profile/get-info) |
| `client.Profile.GetProfileAsync()` | [Информация о профиле](/api/profile/get) |
| `client.Profile.GetStatusAsync()` | [Текущий статус](/api/profile/get-status) |
| `client.Profile.UpdateStatusAsync()` | [Новый статус](/api/profile/update-status) |
| `client.Profile.DeleteStatusAsync()` | [Удаление статуса](/api/profile/delete-status) |
| `client.Users.CreateUserAsync()` | [Создать сотрудника](/api/users/create) |
| `client.Users.ListUsersAsync()` | [Список сотрудников](/api/users/list) |
| `client.Users.GetUserAsync()` | [Информация о сотруднике](/api/users/get) |
| `client.Users.GetUserStatusAsync()` | [Статус сотрудника](/api/users/get-status) |
| `client.Users.UpdateUserAsync()` | [Редактирование сотрудника](/api/users/update) |
| `client.Users.UpdateUserStatusAsync()` | [Новый статус сотрудника](/api/users/update-status) |
| `client.Users.DeleteUserAsync()` | [Удаление сотрудника](/api/users/delete) |
| `client.Users.DeleteUserStatusAsync()` | [Удаление статуса сотрудника](/api/users/remove-status) |
| `client.GroupTags.CreateTagAsync()` | [Новый тег](/api/group-tags/create) |
| `client.GroupTags.ListTagsAsync()` | [Список тегов сотрудников](/api/group-tags/list) |
| `client.GroupTags.GetTagAsync()` | [Информация о теге](/api/group-tags/get) |
| `client.GroupTags.GetTagUsersAsync()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.GroupTags.UpdateTagAsync()` | [Редактирование тега](/api/group-tags/update) |
| `client.GroupTags.DeleteTagAsync()` | [Удаление тега](/api/group-tags/delete) |
| `client.Chats.CreateChatAsync()` | [Новый чат](/api/chats/create) |
| `client.Chats.ListChatsAsync()` | [Список чатов](/api/chats/list) |
| `client.Chats.GetChatAsync()` | [Информация о чате](/api/chats/get) |
| `client.Chats.UpdateChatAsync()` | [Обновление чата](/api/chats/update) |
| `client.Chats.ArchiveChatAsync()` | [Архивация чата](/api/chats/archive) |
| `client.Chats.UnarchiveChatAsync()` | [Разархивация чата](/api/chats/unarchive) |
| `client.Members.AddTagsAsync()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.Members.AddMembersAsync()` | [Добавление пользователей](/api/members/add) |
| `client.Members.ListMembersAsync()` | [Список участников чата](/api/members/list) |
| `client.Members.UpdateMemberRoleAsync()` | [Редактирование роли](/api/members/update) |
| `client.Members.RemoveTagAsync()` | [Исключение тега](/api/members/remove-group-tag) |
| `client.Members.LeaveChatAsync()` | [Выход из беседы или канала](/api/members/leave) |
| `client.Members.RemoveMemberAsync()` | [Исключение пользователя](/api/members/remove) |
| `client.Threads.CreateThreadAsync()` | [Новый тред](/api/threads/add) |
| `client.Threads.GetThreadAsync()` | [Информация о треде](/api/threads/get) |
| `client.Messages.CreateMessageAsync()` | [Новое сообщение](/api/messages/create) |
| `client.Messages.PinMessageAsync()` | [Закрепление сообщения](/api/messages/pin) |
| `client.Messages.ListChatMessagesAsync()` | [Список сообщений чата](/api/messages/list) |
| `client.Messages.GetMessageAsync()` | [Информация о сообщении](/api/messages/get) |
| `client.Messages.UpdateMessageAsync()` | [Редактирование сообщения](/api/messages/update) |
| `client.Messages.DeleteMessageAsync()` | [Удаление сообщения](/api/messages/delete) |
| `client.Messages.UnpinMessageAsync()` | [Открепление сообщения](/api/messages/unpin) |
| `client.ReadMembers.ListReadMembersAsync()` | [Список прочитавших сообщение](/api/read-member/list-readers) |
| `client.Reactions.AddReactionAsync()` | [Добавление реакции](/api/reactions/add) |
| `client.Reactions.ListReactionsAsync()` | [Список реакций](/api/reactions/list) |
| `client.Reactions.RemoveReactionAsync()` | [Удаление реакции](/api/reactions/remove) |
| `client.LinkPreviews.CreateLinkPreviewsAsync()` | [Unfurl (разворачивание ссылок)](/api/link-previews/add) |
| `client.Search.SearchChatsAsync()` | [Поиск чатов](/api/search/list-chats) |
| `client.Search.SearchMessagesAsync()` | [Поиск сообщений](/api/search/list-messages) |
| `client.Search.SearchUsersAsync()` | [Поиск сотрудников](/api/search/list-users) |
| `client.Tasks.CreateTaskAsync()` | [Новое напоминание](/api/tasks/create) |
| `client.Tasks.ListTasksAsync()` | [Список напоминаний](/api/tasks/list) |
| `client.Tasks.GetTaskAsync()` | [Информация о напоминании](/api/tasks/get) |
| `client.Tasks.UpdateTaskAsync()` | [Редактирование напоминания](/api/tasks/update) |
| `client.Tasks.DeleteTaskAsync()` | [Удаление напоминания](/api/tasks/delete) |
| `client.Views.OpenViewAsync()` | [Открытие представления](/api/views/open) |
| `client.Bots.GetWebhookEventsAsync()` | [История событий](/api/bots/list-events) |
| `client.Bots.UpdateBotAsync()` | [Редактирование бота](/api/bots/update) |
| `client.Bots.DeleteWebhookEventAsync()` | [Удаление события](/api/bots/remove-event) |
| `client.Security.GetAuditEventsAsync()` | [Журнал аудита событий](/api/security/list) |


## Запросы

Все методы — асинхронные и возвращают `Task<T>`.

**GET с параметрами:**

```csharp
using Pachca.Sdk;

// Список чатов
var response = await client.Chats.ListChatsAsync(SortOrder.Desc, ChatAvailability.IsMember, "2025-01-01T00:00:00.000Z", "2025-02-01T00:00:00.000Z", false, 1, "eyJpZCI6MTAsImRpciI6ImFzYyJ9");
// → ListChatsResponse(Data: List<Chat>, Meta: PaginationMeta?)
```


**POST с телом запроса:**

```csharp
using Pachca.Sdk;

// Создание чата
var request = new ChatCreateRequest
{
    Chat = new ChatCreateRequestChat
    {
        Name = "🤿 aqua",
        MemberIds = new List<int> { 123 },
        GroupTagIds = new List<int> { 123 },
        Channel = true,
        @Public = false
    }
};
var response = await client.Chats.CreateChatAsync(request);
// → Chat(Id: int, Name: string, CreatedAt: DateTimeOffset, OwnerId: int, MemberIds: List<int>, GroupTagIds: List<int>, Channel: bool, Personal: bool, @Public: bool, LastMessageAt: DateTimeOffset, MeetRoomUrl: string)
```


**Простой вызов по ID:**

```csharp
using Pachca.Sdk;

// Получение чата
var response = await client.Chats.GetChatAsync(334);
// → Chat(Id: int, Name: string, CreatedAt: DateTimeOffset, OwnerId: int, MemberIds: List<int>, GroupTagIds: List<int>, Channel: bool, Personal: bool, @Public: bool, LastMessageAt: DateTimeOffset, MeetRoomUrl: string)
```


## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ содержит поле `Meta.Paginate.NextPage` — курсор для следующей страницы.

### Ручная пагинация

```csharp
var chats = new List<Chat>();
string? cursor = null;

do
{
    var response = await client.Chats.ListChatsAsync(cursor: cursor);
    chats.AddRange(response.Data);
    cursor = response.Meta?.Paginate?.NextPage;
} while (cursor != null);
```

### Автопагинация

Для каждого метода с пагинацией есть `*AllAsync()` вариант, который автоматически обходит все страницы и возвращает плоский список:

```csharp
// Все чаты одним списком
var chats = await client.Chats.ListChatsAllAsync();
Console.WriteLine($"Всего: {chats.Count}");
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `Security.GetAuditEventsAllAsync()` | `List<AuditEvent>` |
| `Bots.GetWebhookEventsAllAsync()` | `List<WebhookEvent>` |
| `Chats.ListChatsAllAsync()` | `List<Chat>` |
| `GroupTags.ListTagsAllAsync()` | `List<GroupTag>` |
| `GroupTags.GetTagUsersAllAsync()` | `List<User>` |
| `Members.ListMembersAllAsync()` | `List<User>` |
| `Messages.ListChatMessagesAllAsync()` | `List<Message>` |
| `Reactions.ListReactionsAllAsync()` | `List<Reaction>` |
| `Search.SearchChatsAllAsync()` | `List<Chat>` |
| `Search.SearchMessagesAllAsync()` | `List<Message>` |
| `Search.SearchUsersAllAsync()` | `List<User>` |
| `Tasks.ListTasksAllAsync()` | `List<Task>` |
| `Users.ListUsersAllAsync()` | `List<User>` |

## Обработка ошибок

SDK выбрасывает два типа исключений:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422`:

```csharp
using Pachca.Sdk;

try
{
    await client.Chats.CreateChatAsync(request);
}
catch (ApiError e)
{
    foreach (var err in e.Errors)
    {
        Console.WriteLine($"{err.Key}: {err.Message}");  // "name", "не может быть пустым"
        Console.WriteLine(err.Code);                     // "blank"
    }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `Key` | `string` | Поле, вызвавшее ошибку |
| `Value` | `string?` | Переданное значение |
| `Message` | `string` | Текст ошибки |
| `Code` | `ValidationErrorCode` | Код валидации (`Blank`, `Invalid`, `Taken`, ...) |
| `Payload` | `string?` | Дополнительные данные |

### OAuthError

Возникает при ошибке авторизации (`401`):

```csharp
using Pachca.Sdk;

try
{
    await client.Profile.GetProfileAsync();
}
catch (OAuthError e)
{
    Console.WriteLine(e.ErrorDescription); // "Token not found"
}
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests` и ошибок сервера `5xx`:

- До **3 повторов** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- Ошибки клиента (4xx, кроме 429) возвращаются сразу без повторов

## Отмена запросов

Все асинхронные методы поддерживают `CancellationToken`:

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
var users = await client.Users.ListUsersAsync(cancellationToken: cts.Token);
```

## Загрузка файлов

Загрузка файла — трёхшаговый процесс:

```csharp
// 1. Получить параметры загрузки
var uploadParams = await client.Common.GetUploadParamsAsync();

// 2. Загрузить файл на S3
using var fileStream = File.OpenRead("photo.png");
await client.Common.UploadFileAsync(uploadParams, fileStream, "photo.png");

// 3. Прикрепить к сообщению (используя key из uploadParams)
await client.Messages.CreateMessageAsync(new MessageCreateRequest
{
    Message = new MessageCreateRequestMessage
    {
        EntityId = chatId,
        Content = "Фото",
        Files = new List<MessageFile> { new() { Key = uploadParams.Key, Name = "photo.png" } }
    }
});
```

## Сериализация

SDK автоматически конвертирует имена полей между PascalCase (C#) и snake_case (API):

```csharp
// Вы пишете:
new ChatCreateRequestChat { MemberIds = new List<int> { 123 }, GroupTagIds = new List<int> { 456 } }

// SDK отправляет:
{ "member_ids": [123], "group_tag_ids": [456] }

// API возвращает:
{ "last_message_at": "2025-01-01T00:00:00Z" }

// Вы получаете:
chat.LastMessageAt // DateTimeOffset
```

## Типы

Все типы доступны из пространства имён `Pachca.Sdk`:

```csharp
using Pachca.Sdk;

// Модели
Chat chat;
Message message;
User user;
Task task;
GroupTag groupTag;

// Запросы
ChatCreateRequest chatRequest;
MessageCreateRequest messageRequest;
TaskCreateRequest taskRequest;

// Перечисления
AuditEventKey eventKey;
ChatAvailability availability;
ChatMemberRole role;
TaskStatus status;
ValidationErrorCode errorCode;

// Ошибки
ApiError apiError;
OAuthError oauthError;
```

## Примеры

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

// Отправка сообщения
var request = new MessageCreateRequest
{
    Message = new MessageCreateRequestMessage
    {
        EntityType = MessageEntityType.Discussion,
        EntityId = 334,
        Content = "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
        Files = new List<MessageCreateRequestFile> { new MessageCreateRequestFile
        {
            Key = "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
            Name = "logo.png",
            FileType = FileType.Image,
            Size = 12345,
            Width = 800,
            Height = 600
        } },
        Buttons = new List<List<Button>> { new List<Button> { new Button
        {
            Text = "Подробнее",
            Url = "https://example.com/details",
            Data = "awesome"
        } } },
        ParentMessageId = 194270,
        DisplayAvatarUrl = "https://example.com/avatar.png",
        DisplayName = "Бот Поддержки",
        SkipInviteMentions = false
    },
    LinkPreview = false
};
var response = await client.Messages.CreateMessageAsync(request);
// → Message(Id: int, EntityType: MessageEntityType, EntityId: int, ChatId: int, RootChatId: int, Content: string, UserId: int, CreatedAt: DateTimeOffset, Url: string, Files: List<File(Id: int, Key: string, Name: string, FileType: FileType, Url: string, Width: int?, Height: int?)>, Buttons: List<List<Button(Text: string, Url: string?, Data: string?)>>?, Thread: MessageThread(Id: long, ChatId: long)?, Forwarding: Forwarding(OriginalMessageId: int, OriginalChatId: int, AuthorId: int, OriginalCreatedAt: DateTimeOffset, OriginalThreadId: int?, OriginalThreadMessageId: int?, OriginalThreadParentChatId: int?)?, ParentMessageId: int?, DisplayAvatarUrl: string?, DisplayName: string?, ChangedAt: DateTimeOffset?, DeletedAt: DateTimeOffset?)

// Список сотрудников
var response = await client.Users.ListUsersAsync("Олег", 1, "eyJpZCI6MTAsImRpciI6ImFzYyJ9");
// → ListUsersResponse(Data: List<User>, Meta: PaginationMeta?)

// Создание задачи
var request = new TaskCreateRequest
{
    Task = new TaskCreateRequestTask
    {
        Kind = TaskKind.Reminder,
        Content = "Забрать со склада 21 заказ",
        DueAt = "2020-06-05T12:00:00.000+03:00",
        Priority = 2,
        PerformerIds = new List<int> { 123 },
        ChatId = 456,
        AllDay = false,
        CustomProperties = new List<TaskCreateRequestCustomProperty> { new TaskCreateRequestCustomProperty { Id = 78, Value = "Синий склад" } }
    }
};
var response = await client.Tasks.CreateTaskAsync(request);
// → Task(Id: int, Kind: TaskKind, Content: string, DueAt: DateTimeOffset?, Priority: int, UserId: int, ChatId: int?, Status: TaskStatus, CreatedAt: DateTimeOffset, PerformerIds: List<int>, AllDay: bool, CustomProperties: List<CustomProperty(Id: int, Name: string, DataType: CustomPropertyDataType, Value: string)>)
```


