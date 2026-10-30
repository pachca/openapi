# Pachca Swift SDK

Swift клиент для [Pachca API](https://dev.pachca.com).

## Требования

- macOS 13+ / iOS 16+
- Swift 5.9+

## Установка

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.8.0")
],
targets: [
    .target(name: "MyApp", dependencies: [
        .product(name: "PachcaSDK", package: "openapi")
    ])
]
```

## Использование

```swift
import PachcaSDK

let pachca = PachcaClient(token: "YOUR_TOKEN")

// Список чатов
let chats = try await pachca.chats.listChats()

// Создание сообщения
let message = try await pachca.messages.createMessage(request: MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityId: chatId,
        content: "Hello from Swift SDK!"
    )
))

// Реакция
let reaction = try await pachca.reactions.addReaction(id: messageId, request: ReactionRequest(code: "👍"))

// Список пользователей
let users = try await pachca.users.listUsers()
```

## Конвенции

- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.

```swift
// Тело из одного поля → аргумент
try await pachca.members.updateMemberRole(id: chatId, userId: userId, role: .admin)
try await pachca.messages.pinMessage(id: messageId)

// Тело из нескольких полей → объект-запрос
_ = try await pachca.reactions.addReaction(id: messageId, request: ReactionRequest(code: "👍"))

// Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
let message = try await pachca.messages.getMessage(id: messageId)  // Message, не MessageResponse
```

Полное описание параметров: [документация API](https://dev.pachca.com)

## Пагинация

Для методов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```swift
// Вручную
var chats: [Chat] = []
var cursor: String? = nil
repeat {
    let response = try await pachca.chats.listChats(cursor: cursor)
    if response.data.isEmpty { break }
    chats.append(contentsOf: response.data)
    cursor = response.meta.paginate.nextPage
} while true

// Автоматически
let allChats = try await pachca.chats.listChatsAll()
```

Метод `*All` есть у каждого метода с пагинацией, полный список — на странице [Swift SDK](https://dev.pachca.com/guides/sdk/swift#avtopaginatsiya).

## Повторные запросы

SDK повторяет запросы сам. Паузы между попытками описаны на странице [Swift SDK](https://dev.pachca.com/guides/sdk/swift#povtornye-zaprosy), общие правила повторов — в разделе [Повторные запросы](https://dev.pachca.com/api/limits#povtornye-zaprosy-retry).

## Свой HTTP-клиент

Для настройки прокси, сертификатов и других параметров HTTP используйте конструктор с заголовками и `URLSession`:

```swift
let config = URLSessionConfiguration.default
config.connectionProxyDictionary = [
    kCFNetworkProxiesHTTPEnable: true,
    kCFNetworkProxiesHTTPProxy: "proxy.example.com",
    kCFNetworkProxiesHTTPPort: 8080,
]
let session = URLSession(configuration: config)

let headers = ["Authorization": "Bearer \(token)"]
let client = PachcaClient(headers: headers, session: session)
```

Полный пример: [`examples/Sources/HttpClient/main.swift`](examples/Sources/HttpClient/main.swift)

## Загрузка файлов

Загрузка файла идёт в три шага: параметры загрузки, отправка файла по адресу `directUrl` и сообщение с ключом файла. Подробнее — в разделе [Загрузка файлов](https://dev.pachca.com/api/file-uploads).

```swift
let fileURL = URL(fileURLWithPath: "report.pdf")
let filename = fileURL.lastPathComponent
let fileData = try Data(contentsOf: fileURL)

// 1. Получить параметры загрузки и подставить имя файла в ключ
let params = try await pachca.files.getUploadParams()
let key = params.key.replacingOccurrences(of: "${filename}", with: filename)

// 2. Загрузить файл по адресу directUrl
let uploadRequest = FileUploadRequest(
    ContentDisposition: params.ContentDisposition,
    acl: params.acl,
    policy: params.policy,
    xAmzCredential: params.xAmzCredential,
    xAmzAlgorithm: params.xAmzAlgorithm,
    xAmzDate: params.xAmzDate,
    xAmzSignature: params.xAmzSignature,
    key: key,
    bucket: params.bucket,
    file: fileData
)
try await pachca.files.uploadFile(directUrl: params.directUrl, request: uploadRequest)

// 3. Отправить сообщение с файлом
_ = try await pachca.messages.createMessage(request: MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityId: chatId,
        content: "Отчёт за неделю",
        files: [MessageCreateRequestFile(key: key, name: filename, fileType: .file, size: Int64(fileData.count))]
    )
))
```

Полный пример: [`examples/Sources/Upload/main.swift`](examples/Sources/Upload/main.swift)

## Обработка ошибок

```swift
do {
    let message = try await pachca.messages.getMessage(id: 999999)
    print(message.content)
} catch let error as ApiError {
    print("Ошибка API: \(error.errors.map(\.message))")
} catch let error as OAuthError {
    print("Ошибка авторизации: \(error.error.rawValue)")
}
```

## Тестирование

Для unit-тестов используйте `PachcaClient.stub()` — создаёт клиент без HTTP-подключения.

Методы без переопределения выбрасывают `NSError` с описанием `"Service.method is not implemented"`:

```swift
import XCTest
import PachcaSDK

// Мок-сервис: переопределите только нужные методы
class MockMessagesService: MessagesService {
    override func getMessage(id: Int) async throws -> Message {
        return Message(
            id: id,
            entityType: .discussion,
            entityId: 123,
            chatId: 123,
            rootChatId: 123,
            content: "Test message",
            userId: 1,
            createdAt: "",
            url: "",
            files: [],
            buttons: nil,
            thread: nil,
            forwarding: nil,
            parentMessageId: nil,
            displayAvatarUrl: nil,
            important: false
        )
    }
}

// Тест
final class MessagesTests: XCTestCase {
    func testGetMessage() async throws {
        let client = PachcaClient.stub(messages: MockMessagesService())

        let message = try await client.messages.getMessage(id: 1)
        XCTAssertEqual(message.content, "Test message")
    }
}
```

Полный пример: [`examples/Sources/Stub/main.swift`](examples/Sources/Stub/main.swift)
