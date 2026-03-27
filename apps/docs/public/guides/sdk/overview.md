
# SDK и генератор

Два способа работать с Pachca API типизированно:

- **Готовые SDK** — установите пакет и пишите код с автодополнением
- **Генератор** — сгенерируйте клиент прямо в своём проекте

Оба варианта автоматически генерируются из одной [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml): типизированные методы, retry, пагинация, обработка ошибок.

## Готовые SDK


Автоматически обновляются при каждом обновлении спецификации. [Исходный код на GitHub](https://github.com/pachca/openapi/tree/main/sdk).

## Генератор

[@pachca/generator](https://www.npmjs.com/package/@pachca/generator) npm


Генерирует типы и клиент из OpenAPI-спецификации прямо в вашем проекте. Сгенерированный код можно закоммитить в репозиторий и добавить генерацию в CI как проверку совместимости с актуальным API. [Исходный код на GitHub](https://github.com/pachca/openapi/tree/main/packages/generator).

```bash
# Генерация из Pachca API (спецификация загружается автоматически)
npx @pachca/generator --output ./generated --lang typescript

# Несколько языков
npx @pachca/generator --output ./generated --lang typescript,python,go,kotlin,swift,csharp

# Из локального файла или произвольного URL
npx @pachca/generator --spec openapi.yaml --output ./generated --lang typescript
npx @pachca/generator --spec https://example.com/openapi.yaml --output ./generated --lang go
```

| Параметр | Описание |
|----------|----------|
| `--spec <path\|url>` | Путь или URL к OpenAPI 3.0 YAML (по умолчанию: `https://dev.pachca.com/openapi.yaml`) |
| `--output <dir>` | Директория для сгенерированного кода |
| `--lang <langs>` | Языки через запятую: `typescript`, `python`, `go`, `kotlin`, `swift`, `csharp` |
| `--examples` | Генерировать `examples.json` с примерами вызовов |

## Возможности

| Возможность | Описание |
|-------------|----------|
| **16 сервисов** | Типизированные методы для каждого API-эндпоинта |
| **Автопагинация** | Методы `*All()` для автоматического обхода всех страниц |
| **Повторные запросы** | Автоматический retry при `429` с экспоненциальным backoff |
| **Обработка ошибок** | Типизированные `ApiError` и `OAuthError` |
| **Сериализация** | Автоматическая конвертация между форматами (snake_case ↔ camelCase) |
| **Авторизация** | Bearer-токен передаётся один раз при создании клиента |

## Пример

**Получение профиля**

```bash
curl "https://api.pachca.com/api/shared/v1/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


## Сравнение языков

| | TypeScript | Python | Go | Kotlin | Swift | C# |
|---|---|---|---|---|---|---|
| **Пакет** | `@pachca/sdk` | `pachca-sdk` | `go get ...` | `com.pachca:pachca-sdk` | `PachcaSDK` | `Pachca.Sdk` |
| **Менеджер** | npm | PyPI | Go modules | JitPack (Gradle) | SPM | NuGet |
| **Async** | `await` | `await` (asyncio) | синхронный | `suspend` (coroutines) | `try await` | `await` |
| **HTTP** | fetch | httpx | net/http | Ktor | URLSession | HttpClient |
| **Naming** | camelCase | snake_case | PascalCase | camelCase | camelCase | PascalCase |
| **Cleanup** | — | `await client.close()` | — | `client.close()` | — | `client.Dispose()` |
| **Требования** | Node.js 18+ | Python 3.10+ | Go 1.24+ | Kotlin 2.2+, Java 11+ | Swift 5.9+, macOS 13+, iOS 16+ | .NET 8+ |

