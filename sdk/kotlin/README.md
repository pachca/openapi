# Pachca Kotlin SDK

Kotlin клиент для [Pachca API](https://dev.pachca.com) на базе Ktor + kotlinx.serialization.

## Требования

- Kotlin 2.2+
- Java 11+

## Установка

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.pachca:pachca-sdk:1.0.0")
}
```

## Использование

```kotlin
import com.pachca.PachcaClient
import com.pachca.models.*
import io.ktor.client.plugins.*
import io.ktor.client.request.*

val pachca = PachcaClient(
    httpClientConfig = {
        it.defaultRequest {
            header("Authorization", "Bearer YOUR_TOKEN")
        }
    }
)

// Список чатов
val chats = pachca.chats.listChats().body()

// Создание сообщения
val message = pachca.messages.createMessage(MessageCreateRequest(
    message = MessageCreateRequestMessage(
        entityId = chatId,
        content = "Hello from Kotlin SDK!"
    )
)).body()

// Реакция
pachca.reactions.addReaction(
    id = messageId,
    reactionRequest = ReactionRequest(code = "\uD83D\uDC4D")
)

// Список пользователей
val users = pachca.users.listUsers().body()
```

Полное описание параметров: [документация API](https://dev.pachca.com)

## Примеры

- [examples/main.kt](examples/main.kt) — echo-бот из 8 шагов, демонстрирующий CRUD, реакции, треды, пины.
- [examples/upload.kt](examples/upload.kt) — загрузка файла и отправка как вложение.

```bash
PACHCA_TOKEN=<token> PACHCA_CHAT_ID=<id> kotlin examples/main.kt
```

## Разработка

Генерация SDK:

```bash
cd sdk/kotlin && bun run generate
```

Это запускает OpenAPI Generator для Kotlin + Ktor, затем `fix-kotlinx-compat.ts` для патчей совместимости и `generate-client.ts` для фасада `PachcaClient`.
