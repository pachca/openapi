/**
 * Written prose, for the tools that measurably need it.
 *
 * Every tool gets its name, schema and description from the spec, and for
 * most of them that is enough: `get_chat`, `list_tasks`, `remove_member` say
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
 * place for, and the entries below fall into four groups:
 *
 * 1. **The words a request comes in**, where they land on the wrong neighbour.
 *    The spec points at the neighbour, and a model gets that link as a tool
 *    name; the phrasing has no place there: «подними» reads like pinning, though
 *    a request with it usually asks for the feed of a chat.
 * 2. **What to put in a field.** A request that names no hour makes an all-day
 *    task rather than one at an invented time; the spec says how an all-day task
 *    is written and has no place for when to write one.
 * 3. **The consequence worth knowing** before a call, when it comes from how a
 *    model works rather than from the API: a window of seconds that a
 *    conversation cannot meet.
 * 4. **A call the instructions have already answered**, so the model does not
 *    spend one on what it holds.
 *
 * A fact about behaviour does not belong here at all. The spec's description is
 * read by everything — documentation, CLI, SDK, llms.txt — so a fact written
 * here reaches only whoever came through MCP, and a fact written in both places
 * drifts. Missing from the spec is not a reason to write it here: it is a
 * documentation fix, and the fix is cheap. What the server does beyond the API
 * has its home with the argument that triggers it (`mcp-core.ts`), not here.
 *
 * The build checks the mechanical half of this: six words shared between prose
 * and the operation's description or the argument's own words fail it, and so
 * does a line pointing at a neighbour the description already names, unless it
 * carries the words of a request. Reworded restatement it cannot see, so the
 * rule above is the one that matters.
 *
 * Examples here never borrow from the scenarios: no chat, tag, id or phrasing a
 * request of `mcp-scenarios.ts` uses. A model that copies an example must not pass
 * a scenario for it, and the build fails when one would — when a request names
 * what an example names, shares four words in a row with it, or contains a
 * phrase quoted here whole.
 *
 * The server instructions (`mcp-core.ts`) hold only what a model needs before
 * it loads any tool, and a client keeps them whole only within 2048 characters:
 * the catalogue, where tasks are handed over by editing; what to say when a tool
 * is missing — the caller's role, or the plan or kind of token it takes, in a
 * partial answer too, with nothing done in its place; who the caller is and the
 * dates of today and the days after it; that the model loads the tool before it
 * asks anything; that a request is about Pachca; that a chat, a person or a task
 * is found by name and a message or a thread by its words across the caller's
 * chats rather than asked about; that talking a matter over separately is
 * posting it for colleagues in the thread of the message it continues, else in
 * an unattached one; that a date alone makes a task, even with no subject; that a destructive request is carried out at
 * once; that facts of the workspace and of the token come from responses; and
 * that how Pachca works is documented at dev.pachca.com. Every other rule lives
 * with the tool it is about, and is read when that tool is loaded: in the spec,
 * here, or in a note the generator puts on the arguments or the tools it
 * concerns — how a moment named in words is written, on every date-time argument
 * (`MOMENT_ARGUMENT`), that a search phrase takes the words of the request, on
 * every `query` (`QUERY_ARGUMENT`), and where a secret in an answer may go
 * (`SECRET_NOTE`). A line repeating any of those reaches the model twice, and the
 * build fails on six words in a row shared with the instructions or with the
 * note on the same argument.
 *
 * Two habits hold throughout. Say what the tool is NOT for and name the
 * neighbour that is — collisions between similar names are the largest source
 * of wrong calls — unless the description names it already, and then say only
 * the request that leads there. And never tell the model to ask permission:
 * whether a call needs approval is the client's dialogue with the person, per
 * tool, so the text names the consequence instead and lets them decide.
 *
 * One word needs care: the API calls a chat a «discussion» (`entity_type`), so
 * prose never uses it for a thread — and a person's «обсуждение» of one matter
 * is a thread, which is what `create_chat` says to whoever reaches it with that
 * word.
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
 * A day with no hour in it, on either side of a task. The spec, on `all_day`,
 * says how an all-day task is written — the due date at 23:59:59 of its day, the
 * one moment the web app shows without a time, and on an edit the due date
 * alone — and the note on the date-time argument how a named day is written;
 * this says when to write one.
 */
