# Pachca Kotlin SDK

Kotlin клиент для [Pachca API](https://dev.pachca.com).

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

val pachca = PachcaClient("YOUR_TOKEN")

// Список чатов
val chats = pachca.chats.listChats()

// Создание сообщения
val message = pachca.messages.createMessage(MessageCreateRequest(
    message = MessageCreateRequestMessage(
        entityId = chatId,
        content = "Hello from Kotlin SDK!"
    )
))

// Реакция
pachca.reactions.addReaction(messageId, ReactionRequest(code = "\uD83D\uDC4D"))

// Список пользователей
val users = pachca.users.listUsers()
```

## Конвенции

- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.

```kotlin
// ≤2 поля → развёрнуто в аргументы
pachca.reactions.addReaction(messageId, ReactionRequest(code = "👍"))
pachca.messages.pinMessage(messageId)

// >2 полей → объект-запрос
pachca.messages.createMessage(MessageCreateRequest(...))

// Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
val message = pachca.messages.createMessage(...)  // Message, не MessageResponse
```

Полное описание параметров: [документация API](https://dev.pachca.com)

## Разработка

Генерация SDK:

```bash
cd sdk/kotlin && bun run generate
```
