---
name: pachca-bots
description: 'Как правильно построить бота или интеграцию в Пачке: что выбрать (входящий вебхук, бот с событиями, приложение с авторизацией), создание и настройки бота, токены и права, доступ к чатам, приём событий (подпись, повторы, идемпотентность, история событий), кнопки, формы, разворачивание ссылок, витрина. Use when: «сделать бота», «создать бота», «уведомления из CRM или CI в чат», «входящий вебхук», «исходящий вебхук», «бот не получает сообщения», «проверить подпись вебхука», «кнопки в сообщении бота», «форма, модальное окно», «превью ссылок, unfurl», «токен бота и права», «опубликовать бота в витрине»; "build a Pachca bot", "incoming webhook", "outgoing webhook", "bot does not receive messages", "verify webhook signature", "message buttons", "modal form", "link unfurling". Not for: an AI agent that answers in threads → pachca-ai-agent; an app acting for an employee → pachca-oauth; scripts, pagination, 429 → pachca-api; writing messages yourself → pachca-messaging.'
---

# Pachca bots and integrations

A bot in Pachca is a service member of the workspace: it has a name, avatar and nickname, sits in chats, writes messages and receives events, always on its own behalf. Every integration is built on a bot. This skill is the decision guide and the rules; the live pages hold the details.

## When to use

- Someone wants notifications from an outside service (CRM, CI/CD, monitoring) in a chat.
- Someone is building a bot that answers in DMs, chats or threads, by command or by nickname.
- A bot "does not see messages", "does not get events", "cannot be added to a chat".
- Buttons, modal forms, link previews, the bot catalog (showcase), bot tokens and scopes.

Hand off: an LLM agent living in Pachca → `pachca-ai-agent`; acting with an employee's own rights → `pachca-oauth`; generic API work (pagination, 429, errors, SDK) → `pachca-api`.

## Pick the kind first

| The integration must…                             | Turn on                                    | Not enough / watch out                                                     |
| ------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Post notifications from a service                 | Incoming webhook                           | Posts to **all** group chats the bot is in; cannot target one chat or a DM |
| Write to a specific chat, DM, thread from code    | Bot token                                  | Send with the token (`pachca_send_message`, `pachca messages create`)      |
| Answer employees (DM, mention, command)           | Outgoing webhook + token                   | Pick the message mode, or the bot hears nothing                            |
| Ask an employee inside a message                  | Buttons, then a form                       | Needs the "Button clicks" event and a handler that answers in seconds      |
| Show cards for internal links                     | Link-sharing event + domains               | Only an admin or the owner turns it on                                     |
| Work with an employee's own data                  | Authorization on behalf of an employee     | → `pachca-oauth`                                                           |
| Let employees find and connect the bot themselves | Public bot, or publication in the showcase | Published ≠ reachable; see Showcase below                                  |

A bot is created with only a name and nickname; each capability is a separate tab of the bot card (Main, Incoming webhook, Outgoing webhook, API, OAuth), switched on when needed.

## What a bot can and cannot do

- It acts like a member with the "Employee" role: sees open channels with their threads; gets into private channels, conversations and threads only when added.
- It never sees other people's DMs and never acts as a specific employee. For that the employee authorizes the bot → `pachca-oauth`.
- Some methods are personal-token only, e.g. adding people to the workspace and message export; drafts and bot-management scopes are never granted to a bot token.
- `display_name` and `display_avatar_url` on send/edit message override the shown sender per message (the Bot badge stays). Bot token only. Useful for migrating history from another service.

## Set up a bot in the right order

Who may create bots: admins and employees, unless the owner or an admin restricted it to admins. UI creation works on web and desktop, not in mobile apps.

1. **Create.** Nickname: Latin letters, digits, `_`, ends with `_bot`, unique in the workspace. Via API (`pachca_create_bot`, `pachca bots create`) only the name is required.
2. **Save the token at once.** API creation returns `access_token` once; it is never shown again (UI or API) — a lost token is reissued. With `empty: true` the bot is created like in the UI: no token, no incoming webhook.
3. **Access.** On Main decide who may add the bot to chats, who may edit it, public or not.
4. **Outgoing webhook**, if the bot must react: URL, events, and the message mode. A new bot (UI or API without `trigger_on`) listens to commands with an empty command list, so it hears nothing.
5. **Add to chats.** A new bot is in no chat: add it to conversations and channels, or mention it in a thread; DMs come by themselves.

Agent doing this with tools: creating a bot or token returns a secret shown once — give it to the person in your reply, never post it in a chat or commit it. Confirm before deleting a bot (irreversible: tokens revoked, webhooks and authorizations stop) and before reissuing a token that live services use.

## Tokens and scopes

