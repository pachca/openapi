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
 * 2. **What to put in a field.** A request that names no hour takes the all-day
 *    flag rather than an invented time; the spec gives the shape of the value and
 *    has no place for that.
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
 * A rule that holds for every tool lives in the server instructions
 * (`mcp-core.ts`), not repeated per tool. They already carry the widest of them:
 * a day named in words is read off the week the footer carries rather than
 * counted; ids come from search, from webhooks and from the links people paste,
 * and a link is read parameter by parameter; «обсудим отдельно» is a thread
 * under the message it continues; a message «мне» goes to the caller's own id
 * with a personal token; handing a task to somebody is editing it; and a task
 * with nothing to name it by is still a task. A line repeating any of those
 * reaches the model twice.
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
 * A day with no hour in it, on either side of a task. The instructions say where
 * the date comes from; this says what to pass when the request names no time.
 */
const NO_HOUR_NOTE =
  'Pass it whenever the request names no hour — «к среде», «в любое время в понедельник», «в течение дня» — ' +
  'instead of inventing one that then shows in the task.';

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
  create_task: {
    arguments: { all_day: NO_HOUR_NOTE },
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
