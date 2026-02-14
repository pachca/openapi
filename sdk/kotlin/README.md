# Pachca Kotlin SDK

Kotlin клиент для Pachca API на базе Ktor.

## Установка

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.pachca:sdk:1.0.0")
}
```

## Использование

```kotlin
val client = PachcaApi(
    baseUrl = "https://api.pachca.com/api/v1",
    token = "YOUR_TOKEN"
)

val users = client.getUsers()
```

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
