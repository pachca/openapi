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
 * 1. **The words a request comes in.** The spec points at the neighbour — a
 *    topic with no message behind it gets a standalone thread — and a model gets
 *    that link as a tool name. The phrasing has no place there: «давай обсудим
 *    это отдельно» asks for a thread under the message, though «отдельно» reads
 *    like a thread apart from everything.
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
 * and the operation's description fail it, and so does a line pointing at a
 * neighbour the description already names, unless it carries the words of a
 * request. Reworded restatement it cannot see, so the rule above is the one that
 * matters.
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
 * of wrong calls — unless the description names it already, and then say only
 * the request that leads there. And never tell the model to ask permission:
 * whether a call needs approval is the client's dialogue with the person, per
 * tool, so the text names the consequence instead and lets them decide.
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
 * What to put in a moment the person named in words. Where the dates come from
 * and how a local day ends is in the server instructions; the field says only
 * what goes into it.
 */
const NAMED_DAY_NOTE =
  'A weekday name is not a value this takes. Take the date from the week in your instructions or in the ' +
  'footer of any result rather than counting it, which is where it lands a day out, and use the ' +
  'offset the footer’s Now carries.';

/** A deadline with a day in it and no hour, on either side of a task. */
const NO_HOUR_NOTE =
  'Pass it whenever the request names no hour — «в пятницу», «время неважно», «до конца дня» — ' +
  'instead of inventing one that then shows in the task.';

export const MCP_TOOL_PROSE: Record<string, ToolProse> = {
  // ── Where a message goes ────────────────────────────────────────────────
  send_message: {
    notFor: [
      'Editing something already sent — update_message.',
      'Handing a task to somebody — update_task moves it to them, while a message leaves the task where it was.',
    ],
    arguments: {
      entity_id: 'From search_chats, list_users or search_messages, or from a link the person pasted.',
    },
  },

  create_thread: {
    whenToUse: ['Taking something already said aside — «давай обсудим это отдельно».'],
    notFor: [
      'Reading a thread that may already exist — get_message returns the thread of a message, and ' +
        'get_thread reads it.',
    ],
  },
  create_unattached_thread: {
    notFor: ['Anything that continues something already written, however «отдельно» it is meant — create_thread.'],
  },
  create_chat: {
    notFor: ['One topic talked over «в сторонке» — create_unattached_thread.'],
  },
  pin_message: {
    notFor: ['«Подними переписку» — that is reading the feed, list_chat_messages, not pinning.'],
  },

  // ── Deadlines and statuses ──────────────────────────────────────────────
  create_task: {
    arguments: {
      due_at: NAMED_DAY_NOTE,
      all_day: NO_HOUR_NOTE,
      content:
        'Write it from whatever the request names the task by, and say your wording in your reply; with ' +
        'nothing to name it by, leave it out.',
    },
  },
  update_task: {
    arguments: { due_at: NAMED_DAY_NOTE, all_day: NO_HOUR_NOTE },
  },
  update_my_status: {
    arguments: { expires_at: NAMED_DAY_NOTE },
  },
  update_user_status: {
    arguments: { expires_at: NAMED_DAY_NOTE },
  },

  // ── Where the consequence is the thing worth knowing ────────────────────
  delete_message: {
    notFor: ['Taking back something you only regret sending — update_message edits it in place instead.'],
  },
  delete_user: {
    notFor: ['«Заблокируй», «отключи», «пока» — update_user with suspended.'],
  },
  recreate_bot_token: {
    description: 'Hand the new token to the person, never into a chat.',
  },

  // ── Reading: which of the neighbours shows what ─────────────────────────
  get_chat: {
    notFor: ['Reading what is written in it — list_chat_messages.'],
  },
  list_chat_messages: {
    notFor: ['What kind of chat it is — get_chat.', 'Finding a chat by name — search_chats.'],
  },
  search_messages: {
    notFor: [
      'What happened lately with nothing specific to look for — «что нового за выходные» — ' +
        'list_chats sorted by the last message, then the feeds that moved. A search needs words to ' +
        'match.',
    ],
  },
  get_my_card: {
    whenToUse: ['Anything about you beyond the name and id, which your instructions and every footer already carry.'],
  },
  download_export: {
    arguments: {
      id: 'The one the person names or pastes — «выгрузка 812» is export 812, not a message.',
    },
  },
};
