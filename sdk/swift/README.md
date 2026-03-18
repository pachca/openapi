# Pachca Swift SDK

Swift клиент для [Pachca API](https://dev.pachca.com).

## Требования

- macOS 13+ / iOS 16+
- Swift 5.9+

## Установка

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.0.1")
]
```

## Использование

```swift
import PachcaSDK

let pachca = PachcaClient(token: "YOUR_TOKEN")

// Список чатов
let chats = try await pachca.chats.listChats()

// Создание сообщения
let message = try await pachca.messages.createMessage(MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityId: chatId,
        content: "Hello from Swift SDK!"
    )
))

// Реакция
try await pachca.reactions.addReaction(messageId, ReactionRequest(code: "👍"))

// Список пользователей
let users = try await pachca.users.listUsers()
```

## Конвенции

- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.

```swift
// ≤2 поля → развёрнуто в аргументы
try await pachca.reactions.addReaction(messageId, ReactionRequest(code: "👍"))
try await pachca.messages.pinMessage(messageId)

// >2 полей → объект-запрос
try await pachca.messages.createMessage(MessageCreateRequest(...))

// Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
let message = try await pachca.messages.createMessage(...)  // Message, не MessageResponse
```

Полное описание параметров: [документация API](https://dev.pachca.com)

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```swift
// Вручную
var chats: [Chat] = []
var cursor: String? = nil
repeat {
    let response = try await pachca.chats.listChats(cursor: cursor)
    chats.append(contentsOf: response.data)
    cursor = response.meta?.paginate?.nextPage
} while cursor != nil

// Автоматически
let allChats = try await pachca.chats.listChatsAll()
```

Доступные методы: `listChatsAll`, `listUsersAll`, `listTasksAll`, `listTagsAll`, `listMembersAll`, `listChatMessagesAll`, `listReactionsAll`, `searchChatsAll`, `searchMessagesAll`, `searchUsersAll` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Загрузка файлов

Загрузка файла — трёхшаговый процесс:

```swift
// 1. Получить параметры загрузки
let params = try await pachca.uploads.getUploadParams()

// 2. Загрузить файл на S3
let fileData = try Data(contentsOf: fileURL)
try await pachca.uploads.uploadFile(params, data: fileData, filename: "photo.png")

// 3. Прикрепить к сообщению (используя key из params)
```

## Обработка ошибок

```swift
do {
    let message = try await pachca.messages.getMessage(999999)
} catch let error as APIError {
    print("Ошибка API: \(error.message)")
} catch let error as OAuthError {
    print("Ошибка авторизации: \(error.message)")
}
```
