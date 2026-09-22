/**
 * Build the MCP tool manifest from the live spec and the rules in `mcp-core.ts`.
 *
 * The backend keeps no list of its own — it loads this manifest. Every public
 * API operation becomes its own tool, named, typed and described from the spec
 * (`openapi.yaml`, its English text from `openapi.en.yaml`), so a method added to
 * the contract is in the set the same day and nobody decides anything twice.
 * What generation cannot produce is written by hand and lives elsewhere: names
 * that would send a model to the wrong door, the steps that are not actions, the
 * instructions and the shape of an answer (`mcp-core.ts`), and the prose for what
 * the spec does not say (`mcp-tools.ts`).
 *
 * Scopes and roles are never written by hand. They come from
 * `x-requirements.scope` of the operation and from `x-scope-roles` of the spec,
 * so permissions have exactly one source and cannot drift. That holds for every
 * operation a tool runs, not only the one it is named after: the upload steps
 * inside sending a message bring their permission to the argument that triggers
 * them, and a service tool's permissions are read from the operations it calls.
 *
 * The build fails — it does not warn — when:
 *   - an operation of the spec is neither a tool nor a declared chain step, so a
 *     newly added API method cannot silently end up nowhere;
 *   - an operation folded into a tool does not bring its access along — its scope
 *     missing from the argument that runs it, or its roles, plan or bot-only mark
 *     stricter than the tool's — or a service tool calls an operation the spec
 *     does not have;
 *   - anything the spec lets a call send or answer does not reach the tool: a
 *     parameter, a field of the body or of a file, a variant of a union, the
 *     values of a map, a field of the answer — or reaches it without its type,
 *     an enum value, what that value means, or the null it may be;
 *   - an argument has no place in the request, or two places share a name; an
 *     answer with a body declares no schema, a redirect no url;
 *   - a name is duplicated, is not snake_case, or exceeds 64 characters;
 *   - a description still carries a sentence written for an HTTP client, or a
 *     compact card names a field the entity does not have;
 *   - prose is written for a tool that does not exist, or names a tool or an
 *     argument that the listing it appears in does not carry;
 *   - a schema uses composition keywords that some clients silently drop;
 *   - a scenario expects a tool that is not in the set, or an argument that the
 *     tool does not take, or a value outside its enum;
 *   - a scenario's chat, id, wording or expected value appears in text the model
 *     reads, so a copied example would pass for the work;
 *   - the manifest and its schema disagree.
 *
 * Usage: bun scripts/generate-mcp-manifest.ts
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {
  BOT_TOKEN_ONLY,
  CACHE_POLICY,
  CHAIN_STEPS,
  COMPACT_PROJECTIONS,
  DESTRUCTIVE,
  NAME_OVERRIDES,
  REFUSALS,
  RESPONSE_FORMAT,
  INSTRUCTION_PLACEHOLDERS,
  SERVER_INFO,
  SERVER_INSTRUCTIONS,
  SERVICE_TOOLS,
  TOOL_NAME_IN_PROSE,
  TOOL_PREFIX,
  DRAFT_ARGUMENT,
  DRAFT_CLEANUP,
  VIEW_ARGUMENT,
  type McpServiceTool,
  type OperationKey,
  type ToolKind,
} from '../mcp-core';
import { TOOL_SCENARIOS } from '../mcp-scenarios';
import { MCP_TOOL_PROSE } from '../mcp-tools';

const HERE = import.meta.dir;
const SPEC_PATH = path.join(HERE, '..', 'openapi.yaml');
/** Descriptions come from the English spec — models read the manifest. */
const SPEC_EN_PATH = path.join(HERE, '..', 'openapi.en.yaml');
const OUT_PATH = path.join(HERE, '..', 'mcp-manifest.json');
const SCHEMA_PATH = path.join(HERE, '..', 'mcp-manifest.schema.json');
/** The fake workspace a judged run answers from; the ids a scenario's key wants live in it. */
const WORLD_PATH = path.join(HERE, 'eval', 'world.json');

/** Manifest schema version. Bump the major when consumers must be updated. */
const SCHEMA_VERSION = '2.0.0';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
type Role = 'owner' | 'admin' | 'user' | 'bot';
const ALL_ROLES: Role[] = ['owner', 'admin', 'user', 'bot'];

/**
 * Listings a token can receive. The protocol allows a different list per
 * authorization, so a tool whose scope this role never gets is not shown at all:
 * an unusable tool in the listing is a wrong turn waiting to happen, and in a
 * measured run an unfiltered set handed a personal token a bot-only method.
 */
const AUDIENCES: Array<{ key: string; role: Role; plan: string | null }> = [
  { key: 'owner:corporation', role: 'owner', plan: 'corporation' },
  { key: 'owner', role: 'owner', plan: null },
  { key: 'admin', role: 'admin', plan: null },
  { key: 'user', role: 'user', plan: null },
  { key: 'bot', role: 'bot', plan: null },
];

type YamlNode = any;
interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  enum?: unknown[];
  description?: string;
  default?: unknown;
  [k: string]: unknown;
}

const key = (method: string, p: string): OperationKey => `${method.toUpperCase()} ${p}`;
const snake = (id: string): string =>
  id.split('_').pop()!.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const normaliseScope = (scope: string): string => scope.replace(/[:.]/g, '_');

interface Operation {
  key: OperationKey;
  method: string;
  path: string;
  name: string;
  kind: ToolKind;
  scope: string | null;
  plan: string | null;
  roles: Role[];
  botTokenOnly: boolean;
  node: YamlNode;
  nodeEn: YamlNode;
}

/** Resolve `$ref` and a single-element `allOf`, which the spec uses for enums. */
function flatten(node: any, doc: YamlNode, depth = 0): any {
  if (!node || depth > 10) return node;
  if (node.$ref) {
    const name = String(node.$ref).split('/').pop()!;
    return flatten(doc.components?.schemas?.[name], doc, depth + 1);
  }
  if (Array.isArray(node.allOf) && node.allOf.length === 1) {
    const rest = Object.fromEntries(Object.entries(node).filter(([k]) => k !== 'allOf'));
    return { ...flatten(node.allOf[0], doc, depth + 1), ...rest };
  }
  return node;
}

const SPEC_LIMITS = ['maxLength', 'minLength', 'maximum', 'minimum', 'maxItems', 'minItems'] as const;

/**
 * Facts about the wire rather than about intent: the shape a value has to have
 * and one value of that shape. They travel in the schema, apart from the
 * description: when prose still replaced descriptions, that is exactly how the
 * shape got lost — four requests that named a weekday put the word «Friday» into
 * a field the spec declares as a date-time.
 */
const SPEC_SHAPE = ['format', 'example'] as const;

/**
 * How deep a structured value is spelled out. An argument reaches five levels in
 * a form — the view, its blocks, a block, its options, an option; a response
 * reaches a little further, into what a record carries about its author.
 */
const NESTING = { input: 5, output: 6 } as const;

/** A structured example travels only while it stays this short. */
const EXAMPLE_CHARS = 200;

interface Shape {
  /** Whether this is an argument or part of an answer. */
  side: keyof typeof NESTING;
}

/**
 * A property as the listing carries it: type, wording and the limits the API
 * actually enforces. Limits matter — a model that knows a title stops at fifty
 * characters writes fifty, instead of failing validation and trying again.
 *
 * Structure goes all the way down to what a value is made of. Keeping only the
 * outer type left `buttons` an array of arrays of nothing, and in a measured run
 * the model, with no idea what a button is, sent the question and added two
 * reactions instead. A map keeps the shape of its values, and a union keeps
 * its variants (`variantsAsOne`).
 *
 * An answer is described without examples and without required fields: a read
 * cuts each record to its compact card, and the card has to fit the same schema
 * the whole record does.
 */
