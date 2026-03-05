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

let pachca = try PachcaClient(token)

// Список чатов
let chats = try await pachca.chats.listChats(.init())

// Создание сообщения
let message = try await pachca.messages.createMessage(.init(
    body: .json(.init(message: .init(
        entity_type: .init(value1: .discussion),
        entity_id: chatId,
        content: "Hello from Swift SDK!"
    )))
))

// Реакция
try await pachca.reactions.addReaction(.init(
    path: .init(id: messageId),
    body: .json(.init(code: "👍"))
))

// Список пользователей
let users = try await pachca.users.listUsers(.init())
```

Полное описание параметров: [документация API](https://dev.pachca.com)

## Разработка

Генерация SDK:

```bash
cd sdk/swift && bun run generate
```

Это запускает Apple swift-openapi-generator для `Client.swift` + `Types.swift`, затем `generate-client.ts` для фасада `PachcaClient`.
