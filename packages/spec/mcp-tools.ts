/**
 * Written prose, for the tools that measurably need it.
 *
 * Every tool gets its name, schema and description from the spec, and for
 * most of them that is enough: `pin_message`, `list_tasks`, `remove_member` say
 * what they do and a model picks them without help. This file is the exception
 * list, and it is deliberately short — each entry is text somebody has to keep
 * true as the API moves.
 *
 * Prose follows the spec's text; it never replaces it, and it never repeats it:
 * what the spec already says is taken out of the prose, not out of the spec —
 * generated text stays true by itself, written text has to be kept true. The spec
 * states what an operation does — who may call it, what comes back, what it
 * refuses — and those facts have one home, the operation description, which
 * documentation, CLI and SDK read too. Prose says only what that home has no
 * place for:
 *
 * 1. **Which neighbour a request belongs to.** The spec describes an endpoint,
 *    not which of two neighbouring endpoints a person meant: «давай обсудим это
 *    отдельно» is a thread under the message, not a new chat, and nothing in the
 *    description of either says so.
 * 2. **What to put in a field.** A deadline named as a weekday is a date read off
 *    the week the server sends, not counted; the spec gives the shape of the
 *    value and has no place for that.
 * 3. **The consequence worth knowing** before a call that cannot be taken back.
 *
 * A fact about behaviour that the spec is missing is written here only until the
 * spec has it — each such sentence is a documentation fix waiting to be made.
 *
 * Examples here never borrow from the scenarios: no chat, tag, id or phrasing a
 * request of `mcp-scenarios.ts` uses. A model that copies an example must not pass
 * a scenario for it, and the build fails when one would.
 *
 * A rule that holds for every tool lives in the server instructions
 * (`mcp-core.ts`), not repeated per tool.
 *
 * Two habits hold throughout. Say what the tool is NOT for and name the
 * neighbour that is — collisions between similar names are the largest source
 * of wrong calls. And never tell the model to ask permission: whether a call
 * needs approval is the client's dialogue with the person, per tool, so the
 * text names the consequence instead and lets them decide.
 *
 * One word needs care: the API calls a chat a «discussion» (`entity_type`), so
 * prose never uses it for a thread.
 */

export interface ToolProse {
  /** Added after the description the spec gives. */
  description?: string;
  /** Situations that should lead the model here. */
  whenToUse?: string[];
  /** Situations that look similar but belong to another tool. */
  notFor?: string[];
  /** Added after the spec's text for these arguments. */
  arguments?: Record<string, string>;
}

/**
 * What the text of a message may contain, on the field that carries it. The spec
 * already names the two spellings of a mention there, so this says the rest.
 */
const MARKDOWN_NOTE =
  'A bare name, or a mention inside code, mentions nobody. Write a list as separate lines, and for a ' +
  'table, a checklist or a diagram attach a `.md` file instead: it opens formatted, and as the only ' +
  'document of a message, up to 150 KB, its beginning shows right in the chat.';

/**
 * What to put in a moment the person named in words. Where the dates come from
 * and how a local day ends is in the server instructions; the field says only
 * what goes into it.
 */
const NAMED_DAY_NOTE =
  'Never the name of a day: «Friday» is not a value this takes. Take the date from the week in your ' +
  'instructions or in the footer of any result instead of counting, which is where it lands a day ' +
  'out, and write it with the offset the footer’s Now carries, not Z: «до среды» for a person at ' +
  '+03:00 is that Wednesday, 23:59:59+03:00.';

