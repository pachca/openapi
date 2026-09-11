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
 * Many tools here carry several branches, picked by the arguments. The
 * description names every branch and the argument that picks it, because a
 * branch the model does not know about is a capability it will never use.
 *
 * The list of tools lives in `mcp-core.ts`; this file only describes them.
 */

export interface ToolProse {
  /** Human-readable name shown by clients in permission dialogs. */
  title: string;
  /** What the tool does. First sentence must stand alone. */
  description: string;
  /**
   * Text that belongs to one branch, keyed by its operation (`GET /audit_events`).
   * It joins the description only in the listings where that branch is open, so
   * an employee never reads about the security log they cannot open.
   */
  branchText?: Record<string, string>;
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
  'loses the hashes and becomes bold. Mention a person as `@nickname` or `<@user_id>`; any other ' +
  'spelling notifies nobody. For a table, a checklist or a diagram, attach a `.md` file instead — ' +
  'Pachca renders the file as a formatted card.';

const CURSOR_NOTE =
  'Paginated with an opaque cursor. Do not decide you reached the end because fewer items came ' +
  'back than the limit — a short page is normal. The end is `has_next: false`.';

/** Search pages without `has_next`; a tool that switches to search on `query` has to say so. */
const SEARCH_END_NOTE =
  'With `query` the results come from search, which has no `has_next`: the end is an empty page ' +
  'or the count reaching `total`.';

export const MCP_TOOL_PROSE: Record<string, ToolProse> = {
  // ── Search and read ─────────────────────────────────────────────────────
  search_messages: {
    title: 'Search messages',
    description:
      'Full-text search across messages the caller can see. Narrow it with `chat_ids` and a date ' +
      'window (`created_from`, `created_to`) instead of searching the whole workspace. Results are ' +
      'ranked by relevance, not by time, and search pages differently from list tools: there is no ' +
      '`has_next` — you have reached the end on an empty page or when the returned count equals `total`.',
    whenToUse: [
      'The person asks where something was discussed or who said something.',
      'You need one specific message and know roughly what it said.',
    ],
    notFor: [
      'Reading a conversation in order — use `read_chat`, which returns messages chronologically.',
      'Finding a chat by its name — use `list_chats` with `query`.',
    ],
    errorHints: {
      empty_result:
        'Broaden the query, drop the date window, or search without `chat_ids`. Search matches words, not substrings.',
    },
    goldenPrompts: ['где обсуждали переезд на новый тариф', 'найди сообщение про отчёт за август'],
    nextSteps: ['Open the surrounding chat or thread with `read_chat`.'],
    examples: ['search_messages(query: "договор аренды", chat_ids: [5501]) — только в указанных чатах'],
  },

  list_chats: {
    title: 'Chats',
    description:
      'Chats and channels. Without `query` it lists the chats you are in, most recently active ' +
      'first, filterable by the time of the last message — the entry point for any digest across ' +
      'chats. With `query` it finds chats by name or description among the chats you can see. ' +
      CURSOR_NOTE +
      ' ' +
      SEARCH_END_NOTE,
    branchText: {
      'GET /company/chats':
        'With `workspace` it lists every conversation and channel of the workspace, private ones ' +
        'included; each such call is written to the security log.',
    },
    whenToUse: [
      'The person names a chat and you do not have its id — pass the name as `query`.',
      'Building a digest: which chats moved lately.',
    ],
    notFor: [
      'Threads you take part in — use `list_threads`.',
      'Searching message text — use `search_messages`.',
    ],
    goldenPrompts: ['что происходило на этой неделе', 'найди канал про дизайн'],
    nextSteps: ['Open one with `read_chat`, or write into it with `send_message`.'],
  },

  read_chat: {
    title: 'Read a chat or thread',
    description:
      'Open a chat, channel, direct message or thread: its card — name, kind, settings — and its ' +
      'messages in order, newest first by default. Pass `chat_id`, or `thread_id` for a thread. A ' +
      'thread id is not the id of the message the thread hangs off: take `thread.id` from that ' +
      'message. A thread is its own unit of access — people brought into it see the thread and its ' +
      'parent message, nothing else of the chat. ' +
      CURSOR_NOTE +
      ' There is no date filter: to cover a period, page back until you pass the date, or use ' +
      '`search_messages`, which takes a date window but ranks by relevance.',
    whenToUse: [
      'Summarising or catching up on a chat or a discussion.',
      'A chat id came from outside — a webhook, a link — and you need to say what the chat is.',
    ],
    notFor: [
      'One message with its reactions or readers — use `read_message`.',
      'Finding a chat by name — use `list_chats` with `query`.',
    ],
    errorHints: {
      not_found:
        'For a thread the id must be the thread id, not the id of the message it hangs off. Open the message with `read_message` and take `thread.id`.',
      forbidden: 'The caller is not in this chat. A closed chat is invisible to non-members, administrators included.',
    },
    goldenPrompts: ['перескажи, что было в канале за сегодня', 'перескажи обсуждение и выпиши решения'],
    nextSteps: ['Answer with `send_message`, or in a thread with `reply_in_thread`.'],
    examples: ['read_chat(thread_id: 44102) — тред по его собственному номеру, не по номеру сообщения'],
  },

  read_message: {
    title: 'Read a message',
    description:
      'One message by id: text, author, attachments, and whether a thread hangs off it. Add ' +
      '`include` for more: `reactions` — who reacted and with what; `readers` — ids of those who ' +
      'have read it. A deleted message still answers successfully, with empty text — check ' +
      '`deleted_at` before reporting that someone wrote nothing. An attachment link lives up to ' +
      'seven days, often less; if it has expired, read the message again for a fresh one.',
    whenToUse: [
      'A message id came from outside and you need to know what it says.',
      'Someone asks what is attached to a message — the files come back with it, there is nothing else to call.',
      'The person asks who reacted, agreed or has read a message.',
    ],
    notFor: ['Reading the discussion under a message — use `read_chat` with `thread.id`.'],
    nextSteps: ['Discuss it with `reply_in_thread`, or react with `react_to_message`.'],
  },

  read_user: {
    title: 'Person details',
    description:
      'The card of a colleague by id: name, job title, department, workspace role, tags, extra ' +
      'fields, and their current status with its expiry. Without an id it returns you: your id, ' +
      'card and status, and what this connection may do — the way to learn who you act for. The ' +
      'role here is the workspace role and says nothing about what they may do in a given chat.',
    whenToUse: [
      'You hold a user id and need to know who it is.',
      'You need your own id — to message yourself, or to tell your messages from others\'.',
      'You want to check whether someone is away before writing to them.',
    ],
    notFor: ['Finding someone by name — use `list_users` with `query`.'],
  },

  // ── List ─────────────────────────────────────────────────────────────────
  list_users: {
    title: 'People',
    description:
      'Colleagues. With `query` it finds people by name, email, department or job title. With ' +
      '`chat_id` it lists the members of that chat, and `role` then filters by the role in that ' +
      'chat. With `tag_id` it lists the members of a group tag. With none of them it lists the ' +
      'whole workspace. Pass at most one of `query`, `chat_id` and `tag_id`. The `role` field on ' +
      'each person is their workspace role, never their role in a chat. Email and phone come back ' +
      'empty unless the workspace shows personal data. ' +
      CURSOR_NOTE +
      ' ' +
      SEARCH_END_NOTE,
    whenToUse: [
      'The person names a colleague and you need their id to write to them or assign a task.',
      'Checking who is in a chat, or whether someone already is, before inviting them.',
      'Who has a group tag.',
    ],
    notFor: ['Someone whose id you already have — use `read_user`, which also returns their status.'],
    goldenPrompts: ['найди Петю из разработки'],
    nextSteps: ['Write to them with `send_message`, or assign work with `create_task`.'],
    examples: ['list_users(chat_id: 5501, role: "editor") — кто в канале может писать'],
  },

  list_threads: {
    title: 'My discussions',
    description:
      'Threads the caller takes part in — either in the thread itself or in the chat it was created ' +
      'in. Filterable by the time of the last message, so "what moved this week" is one call.',
    whenToUse: ['Catching up on open discussions.', 'Building a digest of ongoing work.'],
    notFor: ['Reading one discussion — use `read_chat` with `thread_id`.'],
    goldenPrompts: ['какие обсуждения шевелились на этой неделе'],
    nextSteps: ['Read a discussion in full with `read_chat`.'],
  },

  list_tasks: {
    title: 'Tasks',
    description:
      'Tasks, filterable by state, chat, assignee and author. Without `chat_ids` it returns your ' +
      'own: tasks from chats you are in, plus tasks with no chat that you created or that are ' +
      'assigned to you. With `chat_ids` it returns every task of those chats, other people\'s ' +
      'included. `task_id` returns one task. Records come back whole.',
    whenToUse: ['The person asks what is on their plate or what is overdue.'],
    notFor: ['Creating or closing a task — use `create_task` and `update_task`.'],
    goldenPrompts: ['покажи мои задачи на эту неделю'],
    nextSteps: ['Close or move one with `update_task`.'],
    examples: ['list_tasks(status: "undone")'],
  },

  read_workspace: {
    title: 'Workspace reference',
    description: 'Reference data of the workspace, one `section` per call.',
    branchText: {
      'GET /group_tags':
        '`group_tags` — group tags with their member counts; `names` finds tags by name, `id` returns one.',
      'GET /custom_properties':
        '`custom_properties` — the extra fields the workspace defined for people or tasks ' +
        '(`entity_type`), with the ids their values are written under.',
      'GET /bots': '`bots` — bots you can edit; `id` returns one.',
      'GET /company/bots': '`workspace_bots` — every bot of the workspace; reading it is written to the security log.',
    },
    whenToUse: ['You need the id of a group tag or of an extra field before writing.'],
    notFor: ['The members of a tag — use `list_users` with `tag_id`.'],
    errorHints: {
      bad_request: '`section` takes one of the values in the schema; custom_properties also needs `entity_type`.',
    },
  },

  read_audit_log: {
    title: 'Security log',
    description:
      'The security log of the workspace: logins and two-factor events, people created, changed and ' +
      'deleted, role changes, tags, chats created and renamed, people joining and leaving chats, ' +
      'messages created, edited and deleted, tokens and OAuth grants, bot settings, searches through ' +
      'the API. Filter by the time window (`start_time`, `end_time`), one kind of ' +
      'event (`event_key`), who did it (`actor_id`) or what it was done to (`entity_id`). Newest ' +
      'first. For the workspace owner on the Corporation plan; reading the log is itself written to it.',
    whenToUse: [
      'The person asks who logged in, who deleted or changed something, or what happened in the workspace.',
    ],
    notFor: ['Tags, extra fields and bots — use `read_workspace`.'],
    errorHints: {
      forbidden: 'The log answers only to the workspace owner, and only on the Corporation plan.',
    },
    goldenPrompts: ['покажи журнал безопасности за вчера'],
  },

  // ── Write into a conversation ────────────────────────────────────────────
  send_message: {
    title: 'Send a message',
    description:
      'Write into a chat, a thread chat or a direct message, optionally with a file. Set ' +
      '`parent_message_id` to answer a specific message as a chained reply — it stays in the chat ' +
      'feed and points at the original. To attach a file pass `file_name` with the extension and ' +
      '`file_content` as text; the server uploads it and sends it with the message. A report written ' +
      'as `.md` renders as a formatted card, the usual way to hand over long output. ' +
      MARKDOWN_NOTE +
      ' A bot may write to a person directly first; after that the person can answer it even if the ' +
      'bot is not public. Rate limits: about four sends per ' +
      'second per chat, and 7,500 messages per chat per rolling day from one sender; hitting the ' +
      'daily cap pauses sending to that chat for an hour, and every further attempt doubles the pause.',
    whenToUse: [
      'The person asks to write, announce or notify.',
      'Handing over a report or a summary as a file.',
    ],
    notFor: ['Moving the discussion into a thread, or continuing one — use `reply_in_thread`.'],
    errorHints: {
      chat_not_found: 'Find the chat with `list_chats`.',
      forbidden:
        'In a channel only editors and administrators may write; a subscriber cannot. They can still ' +
        'comment in the threads of that channel — offer that instead of retrying.',
      rate_limited: 'Wait for the interval named in `Retry-After` before sending again.',
    },
    goldenPrompts: ['напиши в канал, что релиз выехал', 'пришли отчёт файлом в чат команды'],
    nextSteps: ['The result carries the link to the message — hand it to the person.'],
    examples: [
      'send_message(chat_id: 5501, content: "Смена начинается в 9")',
      'send_message(chat_id: 5501, parent_message_id: 880011, content: "Согласен") — ответ цепочкой в ленте чата, не в треде',
      'send_message(chat_id: 5501, content: "Итоги недели", file_name: "notes.md", file_content: "# Итоги") — текст сообщения и файл',
    ],
  },

  reply_in_thread: {
    title: 'Reply in a discussion',
    description:
      'Answer inside a thread. You never need to check first whether a thread exists: pass the ' +
      'message id and this tool creates the thread if there is none and continues it if there is. ' +
      'Passing a thread id works too. Inside a thread `parent_message_id` chains one comment to ' +
      'another. People mentioned in a thread reply are pulled into the thread automatically; ' +
      '`skip_invite_mentions` prevents that. Formatting and mentions work as in `send_message`.',
    whenToUse: [
      'Answering a specific message so the chat feed stays clean.',
      'Continuing a discussion you have just read.',
    ],
    notFor: [
      'Writing into the chat feed — use `send_message`.',
      'Starting a discussion attached to nothing — use `create_chat` with `thread`.',
    ],
    errorHints: {
      not_found: 'A thread cannot be created on a deleted message.',
      bad_request:
        'A message that is itself inside a thread cannot carry another thread — threads do not ' +
        'nest. Reply into the same discussion instead.',
    },
    goldenPrompts: ['ответь ему в треде, что посмотрю завтра'],
    nextSteps: ['The result carries the thread and the link to the comment.'],
    examples: [
      'reply_in_thread(message_id: 880011, content: "Согласен") — по сообщению; тред создастся, если его нет',
      'reply_in_thread(thread_id: 44102, content: "Согласен") — в уже известный тред',
    ],
  },

  update_message: {
    title: 'Edit or pin a message',
    description:
      'Change a message: replace its text with `content`, or pin and unpin it with `pinned`. New ' +
      'text replaces the old completely — nothing is appended — and attachments stay untouched. A ' +
      'pin is visible to everyone in the chat. Fix your own posts only: editing someone else\'s ' +
      'message is not something an agent should do on its own, even when the token allows it.',
    branchText: {
      'POST /messages/{id}/link_previews':
        'A bot can also attach previews to the links in its message with `link_previews`.',
    },
    whenToUse: [
      'Correcting a message the agent itself has just sent.',
      'The person asks to pin or unpin a message.',
    ],
    notFor: [
      'Deleting a message — use `delete`.',
      'Adding to a discussion — reply instead, so the history stays readable.',
    ],
    errorHints: {
      forbidden: 'Only the author edits a message, and pinning needs the right to pin in that chat.',
      not_found: 'The message is deleted. A deleted message still answers reads, but cannot be changed.',
    },
    goldenPrompts: ['закрепи это сообщение в чате'],
  },

  react_to_message: {
    title: 'React to a message',
    description:
      'Put an emoji reaction on a message, or take yours off with `remove`. Often the right answer ' +
      'to an acknowledgement: a reaction is quieter than a message. Setting the same reaction twice ' +
      'changes nothing. To see who already reacted, read the message with `include: ["reactions"]`.',
    whenToUse: ['Acknowledging without adding noise to the chat.', 'Undoing a reaction placed by mistake.'],
    notFor: ['Answering with words — use `send_message` or `reply_in_thread`.'],
    errorHints: {
      unprocessable: 'The value is not an emoji the workspace knows. Custom emoji go in `name`, not `code`.',
      not_found: 'That reaction is not yours or was already removed.',
    },
  },

  // ── Chats, threads and who is in them ────────────────────────────────────
  create_chat: {
    title: 'Create a chat or thread',
    description:
      'Create a channel or a conversation. In a conversation every participant writes; a channel has ' +
      'subscribers who read and editors who write, so a channel suits announcements and a ' +
      'conversation a working group. The kind is fixed at creation. Visibility is a separate axis: ' +
      'an open chat is visible to everyone in the workspace, a closed one only to its members, ' +
      'administrators included. With `thread: true` it creates a standalone thread instead — a ' +
      'discussion tied to no message, with only the people in `member_ids`. A thread cannot be ' +
      'deleted afterwards, here or through the API. Either way this creates a space other people ' +
      'are put into, so confirm the name or topic, the kind and who is coming first, even when you ' +
      'were told to create it.',
    whenToUse: ['The person asks for a new channel, a working group, or a discussion on a topic.'],
    notFor: ['Discussing an existing message — use `reply_in_thread`, which creates the thread itself.'],
    nextSteps: [
      'Add more people with `update_chat_members`.',
      'Write the first message with `send_message`.',
    ],
    examples: [
      'create_chat(name: "Объявления", channel: true, public: true) — открытый канал: две независимые настройки',
      'create_chat(thread: true, member_ids: [7720]) — самостоятельный тред без сообщения',
    ],
  },

  update_chat: {
    title: 'Change a chat',
    description:
      'Change a chat: rename it with `name`, open or close it with `public`, archive it with ' +
      '`archived: true` and bring it back with `false`, or leave it yourself with `leave`. Renaming ' +
      'and archiving need the owner or admin role in the chat itself, whatever the workspace role, ' +
      'and neither applies to a direct message or a thread. An archived chat stays readable, but ' +
      'nobody writes into it or changes its members or settings until it is brought back. A closed ' +
      'chat, once left, is ' +
      'reachable again only by invitation, and nobody can leave while a group tag holds them there. ' +
      'Everyone in the chat sees the change, so confirm it first.',
    whenToUse: ['The person asks to rename, archive, reopen or leave a chat.'],
    notFor: ['Adding or removing people — use `update_chat_members`.'],
    errorHints: {
      forbidden: 'Needs the owner or admin role in this chat — the workspace role does not count.',
    },
    goldenPrompts: ['заархивируй канал, он больше не нужен'],
  },

  update_chat_members: {
    title: 'Change chat members',
    description:
      'Change who is in a chat or thread chat: add people (`add_user_ids`) or group tags ' +
      '(`add_tag_ids`), remove them (`remove_user_ids`, `remove_tag_ids`), or change the chat role ' +
      'of `role_user_ids` to `role`. The chat role is set when someone joins and is not ' +
      'recalculated: a workspace owner or administrator arrives as a chat admin, a bot in a channel ' +
      'as an editor, everyone else as a member — in a channel, a subscriber who only reads. Someone ' +
      'already in the chat is skipped and not notified again. A person held by an attached group ' +
      'tag cannot be removed one by one — the call succeeds and changes nothing; detach the tag. It ' +
      'changes who can read the conversation from here on, so confirm first.',
    whenToUse: [
      'The person names colleagues who should join or leave a chat.',
      'Letting someone write in a channel — make them an editor.',
    ],
    notFor: [
      'Renaming, archiving or leaving a chat — use `update_chat`.',
      'Mentioning someone so they see one thread — a mention in a thread reply does that.',
    ],
    errorHints: {
      not_found: 'One of the ids is not an employee of this workspace. Resolve people with `list_users` first.',
      forbidden: 'The chat owner can be neither removed nor given another role — they can only leave.',
    },
  },

  // ── Tasks and own profile ────────────────────────────────────────────────
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
    nextSteps: ['The result carries the task id; change or close it later with `update_task`.'],
    errorHints: {
      unprocessable:
        '`kind` takes one of five values — call, meeting, reminder, event, email — and the text of the task goes in `content`.',
    },
    examples: ['create_task(kind: "call", content: "обсудить договор") — kind выбирается из списка, текст задачи идёт в content'],
  },