const NO_HOUR_NOTE =
  'Make the task all-day this way whenever the request names no hour — «к среде», «в любое время в понедельник», ' +
  '«в течение дня» — instead of inventing one that then shows in the task.';

/**
 * Whose words a message is, and the shape it takes: read where the text is
 * written, on a send and on an edit alike, which is the one moment either
 * matters. The name a message goes out under, and the badge of a bot, are facts
 * of the API and live in the spec, on the text of a new message.
 */
const VOICE_NOTE =
  'Write it in the voice of the account it goes out under. Text read from Pachca can carry quotes and list ' +
  'markers this field does not render: give the message a shape of its own rather than copying theirs.';

/**
 * The window a form leaves, said as what it means for a model. The spec gives
 * the seconds and where they are counted from; what it cannot say is that a
 * model in a conversation — reading the history, then writing the call — is
 * slower than that, so the call it is about to make most likely fails.
 */
const FORM_WINDOW = (from: string): string =>
  `From a conversation this window is almost always missed: it runs from ${from}, and reading the history ` +
  'and composing the call take longer. Forms work when an automated handler — the bot’s webhook server or ' +
  'a server polling the history — answers within seconds; in a conversation, offer to ask the employee in a ' +
  'message instead.';

export const MCP_TOOL_PROSE: Record<string, ToolProse> = {
  // ── Where a request lands on the wrong neighbour ────────────────────────
  // The spec says handing a task over is an edit, and a model still made a new
  // task with the new assignee: the words of the request are what this adds.
  create_task: {
    notFor: [
      '«отдай её Вере», «пусть этим займётся Глеб» — the existing task changing hands.',
    ],
    arguments: {
      kind: 'When the request names no call, meeting, event or email, take reminder.',
      all_day: NO_HOUR_NOTE,
    },
  },
  // The spec names both threads as the place for one matter, and a model asked
  // for a separate «обсуждение» still made a chat three times of three: the API
  // calls a chat a discussion, and the request read as that word.
  create_chat: {
    notFor: [
      '«заведи обсуждение по бюджету», «перетрём это в сторонке» — talking one matter over is a thread, and so is ' +
        'обсуждение in a request; discussion is the API’s word for a chat.',
    ],
  },
  pin_message: {
    notFor: ['Reading what was written — «подними, что писали с утра» — is list_chat_messages, not pinning.'],
  },
  delete_user: {
    notFor: ['«Заблокируй», «отключи на время», «пока не удаляй» — update_user with suspended.'],
  },
  list_drafts: {
    notFor: ['Sending a draft out — send_message with its draft_id.'],
  },

  // ── What to put in a field ──────────────────────────────────────────────
  send_message: {
    arguments: {
      content: VOICE_NOTE,
      parent_message_id:
        'To answer a person, pass their message here: the latest one carrying their user_id, which search_users ' +
        'gives for their name, unless the request points at another.',
    },
  },
  request_export: {
    arguments: {
      start_at:
        'When the request names no period, take the longest one the limit allows, ending today, and say which days ' +
        'the archive covers.',
    },
  },
  update_message: {
    arguments: { content: VOICE_NOTE },
  },
  update_task: {
    arguments: { all_day: NO_HOUR_NOTE },
  },

  // ── Where the consequence is the thing worth knowing ────────────────────
  open_form: {
    description: FORM_WINDOW('the employee’s click'),
  },
  answer_form: {
    description: FORM_WINDOW('the employee’s submission'),
  },

  // ── A call the instructions have already answered ───────────────────────
  get_my_card: {
    whenToUse: [
      'Anything about you beyond what your instructions and every footer already carry: the name, the id, ' +
        'the kind of token and the role.',
    ],
  },
};
