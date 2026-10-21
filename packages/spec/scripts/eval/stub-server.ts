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
 * EVAL_TOOLS         a JSON array of {name, description, input_schema}, with
 *                    title and heading_arguments for the heading of an answer
 *                    the world has no text for, untrusted for the wrapper of a
 *                    nested field and upload_arguments for the exactly-one rule
 *                    of an upload item; those four are not served
 * EVAL_RECORD        where calls are appended, one JSON object per line
 * EVAL_INSTRUCTIONS  optional file with the server instructions
 * EVAL_RESPONSES     optional fake workspace the answers come from (world.json)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { REFUSALS, RESPONSE_FORMAT } from '../../mcp-core';
import { pick, REFUSAL } from './world-pick';
import { toolSignature } from '../mcp-signature';

const TOOLS_PATH = process.env.EVAL_TOOLS;
const RECORD_PATH = process.env.EVAL_RECORD;
if (!TOOLS_PATH || !RECORD_PATH) {
  console.error('stub-server: EVAL_TOOLS and EVAL_RECORD are required');
  process.exit(1);
}

interface Listed {
  name: string;
  description: string;
  inputSchema: unknown;
  title?: string;
  headingArguments?: string[];
  untrusted?: string[];
  uploadArguments?: string[];
}

/**
 * The listing is read on every request, not at startup, so inputs rebuilt
 * between passes reach a server that is already connected.
 */
const readTools = (): Listed[] =>
  (JSON.parse(fs.readFileSync(TOOLS_PATH!, 'utf8')) as Array<{
    name: string;
    description: string;
    input_schema: unknown;
    title?: string;
    heading_arguments?: string[];
    untrusted?: string[];
    upload_arguments?: string[];
  }>).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.input_schema,
    title: t.title,
    headingArguments: t.heading_arguments,
    untrusted: t.untrusted,
    uploadArguments: t.upload_arguments,
  }));

/**
 * The heading of `RESPONSE_FORMAT.shape` — the title, then each path and query
 * argument passed except limit and cursor — for an answer the world has no text
 * of its own to take one from: a page past the end of a list it has no heading
 * for (`pick`).
 */
const headingOf = (tool: Listed, read: Record<string, unknown>): string | undefined => {
  if (!tool.title) return undefined;
  const named = new Set(tool.headingArguments ?? []);
  const order = Object.keys((tool.inputSchema as Field).properties ?? {});
  const parts = order
    .filter((name) => named.has(name) && read[name] !== undefined && read[name] !== null)
    .map((name) => ` · ${name} ${typeof read[name] === 'object' ? JSON.stringify(read[name]) : String(read[name])}`);
  return `## ${tool.title}${parts.join('')}`;
};

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

/**
 * The dates of the seven days as the footer's Days line and `{days}` both spell
 * them: «next week:» before the first Monday (`RESPONSE_FORMAT.footer`,
 * `INSTRUCTION_PLACEHOLDERS.days`).
 */
const footerDays = (days: string): string => days.replace(/(^|· )Mon /, (_, lead: string) => `${lead}next week: Mon `);

/**
 * A day field of a record whose when holds reads as its date in the zone of Now
 * with « (all day)» (`RESPONSE_FORMAT.whole_day`, day_fields: a task's due_at
 * when all_day is true). The world writes its own records that way; an answer
 * that echoes a moment from the call — a task made or moved to a whole day — is
 * read the same way here, since the server shows the day and not the moment.
 * The zone of Now is the offset `@now` carries.
 */
const offsetMinutes = (now: string): number => {
  const parts = now.match(/([+-])(\d{2}):(\d{2})$/);
  return parts ? (parts[1] === '-' ? -1 : 1) * (Number(parts[2]) * 60 + Number(parts[3])) : 0;
};

const dayIn = (moment: string, offset: number): string | undefined => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(moment)) return moment;
  const ms = Date.parse(moment);
  return Number.isNaN(ms) ? undefined : isoDay(ms + offset * 60_000);
};

const wholeDays = (body: string, world: World): string => {
  const offset = offsetMinutes(String(world['@now'] ?? ''));
  // One record as bold labels: the whole answer is that record.
  const allDay = /^\*\*all_day\*\* true$/m.test(body);
  return body
    .replace(/^(\*\*due_at\*\* )(\S+)$/gm, (line, label: string, moment: string) => {
      const day = allDay ? dayIn(moment, offset) : undefined;
      return day ? `${label}${day} (all day)` : line;
    })
    .replace(/(\bdue_at )(\S+)(?= · all_day true\b)/g, (part, label: string, moment: string) => {
      const day = dayIn(moment, offset);
      return day ? `${label}${day} (all day)` : part;
    });
};