function property(schema: any, doc: YamlNode, depth = 0, shape: Shape = { side: 'input' }): JsonSchema {
  const source = flatten(schema, doc);
  const variants = source?.anyOf ?? source?.oneOf;
  if (!source?.type && Array.isArray(variants)) return variantsAsOne(source, variants, doc, depth, shape);
  const out: JsonSchema = {};
  for (const k of ['type', 'description', 'enum', 'default', ...SPEC_LIMITS]) {
    if (source?.[k] !== undefined) (out as any)[k] = source[k];
  }
  // What each value of an enum means is in the spec, and a model choosing between
  // `is_member` and `public`, or reading an `event_key`, needs it as much as the
  // values themselves.
  const meanings = source?.['x-enum-descriptions'];
  if (meanings && typeof meanings === 'object') {
    const said = String(out.description ?? '').trim();
    const spelled = Object.entries<any>(meanings).map(([value, meaning]) => `${value} — ${String(meaning).trim()}`).join('; ');
    out.description = `${said && !/[.!?]$/.test(said) ? `${said}.` : said} Values: ${spelled}.`.trim();
  }
  // A field the API answers with null has to allow null: a client that checks an
  // answer against its schema refuses the whole answer over one empty field.
  if (source?.nullable && out.type) {
    out.type = [out.type, 'null'].flat();
    if (out.enum) out.enum = [...out.enum, null];
  }
  for (const k of SPEC_SHAPE) {
    const value = source?.[k];
    if (value === undefined || (k === 'example' && shape.side === 'output')) continue;
    const scalar = ['string', 'number', 'boolean'].includes(typeof value);
    if (scalar || JSON.stringify(value).length <= EXAMPLE_CHARS) (out as any)[k] = value;
  }
  const limit = NESTING[shape.side];
  if (source?.type === 'array') {
    out.items =
      depth < limit ? property(source.items, doc, depth + 1, shape) : { type: flatten(source.items, doc)?.type ?? 'string' };
  }
  if (source?.type === 'object' && source.properties && depth <= limit) {
    out.properties = Object.fromEntries(
      Object.entries<any>(source.properties).map(([name, child]) => [name, property(child, doc, depth + 1, shape)]),
    );
    if (source.required?.length && shape.side === 'input') out.required = source.required;
  }
  if (source?.type === 'object' && source.additionalProperties && typeof source.additionalProperties === 'object') {
    out.additionalProperties = property(source.additionalProperties, doc, depth + 1, shape);
  }
  if (source?.format === 'binary') {
    const said = String(out.description ?? '').trim();
    out.description = `${said && !/[.!?]$/.test(said) ? `${said}.` : said} The file contents, base64-encoded.`.trim();
  }
  // A field points at neighbours the same way an operation does, so it gets the
  // same translation: a method becomes its tool, a guide becomes a page to read.
  if (typeof out.description === 'string') out.description = linksAsTools(out.description).replace(/\s+/g, ' ').trim();
  return out;
}

/**
 * A union of objects told apart by `type` — the blocks of a form — spelled as one
 * object: every field any variant has, `type` listing every variant, and the
 * description saying which fields belong to which type. Composition keywords make
 * several clients drop the tool without a word, and left out, the union was an
 * empty schema that told a model nothing about what a block is.
 */
function variantsAsOne(source: any, variants: any[], doc: YamlNode, depth: number, shape: Shape): JsonSchema {
  const resolved = variants.map((v) => ({ name: String(v?.$ref ?? '').split('/').pop(), schema: flatten(v, doc) }));
  const properties: Record<string, JsonSchema> = {};
  const kinds: string[] = [];
  const lines: string[] = [];
  const itemKeys = (child: any): string =>
    Object.keys(flatten(flatten(child, doc)?.items, doc)?.properties ?? {}).join(', ');
  const kindMeanings: string[] = [];
  for (const { name, schema: variant } of resolved) {
    const typeField = flatten(variant?.properties?.type, doc);
    const kind = typeField?.enum?.[0] ?? name;
    if (typeField?.enum?.[0]) {
      kinds.push(kind);
      const meaning = typeField['x-enum-descriptions']?.[kind];
      if (meaning) kindMeanings.push(`${kind} — ${String(meaning).trim()}`);
    }
    const required = new Set<string>(variant?.required ?? []);
    const fields = Object.keys(variant?.properties ?? {}).filter((field) => field !== 'type');
    const spelled = fields.map((field) => {
      const nested = itemKeys(variant.properties[field]);
      const differs = nested && resolved.some((other) => other.schema?.properties?.[field] && itemKeys(other.schema.properties[field]) !== nested);
      return `${field}${required.has(field) ? '*' : ''}${differs ? ` (${nested})` : ''}`;
    });
    lines.push(spelled.length ? `${kind}: ${spelled.join(', ')}` : kind);
    for (const [field, child] of Object.entries<any>(variant?.properties ?? {})) {
      if (field === 'type' && kinds.length) continue;
      const built = property(child, doc, depth + 1, shape);
      properties[field] = properties[field] ? mergeShapes(properties[field]!, built) : built;
    }
  }
  if (kinds.length) {
    properties.type = {
      type: 'string',
      enum: kinds,
      ...(kindMeanings.length ? { description: `Values: ${kindMeanings.join('; ')}.` } : {}),
    };
  }
  const said = String(source?.description ?? '').replace(/\s+/g, ' ').trim();
  return {
    type: 'object',
    description: `${said ? `${said}. ` : ''}One of — ${lines.join('; ')}${shape.side === 'input' ? ' (* — required)' : ''}.`,
    properties,
    ...(kinds.length && shape.side === 'input' ? { required: ['type'] } : {}),
  };
}

/**
 * Two variants' spelling of one field, as one: every type either allows, every
 * enum value either lists, the nested fields of both. An event is `submit` in
 * one variant of a payload and `click` in another; keeping the first variant's
 * spelling lost the rest.
 */
function mergeShapes(a: JsonSchema, b: JsonSchema): JsonSchema {
  const out: JsonSchema = { ...a };
  const types = [...new Set([a.type, b.type].flat().filter(Boolean))] as string[];
  if (types.length > 1) out.type = types;
  if (a.enum || b.enum) {
    out.enum = a.enum && b.enum ? [...new Set([...a.enum, ...b.enum])] : undefined;
  }
  // The meanings of values the other variant adds come along with the values.
  const added = String(b.description ?? '')
    .match(/Values: (.*)\.$/)?.[1]
    ?.split('; ')
    .filter((pair) => !String(out.description ?? '').includes(pair));
  if (added?.length) {
    const said = String(out.description ?? '').replace(/\.$/, '');
    out.description = `${said}${said.includes('Values: ') ? '; ' : `${said ? '.' : ''} Values: `}${added.join('; ')}.`.trim();
  }
  if (a.items || b.items) out.items = a.items && b.items ? mergeShapes(a.items, b.items) : (a.items ?? b.items);
  if (a.properties || b.properties) {
    const properties = { ...(a.properties ?? {}) };
    for (const [name, field] of Object.entries(b.properties ?? {})) {
      properties[name] = properties[name] ? mergeShapes(properties[name]!, field) : field;
    }
    out.properties = properties;
    const required = (a.required ?? []).filter((name) => (b.required ?? []).includes(name));
    out.required = required.length ? required : undefined;
  }
  const values = [a.additionalProperties, b.additionalProperties].filter((v) => v && typeof v === 'object') as JsonSchema[];
  if (values.length) out.additionalProperties = values.length === 2 ? mergeShapes(values[0]!, values[1]!) : values[0];
  return out;
}

/** Every operation of the spec, with the access it needs. */
/**
 * Which tool serves which operation, so a cross-reference in the spec can be
 * said the way a model can act on it.
 *
 * The spec links neighbours the way documentation does — `[Bot token
 * rotation](POST /bots/{id}/recreate_token)`. A reader opens that page; a model
 * has no page and no HTTP, only tools, so the path is both unusable and noise.
 * Filled by `readOperations`, read by `specText`.
 */
const TOOL_BY_KEY = new Map<OperationKey, string>();

/**
 * Every name the spec itself uses: schema fields, parameters, error codes and
 * enum values. A description may name any of them, and a model needs them —
 * `submit_expired` is what an answer that came too late says, `export_id` is
 * the field an export answers with. Filled by `readOperations`, read by the
 * check that hunts for pointers at tools nobody has.
 */
const SPEC_VOCABULARY = new Set<string>();

/** Walk a spec document and remember every name a description may legitimately use. */
function collectVocabulary(doc: YamlNode): void {
  const walk = (node: any, depth = 0): void => {
    if (!node || typeof node !== 'object' || depth > 12) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    for (const [k, v] of Object.entries<any>(node)) {
      if (k === 'properties' && v && typeof v === 'object') for (const name of Object.keys(v)) SPEC_VOCABULARY.add(name);
      if (k === 'x-enum-descriptions' && v && typeof v === 'object') for (const name of Object.keys(v)) SPEC_VOCABULARY.add(name);
      if (k === 'enum' && Array.isArray(v)) for (const value of v) if (typeof value === 'string') SPEC_VOCABULARY.add(value);
      if (k === 'name' && typeof v === 'string') SPEC_VOCABULARY.add(v);
      walk(v, depth + 1);
    }
  };
  walk(doc);
}

function readOperations(): Operation[] {
  const doc = yaml.load(fs.readFileSync(SPEC_PATH, 'utf8')) as YamlNode;
  const docEn = yaml.load(fs.readFileSync(SPEC_EN_PATH, 'utf8')) as YamlNode;
  const roleTable = docEn.components?.schemas?.OAuthScope?.['x-scope-roles'] ?? {};
  collectVocabulary(docEn);
  const out: Operation[] = [];
  for (const [p, item] of Object.entries<any>(doc.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const node = item[method];
      if (!node) continue;
      const k = key(method, p);
      const scope: string | null = node['x-requirements']?.scope ?? null;
      const botTokenOnly = BOT_TOKEN_ONLY.has(k);
      let roles: Role[] = scope ? ((roleTable[normaliseScope(scope)] ?? []) as Role[]) : [...ALL_ROLES];
      if (botTokenOnly) roles = roles.includes('bot') || !scope ? ['bot'] : [];
      out.push({
        key: k,
        method: method.toUpperCase(),
        path: p,
        name: NAME_OVERRIDES[k] ?? snake(node.operationId ?? `${method}_${p}`),
        kind: method === 'get' ? 'read' : 'write',
        scope,
        plan: node['x-requirements']?.plan ?? null,
        roles,
        botTokenOnly,
        node,
        nodeEn: docEn.paths?.[p]?.[method],
      });
      TOOL_BY_KEY.set(k, out[out.length - 1].name);
    }
  }
  return out;
}

