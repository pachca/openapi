> Расположение: Авторизация от имени сотрудника
> Краткое содержание: Как бот получает токен сотрудника по шагам: ссылка авторизации с state и PKCE, кнопка в сообщении бота, возврат с кодом, обмен кода на токен, проверка сотрудника и обработка отказов. Пример на curl и TypeScript с SDK
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Получение токена сотрудника

Бот получает токен сотрудника по стандартной схеме OAuth 2.0 с кодом авторизации ([RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)) и PKCE ([RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)). Перед началом включите авторизацию на вкладке **OAuth** в карточке бота — подробнее в разделе [Настройка авторизации](/guides/oauth/setup). Кроме неё, боту нужны исходящий вебхук и токен, иначе сотрудник не получит кнопку. Всё, что должно быть включено, собрано в [Чек-листе запуска](/guides/oauth/checklist).

**Путь авторизации**

```mermaid
sequenceDiagram
    participant E as Сотрудник
    participant P as Пачка
    participant S as Сервер бота

    E->>P: Пишет боту
    P->>S: Событие о новом сообщении
    S->>P: Сообщение с кнопкой авторизации
    E->>P: Открывает кнопку и нажимает «Разрешить»
    P->>S: Возврат на адрес с code и state
    S->>P: POST /oauth/token
    P->>S: Токен сотрудника
    S->>P: GET /oauth/token/info с токеном сотрудника
    S->>P: Запросы от имени сотрудника
```


| Адрес | Назначение |
| --- | --- |
| `https://app.pachca.com/apps/authorize` | Экран согласия, на него ведёт кнопка |
| `https://api.pachca.com/api/shared/v1/oauth/token` | [Обмен кода на токен](/api/oauth/exchange-token) |
| `https://api.pachca.com/api/shared/v1/oauth/revoke` | [Отзыв токена](/api/oauth/revoke-token) |

Те же адреса публикуются в метаданных сервера авторизации по [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414): `https://api.pachca.com/.well-known/oauth-authorization-server`.

## Шаги


  ### Шаг 1. Сгенерируйте state и пару PKCE

На каждую кнопку создайте случайный `state` и проверочный код `code_verifier` — случайную строку длиной от 43 до 128 символов. Из него получите `code_challenge`: SHA-256 от `code_verifier` в кодировке base64url без `=` на конце.

Сохраните `state`, `code_verifier` и идентификатор сотрудника, которому отправляете кнопку: по `state` вы узнаете, чей это возврат. Для варианта **Браузер, мобильное, CLI** PKCE обязателен, для варианта **Серверное, с секретом** — рекомендуется.


  ### Шаг 2. Соберите ссылку авторизации

```text title="Ссылка авторизации"
https://app.pachca.com/apps/authorize
  ?client_id=CLIENT_ID
  &redirect_uri=https%3A%2F%2Fbot.example.com%2Foauth%2Fcallback
  &response_type=code
  &state=STATE
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
```

- `client_id` — с вкладки **OAuth** в карточке бота
- `redirect_uri` — один из адресов возврата бота, совпадение проверяется точно
- `response_type` — всегда `code`
- `state` — значение из первого шага
- `code_challenge` и `code_challenge_method` — PKCE, метод только `S256`

Параметр `scope` передавать не нужно: набор прав сервер берёт из настроек бота.


  ### Шаг 3. Отправьте кнопку

Отправьте ссылку сотруднику URL-кнопкой в личной переписке с ботом — методом [Новое сообщение](/api/messages/create) с `entity_type: "user"`. Подробнее о кнопках — в разделе [Кнопки в сообщениях](/guides/buttons).

![Бот в ответ на просьбу сотрудника присылает сообщение с кнопкой «Предоставить доступ»](/images/oauth/access_request.webp)

*Кнопка авторизации в сообщении бота*


В тексте рядом с кнопкой объясните, зачем боту доступ и что он будет делать, и попросите не пересылать ссылку.


  ### Шаг 4. Примите возврат

