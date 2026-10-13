/**
 * A stdio MCP server that serves a tool listing and records what gets called.
 *
 * This is the measuring instrument for the tool set: the client registers these
 * tools the way it will register the real ones, the model chooses with its own
 * machinery, and every call lands in a file instead of touching Pachca. The
 * earlier harness pasted the listing into a file for the model to read, which
 * measured something adjacent and hid its own faults — a listing longer than one
 * read silently lost its tail.
 *
 * Usage (through --mcp-config, never by hand):
 *   EVAL_TOOLS=<listing.json> EVAL_RECORD=<calls.jsonl> bun stub-server.ts
 *
 * EVAL_TOOLS         a JSON array of {name, description, input_schema}
 * EVAL_RECORD        where calls are appended, one JSON object per line
 * EVAL_INSTRUCTIONS  optional file with the server instructions
 * EVAL_RESPONSES     optional fake workspace the answers come from (world.json)
 */
import fs from 'node:fs';
import { RESPONSE_FORMAT } from '../../mcp-core';

const TOOLS_PATH = process.env.EVAL_TOOLS;
const RECORD_PATH = process.env.EVAL_RECORD;
if (!TOOLS_PATH || !RECORD_PATH) {
  console.error('stub-server: EVAL_TOOLS and EVAL_RECORD are required');
  process.exit(1);
}

/**
 * The listing is read on every request, not at startup, so inputs rebuilt
 * between passes reach a server that is already connected.
 */
const readTools = (): Array<{ name: string; description: string; inputSchema: unknown }> =>
  (JSON.parse(fs.readFileSync(TOOLS_PATH!, 'utf8')) as Array<{
    name: string;
    description: string;
    input_schema: unknown;
  }>).map((t) => ({ name: t.name, description: t.description, inputSchema: t.input_schema }));

/**
 * What a call answers with. A stub that says only "done" dead-ends every chain:
 * the agent looks a person up by name, gets nothing back, and asks the person
 * for an id — which then looks like the prose failing when it is the instrument.
 * Answers live in a file and are read per call, so they can be changed without
 * restarting anything.
 *
 * An answer is either the text itself or a set of texts keyed by a value the
 * call passed: `{"4719": "…", "199": "…", "*": "…"}` picks by whichever argument
 * matches. One answer per tool is enough only while every request names an id;
 * the moment requests name things instead, the same tool is called twice for
 * two different things, and a single answer makes them look identical.
 */