/**
 * The schema of a request body, whichever way the spec spells it.
 *
 * Uploading a file is described as `multipart/form-data`, and reading only the
 * JSON body dropped those fields silently: the two avatar tools shipped with no
 * argument at all, which no check noticed because an empty schema is a valid
 * schema. A binary field becomes a base64 string here, and the server sends the
 * bytes as the file part.
 */
function requestBodySchema(op: Operation): any {
  const content = op.nodeEn?.requestBody?.content ?? {};
  return content['application/json']?.schema ?? content['multipart/form-data']?.schema ?? null;
}

/**
 * Where an argument goes when the server builds the request: the path, the
 * query, a place in the body, an upload the server makes first, or nowhere —
 * the detail level is the server's own. Arguments are flat for the model and
 * the body is not, so without this a manifest could not be turned back into a
 * call: `{message: {…}, link_preview}` and a form beside its trigger both reach
 * the model as one list of names.
 */
interface ArgumentPlace {
  in: 'path' | 'query' | 'body' | 'upload' | 'server';
  /** For the body and uploads: the dotted place of the value. */
  at?: string;
  /** For a list in the query: false sends `1,2,3` as one value. */
  explode?: boolean;
  /**
   * For an upload: the operations the server runs to make it, in order, and the
   * scopes they need beyond the tool's own. Read from those operations, so a token
   * that may send a message but not upload a file is refused before the first
   * step instead of halfway through.
   */
  operations?: OperationKey[];
  scopes?: string[];
  /**
   * What the server does with an argument the API has no field for. Written out
   * so the runtime executes a declaration instead of knowing the argument by
   * name: `view` cuts the answer to the card of an entity, `draft_id` runs one
   * more operation once the first one succeeded. A third such argument is then a
   * new version of the package rather than a change in the backend.
   */
  effect?:
    | { kind: 'projection'; entity: string }
    | { kind: 'after'; operation: OperationKey; at: string; on: 'success'; scopes: string[] };
}

interface BuiltInput {
  schema: JsonSchema;
  request: { media_type?: string; arguments: Record<string, ArgumentPlace> };
  /** Names that two places of the request both claim. */
  clashes: string[];
}

/**
 * Arguments of a tool: what the path and the query take, plus the fields of the
 * body. The spec wraps a body in its entity — `{task: {…}}` — and that wrapper
 * is plumbing, not a choice a model makes, so it is unwrapped — but only a
 * wrapper: an object that is the one thing the body requires. The form of
 * `POST /views/open` sits beside a required trigger and stays the object it is.
 */
function inputSchema(op: Operation, absorbs: Operation[], docEn: YamlNode): BuiltInput {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const places: Record<string, ArgumentPlace> = {};
  const clashes: string[] = [];
  const claim = (name: string, place: ArgumentPlace, schema: JsonSchema): void => {
    if (places[name]) clashes.push(`${name} (${places[name]!.in}${places[name]!.at ? ` ${places[name]!.at}` : ''} and ${place.in}${place.at ? ` ${place.at}` : ''})`);
    places[name] = place;
    properties[name] = schema;
  };
  for (const raw of op.nodeEn?.parameters ?? []) {
    const param = flatten(raw, docEn);
    // The parameter's own wording leads, and what the values of its schema mean
    // still follows it.
    const worded = param.description ? { ...flatten(param.schema, docEn), description: param.description } : param.schema;
    const schema = property(worded, docEn);
    claim(
      param.name,
      {
        in: param.in,
        ...(schema.type === 'array' && param.explode === false ? { explode: false } : {}),
      },
      schema,
    );
    if (param.required) required.push(param.name);
  }
  const body = flatten(requestBodySchema(op), docEn);
  const bodyRequired: string[] = body?.required ?? [];
  const wrapperOf = (name: string, child: any): boolean =>
    child?.type === 'object' &&
    Boolean(child.properties) &&
    (Object.keys(body?.properties ?? {}).length === 1 || (bodyRequired.length === 1 && bodyRequired[0] === name));
  for (const [name, raw] of Object.entries<any>(body?.properties ?? {})) {
    const child = flatten(raw, docEn);
    if (wrapperOf(name, child)) {
      for (const [inner, innerRaw] of Object.entries<any>(child.properties)) {
        claim(inner, { in: 'body', at: `${name}.${inner}` }, property(innerRaw, docEn));
      }
      for (const r of child.required ?? []) required.push(r);
    } else {
      claim(name, { in: 'body', at: name }, property(raw, docEn));
      if (bodyRequired.includes(name)) required.push(name);
    }
  }

  // A choice of detail only exists where there is a compact card to choose. On a
  // read of token info or of who read a message there is nothing to shorten, and
  // offering the switch there promises a difference that is not there.
  const card = responseEntity(op, docEn);
  if (op.kind === 'read' && card && COMPACT_PROJECTIONS[card]) {
    const { name, ...rest } = VIEW_ARGUMENT;
    claim(name, { in: 'server', effect: { kind: 'projection', entity: card } }, rest as JsonSchema);
  }
  // A send may finish a draft (`DRAFT_ARGUMENT`): naming it here keeps the
  // tidying inside the act that made it necessary, instead of a second call.
  if (op.key === 'POST /messages') {
    const { name, ...rest } = DRAFT_ARGUMENT;
    // The scope of the operation that clears the draft is filled from the spec
    // beside the tool, the same way an upload step brings its own.
    claim(name, { in: 'server', effect: { ...DRAFT_CLEANUP, kind: 'after', scopes: [] } }, rest as JsonSchema);
  }
  // Written argument text follows the spec's rather than replacing it: the spec
  // says what the field is, prose what to put there — the day a deadline lands on,
  // the id to take from a pasted link.
  for (const [argument, text] of Object.entries(MCP_TOOL_PROSE[op.name]?.arguments ?? {})) {
    const field = properties[argument];
    if (!field) continue;
    const said = String(field.description ?? '').trim();
    field.description = said ? `${/[.!?]$/.test(said) ? said : `${said}.`} ${text}` : text;
  }
  // A tool that absorbs a chain takes the argument that triggers it, in place of
  // the spec's field of that name: the spec's files are keys of uploads already
  // made, and here the server makes the uploads. Each step brings its operation
  // and its scope to that argument — the tool itself stands on another operation
  // and names only that one's scope.
  for (const step of absorbs) {
    const chain = CHAIN_STEPS[step.key]!;
    const made = places[chain.argument];
    if (made?.in === 'upload') {
      made.operations = [...(made.operations ?? []), step.key];
      if (step.scope && !made.scopes!.includes(step.scope)) made.scopes!.push(step.scope);
      continue;
    }
    const at = made?.at ?? chain.argument;
    const item = properties[chain.argument]?.items ?? { type: 'object', properties: {} };
    delete places[chain.argument];
    // What an upload yields — the key, the size — is the server's to fill. The
    // rest of what the API lets a file carry stays the model's: an image sent as
    // an image, a voice message with its duration and waveform. Keeping only a
    // name and the bytes left no way to send either.
    const kept = Object.entries(item.properties ?? {}).filter(([name]) => !UPLOAD_FILLS.includes(name));
    claim(chain.argument, { in: 'upload', at, operations: [step.key], scopes: step.scope ? [step.scope] : [] }, {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ...Object.fromEntries(kept),
          content: { type: 'string', description: 'The file contents, base64-encoded.' },
        },
        required: [...(item.required ?? []).filter((name) => !UPLOAD_FILLS.includes(name)), 'content'],
      },
      description: 'Files to attach. The server uploads each one, fills in the key and the size, and sends them with the message.',
    });
  }
  const mediaType = Object.keys(op.nodeEn?.requestBody?.content ?? {}).find((t) =>
    ['application/json', 'multipart/form-data'].includes(t),
  );
  return {
    schema: {
      type: 'object',
      properties,
      ...(required.length ? { required: [...new Set(required)] } : {}),
      additionalProperties: false,
    },
    request: { ...(mediaType ? { media_type: mediaType } : {}), arguments: places },
    clashes,
  };
}

/** The entity a successful answer carries, if the spec names one. */
function responseEntity(op: Operation, docEn: YamlNode): string | null {
  for (const code of ['200', '201', '202']) {
    const body = op.nodeEn?.responses?.[code]?.content?.['application/json']?.schema;
    if (!body) continue;
    const schema = flatten(body, docEn);
    const data = flatten(schema?.properties?.data, docEn);
    const ref =
      body.$ref ?? schema?.items?.$ref ?? schema?.properties?.data?.$ref ?? data?.items?.$ref ?? data?.$ref;
    if (ref) return String(ref).split('/').pop()!;
  }
  return null;
}