Сотрудник видит экран согласия и нажимает **Разрешить**. Браузер возвращается на ваш адрес с параметрами `code`, `state` и `iss` — последний всегда равен `https://api.pachca.com` и подтверждает, что код выдала Пачка.

```text title="Возврат после согласия"
https://bot.example.com/oauth/callback?code=AUTH_CODE&state=STATE&iss=https%3A%2F%2Fapi.pachca.com
```

Найдите сохранённый `state` и сразу удалите его: каждый `state` действует один раз. Если сотрудник нажал **Отменить**, возврата на ваш адрес не будет — браузер просто вернётся назад. Поэтому храните неиспользованные `state` ограниченное время, например сутки.


  ### Шаг 5. Обменяйте код на токен

Код живёт 10 минут и обменивается один раз. Серверное приложение передаёт `client_secret` в теле запроса или в заголовке `Authorization: Basic`, приложение без секрета — только `code_verifier`. Поля запроса и ответа — на странице метода [Обмен кода на токен](/api/oauth/exchange-token).

```bash title="Обмен кода на токен"
curl -X POST https://api.pachca.com/api/shared/v1/oauth/token \
  -d grant_type=authorization_code \
  -d code=AUTH_CODE \
  -d redirect_uri=https://bot.example.com/oauth/callback \
  -d client_id=CLIENT_ID \
  -d client_secret=CLIENT_SECRET \
  -d code_verifier=CODE_VERIFIER
```

```json title="Ответ"
{
  "access_token": "ACCESS_TOKEN",
  "token_type": "Bearer",
  "refresh_token": "REFRESH_TOKEN",
  "scope": "chats:read messages:read tasks:read tasks:create",
  "created_at": 1790242260
}
```

Поля `expires_in` в ответе нет: токен бессрочный и работает, пока сотрудник не отзовёт доступ. Обновлять его не нужно.


  ### Шаг 6. Проверьте, чей это токен

Запросите [Информацию о токене](/api/oauth/token-info) с новым токеном: в `data.user_id` придёт сотрудник, который дал согласие. Отдельных прав метод не требует. Сравните его с сотрудником, которому вы отправляли кнопку.

Сообщение с кнопкой могли переслать, и тогда согласие дал другой сотрудник. Сохраните токен за ним, а тому, кому отправляли кнопку, пришлите её снова. Отзывать такой токен не стоит: если этот сотрудник уже авторизовал бота раньше, Пачка вернула его прежний токен, и отзыв отключит его доступ.


  ### Шаг 7. Храните токен на сотрудника

Сохраните токен в привязке к сотруднику и передавайте в заголовке `Authorization: Bearer` при запросах от его имени. Токен даёт доступ ко всему, что видит сотрудник, в пределах выданных прав: храните его как пароль.


## Пример на TypeScript

