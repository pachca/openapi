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
 * A fact about behaviour does not belong here at all. The spec's description is
 * read by everything — documentation, CLI, SDK, llms.txt — so a fact written
 * here reaches only whoever came through MCP, and a fact written in both places
 * drifts. Missing from the spec is not a reason to write it here: it is a
 * documentation fix, and the fix is cheap. The `description` field survives for
 * the one thing that is about the model rather than the API — what not to do
 * with what the answer hands back.
 *
 * The build checks the mechanical half of this: six words shared between prose
 * and the operation's description fail it. Reworded restatement it cannot see,
 * so the rule above is the one that matters.
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
  'Write a list as separate lines, and for a table, a checklist or a diagram attach a `.md` file ' +
  'instead: as the only document of a message it opens formatted, with its beginning shown right ' +
  'in the chat.';

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
    notFor: ['Putting people into the tag — update_user with list_tags, one person at a time.'],
  },
  update_user: {
    arguments: {
    },
  },
  delete_tag: {
    notFor: [
      'Detaching a tag from one chat — remove_tag_from_chat; this takes it off every chat it is attached to.',
    ],
  },
  remove_tag_from_chat: {
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
    arguments: { expires_at: NAMED_DAY_NOTE },
  },
  update_user_status: {
    arguments: { expires_at: NAMED_DAY_NOTE },
  },

  // ── Where the consequence is the thing worth knowing ────────────────────
  // The sentences about behaviour below are missing from the operation
  // descriptions and belong there.
  leave_chat: {
    notFor: ['Removing somebody else — remove_member.'],
  },
  archive_chat: {
  },
  delete_message: {
    notFor: ['Taking back something you only regret sending — update_message edits it in place instead.'],
  },
  delete_user: {
    notFor: ['«Заблокируй», «отключи», «пока» — update_user with suspended, which is reversible.'],
  },
  remove_member: {
    notFor: [
      'Taking out somebody a group tag holds in the chat — remove_tag_from_chat, or update_user with ' +
        'that tag left out of list_tags.',
    ],
  },
  create_bot: {
    notFor: ['Putting the bot into a chat — add_members, its id in member_ids.'],
  },
  recreate_bot_token: {
    description: 'Hand the new token to the person, never into a chat.',
  },

  // ── Reading: which of the neighbours shows what ─────────────────────────
  get_chat: {
    notFor: ['Reading what is written in it — list_chat_messages.'],
  },
  list_chat_messages: {
    notFor: ['What kind of chat it is — get_chat.', 'Finding a chat by name — list_chats.'],
  },
  list_threads: {
    notFor: [
      'A thread the person names by its topic — «тред про закупку ноутбуков» — search_messages finds ' +
        'it, this list carries no text to match.',
    ],
  },
  list_message_readers: {
  },
  search_chats: {
    notFor: [
      'Finding where something was said or decided — «где мы договаривались про бюджет» — ' +
        'search_messages. This one matches chat names, and a topic rarely lives in a chat named ' +
        'after it.',
    ],
  },
  search_messages: {
    notFor: [
      'What happened lately with nothing specific to look for — «что нового за выходные» — ' +
        'list_chats sorted by the last message, then the feeds that moved. A search needs words to ' +
        'match.',
    ],
  },
  get_my_card: {
    whenToUse: [
      'Something about you beyond name and id matters — your time zone, which decides what «до 15:00» ' +
        'means. The name and the id are already in your instructions and in every footer.',
    ],
  },
  download_export: {
    arguments: {
      id: 'The one the person names or pastes — «выгрузка 812» is export 812, not a message.',
    },
  },

  // ── Forms: bot-only, and the names hide what they do ────────────────────
  open_form: {
    whenToUse: ['A button press has just arrived — open the form before doing anything else with that event.'],
  },
};