const readResponses = (): Record<string, unknown> => {
  const path = process.env.EVAL_RESPONSES;
  if (!path || !fs.existsSync(path)) return {};
  try {
    return JSON.parse(onToday(fs.readFileSync(path, 'utf8'))) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * The world's today is the day the call is made. The client tells the model the
 * date on its own, and a world that stays on the day it was written hands the
 * model two todays: a run that crossed midnight put «завтра» a day out and then
 * deleted the task it had made. Every date moves by the days since `@today`, and
 * each line spelling out a week is written again for the week of the new today.
 */
const DAY_MS = 86_400_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const onToday = (raw: string): string => {
  const written = raw.match(/"@today":\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
  const zone = raw.match(/"@zone":\s*"([^"]+)"/)?.[1] ?? 'UTC';
  if (!written) return raw;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const shift = Math.round((Date.parse(today) - Date.parse(written)) / DAY_MS);
  if (shift === 0) return raw;
  const monday = Date.parse(today) - ((new Date(Date.parse(today)).getUTCDay() + 6) % 7) * DAY_MS;
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => `${d} ${isoDay(monday + i * DAY_MS)}`).join(' · ');
  return raw
    .replace(/(?<!\d)(\d{4}-\d{2}-\d{2})(?!\d)/g, (date) => isoDay(Date.parse(date) + shift * DAY_MS))
    .replace(/(Now: (\d{4}-\d{2}-\d{2})T[^,]*, )[A-Z][a-z]+day/g, (_, head: string, date: string) => `${head}${WEEKDAYS[new Date(Date.parse(date)).getUTCDay()]}`)
    .replace(/Mon \d{4}-\d{2}-\d{2} · Tue \d{4}-\d{2}-\d{2} · Wed \d{4}-\d{2}-\d{2} · Thu \d{4}-\d{2}-\d{2} · Fri \d{4}-\d{2}-\d{2} · Sat \d{4}-\d{2}-\d{2} · Sun \d{4}-\d{2}-\d{2}/g, week);
};

/**
 * The instructions carry placeholders a real server fills when a connection
 * opens. The stub fills them from the fake workspace itself — the footer its
 * answers already carry — so the date before the first call and the date in
 * every result are the same date.
 */
const readInstructions = (): string | undefined => {
  if (!process.env.EVAL_INSTRUCTIONS || !fs.existsSync(process.env.EVAL_INSTRUCTIONS)) return undefined;
  const text = fs.readFileSync(process.env.EVAL_INSTRUCTIONS, 'utf8');
  const footer = String(Object.values(readResponses()).find((v) => typeof v === 'string' && /Now: /.test(v)) ?? '');
  const now = footer.match(/Now: (\d{4}-\d{2}-\d{2})T[^,]*, (\w+)(?: · you: ([^\n]+))?/);
  const week = footer.match(/Week: ([^\n]+)/);
  const fill: Record<string, string> = {
    caller: now?.[3]?.trim() ?? 'the person whose token this is',
    today: now ? `${now[1]}, ${now[2]}` : new Date().toISOString().slice(0, 10),
    week: week?.[1]?.trim() ?? '',
  };
  return text.replace(/\{(caller|today|week)\}/g, (_, name: string) => fill[name] ?? '');
};

const send = (message: unknown) => process.stdout.write(`${JSON.stringify(message)}\n`);

/**
 * Arguments the server would refuse, refused here too. The server checks a call
 * against the schema it published before doing anything; a stub that answers
 * every call hands back success for `pin_message(chat_id: "4719")` on a tool
 * that takes `id`, the agent never learns the call was wrong, and the run grades
 * something the real server would have stopped at the door.
 */
interface Field {
  type?: string;
  enum?: unknown[];
  items?: Field;
  properties?: Record<string, Field>;
  required?: string[];
  additionalProperties?: boolean;
}

const misfit = (field: Field, value: unknown): string | undefined => {
  switch (field.type) {
    case 'integer':
      return Number.isInteger(value) ? undefined : 'must be an integer';
    case 'number':
      return typeof value === 'number' ? undefined : 'must be a number';
    case 'boolean':
      return typeof value === 'boolean' ? undefined : 'must be true or false';
    case 'string':
      if (typeof value !== 'string') return 'must be a string';
      return field.enum && !field.enum.includes(value) ? `must be one of ${field.enum.join(', ')}` : undefined;
    case 'array': {
      if (!Array.isArray(value)) return 'must be an array';
      const inner = value.map((item) => misfit(field.items ?? {}, item)).find(Boolean);
      return inner ? `has an item that ${inner}` : undefined;
    }
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return 'must be an object';
      const inner = problemsOf(field, value as Record<string, unknown>);
      return inner.length ? `has ${inner.join(', ')}` : undefined;
    }
    default:
      return undefined;
  }
};

/**
 * A value as the server reads it: by the declared type first, so text that reads
 * as that type is taken as meant (`RESPONSE_FORMAT.argument_reading`). A client
 * that has not loaded a schema sends every value as text, and the server does
 * not hold that against the call.
 */
const readValue = (field: Field, value: unknown): unknown => {
  if (typeof value !== 'string') {
    if (field.type === 'array' && Array.isArray(value)) return value.map((item) => readValue(field.items ?? {}, item));
    if (field.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
      return readArguments(field, value as Record<string, unknown>);
    }
    return value;
  }
  const text = value.trim();
  switch (field.type) {
    case 'integer':
      return /^-?\d+$/.test(text) ? Number(text) : value;
    case 'number':
      return text !== '' && Number.isFinite(Number(text)) ? Number(text) : value;
    case 'boolean':
      return text === 'true' ? true : text === 'false' ? false : value;
    case 'array':
    case 'object':
      try {
        const parsed = JSON.parse(text);
        const fits = parsed !== null && typeof parsed === 'object' && Array.isArray(parsed) === (field.type === 'array');
        return fits ? readValue(field, parsed) : value;
      } catch {
        return value;
      }
    default:
      return value;
  }
};

const readArguments = (schema: Field, given: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(given).map(([name, value]) => {
      const field = schema.properties?.[name];
      return [name, field ? readValue(field, value) : value];
    }),
  );

const problemsOf = (schema: Field, given: Record<string, unknown>): string[] => {
  const properties = schema.properties ?? {};
  const problems = (schema.required ?? []).filter((name) => given[name] === undefined).map((name) => `${name} is required`);
  for (const [name, value] of Object.entries(given)) {
    const field = properties[name];
    if (!field) {
      if (schema.additionalProperties === false) problems.push(`${name} is not an argument of this tool`);
      continue;
    }
    const wrong = misfit(field, value);
    if (wrong) problems.push(`${name} ${wrong}`);
  }
  return problems;
};

