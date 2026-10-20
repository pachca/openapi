### Получить токен сотрудника по OAuth

1. Создай случайный `state` и пару PKCE: случайный `code_verifier` и `code_challenge` — его SHA-256 в base64url без `=` на конце. Сохрани их вместе с `id` сотрудника, которому отправишь кнопку. В SDK пару создаёт `createPkce()`
   > В shell: `VERIFIER=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')`, затем `printf %s "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '='` — это `code_challenge`

2. Собери ссылку `https://app.pachca.com/apps/authorize?client_id=<client_id>&redirect_uri=<redirect_uri>&response_type=code&state=<state>&code_challenge=<code_challenge>&code_challenge_method=S256`: `client_id` и адрес возврата — из `oauth_client` бота (`pachca bots get <bot_id>`), значения кодируй для URL. В SDK её собирает `buildAuthorizeUrl()`

3. Отправь ссылку сотруднику URL-кнопкой в личные сообщения:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Разрешите доступ к задачам" --buttons='[[{"text":"Предоставить доступ","url":"<authorize_url>"}]]'
   ```

4. После согласия браузер вернётся на `redirect_uri` с `code` и `state`. Найди сохранённый `state` и удали его: каждый действует один раз

5. Обменяй код на токен: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `client_secret` и `code_verifier` формой в теле запроса. Код живёт 10 минут и обменивается один раз. В SDK это `client.oauth.exchangeToken()`

6. Проверь, чей это токен: в `data.user_id` придёт сотрудник, который дал согласие:
   ```bash
   pachca oauth token-info --token <access_token>
   ```
   > Кнопку могли переслать: сохрани токен за тем, кто дал согласие, а сотруднику, которому отправлял кнопку, пришли её снова

> Токен бессрочный и действует, пока сотрудник не отзовёт доступ: храни его как пароль. Бот отзывает токен сам методом `POST /oauth/revoke`, в SDK это `client.oauth.revokeToken()`.