/** The object whose fields a dotted card name reaches into: itself, or each item of a list. */
function nestedContainer(source: any, docEn: YamlNode): any {
  return source?.type === 'array' ? flatten(source.items, docEn) : source;
}

/**
 * The structured half of an answer: the response body as the API gives it —
 * `data`, and `meta` where a list pages — with every field down to the bottom.
 * A read cuts each record to its compact card unless asked for the full view, a
 * write answers with the whole record it made or changed, and both fit, because
 * nothing in an answer is required. Declaring the card alone left every field
 * outside it undescribed, and for a list, which answers with many records, it
 * was a schema no answer could meet.
 */
function outputSchema(op: Operation, docEn: YamlNode): JsonSchema | null {
  for (const code of ['200', '201', '202']) {
    const body = op.nodeEn?.responses?.[code]?.content?.['application/json']?.schema;
    if (!body) continue;
    const schema = property(body, docEn, 0, { side: 'output' });
    // The structured half is an object by the protocol, whatever the body may be.
    // A body that is null — no status set — comes back as `{data: null}`
    // (`RESPONSE_FORMAT.structured_content`), so that is what the schema allows.
    if (![schema.type].flat().includes('object')) return null;
    if (flatten(body, docEn)?.nullable && schema.properties?.data) {
      const data = schema.properties.data;
      if (![data.type].flat().includes('null')) data.type = [data.type ?? [], 'null'].flat();
    }
    return { ...schema, type: 'object' };
  }
  // A body that is not JSON is the file itself (`RESPONSE_FORMAT.binary_body`).
  // The input side already turns a file into base64, so the answer mirrors it,
  // and the media type travels along so the client knows what it got.
  for (const [code, response] of Object.entries<any>(op.nodeEn?.responses ?? {})) {
    if (!/^2/.test(code)) continue;
    const other = Object.keys(response?.content ?? {}).find((type) => type !== 'application/json');
    if (!other) continue;
    return {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The file itself, base64-encoded.' },
        mime_type: { type: 'string', description: `The media type of the file, ${other} when the API does not name a narrower one.` },
      },
    };
  }
  // A redirect is not followed (`RESPONSE_FORMAT.redirect`): the archive of an
  // export is a link for the person, and the answer is where it points.
  for (const [code, response] of Object.entries<any>(op.nodeEn?.responses ?? {})) {
    const location = response?.headers?.location ?? response?.headers?.Location;
    if (!/^3/.test(code) || !location) continue;
    // What the link is, the description already says through the rewritten HTTP
    // sentence (`HTTP_REWRITES`); here it is only named.
    const said = flatten(location, docEn)?.description ?? 'The address the redirect points to';
    return {
      type: 'object',
      properties: { url: { type: 'string', description: String(said).replace(/\s+/g, ' ').trim() } },
    };
  }
  return null;
}

/** What an upload yields, and so what the server fills into a file it uploaded. */
const UPLOAD_FILLS = ['key', 'size'];

/**
 * What a client shows the person. Reads are safe and repeatable; writes are
 * neither unless the spec makes them so; destructive is written by hand because
 * "cannot be undone" is a judgement, not a method. The world is open: the
 * workspace is full of text other people write while the agent works.
 */
function annotations(op: Operation): Record<string, boolean> {
  return {
    readOnlyHint: op.kind === 'read',
    destructiveHint: DESTRUCTIVE.has(op.key),
    idempotentHint: op.kind === 'read' || op.method === 'PUT' || op.method === 'DELETE',
    openWorldHint: true,
  };
}

/** Roughly what a listing costs the model: name, description and input schema. */
function modelTokens(tool: { name: string; description: string; inputSchema: JsonSchema }): number {
  const text = `${TOOL_PREFIX}${tool.name}${tool.description}${JSON.stringify(tool.inputSchema)}`;
  return Math.round(text.length / 3.7);
}

/**
 * What of a spec schema did not make it into the schema built from it: a field,
 * the items of a list, the values of a map, an enum value, a type. Walks both
 * side by side, unions by each of their variants.
 */
function lostFields(tool: string, at: string, spec: any, built: JsonSchema | undefined, doc: YamlNode, depth = 0): string[] {
  const source = flatten(spec, doc);
  if (!source || depth > 12) return [];
  if (!built) return [`${tool}: ${at} is in the spec and not in the tool`];
  const variants = source.anyOf ?? source.oneOf;
  if (!source.type && Array.isArray(variants)) {
    return variants.flatMap((variant: any) => {
      const v = flatten(variant, doc);
      return Object.entries<any>(v?.properties ?? {}).flatMap(([name, child]) =>
        lostFields(tool, `${at}.${name}`, child, built.properties?.[name], doc, depth + 1),
      );
    });
  }
  const lost: string[] = [];
  const builtTypes = [built.type].flat();
  if (source.type && !builtTypes.includes(source.type)) lost.push(`${tool}: ${at} is ${source.type} in the spec and ${built.type ?? 'untyped'} in the tool`);
  for (const value of source.enum ?? []) {
    if (!built.enum?.includes(value)) lost.push(`${tool}: ${at} lost the enum value ${value}`);
  }
  for (const [value, meaning] of Object.entries<any>(source['x-enum-descriptions'] ?? {})) {
    if (!String(built.description ?? '').includes(String(meaning).trim())) lost.push(`${tool}: ${at} lost what ${value} means`);
  }
  if (source.nullable && !builtTypes.includes('null')) lost.push(`${tool}: ${at} can be null in the spec and not in the tool`);
  if (source.type === 'array') lost.push(...lostFields(tool, `${at}[]`, source.items, built.items, doc, depth + 1));
  for (const [name, child] of Object.entries<any>(source.properties ?? {})) {
    lost.push(...lostFields(tool, `${at}.${name}`, child, built.properties?.[name], doc, depth + 1));
  }
  if (source.additionalProperties && typeof source.additionalProperties === 'object') {
    const values = typeof built.additionalProperties === 'object' ? built.additionalProperties : undefined;
    lost.push(...lostFields(tool, `${at}{}`, source.additionalProperties, values, doc, depth + 1));
  }
  return lost;
}

const FORBIDDEN_KEYWORDS = ['$ref', 'allOf', 'oneOf', 'anyOf', 'not'];

/**
 * Composition keywords are where clients quietly differ: several drop a tool
 * whose schema carries them instead of reporting anything, and the tool is
 * simply absent for the model. The manifest therefore must not contain them.
 */
function lintSchema(name: string, schema: JsonSchema): string[] {
  const problems: string[] = [];
  const walk = (node: unknown, at: string): void => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_KEYWORDS.includes(k)) problems.push(`${name}: schema uses ${k} at ${at}`);
      walk(v, `${at}.${k}`);
    }
  };
  if (schema.type !== 'object') problems.push(`${name}: schema root must be an object`);
  walk(schema, 'schema');
  return problems;
}

interface BuiltTool {
  name: string;
  operation: OperationKey;
  kind: ToolKind;
  scope: string | null;
  plan: string | null;
  roles: Role[];
  botTokenOnly: boolean;
  description: string;
  annotations: Record<string, boolean>;
  inputSchema: JsonSchema;
  request: BuiltInput['request'];
  clashes: string[];
  outputSchema: JsonSchema | null;
  /** The entity a successful answer carries, when the spec names one. */
  entity: string | null;
}

/**
 * Sentences written for someone assembling an HTTP request, not for a model
 * calling a tool: where the id goes in the URL, that fields travel in the body,
 * that a client follows a redirect. The server does all of that; a model reading
 * it pays for words about plumbing it never touches. They are formulaic in the
 * spec, so they are cut here rather than rewritten per tool — and the build
 * fails if a new variant slips past, so the list stays complete.
 */
const HTTP_ONLY_SENTENCES = [
  /To [^.]*? you need to know [^.]*?specify (?:it|them) in the (?:request )?`URL`[^.]*\./g,
  /Specify [^.]*? in the request `URL`\./g,
  /All (?:editable|updatable) [^.]*? (?:are|is) (?:specified|passed) in the request body\./g,
  /No request body is required\./g,
  /Most HTTP clients [^.]*\./g,
  /To [^.]*? you need to know its `access_token` and use it in the request\./g,
];
/**
 * Sentences written for an HTTP client that still carry a fact, said the way an
 * MCP answer works. Cutting them lost the fact with the phrasing — that the link
 * an export answers with is temporary — and prose had to say the rest again.
 */
const HTTP_REWRITES: Array<[RegExp, string]> = [
  [/The server will respond with `302 Found` and a `Location` header containing ([^.]*)\./g, 'The answer is $1.'],
  // How long the link lives the spec says in a sentence of its own.
  [/In response to the request the server returns `302 Found` with a `Location` header containing ([^.]*)\./g, 'The answer is $1.'],
  // Where a field sits in the HTTP body is the client's business; the tool takes
  // an argument, and the fact worth keeping is that the preview needs asking for.
  [/ at the root of the request body\./g, '.'],
  // Which field of a webhook payload carries the number is for whoever receives
  // the webhook. A model receives none — what it needs is that the number comes
  // later and not from this answer.
  [
    /The number of the finished export arrives in the `export_id` field of the webhook sent to the address from\s+`webhook_url`\./g,
    'The number of the finished export arrives in the webhook sent to `webhook_url`.',
  ],
];

