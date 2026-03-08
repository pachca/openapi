# Pachca Swift SDK

Swift клиент для [Pachca API](https://dev.pachca.com).

## Требования

- macOS 13+ / iOS 16+
- Swift 5.9+

## Установка

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.0.0")
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

## Разработка

Генерация SDK:

```bash
cd sdk/swift && bun run generate
```
