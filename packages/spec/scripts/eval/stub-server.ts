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
 * It behaves like the server where the behaviour of an agent depends on it: the
 * instructions arrive with their placeholders filled, arguments are read and
 * refused by the published schema, an answer comes from a fake workspace
 * (`world.json`) in the text shape of `RESPONSE_FORMAT` — other people's text
 * inside the untrusted wrapper, the footer on every result, a refusal as a
 * result with `isError` and the line of `REFUSALS` for its status.
 *
 * What it does not serve: a tool's title, annotations and outputSchema, and a
 * structured half of a result. The server does not publish outputSchema or
 * return structuredContent either (response_format.structured_content): with
 * structuredContent in a result, Claude Code hands the model that JSON alone and
 * drops the text. This stub answers with the text half alone, as the real
 * server does; its wording is the hand-written text of world.json, not the
 * templates of response_format.
 *
 * Usage (through --mcp-config, never by hand):
 *   EVAL_TOOLS=<listing.json> EVAL_RECORD=<calls.jsonl> bun stub-server.ts
 *
 * EVAL_TOOLS         a JSON array of {name, description, input_schema}
 * EVAL_RECORD        where calls are appended, one JSON object per line
 * EVAL_INSTRUCTIONS  optional file with the server instructions
 * EVAL_RESPONSES     optional fake workspace the answers come from (world.json)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { REFUSALS, RESPONSE_FORMAT } from '../../mcp-core';
import { pick, REFUSAL } from './world-pick';

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
 * An answer is either the text itself or a set of texts keyed by values the call
 * passed (`pick`, in world-pick.ts). Keys starting with `@` describe the world
 * rather than answer a tool: `@now` and `@you` make the footer, `@role` the role
 * in `{caller}`, `@me` the caller's id that answers echo.
 */
type World = Record<string, unknown>;

const readWorld = (): World => {
  const path = process.env.EVAL_RESPONSES;
  if (!path || !fs.existsSync(path)) return {};
  try {
    return JSON.parse(onToday(fs.readFileSync(path, 'utf8'))) as World;
  } catch {
    return {};
  }
};

/**
 * The world's today is the day the call is made. The client tells the model the
 * date on its own, and a world that stays on the day it was written hands the
 * model two todays: a run that crossed midnight put «завтра» a day out and then
 * deleted the task it had made. Every date moves by the days since `@today`, and
 * the footer is built from the moved `@now`.
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
  return raw.replace(/(?<!\d)(\d{4}-\d{2}-\d{2})(?!\d)/g, (date) => isoDay(Date.parse(date) + shift * DAY_MS));
};

/**
 * The day of `@now`, its weekday, its UTC offset and the dates of the seven days
 * after it, as `RESPONSE_FORMAT.footer` and `{today}` and `{days}` spell them.
 */
function calendar(world: World): { now: string; day: string; weekday: string; offset: string; days: string } {
  const now = String(world['@now'] ?? new Date().toISOString());
  const day = now.slice(0, 10);
  const at = Date.parse(day);
  const zone = now.match(/([+-]\d{2}:\d{2})$/)?.[1] ?? '+00:00';
  const days = [1, 2, 3, 4, 5, 6, 7]
    .map((i) => `${WEEKDAYS[new Date(at + i * DAY_MS).getUTCDay()]!.slice(0, 3)} ${isoDay(at + i * DAY_MS)}`)
    .join(' · ');
  return { now, day, weekday: WEEKDAYS[new Date(at).getUTCDay()]!, offset: `UTC${zone}`, days };
}

const footerOf = (world: World): string => {
  const { now, weekday, days } = calendar(world);
  return `Now: ${now}, ${weekday} · you: ${String(world['@you'] ?? '')} · times above are UTC: tell them in the zone of Now\nDays: ${days}`;
};

/**
 * The instructions carry placeholders the server fills from the token of the
 * request that carries them. The stub fills them from the same fake workspace
 * its answers come from, so the date before the first call, the date in every
 * footer and the caller are one and the same.
 */
