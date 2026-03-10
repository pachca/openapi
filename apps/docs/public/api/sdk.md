
# SDK

SDK для API Пачки автоматически генерируются из [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml). Они предоставляют типизированные клиенты с автокомплитом и актуальными моделями данных.

## Доступные SDK

- [TypeScript](https://github.com/pachca/openapi/tree/main/sdk/typescript) — npm install @pachca/sdk
- [Python](https://github.com/pachca/openapi/tree/main/sdk/python) — pip install pachca
- [Go](https://github.com/pachca/openapi/tree/main/sdk/go) — go get github.com/pachca/openapi/sdk/go
- [Kotlin](https://github.com/pachca/openapi/tree/main/sdk/kotlin) — Maven / Gradle
- [Swift](https://github.com/pachca/openapi/tree/main/sdk/swift) — Swift Package Manager


## Примеры

### TypeScript

**TypeScript**

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


### Python

**Python**

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


### Go

**Go**

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
    fmt.Printf("Сообщение: %d\\n", created.Data.ID)
}
```


### Kotlin

**Kotlin**

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


### Swift

**Swift**

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
