/**
 * Score the runs of one set: did the agent get there, and with the right values.
 *
 * A run passes a scenario when some call it made is one the scenario accepts and
 * carries the thing the request named. Not the first call: which call does the
 * work is a property of the shape of the set rather than of the agent — where a
 * set has a tool for the action, the first call does it; where a request names a
 * chat by its name, the call that finds it comes first and the action second.
 * Grading the first call measures the shape and calls it a difference in
 * behaviour.
 *
 * Values are compared, never argument names: two sets spell the same identifier
 * differently and neither is wrong.
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
  /** Why the server refused the arguments; a refused call did nothing. */
  refused?: string;
}
interface Answer {
  id: string;
  calls: Call[];
  text?: string;
}

type Scalar = string | number | boolean;

interface Expectation {
  accept: string[];
  /** What the reply has to contain, for a request answered from what the agent already holds. */
  says?: string[];
  args: {
    must?: Record<string, unknown>;
    present?: string[];
    absent?: string[];
    either?: Array<Record<string, Scalar>>;
    onWeekday?: Record<string, string>;
  } | null;
}

const runDir = process.argv[2];
if (!runDir) {
  console.error('usage: bun scripts/eval/score.ts <run-dir>');
  process.exit(1);
}

const answerKey = JSON.parse(fs.readFileSync(path.join(runDir, 'key.json'), 'utf8')) as {
  writes: string[];
  scenarios: Record<string, Expectation>;
};
const key = answerKey.scenarios;
const writes = new Set(answerKey.writes);

const same = (expected: unknown, actual: unknown): boolean =>
  typeof expected === 'string' && typeof actual === 'string'
    ? expected.trim().toLowerCase() === actual.trim().toLowerCase()
    : JSON.stringify(expected) === JSON.stringify(actual);

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

/** Every value the call passed, so a value can be matched whatever it is called. */
const values = (args: Record<string, unknown>): unknown[] => Object.values(args);

function argsOk(call: Call, spec: NonNullable<Expectation['args']>): boolean {
  const carries = (expected: Scalar): boolean => values(call.arguments).some((v) => same(expected, v));
  for (const [name, expected] of Object.entries(spec.must ?? {})) {
    if (!same(expected, call.arguments[name]) && !carries(expected as Scalar)) return false;
  }
  for (const name of spec.present ?? []) {
    if (call.arguments[name] === undefined || call.arguments[name] === '') return false;
  }
  for (const name of spec.absent ?? []) {
    if (call.arguments[name] !== undefined) return false;
  }
  for (const [name, weekday] of Object.entries(spec.onWeekday ?? {})) {
    if (!landsOn(call.arguments[name], weekday)) return false;
  }
  if (spec.either?.length) {
    const any = spec.either.some((one) =>
      Object.entries(one).every(([name, expected]) => same(expected, call.arguments[name]) || carries(expected)),
    );
    if (!any) return false;
  }
  return true;
}

function scorePass(answers: Answer[]): { tool: [number, number]; args: [number, number]; misses: string[] } {
  const tool: [number, number] = [0, 0];
  const args: [number, number] = [0, 0];
  const misses: string[] = [];
  for (const answer of answers) {
    const expectation = key[answer.id];
    if (!expectation) continue;
    const calls = answer.calls ?? [];
    // A call the server refused changed nothing and found nothing: it neither
    // reaches the answer nor counts as a write. What it shows is on the next call.
    const done = calls.filter((c) => !c.refused);
    const refused = calls.filter((c) => c.refused);
    const reached = done.filter((c) => expectation.accept.includes(c.name));
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
    const unsaid = (expectation.says ?? []).filter((s) => !(answer.text ?? '').toLowerCase().includes(s.toLowerCase()));
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
      misses.push(`${answer.id}: ${why} (ждали ${expectation.accept.join(' или ')})`);
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
  const { tool, args, misses } = scorePass(answers);
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