- Issue one token per service, each with its own name and the minimum scopes; revoke one without touching the others. Scopes are per token; edits apply at once, no reissue.
- Scopes decide which methods work, not what data is visible: the bot still sees only open channels and its chats.
- Bot-only scopes: `bot_self:webhook:write` (the bot sets its own outgoing webhook URL) and `bot_self:write` (the bot rotates its own token). The main token of a bot created by API without `webhook.scopes` gets a default set without these and without `user_status:read` — grant them explicitly.
- `pachca_get_bot_scopes` (`pachca bots list-scopes`) lists what can be granted; `pachca_get_token_info` (`pachca oauth token-info`) shows what the current token has.
- Bot tokens never expire: they live until reissued, deleted or the bot is deleted.
- Managing a bot's tokens through the API needs a personal token with `bots:read` and `bots:write`. A chat owner who may edit the bot never sees its tokens.
- Leaked token: reissue (`pachca_reissue_bot_token`, `pachca bots reissue-token`) — the old value dies instantly — then update the services. Keep tokens in env vars or a secret store, never in code.
- "Main token" (the unnamed one, else the oldest) is what `webhook.scopes` and the two rotation methods act on. Details: [tokens](https://dev.pachca.com/guides/bots/tokens.md).

## Chat access

- Events come only from chats and threads the bot is a member of — an open channel included: the bot can read it via API without membership but gets no events until added.
- Add to a conversation or channel with `pachca_add_members` (`pachca members add`), bot `id` in `member_ids`. Add to a thread alone with its `chat_id`: the bot sees the thread and its parent message, not the chat history.
- A `@nickname` mention in a thread adds the bot if the author may add it. A mention in a conversation or channel does not.
- Rejections are all-or-nothing: `403 bot_add_denied` (caller may not add that bot) or `409 single_chat_bot_occupied` (single-chat bot already busy) — nobody from the request is added, no chat is created.
- DMs: an employee can write to the bot only if it is public, shares a non-archived chat with them, or wrote first (`entity_type: "user"`). A bot cannot be added to an existing DM between two people.
- Opening a DM with the bot fires no event. The bot learns about the employee from their first message — or writes first.

Settings that bite (Main tab, [settings](https://dev.pachca.com/guides/bots/settings.md)): a new bot is editable only by its creator (admins do not even see it until the creator ticks Administrators); chat owners may change settings and webhooks but not name, tokens, OAuth, showcase or deletion. A bot can be in tags only if anyone may add it and "Single chat" is off; setting "who can add" to creator or creator-and-admins, or turning on single chat, removes it from tags and tag-joined chats — confirm first.

## Answering in conversations

- Mode "All messages" for a bot called by nickname or in DMs; "Starting with commands" (exact, case-sensitive first word) for command bots. There is no mentions-only mode: get everything, decide yourself.
- Answer when: it is a DM (`entity_type` `user`), `content` contains `@nickname`, the message starts with a command, or the conversation obviously continues (e.g. a thread with the bot and one employee; check members via chat info).
- Skip your own messages: turn on "Ignore own messages" or compare `user_id` with the bot `id` (get it from `pachca_get_my_card` / `pachca profile get` with the bot token).
- Reply where the message came from. In a conversation or channel prefer a thread: `pachca_create_thread` (`pachca threads add`) returns the existing thread if there is one, then send with `entity_type: "thread"`.
- While working, put a reaction on the message and remove it after replying.
- Scopes for a talking bot: `messages:create`, `threads:create`, `reactions:write`, `messages:read`, `chats:read`, `profile:read`.
- Mentioning a person in a thread invites them; to only refer to them pass `skip_invite_mentions: true`. Rate and per-chat daily limits: [limits](https://dev.pachca.com/api/limits.md).

## Receiving events (outgoing webhook)

Must-haves; procedure and payload notes in [references/events.md](references/events.md):

- The URL must be public `http`/`https`; local and internal addresses are refused. Develop through a tunnel, or poll the event history.
- Verify `Pachca-Signature` (HMAC-SHA256 of the **raw** body with the Signing secret) and reject a `webhook_timestamp` more than a minute away from now.
- Answer `200` immediately, queue the work. Pachca waits 5 s and retries only when it could not connect; an error code or a timeout is never retried. Turn on event history to recover missed events.
- Process idempotently: an event can occasionally arrive twice.
- Payloads carry the essentials only; fetch the full message by `id` for attachments, buttons, forwards.

## Buttons

- Send messages with buttons using the **bot** token: a Data-button click goes only to the bot that sent the message. Clicks need the "Button clicks" (`button_click`) event.
- URL button opens a link (with a confirmation); Data button sends `data` to your server. Each button has exactly one of `url` / `data`, else `wrong_params`.
- After a click: edit the message (an empty `buttons` array removes all buttons), reply, or open a form with `trigger_id` (lives 3 s).
- Keep 5–6 buttons per row; rows do not wrap on narrow screens. Hard limits: [buttons](https://dev.pachca.com/guides/buttons.md).

## Forms

A form opens only from a Data-button click in the bot's message, by `trigger_id`, and the submission must be answered within 3 seconds. Open the form first, do the rest after. An agent working in a chat cannot meet these windows — use a message instead, or build a handler. Full procedure: [references/forms.md](references/forms.md).

## Link unfurling

- Only an admin or the owner enables the "Message link sharing (unfurl)" event, sets its domains (up to 5), changes such a bot's webhook URL or history. Self-registration of the webhook fails for it.
- The bot receives links from every chat, without membership. In DMs `entity_id` is `null`.
- Skip links with `skip: true` (the author hid the preview; if sent anyway it is skipped, not an error). Send previews with `pachca_add_link_preview` (`pachca messages unfurl`) and the `message_id` from the event.
- One bad URL (not in the message, domain not configured) fails the whole request — no previews at all.
- Domains: no protocol, subdomains included, paths ignored, no IPs or ports. Links from another bot's messages arrive only if that bot has link previews on in its incoming webhook. [Link previews](https://dev.pachca.com/guides/link-previews.md).

## Incoming webhook

- Sources: GitLab and Grafana are parsed by Pachca; "Custom format" posts the `message` field, or a Liquid or Mustache template over any JSON.
- Accepted bodies: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`; anything else gets `415` and nothing is posted.
- An empty template result posts nothing; an over-long result posts nothing; a template syntax error posts a "template error" message into the chats.
- Debug with "Show the last received object" (or `webhook.last_request_body` from bot info, for those who manage its tokens).
- Template engine default: Liquid for a bot created by API, Mustache for an `empty: true` bot or a re-enabled webhook — pass `template_engine` with `kind`.
- Deleting the webhook kills the address (`404`); re-enabling gives a new one — update the service. [Incoming webhooks](https://dev.pachca.com/guides/incoming-webhooks.md).

## Showcase

- Public bot: in search and the Overview list; anyone may DM it; any employee (not guests) may add it. Published bot: a card with a page; needs authorization enabled and a saved description (screenshots optional).
- Publishing does not let anyone write to the bot. Authorization happens in the DM, so make a published bot public too.
- Deleting the OAuth client also revokes every authorization granted — confirm first. [Showcase](https://dev.pachca.com/guides/bots/showcase.md).

## Pitfalls

- Bot silent on messages: mode left on commands with an empty list, or the bot is not a member of that chat.
- Incoming webhook chosen for "send to chat X" — it goes to every group chat of the bot.
- Clicks or form submissions never arrive: "Button clicks" event off, or the buttons were sent with a personal token.
- Waiting for a "user opened the DM" event — there is none.
- Treating a `5xx` or timeout as "Pachca will retry" — it will not.
- Parsing JSON before checking the signature — hash the raw bytes.
- Deleting the outgoing webhook resets mode, history and "Ignore own messages" and issues a new Signing secret.
- Expecting broader data from more scopes — scopes never widen visibility.

## Read more

- [Bots overview](https://dev.pachca.com/guides/bots/overview.md) · [Create a bot](https://dev.pachca.com/guides/bots/setup.md) · [Settings](https://dev.pachca.com/guides/bots/settings.md)
- [Tokens](https://dev.pachca.com/guides/bots/tokens.md) · [Chat access](https://dev.pachca.com/guides/bots/access.md) · [Conversations](https://dev.pachca.com/guides/bots/conversations.md) · [Showcase](https://dev.pachca.com/guides/bots/showcase.md)
- [Incoming webhooks](https://dev.pachca.com/guides/incoming-webhooks.md) · [Outgoing webhooks](https://dev.pachca.com/guides/webhook/overview.md) · [Events](https://dev.pachca.com/guides/webhook/events.md) · [Handler](https://dev.pachca.com/guides/webhook/handler.md) · [Polling](https://dev.pachca.com/guides/webhook/polling.md)
- [Buttons](https://dev.pachca.com/guides/buttons.md) · [Forms](https://dev.pachca.com/guides/forms/overview.md) · [Form blocks](https://dev.pachca.com/guides/forms/blocks.md) · [Form handling](https://dev.pachca.com/guides/forms/handling.md) · [Link previews](https://dev.pachca.com/guides/link-previews.md)
- [Authorization and scopes](https://dev.pachca.com/api/authorization.md) · [Limits](https://dev.pachca.com/api/limits.md) · [Open-source examples](https://dev.pachca.com/guides/bots/examples.md)
