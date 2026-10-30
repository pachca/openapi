> Расположение: SDK
> Краткое содержание: Типизированный клиент для Pachca API на C#: .NET 8+ с async/await, CancellationToken, автопагинацией и обработкой retry. NuGet-пакет Pachca.Sdk
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# C#

- [Pachca.Sdk](https://www.nuget.org/packages/Pachca.Sdk) NuGet


Типизированный клиент для Pachca API. Работает в .NET 8+ с поддержкой `async/await` и `CancellationToken`.

## Быстрый старт


  ### Шаг 1. Установка

```bash
dotnet add package Pachca.Sdk
```


  ### Шаг 2. Создание клиента

Клиенту нужен токен бота или персональный токен. Какой выбрать и кто может его выпустить, описано в разделе [Какой токен выбрать](/api/authorization#kakoy-token-vybrat).

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");
```


  ### Шаг 3. Первый запрос

```csharp
using Pachca.Sdk;

// Получение профиля
var response = await client.Profile.GetProfileAsync();
// → User(Id: int, FirstName: string?, LastName: string?, Nickname: string, Email: string?, PhoneNumber: string?, Department: string?, Title: string?, Role: UserRole, Suspended: bool, InviteStatus: InviteStatus, InviterId: int?, ListTags: List<string>, CustomProperties: List<CustomProperty(Id: int, Name: string, DataType: CustomPropertyDataType, Value: string?)>, UserStatus: UserStatus(Emoji: string, Title: string, ExpiresAt: DateTimeOffset?, IsAway: bool, AwayMessage: UserStatusAwayMessage(Text: string)?)?, Bot: bool, Sso: bool, CreatedAt: DateTimeOffset, LastActivityAt: DateTimeOffset?, TimeZone: string?, ImageUrl: string?)
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
| `client.Oauth.RevokeTokenAsync()` | [Отзыв токена](/api/oauth/revoke-token) |
| `client.Oauth.ExchangeTokenAsync()` | [Обмен кода на токен](/api/oauth/exchange-token) |
| `client.Oauth.GetTokenInfoAsync()` | [Информация о токене](/api/oauth/token-info) |
| `client.Chats.CreateChatAsync()` | [Новый чат](/api/chats/create) |
| `client.Chats.RequestExportAsync()` | [Экспорт сообщений](/api/chats/request-export) |
| `client.Chats.ListChatsAsync()` | [Список чатов](/api/chats/list) |
| `client.Chats.GetChatAsync()` | [Информация о чате](/api/chats/get) |
| `client.Chats.ListCompanyChatsAsync()` | [Список чатов пространства](/api/chats/list-company) |
| `client.Chats.DownloadExportAsync()` | [Скачать архив экспорта](/api/chats/download-export) |
| `client.Chats.UpdateChatAsync()` | [Редактирование чата](/api/chats/update) |
| `client.Chats.ArchiveChatAsync()` | [Архивация чата](/api/chats/archive) |
| `client.Chats.UpdateChatAvatarAsync()` | [Загрузка аватара чата](/api/chats/update-avatar) |
| `client.Chats.UnarchiveChatAsync()` | [Разархивация чата](/api/chats/unarchive) |
| `client.Chats.MarkChatUnreadAsync()` | [Отметка чата непрочитанным](/api/chats/mark-unread) |
| `client.Chats.DeleteChatAvatarAsync()` | [Удаление аватара чата](/api/chats/remove-avatar) |
| `client.Profile.GetProfileAsync()` | [Свой профиль](/api/profile/get) |
| `client.Profile.GetStatusAsync()` | [Свой статус](/api/profile/get-status) |
| `client.Profile.UpdateProfileAvatarAsync()` | [Загрузка своего аватара](/api/profile/update-avatar) |
| `client.Profile.UpdateStatusAsync()` | [Новый свой статус](/api/profile/update-status) |
| `client.Profile.DeleteProfileAvatarAsync()` | [Удаление своего аватара](/api/profile/delete-avatar) |
| `client.Profile.DeleteStatusAsync()` | [Удаление своего статуса](/api/profile/delete-status) |
| `client.Users.CreateUserAsync()` | [Новый сотрудник](/api/users/create) |
| `client.Users.ListUsersAsync()` | [Список сотрудников](/api/users/list) |
| `client.Users.GetUserAsync()` | [Информация о сотруднике](/api/users/get) |
| `client.Users.GetUserStatusAsync()` | [Статус сотрудника](/api/users/get-status) |
| `client.Users.UpdateUserAsync()` | [Редактирование сотрудника](/api/users/update) |
| `client.Users.UpdateUserAvatarAsync()` | [Загрузка аватара сотрудника](/api/users/update-avatar) |
| `client.Users.UpdateUserStatusAsync()` | [Новый статус сотрудника](/api/users/update-status) |
| `client.Users.DeleteUserAsync()` | [Удаление сотрудника](/api/users/delete) |
| `client.Users.DeleteUserAvatarAsync()` | [Удаление аватара сотрудника](/api/users/remove-avatar) |
| `client.Users.DeleteUserStatusAsync()` | [Удаление статуса сотрудника](/api/users/remove-status) |
| `client.GroupTags.CreateTagAsync()` | [Новый тег](/api/group-tags/create) |
| `client.GroupTags.ListTagsAsync()` | [Список тегов](/api/group-tags/list) |
| `client.GroupTags.GetTagAsync()` | [Информация о теге](/api/group-tags/get) |
| `client.GroupTags.GetTagUsersAsync()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.GroupTags.UpdateTagAsync()` | [Редактирование тега](/api/group-tags/update) |
| `client.GroupTags.DeleteTagAsync()` | [Удаление тега](/api/group-tags/delete) |
| `client.Members.AddTagsAsync()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.Members.AddMembersAsync()` | [Добавление участников](/api/members/add) |
| `client.Members.ListMembersAsync()` | [Список участников чата](/api/members/list) |
| `client.Members.UpdateMemberRoleAsync()` | [Редактирование роли участника](/api/members/update) |
| `client.Members.LeaveChatAsync()` | [Выход из чата](/api/members/leave) |
| `client.Members.RemoveTagAsync()` | [Исключение тега из чата](/api/members/remove-group-tag) |
| `client.Members.RemoveMemberAsync()` | [Исключение участника](/api/members/remove) |
| `client.Threads.CreateStandaloneThreadAsync()` | [Новый самостоятельный тред](/api/threads/create) |
| `client.Threads.CreateThreadAsync()` | [Новый тред](/api/threads/add) |
| `client.Threads.ListThreadsAsync()` | [Список тредов](/api/threads/list) |
| `client.Threads.GetThreadAsync()` | [Информация о треде](/api/threads/get) |
| `client.Messages.CreateMessageAsync()` | [Новое сообщение](/api/messages/create) |
| `client.Messages.UnfurlAsync()` | [Unfurl (разворачивание ссылок)](/api/messages/unfurl) |
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
| `client.ImportantMessages.AddMessageToImportantAsync()` | [Добавление сообщения в важные](/api/important-messages/create) |
| `client.ImportantMessages.ListImportantMessagesAsync()` | [Список важных сообщений](/api/important-messages/list) |
| `client.ImportantMessages.RemoveMessageFromImportantAsync()` | [Удаление сообщения из важных](/api/important-messages/delete) |
| `client.Search.SearchChatsAsync()` | [Поиск чатов](/api/search/list-chats) |
| `client.Search.SearchMessagesAsync()` | [Поиск сообщений](/api/search/list-messages) |
| `client.Search.SearchUsersAsync()` | [Поиск сотрудников](/api/search/list-users) |
| `client.Tasks.CreateTaskAsync()` | [Новое напоминание](/api/tasks/create) |
| `client.Tasks.ListTasksAsync()` | [Список напоминаний](/api/tasks/list) |
| `client.Tasks.GetTaskAsync()` | [Информация о напоминании](/api/tasks/get) |
| `client.Tasks.UpdateTaskAsync()` | [Редактирование напоминания](/api/tasks/update) |
| `client.Tasks.DeleteTaskAsync()` | [Удаление напоминания](/api/tasks/delete) |
| `client.Drafts.CreateDraftAsync()` | [Новый черновик](/api/drafts/create) |
| `client.Drafts.ListDraftsAsync()` | [Список черновиков](/api/drafts/list) |
| `client.Drafts.GetDraftAsync()` | [Информация о черновике](/api/drafts/get) |
| `client.Drafts.UpdateDraftAsync()` | [Редактирование черновика](/api/drafts/update) |
| `client.Drafts.DeleteDraftAsync()` | [Удаление черновика](/api/drafts/delete) |
| `client.Views.OpenViewAsync()` | [Открытие представления](/api/views/open) |
| `client.Views.SubmitViewResponseAsync()` | [Ответ на отправку формы](/api/views/submit-response) |
| `client.Bots.CreateBotAsync()` | [Новый бот](/api/bots/create) |
| `client.Bots.SelfRecreateBotTokenAsync()` | [Ротация собственного токена бота](/api/bots/recreate-token-self) |
| `client.Bots.RecreateBotTokenAsync()` | [Ротация токена бота](/api/bots/recreate-token) |
| `client.Bots.RotateBotClientSecretAsync()` | [Ротация секрета клиента](/api/bots/rotate-client-secret) |
| `client.Bots.CreateBotTokenAsync()` | [Новый токен бота](/api/bots/create-token) |
| `client.Bots.ReissueBotTokenAsync()` | [Перевыпуск токена бота](/api/bots/reissue-token) |
| `client.Bots.ListBotsAsync()` | [Список ботов](/api/bots/list) |
| `client.Bots.GetBotAsync()` | [Информация о боте](/api/bots/get) |
| `client.Bots.ListCompanyBotsAsync()` | [Список ботов пространства](/api/bots/list-company) |
| `client.Bots.GetWebhookEventsAsync()` | [История событий](/api/bots/list-events) |
| `client.Bots.GetBotScopesAsync()` | [Каталог прав бота](/api/bots/list-scopes) |
| `client.Bots.ListBotTokensAsync()` | [Список токенов бота](/api/bots/list-tokens) |
| `client.Bots.GetWebhookEventsStreamAsync()` | [Поток событий](/api/bots/get-stream) |
| `client.Bots.SelfUpdateBotWebhookAsync()` | [Саморегистрация вебхука бота](/api/bots/update-webhook) |
| `client.Bots.UpdateBotAsync()` | [Редактирование бота](/api/bots/update) |
| `client.Bots.UpdateBotAvatarAsync()` | [Загрузка аватара бота](/api/bots/update-avatar) |
| `client.Bots.UpdateBotTokenAsync()` | [Изменение токена бота](/api/bots/update-token) |
| `client.Bots.DeleteBotAsync()` | [Удаление бота](/api/bots/delete) |
| `client.Bots.DeleteBotAvatarAsync()` | [Удаление аватара бота](/api/bots/remove-avatar) |
| `client.Bots.DeleteWebhookEventAsync()` | [Удаление события истории](/api/bots/remove-event) |
| `client.Bots.DeleteBotTokenAsync()` | [Удаление токена бота](/api/bots/delete-token) |
| `client.Security.GetAuditEventsAsync()` | [Журнал аудита событий](/api/security/list) |
| `client.CustomProperties.ListPropertiesAsync()` | [Список дополнительных полей](/api/custom-properties/list) |
| `client.Files.UploadFileAsync()` | [Загрузка файла](/api/files/direct-url) |
| `client.Files.GetUploadParamsAsync()` | [Получение подписи, ключа и других параметров](/api/files/uploads) |
| `client.Files.DownloadFileAsync()` | [Скачивание файла](/api/files/get) |


## Запросы

Все методы — асинхронные и возвращают `Task<T>`.

**GET с параметрами:**

```csharp
using Pachca.Sdk;

// Список чатов
var response = await client.Chats.ListChatsAsync(ChatSortField.Id, SortOrder.Desc, ChatAvailability.IsMember, true, DateTimeOffset.Parse("2025-01-01T00:00:00.000Z"), DateTimeOffset.Parse("2025-02-01T00:00:00.000Z"), false, 1, "eyJpZCI6MTAsImRpciI6ImFzYyJ9");
// → ListChatsResponse(Data: List<Chat>, Meta: PaginationMeta)
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
// → CreateChatResponse(Data: Chat(Id: int, Name: string, CreatedAt: DateTimeOffset, OwnerId: int, MemberIds: List<int>, GroupTagIds: List<int>, Channel: bool, Archived: bool, Personal: bool, @Public: bool, LastMessageAt: DateTimeOffset, MeetRoomUrl: string, AvatarUrl: string?), Meta: CreateChatResponseMeta(NotFoundMemberIds: List<int>, NotFoundGroupTagIds: List<int>))
```


**Простой вызов по ID:**

```csharp
using Pachca.Sdk;

// Получение чата
var response = await client.Chats.GetChatAsync(334);
// → Chat(Id: int, Name: string, CreatedAt: DateTimeOffset, OwnerId: int, MemberIds: List<int>, GroupTagIds: List<int>, Channel: bool, Archived: bool, Personal: bool, @Public: bool, LastMessageAt: DateTimeOffset, MeetRoomUrl: string, AvatarUrl: string?)
```


## Пагинация

Поля пагинации называются как в API, но в PascalCase: `Meta.Paginate.NextPage`, `PrevPage`, `HasNext` и `HasPrev`, а у методов поиска ещё `Meta.Total`. Какие поля приходят у каждого метода и как понять, что страницы закончились, описано в разделе [Пагинация](/api/pagination).

### Ручная пагинация

```csharp
var chats = new List<Chat>();
string? cursor = null;
var hasNext = true;

while (hasNext)
{
    var response = await client.Chats.ListChatsAsync(limit: 50, cursor: cursor);
    if (response.Data.Count == 0) break;
    chats.AddRange(response.Data);
    cursor = response.Meta.Paginate.NextPage;
    hasNext = response.Meta.Paginate.HasNext ?? true;
}
```

В модели поле `HasNext` имеет тип `bool?`. Если оно `null`, цикл идёт дальше и останавливается на пустой странице. Так же обходят страницы методы `*AllAsync()`.

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
| `Bots.ListBotsAllAsync()` | `List<BotResponse>` |
| `Bots.ListBotTokensAllAsync()` | `List<BotAccessToken>` |
| `Bots.ListCompanyBotsAllAsync()` | `List<CompanyBotResponse>` |
| `Bots.GetWebhookEventsAllAsync()` | `List<WebhookEvent>` |
| `Chats.ListChatsAllAsync()` | `List<Chat>` |
| `Chats.ListCompanyChatsAllAsync()` | `List<Chat>` |
| `Drafts.ListDraftsAllAsync()` | `List<Draft>` |
| `GroupTags.ListTagsAllAsync()` | `List<GroupTag>` |
| `GroupTags.GetTagUsersAllAsync()` | `List<User>` |
| `ImportantMessages.ListImportantMessagesAllAsync()` | `List<Message>` |
| `Members.ListMembersAllAsync()` | `List<User>` |
| `Messages.ListChatMessagesAllAsync()` | `List<Message>` |
| `Reactions.ListReactionsAllAsync()` | `List<Reaction>` |
| `Search.SearchChatsAllAsync()` | `List<Chat>` |
| `Search.SearchMessagesAllAsync()` | `List<Message>` |
| `Search.SearchUsersAllAsync()` | `List<User>` |
| `Tasks.ListTasksAllAsync()` | `List<Pachca.Sdk.Task>` |
| `Threads.ListThreadsAllAsync()` | `List<Pachca.Sdk.Thread>` |
| `Users.ListUsersAllAsync()` | `List<User>` |

## Обработка ошибок

SDK выбрасывает два типа исключений:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422` с массивом `errors` в теле:

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
        Console.WriteLine($"{err.Key}: {err.Message}");  // name: не может быть пустым
        Console.WriteLine(err.Code);                     // blank
    }
}
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `Key` | `string` | Поле, вызвавшее ошибку |
| `Value` | `object?` | Переданное значение |
| `Message` | `string` | Текст ошибки |
| `Code` | `ValidationErrorCode` | Код валидации (`Blank`, `Invalid`, `Taken`, ...) |
| `Payload` | `Dictionary<string, object>?` | Дополнительные данные |

Код статуса ответа — в поле `StatusCode`. Если ответ с ошибкой пришёл без тела или не в JSON, SDK тоже выбрасывает `ApiError`: с кодом статуса и пустым `Errors`. Так бывает с ответом `404` без тела от метода [Поток событий](/api/bots/get-stream), когда история событий выключена, и со страницей прокси при `502`.

### OAuthError

Возникает при ошибке авторизации: `401`, а также `403` с кодом `insufficient_scope` или `role_forbidden` и отказе при обмене кода на токен. Код — в поле `error`, список кодов — в разделе [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii):

```csharp
using Pachca.Sdk;

try
{
    await client.Profile.GetProfileAsync();
}
catch (OAuthError e)
{
    Console.WriteLine(e.Error);            // "insufficient_scope"
    Console.WriteLine(e.ErrorDescription); // описание ошибки
}
```

Поле `Error` — структура `OAuthErrorCode`: её сравнивают через `==` с константой, например `OAuthErrorCode.InsufficientScope`, или со строкой, а строку кода даёт `Value`.

## Повторные запросы

Паузы между попытками, к каждой SDK добавляет случайную величину до 25%:

- **429 с заголовком `Retry-After`:** срок из заголовка
- **429 без заголовка:** 1 сек, 2 сек, 4 сек
- **5xx:** ~10 сек, ~20 сек, ~40 сек

Сетевую ошибку без ответа сервера SDK не повторяет: исключение `HttpRequestException` приходит сразу. Паузы прерывает `CancellationToken`, переданный в метод.

Общие правила повторов — в разделе [Повторные запросы](/api/limits#povtornye-zaprosy-retry).

## Отмена запросов

Все асинхронные методы поддерживают `CancellationToken`:

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
var users = await client.Users.ListUsersAsync(cancellationToken: cts.Token);
```

## Загрузка файлов

Загрузка файла идёт в три шага: получить параметры загрузки, отправить файл по адресу `DirectUrl` и прикрепить его к сообщению по ключу. Поля каждого шага описаны в разделе [Загрузка файлов](/api/file-uploads).

```csharp
var fileName = "report.pdf";
var fileBytes = await System.IO.File.ReadAllBytesAsync(fileName);

// 1. Получить параметры загрузки и подставить имя файла в ключ
var uploadParams = await client.Files.GetUploadParamsAsync();
var key = uploadParams.Key.Replace("${filename}", fileName);

// 2. Загрузить файл по адресу DirectUrl
await client.Files.UploadFileAsync(uploadParams.DirectUrl, new FileUploadRequest
{
    ContentDisposition = uploadParams.ContentDisposition,
    Acl = uploadParams.Acl,
    Policy = uploadParams.Policy,
    XAmzCredential = uploadParams.XAmzCredential,
    XAmzAlgorithm = uploadParams.XAmzAlgorithm,
    XAmzDate = uploadParams.XAmzDate,
    XAmzSignature = uploadParams.XAmzSignature,
    Key = key,
    Bucket = uploadParams.Bucket,
    File = fileBytes,
});

// 3. Отправить сообщение с файлом
await client.Messages.CreateMessageAsync(new MessageCreateRequest
{
    Message = new MessageCreateRequestMessage
    {
        EntityId = chatId,
        Content = "Отчёт за неделю",
        Files = new List<MessageCreateRequestFile>
        {
            new() { Key = key, Name = fileName, FileType = FileType.File, Size = fileBytes.Length }
        }
    }
});
```

Тип `File` есть и в SDK, поэтому `System.IO.File` в примере записан полностью. Такие совпадения имён перечислены в разделе [Имена Task, Thread, File и TaskStatus](#imena-task-thread-file-i-taskstatus).

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
Pachca.Sdk.Task task;
GroupTag groupTag;

// Запросы
ChatCreateRequest chatRequest;
MessageCreateRequest messageRequest;
TaskCreateRequest taskRequest;

// Перечисления
AuditEventKey eventKey;
ChatAvailability availability;
ChatMemberRole role;
Pachca.Sdk.TaskStatus status;
ValidationErrorCode errorCode;

// Ошибки
ApiError apiError;
OAuthError oauthError;
```

Перечисление в ответе — структура со строкой `Value`: значение, которого SDK ещё не знает, приходит как есть, и `IsKnown` у него `false`. Значения такого перечисления сравниваются через `==`, а в `switch` — по `Value`. Ту же строку, что и `Value`, возвращает `ToString()`.

### Имена Task, Thread, File и TaskStatus

В SDK есть типы `Task`, `Thread`, `File` и `TaskStatus`. Проект .NET по умолчанию неявно подключает пространства имён `System.Threading.Tasks`, `System.Threading` и `System.IO`, где есть типы с теми же именами. Поэтому рядом с `using Pachca.Sdk;` такое короткое имя неоднозначно, и компилятор отвечает ошибкой `CS0104`. Запишите тип полностью, например `Pachca.Sdk.Task` или `System.IO.File`, или задайте псевдонимы в начале файла:

```csharp
using Pachca.Sdk;
using Task = System.Threading.Tasks.Task;
using PachcaTask = Pachca.Sdk.Task;
```

Тогда `Task` означает задачу .NET, например в `static async Task Main()`, а `PachcaTask` — задачу Пачки.

## Тело вебхука

Тела событий вебхука описаны классами `MessageWebhookPayload`, `ReactionWebhookPayload`, `ButtonWebhookPayload`, `ViewSubmitWebhookPayload`, `ChatMemberWebhookPayload`, `CompanyMemberWebhookPayload`, `LinkSharedWebhookPayload` и `VideoCallWebhookPayload`. Их общий базовый класс `WebhookPayloadUnion` разбирается своим конвертером: класс он выбирает по полям `type` и `event`.

```csharp
using System.Text.Json;
using Pachca.Sdk;

// body — тело запроса строкой
var payload = JsonSerializer.Deserialize<WebhookPayloadUnion>(body);
if (payload is ButtonWebhookPayload button)
{
    Console.WriteLine($"{button.MessageId} {button.Data}");
}
```

Подпись проверяйте по исходному телу до разбора, как в разделе [Безопасность](/guides/webhook/handler#bezopasnost). Те же классы отдают методы `PollWebhookEventsAsync` и `PollWebhookPayloadsAsync`, которые забирают события из истории: пример — в разделе [Пример поллинга](/guides/webhook/polling#primer-pollinga).

## Примеры

**Отправка сообщения:**

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

var request = new MessageCreateRequest { Message = new MessageCreateRequestMessage { EntityId = 334, Content = "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)" } };
var response = await client.Messages.CreateMessageAsync(request);
// → Message(Id: int, EntityType: MessageEntityType, EntityId: int, ChatId: int, RootChatId: int, Content: string, UserId: int, CreatedAt: DateTimeOffset, Url: string, Files: List<File(Id: int, Key: string, Name: string, FileType: FileType, Url: string, Width: int?, Height: int?, DurationMs: int?)>, VoiceContent: VoiceContent(DurationMs: int, Waveform: string, Transcript: string?)?, Buttons: List<List<Button(Text: string, Url: string?, Data: string?)>>?, Thread: MessageThread(Id: long, ChatId: long)?, Forwarding: Forwarding(OriginalMessageId: int, OriginalChatId: int, AuthorId: int, OriginalCreatedAt: DateTimeOffset, OriginalThreadId: int?, OriginalThreadMessageId: int?, OriginalThreadParentChatId: int?)?, ParentMessageId: int?, DisplayAvatarUrl: string?, DisplayName: string?, ChangedAt: DateTimeOffset?, DeletedAt: DateTimeOffset?, Important: bool)
```


**Список сотрудников:**

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

var response = await client.Users.ListUsersAsync("Олег", 1, "eyJpZCI6MTAsImRpciI6ImFzYyJ9");
// → ListUsersResponse(Data: List<User>, Meta: PaginationMeta)
```


**Создание задачи:**

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

var request = new TaskCreateRequest
{
    Task = new TaskCreateRequestTask
    {
        Kind = TaskKind.Reminder,
        Content = "Забрать со склада 21 заказ",
        DueAt = DateTimeOffset.Parse("2020-06-05T12:00:00.000+03:00"),
        Priority = 2,
        PerformerIds = new List<int> { 123 },
        ChatId = 456,
        AllDay = false,
        CustomProperties = new List<TaskCreateRequestCustomProperty> { new TaskCreateRequestCustomProperty { Id = 78, Value = "Синий склад" } }
    }
};
var response = await client.Tasks.CreateTaskAsync(request);
// → Task(Id: int, Kind: TaskKind, Content: string, DueAt: DateTimeOffset?, Priority: int, UserId: int, ChatId: int?, Status: TaskStatus, CreatedAt: DateTimeOffset, PerformerIds: List<int>, AllDay: bool, CustomProperties: List<CustomProperty(Id: int, Name: string, DataType: CustomPropertyDataType, Value: string?)>)
```



## Связанные разделы

- [SDK](/guides/sdk/overview)
- [Авторизация](/api/authorization)
- [Пагинация](/api/pagination)
