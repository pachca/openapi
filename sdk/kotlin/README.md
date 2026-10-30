# Pachca Kotlin SDK

Kotlin клиент для [Pachca API](https://dev.pachca.com).

## Требования

- Kotlin 2.2+
- Java 11+

## Установка

Пакет публикуется через [JitPack](https://jitpack.io/#pachca/openapi):

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        mavenCentral()
        maven("https://jitpack.io")
    }
}

// build.gradle.kts
dependencies {
    implementation("com.github.pachca:openapi:1.8.0")
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
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.

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
while (true) {
    val response = pachca.chats.listChats(cursor = cursor)
    if (response.data.isEmpty()) break
    chats.addAll(response.data)
    cursor = response.meta.paginate.nextPage
}

// Автоматически
val allChats = pachca.chats.listChatsAll()
```

Доступные методы: `listChatsAll`, `listUsersAll`, `listTasksAll`, `listTagsAll`, `listMembersAll`, `listChatMessagesAll`, `listReactionsAll`, `searchChatsAll`, `searchMessagesAll`, `searchUsersAll` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток). Ошибки сервера `5xx` повторяются только у запросов GET, PUT и DELETE: запрос POST сервер мог успеть выполнить, и повтор создал бы дубль. Ответ `504` с кодом `timeout` (поиск не уложился по времени) не повторяется: тот же запрос, скорее всего, снова не уложится, и его стоит сузить.

## Свой HTTP-клиент

Для настройки прокси, сериализации и других параметров HTTP используйте конструктор с готовым Ktor `HttpClient`:

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.PACHCA_API_URL
import io.ktor.client.*
import io.ktor.client.engine.cio.*

val http = HttpClient(CIO) {
    engine {
        proxy = ProxyBuilder.http(Url("http://proxy:8080"))
    }
    defaultRequest {
        headers.append("Authorization", "Bearer $token")
    }
}

val client = PachcaClient(client = http, baseUrl = PACHCA_API_URL)
```

Полный пример: [`examples/httpclient.kt`](examples/httpclient.kt)

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

## Тестирование

Для unit-тестов используйте `PachcaClient.stub()` — создаёт клиент без HTTP-подключения.

Методы без переопределения выбрасывают `NotImplementedError("Service.method is not implemented")`:

```kotlin
import com.pachca.sdk.*
import io.mockk.coEvery
import io.mockk.mockk

// Мок-сервис
val mockMessages = mockk<MessagesService>()
coEvery { mockMessages.getMessage(any()) } returns Message(
    id = 1,
    content = "Test message",
    entityId = 123
)

// Тест
val client = PachcaClient.stub(messages = mockMessages)

val message = client.messages.getMessage(1)
assertEquals("Test message", message.content)
```

Полный пример: [`examples/stub.kt`](examples/stub.kt)
