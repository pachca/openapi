# Authorization flow: exact order of steps

OAuth 2.0 authorization code flow (RFC 6749) with PKCE (RFC 7636). Everything below runs in
the bot's server or app, over HTTP or the SDK. Before step 1, OAuth must be enabled on the bot
and the [launch checklist](launch-checklist.md) must pass.

Live page with the full example: <https://dev.pachca.com/guides/oauth/flow.md>

## Addresses

| Address                                             | Purpose                                |
| --------------------------------------------------- | -------------------------------------- |
| `https://app.pachca.com/apps/authorize`             | Consent screen, the button points here |
| `https://api.pachca.com/api/shared/v1/oauth/token`  | Code exchange                          |
| `https://api.pachca.com/api/shared/v1/oauth/revoke` | Token revocation                       |

The same addresses are published as authorization server metadata (RFC 8414) at
`https://api.pachca.com/.well-known/oauth-authorization-server`.

## Steps

### 1. The employee writes to the bot

The outgoing webhook delivers the new message to your server (or the bot writes to the
employee first). Decide here that this employee needs to authorize: you know their user id
from the event.

### 2. Generate `state` and a PKCE pair, per button

- `state`: a random value, new for every button.
- `code_verifier`: a random string of 43 to 128 characters.
- `code_challenge`: SHA-256 of `code_verifier`, base64url, without trailing `=`.
- In the SDK, `createPkce()` (TypeScript) makes the pair; other languages name it their own
  way, see <https://dev.pachca.com/guides/sdk/overview.md>

Save `state` → employee id the button goes to, `code_verifier`, creation time. Do this for a
confidential client too: PKCE is required for a public client and recommended for a
confidential one.

### 3. Build the authorization link

```text
https://app.pachca.com/apps/authorize
  ?client_id=CLIENT_ID
  &redirect_uri=https%3A%2F%2Fbot.example.com%2Foauth%2Fcallback
  &response_type=code
  &state=STATE
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
```

- `client_id` from the bot's **OAuth** tab.
- `redirect_uri` exactly one of the bot's redirect URIs.
- `response_type` always `code`.
- `code_challenge_method` only `S256`.
- No `scope`: the server always uses the set from the bot settings.

In the SDK, `buildAuthorizeUrl()` (TypeScript) builds it.

### 4. Send the button in the DM

Send the link as a URL button in the employee's DM with the bot: the New message method with
`entity_type: "user"`, called with the bot token (needs `messages:create`). In the text, say
why the bot needs access and what it will do, and ask not to forward the link.

Buttons: <https://dev.pachca.com/guides/buttons.md>

### 5. The employee decides

- **Разрешить** (Allow): the browser goes to your `redirect_uri`.
- **Отменить** (Cancel): the browser just goes back, nothing reaches your server. Keep unused
  `state` values for a bounded time, for example a day, then drop them.
- A confidential client re-authorizing with an unchanged scope set skips the screen: the
  browser comes back with a new code right away.

### 6. Accept the callback

```text
https://bot.example.com/oauth/callback?code=AUTH_CODE&state=STATE&iss=https%3A%2F%2Fapi.pachca.com
```

1. Look up `state`. Unknown or expired → reject and tell the employee to ask the bot for a new
   link.
2. Delete the `state` at once: each one works once.
3. Check `iss` equals `https://api.pachca.com`: it confirms Pachca issued the code.

### 7. Exchange the code for the token

The code lives 10 minutes and works once.

```bash
curl -X POST https://api.pachca.com/api/shared/v1/oauth/token \
  -d grant_type=authorization_code \
  -d code=AUTH_CODE \
  -d redirect_uri=https://bot.example.com/oauth/callback \
  -d client_id=CLIENT_ID \
  -d client_secret=CLIENT_SECRET \
  -d code_verifier=CODE_VERIFIER
```

- Confidential client: `client_secret` in the body or in `Authorization: Basic`.
- Public client: no secret, only `code_verifier`.
- `redirect_uri` is the same one used in the link.

Response fields: `access_token`, `token_type` (`Bearer`), `refresh_token`, `scope`,
`created_at`. There is no `expires_in`: the token does not expire and needs no refresh. Request
and response fields: <https://dev.pachca.com/api/oauth/exchange-token.md>

### 8. Check whose token it is

Call token info with the new token (no scope required). `data.user_id` is the employee who
consented. Compare it with the employee saved under `state`.

If they differ, the button was forwarded:

- save the token under the employee who consented;
- send the button again to the employee you meant;
- do not revoke the token: if that employee authorized the bot before, Pachca returned their
  existing token, and revoking it cuts their access.

Method: <https://dev.pachca.com/api/oauth/token-info.md>

### 9. Store the token per employee

Bind the token to the employee, keep the granted `scope` next to it, store it like a password.
Send it as `Authorization: Bearer <token>` on calls made as that employee.

### 10. Handle refusals on every call

See the table below. `401` means the access is gone; react by state, not by retrying.

## Errors and what to do

During the exchange:

| Error                   | Cause                                                                                                             | Do                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `invalid_grant`         | Code expired, already used, issued for another `redirect_uri`, or `code_verifier` does not match `code_challenge` | Send the employee a new button                             |
| `invalid_client`        | Wrong `client_id` or `client_secret`                                                                              | Check the secret: after rotation the old one stops at once |
| `429 Too Many Requests` | Too many exchanges in a row, the exchange has its own limit                                                       | Retry after `Retry-After` seconds                          |

Other exchange and revoke codes: `invalid_request`, `unsupported_grant_type`,
`unauthorized_client` (token issued to another bot, or the client did not authenticate).

With the employee token:

| Error                      | Cause                                                              | Do                                                                                        |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `401` (`invalid_token`)    | Employee revoked access, OAuth disabled on the bot, or bot deleted | Delete the token; send the button again when the employee next talks to the bot           |
| `403` `insufficient_scope` | Scope not in the granted set                                       | If it is already added to the bot settings, send the button again                         |
| `403` `role_forbidden`     | Scope granted, the employee's role does not allow the action       | Re-authorizing will not help: tell the employee the action is not available to their role |

Both `403` responses also carry `WWW-Authenticate` (RFC 6750) with the same code; for
`insufficient_scope` its `scope` parameter names the missing scope. In the SDK an exchange
error is thrown as `OAuthError` with the code in `error`.

Limits: <https://dev.pachca.com/api/limits.md> · Error format: <https://dev.pachca.com/api/authorization.md>

## Revoking a token from the bot

Use it when the employee disconnects the integration in your service. Endpoint
`/oauth/revoke`:

- confidential client: `token` plus `client_id` and `client_secret`;
- public client: the token in the body and in `Authorization: Bearer`.

The employee can also revoke on their own in **Авторизации**; either way, the next call with
that token returns `401`.

Method: <https://dev.pachca.com/api/oauth/revoke-token.md>