const footerOf = (world: World): string => {
  const { now, weekday, days } = calendar(world);
  return `Now: ${now}, ${weekday} · you: ${String(world['@you'] ?? '')} · times above ending in Z are UTC: tell them in the zone of Now\nDays: ${footerDays(days)}`;
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
    days: footerDays(days),
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
  /** false closes an object; a schema makes it a map, every value of which is read and checked by that schema. */
  additionalProperties?: boolean | Field;
  /** base64: read without a data: URL prefix and line breaks, refused when it does not decode. */
  contentEncoding?: string;
}

/** The types a field declares, without the null it may also be: `["object", "null"]` reads as an object. */
const typesOf = (field: Field): string[] => [field.type ?? []].flat().filter((t) => t !== 'null');
const nullable = (field: Field): boolean => [field.type ?? []].flat().includes('null');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A property the object declares by that name; a key of a map is not one. */
const ownField = (schema: Field, name: string): Field | undefined =>
  schema.properties && Object.hasOwn(schema.properties, name) ? schema.properties[name] : undefined;

/** The value schema of a map: what every key an object does not declare reads by. */
const mapValue = (schema: Field): Field | undefined =>
  typeof schema.additionalProperties === 'object' ? schema.additionalProperties : undefined;

/** The field a key of an object reads by: its own property, or the value schema of a map. */
const fieldOf = (schema: Field, name: string): Field | undefined => ownField(schema, name) ?? mapValue(schema);

/**
 * Where a value sits, the way a problem names it: `files[0].content`,
 * `custom_properties[1].value`, and a key of a map in brackets with JSON
 * quotes, since a key is any text and a URL holds dots of its own:
 * `link_previews["https://a.b"].description`.
 */
const at = (path: string, name: string): string => (path ? `${path}.${name}` : name);
const keyAt = (path: string, key: string): string => `${path}[${JSON.stringify(key)}]`;

/** Base64 that decodes: the standard or the URL-safe alphabet, padding optional. */
const decodes = (text: string): boolean => /^[A-Za-z0-9+/_-]*={0,2}$/.test(text) && text.replace(/=+$/, '').length % 4 !== 1;

const problemsAs = (type: string, field: Field, value: unknown, path: string): string[] => {
  switch (type) {
    case 'integer':
      return Number.isInteger(value) ? [] : [`${path} must be an integer`];
    case 'number':
      return typeof value === 'number' ? [] : [`${path} must be a number`];
    case 'boolean':
      return typeof value === 'boolean' ? [] : [`${path} must be true or false`];
    case 'string':
      if (typeof value !== 'string') return [`${path} must be a string`];
      if (field.enum && !field.enum.includes(value)) return [`${path} must be one of ${field.enum.join(', ')}`];
      return field.contentEncoding === 'base64' && !decodes(value) ? [`${path} must be base64 that decodes`] : [];
    case 'array':
      if (!Array.isArray(value)) return [`${path} must be an array`];
      return value.flatMap((item, index) => problemsAt(field.items ?? {}, item, `${path}[${index}]`));
    case 'object':
      return isRecord(value) ? problemsOf(field, value, path) : [`${path} must be an object`];
    default:
      return [];
  }
};

/**
 * What is wrong with one value, each problem at its own path
 * (`RESPONSE_FORMAT.argument_reading`): a stray field of a file is
 * `files[0].x`, not «files has an item that has x». A value that fits any type
 * it declares fits; one that fits none gets the problems of the first.
 */
const problemsAt = (field: Field, value: unknown, path: string): string[] => {
  if (value === null) return nullable(field) || typesOf(field).length === 0 ? [] : [`${path} must not be null`];
  const found = typesOf(field).map((type) => problemsAs(type, field, value, path));
  return found.length === 0 || found.some((problems) => problems.length === 0) ? [] : found[0]!;
};

/**
 * A value as the server reads it: by the declared type first, so text that reads
 * as that type is taken as meant (`RESPONSE_FORMAT.argument_reading`). A client
 * that has not loaded a schema sends every value as text, and the server does
 * not hold that against the call. The other way holds too: a number or true and
 * false sent where text is declared is that text as JSON writes it — the value
 * 32 of a text extra field reaches the API as "32".
 */
