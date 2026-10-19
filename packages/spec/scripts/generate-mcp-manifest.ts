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
 * or from `x-requirements.roles` where the operation answers to fewer roles than
 * its scope is given to — a method only a bot token reaches, one a multi-guest is
 * always refused. Permissions have exactly one source and cannot drift; whether a
 * tool takes only a bot token is read off those roles too. That holds for every
 * operation a tool runs, not only the one it is named after: the upload steps
 * inside sending a message bring their permission to the argument that triggers
 * them, and a service tool's permissions are read from the operations it calls.
 *
 * Every operation becomes a tool by construction, unless it is a declared chain
 * step or a step of the OAuth flow, so a method added to the contract cannot end
 * up nowhere. The build fails — it does not warn — when:
 *
 * The spec
 *   - takes a form the generator does not know: a schema keyword or extension
 *     outside `KNOWN_KEYWORDS`, a type it does not build, an `allOf` of several
 *     models, a union that may be null or has a member that is no object, a
 *     `$ref` outside the schemas or where a parameter, a body or an answer
 *     stands, a parameter in a cookie or described by content, a body in a media
 *     type it does not read, JSON in an answer other than 200, 201 or 202 — or
 *     an operation is missing from the English spec;
 *   - has a list in the query that does not say how it travels on the wire, or
 *     says it of something that is no list in the query; a header that is not
 *     one fixed value the server can send.
 *
 * Access
 *   - the roles of scopes are not declared exactly once; an operation names no
 *     scope and does not say it needs none, names one the roles of scopes do
 *     not list or give to nobody, or narrows its roles to a list that is empty,
 *     names a role twice or one the listings do not know, gives a role its scope
 *     does not, or repeats the scope's roles;
 *   - a tool is in no listing, or answers to a role or a plan no listing is for;
 *   - an operation a tool runs besides its own — a chain step, an upload, an
 *     effect, a call of a service tool — is open to fewer roles, a stricter plan
 *     or only a bot token, without a reason in `ACCESS_EXCEPTIONS`;
 *   - a write not marked destructive runs a destructive operation by way of an
 *     argument, without a reason in `DESTRUCTIVE_EFFECTS`; `ADDITIVE` names a
 *     read or gives no reason;
 *   - an exception, an effect or a hand table names an operation the spec no
 *     longer has, excuses nothing, or gives no reason; a name override or a
 *     service tool points at a chain step; a chain step points at an operation
 *     the spec lacks, or the tool it runs in does not name it with its scope.
 *
 * Arguments and answers
 *   - anything the spec lets a call send or answer does not reach the tool: a
 *     parameter, a field of the body or of a file, a variant of a union, the
 *     values of a map, a field of the answer — or reaches it without its type,
 *     an enum value, what that value means, or the null it may be; an argument
 *     loses a limit, a pattern or a format the API checks, gets another one —
 *     a field of a union is held to what merging its variants promises: the
 *     widest limit, the rule or format all of them share, or none where some
 *     variant carrying it has none — or is required where the spec does not
 *     require it, or the other way round; an upload loses the spec's words or
 *     its limits, a lifted argument any sentence of the spec but the rewritten
 *     clause; a body yields nothing;
 *   - a field sends a model to an upload step that no upload of the tool fills,
 *     a lift or an unavailable upload points at a field the body lacks, or the
 *     rewrite of an uploaded file's name finds nothing to rewrite;
 *   - an argument has no place in the request, two places share a name, a part
 *     of the path is no path argument, a header is not sent, a list in the query
 *     has no array form or a non-list has one; an argument the API has no field
 *     for does not say what the server does with it, or says what cannot hold —
 *     a card for an entity without one, a single read cut to a card, a download
 *     into a field that is no file; an edit declares a default;
 *   - an answer with a body declares no schema, a redirect no url, a file no
 *     description of what comes back; a body that may be null has a data that
 *     may not; any node of an outputSchema declares an enum, a limit or rule,
 *     or a format other than date-time.
 *
 * Cards, authors and text of other people
 *   - a field of an entity with a compact card is neither in the card nor left
 *     out with a reason, or both; a card or a single read's omission names a
 *     field the entity lacks, keeps every field, or serves no read of its kind;
 *     the view does not name what its default carries or leaves out;
 *   - the words of a tool name a field its default answer leaves out — a
 *     dotted `parent.leaf` also by `leaf` in words that name `parent` — without
 *     a `named` reason in `SINGLE_READ_OMIT`, or such a reason excuses nothing;
 *     an argument takes its value from a field a card leaves out, or an edit
 *     replaces a list whole (`x-replaces-set`) that no read shows by default;
 *   - the author of an entity is missing from its schema or its card, or kept
 *     out of a single read;
 *   - text of an answer is neither marked untrusted, declared made by Pachca nor
 *     bounded by a closed set of values, or a name declared trusted is not free
 *     text any answer carries;
 *   - a tool takes a cursor and its answer carries no next one, or takes no
 *     limit the server asks for a page cut short again with; a link into the web app starts
 *     elsewhere or uses a placeholder nothing fills;
 *   - a schema does not compile as JSON Schema 2020-12 and draft-07, is no
 *     object at the root, or uses composition keywords some clients drop; an
 *     example fails its own schema; an answer of the spec, whole or cut by the
 *     default view, fails the tool's outputSchema.
 *
 * Names and texts
 *   - a name is duplicated, is not snake_case, exceeds 64 characters, has a verb
 *     the pattern that finds names in prose does not know, or is the name a
 *     chain step would carry; a tool has no title or no description;
 *   - a description runs past what a client keeps (2048 characters), or the
 *     instructions past 1950 with every placeholder filled by its longest
 *     example; a placeholder gives no example, is used by neither the
 *     instructions, the footer nor a link into the web app, or one in use is
 *     filled by nothing;
 *   - a date-time argument, at any depth, lacks the note on how a moment named
 *     in words is written (`MOMENT_ARGUMENT`) or carries it twice; a top-level
 *     text argument named `query` lacks the note that a search takes the words
 *     of the request (`QUERY_ARGUMENT`) or carries it twice, or any other
 *     argument or tool carries it; a tool whose answer reaches a field
 *     `TRUSTED_TEXT` marks secret lacks `SECRET_NOTE`, a tool whose answer
 *     reaches none carries it, a field so marked is in no answer of a tool, or a
 *     field of free text named as a token or a secret is marked neither secret
 *     nor masked;
 *   - a description still carries a sentence written for an HTTP client, or a
 *     pattern written to cut one cuts nothing any more;
 *   - prose is written for a tool or an argument that does not exist, says
 *     again in six words what the spec or the argument says, or points at a
 *     neighbour the spec already names without the words of a request; the
 *     instructions repeat six words of what a tool says — its description,
 *     prose and notes included, or any of its arguments;
 *   - a description or an argument names a tool the set does not have — a tool
 *     of another listing is a fact about rights, not a dead end — or the
 *     instructions, one text for every token, name a tool some listing lacks; a
 *     description tells the model to ask for confirmation; a page or a section a
 *     description links is missing from the documentation;
 *   - a status from 400 up that a tool can be answered with has no line in
 *     `REFUSALS`, a line answers no such status, or a line names in backticks a
 *     code the spec does not have.
 *
 * Scenarios
 *   - a scenario is measured on a listing that does not exist, expects a tool
 *     that is not in the set or not in that listing, asserts an argument — or a
 *     place inside one — none of its tools takes, or a value outside the enum
 *     of that argument; accepts an answer without saying what it must contain
 *     or a question without saying what only the person has, accepts more than
 *     three writes or both a destructive and an ordinary one, or expects a
 *     weekday in a field that is not a moment;
 *   - a scenario's chat, id, wording or expected value appears in text the
 *     model reads; prose, the instructions, a generated note, an argument of
 *     the server, a refusal or the response format quotes a phrase a scenario
 *     asks in those words, unless `QUOTED_TERMS` says why that word is no
 *     example, or an entry there excuses nothing; or the key wants an id
 *     neither the request nor the fake workspace gives.
 *
 * And last, when the manifest and its schema disagree.
 *
 * Usage: bun scripts/generate-mcp-manifest.ts
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import {
  ACCESS_EXCEPTIONS,
  ADDITIVE,
  AUDIENCES,
  AUTHOR_FIELDS,
  CACHE_POLICY,
  CHAIN_STEPS,
  COMPACT_OMIT,
  COMPACT_PROJECTIONS,
  COMPAT_ADDRESS,
  DESTRUCTIVE_EFFECTS,
  FILE_SOURCES,
  NAME_OVERRIDES,
  REFUSALS,
  RESPONSE_FORMAT,
  SINGLE_READ_OMIT,
  TRUSTED_TEXT,
  UPLOAD_LIFTS,
  UPLOAD_UNAVAILABLE,
  INSTRUCTION_PLACEHOLDERS,
  MOMENT_ARGUMENT,
  QUERY_ARGUMENT,
  QUOTED_TERMS,
  SECRET_NOTE,
  SERVER_INFO,
  SERVER_INSTRUCTIONS,
  SERVICE_TOOLS,
  TOOL_NAME_IN_PROSE,
  TOOL_PREFIX,
  DRAFT_ARGUMENT,
  DRAFT_CLEANUP,
  VIEW_ARGUMENT,
  WEB_LINKS,
  type McpServiceTool,
  type OperationKey,
  type ToolKind,
} from '../mcp-core';
import siteRedirects from '../../../apps/docs/redirects';
import { toSlug } from '../../../apps/docs/lib/utils/transliterate';
import { TOOL_SCENARIOS } from '../mcp-scenarios';
import { MCP_TOOL_PROSE } from '../mcp-tools';

const HERE = import.meta.dirname;
const SPEC_PATH = path.join(HERE, '..', 'openapi.yaml');
/** Descriptions come from the English spec — models read the manifest. */
const SPEC_EN_PATH = path.join(HERE, '..', 'openapi.en.yaml');
const OUT_PATH = path.join(HERE, '..', 'mcp-manifest.json');
const SCHEMA_PATH = path.join(HERE, '..', 'mcp-manifest.schema.json');
/** The fake workspace a judged run answers from; the ids a scenario's key wants live in it. */
const WORLD_PATH = path.join(HERE, 'eval', 'world.json');

/**
 * Manifest schema version: the contract a server that executes the manifest is
 * written for. 1.0.0 is the first one published; bump the major when such a
 * server has to change before it loads the file.
 */
const SCHEMA_VERSION = '1.0.0';

/**
 * How much of a text the strictest client keeps, in UTF-16 units. One widely
 * used client cuts both the instructions and every tool description there, and
 * says nothing: whatever stands after it never reaches the model. A description
 * has to fit whole, and so do the instructions, with their placeholders filled
 * and room left for a long name: a rule that does not fit goes to the tools it
 * is about.
 */
const CLIENT_TEXT_LIMIT = 2048;
const INSTRUCTIONS_LIMIT = 1950;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
type Role = 'owner' | 'admin' | 'user' | 'multi_guest' | 'bot';
const ALL_ROLES: Role[] = ['owner', 'admin', 'user', 'multi_guest', 'bot'];

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

/**
 * Resolve `$ref`, and an `allOf` of one member. The spec uses that form for an
 * enum with a description of its own, and TypeSpec writes `model X extends Y` as
 * the base in `allOf` beside the model's own `properties` — so the two are
 * merged rather than the own fields shadowing the base. Any other `allOf` is
 * refused by `specShapeProblems` before it reaches here.
 */
function flatten(node: any, doc: YamlNode, depth = 0): any {
  if (!node || depth > 10) return node;
  if (node.$ref) {
    const name = String(node.$ref).split('/').pop()!;
    return flatten(doc.components?.schemas?.[name], doc, depth + 1);
  }
  if (Array.isArray(node.allOf) && node.allOf.length === 1) {
    const base = flatten(node.allOf[0], doc, depth + 1) ?? {};
    const own: any = Object.fromEntries(Object.entries(node).filter(([k]) => k !== 'allOf'));
    const merged: any = { ...base, ...own };
    if (base.properties && own.properties) merged.properties = { ...base.properties, ...own.properties };
    const required = [...(base.required ?? []), ...(own.required ?? [])];
    if (required.length) merged.required = [...new Set(required)];
    return merged;
  }
  return node;
}

/**
 * The spec read on its own terms, apart from `flatten`: `$ref` followed and every
 * member of an `allOf` merged. The checks that look for what a tool lost walk the
 * spec this way, so a mistake in the code that built the tool is not repeated by
 * the code that checks it.
 */
function specResolve(node: any, doc: YamlNode, depth = 0): any {
  if (!node || typeof node !== 'object' || depth > 12) return node;
  if (node.$ref) return specResolve(doc.components?.schemas?.[String(node.$ref).split('/').pop()!], doc, depth + 1);
  if (!Array.isArray(node.allOf)) return node;
  const own = Object.fromEntries(Object.entries(node).filter(([k]) => k !== 'allOf'));
  const parts = [...node.allOf.map((part: any) => specResolve(part, doc, depth + 1) ?? {}), own];
  const merged: any = Object.assign({}, ...parts);
  const properties = Object.assign({}, ...parts.map((part: any) => part.properties ?? {}));
  const required = [...new Set(parts.flatMap((part: any) => part.required ?? []))];
  if (Object.keys(properties).length) merged.properties = properties;
  if (required.length) merged.required = required;
  return merged;
}

/**
 * What the API refuses a value outside of. These travel into arguments, where a
 * model that knows a title stops at fifty characters writes fifty instead of
 * failing and trying again — and never into an answer (`property`).
 */