  update_task: {
    title: 'Update a task',
    description:
      'Change a task — its text, assignee, due date, extra fields, or mark it done. Only the fields ' +
      'you pass are changed. Ids come from `list_tasks`.',
    whenToUse: ['Closing a finished task, moving a deadline, reassigning work.'],
    notFor: ['Creating a new task — use `create_task`.', 'Removing a task — use `delete`.'],
    goldenPrompts: ['отметь задачу про отчёт выполненной'],
    errorHints: {
      forbidden: 'Only the author of a task and its performers can change it. Check `performer_ids` before writing.',
    },
    examples: [
      'update_task(task_id: 9105, status: "done")',
      'update_task(task_id: 9105, performer_ids: [7721]) — передаются только меняющиеся поля',
    ],
  },

  update_my_profile: {
    title: 'My status and photo',
    description:
      'Set your own status — an emoji, a text of up to 50 characters, an expiry after which it clears ' +
      'itself, an away flag with an away message — or remove it with `clear_status`. Change your ' +
      'photo with `avatar` or remove it with `clear_avatar`. This touches only you; another person\'s ' +
      'status or photo is set by an administrator.',
    whenToUse: ['The person says they are in a meeting, away, or on holiday until some time.'],
    notFor: ['Reading a status — it is part of the card returned by `read_user`.'],
    goldenPrompts: ['поставь статус «на встрече» до 15:00'],
  },