const readValue = (field: Field, value: unknown): unknown => {
  const types = typesOf(field);
  if (typeof value !== 'string') {
    if (types.includes('array') && Array.isArray(value)) return value.map((item) => readValue(field.items ?? {}, item));
    if (types.includes('object') && isRecord(value)) return readArguments(field, value);
    const scalar = (typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean';
    const ownType =
      typeof value === 'boolean'
        ? types.includes('boolean')
        : types.includes('number') || (types.includes('integer') && Number.isInteger(value));
    if (scalar && !ownType && types.includes('string')) return readText(field, JSON.stringify(value));
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
        return readText(field, value);
    }
  }
  return value;
};

/**
 * Text read for a field of type string: base64 without the prefix of a data:
 * URL and without line breaks and spaces where the schema declares
 * contentEncoding base64 — whether what is left decodes is checked after — and
 * a value of the enum in another case as that value.
 */
const readText = (field: Field, value: string): string => {
  if (field.contentEncoding === 'base64') return value.replace(/^\s*data:[^,]*;base64,/i, '').replace(/\s+/g, '');
  const text = value.trim().toLowerCase();
  const known = field.enum?.find((v) => typeof v === 'string' && v.toLowerCase() === text);
  return typeof known === 'string' ? known : value;
};

const readArguments = (schema: Field, given: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(given).map(([name, value]) => {
      const field = fieldOf(schema, name);
      return [name, field ? readValue(field, value) : value];
    }),
  );

/**
 * The exactly-one rule of an upload item (`RESPONSE_FORMAT.argument_reading`):
 * an item goes as the key of a file already in place or as its content, so one
 * with both or with neither is refused at its own path, `files[0]`. An item
 * that is not an object is refused by its type already.
 */
const keyOrContent = (value: unknown, name: string): string[] =>
  (Array.isArray(value) ? value : [value]).flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const has = (part: unknown) => part !== undefined && part !== null;
    if (has(item.key) !== has(item.content)) return [];
    return [`${Array.isArray(value) ? `${name}[${index}]` : name} takes exactly one of key or content`];
  });

/**
 * What is wrong with the fields of one object, `uploads` naming the arguments
 * of the tool whose items are uploaded. A field an object closed with
 * additionalProperties false does not list is not an argument of the tool at
 * the top and not a field of that object inside it; a key of a map is any key,
 * named in brackets (`keyAt`).
 */