const SPEC_LIMITS = ['maxLength', 'minLength', 'maximum', 'minimum', 'maxItems', 'minItems'] as const;
const SPEC_RULES = ['pattern', 'uniqueItems', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minProperties', 'maxProperties'] as const;
const SPEC_VALIDATION: readonly string[] = [...SPEC_LIMITS, ...SPEC_RULES];
/** A limit a larger value loosens, and one a smaller value loosens. */
const UPPER_LIMITS = new Set(['maxLength', 'maximum', 'maxItems', 'exclusiveMaximum', 'maxProperties']);
const LOWER_LIMITS = new Set(['minLength', 'minimum', 'minItems', 'exclusiveMinimum', 'minProperties']);

/**
 * Facts about the wire rather than about intent: the shape a value has to have
 * and one value of that shape. They travel in the schema, apart from the
 * description: when prose still replaced descriptions, that is exactly how the
 * shape got lost — four requests that named a weekday put the word «Friday» into
 * a field the spec declares as a date-time.
 */
const SPEC_SHAPE = ['format', 'example'] as const;

/**
 * The one format an answer keeps: a moment, which a client may parse. Numeric
 * formats describe what the API takes; on an answer a validator would hold an id
 * that has outgrown 32 bits against them and refuse the whole result.
 */
const OUTPUT_FORMATS = ['date-time'];

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

/** A sentence that ends the way a sentence ends, so the next one can follow it. */
const sentence = (text: string): string => {
  const said = text.trim();
  return said && !/[.!?]$/.test(said) ? `${said}.` : said;
};

/**
 * The enum value an `x-enum-descriptions` key stands for. TypeSpec keys meanings
 * by the member's name, so `chats_read` is what `chats:read` means — and the value
 * is what a model sends and reads, so the value is what the listing names.
 */
function enumValueOf(key: string, values: unknown[]): unknown {
  return values.find((v) => String(v) === key) ?? values.find((v) => normaliseScope(String(v)) === normaliseScope(key)) ?? key;
}

/**
 * A property as the listing carries it: type, wording and the limits the API
 * actually enforces.
 *
 * Structure goes all the way down to what a value is made of. Keeping only the
 * outer type left `buttons` an array of arrays of nothing, and in a measured run
 * the model, with no idea what a button is, sent the question and added two
 * reactions instead. A map keeps the shape of its values, and a union keeps
 * its variants (`variantsAsOne`).
 *
 * The two sides differ. An argument carries what the API refuses: enums, limits,
 * patterns, formats and one example. An answer carries types and the null a
 * field may be, and no enum, no limit and no format but a moment: a client checks
 * an answer against its schema and refuses the whole result over one value
 * outside it, while the API's own process leaves values out of its enums — a
 * scope still in beta, an event no bot is meant to hear, a key the backend has
 * not yet been documented with. The values and what each means stay in the
 * description, where a model reads them. An answer declares no required fields
 * either: a list or a search cuts each record to its compact card unless view is
 * full, a single read leaves out only what SINGLE_READ_OMIT names, and what is
 * left has to fit the same schema the whole record does.
 */
function property(schema: any, doc: YamlNode, depth = 0, shape: Shape = { side: 'input' }): JsonSchema {
  const source = flatten(schema, doc);
  const variants = source?.anyOf ?? source?.oneOf;
  if (!source?.type && Array.isArray(variants)) return variantsAsOne(source, variants, doc, depth, shape);
  const input = shape.side === 'input';
  const out: JsonSchema = {};
  for (const k of ['type', 'description', 'enum', 'default', ...SPEC_VALIDATION]) {
    if (!input && (k === 'enum' || SPEC_VALIDATION.includes(k))) continue;
    if (source?.[k] !== undefined) (out as any)[k] = source[k];
  }
  // What each value of an enum means is in the spec, and a model choosing between
  // `is_member` and `public`, or reading an `event_key`, needs it as much as the
  // values themselves. An answer lists its values here even without meanings,
  // since its schema no longer does.
  const values: unknown[] = Array.isArray(source?.enum) ? source.enum : [];
  const meanings = source?.['x-enum-descriptions'];
  const spelled =
    meanings && typeof meanings === 'object'
      ? Object.entries<any>(meanings)
          .map(([k, meaning]) => `${String(enumValueOf(k, values))} — ${String(meaning).trim()}`)
          .join('; ')
      : !input && values.length
        ? values.map(String).join(', ')
        : '';
  if (spelled) out.description = `${sentence(String(out.description ?? ''))} Values: ${spelled}.`.trim();
  // A field the API answers with null has to allow null: a client that checks an
  // answer against its schema refuses the whole answer over one empty field.
  if (source?.nullable && out.type) {
    out.type = [out.type, 'null'].flat();
    if (out.enum) out.enum = [...out.enum, null];
  }
  for (const k of SPEC_SHAPE) {
    const value = source?.[k];
    if (value === undefined) continue;
    if (k === 'format') {
      // A file goes as base64 text, which JSON Schema says with contentEncoding;
      // `binary` would promise raw octets that no argument can carry.
      if (value === 'binary') {
        if (input) out.contentEncoding = 'base64';
      } else if (input || OUTPUT_FORMATS.includes(value)) {
        out.format = value;
      }
      continue;
    }
    if (!input) continue;
    const scalar = ['string', 'number', 'boolean'].includes(typeof value);
    if (!scalar && JSON.stringify(value).length > EXAMPLE_CHARS) continue;
    // OpenAPI says example; JSON Schema, which the listing is, says examples — a
    // list. A strict validator refuses a schema with a keyword it does not know.
    out.examples = [value];
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
    if (source.required?.length && input) out.required = source.required;
  }
  if (source?.type === 'object' && source.additionalProperties && typeof source.additionalProperties === 'object') {
    out.additionalProperties = property(source.additionalProperties, doc, depth + 1, shape);
  }
  if (source?.format === 'binary') out.description = `${sentence(String(out.description ?? ''))} The file contents, base64-encoded.`.trim();
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
 *
 * Two variants may share a type — a link shared in a message is a `message` event
 * too — and then each is named by its event as well, so the description can still
 * tell them apart.
 */
function variantsAsOne(source: any, variants: any[], doc: YamlNode, depth: number, shape: Shape): JsonSchema {
  const input = shape.side === 'input';
  const resolved = variants.map((v) => ({ name: String(v?.$ref ?? '').split('/').pop()!, schema: flatten(v, doc) }));
  const kindOf = (variant: any): string | undefined => flatten(variant?.properties?.type, doc)?.enum?.[0];
  const itemKeys = (child: any): string =>
    Object.keys(flatten(flatten(child, doc)?.items, doc)?.properties ?? {}).join(', ');
  const labelled = resolved.map(({ name, schema: variant }) => {
    const kind = kindOf(variant);
    const base = kind ?? name;
    const shared = resolved.filter((other) => (kindOf(other.schema) ?? other.name) === base).length > 1;
    const events: unknown[] = flatten(variant?.properties?.event, doc)?.enum ?? [];
    const label = !shared ? base : events.length ? `${base} (event ${events.join(', ')})` : `${base} (${name})`;
    return { name, variant, kind, label };
  });
  const kinds: string[] = [];
  const kindMeanings: string[] = [];
  const lines: string[] = [];
  const fields = new Map<string, Array<{ label: string; schema: JsonSchema }>>();
  for (const { variant, kind, label } of labelled) {
    if (kind !== undefined) {
      if (!kinds.includes(kind)) kinds.push(kind);
      const meaning = flatten(variant?.properties?.type, doc)?.['x-enum-descriptions']?.[kind];
      const spoken = meaning ? `${kind} — ${String(meaning).trim()}` : kind;
      if (!kindMeanings.includes(spoken) && (meaning || !kindMeanings.some((m) => m === kind || m.startsWith(`${kind} — `)))) {
        kindMeanings.push(spoken);
      }
    }
    const required = new Set<string>(variant?.required ?? []);
    const own = Object.keys(variant?.properties ?? {}).filter((field) => field !== 'type');
    const spelled = own.map((field) => {
      const nested = itemKeys(variant.properties[field]);
      const differs =
        nested && resolved.some((other) => other.schema?.properties?.[field] && itemKeys(other.schema.properties[field]) !== nested);
      return `${field}${input && required.has(field) ? '*' : ''}${differs ? ` (${nested})` : ''}`;
    });
    lines.push(spelled.length ? `${label}: ${spelled.join(', ')}` : label);
    for (const [field, child] of Object.entries<any>(variant?.properties ?? {})) {
      if (field === 'type' && kinds.length) continue;
      fields.set(field, [...(fields.get(field) ?? []), { label, schema: property(child, doc, depth + 1, shape) }]);
    }
  }
  const properties: Record<string, JsonSchema> = {};
  if (kinds.length) {
    // An argument lists the types in its enum and says what the ones with a
    // meaning mean; an answer keeps no enum, so its description names them all.
    const spoken = input ? kindMeanings.filter((m) => m.includes(' — ')) : kindMeanings;
    properties.type = {
      type: 'string',
      ...(input ? { enum: kinds } : {}),
      ...(spoken.length ? { description: `Values: ${spoken.join('; ')}.` } : {}),
    };
  }
  for (const [field, entries] of fields) properties[field] = mergeVariants(entries);
  const said = String(source?.description ?? '').replace(/\s+/g, ' ').trim();
  return {
    type: 'object',
    description: `${said ? `${sentence(said)} ` : ''}One of — ${lines.join('; ')}${input ? ' (* — required)' : ''}.`,
    properties,
    ...(kinds.length && input ? { required: ['type'] } : {}),
  };
}

/** Names in a sentence: «a», «a and b», «a, b and c». */
const spokenList = (names: string[]): string =>
  names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** How a limit reads in a sentence, before its value and after it. */
const LIMIT_WORDS: Record<string, [string, string]> = {
  maxLength: ['up to', 'characters'],
  minLength: ['at least', 'characters'],
  maxItems: ['up to', 'items'],
  minItems: ['at least', 'items'],
  maximum: ['at most', ''],
  minimum: ['at least', ''],
};

/**
 * The fields one name has across the variants of a union, as one field: every
 * type any variant allows, every enum value any lists, the nested fields of all
 * of them — an event is `submit` in one variant of a payload and `click` in
 * another, and keeping the first variant's spelling lost the rest.
 *
 * A limit takes its widest value, and what each type allows is said in words:
 * the text of a form's header stops at 150 characters while a markdown block
 * takes 12000, and a schema that kept the first variant's 150 cut the markdown.
 * Descriptions that differ are said per type for the same reason — a payload's
 * `url` is the message for one event and the recording for another.
 */
function mergeVariants(entries: Array<{ label: string; schema: JsonSchema }>): JsonSchema {
  if (entries.length === 1) return entries[0]!.schema;
  const schemas = entries.map((e) => e.schema);
  const out: JsonSchema = {};
  const types = [...new Set(schemas.flatMap((s) => [s.type].flat().filter(Boolean)))] as string[];
  if (types.length) out.type = types.length === 1 ? types[0] : types;
  // The description: the words per type, the values and their meanings once.
  const parts = entries.map(({ label, schema }) => {
    const text = String(schema.description ?? '');
    const at = text.lastIndexOf(' Values: ');
    const head = at >= 0 ? text.slice(0, at) : text.startsWith('Values: ') ? '' : text;
    const tail = at >= 0 ? text.slice(at + ' Values: '.length) : text.startsWith('Values: ') ? text.slice('Values: '.length) : '';
    return { label, head: head.trim(), said: head.trim().replace(/\.$/, ''), values: tail.replace(/\.$/, '').split('; ').filter(Boolean) };
  });
  const groups: Array<{ said: string; labels: string[] }> = [];
  for (const { label, said } of parts) {
    if (!said) continue;
    const group = groups.find((g) => g.said === said);
    if (group) group.labels.push(label);
    else groups.push({ said, labels: [label] });
  }
  const values = [...new Set(parts.flatMap((p) => p.values))];
  const notes: string[] = [];
  const merged: Record<string, unknown> = {};
  for (const k of SPEC_VALIDATION) {
    const given = schemas.map((s) => s[k]);
    if (given.every((v) => v === undefined)) continue;
    const distinct = [...new Set(given.map((v) => JSON.stringify(v ?? null)))];
    if (UPPER_LIMITS.has(k) || LOWER_LIMITS.has(k)) {
      // No limit in one variant is the widest limit of all.
      if (!given.some((v) => v === undefined)) {
        merged[k] = UPPER_LIMITS.has(k) ? Math.max(...(given as number[])) : Math.min(...(given as number[]));
      }
      const words = LIMIT_WORDS[k];
      if (distinct.length > 1 && words) {
        const byValue = new Map<string, string[]>();
        entries.forEach(({ label }, i) => {
          const v = given[i] === undefined ? 'none' : String(given[i]);
          byValue.set(v, [...(byValue.get(v) ?? []), label]);
        });
        const spoken = [...byValue.entries()]
          .filter(([v]) => v !== 'none')
          .map(([v, labels], i) => `${i === 0 ? `${words[0]} ` : ''}${v}${i === 0 && words[1] ? ` ${words[1]}` : ''} for ${spokenList(labels)}`);
        const none = byValue.get('none');
        const sentenceText = `${spoken.join(', ')}${none ? `; no limit for ${spokenList(none)}` : ''}`;
        notes.push(`${sentenceText.charAt(0).toUpperCase()}${sentenceText.slice(1)}.`);
      }
    } else if (distinct.length === 1) {
      merged[k] = given[0];
    }
  }
  // One wording for every variant stays as the spec wrote it.
  const alone = groups.length === 1 ? parts.find((p) => p.said === groups[0]!.said)!.head : '';
  const said = groups.length > 1 ? groups.map((g) => `${spokenList(g.labels)}: ${sentence(g.said)}`).join(' ') : alone;
  const more = values.length || notes.length;
  const description = [more ? sentence(said) : said, values.length ? `Values: ${values.join('; ')}.` : '', ...notes].filter(Boolean).join(' ');
  if (description) out.description = description;
  if (schemas.every((s) => Array.isArray(s.enum))) out.enum = [...new Set(schemas.flatMap((s) => s.enum!))];
  const defaults = [...new Set(schemas.map((s) => JSON.stringify(s.default)))];
  if (defaults.length === 1 && schemas[0]!.default !== undefined) out.default = schemas[0]!.default;
  Object.assign(out, merged);
  for (const k of ['format', 'contentEncoding']) {
    const given = [...new Set(schemas.map((s) => s[k]))];
    if (given.length === 1 && given[0] !== undefined) out[k] = given[0];
  }
  const example = schemas.find((s) => s.examples)?.examples;
  if (example) out.examples = example;
  const withItems = entries.filter((e) => e.schema.items);
  if (withItems.length) out.items = mergeVariants(withItems.map((e) => ({ label: e.label, schema: e.schema.items! })));
  const withProperties = entries.filter((e) => e.schema.properties);
  if (withProperties.length) {
    const names = [...new Set(withProperties.flatMap((e) => Object.keys(e.schema.properties!)))];
    out.properties = Object.fromEntries(
      names.map((name) => [
        name,
        mergeVariants(
          withProperties.filter((e) => e.schema.properties![name]).map((e) => ({ label: e.label, schema: e.schema.properties![name]! })),
        ),
      ]),
    );
    const required = (withProperties[0]!.schema.required ?? []).filter((name) =>
      withProperties.every((e) => (e.schema.required ?? []).includes(name)),
    );
    if (required.length) out.required = required;
  }
  const maps = entries.filter((e) => e.schema.additionalProperties && typeof e.schema.additionalProperties === 'object');
  if (maps.length) {
    out.additionalProperties = mergeVariants(maps.map((e) => ({ label: e.label, schema: e.schema.additionalProperties as JsonSchema })));
  }
  return out;
}

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

/** How a list in the query travels (`x-query-array` of the parameter). */
type QueryArrayForm = 'brackets';
const QUERY_ARRAY_FORMS: readonly QueryArrayForm[] = ['brackets'];

/**
 * The parameters of an operation the generator reads. One written as a `$ref` is
 * refused by `specShapeProblems`, and left out here so the rest of the build can
 * still report everything else.
 */
const paramsOf = (node: YamlNode): any[] => (node?.parameters ?? []).filter((raw: any) => raw && !raw.$ref);

/** Whether a schema of the listing takes a list. */
const isList = (schema: JsonSchema): boolean => [schema.type].flat().includes('array');

/**
 * Every list in the query of the spec says how it travels. The API reads only
 * `name[]=value` pairs, and OpenAPI has no word for that form: left to `explode`,
 * a client generated from the spec sends `1,2` as one value — which the search
 * drops silently and the task list refuses — or repeats `name=value`, of which
 * only the last value survives. So the form is declared on the parameter
 * (`x-query-array`), and the SDK, the CLI and this manifest all read it there.
 * Checked over every operation, tool or not: the declaration is the spec's.
 */
function queryListProblems(docEn: YamlNode): string[] {
  const problems: string[] = [];
  for (const [p, item] of Object.entries<any>(docEn.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      for (const raw of paramsOf(item[method])) {
        const param = flatten(raw, docEn);
        const list = flatten(param.schema, docEn)?.type === 'array';
        const form = param['x-query-array'];
        const where = `${key(method, p)}: ${param.name}`;
        if (form !== undefined && !QUERY_ARRAY_FORMS.includes(form)) {
          problems.push(`${where} declares x-query-array ${JSON.stringify(form)}, which is no known form`);
        }
        if (form !== undefined && (param.in !== 'query' || !list)) {
          problems.push(`${where} declares x-query-array, and it is no list in the query`);
        }
        if (form === undefined && param.in === 'query' && list) {
          problems.push(`${where} is a list in the query that does not say how it travels — add x-query-array`);
        }
      }
    }
  }
  return problems;
}

/**
 * Schema keywords the generator reads, or knows it may leave aside. A keyword it
 * has never seen fails the build instead of being dropped without a word: a
 * `pattern` the spec added would otherwise never reach a tool, and nothing would
 * say so. A vendor extension is listed with what this generator does with it.
 */
const KNOWN_KEYWORDS = new Set([
  'type',
  'description',
  'enum',
  'default',
  'format',
  'example',
  'items',
  'properties',
  'required',
  'additionalProperties',
  'nullable',
  'anyOf',
  'oneOf',
  'allOf',
  '$ref',
  ...SPEC_VALIDATION,
  // What each enum value means: spelled into the description.
  'x-enum-descriptions',
  // How a list in the query travels: read off the parameter (`queryListProblems`).
  'x-query-array',
  // A list an edit replaces whole: held against the default answers of reads.
  'x-replaces-set',
  // Who a scope is given to: read by `readOperations`.
  'x-scope-roles',
  // An example key of a map, and how an SDK reads a union: for code, not for a model.
  'x-record-key-example',
  'x-union-deserializer',
]);
const KNOWN_TYPES = new Set(['string', 'integer', 'number', 'boolean', 'object', 'array']);
/** The answers a tool is built from: the success codes `outputSchema` reads. */
const ANSWER_CODES = ['200', '201', '202'];

/**
 * Forms of the spec this generator does not know how to turn into a tool. Each
 * one used to pass silently and come out as something else: an `allOf` of two
 * models became an empty schema, a union of a string and a number an object with
 * no fields, a cookie parameter a place no runtime can fill, a response written
 * as a `$ref` a tool with no answer at all. Checked over every operation that
 * becomes a tool or a step of one, before anything is built from it.
 */
function specShapeProblems(docEn: YamlNode): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const walk = (node: any, where: string, depth = 0): void => {
    if (!node || typeof node !== 'object' || depth > 30) return;
    if (node.$ref) {
      const name = String(node.$ref).split('/').pop()!;
      if (!String(node.$ref).startsWith('#/components/schemas/')) problems.push(`${where}: $ref ${node.$ref} points outside the schemas`);
      if (seen.has(name)) return;
      seen.add(name);
      const target = docEn.components?.schemas?.[name];
      if (!target) problems.push(`${where}: $ref ${node.$ref} names no schema of the spec`);
      walk(target, `schema ${name}`, depth + 1);
      return;
    }
    for (const k of Object.keys(node)) {
      if (!KNOWN_KEYWORDS.has(k)) problems.push(`${where}: the schema keyword ${k} is unknown to the generator — carry it or say why not (KNOWN_KEYWORDS)`);
    }
    if (node.type !== undefined && !KNOWN_TYPES.has(node.type)) problems.push(`${where}: type ${JSON.stringify(node.type)} is not one the generator builds`);
    if (Array.isArray(node.allOf) && node.allOf.length !== 1) problems.push(`${where}: allOf of ${node.allOf.length} members, and the generator merges only one`);
    const variants = node.anyOf ?? node.oneOf;
    if (Array.isArray(variants)) {
      if (node.nullable) problems.push(`${where}: a union that may be null, which one object cannot spell`);
      variants.forEach((variant: any, i: number) => {
        if (flatten(variant, docEn)?.type !== 'object') {
          problems.push(`${where}: variant ${i + 1} of a union is not an object, and only objects fold into one`);
        }
      });
    }
    for (const part of [...(node.allOf ?? []), ...(variants ?? [])]) walk(part, where, depth + 1);
    if (node.items) walk(node.items, `${where}[]`, depth + 1);
    for (const [name, child] of Object.entries<any>(node.properties ?? {})) walk(child, `${where}.${name}`, depth + 1);
    if (node.additionalProperties && typeof node.additionalProperties === 'object') walk(node.additionalProperties, `${where}{}`, depth + 1);
  };
  for (const [p, item] of Object.entries<any>(docEn.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = item[method];
      if (!op || op['x-oauth-flow'] === true) continue;
      const k = key(method, p);
      for (const param of op.parameters ?? []) {
        if (param.$ref) {
          problems.push(`${k}: a parameter is a $ref, which the generator does not follow`);
          continue;
        }
        if (!['path', 'query', 'header'].includes(param.in)) problems.push(`${k}: parameter ${param.name} is in ${param.in}, which no tool can fill`);
        if (param.content) problems.push(`${k}: parameter ${param.name} is described by content, and the generator reads schema`);
        walk(param.schema, `${k} ${param.name}`);
      }
      const body = op.requestBody;
      if (body?.$ref) problems.push(`${k}: the request body is a $ref, which the generator does not follow`);
      for (const [type, media] of Object.entries<any>(body?.content ?? {})) {
        if (!['application/json', 'multipart/form-data'].includes(type)) problems.push(`${k}: a request body in ${type}, which the generator does not read`);
        walk(media?.schema, `${k} body`);
      }
      for (const [code, response] of Object.entries<any>(op.responses ?? {})) {
        if (response?.$ref) {
          problems.push(`${k}: response ${code} is a $ref, which the generator does not follow`);
          continue;
        }
        if (!/^2/.test(code)) continue;
        const json = response?.content?.['application/json'];
        if (json && !ANSWER_CODES.includes(code)) problems.push(`${k}: answers ${code} with JSON, and only ${ANSWER_CODES.join(', ')} become an outputSchema`);
        if (json) walk(json.schema, `${k} ${code}`);
      }
    }
  }
  return problems;
}

/**
 * Where the roles of every scope are written: the one schema of the spec that
 * carries `x-scope-roles`. Found by the extension, not by the schema's name, so
 * renaming the enum cannot quietly leave every tool with no roles at all.
 */
function scopeRoleTable(docEn: YamlNode, problems: string[]): Record<string, Role[]> {
  const holders = Object.entries<any>(docEn.components?.schemas ?? {}).filter(([, schema]) => schema?.['x-scope-roles']);
  if (holders.length !== 1) {
    problems.push(`the spec has ${holders.length} schemas with x-scope-roles, and the roles of scopes need exactly one`);
  }
  return holders[0]?.[1]['x-scope-roles'] ?? {};
}

/**
 * Who an operation answers to. The roles its scope is given to (`x-scope-roles`),
 * unless the operation declares fewer of its own (`x-requirements.roles`): a scope
 * a person may hold can still belong to a method only a bot token reaches — the
 * event history is found by the bot that owns it — and a multi-guest holding
 * `chat_members:write` is still refused adding members. Such a list is always a
 * strict subset of the scope's: one that equals it says nothing, and one that
 * reaches past it promises what the scope never gives.
 *
 * An operation names its scope, or says it needs none: `scope: null` where any
 * token is answered, `auth: false` where none is needed at all. One that says
 * neither, or names a scope the table does not know, fails the build — a typo in
 * a scope used to leave the method with no roles and so in no listing, silently.
 *
 * One operation answers to a second scope, and the manifest says nothing of it:
 * `GET /bots/{id}` also takes `bots:write` without `bots:read`, as its description
 * says. A tool names one scope and listings are cut by role and plan, not by the
 * scopes a token holds, so `bots:read` stands; if a runtime ever filters by
 * scopes, that alternative has to reach the spec first.
 */
function operationRoles(
  k: OperationKey,
  node: YamlNode,
  scope: string | null,
  roleTable: Record<string, Role[]>,
  problems: string[],
): Role[] {
  const requirements = node['x-requirements'] ?? {};
  const open = requirements.scope === null || requirements.auth === false;
  if (!scope && !open) problems.push(`${k}: x-requirements names no scope — name one, or scope: null where any token is answered`);
  if (scope && !roleTable[normaliseScope(scope)]) problems.push(`${k}: scope ${scope} is not in x-scope-roles`);
  const scopeRoles: Role[] = scope ? (roleTable[normaliseScope(scope)] ?? []) : [...ALL_ROLES];
  const declared: unknown = requirements.roles;
  if (declared === undefined) {
    if (!scopeRoles.length) problems.push(`${k}: ${scope} is given to no role, so the operation is in no listing`);
    return scopeRoles;
  }
  if (!Array.isArray(declared) || declared.some((r) => typeof r !== 'string')) {
    problems.push(`${k}: x-requirements.roles is not a list of roles`);
    return scopeRoles;
  }
  if (declared.length === 0) {
    problems.push(`${k}: x-requirements.roles is empty, so the operation is in no listing`);
    return [];
  }
  const roles = declared as Role[];
  if (!scope) problems.push(`${k}: x-requirements.roles narrows a scope the operation does not name`);
  const unknown = roles.filter((r) => !ALL_ROLES.includes(r));
  if (unknown.length) problems.push(`${k}: x-requirements.roles names ${unknown.join(', ')}, which is no role of the listings`);
  if (new Set(roles).size !== roles.length) problems.push(`${k}: x-requirements.roles names a role twice`);
  const beyond = roles.filter((r) => !scopeRoles.includes(r));
  if (beyond.length) problems.push(`${k}: x-requirements.roles gives ${beyond.join(', ')}, and ${scope} is never given to them`);
  if (!beyond.length && scopeRoles.every((r) => roles.includes(r))) {
    problems.push(`${k}: x-requirements.roles repeats the roles of ${scope} — drop it`);
  }
  return roles;
}

/**
 * Every operation of the spec, with the access it needs. Operations come from
 * `openapi.yaml`, their words and schemas from `openapi.en.yaml`; an operation
 * the English spec lacks fails the build rather than becoming a tool described
 * as its path, with no title and no arguments.
 */
function readOperations(problems: string[], oauthFlow: OperationKey[]): Operation[] {
  const doc = yaml.load(fs.readFileSync(SPEC_PATH, 'utf8')) as YamlNode;
  const docEn = yaml.load(fs.readFileSync(SPEC_EN_PATH, 'utf8')) as YamlNode;
  const roleTable = scopeRoleTable(docEn, problems);
  collectVocabulary(docEn);
  const out: Operation[] = [];
  for (const [p, item] of Object.entries<any>(doc.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const node = item[method];
      if (!node) continue;
      const k = key(method, p);
      // A step of the OAuth flow (`x-oauth-flow`) is the client's to run: a model
      // never holds a client secret or exchanges a code, so it is no tool at all.
      if (node['x-oauth-flow'] === true) {
        oauthFlow.push(k);
        continue;
      }
      const nodeEn = docEn.paths?.[p]?.[method];
      if (!nodeEn) {
        problems.push(`${k} is in openapi.yaml and not in openapi.en.yaml`);
        continue;
      }
      const scope: string | null = node['x-requirements']?.scope ?? null;
      const roles = operationRoles(k, node, scope, roleTable, problems);
      // A method only a bot answers to takes a bot token: a person's token has no
      // event history, opened form or link preview of its own.
      const botTokenOnly = roles.length === 1 && roles[0] === 'bot';
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
        nodeEn,
      });
      // A chain step is no tool, so a link to it keeps its words (`linksAsTools`).
      if (!(k in CHAIN_STEPS)) TOOL_BY_KEY.set(k, out[out.length - 1]!.name);
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
  /**
   * For a list in the query: how it travels, read from `x-query-array` of the
   * parameter. `brackets` sends each value as its own `name[]=value` pair, the only
   * form the API reads — `1,2` in one value is dropped silently or refused, and a
   * repeated `name=value` keeps the last value alone.
   */
  array?: QueryArrayForm;
  /**
   * For an upload: the operations the server runs to make it, in order, and the
   * scopes they need beyond the tool's own. Read from those operations, so a token
   * that may send a message but not upload a file is refused before the first
   * step instead of halfway through.
   */
  operations?: OperationKey[];
  scopes?: string[];
  /**
   * For an upload: what each item becomes once uploaded — `file`, the file
   * object with its key and size filled in, or `key`, the key alone where the
   * API takes a list of keys.
   */
  item?: 'file' | 'key';
  /**
   * What the server does with an argument the API has no field for. Written out
   * so the runtime executes a declaration instead of knowing the argument by
   * name: `view` cuts each record of a list to the card of an entity, or keeps
   * the fields `SINGLE_READ_OMIT` names out of a single read, and `draft_id` runs
   * one more operation once the first one succeeded. Another such argument is
   * then a new version of the package rather than a change in the backend.
   */
  effect?:
    | { kind: 'projection'; entity: string }
    | { kind: 'omission'; entity: string }
    | { kind: 'after'; operation: OperationKey; at: string; on: 'success'; scopes: string[] }
    | { kind: 'download'; into: string };
}

/** The operations an upload runs, in order: the chain steps of the set. */
const UPLOAD_STEPS = Object.keys(CHAIN_STEPS) as OperationKey[];

/** What an upload yields, and so what the server fills into a file it uploaded. */
const UPLOAD_FILLS = ['key', 'size'];

/**
 * A file the model hands over: its contents, a link the server downloads
 * (`FILE_SOURCES`), or the key of a file already in Pachca, which goes as it is.
 */
const FILE_CONTENT: JsonSchema = {
  type: 'string',
  description: 'The file contents, base64-encoded — for text you wrote yourself.',
};
const IMAGE_CONTENT: JsonSchema = { type: 'string', description: 'The image contents, base64-encoded.' };
const FILE_URL: JsonSchema = { type: 'string', description: 'A public https link to the file; the server downloads it.' };

/**
 * The spec's `name` of a file sends a model to the `key` it has no part in when
 * it hands over contents or a link. Counted, so a rewrite that no longer finds
 * its sentence fails the build instead of rewriting nothing.
 */
const FILE_NAME_REWRITE: [RegExp, string] = [/the file in `key`/g, 'the file you pass (content, url or key)'];
let fileNameRewrites = 0;

/**
 * The one clause of a lifted field's words that is rewritten: the keys of
 * uploaded images, which the model never holds. Everything before and after it
 * stays as the spec says it, and the build checks both halves.
 */
const LIFT_KEYS_CLAUSE = /:\s*keys of uploaded images\s*\([^)]*\)\./;

