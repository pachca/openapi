---
name: pachca-bots
description: 'Бот или интеграция в Пачке: что выбрать (входящий вебхук, бот с событиями, приложение с авторизацией), создание и настройки бота, токены и права, доступ к чатам, приём событий (подпись, повторы, идемпотентность, история событий), кнопки, формы, разворачивание ссылок, витрина. Use when: «сделать бота», «уведомления из CRM или CI в чат», «входящий вебхук», «исходящий вебхук», «бот команд или уведомлений не получает сообщения», «проверить подпись вебхука», «кнопки в сообщении бота», «форма, модальное окно», «превью ссылок, unfurl», «права токена бота», «токен бота утёк», «опубликовать бота в витрине»; "build a Pachca bot", "incoming webhook", "outgoing webhook", "bot gets no events", "verify webhook signature", "message buttons", "modal form", "link unfurling", "reissue a leaked bot token". Not for: an AI agent that answers in threads or does not hear a mention → pachca-ai-agent; an app acting for an employee → pachca-oauth; scripts, pagination, 429 → pachca-api; writing messages yourself → pachca-messaging.'
---

# Pachca bots and integrations

A bot in Pachca is a service member of the workspace: it has a name, avatar and nickname, sits in chats, writes messages and receives events on its own behalf; it acts for an employee only when that employee authorizes it (→ `pachca-oauth`). Every integration is built on a bot. This skill is the decision guide and the rules; the live pages hold the details.

## When to use

- Someone wants notifications from an outside service (CRM, CI/CD, monitoring) in a chat.
- Someone is building a bot that answers in DMs, chats or threads, by command or by mention.
- A bot "does not see messages", "does not get events", "cannot be added to a chat".
- Buttons, modal forms, link previews, the bot catalog (showcase), bot tokens and scopes.

Hand off: an LLM agent living in Pachca, including one that does not hear a mention → `pachca-ai-agent`; acting with an employee's own rights → `pachca-oauth`; generic API work (pagination, 429, errors, SDK) → `pachca-api`.

## Pick the kind first

| The integration must…                             | Turn on                                    | Not enough / watch out                                                                          |
| ------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Post notifications from a service                 | Incoming webhook                           | Posts to **all** conversations and channels the bot is in; cannot target one chat, thread or DM |
| Write to a specific chat, DM, thread from code    | Bot token                                  | Send with the token (`pachca_send_message`, `pachca messages create`)                           |
| Answer employees (DM, mention, command)           | Outgoing webhook + token                   | Pick the message mode, or the bot hears nothing                                                 |
| Ask an employee inside a message                  | Buttons, then a form                       | Needs the «Нажатие кнопок» event and a handler that answers in seconds                          |
| Show cards for internal links                     | Link-sharing event + domains               | Only an admin or the owner turns it on                                                          |
| Work with an employee's own data                  | Authorization on behalf of an employee     | → `pachca-oauth`                                                                                |
| Let employees find and connect the bot themselves | Public bot, or publication in the showcase | Published ≠ reachable; see Showcase below                                                       |

In the interface a bot is created with only a name and nickname; each capability is a separate tab of the bot card («Основное», «Входящий вебхук», «Исходящий вебхук», «API», «OAuth»; in the English interface General, Incoming webhook, Outgoing webhook), switched on when needed. Created via API, a bot also gets a token and an incoming webhook by default (`empty: true` gives the bare interface variant); see step 2 below. Name controls to the person exactly as the interface shows them.

## What a bot can and cannot do

- It acts like a member with the «Сотрудник» role: sees open conversations and channels with their threads; gets into closed chats and threads only when added.
- It never sees other people's DMs and never acts as a specific employee. For that the employee authorizes the bot → `pachca-oauth`.
- Some methods are personal-token only, e.g. adding people to the workspace and message export; drafts and bot-management scopes are never granted to a bot token.

## Set up a bot in the right order

Who may create bots: admins and employees, unless the owner or an admin restricted it to admins. UI creation works on web and desktop, not in mobile apps.

1. **Create.** Nickname: Latin letters, digits, `_`, ends with `_bot`, unique in the workspace. Via API (`pachca_create_bot`, `pachca bots create`) only the name is required.
2. **Save the token at once.** API creation returns `access_token` once; it is never shown again (UI or API) — a lost token is reissued. With `empty: true` the bot is created like in the UI: no token, no incoming webhook.
3. **Access.** On «Основное» decide who may add the bot to chats («Кто может добавлять бота в чаты»), who may edit it, and whether it is a «Публичный бот».
4. **Outgoing webhook**, if the bot must react: URL, events, and the message mode. A new bot (UI, or API without `trigger_on` and `commands`) listens to commands with an empty command list, so it hears nothing: set `trigger_on: "all_messages"` or list the commands in `commands`.
5. **Add to chats.** A new bot is in no chat: add it to conversations and channels, or to one thread by the thread's `chat_id` (`pachca_add_members`, `pachca members add`). A mention in a thread adds only a public bot, and a new bot is not public by default. DMs need no adding, but not every employee can open one (see Chat access).

