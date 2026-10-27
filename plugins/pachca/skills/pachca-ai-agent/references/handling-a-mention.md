# Handling a mention, step by step

The full path of one `message_new` event through an agent. Rules come from
[Talking to a bot](https://dev.pachca.com/guides/bots/conversations.md) and
[Interaction with the agent](https://dev.pachca.com/guides/ai-agents/interaction.md).

## Answer the webhook first

Answer the webhook with `200` at once and run the steps below in a background
job: Pachca waits 5 seconds for the answer and does not resend an event after a
timeout ([Webhook handler](https://dev.pachca.com/guides/webhook/handler.md)).
Verify the request signature before anything else; freshness and
deduplication → `pachca-bots`.

## The event fields the agent uses

| Field               | Meaning for the agent                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | The message id: react to it, open a thread under it (not when `entity_type` is `thread`: there are no nested threads, `400`). Quote it with `parent_message_id` only in a reply to the chat where it lives: the new thread under it is another chat (`422`) |
| `entity_type`       | Where the message came from: `user` (DM), `discussion` (conversation or channel), `thread`                                                                                                                                                                  |
| `entity_id`         | The employee id for a DM, the chat id for a conversation, the thread id for a thread                                                                                                                                                                        |
| `chat_id`           | The chat the message lives in; for a thread, the thread's own chat — read history by it                                                                                                                                                                     |
| `user_id`           | The author; equal to the bot's `id` means an own message. The event does not say whether the author is a bot                                                                                                                                                |
| `content`           | The text as Markdown that Pachca builds from the message (can contain quotes and lists). Empty for a message with only a file: the event carries no attachments, buttons or forwarding details                                                              |
| `parent_message_id` | Set when the employee replied to a message («Ответить»): the id of that message, always in the same chat or thread. `null` otherwise                                                                                                                        |
| `thread`            | For a thread: `message_id` (the parent message) and `message_chat_id` (the parent chat)                                                                                                                                                                     |

Get the bot's own `id`, name and nickname once, at start-up, with the own
profile method and the bot token (`pachca_get_my_card`, `pachca profile get`):
the name is `first_name` and `last_name`. Needs `profile:read`. The `id` is also
on the **API** tab of the bot card.

## Step 1. Drop what is not for the agent

1. `user_id` equals the bot's `id` → own message, ignore (or turn on
   «Игнорировать свои сообщения» in the webhook settings).
2. Other bots' messages arrive too: «Игнорировать свои сообщения» drops only the
   bot's own. Look the author up with the user info method (`pachca_get_user`,
   `pachca users get`, needs `users:read`) and cache the answer per `user_id`: a
   bot comes with `bot: true`. Answer a bot only when it mentions you or starts
   with your command. Otherwise the agent answers every post of a notification
   bot, and two agents that take each other for the employee answer each other
   until the send limits stop them ([Limits](https://dev.pachca.com/api/limits.md)).
3. Decide whether the agent is addressed:
   - `entity_type` is `user` → a DM, always addressed;
   - `content` mentions the bot as a whole word (not followed by a letter,
     digit, `_` or `-`, nor by dots with one of those after them: `@kai_bot.`
     at the end of a sentence counts, `@kai_bot.dev` does not) outside inline
     code and code blocks → a mention. A mention made in the Pachca app comes
     as `@` plus the bot's name (`first_name`, and `last_name` when set). One
     sent through the API comes as `@<bot nickname>`. Match both. A plain
     substring test also fires on a longer nickname that starts the same way
     (`@kai_bot` inside `@kai_bot_team`, `@kai_bot-dev` or `@kai_bot.dev`) and
     on a mention in backticks, which Pachca does not count. A mention in a
     quote or a list item still counts. Give the bot a name no employee shares,
     otherwise `@Kai` also matches `@Kai Smith`;
   - `content` starts with one of the bot's commands → a command;
   - a reply to one of the agent's own messages: `parent_message_id` is set and
     that message's `user_id` equals the bot's `id`. Pachca counts a reply as a
     mention of the replied-to author, but `content` has no mention text. Fetch
     the message (`pachca_get_message`, `pachca messages get`) only when
     `parent_message_id` is set;
   - a continuation: for example a thread whose members are only the bot and
     one employee — answer without a mention. Check it with the chat info method
     by the event's `chat_id` (`pachca_get_chat`, `pachca chats get`):
     `member_ids` must contain the bot's own `id` and exactly one other id, and
     that one must not be a bot. A bot in the parent chat also gets messages
     from threads it is not a member of.
4. A forwarded message keeps the original text, but its mentions call nobody.
   The event does not say a message was forwarded: if it matters, fetch the
   message and skip it when `forwarding` is not `null`.
5. Anything else in a conversation, channel or thread is employees talking to
   each other: stay quiet. A bot that answers every message gets in the way.

An employee who adds the mention by editing a message does not call the agent.
The edit does not add the bot to a thread. With only «Новые сообщения» on, no
event arrives; with «Редактирование и удаление сообщений» on, it arrives as
`message_update`, not `message_new`, and only from chats the bot is already in.
Ask employees to mention the agent in a new message.

## Step 2. Show that the agent took the task

Put the `agent-thinking` reaction on the message `id` right away
(`pachca_add_reaction`, `pachca reactions add`) with `name` set to
`agent-thinking` and any non-empty `code`. The employee sees a timer counting
the seconds, up to 5 minutes. Needs `reactions:write`. A `404` here usually
means the workspace has no such reaction: keep working without the indicator
(SKILL.md, "Show that you are working").

## Step 3. Gather the context

| What               | How                                                                                                                   | Note                                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thread history     | List chat messages with `chat_id` from the event (`pachca_list_chat_messages`, `pachca messages list`)                | Newest first, at most 50 per page (`limit`, `cursor`): page back as far as the task needs, then reverse into chronological order. In a DM the chat holds the employee's whole history with the bot: read only the recent part. A bot added only to the thread sees nothing of the chat besides this history and the parent |
| Parent message     | Message info with `thread.message_id` (`pachca_get_message`, `pachca messages get`)                                   | In a fresh thread with no other messages, the parent is the main context. In a standalone thread `thread.message_id` is `null`: skip this step                                                                                                                                                                             |
| Replied-to message | Message info with `parent_message_id` from the event (`pachca_get_message`, `pachca messages get`)                    | In a reply, "@agent check this" refers to this message, not to the latest ones: read it first                                                                                                                                                                                                                              |
| Attachments        | `files` of each message in the history, or message info by `id`. Contents: `pachca_download_file`, `pachca files get` | The request may sit in a file ("@agent summarize this"), and a DM with only a file is still addressed                                                                                                                                                                                                                      |
| Members and topic  | Chat info (`pachca_get_chat`, `pachca chats get`)                                                                     | Who is in the conversation, for whom the answer is                                                                                                                                                                                                                                                                         |

Scopes: `messages:read` and `chats:read`, plus `files:read` for attachment contents.

## Step 4. Do the work

Call API methods and external services. Typical calls from a thread:

- a task from the discussion —
  [New task](https://dev.pachca.com/api/tasks/create.md)
  (`pachca_create_task`, `pachca tasks create`), needs `tasks:create`;
- a message into another chat —
  [New message](https://dev.pachca.com/api/messages/create.md)
  (`pachca_send_message`, `pachca messages create`), needs `messages:create`;
- a separate discussion without a chat —
  [New unattached thread](https://dev.pachca.com/api/threads/create.md)
  (`pachca_create_unattached_thread`, `pachca threads create`), needs
  `threads:create`.

## Step 5. Reply where the message came from

Send the reply with the new message method (`pachca_send_message`,
`pachca messages create`), addressed by where the event came from:

| Came from               | `entity_type` | `entity_id` | How to reply                                                                                                                                                                                                                                                           |
| ----------------------- | ------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DM                      | `user`        | employee id | Same `entity_type` and `entity_id`                                                                                                                                                                                                                                     |
| Conversation or channel | `discussion`  | chat id     | As a thread under the message: create a thread by the message `id` (`pachca_create_thread`, `pachca threads add`), then send with `entity_type: "thread"` and the thread `id`. Replying straight into the chat is possible with the same `entity_type` and `entity_id` |
| Thread                  | `thread`      | thread id   | Same `entity_type` and `entity_id`. `parent_message_id` with a message `id` adds a quote of it                                                                                                                                                                         |

If the message already has a thread, creating a thread returns the existing one,
so the agent does not need to check first. In that thread the agent cannot quote
the event message with `parent_message_id`: the message lives in the parent
chat, and the reply returns `422`. Needs `threads:create` and `messages:create`.

A long result goes as an `.md` file → [rich-answers.md](rich-answers.md);
uploading it needs `uploads:write`.

Buttons can be attached to the reply. A Data-button click does not open
anything by itself: with «Нажатие кнопок» on, the bot gets a click event with
`trigger_id` and can open a form with it (`pachca_open_form`,
`pachca views open`). `trigger_id` lives 3 seconds, so open the form before any
model call → `pachca-bots`.

## Step 6. Remove the reaction

After the reply, remove `agent-thinking` with the remove reaction method
(`pachca_remove_reaction`,
`pachca reactions remove <id> --name agent-thinking --code ⏳ --force`), passing
`name` set to `agent-thinking` again and any non-empty `code`: without `name`
the method looks the reaction up by `code` and does not find it. If the agent
failed, it still replies — with what went wrong — and removes the reaction.

## Sketch

```text
on webhook(request):                     # signature, freshness, dedup → pachca-bots
  enqueue(request.event)
  return 200                             # at once: Pachca waits 5 s, a timeout is not retried

on message_new(event):                   # runs in the background worker
  if event.user_id == BOT_ID: return
  if is_bot(event.user_id) and not (mentions_me(event) or is_command(event)): return   # users get → bot: true, cached per user_id
  if not addressed(event): return        # DM, mention, command, reply to own message, continuation
  react(event.id, code="⏳", name="agent-thinking")    # code: any non-empty value, name picks the reaction
  history = recent_messages(chat_id=event.chat_id)    # newest first, pages of 50: page back, then reverse
  parent  = event.thread?.message_id ? get_message(event.thread.message_id) : none
  replied = event.parent_message_id ? get_message(event.parent_message_id) : none
  result  = do_work(history, parent, replied, event.content)   # reply with the error on failure
  target  = event.entity_type == "discussion"
              ? thread(create_thread(event.id).id)
              : (event.entity_type, event.entity_id)
  send(target, result)                   # long result: .md file
  unreact(event.id, code="⏳", name="agent-thinking")
```

## Starting a conversation in a DM

Opening a DM with the bot produces no event — neither a new chat nor a new
member. The agent learns about the employee from the first message. To write
first (for example, greet a new employee), send a message
(`pachca_send_message`, `pachca messages create`) with `entity_type: "user"`
and the employee id in `entity_id`. After that the employee can reply even if
the bot is not public.
