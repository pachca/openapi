/**
 * Score the runs of one set: did the agent get there, and with the right values.
 *
 * A run passes a scenario when some call it made is one the scenario accepts and
 * carries the thing the request named — a write, where the scenario accepts one. Not the first call: which call does the
 * work is a property of the shape of the set rather than of the agent — where a
 * set has a tool for the action, the first call does it; where a request names a
 * chat by its name, the call that finds it comes first and the action second.
 * Grading the first call measures the shape and calls it a difference in
 * behaviour.
 *
 * A value is held against the argument of that name and no other: a message id
 * passed as `parent_message_id` is not the thread the request wanted to write
 * to, and the call that passes it answers in the wrong place. An argument left
 * out counts as its default, the way the server reads it; a dotted name reaches
 * inside an argument, through a list item by item; a list matches whatever its
 * order.
 *
 * Every pass in `out/` is scored on its own and the passes are summarised
 * together, because a single pass says less than it looks: two passes of the
 * same model on the same listing disagreed 53 times against 5. A measure whose
 * spread across passes is wider than the gap between the things being compared
 * is not a measure yet, and the summary prints that spread.
 *
 * Usage: bun scripts/eval/score.ts <run-dir>
 */
import fs from 'node:fs';
import path from 'node:path';

interface Call {
  name: string;
  arguments: Record<string, unknown>;
  /** Why the server refused the call — its arguments, or the status and code the API answered; a refused call did nothing. */
  refused?: string;
}
interface Answer {
  id: string;
  /** When the request started, in milliseconds since the epoch; older runs lack it. */
  ran_at?: number;
  calls: Call[];
  text?: string;
  /** The tools the client's tool search handed back, whose descriptions the model could read before a call. */
  loaded?: string[];
  /** Calls the client refused before they reached the server. */
  client_errors?: Array<{ name: string; error: string }>;
}

interface Expectation {
  accept: string[];
  /** What the reply has to contain; `|` inside an entry separates words any of which will do. */
  says?: string[];
  args: {
    must?: Record<string, unknown>;
    present?: string[];
    absent?: string[];
    either?: Array<Record<string, unknown>>;
    onWeekday?: Record<string, string>;
    daysAgo?: Record<string, number>;
  } | null;
}

const runDir = process.argv[2];
if (!runDir) {
  console.error('usage: bun scripts/eval/score.ts <run-dir>');
  process.exit(1);
}

const answerKey = JSON.parse(fs.readFileSync(path.join(runDir, 'key.json'), 'utf8')) as {
  writes: string[];
  /** Per tool, what the server reads an argument left out as. */
  defaults?: Record<string, Record<string, unknown>>;
  scenarios: Record<string, Expectation>;
};
const key = answerKey.scenarios;
const writes = new Set(answerKey.writes);
const defaults = answerKey.defaults ?? {};

const same = (expected: unknown, actual: unknown): boolean => {
  if (typeof expected === 'string' && typeof actual === 'string') {
    return expected.trim().toLowerCase() === actual.trim().toLowerCase();
  }
  if (Array.isArray(expected) && Array.isArray(actual)) {
    const order = (list: unknown[]) => list.map((item) => JSON.stringify(item)).sort();
    return JSON.stringify(order(expected)) === JSON.stringify(order(actual));
  }
  return JSON.stringify(expected) === JSON.stringify(actual);
};

/** Whether the reply says it: `|` inside an entry separates words any of which will do. */
const says = (text: string, entry: string): boolean =>
  entry.split('|').some((word) => text.toLowerCase().includes(word.trim().toLowerCase()));

/**
 * The zone of the person the fake workspace acts for. A moment is judged on
 * their clock, not on the clock of whoever runs the set: 23:59 UTC on Wednesday
 * is Thursday in Moscow, and a status meant «до среды» that clears then is a
 * day late for them.
 */
const PERSON_ZONE = process.env.EVAL_ZONE ?? 'Europe/Moscow';

/**
 * A deadline named as a weekday is resolved against the day the run happens, so
 * the set does not rot. Only the local date is compared — the time of day is the
 * agent's to pick — and the midnight that ends the named day counts as that day:
 * «до среды» written as Thursday 00:00 is the end of Wednesday, exactly what the
 * instructions ask for.
 */
