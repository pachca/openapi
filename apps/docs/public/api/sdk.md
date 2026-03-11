
# SDK

SDK для API Пачки автоматически генерируются из [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml). Они предоставляют типизированные клиенты с автокомплитом и актуальными моделями данных. Исходный код всех SDK доступен в [репозитории на GitHub](https://github.com/pachca/openapi/tree/main/sdk).

## TypeScript

<PackageBadge name="@pachca/sdk" href="https://www.npmjs.com/package/@pachca/sdk" />

Установите пакет из npm:

```bash
npm install @pachca/sdk
```

```typescript
import { Pachca } from "@pachca/sdk";

const pachca = new Pachca({ token: "ваш_токен" });

// Отправка сообщения
const { data } = await pachca.messages.createMessage({
  body: {
    message: { entity_id: 12345, content: "Привет из TypeScript SDK!" },
  },
});

// Список всех пользователей (автопагинация)
for await (const user of pachca.users.listAllUsers()) {
  console.log(user.first_name);
}
```

## Python

<PackageBadge name="pachca" href="https://pypi.org/project/pachca/" />

Установите пакет из PyPI:

```bash
pip install pachca
```

```python
from pachca.pachca_client import Pachca
from pachca.models.message_create_request_message import MessageCreateRequestMessage

client = Pachca("ваш_токен")

# Отправка сообщения
msg = client.messages.create_message(
    MessageCreateRequestMessage(entity_id=12345, content="Привет из Python SDK!")
)

# Список пользователей
users = client.users.list_users()
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
    client, err := pachca.NewPachcaClient(
        "https://api.pachca.com/api/shared/v1",
        "ваш_токен",
    )
    if err != nil {
        log.Fatal(err)
    }

    // Отправка сообщения
    res, err := client.Messages.CreateMessage(context.Background(), &pachca.MessageCreateRequest{
        Message: pachca.MessageCreateRequestMessage{
            EntityID: 12345,
            Content:  "Привет из Go SDK!",
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    created := res.(*pachca.MessageOperationsCreateMessageCreated)
    fmt.Printf("Сообщение: %d\n", created.Data.ID)
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
import com.pachca.PachcaClient
import com.pachca.models.*
import io.ktor.client.plugins.*
import io.ktor.client.request.*

val pachca = PachcaClient(
    httpClientConfig = {
        it.defaultRequest {
            header("Authorization", "Bearer ваш_токен")
        }
    }
)

// Отправка сообщения
val message = pachca.messages.createMessage(MessageCreateRequest(
    message = MessageCreateRequestMessage(
        entityId = 12345,
        content = "Привет из Kotlin SDK!"
    )
)).body()

// Список пользователей
val users = pachca.users.listUsers().body()
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

let pachca = try PachcaClient("ваш_токен")

// Отправка сообщения
let message = try await pachca.messages.createMessage(.init(
    body: .json(.init(message: .init(
        entity_id: 12345,
        content: "Привет из Swift SDK!"
    )))
))

// Список пользователей
let users = try await pachca.users.listUsers(.init())
```
