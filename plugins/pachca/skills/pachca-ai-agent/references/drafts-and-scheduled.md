# Drafts and scheduled messages: what a bot-hosted agent does

Source: [Draft instead of sending](https://dev.pachca.com/guides/ai-agents/drafts.md).

A sent message has already been read: if the agent wrote to the wrong chat, in
the wrong tone or to the wrong employee, deleting it does not help — the
notification went out. A draft removes the irreversibility: the text appears in
the input box of the chat, and the employee decides to edit, send or erase it.
A scheduled message goes out by itself at the set time, in the employee's name.

## A bot cannot make them

Drafts and scheduled messages need a token that belongs to the employee: a
personal token, a CLI sign-in
([CLI authentication](https://dev.pachca.com/guides/cli/authentication.md)) or
the MCP browser sign-in. The `drafts:read` and `drafts:write` scopes are not
issued to bot tokens, and the methods answer `403` to a bot token. They also
cannot go into a bot's authorization scope set: a bot's set holds only scopes
the bot itself can have, so a bot-hosted agent cannot get them through the
employee's authorization of the bot (`pachca-oauth`) either.

## What the agent does instead

| The employee says                                | A bot-hosted agent                                                                                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Answer in the thread"                           | Sends the reply                                                                                                                                                                                     |
| "Prepare a reply to the client, I will check it" | Sends the text to the caller as a clearly marked proposal in the DM with the bot, and the caller sends it themselves                                                                                |
| "Remind the team on Monday morning"              | Keeps its own scheduler and sends at that time with the bot token, or creates a reminder task ([New task](https://dev.pachca.com/api/tasks/create.md), `pachca_create_task`, `pachca tasks create`) |

The proposal goes into the thread instead only when the person the reply is for
cannot read that thread: they are a member of neither the thread nor its parent
chat, and when the parent chat is open (`public: true`), their role is `guest`
or `multi_guest`. If you cannot check, use the DM.

For its own scheduler the agent turns "Monday morning" into a moment in the
caller's time zone: `time_zone` from the user info method (`pachca_get_user`,
`pachca users get`). `null` means the workspace time zone, which the API does
not return: the agent asks the caller which zone is meant. When it accepts the
task, it repeats the chat and the exact time back to the caller, because nobody
checks the message when it goes out.

## An agent with the employee's own sign-in

An agent that works with the employee's own token (from Claude, Cursor, the CLI
or its own service) can make drafts and scheduled messages. The procedure — the
`409` on a second draft in a chat, updating attachments, sending a draft,
`schedule` and time zones, limits — is in the `pachca-messaging` skill, with
background in [Draft instead of sending](https://dev.pachca.com/guides/ai-agents/drafts.md).