Agent doing this with tools: creating a bot or token returns a secret shown once — give it to the person in your reply, never post it in a chat or commit it. Confirm before deleting a bot (irreversible: tokens revoked, webhooks and authorizations stop) and before reissuing a token that live services use.

## Tokens and scopes

- Issue one token per service, each with its own name and the minimum scopes; revoke one without touching the others. Scopes are per token; edits apply at once, no reissue.
- Scopes decide which methods work, not what data is visible: the bot still sees only open conversations and channels and its own chats.
- Bot-only scopes: `bot_self:webhook:write` (the bot sets its own outgoing webhook URL) and `bot_self:write` (the bot rotates its own token). The main token of a bot created by API without `webhook.scopes` gets a default set without these and without `user_status:read` — grant them explicitly.
- `pachca_get_bot_scopes` (`pachca bots list-scopes`) lists what can be granted; `pachca_get_token_info` (`pachca oauth token-info`) shows what the current token has.
- Bot tokens never expire: they live until reissued, deleted or the bot is deleted.
- Managing a bot's tokens through the API needs a personal token with `bots:read` and `bots:write`. A chat owner who may edit the bot never sees its tokens.
- Leaked token: reissue (`pachca_reissue_bot_token`, `pachca bots reissue-token`) — the old value dies instantly — then update the services. Keep tokens in env vars or a secret store, never in code.
- Leaked incoming address or Signing secret: neither can be set; each is reissued only by deleting that webhook. Confirm first: the integration stops until the service or handler gets the new value.
  - Incoming: «Удалить вебхук» on its tab, then «Включить». The new address comes with the source, template, engine and the rest of the tab reset: set them again.
  - Outgoing: «Удалить вебхук», or `pachca_update_bot` with `outgoing_url: ""` and `events: []` in one call (without `events_history_enabled: true`). An empty `outgoing_url` alone only pauses delivery and keeps the old secret. Deletion also resets events, mode, commands, history and «Игнорировать свои сообщения»: note them from `pachca_get_bot` first, restore them after, then read the new `webhook.secret_token` (`view: "full"`).
