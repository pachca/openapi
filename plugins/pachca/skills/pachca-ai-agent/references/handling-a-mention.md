# Handling a mention, step by step

The full path of one `message_new` event through an agent. Rules come from
[Talking to a bot](https://dev.pachca.com/guides/bots/conversations.md) and
[Interaction with the agent](https://dev.pachca.com/guides/ai-agents/interaction.md).

## The event fields the agent uses

| Field         | Meaning for the agent                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| `id`          | The message id: react to it, open a thread under it, quote it                              |
| `entity_type` | Where the message came from: `user` (DM), `discussion` (conversation or channel), `thread` |
| `entity_id`   | The employee id for a DM, the chat id for a conversation, the thread id for a thread       |
| `chat_id`     | The chat the message lives in; for a thread, the thread's own chat — read history by it    |
| `user_id`     | The author; equal to the bot's `id` means an own message                                   |
| `content`     | The text as Markdown that Pachca builds from the message (can contain quotes and lists)    |
| `thread`      | For a thread: `message_id` (the parent message) and `message_chat_id` (the parent chat)    |

Get the bot's own `id` and nickname once, at start-up, with the own profile
method and the bot token (`pachca_get_my_card`, `pachca profile get`). The `id`
is also on the **API** tab of the bot card.

## Step 1. Drop what is not for the agent

1. `user_id` equals the bot's `id` → own message, ignore (or turn on
   «Игнорировать свои сообщения» in the webhook settings).
2. Decide whether the agent is addressed:
   - `entity_type` is `user` → a DM, always addressed;
   - `content` contains `@<bot nickname>` → a mention;
   - `content` starts with one of the bot's commands → a command;
   - a continuation: for example a thread where besides the bot there is only
     one employee — answer without a mention. Check the thread members with the
     chat info method by the event's `chat_id` (`pachca_get_chat`, `pachca chats get`).
3. Anything else in a conversation, channel or thread is employees talking to
   each other: stay quiet. A bot that answers every message gets in the way.

Verify the request signature before any of this → `pachca-bots`.

## Step 2. Show that the agent took the task

Put the `agent-thinking` reaction on the message `id` right away
(`pachca_add_reaction`, `pachca reactions add`) with `name` set to
`agent-thinking`, without colons. `code` is required too: for a custom
reaction any non-empty value goes, `name` picks the reaction. The employee sees a timer counting the seconds, up to
5 minutes. Needs `reactions:write`.

## Step 3. Gather the context

| What              | How                                                                                                    | Note                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Thread history    | List chat messages with `chat_id` from the event (`pachca_list_chat_messages`, `pachca messages list`) | A bot added only to the thread sees nothing of the chat besides this history and the parent                                                    |
| Parent message    | Message info with `thread.message_id` (`pachca_get_message`, `pachca messages get`)                    | In a fresh thread with no other messages, the parent is the main context. In a standalone thread `thread.message_id` is `null`: skip this step |
| Members and topic | Chat info (`pachca_get_chat`, `pachca chats get`)                                                      | Who is in the conversation, for whom the answer is                                                                                             |

Scopes: `messages:read` and `chats:read`.

## Step 4. Do the work

Call API methods and external services. Typical calls from a thread:

- a task from the discussion — [New reminder](https://dev.pachca.com/api/tasks/create.md);
- a message into another chat — [New message](https://dev.pachca.com/api/messages/create.md);
- a separate discussion without a chat — [New standalone thread](https://dev.pachca.com/api/threads/create.md).

Each needs its own scope on the bot token.

## Step 5. Reply where the message came from

| Came from               | `entity_type` | `entity_id` | How to reply                                                                                                                                                                                                                                                           |
| ----------------------- | ------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DM                      | `user`        | employee id | Same `entity_type` and `entity_id`                                                                                                                                                                                                                                     |
| Conversation or channel | `discussion`  | chat id     | As a thread under the message: create a thread by the message `id` (`pachca_create_thread`, `pachca threads add`), then send with `entity_type: "thread"` and the thread `id`. Replying straight into the chat is possible with the same `entity_type` and `entity_id` |
| Thread                  | `thread`      | thread id   | Same `entity_type` and `entity_id`. `parent_message_id` with a message `id` adds a quote of it                                                                                                                                                                         |

If the message already has a thread, creating a thread returns the existing one,
so the agent does not need to check first. Needs `threads:create` and
`messages:create`.

A long result goes as an `.md` file → [rich-answers.md](rich-answers.md).
Buttons can be attached to the reply and open a form on click; clicks arrive as
an event only with «Нажатие кнопок» on → `pachca-bots`.

## Step 6. Remove the reaction

After the reply, remove `agent-thinking` with the remove reaction method
(`pachca_remove_reaction`, `pachca reactions remove`). If the agent failed,
it still replies — with what went wrong — and removes the reaction.

## Sketch

```text
on message_new(event):
  if event.user_id == BOT_ID: return
  if not addressed(event): return            # DM, @nickname, command, continuation
  react(event.id, name="agent-thinking")
  history = list_messages(chat_id=event.chat_id)
  parent  = event.thread?.message_id ? get_message(event.thread.message_id) : none
  result  = do_work(history, parent, event.content)   # reply with the error on failure
  target  = event.entity_type == "discussion"
              ? thread(create_thread(event.id).id)
              : (event.entity_type, event.entity_id)
  send(target, result)                        # long result: .md file
  unreact(event.id, name="agent-thinking")
```

## Starting a conversation in a DM

Opening a DM with the bot produces no event — neither a new chat nor a new
member. The agent learns about the employee from the first message. To write
first (for example, greet a new employee), send a message with
`entity_type: "user"` and the employee id in `entity_id`. After that the
employee can reply even if the bot is not public.