const readInstructions = (): string | undefined => {
  if (!process.env.EVAL_INSTRUCTIONS || !fs.existsSync(process.env.EVAL_INSTRUCTIONS)) return undefined;
  const text = fs.readFileSync(process.env.EVAL_INSTRUCTIONS, 'utf8');
  const world = readWorld();
  const { day, weekday, offset, days } = calendar(world);
  const you = String(world['@you'] ?? 'the account whose token this is');
  const fill: Record<string, string> = {
    caller: world['@role'] ? `${you}, ${String(world['@role'])}` : you,
    today: `${day}, ${weekday}, ${offset}`,
    days,
  };
  return text.replace(/\{(caller|today|days)\}/g, (_, name: string) => fill[name] ?? '');
};

const send = (message: unknown) => process.stdout.write(`${JSON.stringify(message)}\n`);

/** Messages sent in this run, by id: the answer that created each. */
const created = new Map<string, string>();

/**
 * Arguments the server would refuse, refused here too. The server checks a call
 * against the schema it published before doing anything; a stub that answers
 * every call hands back success for `pin_message(chat_id: "4719")` on a tool
 * that takes `id`, the agent never learns the call was wrong, and the run grades
 * something the real server would have stopped at the door.
 */
interface Field {
  type?: string | string[];
  enum?: unknown[];
  items?: Field;
  properties?: Record<string, Field>;
  required?: string[];
  additionalProperties?: boolean;
}

/** The types a field declares, without the null it may also be: `["object", "null"]` reads as an object. */
const typesOf = (field: Field): string[] => [field.type ?? []].flat().filter((t) => t !== 'null');
const nullable = (field: Field): boolean => [field.type ?? []].flat().includes('null');

const misfitAs = (type: string | undefined, field: Field, value: unknown): string | undefined => {
  switch (type) {
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

const misfit = (field: Field, value: unknown): string | undefined => {
  if (value === null) return nullable(field) || typesOf(field).length === 0 ? undefined : 'must not be null';
  const types = typesOf(field);
  if (types.length === 0) return undefined;
  const reasons = types.map((type) => misfitAs(type, field, value));
  return reasons.some((r) => r === undefined) ? undefined : reasons[0];
};

/**
 * A value as the server reads it: by the declared type first, so text that reads
 * as that type is taken as meant (`RESPONSE_FORMAT.argument_reading`). A client
 * that has not loaded a schema sends every value as text, and the server does
 * not hold that against the call.
 */
const readValue = (field: Field, value: unknown): unknown => {
  const types = typesOf(field);
  if (typeof value !== 'string') {
    if (types.includes('array') && Array.isArray(value)) return value.map((item) => readValue(field.items ?? {}, item));
    if (types.includes('object') && value && typeof value === 'object' && !Array.isArray(value)) {
      return readArguments(field, value as Record<string, unknown>);
    }
    return value;
  }
  const text = value.trim();
  if (text === 'null' && nullable(field)) return null;
  for (const type of types) {
    switch (type) {
      case 'integer':
        if (/^-?\d+$/.test(text)) return Number(text);
        break;
      case 'number':
        if (text !== '' && Number.isFinite(Number(text))) return Number(text);
        break;
      case 'boolean':
        if (text === 'true' || text === 'false') return text === 'true';
        break;
      case 'array':
      case 'object':
        try {
          const parsed = JSON.parse(text);
          if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed) === (type === 'array')) {
            return readValue(field, parsed);
          }
        } catch {
          // not JSON: left as text, and refused below if text is not its type
        }
        break;
      case 'string':
        return field.enum?.find((v) => typeof v === 'string' && v.toLowerCase() === text.toLowerCase()) ?? value;
    }
  }
  return value;
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
 * What a tool takes, spelled the way `RESPONSE_FORMAT.signature` asks: a
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
  const types = typesOf(field);
  const orNull = nullable(field) ? ' or null' : '';
  if (types.includes('object') && field.properties && depth < 2) return `{${signatureOf(field, depth + 1)}}${orNull}`;
  if (types.includes('array')) {
    const item = field.items ?? {};
    const itemTypes = typesOf(item);
    if (itemTypes.includes('object') && item.properties && depth < 2) return `[{${signatureOf(item, depth + 1)}}]${orNull}`;
    // A list of lists — the rows of buttons — spells its inner list the same way.
    if (itemTypes.includes('array')) return `[${shapeOf(item, depth)}]${orNull}`;
    return `[${itemTypes.join(' | ') || 'any'}]${orNull}`;
  }
  return `(${types.join(' | ') || 'any'}${orNull})`;
};