- "Main token" (the unnamed one, else the oldest) is what `webhook.scopes` and the two rotation methods act on. Details: [tokens](https://dev.pachca.com/guides/bots/tokens.md).

## Chat access

- Chat events (new messages, edits and deletions, reactions, button clicks, chat member changes, video calls) come only from chats and threads the bot is a member of, an open conversation or channel included: the bot can read it via API without membership but gets no events until added. Workspace member changes and link unfurling cover the whole workspace, and a form submission goes to the bot that opened the form, so these need no membership ([references/events.md](references/events.md)).
- Add to a conversation or channel with `pachca_add_members` (`pachca members add`), bot `id` in `member_ids`. Add to a thread alone with its `chat_id`: the bot sees the thread and its parent message, not the chat history.
- A `@nickname` mention in a thread adds the bot only if it is a «Публичный бот» and the author is not a guest. A bot outside the parent chat is added this way only while the workspace setting «Использовать сквозные треды» is on (the default). A non-public bot is never added by a mention, even when its creator or an admin writes it: add it by the thread's `chat_id` as above. A mention in a conversation or channel adds no one.
- DMs: an employee can write to the bot only if it is public, shares a non-archived conversation or channel with them, or wrote first (`entity_type: "user"`). A bot cannot be added to an existing DM between two people.
- Opening a DM with the bot fires no event. The bot learns about the employee from their first message — or writes first.

Settings that bite («Основное» tab, [settings](https://dev.pachca.com/guides/bots/settings.md)): a new bot is editable only by its creator (admins do not even see it until the creator ticks «Администраторы» in «Кто может редактировать настройки бота»); chat owners may change settings and webhooks but not name, tokens, OAuth, showcase or deletion. A bot can be in tags only if anyone may add it and «Ограничить одним чатом» is off; setting "who can add" to creator or creator-and-admins, or turning on «Ограничить одним чатом», removes it from tags and tag-joined chats — confirm first.

## Answering in conversations

- Mode «Любые сообщения» for a bot called by mention or in DMs; «Начинающиеся с команд» (exact, case-sensitive first word) for command bots. There is no mentions-only mode: get everything, decide yourself.
- Answer when: it is a DM (`entity_type` `user`), the bot is mentioned (a mention made in the app arrives in `content` as `@` plus the bot's name, one sent by API as `@nickname`: match both as whole words outside code, details → `pachca-ai-agent`), the message starts with a command, or the conversation obviously continues (e.g. a thread with the bot and one employee; check members via chat info).
- Skip your own messages: turn on «Игнорировать свои сообщения» or compare `user_id` with the bot `id` (get it from `pachca_get_my_card` / `pachca profile get` with the bot token). The setting also drops reactions anyone puts on the bot's own messages: a bot that counts reactions on its own poll needs it off and the `user_id` check instead.
- Other bots' messages arrive too, including posts from their incoming webhooks; «Игнорировать свои сообщения» drops only the bot's own. The payload has no bot flag: look the author up with `pachca_get_user` (`pachca users get`, scope `users:read`) and cache `bot: true` per `user_id`. Skip bot authors (also when counting employees for the continuation check) unless reacting to them is the point, or two bots that answer each other loop forever.
- Reply where the message came from. In a conversation or channel prefer a thread: `pachca_create_thread` (`pachca threads add`) returns the existing thread if there is one, then send with `entity_type: "thread"`.
- While working, put a reaction on the message and remove it after replying. With reaction events on, that reaction comes back as an event: skip it by `user_id`.
- Scopes for a talking bot: `messages:create`, `threads:create`, `reactions:write`, `messages:read`, `chats:read`, `profile:read`, plus `users:read` to recognize other bots.
- A mention in a thread invites the person. With the workspace setting «Использовать сквозные треды» on (the default), `skip_invite_mentions: true` keeps them out. With it off, only members of the parent chat are added, and the flag changes nothing (→ `pachca-messaging`, Mentions). Rate and per-chat daily limits: [limits](https://dev.pachca.com/api/limits.md).

## Receiving events (outgoing webhook)

Must-haves; procedure and payload notes in [references/events.md](references/events.md):

- The URL must be public `http`/`https`; local and internal addresses are refused. Develop through a tunnel, or poll the event history.
- Give the final address. Events and button clicks do not follow redirects: a `3xx` (an `http` URL that redirects to `https`, a route that adds a trailing slash, a login page) counts as a failed answer and is not retried. A form submission follows one redirect at most. Check that a `POST` to the URL gets a `2xx` directly.
- Verify `Pachca-Signature` (HMAC-SHA256 of the **raw** body with the Signing secret) and reject a `webhook_timestamp` more than a minute away from now.
- Answer `200` immediately, queue the work. Pachca waits 5 s for a regular event and re-sends it only when it could not connect; an error code or a timeout is never retried. A button click waits up to 30 s, but the employee sees an error only for a failed answer within the first 3 s. A form submission waits 3 s. Neither is re-sent. Turn on event history to recover missed events; it is read with the bot's own token.
- Process idempotently: an event can occasionally arrive twice. Build the dedup key per event type (events.md, section 5).
- Payloads carry the essentials only; fetch the full message by `id` for attachments, buttons, forwards.

## Buttons

- Send messages with buttons using the **bot** token: a Data-button click goes only to the bot that sent the message, and only while the bot is in that chat. Clicks need the «Нажатие кнопок» (`button_click`) event.
- After a click: edit the message (an empty `buttons` array removes all buttons), reply, or open a form with `trigger_id` (lives 3 s).
- Layout: the hard limits are in the `pachca_send_message` `buttons` schema. A row never wraps, so keep 5–6 buttons per row for narrow screens. [Buttons](https://dev.pachca.com/guides/buttons.md).

## Forms

A form opens only from a Data-button click in the bot's message, by `trigger_id`, and the submission must be answered within seconds: 3 in the webhook response, 5 with `pachca_answer_form` (`pachca views submit-response`) for a bot without a webhook URL. Open the form first, do the rest after. An agent working in a chat cannot meet these windows — use a message instead, or build a handler. Full procedure: [references/forms.md](references/forms.md).

## Link unfurling

- Only an admin or the owner turns the «Отправка ссылок в сообщении (unfurl)» event on or off, sets its domains (up to 5), changes such a bot's webhook URL or turns on its event history. Self-registration of the webhook fails for it.
- The bot receives links from every chat, without membership. In DMs `entity_id` is `null`.
- Skip links with `skip: true` (the author hid the preview; if sent anyway it is skipped, not an error). Send previews with `pachca_add_link_preview` (`pachca messages unfurl`) and the `message_id` from the event.
- One bad URL (not in the message, domain not configured) fails the whole request — no previews at all.
- Domains: host only, without protocol, path or port; subdomains included; an IP address works too. A link matches by its host, so its path and port do not matter. Links from another bot's messages, sent by API or by incoming webhook, arrive unless that bot turned off «Показывать превью ссылок» (`link_preview_enabled`, on its incoming webhook tab). It is on by default and turns back on when the incoming webhook is deleted, so links from a bot without an incoming webhook usually arrive. [Link previews](https://dev.pachca.com/guides/link-previews.md).

## Incoming webhook

- Sources: GitLab and Grafana are parsed by Pachca; «Свой формат» posts the `message` field, or a Liquid or Mustache template over any JSON.
- Accepted bodies: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`; anything else gets `415` and nothing is posted.
- `200` does not mean posted: the webhook answers `200` and posts later, to every conversation and channel the bot is in (threads and DMs do not count). Nothing appears, still with `200`, when the bot is in none (body `OK`), when the template result is empty (body `empty_message`) or when the text is over the length limit (body `empty_message`, or `OK` when it fits in characters but not in bytes, typical for Cyrillic). A template syntax error posts a "template error" message into the chats (body `syntax_error` with Liquid, `OK` with Mustache).
- Debug with «Показать последний полученный объект», or `webhook.last_request_body` in bot info (`pachca_get_bot` with `view: "full"`) for a token with `bots:write` whose owner may manage the bot's tokens.
- Template engine default: Liquid for a bot created by API, Mustache for an `empty: true` bot or a re-enabled webhook — pass `template_engine` with `kind`.
- Deleting the webhook kills the address (`404`); re-enabling gives a new one — update the service. [Incoming webhooks](https://dev.pachca.com/guides/incoming-webhooks.md).

## Showcase

- «Публичный бот»: in search and the Overview list; anyone may DM it; any employee (not guests) may add it. Published bot: a card with a page; needs authorization enabled and a saved description (screenshots optional).
- Publishing does not let anyone write to the bot. Authorization happens in the DM, so make a published bot public too.
- Deleting the OAuth client also revokes every authorization granted — confirm first. [Showcase](https://dev.pachca.com/guides/bots/showcase.md).

## Pitfalls

- Bot silent on messages, check in order: bot info (`pachca_get_bot`, `pachca bots get`) has `outgoing_url`, `message_new` in `events`, and `trigger_on: all_messages` or a non-empty `commands`; the bot is a member of that chat, an open one included; in commands mode the command is the literal first word, so `@nickname /task` and `/task,` never match; the URL is the final address, not a redirect. Then turn on event history, send a test message again and read the history with the bot token (`pachca_get_webhook_events`, or `pachca bots list-events` with the token in `PACHCA_TOKEN`; an employee connection has no such tool, which says nothing about the history): the event is there → your URL or handler; no event → settings or membership.
- Incoming webhook chosen for "send to chat X" — it goes to every conversation and channel of the bot.
- Clicks or form submissions never arrive: «Нажатие кнопок» event off, or the buttons were sent with a personal token.
- Waiting for a "user opened the DM" event — there is none.
- Treating a `5xx` or timeout as "Pachca will retry" — it will not.
- Parsing JSON before checking the signature — hash the raw bytes.
- Deleting the outgoing webhook resets mode, events, commands and «Игнорировать свои сообщения», turns off history (saved records stay) and issues a new Signing secret.
- Expecting broader data from more scopes — scopes never widen visibility.

## Read more

- [Bots overview](https://dev.pachca.com/guides/bots/overview.md) · [Create a bot](https://dev.pachca.com/guides/bots/setup.md) · [Settings](https://dev.pachca.com/guides/bots/settings.md)
- [Tokens](https://dev.pachca.com/guides/bots/tokens.md) · [Chat access](https://dev.pachca.com/guides/bots/access.md) · [Conversations](https://dev.pachca.com/guides/bots/conversations.md) · [Showcase](https://dev.pachca.com/guides/bots/showcase.md)
- [Incoming webhooks](https://dev.pachca.com/guides/incoming-webhooks.md) · [Outgoing webhooks](https://dev.pachca.com/guides/webhook/overview.md) · [Events](https://dev.pachca.com/guides/webhook/events.md) · [Handler](https://dev.pachca.com/guides/webhook/handler.md) · [Polling](https://dev.pachca.com/guides/webhook/polling.md)
- [Buttons](https://dev.pachca.com/guides/buttons.md) · [Forms](https://dev.pachca.com/guides/forms/overview.md) · [Form blocks](https://dev.pachca.com/guides/forms/blocks.md) · [Form handling](https://dev.pachca.com/guides/forms/handling.md) · [Link previews](https://dev.pachca.com/guides/link-previews.md)
- [Authorization and scopes](https://dev.pachca.com/api/authorization.md) · [Limits](https://dev.pachca.com/api/limits.md) · [Open-source examples](https://dev.pachca.com/guides/bots/examples.md)
