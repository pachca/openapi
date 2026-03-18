
# SDK

SDK для API Пачки автоматически генерируются из [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml). Они предоставляют типизированные клиенты с автодополнением, актуальными моделями данных и встроенной обработкой ошибок. Исходный код всех SDK доступен в [репозитории на GitHub](https://github.com/pachca/openapi/tree/main/sdk).

## Возможности

Все SDK реализуют единый набор возможностей:

| Возможность | Описание |
|-------------|----------|
| **16 сервисов** | Типизированные методы для каждого API-эндпоинта |
| **Автопагинация** | Методы `*All()` для автоматического обхода всех страниц |
| **Повторные запросы** | Автоматический retry при `429` с экспоненциальным backoff |
| **Обработка ошибок** | Типизированные `ApiError` и `OAuthError` |
| **Сериализация** | Автоматическая конвертация между форматами (snake_case ↔ camelCase) |
| **Авторизация** | Bearer-токен передаётся один раз при создании клиента |

## Языки

<Card title="TypeScript" icon="FileText" href="/guides/sdk/typescript">npm · async/await · fetch</Card>
  <Card title="Python" icon="FileText" href="/guides/sdk/python">PyPI · async/await · httpx</Card>
  <Card title="Go" icon="FileText" href="/guides/sdk/go">go get · sync · net/http</Card>
  <Card title="Kotlin" icon="FileText" href="/guides/sdk/kotlin">JitPack · coroutines · Ktor</Card>
  <Card title="Swift" icon="FileText" href="/guides/sdk/swift">SPM · async throws · URLSession</Card>


## Сравнение

| | TypeScript | Python | Go | Kotlin | Swift |
|---|---|---|---|---|---|
| **Пакет** | `@pachca/sdk` | `pachca-sdk` | `go get ...` | `com.pachca:pachca-sdk` | `PachcaSDK` |
| **Менеджер** | npm | PyPI | Go modules | JitPack (Gradle) | SPM |
| **Async** | `await` | `await` (asyncio) | синхронный | `suspend` (coroutines) | `try await` |
| **HTTP** | fetch | httpx | net/http | Ktor | URLSession |
| **Naming** | camelCase | snake_case | PascalCase | camelCase | camelCase |
| **Cleanup** | — | `await client.close()` | — | `client.close()` | — |
| **Требования** | Node.js 18+ | Python 3.10+ | Go 1.21+ | Kotlin 2.2+, Java 11+ | Swift 5.9+, macOS 13+ |

## Быстрый старт

Установите SDK для вашего языка и создайте клиент:

*Endpoint not found*


*Endpoint not found*


Подробные инструкции и примеры — на странице нужного языка.