/**
 * Rules of the API that a key of the world cannot spell. The export period is
 * at most 45 days from start to end, 366 with `chat_ids`, and cannot end before
 * it starts; the API refuses any other with `422 invalid_date_range`. A stub
 * that answers such a call with an export number rewards a call that fails in
 * production.
 */
function ruleRefusal(name: string, read: Record<string, unknown>): string | undefined {
  if (name !== 'request_export') return undefined;
  const day = (value: unknown) => (typeof value === 'string' ? Date.parse(value.slice(0, 10)) : Number.NaN);
  const start = day(read.start_at);
  const end = day(read.end_at);
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  const allowed = Array.isArray(read.chat_ids) && read.chat_ids.length > 0 ? 366 : 45;
  const days = Math.round((end - start) / 86_400_000);
  if (days >= 0 && days <= allowed) return undefined;
  return `!422 invalid_date_range · key system · message Выбран слишком большой диапазон дат: максимум ${allowed} дней.`;
}

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
    const record = (refused?: string) =>
      fs.appendFileSync(
        RECORD_PATH!,
        `${JSON.stringify({ name: params?.name, arguments: read, at: Date.now(), ...(refused ? { refused } : {}) })}\n`,
      );
    const world = readWorld();
    const footer = footerOf(world);
    if (tool && problems.length) {
      record(problems.join('; '));
      const text = RESPONSE_FORMAT.invalid_arguments
        .replace('{tool}', tool.name)
        .replace('{problems}', problems.join('; '))
        .replace('{signature}', signatureOf(tool.inputSchema as Field));
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `${text}\n\n${footer}` }], isError: true } });
      return;
    }
    // A plausible answer keeps a chain going: the call that resolves a name has
    // to hand back an id, or the next step is impossible for reasons that have
    // nothing to do with what is being measured.
    const name = String(params?.name ?? '').replace(/^.*pachca_/, '');
    const answer = ruleRefusal(name, read) ?? pick(world[name], read) ?? pick(world['*'], read) ?? 'Done.';
    // A canned answer that states an id of its own contradicts the call that
    // asked for another one, and the agent believes the answer: it read person
    // 3560 and then wrote to 18521. `{{user_id|18521}}` echoes what was asked,
    // falling back to the default when the argument was left out; `{{@me}}`
    // reads the world, and is filled first so it can stand in a fallback.
    const echo = (value: unknown) => (typeof value === 'object' ? JSON.stringify(value) : String(value));
    const filled = (text: string): string =>
      text
        .replace(/\{\{@(\w+)(?:\|([^}]*))?\}\}/g, (_, key: string, fallback = '') =>
          world[`@${key}`] === undefined ? fallback : echo(world[`@${key}`]),
        )
        .replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_, key: string, fallback = '') =>
          read[key] === undefined || read[key] === null ? fallback : echo(read[key]),
        );
    // Text written by other people goes inside the wrapper, with a nonce no
    // content can guess (`RESPONSE_FORMAT.untrusted_wrapper`).
    const nonce = crypto.randomBytes(4).toString('hex');
    const wrapped = (text: string): string =>
      text.replace(/⟦([\s\S]*?)⟧/g, (_, inner: string) => `<pachca_content_${nonce}>${inner}</pachca_content_${nonce}>`);
    let body = filled(typeof answer === 'string' ? answer : JSON.stringify(answer, null, 1));
    // A message sent in this run exists from then on: reading it back or reacting
    // to it answers as for any message, instead of the 404 the world gives an id
    // it does not know.
    const own = created.get(String(read.id ?? ''));
    if (own && REFUSAL.test(body)) {
      if (name === 'get_message') body = own;
      if (name === 'add_reaction') body = `## Reaction ${echo(read.code)} added to message ${echo(read.id)}`;
    }
    const made = body.match(/^## Message (\d+)\n/);
    if (made && name !== 'get_message') created.set(made[1]!, body);
    const refusal = body.match(REFUSAL);
    if (refusal) {
      const [, status, code, rest] = refusal;
      record(`${status} ${code}`);
      const text = `${REFUSALS[status!] ?? `The API answered ${status}.`}\n\nerrors: code ${code}${rest}\n\n${footer}`;
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: wrapped(text) }], isError: true } });
      return;
    }
    record();
    send({
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: wrapped(`${body}\n\n${footer}`) }], isError: false },
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