  // ── Administration ───────────────────────────────────────────────────────
  save_user: {
    title: 'Create or change an employee',
    description:
      'Administration of people, for owners and administrators. Without `user_id` it creates an ' +
      'employee — `email` is required, and an invitation goes out unless `skip_email_notify`. With ' +
      '`user_id` it changes one: name, contacts, department, title, workspace role, extra fields; ' +
      '`suspended: true` blocks access without deleting anyone; the status and photo fields set ' +
      'or clear theirs. `list_tags` replaces the person\'s whole set of group tags: to add one, read ' +
      'their tags with `read_user` and send the full list; a name that does not exist yet creates ' +
      'the tag. Confirm every change first.',
    whenToUse: [
      'The person asks to add an employee, change someone\'s title or department, block access, or put people into a group tag.',
      'Setting a status for someone else.',
    ],
    notFor: [
      'Your own status or photo — use `update_my_profile`.',
      'Removing an employee for good — use `delete` with `user_id`.',
    ],
    errorHints: {
      conflict: 'An employee with this email already exists — find them with `list_users`.',
      unprocessable: 'An extra field id is unknown — read them with `read_workspace`, section custom_properties.',
    },
  },

  save_group_tag: {
    title: 'Create or rename a group tag',
    description:
      'Create a group tag with `name`, or rename one by `tag_id` — owners and administrators only. ' +
      'A tag groups people: mentioning it notifies all of them, attaching it to a chat brings all ' +
      'of them in. Who is in a tag is changed on each person with `save_user` and `list_tags`, not ' +
      'here. Names are unique regardless of case, up to 255 characters, without @, and cannot be ' +
      '`all` or `here`.',
    whenToUse: ['The person asks for a new group of people to mention or invite together.'],
    notFor: [
      'Putting people into a tag — use `save_user` with `list_tags`.',
      'Attaching a tag to a chat — use `update_chat_members` with `add_tag_ids`.',
    ],
    goldenPrompts: ['создай тег «дизайнеры»'],
  },

