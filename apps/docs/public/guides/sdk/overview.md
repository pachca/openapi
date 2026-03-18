
# SDK

Типизированные клиентские библиотеки для Pachca API — автоматически сгенерированы из [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml). Автодополнение, актуальные модели данных, встроенный retry и обработка ошибок. [Исходный код на GitHub](https://github.com/pachca/openapi/tree/main/sdk).


## Пример

**Получение профиля**

```bash
curl "https://api.pachca.com/api/shared/v1/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


## Возможности

| Возможность | Описание |
|-------------|----------|
| **16 сервисов** | Типизированные методы для каждого API-эндпоинта |
| **Автопагинация** | Методы `*All()` для автоматического обхода всех страниц |
| **Повторные запросы** | Автоматический retry при `429` с экспоненциальным backoff |
| **Обработка ошибок** | Типизированные `ApiError` и `OAuthError` |
| **Сериализация** | Автоматическая конвертация между форматами (snake_case ↔ camelCase) |
| **Авторизация** | Bearer-токен передаётся один раз при создании клиента |

## Сравнение

| | TypeScript | Python | Go | Kotlin | Swift |
|---|---|---|---|---|---|
| **Пакет** | `@pachca/sdk` | `pachca-sdk` | `go get ...` | `com.pachca:pachca-sdk` | `PachcaSDK` |
| **Менеджер** | npm | PyPI | Go modules | JitPack (Gradle) | SPM |
| **Async** | `await` | `await` (asyncio) | синхронный | `suspend` (coroutines) | `try await` |
| **HTTP** | fetch | httpx | net/http | Ktor | URLSession |
| **Naming** | camelCase | snake_case | PascalCase | camelCase | camelCase |
| **Cleanup** | — | `await client.close()` | — | `client.close()` | — |
| **Требования** | Node.js 18+ | Python 3.10+ | Go 1.24+ | Kotlin 2.2+, Java 11+ | Swift 5.9+, macOS 13+, iOS 16+ |

