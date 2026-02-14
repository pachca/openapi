# Pachca Swift SDK

Swift клиент для Pachca API.

## Требования

- macOS 13+ / iOS 16+
- Swift 5.9+

## Установка

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pachca/swift-sdk", from: "1.0.0")
]
```

## Использование

```swift
import PachcaSDK

let client = Client(
    serverURL: URL(string: "https://api.pachca.com/api/v1")!,
    transport: URLSessionTransport()
)

let users = try await client.getUsers()
```

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
