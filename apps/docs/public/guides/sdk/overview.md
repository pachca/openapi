> Расположение: SDK
> Краткое содержание: Типизированные SDK для Pachca API на TypeScript, Python, Go, Kotlin, Swift и C#: автодополнение, retry и пагинация. Или свой клиент через OpenAPI-генератор
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# SDK и генератор

Два способа работать с Pachca API типизированно:

- **Готовые SDK** — установите пакет и пишите код с автодополнением
- **Генератор** — сгенерируйте клиент прямо в своём проекте

Оба варианта автоматически генерируются из одной [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml): типизированные методы, retry, пагинация, обработка ошибок.

## Готовые SDK

- [TypeScript](/guides/sdk/typescript) npm · async/await · fetch
- [Python](/guides/sdk/python) PyPI · async/await · httpx
- [Go](/guides/sdk/go) go get · sync · net/http
- [Kotlin](/guides/sdk/kotlin) JitPack · coroutines · Ktor
- [Swift](/guides/sdk/swift) SPM · async throws · URLSession
- [C#](/guides/sdk/csharp) NuGet · async/await · HttpClient


Автоматически обновляются при каждом обновлении спецификации. [Исходный код на GitHub](https://github.com/pachca/openapi/tree/main/sdk).

## Генератор

- [@pachca/generator](https://www.npmjs.com/package/@pachca/generator) npm


Генерирует типы и клиент из OpenAPI-спецификации прямо в вашем проекте. Сгенерированный код можно закоммитить в репозиторий и добавить генерацию в CI как проверку совместимости с актуальным API. [Исходный код на GitHub](https://github.com/pachca/openapi/tree/main/packages/generator).

```bash
# Генерация из Pachca API (спецификация загружается автоматически)
npx -y @pachca/generator --output ./generated --lang typescript

# Несколько языков
npx -y @pachca/generator --output ./generated --lang typescript,python,go,kotlin,swift,csharp

# Из локального файла или произвольного URL
npx -y @pachca/generator --spec openapi.yaml --output ./generated --lang typescript
npx -y @pachca/generator --spec https://example.com/openapi.yaml --output ./generated --lang go
```

| Параметр | Описание |
|----------|----------|
| `--spec <path\|url>` | Путь или URL к OpenAPI 3.0 YAML (по умолчанию: `https://dev.pachca.com/openapi.yaml`) |
| `--output <dir>` | Директория для сгенерированного кода |
| `--lang <langs>` | Языки через запятую: `typescript`, `python`, `go`, `kotlin`, `swift`, `csharp` |
| `--examples` | Генерировать `examples.json` с примерами вызовов. Если у тела запроса есть именованные примеры, код каждого из них лежит в поле `examples` записи метода по ключу примера. |

## Возможности

| Возможность | Описание |
|-------------|----------|
| **Все методы API** | Типизированный метод на каждый метод API |
| **Автопагинация** | Методы для автоматического обхода всех страниц: `*All()` в TypeScript, Go, Kotlin и Swift, `*_all()` в Python, `*AllAsync()` в C# |
| **Повторные запросы** | SDK повторяет запросы сам. Паузы между попытками описаны на странице каждого языка, общие правила — в разделе [Повторные запросы](/api/limits#povtornye-zaprosy-retry). |
| **Обработка ошибок** | Типизированные `ApiError` и `OAuthError` |
| **Сериализация** | Автоматическая конвертация между форматами (snake_case ↔ camelCase) |
| **Авторизация** | Bearer-токен передаётся один раз при создании клиента |

## Пример

**Получение профиля**

### typescript

```typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

const response = await client.profile.getProfile()
// → User({ id: number, firstName: string | null, lastName: string | null, nickname: string, email: string | null, phoneNumber: string | null, department: string | null, title: string | null, role: UserRole, suspended: boolean, inviteStatus: InviteStatus, inviterId: number | null, listTags: string[], customProperties: CustomProperty({ id: number, name: string, dataType: CustomPropertyDataType, value: string | null })[], userStatus: UserStatus({ emoji: string, title: string, expiresAt: string | null, isAway: boolean, awayMessage: UserStatusAwayMessage({ text: string }) | null }) | null, bot: boolean, sso: boolean, createdAt: string, lastActivityAt: string | null, timeZone: string | null, imageUrl: string | null })
```

### python

```python
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")

response = await client.profile.get_profile()
# → User(id: int, first_name: str | None, last_name: str | None, nickname: str, email: str | None, phone_number: str | None, department: str | None, title: str | None, role: UserRole, suspended: bool, invite_status: InviteStatus, inviter_id: int | None, list_tags: list[str], custom_properties: list[CustomProperty(id: int, name: str, data_type: CustomPropertyDataType, value: str | None)], user_status: UserStatus(emoji: str, title: str, expires_at: datetime | None, is_away: bool, away_message: UserStatusAwayMessage(text: str) | None) | None, bot: bool, sso: bool, created_at: datetime, last_activity_at: datetime | None, time_zone: str | None, image_url: str | None)
```

### go

```go
import (
	"context"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

client := pachca.NewPachcaClient("YOUR_TOKEN")
ctx := context.Background()

response, err := client.Profile.GetProfile(ctx)
// → User{ID: int32, FirstName: *string, LastName: *string, Nickname: string, Email: *string, PhoneNumber: *string, Department: *string, Title: *string, Role: UserRole, Suspended: bool, InviteStatus: InviteStatus, InviterID: *int32, ListTags: []string, CustomProperties: []CustomProperty{ID: int32, Name: string, DataType: CustomPropertyDataType, Value: *string}, UserStatus: *UserStatus{Emoji: string, Title: string, ExpiresAt: *string, IsAway: bool, AwayMessage: *UserStatusAwayMessage{Text: string}}, Bot: bool, Sso: bool, CreatedAt: time.Time, LastActivityAt: *string, TimeZone: *string, ImageURL: *string}
```

### kotlin

```kotlin
import com.pachca.sdk.PachcaClient

val client = PachcaClient("YOUR_TOKEN")

val response = client.profile.getProfile()
// → User(id: Int, firstName: String?, lastName: String?, nickname: String, email: String?, phoneNumber: String?, department: String?, title: String?, role: UserRole, suspended: Boolean, inviteStatus: InviteStatus, inviterId: Int?, listTags: List<String>, customProperties: List<CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String?)>, userStatus: UserStatus(emoji: String, title: String, expiresAt: OffsetDateTime?, isAway: Boolean, awayMessage: UserStatusAwayMessage(text: String)?)?, bot: Boolean, sso: Boolean, createdAt: OffsetDateTime, lastActivityAt: OffsetDateTime?, timeZone: String?, imageUrl: String?)
```

### swift

```swift
import PachcaSDK

let client = PachcaClient(token: "YOUR_TOKEN")

let response = try await client.profile.getProfile()
// → User(id: Int, firstName: String?, lastName: String?, nickname: String, email: String?, phoneNumber: String?, department: String?, title: String?, role: UserRole, suspended: Bool, inviteStatus: InviteStatus, inviterId: Int?, listTags: [String], customProperties: [CustomProperty(id: Int, name: String, dataType: CustomPropertyDataType, value: String?)], userStatus: UserStatus(emoji: String, title: String, expiresAt: String?, isAway: Bool, awayMessage: UserStatusAwayMessage(text: String)?)?, bot: Bool, sso: Bool, createdAt: String, lastActivityAt: String?, timeZone: String?, imageUrl: String?)
```

### csharp

```csharp
using Pachca.Sdk;

using var client = new PachcaClient("YOUR_TOKEN");

var response = await client.Profile.GetProfileAsync();
// → User(Id: int, FirstName: string?, LastName: string?, Nickname: string, Email: string?, PhoneNumber: string?, Department: string?, Title: string?, Role: UserRole, Suspended: bool, InviteStatus: InviteStatus, InviterId: int?, ListTags: List<string>, CustomProperties: List<CustomProperty(Id: int, Name: string, DataType: CustomPropertyDataType, Value: string?)>, UserStatus: UserStatus(Emoji: string, Title: string, ExpiresAt: DateTimeOffset?, IsAway: bool, AwayMessage: UserStatusAwayMessage(Text: string)?)?, Bot: bool, Sso: bool, CreatedAt: DateTimeOffset, LastActivityAt: DateTimeOffset?, TimeZone: string?, ImageUrl: string?)
```


## Токен сотрудника

Бот, который действует от имени сотрудника, получает его токен по OAuth: схема по шагам — в разделе [Получение токена](/guides/oauth/flow). Обмен кода на токен и отзыв токена — методы `exchangeToken` и `revokeToken` сервиса `oauth`, а ссылку для кнопки и пару PKCE собирают функции SDK:

| Язык | Ссылка авторизации | Пара PKCE |
|---|---|---|
| TypeScript | `buildAuthorizeUrl()` | `await createPkce()` |
| Python | `build_authorize_url()` | `create_pkce()` |
| Go | `pachca.BuildAuthorizeURL()` | `pachca.CreatePKCE()` |
| Kotlin | `PachcaOAuth.buildAuthorizeUrl()` | `PachcaOAuth.createPkce()` |
| Swift | `PachcaOAuth.buildAuthorizeURL()` | `PachcaOAuth.createPKCE()` |
| C# | `PachcaOAuth.BuildAuthorizeUrl()` | `PachcaOAuth.CreatePkce()` |

Ссылка принимает `client_id` и адрес возврата бота, `state` и `code_challenge` из пары, имена параметров — по правилам языка. Она ведёт на экран согласия `https://app.pachca.com/apps/authorize`, для on-premise передайте адрес экрана своей установки необязательным параметром `authorizeUrl`. В Python функции импортируются из `pachca.client`, в TypeScript `createPkce()` работает в Node.js 20+ и в браузере.

## Сравнение языков

| | TypeScript | Python | Go | Kotlin | Swift | C# |
|---|---|---|---|---|---|---|
| **Пакет** | `@pachca/sdk` | `pachca-sdk` | `go get ...` | `com.github.pachca:openapi` | `PachcaSDK` | `Pachca.Sdk` |
| **Менеджер** | npm | PyPI | Go modules | JitPack (Gradle) | SPM | NuGet |
| **Async** | `await` | `await` (asyncio) | синхронный | `suspend` (coroutines) | `try await` | `await` |
| **HTTP** | fetch | httpx | net/http | Ktor | URLSession | HttpClient |
| **Naming** | camelCase | snake_case | PascalCase | camelCase | camelCase | PascalCase |
| **Cleanup** | — | `await client.close()` | — | `client.close()` | — | `client.Dispose()` |
| **Требования** | Node.js 18+ | Python 3.10+ | Go 1.24+ | Kotlin 2.2+, Java 11+ | Swift 5.9+, macOS 13+, iOS 16+ | .NET 8+ |



## Связанные разделы

- [Авторизация](/api/authorization)
- [Пагинация](/api/pagination)
- [CLI](/guides/cli/overview)
