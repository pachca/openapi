# Pachca C# SDK

C# клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
dotnet add package Pachca.Sdk
```

## Использование

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

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

// Реакция
await client.Reactions.AddReactionAsync(message.Id, new ReactionRequest { Code = "👀" });

// Страница сообщений чата и курсор следующей страницы
var page = await client.Messages.ListChatMessagesAsync(chatId: chatId);
Console.WriteLine(page.Meta.Paginate.NextPage);
```

## Конвенции

- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом, query-параметры — именованными аргументами.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.

```csharp
// Тело из одного поля → аргумент
await client.Members.UpdateMemberRoleAsync(chatId, userId, ChatMemberRole.Admin);
await client.Messages.PinMessageAsync(messageId);

// Тело из нескольких полей → объект-запрос
await client.Reactions.AddReactionAsync(messageId, new ReactionRequest { Code = "👍" });

// Ответ: API возвращает { "data": Message }, SDK возвращает Message
var message = await client.Messages.GetMessageAsync(messageId); // Message, не { "data": Message }
```

## Пагинация

Для методов с курсорной пагинацией SDK генерирует `*AllAsync`-методы, которые автоматически обходят все страницы:

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

Метод `*AllAsync` есть у каждого метода с пагинацией, полный список — на странице [C# SDK](https://dev.pachca.com/guides/sdk/csharp#avtopaginatsiya).

## Повторные запросы

SDK повторяет запросы сам. Паузы между попытками описаны на странице [C# SDK](https://dev.pachca.com/guides/sdk/csharp#povtornye-zaprosy), общие правила повторов — в разделе [Повторные запросы](https://dev.pachca.com/api/limits#povtornye-zaprosy-retry).

## Свой HTTP-клиент

Для настройки прокси, сертификатов и других параметров HTTP используйте конструктор с готовым `HttpClient`:

```csharp
var handler = new HttpClientHandler
{
    Proxy = new System.Net.WebProxy("http://proxy:8080"),
    UseProxy = true,
};

var http = new HttpClient(handler);
http.DefaultRequestHeaders.Authorization =
    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

var client = new PachcaClient(PachcaConstants.PachcaApiUrl, http);
```

Полный пример: [`../examples/HttpClientExample.cs`](../examples/HttpClientExample.cs)

## Загрузка файлов

Загрузка файла идёт в три шага: параметры загрузки, отправка файла по адресу `DirectUrl` и сообщение с ключом файла. Подробнее — в разделе [Загрузка файлов](https://dev.pachca.com/api/file-uploads).

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
            new() { Key = key, Name = fileName, FileType = FileType.File, Size = fileBytes.Length },
        },
    }
});
```

Полный пример: [`../examples/UploadExample.cs`](../examples/UploadExample.cs)

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

## Тестирование

Для unit-тестов используйте `PachcaClient.Stub()` — создаёт клиент без HTTP-подключения.

Методы без переопределения выбрасывают `NotImplementedException("Service.method is not implemented")`:

```csharp
using Moq;
using Pachca.Sdk;

// Мок-сервис
var mockMessages = new Mock<MessagesService>();
mockMessages
    .Setup(m => m.GetMessageAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
    .ReturnsAsync(new Message { Id = 1, Content = "Test message", EntityId = 123 });

// Тест
var client = PachcaClient.Stub(messages: mockMessages.Object);

var message = await client.Messages.GetMessageAsync(1);
Assert.Equal("Test message", message.Content);
```

Полный пример: [`../examples/StubExample.cs`](../examples/StubExample.cs)