/**
 * What a tool takes, spelled the way `RESPONSE_FORMAT.invalid_arguments` asks: a
 * star on what is required, an object with its fields, a list of objects with
 * the fields of one item, two levels down. A refusal that said only
 * `view (object, required)` sent the agent off to ask the person what a form
 * looks like.
 */
const signatureOf = (schema: Field, depth = 0): string =>
  Object.entries(schema.properties ?? {})
    .map(([name, field]) => `${name}${schema.required?.includes(name) ? '*' : ''} ${shapeOf(field, depth)}`)
    .join(', ');

const shapeOf = (field: Field, depth: number): string => {
  if (field.enum) return `(${field.enum.join(' | ')})`;
  if (field.type === 'object' && field.properties && depth < 2) return `{${signatureOf(field, depth + 1)}}`;
  if (field.type === 'array') {
    const item = field.items ?? {};
    return item.type === 'object' && item.properties && depth < 2 ? `[{${signatureOf(item, depth + 1)}}]` : `[${item.type ?? 'any'}]`;
  }
  return `(${field.type ?? 'any'})`;
};

function handle(request: { id?: number | string; method: string; params?: any }): void {
  const { id, method, params } = request;
  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'pachca-eval', version: '1.0.0' },
        ...((): object => {
          const text = readInstructions();
          return text ? { instructions: text } : {};
        })(),
      },
    });
    return;
  }
  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: readTools() } });
    return;
  }
  if (method === 'tools/call') {
    const tool = readTools().find((t) => t.name === params?.name);
    const sent = (params?.arguments ?? {}) as Record<string, unknown>;
    // What is recorded and answered is what the server reads, not the text the
    // client happened to send.
    const read = tool ? readArguments(tool.inputSchema as Field, sent) : sent;
    const problems = tool ? problemsOf(tool.inputSchema as Field, read) : [];
    if (params) params.arguments = read;
    fs.appendFileSync(
      RECORD_PATH!,
      `${JSON.stringify({
        name: params?.name,
        arguments: read,
        at: Date.now(),
        ...(problems.length ? { refused: problems.join('; ') } : {}),
      })}\n`,
    );
    if (tool && problems.length) {
      const text = RESPONSE_FORMAT.invalid_arguments
        .replace('{tool}', tool.name)
        .replace('{problems}', problems.join('; '))
        .replace('{signature}', signatureOf(tool.inputSchema as Field));
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }], isError: true } });
      return;
    }
    // A plausible answer keeps a chain going: the call that resolves a name has
    // to hand back an id, or the next step is impossible for reasons that have
    // nothing to do with what is being measured.
    const answers = readResponses();
    const name = String(params?.name ?? '').replace(/^.*pachca_/, '');
    const given = (params?.arguments ?? {}) as Record<string, unknown>;
    const pick = (entry: unknown): unknown => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return entry;
      const set = entry as Record<string, unknown>;
      for (const value of Object.values(given)) {
        const key = String(value);
        if (key in set) return set[key];
      }
      // A free-text query rarely equals a key: «webhook signature verification»
      // should still find the answer filed under «webhook».
      const text = Object.values(given).map((v) => String(v).toLowerCase()).join(' ');
      for (const [key, answer] of Object.entries(set)) {
        if (key !== '*' && /[a-zа-яё]/i.test(key) && text.includes(key.toLowerCase())) return answer;
      }
      return set['*'];
    };
    const answer = pick(answers[name]) ?? pick(answers['*']) ?? 'Готово.';
    // A canned answer that states an id of its own contradicts the call that
    // asked for another one, and the agent believes the answer: it read person
    // 3560 and then wrote to 18521. `{{user_id|18521}}` echoes what was asked,
    // falling back to the default when the argument was left out.
    const filled = (text: string): string =>
      text.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_, key: string, fallback = '') => {
        const passed = given[key];
        return passed === undefined || passed === null ? fallback : String(passed);
      });
    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: filled(typeof answer === 'string' ? answer : JSON.stringify(answer, null, 1)) }],
        isError: false,
      },
    });
    return;
  }
  if (method === 'ping') {
    send({ jsonrpc: '2.0', id, result: {} });
    return;
  }
  // Notifications carry no id and need no answer; anything else is unsupported.
  if (id !== undefined) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let newline = buffer.indexOf('\n');
  while (newline !== -1) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line) {
      try {
        handle(JSON.parse(line));
      } catch (error) {
        console.error('stub-server: bad message', error);
      }
    }
    newline = buffer.indexOf('\n');
  }
});
