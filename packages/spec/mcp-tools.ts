/**
 * English prose for every tool in the MCP core.
 *
 * Schemas are generated from `openapi.yaml`; the text below is written by hand
 * and is the part models actually read. Treat every field as a prompt: name,
 * description and parameter docs together decide whether the right tool gets
 * picked. Two rules hold everywhere in this file:
 *
 * 1. Say what the tool is NOT for and name the neighbour that is — collisions
 *    between similar names are the single largest source of wrong calls.
 * 2. Spell out what a newcomer would not guess: the markdown subset, mention
 *    format, cursor semantics, which id a call needs and where it comes from.
 *
 * The list of tools lives in `mcp-core.ts`; this file only describes them.
 */

export interface ToolProse {
  /** Human-readable name shown by clients in permission dialogs. */
  title: string;
  /** What the tool does. First sentence must stand alone. */
  description: string;
  /** Situations that should lead the model here. */
  whenToUse: string[];
  /** Situations that look similar but belong to another tool. */
  notFor: string[];
  /** Realistic invocations, short. */
  examples?: string[];
  /** Error code to next step, so the model can self-correct. */
  errorHints?: Record<string, string>;
  /** Prompts an eval run should route to this tool. */
  goldenPrompts?: string[];
  /**
   * What usually follows a successful call. Rendered as a closing note in the
   * text half of the result, so the next step is visible where the model is
   * already looking instead of only in the description it read once.
   */
  nextSteps?: string[];
}

const MARKDOWN_NOTE =
  'Pachca parses a subset of Markdown: bold, italic, strikethrough, inline code, code blocks and ' +
  'links. Bulleted and numbered lists, quotes and tables are NOT parsed — the `-`, `1.` and `>` ' +
  'characters stay exactly as typed, so write a list as separate lines. A line starting with `#` ' +
  'is recognised, but there is no heading style: the hashes are dropped and the text becomes bold. ' +
  'Mention a person as `@nickname` or `<@user_id>`; any other spelling notifies nobody. For a ' +
  'table, a checklist or a diagram, attach a `.md` file instead — Pachca renders the file as a ' +
  'formatted card.';

const CURSOR_NOTE =
  'Paginated with an opaque cursor. Do not parse, build or store cursors between sessions, and do ' +
  'not decide you reached the end because fewer items came back than the limit — a short page is ' +
  'normal. The end is `has_next: false`.';