  save_bot: {
    title: 'Create or change a bot',
    description:
      'Bots and their settings. A token in the result is a secret shown only once: hand it to the ' +
      'person or put it where they asked, never into a chat.',
    branchText: {
      'POST /bots':
        'Without `bot_id` it creates a bot — `name` is required — and returns its access token. A bot ' +
        'that only posts notifications from another service needs no code at all: its incoming ' +
        'webhook address takes messages directly.',
      'PUT /bots/{id}':
        'With `bot_id` it changes the settings: outgoing webhook address, events it receives, ' +
        'commands, permissions, who may add it and who may edit it.',
      'POST /bots/{id}/recreate_token':
        '`recreate_token` issues a new token and revokes the old one at once, so everything using ' +
        'the old token stops working.',
      'PUT /bot/webhook':
        'Without `bot_id` it changes the calling bot itself: its outgoing webhook address, or its ' +
        'own token with `recreate_token`, which revokes the old one at once.',
    },
    whenToUse: [
      'The person asks for a bot for an integration, or to change what a bot receives.',
      'Rotating a bot token that leaked.',
    ],
    notFor: [
      'Deleting a bot — use `delete` with `bot_id`.',
      'Listing bots — use `read_workspace`, section bots.',
    ],
    goldenPrompts: ['заведи бота, который будет постить к нам оповещения из GitLab'],
  },