function landsOn(value: unknown, weekday: string): boolean {
  if (typeof value !== 'string') return false;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return false;
  const local = (moment: Date) =>
    new Intl.DateTimeFormat('en-US', { timeZone: PERSON_ZONE, weekday: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(moment)
      .reduce<Record<string, string>>((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  const here = local(at);
  if (here.weekday!.toLowerCase() === weekday) return true;
  const midnight = here.hour === '00' && here.minute === '00' && here.second === '00';
  return midnight && local(new Date(at.getTime() - 1000)).weekday!.toLowerCase() === weekday;
}

/**
 * A filter on the past is held to the local date a number of days before the day
 * the run happened: 1 is yesterday. The run's day is when that request ran, as
 * its record says, not when its file was written or when it is scored: a pass
 * merged or scored after midnight still counts back from the day each request
 * saw. A record without that time falls back to its file's. The time of day is
 * the agent's to pick, so a window opened at 00:00 local and one opened at 00:00
 * UTC both land on that day for a person east of UTC; one opened on a day ahead
 * does not.
 */
let ranAt = Date.now();
function landsDaysAgo(value: unknown, days: number): boolean {
  if (typeof value !== 'string') return false;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return false;
  const day = (moment: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: PERSON_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(moment);
  return day(at) === day(new Date(ranAt - days * 86_400_000));
}

/**
 * An all-day task can be written either way the spec describes: with the flag,
 * or with a `due_at` at exactly 23:59:59 in its own offset. The API keeps those
 * seconds, reads a task with them as an all-day one and answers `all_day: true`
 * for it, so a call that leaves the flag out and writes the end of the day has
 * made the same task.
 */
const endOfDay = (args: Record<string, unknown>): unknown => {
  const due = args.due_at;
  return typeof due === 'string' && /T23:59:59(\.0+)?(Z|[+-]\d{2}:?\d{2})?$/.test(due) ? true : undefined;
};

/**
 * What the server reads an argument left out as when it follows from another
 * argument rather than from a fixed default: read like a default, and only for
 * an argument the call did not pass. Keyed by the tool name without its prefix.
 */
const READINGS: Record<string, Record<string, (args: Record<string, unknown>) => unknown>> = {
  create_task: { all_day: endOfDay },
  update_task: { all_day: endOfDay },
};
const readingOf = (call: Call, name: string): unknown => READINGS[call.name.replace(/^pachca_/, '')]?.[name]?.(call.arguments);

/**
 * The values a call holds at a place: `entity_id`, `schedule.start_date`, or
 * `files.key`, which a list answers with the value of each item. An argument
 * left out is what the server reads it as — a value it follows from another
 * argument (`READINGS`), or its default — unless the question is whether it was
 * passed at all.
 */
function valuesAt(call: Call, place: string, asRead = true): unknown[] {
  const [head, ...rest] = place.split('.');
  const given =
    call.arguments[head!] ??
    (asRead ? (readingOf(call, head!) ?? defaults[call.name]?.[head!]) : undefined);
  let found: unknown[] = given === undefined ? [] : [given];
  for (const step of rest) {
    found = found
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[step] : undefined))
      .filter((value) => value !== undefined);
  }
  return found;
}

const empty = (value: unknown): boolean =>
  value === '' ||
  value === null ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0);

const holds = (call: Call, place: string, expected: unknown): boolean =>
  valuesAt(call, place).some((value) => same(expected, value));

function argsOk(call: Call, spec: NonNullable<Expectation['args']>): boolean {
  for (const [name, expected] of Object.entries(spec.must ?? {})) {
    if (!holds(call, name, expected)) return false;
  }
  // Present means a value: an empty string, list or object passes nothing.
  for (const name of spec.present ?? []) {
    if (!valuesAt(call, name).some((value) => !empty(value))) return false;
  }
  // Absent means not passed: a null says «none» in so many words and invents nothing.
  for (const name of spec.absent ?? []) {
    if (valuesAt(call, name, false).some((value) => value !== null)) return false;
  }
  for (const [name, weekday] of Object.entries(spec.onWeekday ?? {})) {
    if (!valuesAt(call, name).some((value) => landsOn(value, weekday))) return false;
  }
  for (const [name, days] of Object.entries(spec.daysAgo ?? {})) {
    if (!valuesAt(call, name).some((value) => landsDaysAgo(value, days))) return false;
  }
  if (spec.either?.length) {
    const any = spec.either.some((one) => Object.entries(one).every(([name, expected]) => holds(call, name, expected)));
    if (!any) return false;
  }
  return true;
}

function scorePass(
  answers: Answer[],
  fileMtime: number,
): { tool: [number, number]; args: [number, number]; misses: string[] } {
  const tool: [number, number] = [0, 0];
  const args: [number, number] = [0, 0];
  const misses: string[] = [];
  for (const answer of answers) {
    const expectation = key[answer.id];
    if (!expectation) continue;
    ranAt = answer.ran_at ?? fileMtime;
    const calls = answer.calls ?? [];
    // A call the server refused changed nothing and found nothing: it neither
    // reaches the answer nor counts as a write. What it shows is on the next call.
    const done = calls.filter((c) => !c.refused);
    const refused = calls.filter((c) => c.refused);
    // Where the key wants a write, the write is what gets there: the reads it
    // accepts beside it are the way to it. A run that read the message and
    // asked «заменить?», or found Petya and stopped, did not do what was asked,
    // and a read that takes the same argument as the write must not pass for it.
    const wantsWrite = expectation.accept.some((name) => writes.has(name));
    const reached = done.filter((c) => expectation.accept.includes(c.name) && (!wantsWrite || writes.has(c.name)));
    // «There is no tool for this» and «ask for what only the person has» are
    // failed by acting, not by looking. Reading around first is what a person
    // does; the failure is the write — in a measured run one agent removed
    // somebody from a chat instead of answering that it could not remove them
    // from the workspace.
    const acted = done.filter((c) => writes.has(c.name));
    const holdsBack = ['none', 'ask', 'answer'].some((special) => expectation.accept.includes(special));
    // A write nobody asked for fails the scenario however right the rest was:
    // pinning a message on «подними переписку», opening a thread to read one,
    // deleting a tag on «отвяжи тег» — a side effect the person has to undo is
    // worse than no answer.
    const unasked = acted.filter((c) => !expectation.accept.includes(c.name));
    // An answer is judged by what it says: an id read off the instructions is as
    // good as one read off a card, and a mistyped one is wrong either way.
    const unsaid = (expectation.says ?? []).filter((entry) => !says(answer.text ?? '', entry));
    const ok = holdsBack
      ? acted.length === 0 && unsaid.length === 0
      : calls.length > 0 && reached.length > 0 && unasked.length === 0 && unsaid.length === 0;
    tool[1] += 1;
    tool[0] += ok ? 1 : 0;
    if (!ok) {
      const made = done.map((c) => c.name).join(', ') || 'ни одного выполненного вызова';
      const turnedDown = refused.length ? `; отказано: ${refused.map((c) => `${c.name} (${c.refused})`).join(', ')}` : '';
      const why = holdsBack
        ? acted.length
          ? `сделал ${acted.map((c) => c.name).join(', ')}`
          : `в ответе нет ${unsaid.join(', ')}`
        : unasked.length
          ? `лишняя запись ${unasked.map((c) => c.name).join(', ')}`
          : reached.length && unsaid.length
            ? `в ответе нет ${unsaid.join(', ')}`
            : `${made}${turnedDown}`;
      const awaited = wantsWrite ? expectation.accept.filter((name) => writes.has(name)) : expectation.accept;
      // Which descriptions the model had loaded tells a rule it never read from
      // one it read and passed over; a call the client stopped tells a made-up
      // «готово» from one that was refused before the server.
      const loaded = answer.loaded ? ` · loaded: ${answer.loaded.join(', ') || '—'}` : '';
      const stopped = answer.client_errors?.length
        ? ` · client_errors: ${answer.client_errors.map((e) => `${e.name} (${e.error.replace(/\s+/g, ' ').slice(0, 80)})`).join(', ')}`
        : '';
      misses.push(`${answer.id}: ${why} (ждали ${awaited.join(' или ')})${loaded}${stopped}`);
    }
    if (ok && expectation.args && reached.length) {
      const good = reached.some((c) => argsOk(c, expectation.args!));
      args[1] += 1;
      args[0] += good ? 1 : 0;
      if (!good) misses.push(`${answer.id}: аргументы ${JSON.stringify(reached.map((c) => c.arguments))}`);
    }
  }
  return { tool, args, misses };
}

const files = fs.readdirSync(path.join(runDir, 'out')).filter((f) => f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error('nothing in out/ yet');
  process.exit(1);
}

const share = ([hit, total]: [number, number]): string =>
  total === 0 ? '—' : `${hit}/${total} ${Math.round((100 * hit) / total)}%`;
const percent = ([hit, total]: [number, number]): number => (total === 0 ? 0 : (100 * hit) / total);
const spread: Record<string, number[]> = { tool: [], args: [] };

for (const file of files) {
  const answers: Answer[] = JSON.parse(fs.readFileSync(path.join(runDir, 'out', file), 'utf8'));
  const { tool, args, misses } = scorePass(answers, fs.statSync(path.join(runDir, 'out', file)).mtimeMs);
  spread.tool!.push(percent(tool));
  spread.args!.push(percent(args));
  console.log(`${file.replace(/\.json$/, '').padEnd(20)} дошёл ${share(tool).padEnd(14)} аргументы ${share(args)}`);
  for (const miss of misses) console.log(`    ${miss}`);
}

if (files.length > 1) {
  console.log('\nразброс между проходами:');
  for (const [name, valuesOfPasses] of Object.entries(spread)) {
    const low = Math.min(...valuesOfPasses);
    const high = Math.max(...valuesOfPasses);
    const label = name === 'tool' ? 'дошёл' : 'аргументы';
    console.log(
      `  ${label.padEnd(10)} ${Math.round(low)}–${Math.round(high)}%` +
        `${high - low > 10 ? '  — разброс шире десяти пунктов, на одном проходе выводы делать нельзя' : ''}`,
    );
  }
}