const problemsOf = (schema: Field, given: Record<string, unknown>, path = '', uploads: string[] = []): string[] => {
  const problems = (schema.required ?? [])
    .filter((name) => given[name] === undefined)
    .map((name) => `${at(path, name)} is required`);
  for (const [name, value] of Object.entries(given)) {
    const own = ownField(schema, name);
    const map = mapValue(schema);
    if (own) problems.push(...problemsAt(own, value, at(path, name)));
    else if (map) problems.push(...problemsAt(map, value, keyAt(path, name)));
    else if (schema.additionalProperties === false) {
      problems.push(path ? `${at(path, name)} is not a field of this object` : `${name} is not an argument of this tool`);
    }
  }
  for (const name of uploads) problems.push(...keyOrContent(given[name], name));
  return problems;
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

/**
 * The paths of the tool's untrusted list that reach inside one top-level field
 * of a record, relative to it: `.outgoing_url` and `.commands[]` of webhook,
 * `[].name` of files. A path that names the field itself is not among them.
 */
const untrustedInside = (tool: Listed | undefined, field: string): string[] =>
  (tool?.untrusted ?? []).flatMap((path) => {
    const parts = path.replace(/^data(\[\])?\./, '').match(/^(\w+)(.+)$/);
    return parts && parts[1] === field ? [parts[2]!] : [];
  });

/** Whether a value at a relative path is there and is neither null nor empty: an empty string, list or object. */
const holdsValue = (value: unknown, path: string): boolean => {
  const steps = path.match(/\[\]|\.\w+/g) ?? [];
  const walk = (node: unknown, i: number): boolean => {
    if (i === steps.length) {
      if (node === undefined || node === null || node === '') return false;
      if (Array.isArray(node)) return node.length > 0;
      return !isRecord(node) || Object.keys(node).length > 0;
    }
    const step = steps[i]!;
    if (step === '[]') return Array.isArray(node) && node.some((item) => walk(item, i + 1));
    return isRecord(node) && walk(node[step.slice(1)], i + 1);
  };
  return walk(value, 0);
};

/**
 * Whether a nested field the world marks ⟦…⟧ goes in the wrapper
 * (`RESPONSE_FORMAT.untrusted_wrapper`): the whole field, as its compact JSON,
 * unless every value at a path of the tool's untrusted list inside it is
 * absent, null, or an empty string, list or object. An answer that echoes a call cannot say that
 * in advance — a bot created without outgoing_url has a webhook with no words
 * in it — so the stub reads the JSON once it is filled. A field the list does
 * not reach into, or text that does not read as JSON, keeps the wrapper the
 * world gave it.
 */
const wrapsWhole = (tool: Listed | undefined, field: string, inner: string): boolean => {
  const paths = untrustedInside(tool, field);
  if (paths.length === 0) return true;
  let value: unknown;
  try {
    value = JSON.parse(inner);
  } catch {
    return true;
  }
  if (value === null) return false;
  return typeof value !== 'object' || paths.some((path) => holdsValue(value, path));
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
    send({
      jsonrpc: '2.0',
      id,
      result: { tools: readTools().map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) },
    });
    return;
  }
  if (method === 'tools/call') {
    const tool = readTools().find((t) => t.name === params?.name);
    const sent = (params?.arguments ?? {}) as Record<string, unknown>;
    // What is recorded and answered is what the server reads, not the text the
    // client happened to send.
    const read = tool ? readArguments(tool.inputSchema as Field, sent) : sent;
    const problems = tool ? problemsOf(tool.inputSchema as Field, read, '', tool.uploadArguments ?? []) : [];
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
        .replace('{signature}', toolSignature(tool.inputSchema as Field));
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `${text}\n\n${footer}` }], isError: true } });
      return;
    }
    // A plausible answer keeps a chain going: the call that resolves a name has
    // to hand back an id, or the next step is impossible for reasons that have
    // nothing to do with what is being measured.
    const name = String(params?.name ?? '').replace(/^.*pachca_/, '');
    const heading = tool ? headingOf(tool, read) : undefined;
    const answer = ruleRefusal(name, read) ?? pick(world[name], read, heading) ?? pick(world['*'], read, heading) ?? 'Done.';
    // A canned answer that states an id of its own contradicts the call that
    // asked for another one, and the agent believes the answer: it read person
    // 3560 and then wrote to 18521. `{{user_id|18521}}` echoes what was asked,
    // falling back to the default when the argument was left out; `{{@me}}`
    // reads the world, and is filled first so it can stand in a fallback.
    // Inside the compact JSON of a nested field, `{{outgoing_url:json|null}}`
    // writes the value as a JSON literal — text quoted, null as null — and the
    // fallback, itself JSON (`"commands"`, `["/status"]`, null when there is
    // none), only when the argument was left out. Both forms are filled in one
    // pass, so a value the call sent is never read as a template itself.
    const echo = (value: unknown) => (typeof value === 'object' ? JSON.stringify(value) : String(value));
    const filled = (text: string): string =>
      text
        .replace(/\{\{@(\w+)(?:\|([^}]*))?\}\}/g, (_, key: string, fallback = '') =>
          world[`@${key}`] === undefined ? fallback : echo(world[`@${key}`]),
        )
        .replace(/\{\{(@?)(\w+)(:json)?(?:\|([^}]*))?\}\}/g, (_, own: string, key: string, json?: string, fallback = '') => {
          const value = own ? world[`@${key}`] : read[key];
          if (json) return value === undefined ? fallback || 'null' : JSON.stringify(value);
          return value === undefined || value === null ? fallback : echo(value);
        });
    // Text written by other people goes inside the wrapper, with a nonce no
    // content can guess (`RESPONSE_FORMAT.untrusted_wrapper`). The world marks
    // it ⟦…⟧, a nested field as its compact JSON in one pair; an empty string
    // carries no words and stays unwrapped, written "" as the world writes it,
    // and so does a nested field that holds no words where the tool's untrusted
    // list reaches into it (`wrapsWhole`).
    const nonce = crypto.randomBytes(4).toString('hex');
    const wrapped = (text: string): string =>
      text.replace(/⟦([\s\S]*?)⟧/g, (_, inner: string, offset: number) => {
        if (inner === '') return '""';
        const label = text.slice(Math.max(0, offset - 64), offset).match(/(?:\*\*(\w+)\*\*|(\w+):?) $/);
        const field = label?.[1] ?? label?.[2];
        return field && !wrapsWhole(tool, field, inner) ? inner : `<pachca_content_${nonce}>${inner}</pachca_content_${nonce}>`;
      });
    let body = wholeDays(filled(typeof answer === 'string' ? answer : JSON.stringify(answer, null, 1)), world);
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
