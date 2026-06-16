> Расположение: Основы API
> Краткое содержание: Обзор REST API Пачки: базовый URL, авторизация по Bearer-токену, формат запросов и ответов, клиенты и SDK для CLI, TypeScript, Python, Go, Kotlin, Swift и C#
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Обзор

REST API Пачки позволяет автоматизировать работу в мессенджере: отправлять сообщения, управлять чатами и сотрудниками, создавать ботов и реагировать на события через вебхуки.

Базовый URL: `https://api.pachca.com/api/shared/v1`

Клиенты и SDK:

**CLI** — [документация](/guides/cli/overview)

```bash
npm install -g @pachca/cli
```

**TypeScript** — [документация](/guides/sdk/typescript)

```bash
npm install @pachca/sdk
```

**Python** — [документация](/guides/sdk/python)

```bash
pip install pachca-sdk
```

**Go** — [документация](/guides/sdk/go)

```bash
go get github.com/pachca/openapi/sdk/go/generated
```

**Kotlin** — [документация](/guides/sdk/kotlin)

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.pachca:pachca-sdk:latest.release")
}
```

**Swift** — [документация](/guides/sdk/swift)

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pachca/openapi", from: "1.0.0")
]
```

**C#** — [документация](/guides/sdk/csharp)

```bash
dotnet add package Pachca.Sdk
```

Ресурсы:

- [OpenAPI](/openapi.yaml)
- [Postman](/pachca.postman_collection.json)


## Популярные методы

Частые операции для быстрого старта. Все модели API и доступные для них методы можно посмотреть на странице [Модели](/api/models).

- [Новое сообщение](/api/messages/create)

- [Список сообщений чата](/api/messages/list)

- [Поиск сообщений](/api/search/list-messages)

- [Создать чат](/api/chats/create)

- [Создать сотрудника](/api/users/create)

- [Новый статус](/api/profile/update-status)

- [Новое напоминание](/api/tasks/create)

- [Создание бота](/api/bots/create)


## Основы API

Базовые концепции для работы с API: авторизация, формат запросов и ответов, обработка ошибок, лимиты, пагинация и загрузка файлов.

- [Авторизация](/api/authorization) — Bearer-токен и доступ к API
- [Запросы и ответы](/api/requests-responses) — Базовый URL, заголовки, формат данных
- [Пагинация](/api/pagination) — Обход больших списков по курсору
- [Загрузка файлов](/api/file-uploads) — Прямая загрузка в S3 одной командой
- [Ошибки](/api/errors) — HTTP-коды и структуры ответов
- [Лимиты](/api/limits) — Rate limits и повторные запросы

