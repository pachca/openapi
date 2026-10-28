# Launch checklist and symptoms

Authorization runs through a dialog with the bot, so it usually breaks on the settings around
OAuth, not on OAuth itself. Walk the four stages in order before launch, and again when a step
stays silent. Live page: <https://dev.pachca.com/guides/oauth/checklist.md>

An app on the employee's device skips stages 1 to 3: see
[App on the employee's device](authorization-flow.md#app-on-the-employees-device-public-client).

## 1. The employee can write to the bot

- The bot is public (switch **Публичный бот** on the **Основное** tab of the bot card), or it
  shares a group chat or channel with the employee that is not archived, or it wrote to the
  employee first.
- Publishing in the showcase alone does not let anyone write to the bot.

Symptom: the employee has no **Сообщение** (Message) button on the bot.
More: <https://dev.pachca.com/guides/bots/access.md>

## 2. The bot learns about the message

- The outgoing webhook is on and points to your server. If the server cannot accept requests at
  all, the bot polls the event history instead: `events_history_enabled: true`, set through the
  API (no URL needed; the UI shows the toggle only after a URL is set), read with the event
  history method (`GET /webhooks/events`). The bot token then needs `webhooks:events:read`, plus
  `webhooks:events:delete` if the bot clears processed events.
  More: <https://dev.pachca.com/guides/webhook/polling.md>
- The **Новые сообщения** (new messages) event is on, in **Любые сообщения** (any messages)
  mode or with the command that starts the conversation, for example `/start`. This applies to
  polling too.
- With a webhook, the server verifies the request signature. Either way, the bot ignores its own
  messages.

Symptom: the employee writes, the bot stays silent. A new bot listens only to commands, and its
command list is empty.
More: <https://dev.pachca.com/guides/bots/conversations.md>

## 3. The bot answers with the button

- The bot has a token with `messages:create`.
- The button leads to the consent screen, built as in
  [authorization flow](authorization-flow.md) steps 2 to 4.

Symptom: no button arrives. Without the scope, New message returns `403`.
More: <https://dev.pachca.com/guides/bots/tokens.md>

## 4. The authorization goes through

- Employees are allowed to grant access to bots: workspace setting **Кто может создавать
  персональные токены** is **Все сотрудники**. The default **Только администраторы** makes every
  non-admin see a refusal instead of consent.
- OAuth is enabled on the **OAuth** tab with at least one redirect URI.
- The requested scope set is chosen and holds only what the bot needs.
- A public client sends PKCE with `S256`; a confidential client keeps `client_secret` on the
  server and exchanges the code there.

Symptoms and causes:

| What the employee or the bot sees                                              | Likely cause                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| «Доступ к API ограничен администраторами пространства»                         | Workspace setting **Кто может создавать персональные токены** is **Только администраторы**: an admin switches it to **Все сотрудники**                                                                                   |
| «Гостям доступ к API не выдаётся»                                              | The employee is a guest. No setting helps                                                                                                                                                                                |
| An error message and **Вернуться в Пачку** instead of the consent screen       | The link is wrong: `redirect_uri` not in the bot's list, no `code_challenge` from a public client, or a method other than `S256`. Nothing reaches your server                                                            |
| The Pachca sign-in screen instead of consent, though the employee is signed in | Unknown `client_id`, OAuth off on the bot, the bot deleted, or the bot is from another workspace. An employee of several workspaces switches to the bot's workspace in Pachca in that browser and opens the button again |
| Clicked the button, never saw the consent screen, but the bot got a code       | Expected: a confidential client re-authorizing with an unchanged set skips the screen                                                                                                                                    |
| Clicked **Отменить**, the bot got nothing                                      | Expected: Cancel does not call your server                                                                                                                                                                               |
| The bot gets `invalid_grant`                                                   | Code older than 10 minutes, reused, wrong `redirect_uri`, or wrong `code_verifier`                                                                                                                                       |
| The bot gets `invalid_client`                                                  | Wrong `client_id`, wrong or rotated `client_secret`, or a confidential client sent no secret                                                                                                                             |
| Calls with the token return `403 role_forbidden`                               | The employee's role does not allow it; re-authorizing will not help                                                                                                                                                      |

Settings: <https://dev.pachca.com/guides/oauth/setup.md>
Errors: <https://dev.pachca.com/guides/oauth/flow.md>

## Before announcing the bot

- Test with a non-admin employee account, not only as an admin: admins pass even with the
  default workspace setting.
- Test a forwarded button: the token must be saved under the employee who consented.
- Test revocation: revoke in **Интеграции** > **API** > **Авторизации** and confirm the bot
  deletes the token on `401` and offers the button again.
- If you want the bot in the showcase, fill **Страница на витрине** on the same **OAuth** tab:
  save a description, then turn on **Опубликовать в витрине** (the switch stays unavailable until
  the description is saved). Through the API, send `promo` with `description` and
  `published: true` in `pachca_update_bot`. Filling the block alone does not publish the bot. The
  showcase page lists the requested scopes under **Что бот может запросить**.
  More: <https://dev.pachca.com/guides/bots/showcase.md>