export const MCP_TOOL_PROSE: Record<string, ToolProse> = {
  // ── Search ───────────────────────────────────────────────────────────────
  search_messages: {
    title: 'Search messages',
    description:
      'Full-text search across messages the caller can see. Narrow it with `chat_ids` and a date ' +
      'window (`created_from`, `created_to`) instead of searching the whole workspace. Results are ' +
      'ranked by relevance, not by time, and search pages differently from list tools: there is no ' +
      '`has_next` — you have reached the end when the returned count equals the reported total.',
    whenToUse: [
      'The person asks where something was discussed or who said something.',
      'You need one specific message and know roughly what it said.',
    ],
    notFor: [
      'Reading a conversation in order — use `read_chat`, which returns messages chronologically.',
      'Finding a chat by its name — use `search_chats`.',
    ],
    errorHints: {
      empty_result:
        'Broaden the query, drop the date window, or search without `chat_ids`. Search matches words, not substrings.',
    },
    goldenPrompts: ['где обсуждали переезд на новый тариф', 'найди сообщение про отчёт за август'],
    nextSteps: [
      'Open the surrounding conversation with `read_chat`, or the discussion with `read_thread`.',
    ],
    examples: [
      'search_messages(query: "договор аренды", chat_ids: [5501]) — только в указанных чатах',
    ],
  },

  search_chats: {
    title: 'Search chats',
    description:
      'Find a chat or channel by name or description. Returns the chat card — id, name, type, ' +
      'settings — so a match here is usually enough to act on without a second call.',
    whenToUse: [
      'The person names a chat and you do not have its id.',
      'You need to check whether a channel on some topic already exists.',
    ],
    notFor: [
      'Listing the chats the caller already belongs to — use `list_chats`.',
      'Searching message text — use `search_messages`.',
    ],
    goldenPrompts: ['найди канал про дизайн'],
    nextSteps: [
      'Read it with `read_chat`, or write into it with `send_message`.',
    ],
  },

  search_users: {
    title: 'Search people',
    description:
      'Find a colleague by name, email, department or job title. Returns their card, including the ' +
      'current status. Email and phone come back empty unless the workspace allows showing personal ' +
      'data — an administrator always sees them, a bot token never inherits that privilege, and ' +
      'one’s own contacts are always visible.',
    whenToUse: [
      'The person names a colleague and you need their id to write to them or assign a task.',
    ],
    notFor: [
      'Looking up someone whose id you already have — use `read_user`.',
      'Listing the members of a chat — use `list_chat_members`.',
    ],
    goldenPrompts: ['найди Петю из разработки'],
    nextSteps: [
      'Write to them with `send_message`, or assign work with `create_task`.',
    ],
  },

  // ── Read ─────────────────────────────────────────────────────────────────
  read_chat: {
    title: 'Read a chat',
    description:
      'Open a chat and read its messages in order, newest first by default. ' +
      CURSOR_NOTE +
      ' There is no date filter here: to cover a period you page backwards until you pass the date, ' +
      'or use `search_messages`, which does take a date window but ranks by relevance.',
    whenToUse: [
      'Summarising or catching up on a conversation.',
      'You need the last messages of a chat you already identified.',
    ],
    notFor: [
      'Reading a thread — use `read_thread`, which returns the discussion in one call.',
      'Finding a chat you cannot name — use `search_chats`.',
      'Learning what the chat itself is — its name, kind and settings come from `read_chat_info`.',
    ],
    errorHints: {
      chat_not_found: 'The id is wrong or the caller is not a member. Call `search_chats` to get a valid id.',
    },
    goldenPrompts: ['перескажи, что было в канале за сегодня'],
    nextSteps: [
      'Follow a discussion with `read_thread`.',
      'Answer with `send_message`, or in the thread with `reply_in_thread`.',
    ],
  },

  read_message: {
    title: 'Read a message',
    description:
      'One message by id: text, author, attachments, and whether a thread hangs off it. Reactions ' +
      'are not part of the message — read them with `list_reactions`. Ids arrive in webhooks, in ' +
      'links people paste, and in the output of the search and list tools. Two things to watch. A ' +
      'deleted message still answers successfully, with empty text and no attachments — check ' +
      '`deleted_at` before reporting that someone wrote nothing. And an attachment link lives up to ' +
      'seven days from when it was issued, often less; if it has expired, read the message again for ' +
      'a fresh one. Some workspaces serve attachments through the API instead of storage, and those ' +
      'links open only with a token from a trusted network — you may simply be unable to fetch them.',
    whenToUse: [
      'A message id came from outside and you need to know what it says.',
      'You are about to reply or react and want to see the message first.',
      'Someone asks what is attached to a message — the files come back with it, there is nothing else to call.',
    ],
    notFor: ['Reading the discussion under a message — use `read_thread`.'],
    nextSteps: [
      'Discuss it with `reply_in_thread`.',
      'See who reacted with `list_reactions`.',
    ],
  },

  read_thread: {
    title: 'Read a discussion',
    description:
      'A thread in full: its card and all messages, in one call. A thread in Pachca is its own unit ' +
      'of access, not a slice of the chat: anyone can be brought into it without being given the ' +
      'chat, and they then see the thread and the parent message — nothing else from the chat.',
    whenToUse: [
      'Summarising a discussion or catching up on what was decided.',
      'You are about to reply and need the context.',
    ],
    notFor: ['Reading the chat the thread lives in — use `read_chat`.'],
    goldenPrompts: ['перескажи обсуждение и выпиши решения'],
    nextSteps: [
      'Answer with `reply_in_thread`.',
    ],
    errorHints: {
      not_found:
        'The id is a thread id, not the id of the message a thread hangs off. Open the message and take `thread.id` from it.',
    },
  },

  read_chat_info: {
    title: 'Chat details',
    description:
      'The card of a chat by id: name, type, settings, who is in it. Use it when the id came from ' +
      'outside — a webhook, a link, an earlier turn — and you cannot say what the chat is.',
    whenToUse: ['You hold a chat id and need to name it before acting.'],
    notFor: ['Reading messages — use `read_chat`.'],
  },

  read_user: {
    title: 'Person details',
    description:
      'The card of a colleague by id: name, job title, department, workspace role, tags, and their ' +
      'current status with its expiry. There is no separate tool for reading a status — it is part ' +
      'of this card. Two cautions: the role here is the workspace role and says nothing about what ' +
      'they may do in a given chat, and email and phone come back empty unless the workspace allows ' +
      'showing personal data.',
    whenToUse: [
      'You hold a user id and need to know who it is.',
      'You want to check whether someone is away before writing to them.',
    ],
    notFor: ['Finding someone by name — use `search_users`.'],
  },

  // ── List ─────────────────────────────────────────────────────────────────
  list_chats: {
    title: 'My chats',
    description:
      'Chats and channels available to the caller, filterable by the time of the last message. ' +
      'This is the entry point for anything spanning several chats: find where activity happened, ' +
      'then open those chats. ' +
      CURSOR_NOTE,
    whenToUse: [
      'Building a digest across chats.',
      'The person asks what has been going on lately.',
    ],
    notFor: ['Finding a chat the caller is not in — use `search_chats`.'],
    goldenPrompts: ['что происходило на этой неделе'],
    nextSteps: [
      'Open the ones that moved with `read_chat`.',
    ],
  },

  list_chat_members: {
    title: 'Chat members',
    description:
      'Who is in a chat. ' +
      CURSOR_NOTE +
      ' Careful with roles: the `role` field on each person is their role in the workspace, not in ' +
      'this chat. The chat role is not returned at all — to find who holds one, filter with the ' +
      '`role` argument (owner, admin, editor or member) and see who comes back.',
    whenToUse: [
      'Checking whether someone is already in a chat before inviting them.',
      'Finding out who may write in a channel — filter by editor.',
    ],
    notFor: ['Searching people across the workspace — use `search_users`.'],
    nextSteps: [
      'Look someone up with `read_user`.',
    ],
    examples: [
      'list_chat_members(chat_id: 5501, role: "editor") — кто в канале может писать',
    ],
  },

  list_threads: {
    title: 'My discussions',
    description:
      'Threads the caller takes part in — either in the thread itself or in the chat it was created ' +
      'in. Filterable by the time of the last message, so "what moved this week" is one call.',
    whenToUse: ['Catching up on open discussions.', 'Building a digest of ongoing work.'],
    notFor: ['Reading one discussion — use `read_thread`.'],
    goldenPrompts: ['какие обсуждения шевелились на этой неделе'],
    nextSteps: [
      'Read a discussion in full with `read_thread`.',
    ],
  },

  list_tasks: {
    title: 'My tasks',
    description:
      'Tasks visible to the caller, filterable by state, chat and assignee. Returns whole task ' +
      'records, so there is no separate call to open one.',
    whenToUse: ['The person asks what is on their plate or what is overdue.'],
    notFor: ['Creating or closing a task — use `create_task` and `update_task`.'],
    goldenPrompts: ['покажи мои задачи на эту неделю'],
    nextSteps: [
      'Close or move one with `update_task`.',
    ],
    examples: [
      'list_tasks(status: "undone")',
    ],
  },

  list_reactions: {
    title: 'Reactions on a message',
    description:
      'Who reacted to a message and with what. Read this before adding a reaction so you do not ' +
      'repeat one that is already there, and to answer questions like who agreed.',
    whenToUse: ['The person asks who reacted, agreed or acknowledged.'],
    notFor: ['Adding or removing a reaction — use `add_reaction` and `remove_reaction`.'],
  },

  // ── Write into a conversation ────────────────────────────────────────────
  send_message: {
    title: 'Send a message',
    description:
      'Write into a chat or a direct message. Set `parent_message_id` to answer a specific message ' +
      'as a chained reply — it stays in the chat feed and points at the original. ' +
      MARKDOWN_NOTE +
      ' The chat of a thread is an ordinary chat: passing its id sends the message into that ' +
      'discussion, which is the same as replying in the thread. Writing to a person directly works ' +
      'from a personal token always, and from a bot only when the bot is public or has written to ' +
      'that person before.' +
      ' Rate limits: about four sends per second per chat, thirty requests per five seconds across ' +
      'all chats together, and 7,500 messages per chat per rolling day from one sender. Hitting the ' +
      'daily cap pauses sending to that chat for an hour, and every further attempt during the ' +
      'pause doubles it.',
    whenToUse: [
      'The person asks to write, announce or notify.',
      'Answering someone in the chat feed rather than moving the discussion aside.',
    ],
    notFor: [
      'Moving the discussion into a thread, or continuing one — use `reply_in_thread`.',
      'Attaching a file — use `send_file`, which sends text and file together.',
    ],
    errorHints: {
      chat_not_found: 'Call `search_chats` or `list_chats` to get a valid id.',
      forbidden:
        'In a channel only editors and administrators may write; a subscriber cannot. They can still ' +
        'comment in the threads of that channel, which is often what the person actually wants — ' +
        'offer that instead of retrying.',
      rate_limited: 'Wait for the interval named in `Retry-After` before sending again.',
    },
    goldenPrompts: ['напиши в канал, что релиз выехал'],
    nextSteps: [
      'The result carries the link to the message — hand it to the person.',
    ],
    examples: [
      'send_message(chat_id: 5501, content: "Смена начинается в 9")',
      'send_message(user_id: 7720, content: "Смена начинается в 9") — в личную переписку',
      'send_message(chat_id: 5501, parent_message_id: 880011, content: "Согласен") — ответ цепочкой в ленте чата, не в треде',
    ],
  },

  reply_in_thread: {
    title: 'Reply in a discussion',
    description:
      'Answer inside a thread. You never need to check first whether a thread exists: pass the ' +
      'message id and this tool creates the thread if there is none and continues it if there is. ' +
      'Passing a thread id works too, when you already have one. ' +
      'Inside a thread `parent_message_id` chains one comment to another. People mentioned in a ' +
      'thread reply are pulled into the thread automatically; `skip_invite_mentions` prevents that. ' +
      MARKDOWN_NOTE,
    whenToUse: [
      'Answering a specific message so the chat feed stays clean.',
      'Continuing a discussion you have just read.',
    ],
    notFor: [
      'Writing into the chat feed — use `send_message`.',
      'Starting a discussion attached to nothing — use `create_standalone_thread`.',
    ],
    errorHints: {
      not_found: 'A thread cannot be created on a deleted message.',
      bad_request:
        'A message that is itself inside a thread cannot carry another thread — threads do not ' +
        'nest. Reply into the same discussion instead.',
    },
    goldenPrompts: ['ответь ему в треде, что посмотрю завтра'],
    nextSteps: [
      'The result carries the thread and the link to the comment.',
    ],
    examples: [
      'reply_in_thread(message_id: 880011, content: "Согласен") — по сообщению; тред создастся, если его нет',
      'reply_in_thread(thread_id: 44102, content: "Согласен") — в уже известный тред',
    ],
  },

  send_file: {
    title: 'Send a file',
    description:
      'Attach a file to a message and send it. Pass a filename and the content; the server obtains ' +
      'the signature, uploads the bytes and posts the message. A report written as `.md` renders in ' +
      'Pachca as a formatted card, which is the usual way an agent hands over long output.',
    whenToUse: [
      'Handing over a report, export or summary that is too long for a message.',
      'The person asks to send something as a file.',
    ],
    notFor: ['Sending plain text — use `send_message`.'],
    goldenPrompts: ['пришли отчёт файлом в чат команды'],
    nextSteps: [
      'The result carries the link to the message with the file attached.',
    ],
    errorHints: {
      forbidden:
        'Same rule as sending a message: in a channel only editors and administrators may write.',
    },
    examples: [
      'send_file(chat_id: 5501, filename: "notes.md", content: "# Итоги встречи")',
      'send_file(chat_id: 5501, filename: "notes.md", content: "# Итоги встречи", comment: "Итоги за неделю") — content уходит в файл, comment — подписью к нему',
    ],
  },

  create_standalone_thread: {
    title: 'Start a standalone discussion',
    description:
      'Create a discussion that hangs off nothing — no parent message, its own space with only the ' +
      'people invited into it. This creates a permanent space in the workspace: there is no way ' +
      'to delete a thread afterwards, here or through the API, so confirm the topic and who is ' +
      'coming before creating one, even when you were told to create it. Without this tool, ' +
      'starting a discussion means posting a decoy message first and threading on it, which ' +
      'looks like the agent doing something odd.',
    whenToUse: ['The person asks to open a discussion on a topic rather than about a message.'],
    notFor: [
      'Discussing an existing message — use `reply_in_thread`, which creates the thread itself.',
      'Creating a chat with a feed and members — use `create_chat`.',
    ],
    nextSteps: [
      'Invite people with `add_chat_members` using the thread\'s chat id.',
      'Open the discussion with `reply_in_thread`.',
    ],
  },

  add_reaction: {
    title: 'Add a reaction',
    description:
      'React to a message with an emoji. Often the right answer to an acknowledgement: a reaction ' +
      'is quieter than a message and leaves the conversation short. Setting the same reaction ' +
      'twice changes nothing.',
    whenToUse: ['Acknowledging without adding noise to the chat.'],
    notFor: ['Answering with words — use `send_message` or `reply_in_thread`.'],
    errorHints: {
      unprocessable:
        'The value is not an emoji the workspace knows. Custom emoji go in `name`, not `code`.',
    },
  },

  remove_reaction: {
    title: 'Remove a reaction',
    description:
      'Take back a reaction. Read `list_reactions` first if you need to know what is already there.',
    whenToUse: ['Undoing a reaction that was placed by mistake.'],
    notFor: ['Seeing who reacted — use `list_reactions`.'],
    errorHints: {
      not_found:
        'That reaction is not yours or was already removed. `list_reactions` shows what is actually there.',
    },
  },

  update_message: {
    title: 'Edit a message',
    description:
      'Replace the text of a message. The previous text is gone — this is not a comment or an ' +
      'addition. Attachments are untouched: editing the text neither removes nor re-uploads them. ' +
      'Use it to fix your own post; editing someone else’s message is not something an agent should ' +
      'do on its own, even when the token allows it.',
    whenToUse: ['Correcting a message the agent itself has just sent.'],
    notFor: ['Adding to a discussion — reply instead, so the history stays readable.'],
    errorHints: {
      forbidden:
        'Only the author edits a message. Nobody edits a message written by another person.',
      not_found:
        'The message is deleted. A deleted message still answers reads, but cannot be edited.',
    },
  },

  // ── Change who is in the room ────────────────────────────────────────────
  create_chat: {
    title: 'Create a chat',
    description:
      'Create a channel or a conversation. The two differ in who may speak: in a conversation every ' +
      'participant writes, while a channel has subscribers who read and editors who write, so a ' +
      'channel suits announcements and a feed, a conversation suits a working group. The kind is ' +
      'fixed at creation and cannot be changed afterwards — a conversation never becomes a channel. ' +
      'Visibility is a separate axis: an open chat is visible to everyone in the workspace even ' +
      'without joining, a closed one only to its members, and that holds for administrators too. ' +
      'This creates a visible space other people are added to, so confirm the name, the kind and the ' +
      'participants first. For a side discussion a thread is enough and does not expose the chat to ' +
      'the people invited into it.',
    whenToUse: ['The person asks for a new channel or a space for a piece of work.'],
    notFor: ['Opening a discussion inside an existing chat — use `create_standalone_thread`.'],
    nextSteps: [
      'Add more people with `add_chat_members`.',
      'Write the first message with `send_message`.',
    ],
    examples: [
      'create_chat(name: "Закупки") — закрытая беседа',
      'create_chat(name: "Объявления", channel: true, public: true) — открытый канал: две независимые настройки',
    ],
  },

  add_chat_members: {
    title: 'Add members',
    description:
      'Invite people into an existing chat. The chat role is decided at this moment and never ' +
      'recalculated later: an owner or administrator of the workspace arrives as a chat admin, a bot ' +
      'added to a channel arrives as an editor, everyone else as a participant — or, in a channel, ' +
      'as a subscriber who reads but does not write. Granting the right to write in a channel is a ' +
      'separate step afterwards. Confirm who is being added before the call: it changes who can read ' +
      'the conversation from here on. Someone already in the chat is skipped and not notified again.',
    whenToUse: ['The person names colleagues who should join a chat.'],
    notFor: ['Mentioning someone so they see one thread — a mention in a thread reply does that.'],
    errorHints: {
      not_found:
        'One of the ids is not an employee of this workspace. Resolve people with `search_users` first.',
    },
  },

  // ── Tasks and own status ─────────────────────────────────────────────────
  create_task: {
    title: 'Create a task',
    description:
      'Create a task with text, an assignee and a due date. When the request names a deadline, it ' +
      'goes into `due_at`: resolve a relative one — tomorrow, by Friday, next week — against ' +
      'today\'s date yourself rather than asking the person for it, and leave `due_at` out only ' +
      'when no deadline was mentioned. A task assigned to someone else is visible to them and ' +
      'notifies them, so confirm before assigning work to another person.',
    whenToUse: ['The person asks to note something to do, or to give work to a colleague.'],
    notFor: ['Writing a reminder into a chat — that is a message, not a task.'],
    goldenPrompts: ['поставь мне задачу дописать отчёт к пятнице'],
    nextSteps: [
      'The result carries the task id; change or close it later with `update_task`.',
    ],
    errorHints: {
      unprocessable:
        '`kind` takes one of five values — call, meeting, reminder, event, email — and the text of the task goes in `content`.',
    },
    examples: [
      'create_task(kind: "call", content: "обсудить договор") — kind выбирается из списка, текст задачи идёт в content',
    ],
  },

  update_task: {
    title: 'Update a task',
    description:
      'Change a task — its text, assignee, due date, or mark it done. Only the fields you pass are ' +
      'changed. Ids come from `list_tasks`.',
    whenToUse: ['Closing a finished task, moving a deadline, reassigning work.'],
    notFor: ['Creating a new task — use `create_task`.'],
    goldenPrompts: ['отметь задачу про отчёт выполненной'],
    errorHints: {
      forbidden:
        'A task belonging to someone else cannot be changed. Check `performer_ids` before writing.',
    },
    examples: [
      'update_task(task_id: 9105, status: "done")',
      'update_task(task_id: 9105, performer_ids: [7721]) — передаются только меняющиеся поля',
    ],
  },

  update_my_status: {
    title: 'Set my status',
    description:
      'Set the caller’s own status: an emoji, a text of up to 50 characters, and an expiry after ' +
      'which it clears itself. Pass the explicit clear flag to remove a status now. This only ever ' +
      'touches the caller — setting someone else’s status is an administrative action outside this ' +
      'tool set.',
    whenToUse: ['The person says they are in a meeting, away, or on holiday until some time.'],
    notFor: ['Reading a status — it is part of the card returned by `read_user`.'],
    goldenPrompts: ['поставь статус «на встрече» до 15:00'],
  },

  // ── Service tools ────────────────────────────────────────────────────────
  search_documentation: {
    title: 'Search the documentation',
    description:
      'Look up how something works in Pachca — webhooks, signatures, pagination, form fields, token ' +
      'types. Returns pages with a short extract and a link. Use it instead of recalling: the ' +
      'documentation is current, your memory of it may not be.',
    whenToUse: [
      'The person asks how something in Pachca works.',
      'You are about to write integration code and need the contract.',
      'A request has no tool here — look up how it is done through the API before answering, so the ' +
        'person gets a method and its requirements instead of a refusal.',
    ],
    notFor: ['Searching messages inside the workspace — use `search_messages`.'],
  },

  get_instructions: {
    title: 'Working rules for an area',
    description:
      'Detailed rules for one area — what the formatting subset renders, how threads behave, how ' +
      'pagination ends, which mistakes are common. Read it once before working in an area rather ' +
      'than carrying every rule in context all the time.',
    whenToUse: ['You are about to work in an area for the first time in this session.'],
    notFor: ['A question about the API contract — use `search_documentation`.'],
  },

  search: {
    title: 'Search Pachca',
    description:
      'Generic search across messages, chats, people and files, returning identifiers with short ' +
      'extracts. A compatibility surface for clients that expect exactly this pair; when the core ' +
      'search tools are available, they are narrower and better.',
    whenToUse: ['Your client offers no other way to search Pachca.'],
    notFor: ['Anything the core search tools can do — prefer `search_messages`, `search_chats`, `search_users`.'],
  },

  fetch: {
    title: 'Fetch by identifier',
    description:
      'Return the full record behind an identifier produced by `search`. The compatibility half of ' +
      'the generic pair.',
    whenToUse: ['You have an identifier from `search` and need its content.'],
    notFor: ['Opening a chat, message or discussion when the core read tools are available.'],
  },
};