/** Where a value sits under a dotted place of the arguments: `{}` is a value of a map, `[]` an item of a list. */
function schemaAt(properties: Record<string, JsonSchema>, at: string): { node?: JsonSchema; parent?: JsonSchema } {
  const [head, ...rest] = at.split('.');
  let parent: JsonSchema | undefined;
  let node: JsonSchema | undefined = properties[head!];
  for (const step of rest) {
    if (!node) break;
    if (step === '{}') node = typeof node.additionalProperties === 'object' ? node.additionalProperties : undefined;
    else if (step === '[]') node = node.items;
    else {
      parent = node;
      node = node.properties?.[step];
    }
  }
  return { node, parent };
}

interface BuiltInput {
  schema: JsonSchema;
  request: { media_type?: string; headers?: Record<string, string>; arguments: Record<string, ArgumentPlace> };
  /** Names that two places of the request both claim. */
  clashes: string[];
  /** What could not be built as declared: a header with a choice, prose for an argument the tool lacks. */
  problems: string[];
  /** The spec's words of each argument, before written prose follows them. */
  specWords: Record<string, string>;
}

/** The body of the create of the same resource: `POST /x` for `PUT /x/{id}`. */
function createBodyOf(op: Operation, docEn: YamlNode): any {
  if (op.method !== 'PUT' && op.method !== 'PATCH') return null;
  const parent = op.path.replace(/\/\{[^}/]+\}$/, '');
  if (parent === op.path) return null;
  const content = docEn.paths?.[parent]?.post?.requestBody?.content ?? {};
  return flatten(content['application/json']?.schema ?? content['multipart/form-data']?.schema ?? null, docEn);
}

/**
 * Arguments of a tool: what the path and the query take, plus the fields of the
 * body. The spec wraps a body in its entity — `{task: {…}}` — and that wrapper
 * is plumbing, not a choice a model makes, so it is unwrapped — but only a
 * wrapper: an object that is the one thing the body has or requires. The form
 * of `POST /views/open` sits beside a required trigger and stays the object it
 * is. An edit unwraps what the create of the same resource unwraps: editing a
 * bot may touch only its authorization, so its body requires nothing, and it
 * still takes the same arguments as creating one. The fields a wrapper requires
 * are required of the tool only when the wrapper itself is.
 */
function inputSchema(op: Operation, absorbs: Operation[], docEn: YamlNode): BuiltInput {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const places: Record<string, ArgumentPlace> = {};
  const clashes: string[] = [];
  const problems: string[] = [];
  const claim = (name: string, place: ArgumentPlace, schema: JsonSchema): void => {
    if (places[name]) clashes.push(`${name} (${places[name]!.in}${places[name]!.at ? ` ${places[name]!.at}` : ''} and ${place.in}${place.at ? ` ${place.at}` : ''})`);
    places[name] = place;
    properties[name] = schema;
  };
  // A header the API allows only one value of is a choice already made, not an
  // argument: the server sends it with every call. `Prefer: return=representation`
  // is what makes an export answer with its id instead of an empty 204.
  const headers: Record<string, string> = {};
  for (const raw of paramsOf(op.nodeEn)) {
    const param = flatten(raw, docEn);
    if (param.in === 'header') {
      const only = flatten(param.schema, docEn)?.enum;
      if (only?.length !== 1 || typeof only[0] !== 'string') {
        problems.push(`${op.name}: the header ${param.name} is not a single fixed value, and a model has no way to send a header`);
      } else {
        headers[param.name] = only[0];
      }
      continue;
    }
    // The parameter's own wording leads, and what the values of its schema mean
    // still follows it.
    const worded = param.description ? { ...flatten(param.schema, docEn), description: param.description } : param.schema;
    const schema = property(worded, docEn);
    // A list in the query travels the way the spec declares (`queryListProblems`),
    // never the way OpenAPI's explode would put it: the emitter writes
    // `explode: false` on every query parameter by default, and that form is not
    // one the API reads.
    const form: QueryArrayForm | undefined = param.in === 'query' && isList(schema) ? param['x-query-array'] : undefined;
    claim(param.name, { in: param.in, ...(form ? { array: form } : {}) }, schema);
    if (param.required) required.push(param.name);
  }
  const body = flatten(requestBodySchema(op), docEn);
  const bodyRequired: string[] = body?.required ?? [];
  const unwraps = (holder: any, name: string, child: any): boolean =>
    child?.type === 'object' &&
    Boolean(child.properties) &&
    (Object.keys(holder?.properties ?? {}).length === 1 || (holder?.required?.length === 1 && holder.required[0] === name));
  const created = createBodyOf(op, docEn);
  const wrapperOf = (name: string, child: any): boolean =>
    unwraps(body, name, child) ||
    (Boolean(created?.properties?.[name]) && unwraps(created, name, flatten(created.properties[name], docEn)) && unwraps({ required: [name] }, name, child));
  for (const [name, raw] of Object.entries<any>(body?.properties ?? {})) {
    const child = flatten(raw, docEn);
    if (wrapperOf(name, child)) {
      for (const [inner, innerRaw] of Object.entries<any>(child.properties)) {
        claim(inner, { in: 'body', at: `${name}.${inner}` }, property(innerRaw, docEn));
      }
      if (bodyRequired.includes(name)) for (const r of child.required ?? []) required.push(r);
    } else {
      claim(name, { in: 'body', at: name }, property(raw, docEn));
      if (bodyRequired.includes(name)) required.push(name);
    }
  }

  // A choice of detail exists only where there is something to choose: a list
  // or a search with a card per record, or a read of one record whose entity
  // keeps declared fields out of its default answer. A read of one record answers
  // whole otherwise, and so does a read of token info or of who read a message:
  // offering the switch there promises a difference that is not there. The
  // description names what compact carries or leaves out, so a field outside it
  // is not taken for a field the record lacks.
  const card = responseEntity(op, docEn);
  if (op.kind === 'read' && card) {
    const { name, description, ...rest } = VIEW_ARGUMENT;
    const list = answersList(op, docEn);
    const omitted = SINGLE_READ_OMIT[card];
    if (list && COMPACT_PROJECTIONS[card]) {
      const said = description.card.replace('{fields}', spokenList(COMPACT_PROJECTIONS[card]!));
      claim(name, { in: 'server', effect: { kind: 'projection', entity: card } }, { ...rest, description: said } as JsonSchema);
    } else if (!list && omitted) {
      const said = description.omission
        .replace('{fields}', spokenList(omitted.flatMap((o) => o.fields)))
        .replace('{why}', omitted.map((o) => sentence(o.why)).join(' '));
      claim(name, { in: 'server', effect: { kind: 'omission', entity: card } }, { ...rest, description: said } as JsonSchema);
    }
  }
  // A send may finish a draft (`DRAFT_ARGUMENT`): naming it here keeps the
  // tidying inside the act that made it necessary, instead of a second call. The
  // scope of the operation that clears the draft is filled from the spec beside
  // the tool, the same way an upload step brings its own.
  if (op.key === DRAFT_CLEANUP.host) {
    const { name, ...rest } = DRAFT_ARGUMENT;
    const { operation, at, on } = DRAFT_CLEANUP;
    claim(name, { in: 'server', effect: { kind: 'after', operation, at, on, scopes: [] } }, rest as JsonSchema);
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
    const field = properties[chain.argument] ?? {};
    const item = field.items ?? { type: 'object', properties: {} };
    delete places[chain.argument];
    // What an upload yields — the key, the size — is the server's to fill. The
    // rest of what the API lets a file carry stays the model's: an image sent as
    // an image, a voice message with its duration and waveform. Keeping only a
    // name and the bytes left no way to send either. The key stays too, for a
    // file already in Pachca: an edit replaces the whole set, so a file that is
    // to stay is passed again by its key, and an item that carries one goes as
    // it is, without an upload.
    const owner = at.includes('.') ? at.split('.')[0] : 'record';
    const kept = Object.entries<JsonSchema>(item.properties ?? {})
      .filter(([name]) => name !== 'size')
      .map(([name, schema]): [string, JsonSchema] => {
        if (name === 'key') {
          return [name, { ...schema, description: `The key of a file already in Pachca, as an attachment carries it in the full record of the ${owner}. A file passed by its key goes as it is.` }];
        }
        if (name === 'id') return [name, { ...schema, description: `${sentence(String(schema.description ?? ''))} Only together with key.` }];
        if (name === 'name' && typeof schema.description === 'string') {
          const [pattern, to] = FILE_NAME_REWRITE;
          const told = schema.description.replace(pattern, to);
          if (told !== schema.description) fileNameRewrites += 1;
          return [name, { ...schema, description: told }];
        }
        return [name, schema];
      });
    const said = String(field.description ?? '').trim();
    claim(chain.argument, { in: 'upload', at, operations: [step.key], scopes: step.scope ? [step.scope] : [], item: 'file' }, {
      type: 'array',
      ...(field.maxItems !== undefined ? { maxItems: field.maxItems } : {}),
      ...(field.minItems !== undefined ? { minItems: field.minItems } : {}),
      items: {
        type: 'object',
        description: 'One of content, url or key.',
        properties: { ...Object.fromEntries(kept), content: FILE_CONTENT, url: FILE_URL },
        required: (item.required ?? []).filter((name: string) => !UPLOAD_FILLS.includes(name)),
      },
      description:
        `${sentence(said)} Each file goes as its contents, a public link, or the key of a file already in Pachca: ` +
        'the server uploads contents and links, filling in key and size.',
    });
  }

  // A field of keys is lifted out to an argument the server fills by uploading
  // (`UPLOAD_LIFTS`): the model hands over the images, the server makes the keys.
  for (const lift of UPLOAD_LIFTS[op.key] ?? []) {
    const [outer, inner] = lift.at.split('.') as [string, string];
    const host = Object.entries(places).find(([, place]) => place.in === 'body' && place.at === outer)?.[0];
    const holder = host ? properties[host] : undefined;
    const field = holder?.properties?.[inner];
    if (!host || !holder || !field) {
      problems.push(`${op.name}: ${lift.at} is lifted, and the body has no such field`);
      continue;
    }
    delete holder.properties![inner];
    if (holder.required) holder.required = holder.required.filter((name: string) => name !== inner);
    claim(lift.argument, { in: 'upload', at: lift.at, operations: [...UPLOAD_STEPS], scopes: [], item: 'key' }, {
      type: 'array',
      ...(field.maxItems !== undefined ? { maxItems: field.maxItems } : {}),
      ...(field.minItems !== undefined ? { minItems: field.minItems } : {}),
      items: {
        type: 'object',
        description: 'One of content, url or key.',
        properties: {
          name: { type: 'string', description: 'File name with its extension, for content or url.' },
          content: IMAGE_CONTENT,
          url: FILE_URL,
          key: {
            type: 'string',
            description: `The key of an image already in place, as the full record carries it in ${lift.at}. It goes as it is.`,
          },
        },
      },
      // The spec's words stay; only the part about keys, which the model never
      // holds, becomes what it passes instead.
      description: (() => {
        const said = String(field.description ?? '').trim();
        const passed =
          'each image as its contents, a public link, or the key of an image already in place; the server uploads ' +
          'contents and links and puts their keys in place.';
        const told = said.replace(LIFT_KEYS_CLAUSE, `: ${passed}`);
        return told !== said ? told : `${sentence(said)} Each image goes as its contents, a public link, or the key of an image already in place.`;
      })(),
    });
  }

  // A file the API takes as bytes can come as a link too: the server downloads it
  // (`FILE_SOURCES`). The bytes stay optional then — one of the two is enough.
  for (const [name, place] of Object.entries({ ...places })) {
    if (place.in !== 'body' || properties[name]?.contentEncoding !== 'base64') continue;
    const url = `${name}_url`;
    claim(url, { in: 'server', effect: { kind: 'download', into: name } }, {
      type: 'string',
      description: `A public https link to the file instead of ${name}; the server downloads it. Pass one of the two.`,
    });
    properties[name] = { ...properties[name], description: `${properties[name]!.description} Or pass ${url} instead.` };
    for (let i = required.length - 1; i >= 0; i--) if (required[i] === name) required.splice(i, 1);
  }

  // A field that takes an upload key this server makes no upload for
  // (`UPLOAD_UNAVAILABLE`) stays, and both it and its neighbour send the model to
  // the neighbour, which takes a public link.
  for (const { at, use } of UPLOAD_UNAVAILABLE[op.key] ?? []) {
    const { node, parent } = schemaAt(properties, at);
    const neighbour = parent?.properties?.[use];
    if (!node || !neighbour) {
      problems.push(`${op.name}: ${at} is declared without uploads, and the arguments have no such field or no ${use} beside it`);
      continue;
    }
    const field = at.split('.').pop()!;
    const note = `Upload keys are not available through this server: pass a public link in ${use} instead.`;
    node.description = `${sentence(String(node.description ?? ''))} ${note}`.trim();
    if (node.properties?.key) node.properties.key = { ...node.properties.key, description: `${sentence(String(node.properties.key.description ?? ''))} ${note}` };
    const told = String(neighbour.description ?? '').replace(new RegExp(`\\s*\\([^()]*\\b${field}\\b[^()]*\\)`), '');
    parent!.properties![use] = { ...neighbour, description: `${sentence(told)} Through this server it is how a preview gets its image.`.trim() };
  }

  // A moment named in words is written the same way in every date-time argument
  // (`MOMENT_ARGUMENT`), so the note goes after the spec's words of each, at any
  // depth, where the value is written. It goes before prose, so prose is held
  // against it as against the spec's own words.
  const moment = (node?: JsonSchema): void => {
    if (!node || typeof node !== 'object') return;
    if (node.format === 'date-time') node.description = `${sentence(String(node.description ?? ''))} ${MOMENT_ARGUMENT.description}`.trim();
    Object.values(node.properties ?? {}).forEach(moment);
    if (node.items) moment(node.items);
    if (node.additionalProperties && typeof node.additionalProperties === 'object') moment(node.additionalProperties);
  };
  Object.values(properties).forEach(moment);

  // A search phrase is written in the words of the request (`QUERY_ARGUMENT`):
  // the note goes after the spec's words of every top-level text argument named
  // `query`, before prose, the same way.
  const query = properties.query;
  if (query && [query.type ?? []].flat().includes('string')) {
    properties.query = { ...query, description: `${sentence(String(query.description ?? ''))} ${QUERY_ARGUMENT.description}`.trim() };
  }

  // Written argument text follows the spec's rather than replacing it: the spec
  // says what the field is, prose what to put there — the voice a message is
  // written in, the flag a day without an hour takes. Applied once every
  // argument is in place, so prose for an upload or a link argument lands too,
  // and prose for one the tool does not take fails the build.
  const specWords: Record<string, string> = {};
  for (const [argument, text] of Object.entries(MCP_TOOL_PROSE[op.name]?.arguments ?? {})) {
    const field = properties[argument];
    if (!field) {
      problems.push(`${op.name}: prose is written for the argument ${argument}, which the tool does not take`);
      continue;
    }
    const said = String(field.description ?? '').trim();
    specWords[argument] = said;
    field.description = said ? `${sentence(said)} ${text}` : text;
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
    request: {
      ...(mediaType ? { media_type: mediaType } : {}),
      ...(Object.keys(headers).length ? { headers } : {}),
      arguments: places,
    },
    clashes,
    problems,
    specWords,
  };
}