export const MCP_TOOL_PROSE: Record<string, ToolProse> = {
  // ── Where a message goes ────────────────────────────────────────────────
  send_message: {
    whenToUse: [
      'Writing to the person themselves — «скинь мне», «запиши себе»: their own id with entity_type ' +
        'user lands in their chat with themselves.',
    ],
    notFor: [
      'Opening a thread under a message that has none — create_thread makes it, then send here.',
      'Editing something already sent — update_message.',
      'Handing a task to somebody — update_task moves it to them. Writing them about it instead ' +
        'leaves the task where it was, and they get a message rather than the task.',
    ],
    arguments: {
      content: MARKDOWN_NOTE,
      entity_type: '`discussion` is never a thread; `thread` is a reply inside one; `user` is a direct message.',
      entity_id: 'From list_chats, list_users or search_messages, or from a link the person pasted.',
      parent_message_id: 'A reply right in the chat rather than in a thread — «ответь Лене прямо в канале, а не в треде».',
    },
  },

  update_message: {
    arguments: { content: MARKDOWN_NOTE },
  },

  create_thread: {
    notFor: [
      'A new topic with no message behind it — create_unattached_thread.',
      'Reading a thread that may already exist — get_message returns the thread of a message, and ' +
        'get_thread reads it.',
    ],
    whenToUse: [
      'Taking something already said aside — «давай обсудим это отдельно». Aside, under the message, ' +
        'is what a thread is.',
      'Answering a specific message so the chat feed stays clean.',
    ],
  },

  create_unattached_thread: {
    notFor: [
      'Anything that continues something already written, however «отдельно» it is meant — ' +
        'create_thread opens it under that message, where the people reading it see what is discussed.',
      'A place that needs a name of its own — create_chat. The missing title is the difference, not ' +
        'a reason to make a chat instead.',
    ],
  },

  create_chat: {
    notFor: [
      'Talking one topic over, apart from any chat — «давай про закупку поговорим в сторонке» — ' +
        'create_unattached_thread.',
    ],
  },
  pin_message: {
    notFor: ['«Подними переписку» — that is reading the feed, list_chat_messages, not pinning.'],
  },

  // ── Reactions ───────────────────────────────────────────────────────────
  add_reaction: {
    arguments: { code: 'A shortcode such as +1 or :+1: is refused as an unknown emoji.' },
  },
  remove_reaction: {
    arguments: { code: 'A shortcode such as +1 or :+1: is refused as an unknown emoji.' },
  },

  // ── Tags: on chats and on people ────────────────────────────────────────
  create_tag: {
    description: 'People are put into a tag on their own card — update_user with list_tags, one person at a time.',
  },
  update_user: {
    arguments: {
    },
  },
  delete_tag: {
    description: 'The people the tag brought into chats stay in them as ordinary members.',
    notFor: [
      'Detaching a tag from one chat — remove_tag_from_chat; this takes it off every chat it is attached to.',
    ],
  },
  remove_tag_from_chat: {
    description:
      'The people who came into the chat with the tag leave it, shortly after the call answers — even ' +
      'those added by hand since — except the chat owner and anyone another tag of this chat brings in.',
  },

  // ── Deadlines and statuses ──────────────────────────────────────────────
  create_task: {
    notFor: [
      'Handing an existing task to somebody — update_task on that task moves it to them. A new one ' +
        'with the same words leaves the original sitting on you.',
    ],
    arguments: {
      due_at: NAMED_DAY_NOTE,
      all_day:
        'Pass it whenever the request names no hour — «в пятницу», «время неважно» — instead of ' +
        'inventing one that then shows in the task.',
      content:
        'Write it from whatever the request names the task by, and say your wording in your reply; with ' +
        'nothing to name it by, leave it out.',
    },
  },
  update_task: {
    arguments: {
      due_at: NAMED_DAY_NOTE,
      all_day:
        'Pass it whenever the request names no hour — «в пятницу», «время неважно», «до конца дня» — ' +
        'instead of inventing one that then shows in the task.',
    },
  },
  update_my_status: {
    description: 'A time the person names — «до трёх» — goes to expires_at, not into the text.',
    arguments: { expires_at: NAMED_DAY_NOTE },
  },
  update_user_status: {
    description:
      'Everyone in the workspace who can see the person sees it. A time the person names goes to ' +
      'expires_at, not into the text.',
    arguments: { expires_at: NAMED_DAY_NOTE },
  },

  // ── Where the consequence is the thing worth knowing ────────────────────
  // The sentences about behaviour below are missing from the operation
  // descriptions and belong there.
  leave_chat: {
    description:
      'In a closed conversation the others see that you left, and getting back takes someone inside ' +
      'to add you; an open chat or channel can be rejoined at any time. Membership that came with a ' +
      'group tag cannot be left this way.',
    notFor: ['Removing somebody else — remove_member.'],
  },
  archive_chat: {
    description:
      'The chat leaves everyone’s list and refuses new messages and threads, while threads already in ' +
      'it stay open; the history stays. Archiving also removes guests and detaches group tags, and ' +
      'unarchive_chat brings the chat back without them.',
  },
  delete_message: {
    description:
      'Its text, files and reactions are gone for everyone and cannot be brought back; in the app a ' +
      'placeholder saying it was deleted stays in its place. Name exactly the message that goes.',
  },
  delete_user: {
    description:
      'Nothing here can be undone. «Удали», «насовсем» is the instruction — carry it out. ' +
      '«Заблокируй», «отключи», «пока» is update_user with suspended, which is reversible.',
  },
  remove_member: {
    description:
      'In a closed chat they lose its history, though not the threads they take part in. Someone who ' +
      'is in the chat through a group tag stays, even though the call answers success: take them out ' +
      'with remove_tag_from_chat, or with update_user leaving that tag out of list_tags.',
  },
  create_bot: {
    description:
      'A bot writes into a conversation or channel only once it is a member there, and its incoming ' +
      'webhook posts into every conversation and channel it is a member of — so the chats it is added ' +
      'to decide where its posts land. It is added with add_members, its id in member_ids, and in a ' +
      'channel it becomes an editor. Direct messages, and threads in open chats, need no membership.',
  },
  recreate_bot_token: {
    description:
      'Only the main token is replaced: other tokens issued on the bot’s page keep working. Hand the new ' +
      'token to the person, never into a chat.',
  },

  // ── Reading: which of the neighbours shows what ─────────────────────────
  get_chat: {
    notFor: ['Reading what is written in it — list_chat_messages.'],
  },
  list_chat_messages: {
    notFor: ['What kind of chat it is — get_chat.', 'Finding a chat by name — list_chats.'],
  },
  list_threads: {
    description:
      'A thread has no title and this list carries no text, so a thread the person names by its topic ' +
      '— «тред про закупку ноутбуков» — is found with search_messages, not here.',
  },
  list_message_readers: {
    description: 'It returns ids, not names; pair it with list_users when names are wanted.',
  },
  search_chats: {
    notFor: [
      'Finding where something was said or decided — «где мы договаривались про бюджет» — ' +
        'search_messages. This one matches chat names, and a topic rarely lives in a chat named ' +
        'after it.',
    ],
  },
  search_messages: {
    description:
      'It searches only the chats the person is a member of: an open channel they have not joined ' +
      'stays out, and its feed is read with list_chat_messages instead.',
    notFor: [
      'What happened lately with nothing specific to look for — «что нового за выходные» — ' +
        'list_chats sorted by the last message, then the feeds that moved. A search needs words to ' +
        'match.',
    ],
  },
  get_my_card: {
    description:
      'Your name and id are already in the instructions and in the footer of every result — read the ' +
      'card when the rest matters, such as your time zone, which decides what «до 15:00» means.',
  },
  download_export: {
    description:
      'The id is the one the person names or pastes — «выгрузка 812» is export 812, not a message. ' +
      'The link the answer carries is for the person: hand it over straight away.',
  },

  // ── Forms: bot-only, and the names hide what they do ────────────────────
  open_form: {
    description:
      'A trigger_id opens one form, within three seconds of Pachca handing the button press to the ' +
      'bot — for a bot reading its event history, of the press appearing there — so open the form ' +
      'before doing anything else with that event.',
  },
};