// A webhook has a `URL` of its own, so only the plumbing phrasings count.
const HTTP_LEFTOVER = /request `URL`|in the `URL`|request body|`302 Found`|`Location` header|use it in the request/;

/**
 * What the spec says about an operation, as one paragraph.
 *
 * The spec gives no `summary`: its description opens with a title line, then a
 * blank line, then the text — «List chats\n\nRetrieve a list of chats…».
 * Collapsing the whitespace glued the two into «List chats Retrieve a list», so
 * the title is separated as a sentence of its own before anything else.
 */
/**
 * A documentation cross-reference, said as a tool.
 *
 * `[Bot token rotation](POST /bots/{id}/recreate_token)` is how the spec points
 * at a neighbour, and it is right for a reader with a browser. A model has
 * neither the page nor the HTTP call — it has tools — so the link becomes the
 * tool that serves that operation. An operation no tool serves keeps its words
 * and loses the path: the fact stays, the dead end goes.
 */
function linksAsTools(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((GET|POST|PUT|DELETE) ([^)]+)\)/g, (_all, label: string, method: string, path: string) => {
      const tool = TOOL_BY_KEY.get(`${method} ${path}`);
      return tool ? `\`${tool}\`` : label;
    })
    // A guide is a page, and `search_documentation` reads a page by its path. The
    // title stays in quotes to say what the page is; the path is what gets passed,
    // because the guides exist in Russian only and an English title finds nothing.
    .replace(/\[([^\]]+)\]\((\/[^)#\s]+)(?:#[^)\s]*)?\)/g, (_all, label: string, page: string) =>
      `"${label}" (\`search_documentation\`, page \`${page}\`)`);
}

function specText(op: Operation): string {
  const one = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();
  const summary = one(op.nodeEn?.summary);
  const linked = linksAsTools(String(op.nodeEn?.description ?? ''));
  const rewritten = HTTP_REWRITES.reduce((text, [pattern, to]) => text.replace(pattern, to), linked);
  const raw = HTTP_ONLY_SENTENCES.reduce((text, pattern) => text.replace(pattern, ''), rewritten);
  const [head, ...rest] = raw.split(/\n\s*\n/);
  const title = summary || one(head);
  const body = one(summary ? raw : rest.join('\n\n'));
  if (!title) return body;
  if (!body) return /[.!?]$/.test(title) ? title : `${title}.`;
  return `${/[.!?]$/.test(title) ? title : `${title}.`} ${body}`;
}

/**
 * The description a model reads: what the spec says about the operation, then
 * whatever prose adds.
 *
 * Prose used to replace the spec's text, and that lost facts only the spec had —
 * that asking for a thread twice returns the same thread, who may delete a
 * message, that a chat owner cannot be removed, that a form answer has five
 * seconds — while restating the ones it kept in other words, so each lived in
 * two places. Now the spec states what the operation does and prose says only
 * what the spec has no place for: which neighbour a request belongs to, and
 * what the consequence is worth knowing. What the spec says, prose no longer
 * repeats.
 */
function describe(op: Operation): string {
  const prose = MCP_TOOL_PROSE[op.name];
  const fromSpec = specText(op) || `${op.method} ${op.path}`;
  if (!prose?.description && !prose?.whenToUse && !prose?.notFor) return fromSpec;
  const parts = [prose.description ? `${fromSpec} ${prose.description}` : fromSpec];
  if (prose.whenToUse?.length) parts.push(`\n\nUse it when:\n${prose.whenToUse.map((l) => `- ${l}`).join('\n')}`);
  if (prose.notFor?.length) parts.push(`\n\nNot for:\n${prose.notFor.map((l) => `- ${l}`).join('\n')}`);
  return parts.join('');
}

/**
 * The manifest against its own schema. Not a full validator — a drift catcher:
 * a field added to the manifest and not to the contract, or a required field
 * quietly dropped, is exactly the kind of change a consumer discovers in
 * production. Required keys and closed objects are enough to catch both.
 */
function checkAgainstSchema(manifest: Record<string, unknown>): string[] {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')) as any;
  const problems: string[] = [];
  const check = (value: any, node: any, at: string): void => {
    if (!node || typeof value !== 'object' || value === null) return;
    const resolved = node.$ref ? schema.$defs?.[String(node.$ref).split('/').pop()!] : node;
    if (!resolved) return;
    for (const name of resolved.required ?? []) {
      if (!(name in value)) problems.push(`${at}.${name} is required by the schema and missing`);
    }
    if (resolved.additionalProperties === false && resolved.properties) {
      for (const name of Object.keys(value)) {
        if (!(name in resolved.properties)) problems.push(`${at}.${name} is emitted but the schema does not describe it`);
      }
    }
    for (const [name, child] of Object.entries<any>(resolved.properties ?? {})) {
      if (value[name] === undefined) continue;
      if (child.items && Array.isArray(value[name])) {
        value[name].forEach((item: any, i: number) => check(item, child.items, `${at}.${name}[${i}]`));
      } else if (child.additionalProperties && typeof child.additionalProperties === 'object') {
        for (const [k, item] of Object.entries(value[name])) check(item, child.additionalProperties, `${at}.${name}.${k}`);
      } else {
        check(value[name], child, `${at}.${name}`);
      }
    }
  };
  check(manifest, schema, 'manifest');
  return problems;
}