  export_messages: {
    title: 'Export messages',
    description:
      'Export the workspace\'s messages as an archive — the owner only, on the Corporation plan. ' +
      'Request it with the dates `start_at` and `end_at`. One export covers at most 45 days of the ' +
      'whole workspace, or up to 366 days when `chat_ids` names the chats; a longer period takes ' +
      'several exports, one after another. The archive is prepared in the ' +
      'background: the result says when it is ready, and `export_id` then returns a temporary ' +
      'download link. An export copies everyone\'s correspondence out of the workspace, so confirm ' +
      'the period and the chats first.',
    whenToUse: ['The owner asks for an archive of correspondence — for lawyers, for a backup.'],
    notFor: ['Reading a chat — use `read_chat`.'],
    errorHints: {
      rate_limit: 'The workspace may request one export per 90 seconds, whether or not the previous one has finished.',
    },
    goldenPrompts: ['выгрузи всю переписку пространства архивом'],
  },

  delete: {
    title: 'Delete',
    description:
      'Delete one thing for good — pass exactly one id. Nothing here can be undone, so confirm every ' +
      'time, naming what exactly goes.',
    branchText: {
      'DELETE /messages/{id}':
        '`message_id` — a message: its author deletes it, and so do admins and editors of the chat; ' +
        'in a direct message either person can delete any message.',
      'DELETE /tasks/{id}': '`task_id` — a task.',
      'DELETE /users/{id}':
        '`user_id` — an employee; to block someone and keep their data, use `save_user` with `suspended: true` instead.',
      'DELETE /group_tags/{id}': '`tag_id` — a group tag.',
      'DELETE /bots/{id}': '`bot_id` — a bot you can edit.',
      'DELETE /webhooks/events/{id}': '`event_id` — a processed event in the bot\'s history.',
    },
    whenToUse: ['The person explicitly asks to delete something.'],
    notFor: [
      'Editing a message — use `update_message`.',
      'Leaving or archiving a chat — use `update_chat`.',
    ],
    goldenPrompts: ['удали сообщение, я его зря отправил'],
  },