Серверное приложение на Express с [TypeScript SDK](/guides/sdk/typescript): кнопка в ответ на сообщение сотрудника и обработчик возврата. Ссылку и пару PKCE собирают функции SDK, в других языках они называются по-своему — список в разделе [SDK](/guides/sdk/overview#token-sotrudnika).

```typescript title="oauth.ts"
import crypto from "node:crypto"
import express from "express"
import {
  MessageEntityType,
  PachcaClient,
  buildAuthorizeUrl,
  createPkce,
} from "@pachca/sdk"

const CLIENT_ID = process.env.PACHCA_CLIENT_ID!
const CLIENT_SECRET = process.env.PACHCA_CLIENT_SECRET!
const REDIRECT_URI = "https://bot.example.com/oauth/callback"

const bot = new PachcaClient(process.env.PACHCA_BOT_TOKEN!)

// state → кому отправлена кнопка и проверочный код PKCE
const pending = new Map<string, { userId: number; verifier: string }>()

export async function sendAuthButton(userId: number) {
  const state = crypto.randomBytes(16).toString("hex")
  const { codeVerifier, codeChallenge } = await createPkce()
  pending.set(state, { userId, verifier: codeVerifier })

  const url = buildAuthorizeUrl({
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    state,
    codeChallenge,
  })
  await bot.messages.createMessage({
    message: {
      entityType: MessageEntityType.User,
      entityId: userId,
      content: "Чтобы я мог работать с вашими задачами, разрешите доступ.",
      buttons: [[{ text: "Предоставить доступ", url }]],
    },
  })
}

const app = express()

app.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query as Record<string, string | undefined>
  const entry = state ? pending.get(state) : undefined
  if (!state || !entry) return res.status(400).send("Ссылка устарела, запросите новую у бота")
  pending.delete(state)
  if (error || !code) return res.status(400).send("Доступ не выдан, запросите новую ссылку у бота")

  const token = await bot.oauth
    .exchangeToken({
      grantType: "authorization_code",
      code,
      redirectUri: REDIRECT_URI,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      codeVerifier: entry.verifier,
    })
    .catch(() => null)
  if (!token) return res.status(502).send("Не удалось получить токен")

  const employee = new PachcaClient(token.accessToken)
  const info = await employee.oauth.getTokenInfo().catch(() => null)
  if (!info) return res.status(502).send("Не удалось проверить токен")

  // Токен принадлежит тому, кто дал согласие, даже если кнопку ему переслали
  await saveToken(info.userId, token.accessToken) // ваше хранилище токенов
  if (info.userId !== entry.userId) await sendAuthButton(entry.userId)
  res.send("Готово, можно вернуться в Пачку")
})
```

Ошибку обмена SDK выбрасывает как `OAuthError` с кодом в поле `error`, коды перечислены ниже.

## Ошибки и отказы

Если сотрудник не получает кнопку или бот молчит, дело обычно не в OAuth, а в настройках вокруг него — пройдите [Чек-лист запуска](/guides/oauth/checklist).

**При обмене кода**

- `invalid_grant` — код истёк, уже использован или выдан для другого `redirect_uri`, либо `code_verifier` не подходит к `code_challenge`. Отправьте сотруднику новую кнопку.
- `invalid_client` — неверный `client_id` или `client_secret`. Проверьте секрет: после обновления старое значение перестаёт работать сразу.
- `429 Too Many Requests` — слишком много обменов подряд. У обмена кода свой [лимит](/api/limits), повторите запрос через время из заголовка `Retry-After`.

**При работе с токеном сотрудника**

- `401 Unauthorized` — сотрудник отозвал доступ, у бота отключили авторизацию или бот удалён. Удалите токен и, когда сотрудник снова обратится к боту, пришлите кнопку заново.
- `403 Forbidden` с `insufficient_scope` — права нет в выданном наборе. Если в настройки бота его уже добавили, пришлите кнопку заново: сотрудник подтвердит новый набор.
- `403 Forbidden` с `role_forbidden` — право в наборе есть, но роль сотрудника его не позволяет. Повторная авторизация не поможет: напишите сотруднику, что действие недоступно его роли. Подробнее о формате отказа — в разделе [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii).

## Отзыв токена ботом

Бот может сам отозвать токен сотрудника методом [Отзыв токена](/api/oauth/revoke-token), например когда тот отключает интеграцию в вашем сервисе. Серверное приложение отправляет `token` вместе с `client_id` и `client_secret`, приложение без секрета — сам токен в теле запроса и в заголовке `Authorization: Bearer`. Как сотрудник отзывает доступ сам — в разделе [Согласие и отзыв](/guides/oauth/consent).

```typescript title="Отзыв токена"
await bot.oauth.revokeToken({
  token: accessToken,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
})
```


## Связанные разделы

- [Чек-лист запуска](/guides/oauth/checklist)
- [Настройка авторизации](/guides/oauth/setup)
- [Согласие и отзыв](/guides/oauth/consent)
- [Кнопки в сообщениях](/guides/buttons)
- [Авторизация](/api/authorization)
