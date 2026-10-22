# Launch checklist and symptoms

Authorization runs through a dialog with the bot, so it usually breaks on the settings around
OAuth, not on OAuth itself. Walk the four stages in order before launch, and again when a step
stays silent. Live page: <https://dev.pachca.com/guides/oauth/checklist.md>

## 1. The employee can write to the bot

- The bot is public (switch **Публичный бот** on the **Основное** tab of the bot card), or it
  shares a chat with the employee, or it wrote to the employee first.
- Publishing in the showcase alone does not let anyone write to the bot.

Symptom: the employee has no **Сообщение** (Message) button on the bot.
More: <https://dev.pachca.com/guides/bots/access.md>

## 2. The bot learns about the message

- The outgoing webhook is on and points to your server.
- The **Новые сообщения** (new messages) event is on, in **Любые сообщения** (any messages)
  mode or with the command that starts the conversation, for example `/start`.
- The server verifies the request signature, and the bot ignores its own messages.

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

| What the employee or the bot sees                                        | Likely cause                                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Refusal instead of the consent screen                                    | Not allowed by the workspace setting, the employee is a guest, or the bot is from another workspace |
| Clicked the button, never saw the consent screen, but the bot got a code | Expected: a confidential client re-authorizing with an unchanged set skips the screen               |
| Clicked **Отменить**, the bot got nothing                                | Expected: Cancel does not call your server                                                          |
| The bot gets `invalid_grant`                                             | Code older than 10 minutes, reused, wrong `redirect_uri`, or wrong `code_verifier`                  |
| The bot gets `invalid_client`                                            | Wrong or rotated `client_secret`                                                                    |
| Calls with the token return `403 role_forbidden`                         | The employee's role does not allow it; re-authorizing will not help                                 |

Settings: <https://dev.pachca.com/guides/oauth/setup.md>
Errors: <https://dev.pachca.com/guides/oauth/flow.md>

## Before announcing the bot

- Test with a non-admin employee account, not only as an admin: admins pass even with the
  default workspace setting.
- Test a forwarded button: the token must be saved under the employee who consented.
- Test revocation: revoke in **Интеграции** > **API** > **Авторизации** and confirm the bot
  deletes the token on `401` and offers the button again.
- If you want the bot in the showcase, fill **Страница на витрине** on the same **OAuth** tab.
  The showcase page lists the requested scopes under **Что бот может запросить**.
  More: <https://dev.pachca.com/guides/bots/showcase.md>
