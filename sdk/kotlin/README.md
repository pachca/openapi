# Pachca Kotlin SDK

Kotlin клиент для [Pachca API](https://dev.pachca.com).

## Требования

- Kotlin 2.2+
- Java 11+

## Установка

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.pachca:pachca-sdk:1.0.1")
}
```

## Использование

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.*

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

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```kotlin
// Вручную
val chats = mutableListOf<Chat>()
var cursor: String? = null
do {
    val response = pachca.chats.listChats(cursor = cursor)
    chats.addAll(response.data)
    cursor = response.meta?.paginate?.nextPage
} while (cursor != null)

// Автоматически
val allChats = pachca.chats.listChatsAll()
```

Доступные методы: `listChatsAll`, `listUsersAll`, `listTasksAll`, `listTagsAll`, `listMembersAll`, `listChatMessagesAll`, `listReactionsAll`, `searchChatsAll`, `searchMessagesAll`, `searchUsersAll` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Загрузка файлов

Загрузка файла — трёхшаговый процесс:

```kotlin
// 1. Получить параметры загрузки
val params = pachca.uploads.getUploadParams()

// 2. Загрузить файл на S3
val file = File("photo.png")
pachca.uploads.uploadFile(params, file)

// 3. Прикрепить к сообщению (используя key из params)
```

## Обработка ошибок

```kotlin
try {
    val message = pachca.messages.getMessage(999999)
} catch (e: OAuthError) {
    println("Ошибка авторизации: ${e.message}")
} catch (e: ApiError) {
    println("Ошибка API: ${e.errors}")
}
```