function build(): void {
  const docEn = yaml.load(fs.readFileSync(SPEC_EN_PATH, 'utf8')) as YamlNode;
  const operations = readOperations();
  const byKey = new Map(operations.map((o) => [o.key, o]));
  const problems: string[] = [];

  // Chain steps are not tools: they run inside the tool they belong to.
  const absorbedBy = new Map<OperationKey, Operation[]>();
  for (const [step, chain] of Object.entries(CHAIN_STEPS)) {
    const stepOp = byKey.get(step);
    if (!stepOp) problems.push(`chain step ${step} is not an operation of the spec`);
    for (const host of chain.into) {
      if (!byKey.has(host)) problems.push(`chain step ${step} points at ${host}, which is not an operation`);
      if (stepOp) absorbedBy.set(host, [...(absorbedBy.get(host) ?? []), stepOp]);
    }
  }

  const tools: BuiltTool[] = operations
    .filter((op) => !(op.key in CHAIN_STEPS))
    .map((op) => {
      const input = inputSchema(op, absorbedBy.get(op.key) ?? [], docEn);
      return {
        name: op.name,
        operation: op.key,
        kind: op.kind,
        scope: op.scope,
        plan: op.plan,
        roles: op.roles,
        botTokenOnly: op.botTokenOnly,
        description: describe(op),
        annotations: annotations(op),
        inputSchema: input.schema,
        request: input.request,
        clashes: input.clashes,
        outputSchema: outputSchema(op, docEn),
        entity: responseEntity(op, docEn),
      };
    });

  // An operation a declared effect runs brings its own scope, read from the
  // spec: a token that may send a message but not delete a draft is refused
  // before the send rather than left with a draft it cannot clear.
  for (const tool of tools) {
    for (const place of Object.values(tool.request.arguments)) {
      if (place.effect?.kind !== 'after') continue;
      const after = byKey.get(place.effect.operation);
      if (after?.scope && !place.effect.scopes.includes(after.scope)) place.effect.scopes.push(after.scope);
    }
  }

  // ── Checks ───────────────────────────────────────────────────────────────
  const seen = new Set<string>();
  for (const tool of tools) {
    if (seen.has(tool.name)) problems.push(`two operations produce the same name: ${tool.name}`);
    seen.add(tool.name);
    if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) problems.push(`${tool.name} is not snake_case`);
    if (`${TOOL_PREFIX}${tool.name}`.length > 64) problems.push(`${tool.name} is longer than 64 characters`);
    if (!tool.description) problems.push(`${tool.name} has no description`);
    problems.push(...lintSchema(tool.name, tool.inputSchema));
    if (tool.outputSchema) problems.push(...lintSchema(`${tool.name} answer`, tool.outputSchema));
  }

  // Everything the API takes and gives has to reach the tool. The arguments are
  // rebuilt from flat names into a request, so every name needs exactly one
  // place in it; and a field the spec has but the tool's schema lost — cut by
  // the nesting limit, hidden in a union, shadowed by a namesake — is a field no
  // model can send or read, which nothing downstream would notice.
  const lostFileFields = (tool: BuiltTool, at: string, files: any, argument: string): string[] =>
    Object.entries<any>(flatten(flatten(files, docEn)?.items, docEn)?.properties ?? {})
      .filter(([field]) => !UPLOAD_FILLS.includes(field))
      .flatMap(([field, raw]) =>
        lostFields(tool.name, `${at}[].${field}`, raw, tool.inputSchema.properties?.[argument]?.items?.properties?.[field], docEn),
      );
  for (const tool of tools) {
    for (const clash of tool.clashes) problems.push(`${tool.name}: two places of the request are both named ${clash}`);
    const names = Object.keys(tool.inputSchema.properties ?? {});
    const placed = Object.keys(tool.request.arguments);
    for (const name of names.filter((n) => !placed.includes(n))) problems.push(`${tool.name}: argument ${name} has no place in the request`);
    for (const name of placed.filter((n) => !names.includes(n))) problems.push(`${tool.name}: the request places ${name}, which the schema does not have`);
    const op = byKey.get(tool.operation)!;
    for (const raw of op.nodeEn?.parameters ?? []) {
      const param = flatten(raw, docEn);
      problems.push(...lostFields(tool.name, param.name, param.schema, tool.inputSchema.properties?.[param.name], docEn));
    }
    const body = flatten(requestBodySchema(op), docEn);
    for (const [name, raw] of Object.entries<any>(body?.properties ?? {})) {
      const place = Object.entries(tool.request.arguments).find(([, p]) => p.at === name || p.at?.startsWith(`${name}.`));
      if (!place) {
        problems.push(`${tool.name}: the body field ${name} reaches no argument`);
        continue;
      }
      if (place[1].in === 'upload') {
        problems.push(...lostFileFields(tool, name, raw, place[0]));
        continue;
      }
      if (place[1].at === name) {
        problems.push(...lostFields(tool.name, name, raw, tool.inputSchema.properties?.[place[0]], docEn));
      } else {
        for (const [inner, innerRaw] of Object.entries<any>(flatten(raw, docEn)?.properties ?? {})) {
          const arg = Object.entries(tool.request.arguments).find(([, p]) => p.at === `${name}.${inner}`);
          if (!arg) problems.push(`${tool.name}: the body field ${name}.${inner} reaches no argument`);
          else if (arg[1].in === 'upload') problems.push(...lostFileFields(tool, `${name}.${inner}`, innerRaw, arg[0]));
          else problems.push(...lostFields(tool.name, `${name}.${inner}`, innerRaw, tool.inputSchema.properties?.[arg[0]], docEn));
        }
      }
    }
    const answered = ['200', '201', '202'].some((code) => op.nodeEn?.responses?.[code]?.content?.['application/json']);
    if (answered && !tool.outputSchema) problems.push(`${tool.name} answers with a body and declares no outputSchema`);
    const redirects = Object.entries<any>(op.nodeEn?.responses ?? {}).some(([code]) => /^3/.test(code));
    if (redirects && !tool.outputSchema?.properties?.url) problems.push(`${tool.name} answers with a redirect and declares no url to hand back`);
    const otherBodies = Object.entries<any>(op.nodeEn?.responses ?? {}).filter(
      ([code, r]) => /^2/.test(code) && Object.keys(r?.content ?? {}).some((type) => type !== 'application/json'),
    );
    for (const [code] of otherBodies) {
      if (tool.outputSchema?.properties?.content && tool.outputSchema?.properties?.mime_type) continue;
      problems.push(`${tool.name} answers ${code} with a body that is not JSON and declares no content to hand it back in`);
    }
    for (const code of ['200', '201', '202']) {
      const answer = op.nodeEn?.responses?.[code]?.content?.['application/json']?.schema;
      if (answer && tool.outputSchema) {
        // A null body is answered as data: null, checked on data rather than on the root.
        const resolved = flatten(answer, docEn);
        if (resolved?.nullable && ![tool.outputSchema.properties?.data?.type].flat().includes('null')) {
          problems.push(`${tool.name} answer: the body can be null and data does not allow it`);
        }
        problems.push(...lostFields(`${tool.name} answer`, 'body', { ...resolved, nullable: false }, tool.outputSchema, docEn));
        break;
      }
    }
  }
  // A compact card names fields of an entity; a field the API no longer has would
  // silently vanish from the card instead of failing anywhere.
  for (const [entity, fields] of Object.entries(COMPACT_PROJECTIONS)) {
    const model = flatten(docEn.components?.schemas?.[entity], docEn);
    if (!model) {
      problems.push(`compact card for ${entity}, which is not a schema of the spec`);
      continue;
    }
    for (const field of fields) {
      const [head, ...tail] = field.split('.');
      const source = flatten(model.properties?.[head!], docEn);
      if (!source || (tail.length && !nestedContainer(source, docEn)?.properties?.[tail[0]!])) {
        problems.push(`compact card for ${entity} names ${field}, which the schema does not have`);
      }
    }
  }

  // Plumbing sentences are cut by pattern; a new wording of them should fail here
  // rather than reach a model.
  for (const tool of tools) {
    if (HTTP_LEFTOVER.test(tool.description)) {
      problems.push(`${tool.name} still carries a sentence written for an HTTP client`);
    }
  }

  // A body the generator could not read leaves a tool with nothing to pass. An
  // empty schema is a valid schema, so nothing else would notice.
  for (const op of operations) {
    if (op.key in CHAIN_STEPS || !op.nodeEn?.requestBody) continue;
    const tool = tools.find((t) => t.operation === op.key);
    const fields = Object.keys(tool?.inputSchema.properties ?? {});
    const fromPath = (op.nodeEn.parameters ?? []).length;
    if (fields.length <= fromPath) {
      problems.push(
        `${op.name} declares a request body the generator read nothing out of ` +
          `(${Object.keys(op.nodeEn.requestBody.content ?? {}).join(', ')})`,
      );
    }
  }

  // Service tools are tools too: a scenario may legitimately expect one, and a
  // tool the model cannot read about is a tool it will not choose.
  const serviceNames = new Set(SERVICE_TOOLS.map((t) => t.name));
  for (const tool of SERVICE_TOOLS) {
    if (!tool.description) problems.push(`service tool ${tool.name} has no description`);
  }
  const names = new Set(tools.map((t) => t.name));
  for (const name of Object.keys(MCP_TOOL_PROSE)) {
    if (!names.has(name)) problems.push(`prose is written for ${name}, which is not a tool`);
  }
  for (const step of Object.keys(CHAIN_STEPS)) {
    if (names.has(byKey.get(step)?.name ?? '')) problems.push(`${step} is both a chain step and a tool`);
  }

  // An operation a tool runs besides its own keeps its access. The upload steps
  // inside sending a message once reached the manifest as an argument and nothing
  // else: the tool said messages:create, the upload needs uploads:write, and a
  // token without it would see the tool and fail halfway through a send. A step
  // stricter than its tool in role, plan or bot-only would list a tool whose
  // argument some token can never use — that is a decision to make, not to miss.
  for (const [stepKey, chain] of Object.entries(CHAIN_STEPS)) {
    const step = byKey.get(stepKey);
    if (!step) continue;
    for (const hostKey of chain.into) {
      const host = tools.find((t) => t.operation === hostKey);
      if (!host) continue;
      const place = host.request.arguments[chain.argument];
      if (!place?.operations?.includes(stepKey)) {
        problems.push(`${host.name} runs ${stepKey} for ${chain.argument}, and its request map does not name it`);
      }
      if (step.scope && !place?.scopes?.includes(step.scope)) {
        problems.push(`${host.name} runs ${stepKey}, which needs ${step.scope}, and ${chain.argument} does not require it`);
      }
      const barred = host.roles.filter((role) => !step.roles.includes(role));
      if (barred.length) problems.push(`${host.name} is listed for ${barred.join(', ')}, and ${stepKey} inside it is not allowed to them`);
      if (step.plan && step.plan !== host.plan) problems.push(`${stepKey} needs the ${step.plan} plan, and ${host.name} that runs it does not`);
      if (step.botTokenOnly && !host.botTokenOnly) problems.push(`${stepKey} takes a bot token, and ${host.name} that runs it does not`);
    }
  }
  const serviceScopes = new Map<string, string[]>();
  for (const tool of SERVICE_TOOLS) {
    const scopes: string[] = [];
    for (const operation of tool.operations) {
      const op = byKey.get(operation);
      if (!op) problems.push(`service tool ${tool.name} calls ${operation}, which is not an operation of the spec`);
      else if (op.key in CHAIN_STEPS) problems.push(`service tool ${tool.name} calls ${operation}, which is a chain step`);
      else if (op.scope && !scopes.includes(op.scope)) scopes.push(op.scope);
    }
    serviceScopes.set(tool.name, scopes);
  }

  // The runtime executes what the manifest declares, so an argument the API has
  // no field for has to say what the server does with it. Without that line the
  // backend learns the argument by name, and the next one like it is a change in
  // the backend rather than a new version of the package.
  for (const tool of tools) {
    for (const [name, place] of Object.entries(tool.request.arguments)) {
      if (place.in !== 'server') continue;
      const effect = place.effect;
      if (!effect) {
        problems.push(`${tool.name} takes ${name}, which the API has no field for, and does not say what the server does with it`);
        continue;
      }
      if (effect.kind === 'projection') {
        if (!COMPACT_PROJECTIONS[effect.entity]) problems.push(`${tool.name} cuts ${name} to the card of ${effect.entity}, which has no card`);
        if (tool.entity !== effect.entity) problems.push(`${tool.name} answers with ${tool.entity ?? 'nothing named'} and cuts ${name} to ${effect.entity}`);
      }
      if (effect.kind === 'after') {
        const after = byKey.get(effect.operation);
        if (!after) problems.push(`${tool.name} runs ${effect.operation} after ${name}, which is not an operation of the spec`);
        else if (after.scope && !effect.scopes.includes(after.scope)) {
          problems.push(`${tool.name} runs ${effect.operation}, which needs ${after.scope}, and ${name} does not require it`);
        }
      }
    }
  }

  // A service tool that answers from the package has to have that file, and the
  // pages the descriptions send a model to have to be in it. Otherwise a link
  // turned into «read this page» points at a page the server cannot serve.
  for (const tool of SERVICE_TOOLS) {
    if (!tool.source) continue;
    const bundle = path.join(HERE, '..', '..', '..', 'apps', 'docs', 'public', tool.source.file);
    if (!fs.existsSync(bundle)) continue;
    const pages = new Set<string>(
      (JSON.parse(fs.readFileSync(bundle, 'utf8')).pages ?? []).map((p: { path: string }) => p.path),
    );
    const wanted = new Set<string>();
    for (const t of tools) for (const [, page] of `${t.description}${JSON.stringify(t.inputSchema)}`.matchAll(/page `([^`]+)`/g)) wanted.add(page!);
    for (const page of wanted) {
      if (!pages.has(page)) problems.push(`a description sends a model to ${page}, which ${tool.source.file} does not carry`);
    }
  }

  // Prose must not say again what the spec already says. A fact with two homes
  // drifts: the spec moves with the API, prose moves when somebody remembers.
  // Six words in a row is long enough to be a restatement and short enough to
  // catch one that changed a word or two on the way.
  const REPEAT_RUN = 6;
  const wordsIn = (text: string) => text.toLowerCase().replace(/`[^`]*`/g, ' ').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for (const op of operations) {
    const prose = MCP_TOOL_PROSE[op.name];
    if (!prose) continue;
    const said = wordsIn(specText(op));
    const written: Array<[string, string]> = [
      ...(prose.description ? [['description', prose.description] as [string, string]] : []),
      ...(prose.whenToUse ?? []).map((l) => ['whenToUse', l] as [string, string]),
      ...(prose.notFor ?? []).map((l) => ['notFor', l] as [string, string]),
      ...Object.entries(prose.arguments ?? {}).map(([a, l]) => [`argument ${a}`, l] as [string, string]),
    ];
    for (const [where, line] of written) {
      const mine = wordsIn(line);
      for (let i = 0; i + REPEAT_RUN <= mine.length; i += 1) {
        const run = mine.slice(i, i + REPEAT_RUN);
        const hit = said.some((_, j) => run.every((w, k) => said[j + k] === w));
        if (hit) {
          problems.push(`${op.name} ${where} says again what the spec says: «${run.join(' ')}»`);
          break;
        }
      }
    }
    // The spec points at a neighbour with a link, which reaches the tool as a
    // name in a code span — the run above skips those. A line naming the same
    // neighbour says it again, unless it carries the words a request comes in:
    // «давай обсудим это отдельно» is the one thing the spec has no place for.
    const pointed = new Set([...specText(op).matchAll(/`(\w+)`/g)].map((m) => m[1]!).filter((n) => names.has(n)));
    for (const [where, line] of written) {
      if ((where !== 'whenToUse' && where !== 'notFor') || /«[^»]+»/.test(line)) continue;
      const again = (line.match(TOOL_NAME_IN_PROSE) ?? []).find((n) => pointed.has(n));
      if (again) problems.push(`${op.name} ${where} points at ${again}, which the spec already names`);
    }
  }

  // Prose must not point at a tool the reader does not have, and must not tell
  // the model to ask permission: approval is the client's dialogue, per tool.
  //
  // The pattern catches any verb_word, so it also catches the spec's own
  // vocabulary — an error code like `submit_expired`, a field of an answer like
  // `export_id`. Those are facts a model needs, not dangling pointers, so the
  // check knows them and only flags what names nothing at all.
  const quoted = TOOL_NAME_IN_PROSE;
  for (const tool of tools) {
    for (const quotedName of new Set(tool.description.match(quoted) ?? [])) {
      if (!names.has(quotedName) && !serviceNames.has(quotedName) && !tool.inputSchema.properties?.[quotedName] && !SPEC_VOCABULARY.has(quotedName)) {
        problems.push(`${tool.name} names "${quotedName}", which is neither a tool, an argument, nor a name the spec uses`);
      }
    }
    if (/\bconfirm\b/i.test(tool.description) && !/needs no confirmation/i.test(tool.description)) {
      problems.push(`${tool.name} tells the model to ask for confirmation — say the consequence instead`);
    }
  }

  // A placeholder the server does not know how to fill would reach the model raw.
  for (const [, name] of SERVER_INSTRUCTIONS.matchAll(/\{(\w+)\}/g)) {
    if (!(name! in INSTRUCTION_PLACEHOLDERS)) problems.push(`the server instructions use {${name}}, which nothing fills`);
  }

  // The always-on block is read before any listing, so a name it quotes that no
  // audience carries is a dead end for every token at once.
  for (const quotedName of new Set(SERVER_INSTRUCTIONS.match(quoted) ?? [])) {
    if (!names.has(quotedName) && !serviceNames.has(quotedName)) {
      problems.push(`the server instructions name "${quotedName}", which is not a tool`);
    }
  }

  // Every scenario has to name a tool that exists and arguments the tool takes.
  for (const scenario of TOOL_SCENARIOS) {
    for (const accepted of scenario.accept) {
      if (accepted === 'none') continue;
      if (accepted === 'answer') {
        if (!scenario.says?.length) problems.push(`${scenario.id} accepts an answer without saying what it must contain`);
        continue;
      }
      if (accepted === 'ask') {
        // A question is right only when what is missing is something only the
        // person has, and the scenario has to say what that is.
        if (!scenario.missing) {
          problems.push(`${scenario.id} accepts a question without saying what only the person has`);
        }
        continue;
      }
      if (!names.has(accepted) && !serviceNames.has(accepted)) {
        problems.push(`${scenario.id} expects "${accepted}", which is not a tool`);
      }
    }
    const asserted = [
      ...Object.keys(scenario.args?.must ?? {}),
      ...(scenario.args?.present ?? []),
      ...(scenario.args?.absent ?? []),
      ...Object.keys(scenario.args?.onWeekday ?? {}),
      ...(scenario.args?.either ?? []).flatMap((one) => Object.keys(one)),
    ];
    // Folding several methods into one tool made a group of actions a single
    // name, and a scenario accepted the group. Now the name is the action, so a
    // set of alternatives that spans one is a scenario scoring the wrong deed as
    // a success: «подключи тег к чату» must not pass on removing a member.
    const accepted = scenario.accept.map((n) => tools.find((t) => t.name === n)).filter(Boolean) as BuiltTool[];
    const writes = accepted.filter((t) => t.kind === 'write');
    if (writes.length > 3) {
      problems.push(
        `${scenario.id} accepts ${writes.length} different writes (${writes.map((t) => t.name).join(', ')}) ` +
          '— name the action asked for, not every write it used to be folded with',
      );
    }
    if (writes.some((t) => t.annotations.destructiveHint) && writes.some((t) => !t.annotations.destructiveHint)) {
      problems.push(
        `${scenario.id} accepts both a destructive and an ordinary write ` +
          `(${writes.map((t) => t.name).join(', ')}) — one of them is not what was asked for`,
      );
    }
    // A weekday assertion on a field that is not a moment measures nothing.
    for (const argument of Object.keys(scenario.args?.onWeekday ?? {})) {
      const holders = accepted.filter((t) => argument in (t.inputSchema.properties ?? {}));
      if (holders.length && !holders.some((t) => (t.inputSchema.properties as any)[argument]?.format === 'date-time')) {
        problems.push(`${scenario.id} expects a weekday in "${argument}", which the spec does not declare as a moment`);
      }
    }
    const serviceArgs = new Set(
      scenario.accept.flatMap((n) => SERVICE_TOOLS.find((t) => t.name === n)?.input.map((f) => f.name) ?? []),
    );
    for (const argument of asserted) {
      if (!serviceArgs.has(argument) && !accepted.some((t) => argument in (t.inputSchema.properties ?? {}))) {
        problems.push(`${scenario.id} asserts "${argument}", which none of its tools takes`);
      }
    }
  }

  // A scenario measures the work only while nothing the model reads can do the
  // work for it. An example carrying a scenario's chat, its id or its wording
  // lets a copied example pass for a found one, and a phrase lifted from a
  // request into prose turns the set into a test of recall. So every text a
  // model reads is held against every request and against the ids its key wants.
  const readable: { where: string; text: string }[] = [];
  const collect = (where: string, value: unknown): void => {
    if (typeof value === 'string' || typeof value === 'number') readable.push({ where, text: String(value) });
    else if (Array.isArray(value)) value.forEach((item) => collect(where, item));
    else if (value && typeof value === 'object') Object.values(value).forEach((item) => collect(where, item));
  };
  for (const tool of tools) collect(tool.name, [tool.description, tool.inputSchema]);
  for (const tool of SERVICE_TOOLS) collect(tool.name, [tool.description, tool.input]);
  collect('the instructions', SERVER_INSTRUCTIONS);
  collect('the refusals', REFUSALS);
  collect('the response format', RESPONSE_FORMAT);
  const wordsOf = (text: string) =>
    text.toLowerCase().replace(/ё/g, 'е').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const readWords = readable.map((r) => ({ where: r.where, words: wordsOf(r.text) }));
  // Russian names change their endings — «Релизы», «Релизах» — so a long word is
  // matched by its stem.
  const sameWord = (wanted: string, seen: string) =>
    wanted.length > 4 ? seen.startsWith(wanted.slice(0, Math.max(4, wanted.length - 2))) : seen === wanted;
  const containsRun = (words: string[], run: string[]) =>
    words.some((_, i) => run.every((w, j) => words[i + j] !== undefined && sameWord(w, words[i + j]!)));
  const idValues = (value: unknown, key = ''): string[] =>
    Array.isArray(value)
      ? value.flatMap((item) => idValues(item, key))
      : value && typeof value === 'object'
        ? Object.entries(value).flatMap(([k, v]) => idValues(v, k))
        : typeof value === 'number' && /(^|_)ids?$/.test(key)
          ? [String(value)]
          : [];
  const world = fs.readFileSync(WORLD_PATH, 'utf8');
  for (const scenario of TOOL_SCENARIOS) {
    const accepted = scenario.accept.map((n) => tools.find((t) => t.name === n)).filter(Boolean) as BuiltTool[];
    for (const [, name] of scenario.prompt.matchAll(/«([^»]+)»/g)) {
      const hit = readWords.find((r) => containsRun(r.words, wordsOf(name!)));
      if (hit) problems.push(`${scenario.id} names «${name}», and so does ${hit.where} — a copied example would pass`);
    }
    // A year is not an id. «за март 2026 года» read as one and matched the 2026
    // inside every date an example carries, so a request that names a month
    // collided with tools it has nothing to do with.
    const bare = scenario.prompt.replace(/\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?|\d{1,2}:\d{2}|(?<![\d-])(?:19|20)\d{2}(?![\d-])/g, ' ');
    const ids = new Set([
      ...(bare.match(/(?<![\p{L}\p{N}])\d{3,}(?![\p{L}\p{N}])/gu) ?? []),
      ...idValues([scenario.args?.must, scenario.args?.either]),
    ]);
    for (const id of ids) {
      const hit = readable.find((r) => new RegExp(`(?<!\\d)${id}(?!\\d)`).test(r.text));
      if (hit) problems.push(`${scenario.id} wants id ${id}, which ${hit.where} also carries — a copied example would pass`);
    }
    // The key and the world change together. An id the key wants that neither the
    // request nor the fake workspace hands out can only be guessed: moving a
    // person's id in the key alone once failed nine scenarios for the instrument,
    // with the agent doing everything right.
    for (const id of idValues([scenario.args?.must, scenario.args?.either])) {
      if (!new RegExp(`(?<!\\d)${id}(?!\\d)`).test(`${world}\n${scenario.prompt}`)) {
        problems.push(`${scenario.id} wants id ${id}, which neither its request nor the fake workspace gives`);
      }
    }
    // A value the key wants that the schema offers as the example of that very
    // argument — 👍 for a reaction — passes on a copy, unless the request itself
    // spells it out. An argument with an enum is a choice among listed values, and
    // its example is one of them rather than an answer to copy.
    for (const expected of [scenario.args?.must ?? {}, ...(scenario.args?.either ?? [])]) {
      for (const [argument, value] of Object.entries(expected)) {
        if (typeof value !== 'string' || scenario.prompt.includes(value)) continue;
        const offered = accepted.find((t) => {
          const field = (t.inputSchema.properties as Record<string, JsonSchema> | undefined)?.[argument];
          return field?.example === value && !field.enum;
        });
        if (offered) {
          problems.push(`${scenario.id} wants ${argument} «${value}», the example ${offered.name} gives — a copied example would pass`);
        }
      }
    }
    // A pasted link is spelled the way the instructions teach links; its ids are
    // held above, its path is not wording.
    const prompt = wordsOf(scenario.prompt.replace(/https?:\/\/\S+/g, ' '));
    for (let i = 0; i + 4 <= prompt.length; i++) {
      const run = prompt.slice(i, i + 4);
      const hit = readWords.find((r) => containsRun(r.words, run));
      if (hit) {
        problems.push(`${scenario.id} is worded «${run.join(' ')}», like ${hit.where} — the set would test recall`);
        break;
      }
    }
  }

  // ── Listings per token ───────────────────────────────────────────────────
  const served = SERVICE_TOOLS.filter((t) => !t.compat);
  const serviceCost = served.reduce(
    (sum, t) =>
      sum +
      modelTokens({
        name: t.name,
        description: '',
        inputSchema: { type: 'object', properties: Object.fromEntries(t.input.map((f) => [f.name, f])) },
      }),
    0,
  );
  const audiences = Object.fromEntries(
    AUDIENCES.map((audience) => {
      const open = tools.filter(
        (t) => t.roles.includes(audience.role) && (!t.plan || t.plan === audience.plan),
      );
      return [
        audience.key,
        {
          role: audience.role,
          plan: audience.plan,
          tools: [...open, ...served].map((t) => `${TOOL_PREFIX}${t.name}`),
          model_tokens: open.reduce((sum, t) => sum + modelTokens(t), 0) + serviceCost,
        },
      ];
    }),
  );

  if (problems.length) {
    console.error('MCP manifest not built:');
    for (const p of [...new Set(problems)].sort()) console.error(`  - ${p}`);
    process.exit(1);
  }

  const manifest = {
    schema_version: SCHEMA_VERSION,
    generated_from: {
      spec: path.basename(SPEC_PATH),
      digest: crypto.createHash('sha256').update(fs.readFileSync(SPEC_PATH)).digest('hex').slice(0, 16),
    },
    server: SERVER_INFO,
    instructions: SERVER_INSTRUCTIONS,
    instruction_placeholders: INSTRUCTION_PLACEHOLDERS,
    cache: CACHE_POLICY,
    response_format: RESPONSE_FORMAT,
    refusals: REFUSALS,
    compact_projections: COMPACT_PROJECTIONS,
    tools: tools.map((t) => ({
      name: `${TOOL_PREFIX}${t.name}`,
      operation: t.operation,
      kind: t.kind,
      scope: t.scope,
      plan: t.plan,
      roles: t.roles,
      bot_token_only: t.botTokenOnly,
      description: t.description,
      annotations: t.annotations,
      inputSchema: t.inputSchema,
      request: t.request,
      ...(t.entity ? { entity: t.entity } : {}),
      ...(t.outputSchema ? { outputSchema: t.outputSchema } : {}),
    })),
    service_tools: SERVICE_TOOLS.map((t: McpServiceTool) => ({
      name: `${TOOL_PREFIX}${t.name}`,
      kind: t.kind,
      compat: Boolean(t.compat),
      operations: t.operations,
      ...(t.source ? { source: t.source } : {}),
      scopes: serviceScopes.get(t.name) ?? [],
      description: t.description,
      annotations: {
        readOnlyHint: t.kind === 'read',
        destructiveHint: false,
        idempotentHint: t.kind === 'read',
        openWorldHint: true,
      },
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(
          t.input.map(({ name, required: _r, ...rest }) => [name, rest as JsonSchema]),
        ),
        ...(t.input.some((f) => f.required)
          ? { required: t.input.filter((f) => f.required).map((f) => f.name) }
          : {}),
        additionalProperties: false,
      },
    })),
    audiences,
  };

  const drift = checkAgainstSchema(manifest);
  if (drift.length) {
    console.error('Manifest and its schema disagree:');
    for (const d of [...new Set(drift)].sort()) console.error(`  - ${d}`);
    process.exit(1);
  }

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  const withProse = tools.filter((t) => MCP_TOOL_PROSE[t.name]).length;
  const listings = Object.entries(audiences)
    .map(([k, v]) => `${k} ${v.tools.length} tools ~${v.model_tokens}`)
    .join(', ');
  const scopes = new Set([
    ...tools.flatMap((t) => [t.scope, ...Object.values(t.request.arguments).flatMap((p) => p.scopes ?? [])]),
    ...[...serviceScopes.values()].flat(),
  ].filter(Boolean));
  console.log(
    `MCP manifest: ${tools.length} tools from ${operations.length} operations ` +
      `(${Object.keys(CHAIN_STEPS).length} folded as chain steps), ${withProse} with written prose, ` +
      `${scopes.size} scopes. Listings: ${listings}.`,
  );
}

build();