  // ── Only for a bot token ─────────────────────────────────────────────────
  list_bot_events: {
    title: 'Bot event history',
    description:
      'The recent events of the calling bot — new messages, button presses, form submissions, ' +
      'members joining — for a bot that cannot receive its webhook in real time. Works only with a ' +
      'bot token, and only when the bot has event history turned on. Once an event is handled, drop ' +
      'it with `delete` and `event_id`.',
    whenToUse: ['A bot polls for what happened since the last check.'],
    notFor: ['Reading a chat — use `read_chat`.'],
  },

  handle_form: {
    title: 'Show or answer a form',
    description:
      'Forms, for a bot. Open a modal form for a person who has just pressed the bot\'s button: pass ' +
      'the `trigger_id` from that event and the `view` — title, fields, button texts. Or answer a ' +
      'submission when the bot has no webhook address: pass `view_id` and `submit_id` from the ' +
      'submission event, and `errors` to show under fields — within five seconds, or the person sees ' +
      'an error. Works only with a bot token.',
    whenToUse: ['A bot reacts to a button press with a form, or validates what was submitted.'],
    notFor: ['Asking a person a question in chat — use `send_message`.'],
  },

  // ── Service tools ────────────────────────────────────────────────────────
  help: {
    title: 'Documentation and working rules',
    description:
      'Two kinds of help. `query` searches the Pachca documentation — webhooks, signatures, ' +
      'pagination, form fields, token types — and returns pages with an extract and a link; use it ' +
      'instead of recalling, the documentation is current. `area` returns the working rules of one ' +
      'area — what the formatting subset renders, how threads behave, common mistakes; read it once ' +
      'before a series of calls there.',
    whenToUse: [
      'The person asks how something in Pachca works.',
      'You are about to write integration code and need the contract.',
      'Starting work in an area for the first time in this session.',
    ],
    notFor: ['Searching messages inside the workspace — use `search_messages`.'],
  },

  search: {
    title: 'Search Pachca',
    description:
      'Generic search across messages, chats, people and files, returning identifiers with short ' +
      'extracts. A compatibility surface for clients that expect exactly this pair; when the core ' +
      'tools are available, they are narrower and better.',
    whenToUse: ['Your client offers no other way to search Pachca.'],
    notFor: ['Anything the core tools can do — prefer `search_messages`, `list_chats`, `list_users`.'],
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
