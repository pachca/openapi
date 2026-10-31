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

- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.
- **Значение null**: необязательное поле, которое не задано, в запрос не попадает. Чтобы отправить `null` там, где API его принимает (например, `null` в `webhook.kind` удаляет входящий вебхук бота), назовите поле в `nullFields` модели запроса так, как оно называется в Kotlin: `BotUpdateRequestWebhook(nullFields = setOf("kind"))`.

```kotlin
// Тело из одного поля → аргумент
pachca.members.updateMemberRole(chatId, userId, ChatMemberRole.ADMIN)
pachca.messages.pinMessage(messageId)

// Тело из нескольких полей → объект-запрос
pachca.reactions.addReaction(messageId, ReactionRequest(code = "👍"))

// Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
val message = pachca.messages.getMessage(messageId)  // Message, не MessageResponse
```

Полное описание параметров: [документация API](https://dev.pachca.com)

## Пагинация

Для методов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

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

Метод `*All` есть у каждого метода с пагинацией, полный список — на странице [Kotlin SDK](https://dev.pachca.com/guides/sdk/kotlin#avtopaginatsiya).

## Повторные запросы

SDK повторяет запросы сам. Паузы между попытками описаны на странице [Kotlin SDK](https://dev.pachca.com/guides/sdk/kotlin#povtornye-zaprosy), общие правила повторов — в разделе [Повторные запросы](https://dev.pachca.com/api/limits#povtornye-zaprosy-retry).

## Свой HTTP-клиент

Для настройки прокси, сериализации и других параметров HTTP используйте конструктор с готовым Ktor `HttpClient`. Заголовок `Authorization` и разбор JSON такой клиент настраивает сам. Повторов у него нет: SDK включает их только в клиенте, который создаёт по токену.

```kotlin
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.PACHCA_API_URL
import io.ktor.client.*
import io.ktor.client.engine.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.http.Url
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

val http = HttpClient(CIO) {
    engine {
        proxy = ProxyBuilder.http(Url("http://proxy:8080"))
    }
    defaultRequest {
        headers.append("Authorization", "Bearer $token")
    }
    install(ContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
}

val client = PachcaClient(client = http, baseUrl = PACHCA_API_URL)
```

Полный пример: [`examples/httpclient.kt`](examples/httpclient.kt)

## Загрузка файлов

Загрузка файла идёт в три шага: параметры загрузки, отправка файла по адресу `directUrl` и сообщение с ключом файла. Подробнее — в разделе [Загрузка файлов](https://dev.pachca.com/api/file-uploads).

```kotlin
val file = java.io.File("report.pdf")
val bytes = file.readBytes()

// 1. Получить параметры загрузки и подставить имя файла в ключ
val params = pachca.files.getUploadParams()
val key = params.key.replace("\${filename}", file.name)

// 2. Загрузить файл по адресу directUrl
pachca.files.uploadFile(
    params.directUrl,
    FileUploadRequest(
        contentDisposition = params.contentDisposition,
        acl = params.acl,
        policy = params.policy,
        xAmzCredential = params.xAmzCredential,
        xAmzAlgorithm = params.xAmzAlgorithm,
        xAmzDate = params.xAmzDate,
        xAmzSignature = params.xAmzSignature,
        key = key,
        bucket = params.bucket,
        file = bytes,
    ),
)

// 3. Отправить сообщение с файлом
pachca.messages.createMessage(
    MessageCreateRequest(
        message = MessageCreateRequestMessage(
            entityId = chatId,
            content = "Отчёт за неделю",
            files = listOf(MessageCreateRequestFile(key = key, name = file.name, fileType = FileType.FILE, size = bytes.size.toLong())),
        )
    )
)
```

Полный пример: [`examples/upload.kt`](examples/upload.kt)

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
import java.time.OffsetDateTime

// Мок-сервис: переопределите только нужные методы
class FakeMessages : MessagesService {
    override suspend fun getMessage(id: Int): Message = Message(
        id = id,
        entityType = MessageEntityType.DISCUSSION,
        entityId = 123,
        chatId = 123,
        rootChatId = 123,
        content = "Test message",
        userId = 1,
        createdAt = OffsetDateTime.now(),
        url = "",
        files = emptyList(),
        important = false,
    )
}

// Тест
val client = PachcaClient.stub(messages = FakeMessages())

val message = client.messages.getMessage(1)
assertEquals("Test message", message.content)
```

Полный пример: [`examples/stub.kt`](examples/stub.kt)
