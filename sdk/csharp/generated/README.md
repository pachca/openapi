# Pachca C# SDK

C# клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
dotnet add package Pachca.Sdk
```

## Использование

```csharp
using Pachca.Sdk;

var client = new PachcaClient("YOUR_TOKEN");

// Отправка сообщения
var message = await client.Messages.CreateMessageAsync(new MessageCreateRequest
{
    Message = new MessageCreateRequestMessage
    {
        EntityId = chatId,
        Content = "Привет из C# SDK!"
    }
});

// Получение сообщения
var fetched = await client.Messages.GetMessageAsync(message.Id);

// Список пользователей
var users = await client.Users.ListUsersAsync();
```

## Конвенции

- **Вход**: path-параметры и body-поля передаются как аргументы метода или объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.

```csharp
// Реакция на сообщение
await client.Reactions.AddReactionAsync(messageId, new ReactionRequest { Code = "👍" });

// Закрепление сообщения
await client.Messages.PinMessageAsync(messageId);

// Создание сообщения (объект-запрос)
await client.Messages.CreateMessageAsync(new MessageCreateRequest
{
    Message = new MessageCreateRequestMessage { EntityId = 123, Content = "..." }
});

// Ответ: API возвращает { "data": Message }, SDK возвращает Message
var message = await client.Messages.CreateMessageAsync(...); // Message, не MessageDataWrapper
```

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*AllAsync`-методы, которые автоматически обходят все страницы:

```csharp
// Вручную
var chats = new List<Chat>();
string? cursor = null;
while (true)
{
    var response = await client.Chats.ListChatsAsync(cursor: cursor);
    if (response.Data.Count == 0) break;
    chats.AddRange(response.Data);
    cursor = response.Meta.Paginate.NextPage;
}

// Автоматически
var allChats = await client.Chats.ListChatsAllAsync();
```

Доступные методы: `ListChatsAllAsync`, `ListUsersAllAsync`, `ListTasksAllAsync`, `ListTagsAllAsync`, `ListMembersAllAsync`, `ListChatMessagesAllAsync`, `ListReactionsAllAsync`, `SearchChatsAllAsync`, `SearchMessagesAllAsync`, `SearchUsersAllAsync` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Загрузка файлов

Загрузка файла — трёхшаговый процесс:

```csharp
// 1. Получить параметры загрузки
var uploadParams = await client.Common.GetUploadParamsAsync();

// 2. Загрузить файл на S3
using var fileStream = File.OpenRead("photo.png");
await client.Common.UploadFileAsync(uploadParams, fileStream, "photo.png");

// 3. Прикрепить к сообщению (используя key из uploadParams)
```

## Обработка ошибок

```csharp
using Pachca.Sdk;

try
{
    await client.Messages.GetMessageAsync(999999);
}
catch (OAuthError e)
{
    Console.WriteLine($"Ошибка авторизации: {e.ErrorDescription}");
}
catch (ApiError e)
{
    Console.WriteLine($"Ошибка API: {string.Join(", ", e.Errors.Select(err => err.Message))}");
}
```

## Отмена запросов

Все асинхронные методы поддерживают `CancellationToken`:

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
var users = await client.Users.ListUsersAsync(cancellationToken: cts.Token);
```
