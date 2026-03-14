
# SDK

SDK для API Пачки автоматически генерируются из [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml). Они предоставляют типизированные клиенты с автокомплитом и актуальными моделями данных. Исходный код всех SDK доступен в [репозитории на GitHub](https://github.com/pachca/openapi/tree/main/sdk).

## TypeScript

<PackageBadge name="@pachca/sdk" href="https://www.npmjs.com/package/@pachca/sdk" />

Установите пакет из npm:

```bash
npm install @pachca/sdk
```

```typescript
import { PachcaClient } from "@pachca/sdk";

const pachca = new PachcaClient("ваш_токен");

// Отправка сообщения
const message = await pachca.messages.createMessage({
  message: { entityId: 12345, content: "Привет из TypeScript SDK!" },
});

// Список всех пользователей (автопагинация)
const allUsers = await pachca.users.listUsersAll();
```

## Python

<PackageBadge name="pachca" href="https://pypi.org/project/pachca/" />

Установите пакет из PyPI:

```bash
pip install pachca
```

```python
from pachca.client import PachcaClient
from pachca.models import MessageCreateRequest, MessageCreateRequestMessage

client = PachcaClient("ваш_токен")

# Отправка сообщения
msg = await client.messages.create_message(
    MessageCreateRequest(
        message=MessageCreateRequestMessage(entity_id=12345, content="Привет из Python SDK!")
    )
)

# Список всех пользователей (автопагинация)
all_users = await client.users.list_users_all()
```

## Go

<PackageBadge name="github.com/pachca/openapi/sdk/go" href="https://pkg.go.dev/github.com/pachca/openapi/sdk/go/generated" />

Добавьте модуль в проект:

```bash
go get github.com/pachca/openapi/sdk/go/generated
```

```go
package main

import (
    "context"
    "fmt"
    "log"

    pachca "github.com/pachca/openapi/sdk/go/generated"
)

func main() {
    client := pachca.NewPachcaClient("ваш_токен")

    // Отправка сообщения
    msg, err := client.Messages.CreateMessage(context.Background(), pachca.MessageCreateRequest{
        Message: pachca.MessageCreateRequestMessage{
            EntityID: 12345,
            Content:  "Привет из Go SDK!",
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Сообщение: %d\n", msg.ID)
}
```

## Kotlin

<PackageBadge name="com.pachca:pachca-sdk" href="https://github.com/pachca/openapi/tree/main/sdk/kotlin" />

Требуется Kotlin 2.2+ и Java 11+. Добавьте зависимость в Gradle:

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.pachca:pachca-sdk:1.0.0")
}
```

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.*

val pachca = PachcaClient("ваш_токен")

// Отправка сообщения
val message = pachca.messages.createMessage(MessageCreateRequest(
    message = MessageCreateRequestMessage(
        entityId = 12345,
        content = "Привет из Kotlin SDK!"
    )
))

// Список всех пользователей (автопагинация)
val allUsers = pachca.users.listUsersAll()
```

## Swift

<PackageBadge name="PachcaSDK" href="https://github.com/pachca/openapi/tree/main/sdk/swift" />

Требуется Swift 5.9+, macOS 13+ или iOS 16+. Добавьте пакет в `Package.swift`:

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.0.0")
]
```

```swift
import PachcaSDK

let pachca = PachcaClient(token: "ваш_токен")

// Отправка сообщения
let message = try await pachca.messages.createMessage(request: MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityId: 12345,
        content: "Привет из Swift SDK!"
    )
))

// Список всех пользователей (автопагинация)
let allUsers = try await pachca.users.listUsersAll()
```