/** Whether a successful answer carries a list of records rather than one. */
function answersList(op: Operation, docEn: YamlNode): boolean {
  for (const code of ANSWER_CODES) {
    const body = op.nodeEn?.responses?.[code]?.content?.['application/json']?.schema;
    if (!body) continue;
    return flatten(flatten(body, docEn)?.properties?.data, docEn)?.type === 'array';
  }
  return false;
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

/**
 * The structured half of an answer: the response body as the API gives it —
 * `data`, and `meta` where the body has it — with every field down to the bottom.
 * A list or a search cuts each record to its compact card unless view is full,
 * a single read leaves out only what SINGLE_READ_OMIT names, a write answers with
 * the whole record it made or changed, and all of them fit, because nothing in an
 * answer is required. Declaring the card alone left every field
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
        file_name: { type: 'string', description: 'The name the file was sent with.' },
        mime_type: { type: 'string', description: `The media type of the file, ${other} when the API does not name a narrower one.` },
        size: { type: 'integer', description: 'Size in bytes. The bytes themselves are a content block of the answer (`binary_body`).' },
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

/**
 * The free text of an answer, by path: what other people wrote (`untrusted`),
 * what Pachca makes itself (`trusted`, by `TRUSTED_TEXT`), and what a closed set
 * of values or a format already bounds (`closed`).
 *
 * Closed by default: every string without an enum or a format, and every object
 * of free keys, is somebody's writing until `TRUSTED_TEXT` says Pachca made it.
 * A list was kept by hand in two places before, and they had drifted apart while
 * forty-four tools answered with text neither named — names of people, task
 * text, the last request a bot received from anyone outside.
 *
 * A path names fields by dots: `[]` steps into every item of a list, `{}` into
 * every value of a map, and a path that ends at an object covers everything in
 * it. The spec is walked with its references, so a field is known by the schema
 * it belongs to (`Message.content`) however deep a tool's answer holds it; a
 * variant of a union adds its fields under the same path, and a path any variant
 * leaves to other people is untrusted.
 *
 * The walk also names the secrets the answer can carry — the fields `TRUSTED_TEXT`
 * marks secret that it meets — and a tool that answers with one carries
 * `SECRET_NOTE`.
 */
interface TextPaths {
  untrusted: string[];
  trusted: string[];
  closed: string[];
  secrets: string[];
}
const TRUSTED_KEYS = new Set(TRUSTED_TEXT.flatMap((group) => group.fields));
const SECRET_KEYS = new Set(TRUSTED_TEXT.filter((group) => group.secret).flatMap((group) => group.fields));
const noText = (): TextPaths => ({ untrusted: [], trusted: [], closed: [], secrets: [] });
/** Every key of free text the walks met, and every key a closed set bounds — what `TRUSTED_TEXT` is held against. */
const FREE_TEXT_KEYS = new Set<string>();
const CLOSED_KEYS = new Set<string>();

function textPaths(schema: any, doc: YamlNode, owner: string): TextPaths {
  const found = noText();
  const at = (base: string, name: string): string => (base ? `${base}.${name}` : name);
  const free = (key: string, where: string): void => {
    FREE_TEXT_KEYS.add(key);
    if (SECRET_KEYS.has(key)) found.secrets.push(key);
    (TRUSTED_KEYS.has(key) ? found.trusted : found.untrusted).push(where);
  };
  const walk = (node: any, schemaName: string, inner: string, where: string, stack: string[]): void => {
    if (!node || typeof node !== 'object' || stack.length > 30) return;
    if (node.$ref) {
      const name = String(node.$ref).split('/').pop()!;
      if (!stack.includes(name)) walk(doc.components?.schemas?.[name], name, '', where, [...stack, name]);
      return;
    }
    const variants: any[] = node.anyOf ?? node.oneOf ?? [];
    for (const part of [...(node.allOf ?? []), ...variants]) walk(part, schemaName, inner, where, stack);
    const key = inner ? `${schemaName}.${inner}` : schemaName;
    if (node.type === 'string') {
      if (node.enum || node.format) {
        CLOSED_KEYS.add(key);
        found.closed.push(where);
      } else {
        free(key, where);
      }
    }
    if (node.type === 'array') walk(node.items, schemaName, inner, `${where}[]`, stack);
    if (node.type === 'object' || node.properties) {
      for (const [name, child] of Object.entries<any>(node.properties ?? {})) walk(child, schemaName, at(inner, name), at(where, name), stack);
      // A map of typed values is walked into; an object of free keys is text as a
      // whole; an object with neither fields nor free keys — an empty model — has none.
      const values = node.additionalProperties;
      const typed = values && typeof values === 'object' && Object.keys(values).length > 0;
      const open = values === true || (values && typeof values === 'object' && !typed);
      if (typed) walk(values, schemaName, inner, `${where}{}`, stack);
      else if (open && !node.properties) free(key, where);
    }
  };
  walk(schema, owner, '', '', []);
  const unique = (list: string[]): string[] => [...new Set(list)];
  const untrusted = unique(found.untrusted);
  return {
    untrusted,
    trusted: unique(found.trusted).filter((p) => !untrusted.includes(p)),
    closed: unique(found.closed).filter((p) => !untrusted.includes(p)),
    secrets: unique(found.secrets),
  };
}

/** The free text of a tool's answer: its body in the spec, or the answer the generator builds for a file or a redirect. */
function answerTextPaths(op: Operation, output: JsonSchema | null, docEn: YamlNode): TextPaths {
  for (const code of ANSWER_CODES) {
    const body = op.nodeEn?.responses?.[code]?.content?.['application/json']?.schema;
    if (body) return textPaths(body, docEn, op.key);
  }
  if (!output) return noText();
  return textPaths(output, { components: { schemas: {} } }, output.properties?.mime_type ? 'file' : 'redirect');
}

/**
 * The places of a built answer where text can be: every string, and every object
 * of free keys. Held against `textPaths`, which reads the spec, so a field the
 * two walks see differently — folded from a union, cut by depth, a map — fails
 * the build instead of going out unclassified.
 */
function textPlaces(schema: JsonSchema | null | undefined): string[] {
  const places: string[] = [];
  const at = (base: string, name: string): string => (base ? `${base}.${name}` : name);
  const walk = (node: JsonSchema | undefined, where: string): void => {
    if (!node || typeof node !== 'object') return;
    const types = [node.type].flat();
    if (types.includes('string')) places.push(where);
    if (types.includes('array')) walk(node.items, `${where}[]`);
    if (types.includes('object')) {
      for (const [name, child] of Object.entries(node.properties ?? {})) walk(child, at(where, name));
      const values = node.additionalProperties;
      if (values && typeof values === 'object' && Object.keys(values).length) walk(values, `${where}{}`);
      else if ((values === true || (values && typeof values === 'object')) && !node.properties) places.push(where);
    }
  };
  walk(schema ?? undefined, '');
  return [...new Set(places)];
}

/**
 * What a client shows the person.
 *
 * A read is safe. A write is destructive unless `ADDITIVE` says why it only adds:
 * the protocol's own reading of the flag, and the safe default for a write
 * nobody has looked at yet. Repeating a read, a PUT or a DELETE changes nothing
 * more, so those are idempotent by method; a POST is not, whatever its
 * description says about a second call — the flag is optional, and false is the
 * cautious value. The world is open, the protocol's default: a workspace holds
 * guests and people of other companies in shared chats, and some tools fetch
 * a public link the model passes.
 */
function annotations(op: Operation): Record<string, boolean> {
  return {
    readOnlyHint: op.kind === 'read',
    destructiveHint: op.kind === 'write' && !(op.key in ADDITIVE),
    idempotentHint: op.kind === 'read' || op.method === 'PUT' || op.method === 'DELETE',
    openWorldHint: true,
  };
}

/** Roughly how many tokens a text costs: the ratio measured on the manifest's English. */
const approxTokens = (text: string): number => Math.round(text.length / 3.7);

/** Roughly what a listing costs the model: name, description and input schema. */
function modelTokens(tool: { name: string; description: string; inputSchema: JsonSchema }): number {
  return approxTokens(`${TOOL_PREFIX}${tool.name}${tool.description}${JSON.stringify(tool.inputSchema)}`);
}

/** The values a description names after «Values:», as `property` and `mergeVariants` spell them. */
function valuesNamed(description: unknown): Set<string> {
  const text = String(description ?? '');
  const at = text.lastIndexOf('Values: ');
  if (at < 0) return new Set();
  const list = text.slice(at + 'Values: '.length).replace(/\.$/, '');
  const items = list.includes(' — ') ? list.split('; ').map((pair) => pair.split(' — ')[0]!) : list.split(', ');
  return new Set(items.map((v) => v.trim()));
}

/**
 * What of a spec schema did not make it into the schema built from it: a field,
 * the items of a list, the values of a map, an enum value or what it means, a
 * type, the null a field may be — and on an argument every limit, pattern and
 * format the API checks. On an answer the values have to be in the description,
 * where `property` moves them. Walks both side by side with its own reading of
 * the spec (`specResolve`).
 */
function lostFields(tool: string, at: string, spec: any, built: JsonSchema | undefined, doc: YamlNode, side: Shape['side']): string[] {
  return lostAcross(tool, at, [spec], built, doc, side, 0);
}

/**
 * The same check for one built node that stands for several spec nodes: a field
 * of a union, which `variantsAsOne` and `mergeVariants` spell once for every
 * variant that carries it. A union among the nodes stands for its variants.
 *
 * Every keyword is held to the value `mergeVariants` promises: a limit to the
 * widest one, a rule and a format to the one every node agrees on — and to none
 * where some node carrying the field has none. A keyword is excused only there,
 * so a pattern or a limit lost from one variant fails the build like any other.
 */
function lostAcross(
  tool: string,
  at: string,
  specs: any[],
  built: JsonSchema | undefined,
  doc: YamlNode,
  side: Shape['side'],
  depth: number,
): string[] {
  const nodes = specs.map((spec) => specResolve(spec, doc)).filter((node) => node && typeof node === 'object');
  if (!nodes.length || depth > 12) return [];
  if (!built) return [`${tool}: ${at} is in the spec and not in the tool`];
  const variantsOf = (node: any): any[] | undefined => {
    const variants = node.anyOf ?? node.oneOf;
    return !node.type && Array.isArray(variants) ? variants.map((v: any) => specResolve(v, doc)).filter(Boolean) : undefined;
  };
  // A union's own node carries no keyword: `variantsAsOne` spells it as a plain object.
  const plain = nodes.filter((node) => !variantsOf(node));
  const united = nodes.length > 1 || plain.length < nodes.length;
  const lost: string[] = [];
  const input = side === 'input';
  const builtTypes = [built.type].flat();
  const named = valuesNamed(built.description);
  for (const source of plain) {
    if (source.type && !builtTypes.includes(source.type)) lost.push(`${tool}: ${at} is ${source.type} in the spec and ${built.type ?? 'untyped'} in the tool`);
    const values: unknown[] = Array.isArray(source.enum) ? source.enum : [];
    for (const value of values) {
      if (input ? !built.enum?.includes(value) : !named.has(String(value))) lost.push(`${tool}: ${at} lost the enum value ${value}`);
    }
    for (const [value, meaning] of Object.entries<any>(source['x-enum-descriptions'] ?? {})) {
      if (!String(built.description ?? '').includes(String(meaning).trim())) lost.push(`${tool}: ${at} lost what ${value} means`);
      if (values.length && !values.some((v) => String(v) === value || normaliseScope(String(v)) === normaliseScope(value))) {
        lost.push(`${tool}: ${at} says what ${value} means, and ${value} is no value of its enum`);
      }
    }
    if (source.nullable && !builtTypes.includes('null')) lost.push(`${tool}: ${at} can be null in the spec and not in the tool`);
  }
  // The value of a keyword across the nodes: the widest limit, the one rule or
  // format all of them share, or none when some node has none.
  const across = (k: string): unknown => {
    const given = nodes.map((node) => (plain.includes(node) ? node[k] : undefined));
    if (given.some((v) => v === undefined)) return undefined;
    if (UPPER_LIMITS.has(k)) return Math.max(...(given as number[]));
    if (LOWER_LIMITS.has(k)) return Math.min(...(given as number[]));
    return new Set(given.map((v) => JSON.stringify(v))).size === 1 ? given[0] : undefined;
  };
  if (input) {
    if (plain.length === nodes.length && plain.every((node) => Array.isArray(node.enum))) {
      // every value is checked above
    } else if (built.enum) {
      lost.push(`${tool}: ${at} has an enum, and the spec leaves some of its values open`);
    }
    for (const k of SPEC_VALIDATION) {
      const want = across(k);
      const have = built[k];
      if (JSON.stringify(have) === JSON.stringify(want)) continue;
      if (have === undefined) lost.push(`${tool}: ${at} lost ${k} ${JSON.stringify(want)}`);
      else if (want === undefined) lost.push(`${tool}: ${at} has ${k} ${JSON.stringify(have)}, and the spec sets none${united ? ' for some variant' : ''}`);
      else lost.push(`${tool}: ${at} has ${k} ${JSON.stringify(have)}, unlike the spec's ${JSON.stringify(want)}`);
    }
    const format = across('format');
    if (format === 'binary') {
      if (built.contentEncoding !== 'base64') lost.push(`${tool}: ${at} lost its format binary`);
    } else if (built.format !== format) {
      lost.push(
        format === undefined
          ? `${tool}: ${at} has the format ${built.format}, and the spec sets none${united ? ' every variant agrees on' : ''}`
          : `${tool}: ${at} lost its format ${format}`,
      );
    }
    // What the spec requires inside an object, the tool requires too, and nothing
    // more; across a union a field is required only where every variant has it.
    const source = plain[0];
    if (!united && source.type === 'object' && source.properties) {
      const want = new Set<string>(source.required ?? []);
      const have = new Set<string>(built.required ?? []);
      for (const name of want) if (!have.has(name)) lost.push(`${tool}: ${at}.${name} is required in the spec and not in the tool`);
      for (const name of have) if (!want.has(name)) lost.push(`${tool}: ${at}.${name} is required in the tool and not in the spec`);
    }
  } else if (across('format') === 'date-time' && built.format !== 'date-time') {
    lost.push(`${tool}: ${at} lost its format date-time`);
  }
  // Inside: a union's variants count as the objects they are.
  const inner = nodes.flatMap((node) => variantsOf(node) ?? [node]);
  const lists = inner.filter((node) => node.type === 'array' && node.items).map((node) => node.items);
  if (lists.length) lost.push(...lostAcross(tool, `${at}[]`, lists, built.items, doc, side, depth + 1));
  const names = [...new Set(inner.flatMap((node) => Object.keys(node.properties ?? {})))];
  for (const name of names) {
    const carriers = inner.filter((node) => node.properties?.[name]).map((node) => node.properties[name]);
    lost.push(...lostAcross(tool, `${at}.${name}`, carriers, built.properties?.[name], doc, side, depth + 1));
  }
  const maps = inner
    .filter((node) => node.additionalProperties && typeof node.additionalProperties === 'object')
    .map((node) => node.additionalProperties);
  if (maps.length) {
    const values = typeof built.additionalProperties === 'object' ? built.additionalProperties : undefined;
    lost.push(...lostAcross(tool, `${at}{}`, maps, values, doc, side, depth + 1));
  }
  return lost;
}

/**
 * An answer carries types, null, descriptions and a moment's format, and nothing
 * a client could refuse a value over (`property`): no enum, no limit or rule and
 * no other format. Walks every node of a built outputSchema, whatever made it.
 */
function outputKeywords(tool: string, schema: JsonSchema | undefined): string[] {
  const problems: string[] = [];
  const walk = (node: JsonSchema | undefined, at: string): void => {
    if (!node || typeof node !== 'object') return;
    if (node.enum) problems.push(`${tool}: the answer's ${at} declares an enum`);
    for (const k of SPEC_VALIDATION) if (node[k] !== undefined) problems.push(`${tool}: the answer's ${at} declares ${k}`);
    if (node.format !== undefined && !OUTPUT_FORMATS.includes(String(node.format))) {
      problems.push(`${tool}: the answer's ${at} declares the format ${node.format}`);
    }
    for (const [field, child] of Object.entries(node.properties ?? {})) walk(child, `${at}.${field}`);
    walk(node.items, `${at}[]`);
    if (typeof node.additionalProperties === 'object') walk(node.additionalProperties, `${at}{}`);
  };
  walk(schema, 'body');
  return problems;
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

/**
 * An edit overwrites only the fields it is given. A `default` in its arguments
 * says the opposite — that a field left out is set to that value — and a model
 * reading it may send the value to "keep" a setting, or trust that leaving the
 * field out resets it. Defaults belong to the models that create a record.
 */
function editDefaults(name: string, schema: JsonSchema): string[] {
  const problems: string[] = [];
  const walk = (node: JsonSchema | undefined, at: string): void => {
    if (!node || typeof node !== 'object') return;
    if (node.default !== undefined) problems.push(`${name}: edits only what it is given, and ${at} declares a default`);
    for (const [field, inner] of Object.entries(node.properties ?? {})) walk(inner, at ? `${at}.${field}` : field);
    walk(node.items, `${at}[]`);
  };
  walk(schema, '');
  return problems;
}

interface BuiltTool {
  name: string;
  title: string;
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
  /** What the arguments could not be built as declared. */
  problems: string[];
  /** The spec's words of each argument that prose follows. */
  specWords: Record<string, string>;
  outputSchema: JsonSchema | null;
  /** The entity a successful answer carries, when the spec names one. */
  entity: string | null;
  /** The free text of the answer, by who wrote it (`textPaths`). */
  text: TextPaths;
}

/**
 * Sentences written for someone assembling an HTTP request, not for a model
 * calling a tool. The server does what they describe; a model reading them pays
 * for words about plumbing it never touches. Each pattern has to cut something
 * the spec still says, or the build fails: a pattern the spec has outgrown only
 * looks like protection, and the leftover check below catches a new wording.
 */
const HTTP_ONLY_SENTENCES = [
  // A redirect is not followed (`RESPONSE_FORMAT.redirect`), by any client.
  /Most HTTP clients [^.]*\./g,
];
/**
 * Sentences written for an HTTP client that still carry a fact, said the way an
 * MCP answer works. Cutting them lost the fact with the phrasing — that the link
 * an export answers with is temporary — and prose had to say the rest again.
 * Each one has to rewrite something, the same as above.
 */
const HTTP_REWRITES: Array<[RegExp, string]> = [
  // How long the link lives the spec says in a sentence of its own.
  [/In response to the request the server returns `302 Found` with a `Location` header containing ([^.]*)\./g, 'The answer is $1.'],
  // Where a field sits in the HTTP body is the client's business; the tool takes
  // an argument, and the fact worth keeping is that the preview needs asking for.
  [/ at the root of the request body\./g, '.'],
  // The server sends the preference with every call (`request.headers`), so a
  // model always gets the identifier: the header and the empty 204 are plumbing.
  [
    /With the `Prefer: return=representation` header the response comes with status `202` and the export identifier in `data\.id`\. Without the header the response is empty, with status `204`\./g,
    'The answer carries the export identifier in `data.id`.',
  ],
  // An avatar is an argument here, bytes or a link; how the file travels is the
  // server's business, and the fact worth keeping is what comes back.
  [
    /The file is sent in\s+`multipart\/form-data`\s+format, and the response contains only a link to the new image\./g,
    'The answer contains only a link to the new image.',
  ],
  // The answer of a download is the file itself (`binary_body`), not an HTTP body
  // with a header: the name rides in the structured half.
  [/The response is the body of the file and a\s+`Content-Disposition`\s+header with its name, not\s+`JSON`\.\s*/g, ''],
  // The wait is in a header a model never sees; the server names it in the refusal.
  [
    /responds\s+`429`,\s+and the\s+`Retry-After`\s+header carries the pause before the next attempt\./g,
    'responds `429` and says how long to wait before the next attempt.',
  ],
  // An empty body comes back wrapped (`RESPONSE_FORMAT.structured_content`), so
  // what a model reads is `data` and nothing else.
  [/the method returns\s+`200`\s+and\s+`null`\s+in the response body\s+—\s+with no wrapper object\./g, '`data` comes back as `null`.'],
];
/** How often each pattern above changed a description — a pattern that never does fails the build. */
const HTTP_HITS = new Map<RegExp, number>();

// A webhook has a `URL` of its own, so only the plumbing phrasings count.
const HTTP_LEFTOVER =
  /request `URL`|in the `URL`|request body|`302 Found`|`Location` header|use it in the request|`multipart\/form-data`|`Content-Disposition`|`Retry-After` header|not `JSON`|`Prefer:|HTTP client|status `204`|no wrapper object|\]\((?:GET|POST|PUT|PATCH|DELETE) /;

const DOCS_CONTENT = path.join(HERE, '..', '..', '..', 'apps', 'docs', 'content');

/** The source file of a documentation page, if it has one. The source decides, not the built site. */
const sourceOf = (page: string): string | null =>
  ['.mdx', '.md'].map((ext) => path.join(DOCS_CONTENT, `${page.replace(/^\//, '')}${ext}`)).find((file) => fs.existsSync(file)) ?? null;

/** Whether the documentation has a page at this path. */
const hasSource = (page: string): boolean => sourceOf(page) !== null;

/**
 * The anchors a page has: its headings, slugged the way the site slugs them
 * (`toSlug`) and cleaned of markup the way the site's own anchor check cleans it.
 */
function anchorsOf(page: string): Set<string> {
  const file = sourceOf(page);
  if (!file) return new Set();
  const body = fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  return new Set(
    [...body.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) =>
      toSlug(
        m[1]!
          .replace(/`([^`]*)`/g, '$1')
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
          .replace(/[*_]/g, '')
          .trim(),
      ),
    ),
  );
}

/**
 * Where a documentation page lives now.
 *
 * Pages move, and the site keeps the old address alive with a redirect. The
 * spec may still link the old address, and that link works for a person with a
 * browser — so it must not break this build either. The redirects of the site
 * are followed to the page that has a source, or out of the site when the page
 * went elsewhere. `null` means the address leads nowhere at all.
 */
function pageNow(page: string): string | null {
  let at = page;
  for (let hop = 0; hop < 5; hop++) {
    if (hasSource(at)) return at;
    const next = siteRedirects.find((r) => r.source === at)?.destination;
    if (!next) return null;
    if (/^https?:/.test(next)) return next;
    at = next;
  }
  return null;
}

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
    .replace(/\[([^\]]+)\]\((GET|POST|PUT|PATCH|DELETE) ([^)]+)\)/g, (_all, label: string, method: string, path: string) => {
      const tool = TOOL_BY_KEY.get(`${method} ${path}`);
      return tool ? `\`${tool}\`` : label;
    })
    // A guide is a page on the site. The title stays in quotes to say what the page
    // is, and the address follows it: the model cannot open it, but the person it
    // answers can. The address is the one the page has now — a page that moved is
    // named where it went, not where the spec last saw it — and it keeps the
    // section it pointed at, which on a long page is the point of the link.
    .replace(/\[([^\]]+)\]\((\/[^)#\s]+)(#[^)\s]*)?\)/g, (_all, label: string, page: string, anchor?: string) => {
      const now = pageNow(page) ?? page;
      const where = /^https?:/.test(now) ? now : `${SERVER_INFO.website_url}${now}${anchor ?? ''}`;
      return `"${label}" (${where})`;
    });
}

/** The title line of an operation, for a client to show instead of the name. */
function specTitle(op: Operation): string {
  const one = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();
  const summary = one(op.nodeEn?.summary);
  const head = one(String(op.nodeEn?.description ?? '').split(/\n\s*\n/)[0]);
  return (summary || head).replace(/[.!?]$/, '');
}

/**
 * Markdown of the spec as plain text a model reads: a list keeps one item a line,
 * everything else runs on as one paragraph, and bold marks go. Collapsing every
 * line break glued «**Reaction limits:** - Each user … - A message …» into one
 * sentence with dashes and asterisks in it.
 */
function plain(text: string): string {
  const out: string[] = [];
  let run: string[] = [];
  const flush = (): void => {
    const joined = run.join(' ').replace(/\s+/g, ' ').trim();
    const last = out[out.length - 1];
    // A paragraph runs on after a paragraph, and starts a line of its own after a list.
    if (joined) out.push(last === undefined ? joined : last.trimStart().startsWith('- ') ? `\n${joined}` : ` ${joined}`);
    run = [];
  };
  for (const line of text.replace(/\*\*([^*]+)\*\*/g, '$1').split('\n')) {
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (!item) {
      run.push(line);
      continue;
    }
    flush();
    out.push(`\n- ${item[1]!.replace(/\s+/g, ' ').trim()}`);
  }
  flush();
  return out.join('').trim();
}

/**
 * What the spec says about an operation, as one paragraph.
 *
 * The spec gives no `summary`: its description opens with a title line, then a
 * blank line, then the text — «List chats\n\nRetrieve a list of chats…».
 * Collapsing the whitespace glued the two into «List chats Retrieve a list», so
 * the title is separated as a sentence of its own before anything else.
 */
function specText(op: Operation): string {
  const one = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();
  const summary = one(op.nodeEn?.summary);
  const linked = linksAsTools(String(op.nodeEn?.description ?? ''));
  const applied = (text: string, pattern: RegExp, to: string): string => {
    const next = text.replace(pattern, to);
    if (next !== text) HTTP_HITS.set(pattern, (HTTP_HITS.get(pattern) ?? 0) + 1);
    return next;
  };
  const rewritten = HTTP_REWRITES.reduce((text, [pattern, to]) => applied(text, pattern, to), linked);
  const raw = HTTP_ONLY_SENTENCES.reduce((text, pattern) => applied(text, pattern, ''), rewritten);
  const [head, ...rest] = raw.split(/\n\s*\n/);
  const title = summary || one(head);
  const body = plain(summary ? raw : rest.join('\n\n'));
  if (!title) return body;
  if (!body) return sentence(title);
  return `${sentence(title)} ${body}`;
}

/**
 * The description a model reads: what the spec says about the operation, then
 * whatever prose adds, and for a tool whose answer can carry a whole secret the
 * note on where it may go (`SECRET_NOTE`), before the lines of when to use it
 * and what it is not for.
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
function describe(op: Operation, secret: boolean): string {
  const prose = MCP_TOOL_PROSE[op.name];
  const fromSpec = specText(op);
  const said = [fromSpec, prose?.description, secret ? SECRET_NOTE : ''].filter(Boolean).join(' ');
  const parts = [said];
  if (prose?.whenToUse?.length) parts.push(`\n\nUse it when:\n${prose.whenToUse.map((l) => `- ${l}`).join('\n')}`);
  if (prose?.notFor?.length) parts.push(`\n\nNot for:\n${prose.notFor.map((l) => `- ${l}`).join('\n')}`);
  return parts.join('');
}

/**
 * A validator the way a client builds one: JSON Schema 2020-12 with formats, as
 * the MCP TypeScript SDK checks a structured answer, lenient about keywords it
 * does not know so a description-only keyword is not an error.
 */
function validator(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  // ajv-formats is typed against its own copy of ajv; the instance is the same kind.
  addFormats(ajv as unknown as Parameters<typeof addFormats>[0]);
  return ajv;
}

/**
 * The manifest against its own schema, by a real validator: types, enums,
 * patterns, closed objects and the variants of an effect, at every depth. The
 * schema is the contract a consumer checks before it boots, so a field dropped
 * from the manifest or one the contract never described fails here first.
 */
function checkAgainstSchema(manifest: Record<string, unknown>): string[] {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const validate = validator().compile(schema);
  if (validate(manifest)) return [];
  return (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}${e.params ? ` ${JSON.stringify(e.params)}` : ''}`);
}

/** A copy of a value, deep enough for JSON. */
const copy = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

/**
 * One value of a schema, for the checks that hold an answer against the tool's
 * outputSchema: the spec's own example where it gives one, else the examples of
 * its fields, else a value of the declared type.
 */
function exampleOf(schema: any, doc: YamlNode, depth = 0): unknown {
  const source = flatten(schema, doc);
  if (!source || depth > 10) return null;
  if (source.example !== undefined) return copy(source.example);
  const variants = source.anyOf ?? source.oneOf;
  if (!source.type && Array.isArray(variants)) return exampleOf(variants[0], doc, depth + 1);
  switch (source.type) {
    case 'array':
      return [exampleOf(source.items, doc, depth + 1)];
    case 'object': {
      const out: Record<string, unknown> = {};
      for (const [name, child] of Object.entries<any>(source.properties ?? {})) out[name] = exampleOf(child, doc, depth + 1);
      if (!source.properties && typeof source.additionalProperties === 'object') {
        out.key = exampleOf(source.additionalProperties, doc, depth + 1);
      }
      return out;
    }
    case 'integer':
      return source.enum?.[0] ?? 1;
    case 'number':
      return source.enum?.[0] ?? 1.5;
    case 'boolean':
      return true;
    default:
      return source.enum?.[0] ?? (source.format === 'date-time' ? '2024-01-15T07:30:00.000Z' : 'text');
  }
}

/**
 * A record cut to its card, the way `COMPACT_PROJECTIONS` says a runtime cuts
 * it: a name keeps that field; a dotted name keeps that part of a nested object,
 * of every item where the object is a list; a parent that is null or absent
 * stays as it is.
 */
function project(record: unknown, card: string[]): unknown {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const heads = new Map<string, string[]>();
  for (const name of card) {
    const [head, ...rest] = name.split('.');
    heads.set(head!, [...(heads.get(head!) ?? []), ...(rest.length ? [rest.join('.')] : [''])]);
  }
  const out: Record<string, unknown> = {};
  for (const [head, tails] of heads) {
    if (!(head in (record as Record<string, unknown>))) continue;
    const value = (record as Record<string, unknown>)[head];
    if (tails.includes('') || value === null || typeof value !== 'object') out[head] = value;
    else out[head] = Array.isArray(value) ? value.map((item) => project(item, tails)) : project(value, tails);
  }
  return out;
}

/**
 * A record without the fields `SINGLE_READ_OMIT` names, the way a runtime keeps
 * them out of a single read: a dotted name removes that part of a nested object,
 * of every item where the object is a list, and a parent that is null stays null.
 */
function omit(record: unknown, names: string[]): unknown {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const out: Record<string, unknown> = { ...(record as Record<string, unknown>) };
  const deeper = new Map<string, string[]>();
  for (const name of names) {
    const [head, ...rest] = name.split('.');
    if (!rest.length) delete out[head!];
    else deeper.set(head!, [...(deeper.get(head!) ?? []), rest.join('.')]);
  }
  for (const [head, tails] of deeper) {
    const value = out[head];
    if (value === null || typeof value !== 'object') continue;
    out[head] = Array.isArray(value) ? value.map((item) => omit(item, tails)) : omit(value, tails);
  }
  return out;
}

/** An answer body with each record of `data` passed through `cut`. */
function withRecords(body: unknown, cut: (record: unknown) => unknown): unknown {
  if (!body || typeof body !== 'object' || !('data' in (body as Record<string, unknown>))) return body;
  const data = (body as Record<string, unknown>).data;
  return { ...(body as Record<string, unknown>), data: Array.isArray(data) ? data.map(cut) : cut(data) };
}

/** Every description in a schema, down to the items of a list and the values of a map. */
const readSchemaText = (schema: any): string[] =>
  !schema || typeof schema !== 'object'
    ? []
    : [
        ...(typeof schema.description === 'string' ? [schema.description] : []),
        ...Object.values<any>(schema.properties ?? {}).flatMap(readSchemaText),
        ...(schema.items ? readSchemaText(schema.items) : []),
        ...(typeof schema.additionalProperties === 'object' ? readSchemaText(schema.additionalProperties) : []),
      ];

function build(): void {
  const docEn = yaml.load(fs.readFileSync(SPEC_EN_PATH, 'utf8')) as YamlNode;
  const problems: string[] = [...specShapeProblems(docEn), ...queryListProblems(docEn)];
  const oauthFlow: OperationKey[] = [];
  const operations = readOperations(problems, oauthFlow);
  const byKey = new Map(operations.map((o) => [o.key, o]));

  // A hand table keyed by an operation the spec no longer has is a rule that
  // silently stopped applying: a renamed path would lose its name, the reason a
  // write only adds, an upload — and nothing would say so.
  const stale = (table: string, k: OperationKey): void => {
    if (!byKey.has(k)) problems.push(`${table} names ${k}, which is not an operation of the spec`);
  };
  for (const k of Object.keys(NAME_OVERRIDES)) {
    stale('NAME_OVERRIDES', k);
    if (k in CHAIN_STEPS) problems.push(`NAME_OVERRIDES names ${k}, which is a chain step and no tool`);
  }
  for (const k of Object.keys(ADDITIVE)) {
    stale('ADDITIVE', k);
    if (byKey.get(k)?.kind === 'read') problems.push(`ADDITIVE names ${k}, which is a read`);
    if (!ADDITIVE[k]!.trim()) problems.push(`ADDITIVE names ${k} without saying why it only adds`);
  }
  for (const k of Object.keys(UPLOAD_LIFTS)) stale('UPLOAD_LIFTS', k);
  for (const k of Object.keys(UPLOAD_UNAVAILABLE)) stale('UPLOAD_UNAVAILABLE', k);
  stale('DRAFT_CLEANUP.host', DRAFT_CLEANUP.host);
  stale('DRAFT_CLEANUP.operation', DRAFT_CLEANUP.operation);
  for (const { host, reason } of [...ACCESS_EXCEPTIONS, ...DESTRUCTIVE_EFFECTS]) {
    if (!SERVICE_TOOLS.some((t) => t.name === host)) stale('an exception', host);
    if (!reason.trim()) problems.push(`an exception for ${host} gives no reason`);
  }

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
      const output = outputSchema(op, docEn);
      const text = answerTextPaths(op, output, docEn);
      return {
        name: op.name,
        title: specTitle(op),
        operation: op.key,
        kind: op.kind,
        scope: op.scope,
        plan: op.plan,
        roles: op.roles,
        botTokenOnly: op.botTokenOnly,
        description: describe(op, text.secrets.length > 0),
        annotations: annotations(op),
        inputSchema: input.schema,
        request: input.request,
        clashes: input.clashes,
        problems: input.problems,
        specWords: input.specWords,
        outputSchema: output,
        entity: responseEntity(op, docEn),
        text,
      };
    });

  // An operation a tool runs besides its own brings its scope, read from the
  // spec: the upload steps of a lifted field, the same way as for a message's
  // files, and the operation a declared effect runs — a token that may send a
  // message but not delete a draft is refused before the send rather than left
  // with a draft it cannot clear.
  for (const tool of tools) {
    for (const place of Object.values(tool.request.arguments)) {
      if (place.in === 'upload' && place.item === 'key') {
        for (const stepKey of place.operations ?? []) {
          const step = byKey.get(stepKey);
          if (step?.scope && !place.scopes!.includes(step.scope)) place.scopes!.push(step.scope);
        }
      }
      if (place.effect?.kind === 'after') {
        const after = byKey.get(place.effect.operation);
        if (after?.scope && !place.effect.scopes.includes(after.scope)) place.effect.scopes.push(after.scope);
      }
    }
  }

  // ── Access ───────────────────────────────────────────────────────────────
  // An operation a tool runs besides its own keeps its access, all of it: roles,
  // plan and the bot-only mark. The upload steps inside sending a message once
  // reached the manifest as an argument and nothing else — the tool said
  // messages:create, the upload needs uploads:write, and a token without it would
  // see the tool and fail halfway through a send. One comparison serves every
  // such operation: a chain step, the steps of a lifted upload, the operation of
  // an effect, a call of a service tool. Stricter than the tool fails the build
  // unless `ACCESS_EXCEPTIONS` says why the argument may still be shown.
  const exceptionUsed = new Set<number>();
  const compareAccess = (
    host: { name: string; key: string; roles: Role[]; plan: string | null; botTokenOnly: boolean },
    inner: Operation,
    argument: string,
  ): void => {
    const barred = host.roles.filter((role) => !inner.roles.includes(role));
    const excused = new Set<string>();
    ACCESS_EXCEPTIONS.forEach((exception, i) => {
      if (exception.host !== host.key || exception.argument !== argument) return;
      for (const role of exception.roles) {
        if (barred.includes(role as Role)) {
          excused.add(role);
          exceptionUsed.add(i);
        }
      }
    });
    const left = barred.filter((role) => !excused.has(role));
    if (left.length) {
      problems.push(
        `${host.name} is listed for ${left.join(', ')}, and ${inner.key}, which it runs for ${argument}, is closed to them — ` +
          'open the operation or say why in ACCESS_EXCEPTIONS',
      );
    }
    if (inner.plan && inner.plan !== host.plan) problems.push(`${inner.key} needs the ${inner.plan} plan, and ${host.name}, which runs it for ${argument}, does not`);
    if (inner.botTokenOnly && !host.botTokenOnly) problems.push(`${inner.key} takes a bot token, and ${host.name}, which runs it for ${argument}, does not`);
  };
  for (const tool of tools) {
    const host = { name: tool.name, key: tool.operation, roles: tool.roles, plan: tool.plan, botTokenOnly: tool.botTokenOnly };
    for (const [name, place] of Object.entries(tool.request.arguments)) {
      for (const stepKey of place.in === 'upload' ? (place.operations ?? []) : []) {
        const step = byKey.get(stepKey);
        if (step) compareAccess(host, step, name);
        else problems.push(`${tool.name} uploads ${name} through ${stepKey}, which is not an operation of the spec`);
      }
      if (place.effect?.kind === 'after') {
        const after = byKey.get(place.effect.operation);
        if (after) compareAccess(host, after, name);
      }
    }
  }
  // A service tool is offered to every token, so what it calls has to answer
  // every token too; the scopes it needs are read from the same operations.
  const serviceScopes = new Map<string, string[]>();
  for (const service of SERVICE_TOOLS) {
    const scopes: string[] = [];
    const host = { name: service.name, key: service.name, roles: [...ALL_ROLES], plan: null, botTokenOnly: false };
    for (const operation of service.operations) {
      const op = byKey.get(operation);
      if (!op) problems.push(`service tool ${service.name} calls ${operation}, which is not an operation of the spec`);
      else if (op.key in CHAIN_STEPS) problems.push(`service tool ${service.name} calls ${operation}, which is a chain step`);
      else {
        compareAccess(host, op, 'operations');
        if (op.scope && !scopes.includes(op.scope)) scopes.push(op.scope);
      }
    }
    serviceScopes.set(service.name, scopes);
  }
  ACCESS_EXCEPTIONS.forEach((exception, i) => {
    if (!exceptionUsed.has(i)) {
      problems.push(`ACCESS_EXCEPTIONS excuses ${exception.roles.join(', ')} on ${exception.host} ${exception.argument}, and nothing there is closed to them`);
    }
  });

  // A write that is not marked destructive must not run a destructive operation
  // by way of an argument either, unless `DESTRUCTIVE_EFFECTS` says why: the flag
  // a client groups by speaks for the tool's own operation only.
  const destructive = (op: Operation | undefined): boolean => op?.kind === 'write' && !(op.key in ADDITIVE);
  const effectUsed = new Set<number>();
  for (const tool of tools) {
    for (const [name, place] of Object.entries(tool.request.arguments)) {
      if (place.effect?.kind !== 'after' || tool.annotations.destructiveHint || !destructive(byKey.get(place.effect.operation))) continue;
      const i = DESTRUCTIVE_EFFECTS.findIndex((e) => e.host === tool.operation && e.argument === name);
      if (i < 0) {
        problems.push(`${tool.name} runs ${place.effect.operation}, a destructive operation, for ${name} — say why in DESTRUCTIVE_EFFECTS or mark the tool`);
      } else {
        effectUsed.add(i);
      }
    }
  }
  DESTRUCTIVE_EFFECTS.forEach((e, i) => {
    if (!effectUsed.has(i)) problems.push(`DESTRUCTIVE_EFFECTS names ${e.host} ${e.argument}, which runs nothing destructive in a tool not marked so`);
  });

  // ── Checks ───────────────────────────────────────────────────────────────
  // Every name of the set reads as a name in prose: a verb the pattern does not
  // know would hide the tool from every check that hunts for dangling names.
  const wholeName = new RegExp(`^${TOOL_NAME_IN_PROSE.source}$`);
  const seen = new Set<string>();
  for (const tool of tools) {
    if (seen.has(tool.name)) {
      const both = tools.filter((t) => t.name === tool.name).map((t) => t.operation);
      problems.push(`two operations produce the same name ${tool.name}: ${both.join(', ')}`);
    }
    seen.add(tool.name);
    if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) problems.push(`${tool.name} is not snake_case`);
    if (`${TOOL_PREFIX}${tool.name}`.length > 64) problems.push(`${tool.name} is longer than 64 characters`);
    if (!wholeName.test(tool.name)) problems.push(`${tool.name}: its verb is unknown to TOOL_NAME_IN_PROSE, so no check would see the name in prose`);
    if (!tool.description) problems.push(`${tool.name} has no description`);
    if (!tool.title) problems.push(`${tool.name} has no title`);
    problems.push(...tool.problems);
    problems.push(...lintSchema(tool.name, tool.inputSchema));
    if (/^(PUT|PATCH) /.test(tool.operation)) problems.push(...editDefaults(tool.name, tool.inputSchema));
    if (tool.outputSchema) problems.push(...lintSchema(`${tool.name} answer`, tool.outputSchema), ...outputKeywords(tool.name, tool.outputSchema));
  }
  for (const service of SERVICE_TOOLS.filter((t) => !t.compat)) {
    if (!wholeName.test(service.name)) problems.push(`service tool ${service.name}: its verb is unknown to TOOL_NAME_IN_PROSE`);
  }

  // Everything the API takes and gives has to reach the tool. The arguments are
  // rebuilt from flat names into a request, so every name needs exactly one
  // place in it; and a field the spec has but the tool's schema lost — cut by
  // the nesting limit, hidden in a union, shadowed by a namesake — is a field no
  // model can send or read, which nothing downstream would notice. An upload
  // argument keeps the spec's words, its limits and every field of a file, the
  // key included; only the size is the server's to fill.
  const lostFileFields = (tool: BuiltTool, at: string, files: any, argument: string): string[] => {
    const spec = specResolve(files, docEn);
    const built = tool.inputSchema.properties?.[argument];
    const lost: string[] = [];
    const said = linksAsTools(String(spec?.description ?? '')).replace(/\s+/g, ' ').trim().replace(/[.!?]$/, '');
    if (said && !String(built?.description ?? '').includes(said)) lost.push(`${tool.name}: ${argument} lost the spec's words for ${at}`);
    for (const k of ['maxItems', 'minItems']) {
      if (spec?.[k] !== built?.[k]) lost.push(`${tool.name}: ${argument} has ${k} ${built?.[k]}, and the spec ${spec?.[k]}`);
    }
    for (const [field, raw] of Object.entries<any>(specResolve(spec?.items, docEn)?.properties ?? {})) {
      if (field === 'size') continue;
      lost.push(...lostFields(tool.name, `${at}[].${field}`, raw, built?.items?.properties?.[field], docEn, 'input'));
    }
    return lost;
  };
  for (const tool of tools) {
    for (const clash of tool.clashes) problems.push(`${tool.name}: two places of the request are both named ${clash}`);
    // A runtime builds the query from the map alone, so a list there without its
    // form would go out in whatever shape the runtime guesses.
    for (const [name, place] of Object.entries(tool.request.arguments)) {
      const schema = tool.inputSchema.properties?.[name];
      if (place.in === 'query' && schema && isList(schema) && !place.array) {
        problems.push(`${tool.name}: the query list ${name} has no array form in the request map`);
      }
      if (place.array && !(place.in === 'query' && schema && isList(schema))) {
        problems.push(`${tool.name}: ${name} has an array form, and it is no list in the query`);
      }
    }
    const names = Object.keys(tool.inputSchema.properties ?? {});
    const placed = Object.keys(tool.request.arguments);
    for (const name of names.filter((n) => !placed.includes(n))) problems.push(`${tool.name}: argument ${name} has no place in the request`);
    for (const name of placed.filter((n) => !names.includes(n))) problems.push(`${tool.name}: the request places ${name}, which the schema does not have`);
    const op = byKey.get(tool.operation)!;
    // Every part of the path is an argument that goes into the path.
    for (const [, part] of op.path.matchAll(/\{([^}]+)\}/g)) {
      if (tool.request.arguments[part!]?.in !== 'path') problems.push(`${tool.name}: {${part}} of the path is no path argument`);
    }
    const expected = new Set<string>();
    for (const raw of paramsOf(op.nodeEn)) {
      const param = flatten(raw, docEn);
      // A header is the server's to send, not the model's to pass.
      if (param.in === 'header') {
        if (tool.request.headers?.[param.name] === undefined) problems.push(`${tool.name}: the header ${param.name} is not sent`);
        continue;
      }
      if (param.required) expected.add(param.name);
      problems.push(...lostFields(tool.name, param.name, param.schema, tool.inputSchema.properties?.[param.name], docEn, 'input'));
    }
    const body = specResolve(requestBodySchema(op), docEn);
    const bodyRequired: string[] = body?.required ?? [];
    for (const [name, raw] of Object.entries<any>(body?.properties ?? {})) {
      const placed = Object.entries(tool.request.arguments);
      const place = placed.find(([, p]) => p.at === name) ?? placed.find(([, p]) => p.at?.startsWith(`${name}.`));
      if (!place) {
        problems.push(`${tool.name}: the body field ${name} reaches no argument`);
        continue;
      }
      if (place[1].in === 'upload') {
        problems.push(...lostFileFields(tool, name, raw, place[0]));
        if (bodyRequired.includes(name)) expected.add(place[0]);
        continue;
      }
      if (place[1].at === name) {
        if (bodyRequired.includes(name)) expected.add(place[0]);
        // A field lifted out to an upload of its own (`UPLOAD_LIFTS`) is checked
        // as that upload, not as a part of the object it left.
        const lifted = placed.filter(([, p]) => p.in === 'upload' && p.at?.startsWith(`${name}.`));
        const resolved = specResolve(raw, docEn);
        const left = (inner: string): boolean => !lifted.some(([, p]) => p.at === `${name}.${inner}`);
        const rest =
          lifted.length && resolved?.properties
            ? {
                ...resolved,
                properties: Object.fromEntries(Object.entries<any>(resolved.properties).filter(([inner]) => left(inner))),
                ...(resolved.required ? { required: resolved.required.filter(left) } : {}),
              }
            : raw;
        problems.push(...lostFields(tool.name, name, rest, tool.inputSchema.properties?.[place[0]], docEn, 'input'));
        for (const [argument, p] of lifted) {
          const inner = p.at!.slice(name.length + 1);
          const field = specResolve(resolved?.properties?.[inner], docEn);
          if (!field) {
            problems.push(`${tool.name}: ${argument} is lifted from ${p.at}, which the spec does not have`);
            continue;
          }
          const built = tool.inputSchema.properties?.[argument];
          for (const k of ['maxItems', 'minItems']) {
            if (field[k] !== built?.[k]) problems.push(`${tool.name}: ${argument} has ${k} ${built?.[k]}, and the spec ${field[k]}`);
          }
          // Every word of the spec but the rewritten clause, before it and after it,
          // with links read the way `property` reads them.
          const said = linksAsTools(String(field.description ?? '')).replace(/\s+/g, ' ').trim();
          const clause = said.match(LIFT_KEYS_CLAUSE);
          const halves = clause ? [said.slice(0, clause.index), said.slice(clause.index! + clause[0].length)] : [said];
          for (const half of halves.map((h) => h.trim()).filter(Boolean)) {
            if (!String(built?.description ?? '').includes(half)) problems.push(`${tool.name}: ${argument} lost the spec's words for ${p.at}: «${half}»`);
          }
        }
      } else {
        const wrapper = specResolve(raw, docEn);
        for (const [inner, innerRaw] of Object.entries<any>(wrapper?.properties ?? {})) {
          const arg = Object.entries(tool.request.arguments).find(([, p]) => p.at === `${name}.${inner}`);
          if (!arg) {
            problems.push(`${tool.name}: the body field ${name}.${inner} reaches no argument`);
            continue;
          }
          if (bodyRequired.includes(name) && (wrapper.required ?? []).includes(inner)) expected.add(arg[0]);
          if (arg[1].in === 'upload') problems.push(...lostFileFields(tool, `${name}.${inner}`, innerRaw, arg[0]));
          else problems.push(...lostFields(tool.name, `${name}.${inner}`, innerRaw, tool.inputSchema.properties?.[arg[0]], docEn, 'input'));
        }
      }
    }
    // What the API requires, the tool requires, and nothing more — except a file
    // that a link may stand in for, where one of the two is enough.
    for (const place of Object.values(tool.request.arguments)) if (place.effect?.kind === 'download') expected.delete(place.effect.into);
    const required = new Set(tool.inputSchema.required ?? []);
    for (const name of expected) if (!required.has(name)) problems.push(`${tool.name}: ${name} is required by the spec and not by the tool`);
    for (const name of required) if (!expected.has(name)) problems.push(`${tool.name}: ${name} is required by the tool and not by the spec`);
    const answered = ANSWER_CODES.some((code) => op.nodeEn?.responses?.[code]?.content?.['application/json']);
    if (answered && !tool.outputSchema) problems.push(`${tool.name} answers with a body and declares no outputSchema`);
    const redirects = Object.entries<any>(op.nodeEn?.responses ?? {}).some(([code]) => /^3/.test(code));
    if (redirects && !tool.outputSchema?.properties?.url) problems.push(`${tool.name} answers with a redirect and declares no url to hand back`);
    const otherBodies = Object.entries<any>(op.nodeEn?.responses ?? {}).filter(
      ([code, r]) => /^2/.test(code) && Object.keys(r?.content ?? {}).some((type) => type !== 'application/json'),
    );
    for (const [code] of otherBodies) {
      if (tool.outputSchema?.properties?.mime_type && tool.outputSchema?.properties?.size) continue;
      problems.push(`${tool.name} answers ${code} with a body that is not JSON and does not describe the file it hands back`);
    }
    for (const code of ANSWER_CODES) {
      const answer = op.nodeEn?.responses?.[code]?.content?.['application/json']?.schema;
      if (answer && tool.outputSchema) {
        // A null body is answered as data: null, checked on data rather than on the root.
        const resolved = specResolve(answer, docEn);
        if (resolved?.nullable && ![tool.outputSchema.properties?.data?.type].flat().includes('null')) {
          problems.push(`${tool.name} answer: the body can be null and data does not allow it`);
        }
        problems.push(...lostFields(`${tool.name} answer`, 'body', { ...resolved, nullable: false }, tool.outputSchema, docEn, 'output'));
        break;
      }
    }
  }

  // A field whose words send a model to an upload step it has no tool for — «the
  // key from Upload file» — is a dead end. Every such field is filled by an
  // upload of the tool or declared in `UPLOAD_UNAVAILABLE`; the link is looked
  // for in the spec's words, before it is turned into the bare name of the step.
  const stepLink = new RegExp(`\\]\\((?:${UPLOAD_STEPS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\)`);
  for (const tool of tools) {
    const op = byKey.get(tool.operation)!;
    const bases = [
      ...Object.values(tool.request.arguments).filter((p) => p.in === 'upload').map((p) => p.at!),
      ...(UPLOAD_UNAVAILABLE[op.key] ?? []).map((u) => u.at),
    ];
    const covered = (at: string): boolean => bases.some((base) => at === base || at.startsWith(`${base}.`) || at.startsWith(`${base}[`));
    const walk = (node: any, at: string, depth = 0): void => {
      if (!node || typeof node !== 'object' || depth > 12) return;
      const resolved = specResolve(node, docEn);
      const words = [node.description, resolved?.description].filter((d) => typeof d === 'string').join(' ');
      if (stepLink.test(words) && !covered(at)) {
        problems.push(`${tool.name}: ${at} takes a key from an upload step, and no upload of the tool fills it — lift it, or declare it in UPLOAD_UNAVAILABLE`);
      }
      for (const variant of resolved?.anyOf ?? resolved?.oneOf ?? []) walk(variant, at, depth + 1);
      if (resolved?.items) walk(resolved.items, `${at}[]`, depth + 1);
      for (const [name, child] of Object.entries<any>(resolved?.properties ?? {})) walk(child, at ? `${at}.${name}` : name, depth + 1);
      if (resolved?.additionalProperties && typeof resolved.additionalProperties === 'object') walk(resolved.additionalProperties, `${at}.{}`, depth + 1);
    };
    for (const param of paramsOf(op.nodeEn)) walk({ ...param.schema, description: param.description }, param.name);
    walk(requestBodySchema(op), '');
  }
  if (fileNameRewrites === 0) problems.push('FILE_NAME_REWRITE found nothing to rewrite in the name of an uploaded file — drop it or follow the new wording');

  // ── Cards, single reads and authors ──────────────────────────────────────
  const modelOf = (entity: string): any => specResolve(docEn.components?.schemas?.[entity], docEn);
  const isListAnswer = (tool: BuiltTool): boolean => [tool.outputSchema?.properties?.data?.type].flat().includes('array');
  /** Whether a dotted name reaches a field of the model, through nested objects and the items of lists. */
  const fieldExists = (model: any, name: string): boolean => {
    let node: any = { properties: model?.properties };
    for (const step of name.split('.')) {
      const field = specResolve(node?.properties?.[step], docEn);
      if (!field) return false;
      node = field.type === 'array' ? specResolve(field.items, docEn) : field;
    }
    return true;
  };

  // A compact card names fields of an entity, and every field the entity has is
  // either in the card or left out with a reason (`COMPACT_OMIT`). A field the API
  // no longer has would silently vanish from the card, and one it adds would
  // silently miss the default answer; neither passes here.
  for (const [entity, card] of Object.entries(COMPACT_PROJECTIONS)) {
    const model = modelOf(entity);
    if (!model?.properties) {
      problems.push(`compact card for ${entity}, which is not a schema of the spec`);
      continue;
    }
    const container = (head: string): any => {
      const field = specResolve(model.properties[head], docEn);
      return field?.type === 'array' ? specResolve(field.items, docEn) : field;
    };
    const omitted = new Map<string, string>();
    for (const { fields, why } of COMPACT_OMIT[entity] ?? []) {
      if (!why.trim()) problems.push(`COMPACT_OMIT leaves ${fields.join(', ')} out of ${entity} without a reason`);
      for (const name of fields) {
        if (omitted.has(name) || card.includes(name)) problems.push(`${entity}.${name} is both kept and left out, or left out twice`);
        omitted.set(name, why);
      }
    }
    for (const name of card) if (!fieldExists(model, name)) problems.push(`compact card for ${entity} names ${name}, which the schema does not have`);
    for (const name of omitted.keys()) if (!fieldExists(model, name)) problems.push(`COMPACT_OMIT leaves ${name} out of ${entity}, which the schema does not have`);
    for (const head of Object.keys(model.properties)) {
      if (card.includes(head) || omitted.has(head)) continue;
      if (!card.some((name) => name.startsWith(`${head}.`))) {
        problems.push(`${entity}.${head} is neither in its compact card nor in COMPACT_OMIT`);
        continue;
      }
      for (const sub of Object.keys(container(head)?.properties ?? {})) {
        const name = `${head}.${sub}`;
        if (!card.includes(name) && !omitted.has(name)) problems.push(`${entity}.${name} is neither in its compact card nor in COMPACT_OMIT`);
      }
    }
    if (Object.keys(model.properties).every((head) => card.includes(head))) {
      problems.push(`the compact card for ${entity} keeps every field of the record — drop it, and its reads return the record whole`);
    }
    if (!tools.some((t) => t.entity === entity && t.kind === 'read' && isListAnswer(t))) {
      problems.push(`compact card for ${entity}, which no list or search answers with — a single read answers whole`);
    }
  }
  for (const entity of Object.keys(COMPACT_OMIT)) {
    if (!COMPACT_PROJECTIONS[entity]) problems.push(`COMPACT_OMIT is written for ${entity}, which has no compact card`);
  }

  // What a single read keeps out of its default answer (`SINGLE_READ_OMIT`) is a
  // declared exception with its reason, of fields the entity has, on an entity
  // some read of one record answers with.
  for (const [entity, groups] of Object.entries(SINGLE_READ_OMIT)) {
    const model = modelOf(entity);
    if (!model?.properties) {
      problems.push(`SINGLE_READ_OMIT is written for ${entity}, which is not a schema of the spec`);
      continue;
    }
    const named = new Set<string>();
    for (const { fields, why } of groups) {
      if (!why.trim()) problems.push(`SINGLE_READ_OMIT leaves ${fields.join(', ')} out of ${entity} without a reason`);
      for (const name of fields) {
        if (named.has(name)) problems.push(`SINGLE_READ_OMIT leaves ${entity}.${name} out twice`);
        named.add(name);
        if (!fieldExists(model, name)) problems.push(`SINGLE_READ_OMIT leaves ${name} out of ${entity}, which the schema does not have`);
      }
    }
    if (Object.keys(model.properties).every((head) => named.has(head))) problems.push(`SINGLE_READ_OMIT leaves every field of ${entity} out`);
    if (!tools.some((t) => t.entity === entity && t.kind === 'read' && !isListAnswer(t))) {
      problems.push(`SINGLE_READ_OMIT is written for ${entity}, which no read of one record answers with`);
    }
  }
  // The view of every tool says what its default leaves out, with the template filled.
  for (const [kind, template] of Object.entries(VIEW_ARGUMENT.description)) {
    if (!template.includes('{fields}')) problems.push(`VIEW_ARGUMENT.description.${kind} has no {fields} to name what compact carries or leaves out`);
  }
  if (!VIEW_ARGUMENT.description.omission.includes('{why}')) problems.push('VIEW_ARGUMENT.description.omission has no {why} for the reason');
  for (const tool of tools) {
    for (const [name, place] of Object.entries(tool.request.arguments)) {
      if (place.effect?.kind !== 'projection' && place.effect?.kind !== 'omission') continue;
      if (/\{\w+\}/.test(String(tool.inputSchema.properties?.[name]?.description))) problems.push(`${tool.name}: the description of ${name} still carries a placeholder`);
    }
  }

  // A list answers with a card per record, and a single read may keep declared
  // fields out, so the words of a tool must not send a model to a field its
  // default answer leaves out: it would read the field as missing. And a dotted
  // field an argument says its value comes from has to be in a card, or the
  // default answer of a list never shows it.
  const viewOf = (tool: BuiltTool): { kind: 'projection' | 'omission'; entity: string } | null => {
    for (const place of Object.values(tool.request.arguments)) {
      const effect = place.effect;
      if (effect?.kind === 'projection' || effect?.kind === 'omission') return { kind: effect.kind, entity: effect.entity };
    }
    return null;
  };
  const cardOmitted = (entity: string): Set<string> => new Set((COMPACT_OMIT[entity] ?? []).flatMap((o) => o.fields));
  const singleOmitted = (entity: string): Set<string> => new Set((SINGLE_READ_OMIT[entity] ?? []).flatMap((o) => o.fields));
  const namedOmissions = new Set<string>();
  for (const tool of tools) {
    const view = viewOf(tool);
    if (!view) continue;
    const omitted = view.kind === 'projection' ? cardOmitted(view.entity) : singleOmitted(view.entity);
    const taken = new Set(Object.keys(tool.inputSchema.properties ?? {}));
    const offered = new Set(
      Object.values<JsonSchema>(tool.inputSchema.properties ?? {}).flatMap((s) => (Array.isArray(s.enum) ? s.enum.map(String) : [])),
    );
    // The view's own words name what it leaves out on purpose.
    const texts = [
      tool.description,
      ...Object.entries<JsonSchema>(tool.inputSchema.properties ?? {})
        .filter(([name]) => name !== VIEW_ARGUMENT.name)
        .flatMap(([, schema]) => readSchemaText(schema)),
    ].join('\n');
    // A field another tool takes, named with that tool, is about that tool.
    const elsewhere = new Set(
      [...texts.matchAll(/`(\w+)`/g)].flatMap((m) => Object.keys(tools.find((t) => t.name === m[1] && t !== tool)?.inputSchema.properties ?? {})),
    );
    const spans = new Set([...texts.matchAll(/`([a-z_][a-z0-9_.]*)`/g)].map((m) => m[1]!));
    // A dotted field `parent.leaf` is named by `parent.leaf`, and by `leaf` in
    // words that name `parent` too — «`webhook` carries … `url`».
    const named = (field: string): string | undefined => {
      if (spans.has(field)) return field;
      const at = field.lastIndexOf('.');
      if (at < 0) return undefined;
      const leaf = field.slice(at + 1);
      const parent = field.slice(0, at).split('.').pop()!;
      return spans.has(leaf) && spans.has(parent) ? leaf : undefined;
    };
    const excused = new Set(
      view.kind === 'omission' ? (SINGLE_READ_OMIT[view.entity] ?? []).filter((g) => g.named?.trim()).flatMap((g) => g.fields) : [],
    );
    for (const field of omitted) {
      const span = named(field);
      if (!span || taken.has(span) || offered.has(span) || elsewhere.has(span)) continue;
      if (excused.has(field)) {
        namedOmissions.add(`${view.entity}.${field}`);
        continue;
      }
      const how = view.kind === 'projection' ? `answers with ${view.entity} cards` : 'keeps it out of a single read';
      problems.push(`${tool.name} ${how}, and its words name \`${field}\``);
    }
  }
  // An exception that no tool's words call for any more goes with them.
  for (const [entity, groups] of Object.entries(SINGLE_READ_OMIT)) {
    for (const group of groups.filter((g) => g.named !== undefined)) {
      if (!group.named!.trim()) problems.push(`SINGLE_READ_OMIT lets words name ${group.fields.join(', ')} of ${entity} without a reason`);
      else if (!group.fields.some((field) => namedOmissions.has(`${entity}.${field}`))) {
        problems.push(`SINGLE_READ_OMIT lets words name ${group.fields.join(', ')} of ${entity}, and no tool's words name them — drop named`);
      }
    }
  }
  const carded = Object.keys(COMPACT_PROJECTIONS);
  for (const tool of tools) {
    for (const [argument, schema] of Object.entries<JsonSchema>(tool.inputSchema.properties ?? {})) {
      for (const [, span] of String(schema.description ?? '').matchAll(/`([a-z_]+(?:\.[a-z_]+)+)`/g)) {
        if (span!.startsWith('meta.')) continue;
        for (const entity of carded) {
          const omitted = cardOmitted(entity);
          const [head] = span!.split('.');
          if (omitted.has(span!) || omitted.has(head!)) {
            problems.push(`${tool.name}: ${argument} takes its value from \`${span}\`, which the ${entity} card leaves out`);
          }
        }
      }
    }
  }

  // An edit that replaces a list whole (`x-replaces-set` in the spec) needs the
  // list in front of the model first: some read of the same entity shows it in
  // its default answer — a single read whole, a list only where its card carries
  // it. Otherwise the set an edit is about to overwrite is out of sight, and a tag
  // added to a person drops the tags they had.
  for (const tool of tools) {
    if (!/^(PUT|PATCH) /.test(tool.operation)) continue;
    const marked: string[] = [];
    const walk = (node: any, at: string, depth = 0): void => {
      const resolved = specResolve(node, docEn);
      if (!resolved || typeof resolved !== 'object' || depth > 10) return;
      const flag = node?.['x-replaces-set'] ?? resolved['x-replaces-set'];
      if (flag !== undefined) {
        if (flag !== true || resolved.type !== 'array') problems.push(`${tool.name}: ${at} declares x-replaces-set, which belongs on a list as true`);
        else marked.push(at);
      }
      for (const [name, child] of Object.entries<any>(resolved.properties ?? {})) walk(child, at ? `${at}.${name}` : name, depth + 1);
    };
    walk(requestBodySchema(byKey.get(tool.operation)!), '');
    for (const at of marked) {
      const entity = tool.entity;
      const model = entity ? modelOf(entity) : null;
      // A body wraps its fields in the entity — `user.list_tags` — or names them as the record does.
      const field = [at, at.split('.').slice(1).join('.')].find((name) => name && model && fieldExists(model, name));
      if (!entity || !field) {
        problems.push(`${tool.name} replaces ${at} whole, and ${entity ?? 'its answer'} has no such field for a read to show`);
        continue;
      }
      const covers = (names: string[]): boolean => names.some((name) => name === field || field.startsWith(`${name}.`));
      const shown = tools.some((read) => {
        if (read.kind !== 'read' || read.entity !== entity) return false;
        const view = viewOf(read);
        if (!view) return true;
        return view.kind === 'omission' ? !covers([...singleOmitted(entity)]) : covers(COMPACT_PROJECTIONS[entity] ?? []);
      });
      if (!shown) problems.push(`${tool.name} replaces ${field} of ${entity} whole, and no read shows it by default — the set it overwrites is out of sight`);
    }
  }

  // The author of a record is read where `AUTHOR_FIELDS` says, so that field has
  // to be in the entity, in its card, and in the default answer of a single read:
  // a record whose author is cut away cannot be marked «(you)».
  for (const [entity, author] of Object.entries(AUTHOR_FIELDS)) {
    const model = modelOf(entity);
    if (!model?.properties) {
      problems.push(`AUTHOR_FIELDS names ${entity}, which is not a schema of the spec`);
      continue;
    }
    if (!tools.some((t) => t.entity === entity)) problems.push(`AUTHOR_FIELDS names ${entity}, which no tool answers with`);
    if (author.when && !author.when.equals.trim()) problems.push(`AUTHOR_FIELDS limits the author of ${entity} by ${author.when.field} without a value`);
    const kept = singleOmitted(entity);
    for (const name of [author.field, author.prefer, author.when?.field].filter((n): n is string => Boolean(n))) {
      if (!fieldExists(model, name)) problems.push(`AUTHOR_FIELDS reads the author of ${entity} from ${name}, which the schema does not have`);
      const card = COMPACT_PROJECTIONS[entity];
      if (card && !card.includes(name)) problems.push(`the author of ${entity} is read from ${name}, which its card leaves out`);
      if ([...kept].some((o) => name === o || name.startsWith(`${o}.`))) problems.push(`the author of ${entity} is read from ${name}, which SINGLE_READ_OMIT keeps out`);
    }
  }

  // ── Text of other people ─────────────────────────────────────────────────
  // Every place of an answer where text can be is classified: untrusted, made by
  // Pachca, or bounded by a closed set of values. Two walks have to agree on it —
  // the spec with its references and the answer as built — and every name in
  // `TRUSTED_TEXT` has to be free text an answer actually carries.
  const serviceText = new Map<string, TextPaths>();
  for (const service of SERVICE_TOOLS) {
    if (service.outputSchema) serviceText.set(service.name, textPaths(service.outputSchema, { components: { schemas: {} } }, service.name));
  }
  const classified = (name: string, text: TextPaths, schema: JsonSchema | null | undefined): void => {
    const places = textPlaces(schema);
    const under = (place: string, path: string): boolean =>
      place === path || place.startsWith(`${path}.`) || place.startsWith(`${path}[`) || place.startsWith(`${path}{`);
    for (const place of places) {
      if (text.untrusted.some((path) => under(place, path)) || text.trusted.includes(place) || text.closed.includes(place)) continue;
      problems.push(`${name} answers with text at ${place}, which is neither untrusted, trusted nor closed`);
    }
    for (const path of text.untrusted) if (!places.includes(path)) problems.push(`${name} lists ${path} as untrusted, and its answer has no text there`);
  };
  for (const tool of tools) classified(tool.name, tool.text, tool.outputSchema);
  for (const service of SERVICE_TOOLS) classified(`service tool ${service.name}`, serviceText.get(service.name) ?? noText(), service.outputSchema as JsonSchema | undefined);
  const trustedNamed = new Set<string>();
  for (const { fields, why } of TRUSTED_TEXT) {
    if (!why.trim()) problems.push(`TRUSTED_TEXT trusts ${fields.join(', ')} without a reason`);
    for (const name of fields) {
      if (trustedNamed.has(name)) problems.push(`TRUSTED_TEXT names ${name} twice`);
      trustedNamed.add(name);
      if (FREE_TEXT_KEYS.has(name)) continue;
      problems.push(
        CLOSED_KEYS.has(name)
          ? `TRUSTED_TEXT names ${name}, which an enum or a format already bounds`
          : `TRUSTED_TEXT names ${name}, which no answer of a tool carries as free text`,
      );
    }
  }

  // ── Generated notes ──────────────────────────────────────────────────────
  // A note the generator puts on what it is about holds only while it is on all
  // of it, and once: a tool that hands out a secret without the note, or a
  // date-time argument without the way to write a moment, is the gap the note
  // was moved there to close.
  const occurrences = (text: unknown, note: string): number => String(text ?? '').split(note).length - 1;
  const secretsMet = new Set<string>();
  for (const tool of tools) {
    tool.text.secrets.forEach((key) => secretsMet.add(key));
    const notes = occurrences(tool.description, SECRET_NOTE);
    const expected = tool.text.secrets.length ? 1 : 0;
    if (notes !== expected) {
      problems.push(
        expected
          ? `${tool.name} answers with ${tool.text.secrets.join(', ')}, and its description carries SECRET_NOTE ${notes} times rather than once`
          : `${tool.name} carries SECRET_NOTE, and its answer holds no field TRUSTED_TEXT marks secret`,
      );
    }
    if (readSchemaText(tool.inputSchema).some((text) => occurrences(text, SECRET_NOTE))) problems.push(`${tool.name} carries SECRET_NOTE in an argument`);
  }
  for (const service of SERVICE_TOOLS) {
    if (occurrences(service.description, SECRET_NOTE)) problems.push(`service tool ${service.name} carries SECRET_NOTE, and no secret is in its answer`);
  }
  for (const key of SECRET_KEYS) {
    if (!secretsMet.has(key)) problems.push(`TRUSTED_TEXT marks ${key} secret, and no answer of a tool carries it`);
  }
  // The note rests on the flag, and a flag dropped by mistake would take the note
  // off every tool that hands out a secret while the build stays green. So a
  // field of free text whose name says it is a token or a secret has to be in a
  // group that says which it is: whole, and carrying the note, or masked.
  if (!SECRET_KEYS.size) problems.push('TRUSTED_TEXT marks no field secret, so no tool carries SECRET_NOTE');
  const declared = new Set(TRUSTED_TEXT.filter((group) => group.secret || group.masked).flatMap((group) => group.fields));
  for (const key of FREE_TEXT_KEYS) {
    if (/(^|_)(token|secret)$/.test(key.split('.').pop()!) && !declared.has(key)) {
      problems.push(`${key} is named as a token or a secret, and TRUSTED_TEXT marks it neither secret nor masked`);
    }
  }
  for (const group of TRUSTED_TEXT) {
    if (group.secret && group.masked) problems.push(`TRUSTED_TEXT marks ${group.fields.join(', ')} both secret and masked`);
  }
  for (const tool of tools) {
    if (occurrences(tool.description, MOMENT_ARGUMENT.description)) problems.push(`${tool.name} carries MOMENT_ARGUMENT in its description rather than on an argument`);
    const walk = (node: JsonSchema | undefined, at: string): void => {
      if (!node || typeof node !== 'object') return;
      const notes = occurrences(node.description, MOMENT_ARGUMENT.description);
      if (node.format === 'date-time' && notes !== 1) {
        problems.push(`${tool.name}: the date-time argument ${at} carries MOMENT_ARGUMENT ${notes} times rather than once`);
      }
      if (node.format !== 'date-time' && notes) problems.push(`${tool.name}: ${at} carries MOMENT_ARGUMENT and is no date-time`);
      for (const [name, child] of Object.entries(node.properties ?? {})) walk(child, at ? `${at}.${name}` : name);
      if (node.items) walk(node.items, `${at}[]`);
      if (node.additionalProperties && typeof node.additionalProperties === 'object') walk(node.additionalProperties, `${at}{}`);
    };
    for (const [name, child] of Object.entries(tool.inputSchema.properties ?? {})) walk(child, name);
  }
  for (const tool of tools) {
    if (occurrences(tool.description, QUERY_ARGUMENT.description)) problems.push(`${tool.name} carries QUERY_ARGUMENT in its description rather than on an argument`);
    const walk = (node: JsonSchema | undefined, at: string): void => {
      if (!node || typeof node !== 'object') return;
      const notes = occurrences(node.description, QUERY_ARGUMENT.description);
      const phrase = at === 'query' && [node.type ?? []].flat().includes('string');
      if (phrase && notes !== 1) problems.push(`${tool.name}: the search phrase query carries QUERY_ARGUMENT ${notes} times rather than once`);
      if (!phrase && notes) problems.push(`${tool.name}: ${at} carries QUERY_ARGUMENT and is no top-level search phrase`);
      for (const [name, child] of Object.entries(node.properties ?? {})) walk(child, at ? `${at}.${name}` : name);
      if (node.items) walk(node.items, `${at}[]`);
      if (node.additionalProperties && typeof node.additionalProperties === 'object') walk(node.additionalProperties, `${at}{}`);
    };
    for (const [name, child] of Object.entries(tool.inputSchema.properties ?? {})) walk(child, name);
  }
  for (const service of SERVICE_TOOLS) {
    if (occurrences(JSON.stringify(service), QUERY_ARGUMENT.description)) problems.push(`service tool ${service.name} carries QUERY_ARGUMENT, which only the search phrase of an API tool takes`);
  }

  // ── Pages ────────────────────────────────────────────────────────────────
  // A cursor comes from the answer before, and the server asks for a page cut
  // short again with a smaller limit (`RESPONSE_FORMAT.truncation`), so a tool
  // that pages answers with the next cursor and takes a limit.
  for (const tool of tools) {
    if (!tool.inputSchema.properties?.cursor) continue;
    if (!tool.outputSchema?.properties?.meta?.properties?.paginate?.properties?.next_page) {
      problems.push(`${tool.name} takes a cursor, and its answer has no meta.paginate.next_page to take it from`);
    }
    if (!tool.inputSchema.properties?.limit) problems.push(`${tool.name} takes a cursor and no limit, which a page cut short is repeated with`);
  }

  // A link the server builds carries only what it can fill: the host of the
  // installation and the fields of the record.
  for (const [kind, template] of Object.entries(WEB_LINKS)) {
    if (!template.startsWith('https://{app_host}/')) problems.push(`WEB_LINKS.${kind} does not start at the web app of the installation`);
    for (const [, name] of template.matchAll(/\{(\w+)\}/g)) {
      if (!(name! in INSTRUCTION_PLACEHOLDERS) && name !== 'id') problems.push(`WEB_LINKS.${kind} uses {${name}}, which nothing fills`);
    }
  }

  // Every schema a client receives compiles the way a client compiles it, every
  // example passes the schema it illustrates, and an answer the spec shows passes
  // the tool's outputSchema — whole, cut by the default view, and with each
  // nullable parent a card reaches into set to null. A record cut naively,
  // `thread: {id: null}`, or a schema that refuses a field the API leaves empty, is
  // a result the client throws away.
  const ajv = validator();
  const compile = (where: string, schema: unknown): ValidateFunction | null => {
    try {
      return ajv.compile(schema as object);
    } catch (error) {
      problems.push(`${where} does not compile as JSON Schema 2020-12: ${(error as Error).message}`);
      return null;
    }
  };
  const failure = (validate: ValidateFunction): string => {
    const e = validate.errors?.[0];
    return e ? `${e.instancePath || '/'} ${e.message}` : 'invalid';
  };
  const examplesIn = (where: string, node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const schema = node as JsonSchema;
    if (Array.isArray(schema.examples)) {
      const validate = compile(`${where} (examples)`, schema);
      for (const example of schema.examples) {
        if (validate && !validate(example)) problems.push(`${where}: the example ${JSON.stringify(example)} fails its own schema (${failure(validate)})`);
      }
    }
    for (const [name, child] of Object.entries(schema.properties ?? {})) examplesIn(`${where}.${name}`, child);
    if (schema.items) examplesIn(`${where}[]`, schema.items);
    if (typeof schema.additionalProperties === 'object') examplesIn(`${where}{}`, schema.additionalProperties);
  };
  // Some clients still validate with the draft-07 class: a schema has to compile there too.
  const ajv07 = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv07 as unknown as Parameters<typeof addFormats>[0]);
  const compile07 = (where: string, schema: unknown): void => {
    try {
      ajv07.compile(schema as object);
    } catch (error) {
      problems.push(`${where} does not compile as JSON Schema draft-07: ${(error as Error).message}`);
    }
  };
  for (const tool of tools) {
    compile(tool.name, tool.inputSchema);
    compile07(tool.name, tool.inputSchema);
    examplesIn(tool.name, tool.inputSchema);
    if (!tool.outputSchema) continue;
    compile07(`${tool.name} answer`, tool.outputSchema);
    const validate = compile(`${tool.name} answer`, tool.outputSchema);
    const op = byKey.get(tool.operation)!;
    const code = ANSWER_CODES.find((c) => op.nodeEn?.responses?.[c]?.content?.['application/json']);
    if (!validate || !code) continue;
    const media = op.nodeEn.responses[code].content['application/json'];
    const body = media.example !== undefined ? copy(media.example) : exampleOf(media.schema, docEn);
    const view = viewOf(tool);
    const bodies: Array<[string, unknown]> = [['the spec example', body]];
    if (view?.kind === 'projection') {
      const card = COMPACT_PROJECTIONS[view.entity]!;
      const model = modelOf(view.entity);
      const nullable = [...new Set(card.filter((n) => n.includes('.')).map((n) => n.split('.')[0]!))].filter(
        (head) => specResolve(model?.properties?.[head], docEn)?.nullable,
      );
      for (const head of nullable) {
        bodies.push([`the spec example with ${head} null`, withRecords(body, (r) => (r && typeof r === 'object' ? { ...r, [head]: null } : r))]);
      }
      for (const [said, value] of [...bodies]) bodies.push([`${said} cut to its card`, withRecords(value, (r) => project(r, card))]);
    }
    if (view?.kind === 'omission') {
      const names = [...singleOmitted(view.entity)];
      bodies.push(['the spec example without what a single read leaves out', withRecords(body, (r) => omit(r, names))]);
    }
    for (const [said, value] of bodies) {
      if (!validate(value)) problems.push(`${tool.name}: ${said} fails its outputSchema (${failure(validate)})`);
    }
  }

  // Plumbing sentences are cut by pattern; a new wording of them should fail here
  // rather than reach a model, and a pattern that no longer cuts anything is gone
  // from the spec and has to go from the list.
  for (const tool of tools) {
    if (HTTP_LEFTOVER.test(tool.description)) problems.push(`${tool.name} still carries a sentence written for an HTTP client`);
  }
  for (const pattern of [...HTTP_ONLY_SENTENCES, ...HTTP_REWRITES.map(([p]) => p)]) {
    if (!HTTP_HITS.get(pattern)) problems.push(`the HTTP pattern ${pattern.source.slice(0, 60)}… matches no description of the spec — drop it`);
  }

  // A body the generator could not read leaves a tool with nothing to pass. An
  // empty schema is a valid schema, so nothing else would notice.
  for (const op of operations) {
    if (op.key in CHAIN_STEPS || !op.nodeEn?.requestBody) continue;
    const tool = tools.find((t) => t.operation === op.key);
    const fields = Object.keys(tool?.inputSchema.properties ?? {});
    const fromPath = paramsOf(op.nodeEn).length;
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
    if (tool.outputSchema) {
      problems.push(
        ...lintSchema(`service tool ${tool.name} answer`, tool.outputSchema as JsonSchema),
        ...outputKeywords(`service tool ${tool.name}`, tool.outputSchema as JsonSchema),
      );
    }
  }
  const names = new Set(tools.map((t) => t.name));
  for (const name of Object.keys(MCP_TOOL_PROSE)) {
    if (!names.has(name)) problems.push(`prose is written for ${name}, which is not a tool`);
  }
  // A chain step is no tool, so the name it would have must not be taken by one:
  // a link to the step keeps its words, and a link to the namesake would not.
  for (const step of Object.keys(CHAIN_STEPS)) {
    const name = byKey.get(step)?.name ?? '';
    const holder = tools.find((t) => t.name === name);
    if (holder) problems.push(`the chain step ${step} would be named ${name}, which is the tool of ${holder.operation}`);
  }
  // The scope of every operation an upload runs is on the argument that runs it.
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
    }
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
        if (!isListAnswer(tool)) problems.push(`${tool.name} reads one record and cuts it to a card — a single read answers whole`);
      }
      if (effect.kind === 'omission') {
        if (!SINGLE_READ_OMIT[effect.entity]) problems.push(`${tool.name} keeps fields of ${effect.entity} out by ${name}, and SINGLE_READ_OMIT names none`);
        if (tool.entity !== effect.entity) problems.push(`${tool.name} answers with ${tool.entity ?? 'nothing named'} and leaves out fields of ${effect.entity}`);
        if (isListAnswer(tool)) problems.push(`${tool.name} answers with a list, which a card cuts, and declares a single read's omissions`);
      }
      if (effect.kind === 'download') {
        const into = tool.request.arguments[effect.into];
        if (!into || into.in !== 'body' || tool.inputSchema.properties?.[effect.into]?.contentEncoding !== 'base64') {
          problems.push(`${tool.name} downloads ${name} into ${effect.into}, which is not a file field of the body`);
        }
      }
      if (effect.kind === 'after' && !byKey.has(effect.operation)) {
        problems.push(`${tool.name} runs ${effect.operation} after ${name}, which is not an operation of the spec`);
      }
    }
  }

  // A page a description names has to exist, and so does the section of it a
  // link points at: a link that leads nowhere is worse than no link. A page that
  // moved with a redirect has already been renamed to its new address above, so
  // what fails here has neither a source nor a redirect.
  const textOf = (t: BuiltTool): string => `${t.description}${JSON.stringify(t.inputSchema)}`;
  const site = SERVER_INFO.website_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const t of tools) {
    for (const [, page, anchor] of textOf(t).matchAll(new RegExp(`\\(${site}(/[^)#\\s"\\\\]+)(?:#([^)\\s"\\\\]+))?\\)`, 'g'))) {
      if (!hasSource(page!)) problems.push(`${t.name} names the page ${page}, which the documentation does not have`);
      else if (anchor && !anchorsOf(page!).has(anchor)) problems.push(`${t.name} points at #${anchor} on ${page}, which has no such section`);
    }
  }

  // Prose must not say again what the spec already says. A fact with two homes
  // drifts: the spec moves with the API, prose moves when somebody remembers.
  // Six words in a row is long enough to be a restatement and short enough to
  // catch one that changed a word or two on the way. Prose for an argument is
  // held against the argument's own words too.
  const REPEAT_RUN = 6;
  const wordsIn = (text: string) => text.toLowerCase().replace(/`[^`]*`/g, ' ').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const repeats = (said: string[], line: string): string[] | null => {
    const mine = wordsIn(line);
    for (let i = 0; i + REPEAT_RUN <= mine.length; i += 1) {
      const run = mine.slice(i, i + REPEAT_RUN);
      if (said.some((_, j) => run.every((w, k) => said[j + k] === w))) return run;
    }
    return null;
  };
  for (const op of operations) {
    const prose = MCP_TOOL_PROSE[op.name];
    if (!prose) continue;
    const said = wordsIn(specText(op));
    const tool = tools.find((t) => t.name === op.name);
    const written: Array<[string, string]> = [
      ...(prose.description ? [['description', prose.description] as [string, string]] : []),
      ...(prose.whenToUse ?? []).map((l) => ['whenToUse', l] as [string, string]),
      ...(prose.notFor ?? []).map((l) => ['notFor', l] as [string, string]),
      ...Object.entries(prose.arguments ?? {}).map(([a, l]) => [`argument ${a}`, l] as [string, string]),
    ];
    for (const [where, line] of written) {
      const argument = where.startsWith('argument ') ? where.slice('argument '.length) : null;
      const run = repeats(argument ? [...said, ...wordsIn(tool?.specWords[argument] ?? '')] : said, line);
      if (run) problems.push(`${op.name} ${where} says again what the spec says: «${run.join(' ')}»`);
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
  // check knows them and only flags what names nothing at all. Argument wording
  // counts as much as the description, down to the values of a map: a field that
  // points at a tool nobody has is the same dead end, one level down.
  const quoted = TOOL_NAME_IN_PROSE;
  for (const tool of tools) {
    for (const quotedName of new Set([tool.description, ...readSchemaText(tool.inputSchema)].join('\n').match(quoted) ?? [])) {
      if (!names.has(quotedName) && !serviceNames.has(quotedName) && !tool.inputSchema.properties?.[quotedName] && !SPEC_VOCABULARY.has(quotedName)) {
        problems.push(`${tool.name} names "${quotedName}", which is neither a tool, an argument, nor a name the spec uses`);
      }
    }
    if (/\bconfirm\b/i.test(tool.description) && !/needs no confirmation/i.test(tool.description)) {
      problems.push(`${tool.name} tells the model to ask for confirmation — say the consequence instead`);
    }
  }

  // A placeholder the server does not know how to fill would reach the model raw,
  // and one nothing uses is a value the server fills for nobody: the instructions,
  // the footer and the links into the web app are where the server fills them.
  for (const [, name] of SERVER_INSTRUCTIONS.matchAll(/\{(\w+)\}/g)) {
    if (!(name! in INSTRUCTION_PLACEHOLDERS)) problems.push(`the server instructions use {${name}}, which nothing fills`);
  }
  const filledIn = [SERVER_INSTRUCTIONS, RESPONSE_FORMAT.footer, ...Object.values(WEB_LINKS)].join('\n');
  for (const name of Object.keys(INSTRUCTION_PLACEHOLDERS)) {
    if (!filledIn.includes(`{${name}}`)) problems.push(`INSTRUCTION_PLACEHOLDERS.${name} is used by neither the instructions, the footer nor WEB_LINKS`);
  }

  // The always-on block is one text for every token and is read before any
  // listing, so a tool it names has to be in every listing: one some token lacks
  // is a dead end for that token, and the judged run refuses such a listing too.
  for (const quotedName of new Set(SERVER_INSTRUCTIONS.match(quoted) ?? [])) {
    const tool = tools.find((t) => t.name === quotedName);
    if (!tool && !serviceNames.has(quotedName)) {
      problems.push(`the server instructions name "${quotedName}", which is not a tool`);
      continue;
    }
    const lacking = tool ? AUDIENCES.filter((a) => !tool.roles.includes(a.role) || (tool.plan !== null && tool.plan !== a.plan)) : [];
    if (lacking.length) {
      problems.push(`the server instructions name ${quotedName}, which the ${lacking.map((a) => a.key).join(', ')} listing does not carry`);
    }
  }

  // The instructions hold what no single tool can say, and a rule of one area
  // has its home with the tools of that area. Six words in a row shared with the
  // text of any operation, with what any tool says — its description with prose
  // and notes, a service tool's own — or with what any argument says, is the same
  // restatement the prose is held to: read before every listing, it would drift
  // unseen.
  const specRuns = new Set<string>();
  for (const text of [
    ...operations.map((op) => specText(op)),
    ...tools.map((t) => t.description),
    ...SERVICE_TOOLS.map((t) => t.description),
    ...tools.flatMap((t) => readSchemaText(t.inputSchema)),
    ...SERVICE_TOOLS.flatMap((t) => t.input.map((f) => f.description)),
  ]) {
    const words = wordsIn(text);
    for (let i = 0; i + REPEAT_RUN <= words.length; i += 1) specRuns.add(words.slice(i, i + REPEAT_RUN).join(' '));
  }
  for (const paragraph of SERVER_INSTRUCTIONS.split('\n')) {
    const words = wordsIn(paragraph);
    for (let i = 0; i + REPEAT_RUN <= words.length; i += 1) {
      const run = words.slice(i, i + REPEAT_RUN).join(' ');
      if (specRuns.has(run)) {
        problems.push(`the server instructions say again what a tool says: «${run}»`);
        break;
      }
    }
  }

  // What a client cuts never reaches the model. The instructions are measured
  // whole, with every placeholder filled by the longest example it gives, and a
  // description has to fit whole too: a rule moved out of the instructions goes
  // to the tools it is about, and a fact moved out of a description goes to the
  // argument it is about, in the spec, where no such limit holds.
  const longestExample = (description: string): string =>
    [...description.matchAll(/«([^»]+)»/g)].map((m) => m[1]!).sort((a, b) => b.length - a.length)[0] ?? '';
  for (const [name, description] of Object.entries(INSTRUCTION_PLACEHOLDERS)) {
    if (!longestExample(description)) problems.push(`INSTRUCTION_PLACEHOLDERS.${name} gives no example in «…» to measure the instructions with`);
  }
  const placeholderOf = (name: string): string | undefined => (INSTRUCTION_PLACEHOLDERS as Record<string, string>)[name];
  const filledInstructions = SERVER_INSTRUCTIONS.replace(/\{(\w+)\}/g, (all, name: string) => {
    const description = placeholderOf(name);
    return description ? longestExample(description) : all;
  });
  if (filledInstructions.length > INSTRUCTIONS_LIMIT) {
    problems.push(
      `the server instructions run to ${filledInstructions.length} characters with their placeholders filled, ` +
        `past ${INSTRUCTIONS_LIMIT} — a client that keeps ${CLIENT_TEXT_LIMIT} would lose their end: move the rule to the tools it is about`,
    );
  }
  for (const tool of [...tools, ...SERVICE_TOOLS]) {
    if (tool.description.length > CLIENT_TEXT_LIMIT) {
      problems.push(
        `${tool.name}: the description runs to ${tool.description.length} characters, and a client keeps ${CLIENT_TEXT_LIMIT} — ` +
          'move what belongs to one argument into that argument in the spec',
      );
    }
  }

  // ── Refusals ─────────────────────────────────────────────────────────────
  // A refusal never reaches the model as a bare status: every status from 400 up
  // that an operation of a tool declares has its line, and a line no tool can be
  // answered with is advice for nothing. A code a line names in backticks is a
  // code of the spec — of ValidationErrorCode, or of OAuthErrorCode that the
  // description of OAuthError.error names as an answer of API methods — so a code
  // the API dropped, or one only the token exchange returns, cannot linger in
  // what every refusal is read with.
  const refusedWith = new Map<string, string[]>();
  for (const tool of tools) {
    for (const status of Object.keys(byKey.get(tool.operation)?.nodeEn?.responses ?? {})) {
      if (/^\d{3}$/.test(status) && Number(status) >= 400) refusedWith.set(status, [...(refusedWith.get(status) ?? []), tool.name]);
    }
  }
  for (const [status, holders] of refusedWith) {
    if (!REFUSALS[status]?.trim()) {
      problems.push(`${holders.slice(0, 3).join(', ')}${holders.length > 3 ? ` and ${holders.length - 3} more` : ''} can answer ${status}, and REFUSALS has no line for it`);
    }
  }
  for (const status of Object.keys(REFUSALS)) {
    if (!refusedWith.has(status)) problems.push(`REFUSALS has a line for ${status}, which no operation of a tool answers`);
  }
  const oauthCodes = new Set<string>((specResolve(docEn.components?.schemas?.OAuthErrorCode, docEn)?.enum ?? []) as string[]);
  const methodOAuthCodes = [
    ...String(docEn.components?.schemas?.OAuthError?.properties?.error?.description ?? '').matchAll(/`([a-z_]+)`/g),
  ].map((m) => m[1]!);
  if (!oauthCodes.size) problems.push('the spec has no OAuthErrorCode to hold the OAuth codes of REFUSALS against');
  for (const code of methodOAuthCodes) {
    if (!oauthCodes.has(code)) problems.push(`the description of OAuthError.error names \`${code}\`, which is no value of OAuthErrorCode`);
  }
  const errorCodes = new Set<string>([
    ...((specResolve(docEn.components?.schemas?.ValidationErrorCode, docEn)?.enum ?? []) as string[]),
    ...methodOAuthCodes.filter((code) => oauthCodes.has(code)),
  ]);
  if (!errorCodes.size) problems.push('the spec gives no error codes to hold REFUSALS against (ValidationErrorCode, OAuthErrorCode)');
  for (const [status, line] of Object.entries(REFUSALS)) {
    for (const [, code] of line.matchAll(/`([^`]+)`/g)) {
      if (!errorCodes.has(code!)) problems.push(`REFUSALS['${status}'] names \`${code}\`, which is no error code of the spec`);
    }
  }

  // Every scenario has to name a tool that exists and arguments the tool takes.
  // An argument is named by its place: `schedule.start_date`, `files.key`; a
  // step through a list reaches its items, as the scorer reads it too.
  const argumentAt = (schema: JsonSchema, place: string): JsonSchema | undefined => {
    let node: JsonSchema | undefined = schema;
    for (const step of place.split('.')) {
      if (node && [node.type].flat().includes('array')) node = node.items;
      node = node?.properties?.[step];
    }
    return node;
  };
  for (const scenario of TOOL_SCENARIOS) {
    // A scenario is measured on one listing, and only a tool of that listing can
    // be its answer: a key that accepts a tool the token never sees passes on a
    // call that cannot happen, or fails a run for the instrument.
    const audienceKey = scenario.audience ?? 'owner:corporation';
    const audience = AUDIENCES.find((a) => a.key === audienceKey);
    if (!audience) problems.push(`${scenario.id} is measured on ${audienceKey}, which is no listing`);
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
        continue;
      }
      const tool = tools.find((t) => t.name === accepted);
      if (tool && audience && !(tool.roles.includes(audience.role) && (!tool.plan || tool.plan === audience.plan))) {
        problems.push(`${scenario.id} accepts ${accepted}, which the ${audienceKey} listing does not have`);
      }
    }
    const asserted = [
      ...Object.keys(scenario.args?.must ?? {}),
      ...(scenario.args?.present ?? []),
      ...(scenario.args?.absent ?? []),
      ...Object.keys(scenario.args?.onWeekday ?? {}),
      ...Object.keys(scenario.args?.daysAgo ?? {}),
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
    // A day asserted on a field that is not a moment measures nothing.
    for (const argument of [...Object.keys(scenario.args?.onWeekday ?? {}), ...Object.keys(scenario.args?.daysAgo ?? {})]) {
      const holders = accepted.map((t) => argumentAt(t.inputSchema, argument)).filter(Boolean) as JsonSchema[];
      if (holders.length && !holders.some((field) => field.format === 'date-time')) {
        problems.push(`${scenario.id} expects a day in "${argument}", which the spec does not declare as a moment`);
      }
    }
    for (const [argument, days] of Object.entries(scenario.args?.daysAgo ?? {})) {
      if (!Number.isInteger(days) || days < 1) problems.push(`${scenario.id} counts "${argument}" ${days} days back, which is no day already past`);
    }
    const serviceArgs = new Set(
      scenario.accept.flatMap((n) => SERVICE_TOOLS.find((t) => t.name === n)?.input.map((f) => f.name) ?? []),
    );
    for (const argument of asserted) {
      if (!serviceArgs.has(argument) && !accepted.some((t) => argumentAt(t.inputSchema, argument))) {
        problems.push(`${scenario.id} asserts "${argument}", which none of its tools takes`);
      }
    }
    // A value the enum does not allow fails validation on every run, and the
    // miss is booked against the tool. Each accepted tool that takes the argument
    // is held to its own enum, an item of a list to the enum of its items.
    for (const expected of [scenario.args?.must ?? {}, ...(scenario.args?.either ?? [])]) {
      for (const [argument, value] of Object.entries(expected)) {
        for (const tool of accepted) {
          const field = argumentAt(tool.inputSchema, argument);
          const allowed = field?.enum ?? field?.items?.enum;
          const outside = allowed ? [value].flat().filter((v) => !allowed.includes(v)) : [];
          if (outside.length) {
            problems.push(`${scenario.id} wants ${argument} ${outside.join(', ')}, which the enum of ${tool.name} does not allow`);
          }
        }
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
  // The other way round: a phrase written text quotes as the words of a request
  // must not be the words of a scenario. Four words in a row miss a short one —
  // «подними переписку» in prose, «подними переписку в Релизах» in the set — and
  // a model that met the example would pass the scenario on recall. Prose is not
  // the only text that quotes: the instructions once quoted the very words of
  // five scenarios, which then measured recall rather than understanding. So
  // every hand-written text a model reads is held to it, and only `QUOTED_TERMS`
  // excuses a word, with the reason it is no example to copy.
  const quoting: Array<{ who: string; lines: string[] }> = [
    ...Object.entries(MCP_TOOL_PROSE).map(([name, prose]) => ({
      who: `prose of ${name} quotes`,
      lines: [prose.description ?? '', ...(prose.whenToUse ?? []), ...(prose.notFor ?? []), ...Object.values(prose.arguments ?? {})],
    })),
    { who: 'the server instructions quote', lines: [SERVER_INSTRUCTIONS] },
    { who: 'MOMENT_ARGUMENT quotes', lines: [MOMENT_ARGUMENT.description] },
    { who: 'QUERY_ARGUMENT quotes', lines: [QUERY_ARGUMENT.description] },
    { who: 'SECRET_NOTE quotes', lines: [SECRET_NOTE] },
    { who: 'DRAFT_ARGUMENT quotes', lines: [DRAFT_ARGUMENT.description] },
    { who: 'VIEW_ARGUMENT quotes', lines: Object.values(VIEW_ARGUMENT.description) },
    { who: 'REFUSALS quote', lines: Object.values(REFUSALS) },
    { who: 'RESPONSE_FORMAT quotes', lines: readable.filter((r) => r.where === 'the response format').map((r) => r.text) },
  ];
  const termsQuoted = new Set<string>();
  for (const { who, lines } of quoting) {
    for (const line of lines) {
      for (const [, phrase] of line.matchAll(/«([^»]+)»/g)) {
        if (phrase! in QUOTED_TERMS) {
          termsQuoted.add(phrase!);
          continue;
        }
        const run = wordsOf(phrase!);
        const hit = run.length ? TOOL_SCENARIOS.find((s) => containsRun(wordsOf(s.prompt), run)) : undefined;
        if (hit) problems.push(`${who} «${phrase}», and ${hit.id} asks in those words — a copied example would pass`);
      }
    }
  }
  for (const [term, why] of Object.entries(QUOTED_TERMS)) {
    if (!why.trim()) problems.push(`QUOTED_TERMS excuses «${term}» without a reason`);
    if (!termsQuoted.has(term)) problems.push(`QUOTED_TERMS excuses «${term}», which no written text quotes any more`);
  }

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
          const field = argumentAt(t.inputSchema, argument);
          return Array.isArray(field?.examples) && field.examples.includes(value) && !field.enum;
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
  // A service tool is listed the way it is served, and costs what it is served as.
  const serviceListing = SERVICE_TOOLS.map((t: McpServiceTool) => ({
    // One platform's research mode looks for search and fetch by these exact
    // names, so a compatibility tool goes without the prefix.
    name: t.compat ? t.name : `${TOOL_PREFIX}${t.name}`,
    title: t.title,
    kind: t.kind,
    compat: Boolean(t.compat),
    operations: t.operations,
    scopes: serviceScopes.get(t.name) ?? [],
    description: t.description,
    annotations: {
      readOnlyHint: t.kind === 'read',
      destructiveHint: t.kind === 'write',
      idempotentHint: t.kind === 'read',
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(t.input.map(({ name, required: _r, ...rest }) => [name, rest as JsonSchema])),
      ...(t.input.some((f) => f.required) ? { required: t.input.filter((f) => f.required).map((f) => f.name) } : {}),
      additionalProperties: false,
    } as JsonSchema,
    ...(t.outputSchema ? { outputSchema: t.outputSchema as JsonSchema } : {}),
    untrusted: serviceText.get(t.name)?.untrusted ?? [],
  }));
  for (const service of serviceListing) {
    problems.push(...lintSchema(`service tool ${service.name}`, service.inputSchema));
    compile(`service tool ${service.name}`, service.inputSchema);
    if (service.outputSchema) compile(`service tool ${service.name} answer`, service.outputSchema);
  }
  const served = SERVICE_TOOLS.filter((t) => !t.compat);
  const serviceCost = serviceListing
    .filter((t) => !t.compat)
    .reduce((sum, t) => sum + modelTokens({ name: t.name.replace(TOOL_PREFIX, ''), description: t.description, inputSchema: t.inputSchema }), 0);
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
  // Every tool reaches a listing, and every role and plan a tool answers to has
  // one: a plan the listings do not know, or a role that has no listing on it,
  // would hide the method from the very token it was made for.
  for (const tool of tools) {
    if (!Object.values(audiences).some((a) => a.tools.includes(`${TOOL_PREFIX}${tool.name}`))) {
      problems.push(`${tool.name} is in no listing (roles ${tool.roles.join(', ') || 'none'}, plan ${tool.plan ?? 'any'})`);
    }
    if (tool.plan && !AUDIENCES.some((a) => a.plan === tool.plan)) problems.push(`${tool.name} needs the ${tool.plan} plan, which no listing has`);
    for (const role of tool.roles) {
      if (!AUDIENCES.some((a) => a.role === role && (!tool.plan || a.plan === tool.plan))) {
        problems.push(`${tool.name} answers to ${role}${tool.plan ? ` on the ${tool.plan} plan` : ''}, and no listing is for that`);
      }
    }
  }

  if (problems.length) {
    console.error('MCP manifest not built:');
    for (const p of [...new Set(problems)].sort()) console.error(`  - ${p}`);
    process.exit(1);
  }

  const content = {
    schema_version: SCHEMA_VERSION,
    server: SERVER_INFO,
    instructions: SERVER_INSTRUCTIONS,
    instruction_placeholders: INSTRUCTION_PLACEHOLDERS,
    cache: CACHE_POLICY,
    response_format: RESPONSE_FORMAT,
    refusals: REFUSALS,
    compact_projections: COMPACT_PROJECTIONS,
    single_read_omit: Object.fromEntries(Object.entries(SINGLE_READ_OMIT).map(([entity, groups]) => [entity, groups.flatMap((g) => g.fields)])),
    authors: AUTHOR_FIELDS,
    web_links: WEB_LINKS,
    compat_address: COMPAT_ADDRESS,
    files: FILE_SOURCES,
    tools: tools.map((t) => ({
      name: `${TOOL_PREFIX}${t.name}`,
      title: t.title,
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
      untrusted: t.text.untrusted,
    })),
    service_tools: serviceListing,
    audiences,
  };
  // The digest is of what the manifest says, whichever input it came from — the
  // spec, its translation, the rules or the prose — so equal digests mean equal
  // manifests, and a cache keyed by it never serves an old one.
  const { schema_version, ...rest } = content;
  const manifest = {
    schema_version,
    generated_from: { digest: crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16) },
    ...rest,
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
    ...tools.flatMap((t) => [
      t.scope,
      ...Object.values(t.request.arguments).flatMap((p) => [...(p.scopes ?? []), ...(p.effect?.kind === 'after' ? p.effect.scopes : [])]),
    ]),
    ...[...serviceScopes.values()].flat(),
  ].filter(Boolean));
  // What a client that loads tools on demand pays: the names of the widest
  // listing up front, then one tool at a time. The answer schemas are the
  // client's to check results against and never reach the model.
  const costs = tools.map((t) => ({ name: t.name, tokens: modelTokens(t) })).sort((a, b) => a.tokens - b.tokens);
  const middle = costs.length >> 1;
  const median = costs.length % 2 ? costs[middle]!.tokens : Math.round((costs[middle - 1]!.tokens + costs[middle]!.tokens) / 2);
  const largest = costs.slice(-3).reverse().map((c) => `${c.name} ~${c.tokens}`).join(', ');
  const widest = Object.values(audiences).reduce((a, b) => (b.tools.length > a.tools.length ? b : a));
  const nameCost = approxTokens(widest.tools.join(''));
  const answers = approxTokens(tools.map((t) => (t.outputSchema ? JSON.stringify(t.outputSchema) : '')).join(''));
  console.log(
    `MCP manifest: ${tools.length} tools from ${operations.length} operations ` +
      `(${Object.keys(CHAIN_STEPS).length} folded as chain steps), ${withProse} with written prose, ` +
      `${scopes.size} scopes, ${TOOL_SCENARIOS.length} scenarios. Not tools, as steps of the OAuth flow: ${oauthFlow.join(', ') || 'none'}. ` +
      `Listings: ${listings}. Per tool: median ~${median}, largest ${largest}; names of the widest listing ~${nameCost}; ` +
      `outputSchema of the set ~${answers}, not shown to the model.`,
  );
}

build();
