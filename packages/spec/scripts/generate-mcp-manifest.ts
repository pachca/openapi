/**
 * Build the MCP tool manifest from the curated core and the live spec.
 *
 * The backend does not keep its own list of tools — it loads this manifest.
 * Everything the server needs to enforce comes from here: which tools exist,
 * which API operation each one stands on, which scope it requires and whether a
 * human is asked before the call goes through.
 *
 * Scopes are never written by hand. They are read from `x-requirements.scope`
 * of the operation the tool stands on, so a permission change in the spec
 * cannot drift away from the manifest.
 *
 * The build fails — it does not warn — when:
 *   - a tool points at an operation that does not exist in `openapi.yaml`;
 *   - a tool has no prose, or prose exists for a tool that is not in the core;
 *   - a name is duplicated, is not snake_case, or exceeds 64 characters;
 *   - an operation of the spec is neither in a tool nor refused on purpose —
 *     the server does everything the public API offers, and that check is what
 *     keeps a newly added API method from silently ending up nowhere;
 *   - the listing some role receives is over the tool count or the token budget.
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
  COMPACT_PROJECTIONS,
  RESPONSE_FORMAT,
  MCP_CORE,
  OUT_OF_SCOPE,
  REFUSALS,
  SERVER_INFO,
  SERVER_INSTRUCTIONS,
  SERVICE_TOOLS,
  TOOL_PREFIX,
  type McpCoreTool,
  type McpServiceTool,
  type ToolField,
  type ToolOperation,
} from '../mcp-core';
import { ANSWER_SCENARIOS, TOOL_SCENARIOS, type ToolScenario } from '../mcp-scenarios';
import { MCP_TOOL_PROSE } from '../mcp-tools';

const SPEC_PATH = path.join(import.meta.dir, '..', 'openapi.yaml');
/** Argument descriptions come from the English spec — models read the manifest. */
const SPEC_EN_PATH = path.join(import.meta.dir, '..', 'openapi.en.yaml');
const OUT_PATH = path.join(import.meta.dir, '..', 'mcp-manifest.json');
/** The contract a consumer validates against before it boots. */
const SCHEMA_PATH = path.join(import.meta.dir, '..', 'mcp-manifest.schema.json');

/** Manifest schema version. Bump the major when consumers must be updated. */
const SCHEMA_VERSION = '1.0.0';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface SpecOperation {
  method: string;
  path: string;
  scope: string | null;
  summary: string;
}

function key(op: { method: string; path: string }): string {
  return `${op.method.toUpperCase()} ${op.path}`;
}

/** Every operation in the spec, keyed by "METHOD /path". */
function readSpec(): Map<string, SpecOperation> {
  const doc = yaml.load(fs.readFileSync(SPEC_PATH, 'utf8')) as {
    paths: Record<string, Record<string, { summary?: string; 'x-requirements'?: { scope?: string } }>>;
  };
  const out = new Map<string, SpecOperation>();
  for (const [p, item] of Object.entries(doc.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = item[method];
      if (!op) continue;
      out.set(key({ method, path: p }), {
        method: method.toUpperCase(),
        path: p,
        scope: op['x-requirements']?.scope ?? null,
        summary: op.summary ?? '',
      });
    }
  }
  return out;
}

/** Union of the scopes of every operation a tool stands on. */
function scopesFor(tool: McpCoreTool, spec: Map<string, SpecOperation>): string[] {
  const scopes = new Set<string>();
  for (const op of tool.operations) {
    const found = spec.get(key(op));
    if (found?.scope) scopes.add(found.scope);
  }
  return [...scopes].sort();
}


/* ── Argument schemas ──────────────────────────────────────────────────────
 * Built from the field bindings in `mcp-core.ts` against the English spec.
 * Everything is inlined: clients choke on `$ref`, `allOf` and `oneOf`, so the
 * generated schema is a flat object with plain types.
 */

interface JsonSchema {
  type?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: { type: string };
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

type YamlNode = Record<string, any>;

/** Resolve `$ref` and collapse a single-branch `allOf`, keeping siblings. */
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

/** `[opIndex:]location.path` → the schema fragment it points at. */
function resolveBinding(
  field: ToolField,
  tool: McpCoreTool,
  doc: YamlNode
): { schema: any; description?: string } | null {
  const raw = field.from!;
  const [prefix, rest] = raw.includes(':') ? raw.split(':') : ['0', raw];
  const opIndex = Number(prefix);
  const op = tool.operations[opIndex];
  if (!op) return null;
  const item = doc.paths?.[op.path]?.[op.method.toLowerCase()];
  if (!item) return null;

  const dot = rest.indexOf('.');
  const where = rest.slice(0, dot);
  const target = rest.slice(dot + 1);

  if (where === 'query' || where === 'path') {
    const param = (item.parameters ?? []).find((p: any) => p.in === where && p.name === target);
    if (!param) return null;
    return { schema: flatten(param.schema, doc), description: param.description };
  }

  if (where === 'body') {
    let node = flatten(item.requestBody?.content?.['application/json']?.schema, doc);
    let description: string | undefined;
    for (const segment of target.split('.')) {
      node = flatten(node, doc);
      const next = node?.properties?.[segment];
      if (!next) return null;
      description = next.description ?? description;
      node = next;
    }
    return { schema: flatten(node, doc), description };
  }

  return null;
}

/** Only the vocabulary clients handle reliably survives into the manifest. */
function plainType(schema: any): { type: string; enum?: string[]; items?: { type: string } } {
  const t = schema?.type ?? 'string';
  if (t === 'array') {
    const inner = schema.items?.type ?? 'string';
    return { type: 'array', items: { type: inner === 'number' ? 'number' : inner } };
  }
  const out: { type: string; enum?: string[] } = { type: t === 'number' ? 'number' : t };
  if (Array.isArray(schema?.enum)) out.enum = schema.enum.map(String);
  return out;
}

function buildInputSchema(tool: McpCoreTool | (McpServiceTool & { operations?: ToolOperation[] }), docEn: YamlNode): { schema: JsonSchema; problems: string[] } {
  const problems: string[] = [];
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const field of tool.input) {
    let base: { type: string; enum?: string[]; items?: { type: string } } = { type: field.type ?? 'string' };
    let description = field.description;

    if (field.from) {
      const bound = resolveBinding(field, tool as McpCoreTool, docEn);
      if (!bound) {
        problems.push(`${tool.name}.${field.name} binds to "${field.from}", which the spec does not have`);
        continue;
      }
      base = plainType(bound.schema);
      description = description ?? bound.description;
    } else if (!field.description) {
      problems.push(`${tool.name}.${field.name} is synthetic and needs its own description`);
    }

    if (field.type) base.type = field.type;
    if (field.items) base.items = { type: field.items };
    if (field.enum) base.enum = field.enum;

    const property: JsonSchema = { type: base.type };
    if (base.enum) property.enum = base.enum;
    if (base.items) property.items = base.items;
    if (field.default !== undefined) property.default = field.default;
    if (description) property.description = description.replace(/\s+/g, ' ').trim();

    properties[field.name] = property;
    if (field.required) required.push(field.name);
  }

  const schema: JsonSchema = { type: 'object', properties, additionalProperties: false };
  if (required.length > 0) schema.required = required;
  return { schema, problems };
}


/* ── Response schemas ──────────────────────────────────────────────────────
 * Which entity a tool returns is not declared by hand — it is read from the
 * success response of its last operation. Only the projection is curated, so a
 * tool cannot claim to return something the API does not.
 */

/** The entity behind a success response, and whether it comes as a list. */
function responseEntity(
  op: ToolOperation,
  doc: YamlNode
): { entity: string; list: boolean; wrapped: boolean } | null {
  const item = doc.paths?.[op.path]?.[op.method.toLowerCase()];
  const responses = item?.responses ?? {};
  const ok = responses['200'] ?? responses['201'];
  const schema = ok?.content?.['application/json']?.schema;
  if (!schema) return null;
  // Most responses wrap the payload in `data`; a few return the entity itself.
  const data = flatten(schema, doc)?.properties?.data;
  const carrier = data ?? schema;
  const ref = carrier.$ref ?? carrier.items?.$ref;
  if (!ref) return null;
  return { entity: String(ref).split('/').pop()!, list: Boolean(carrier.items), wrapped: Boolean(data) } as any;
}

/** Build a nested object schema from dotted projection paths. */
function project(entity: string, doc: YamlNode): { schema: JsonSchema; problems: string[] } {
  const problems: string[] = [];
  const fields = COMPACT_PROJECTIONS[entity];
  const source = flatten(doc.components?.schemas?.[entity], doc);
  if (!fields) {
    return { schema: { type: 'object' }, problems: [`no compact projection declared for ${entity}`] };
  }
  if (!source?.properties) {
    return { schema: { type: 'object' }, problems: [`${entity} is not an object in the spec`] };
  }

  const root: JsonSchema = { type: 'object', properties: {}, additionalProperties: true };
  for (const field of fields) {
    const [head, ...rest] = field.split('.');
    const prop = flatten(source.properties[head!], doc);
    if (!prop) {
      problems.push(`${entity}.${field}: the spec has no field "${head}"`);
      continue;
    }
    if (rest.length === 0) {
      root.properties![head!] = { ...plainType(prop), description: prop.description };
      continue;
    }
    // Nested: either an object or an array of objects.
    const isArray = prop.type === 'array';
    const inner = flatten(isArray ? prop.items : prop, doc);
    const leaf = flatten(inner?.properties?.[rest[0]!], doc);
    if (!leaf) {
      problems.push(`${entity}.${field}: the spec has no nested field "${rest[0]}"`);
      continue;
    }
    const existing = root.properties![head!];
    const target: JsonSchema =
      existing ??
      (isArray
        ? { type: 'array', items: { type: 'object' } as any, description: prop.description }
        : { type: 'object', properties: {}, description: prop.description });
    const bag: JsonSchema = isArray ? ((target as any).items as JsonSchema) : target;
    bag.type = 'object';
    bag.properties = bag.properties ?? {};
    bag.properties[rest[0]!] = { ...plainType(leaf), description: leaf.description };
    root.properties![head!] = target;
  }

  for (const prop of Object.values(root.properties ?? {})) {
    if (prop.description) prop.description = prop.description.replace(/\s+/g, ' ').trim();
  }
  return { schema: root, problems };
}

/**
 * Response schemas keep descriptions only where the field name does not carry
 * the meaning.
 *
 * An argument description is a prompt: it shapes the call before it happens and
 * earns its tokens. A description of a result field mostly explains data the
 * model is already looking at, and the same entity card repeats in every tool
 * that returns it — eight copies for a message. Dropping all of them was too
 * blunt, though: a handful of fields are traps whose names say nothing, and the
 * specification names guiding the model through results as a reason output
 * schemas exist at all. So these keep their text and the rest lose it.
 */
const FIELDS_WORTH_EXPLAINING = new Set([
  // Null semantics and mechanics a name cannot carry.
  'thread',
  'root_chat_id',
  'deleted_at',
  // The two independent axes of a chat, which are read as one thing otherwise.
  'channel',
  'public',
]);

function stripDescriptions<T>(node: T, keep = false): T {
  if (Array.isArray(node)) return node.map((item) => stripDescriptions(item, keep)) as unknown as T;
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'description' && !keep) continue;
    out[key] = stripDescriptions(value, FIELDS_WORTH_EXPLAINING.has(key));
  }
  return out as T;
}

function buildOutputSchema(tool: McpCoreTool, doc: YamlNode): { schema: JsonSchema | null; problems: string[] } {
  // The one composite whose result has no single entity behind it: the card of
  // the chat, the thread when one was opened, and the page of messages.
  if (tool.name === 'read_chat') {
    const chat = project('Chat', doc);
    const thread = project('Thread', doc);
    const messages = project('Message', doc);
    return {
      schema: {
        type: 'object',
        properties: {
          chat: chat.schema,
          thread: thread.schema,
          messages: { type: 'array', items: messages.schema as any },
        },
        additionalProperties: true,
      },
      problems: [...chat.problems, ...thread.problems, ...messages.problems],
    };
  }

  // Branches that return different things declare nothing rather than a schema
  // one of them would break.
  if (tool.output === null) return { schema: null, problems: [] };

  // The operation named by the tool, or else the last one that returns a body:
  // for a composite that is usually the final step.
  let found: ReturnType<typeof responseEntity> = null;
  if (tool.output !== undefined) {
    const op = tool.operations[tool.output];
    found = op ? responseEntity(op, doc) : null;
    if (!found) return { schema: null, problems: [`${tool.name}: output names operation ${tool.output}, which returns no entity`] };
  } else {
    for (const op of tool.operations) {
      const candidate = responseEntity(op, doc);
      if (candidate) found = candidate;
    }
  }
  // No body in the response — nothing to declare, and declaring an empty schema
  // would oblige the server to return structured content it does not have.
  if (!found) return { schema: null, problems: [] };

  const { schema, problems } = project(found.entity, doc);
  if (!found.wrapped) return { schema, problems };
  return {
    schema: found.list
      ? { type: 'object', properties: { data: { type: 'array', items: schema as any } }, additionalProperties: true }
      : { type: 'object', properties: { data: schema }, additionalProperties: true },
    problems,
  };
}


/**
 * Keep the manifest and the schema we publish alongside it from drifting apart.
 * A full JSON Schema validator lives on the consumer side, in the language that
 * loads the manifest; here the point is narrower and cheap: every field we emit
 * must be described, and every field the schema demands must be emitted. Either
 * half going missing is how a schema quietly stops meaning anything.
 */
function checkAgainstSchema(manifest: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

  const compare = (value: unknown, node: any, at: string): void => {
    if (!node || typeof value !== 'object' || value === null || Array.isArray(value)) return;
    // A node without `properties`, or one that allows additional ones, is open
    // on purpose: a refusal catalogue keyed by status code, per-tool error
    // hints, an argument schema. Looking inside it is not the schema's job.
    const open = !node.properties || node.additionalProperties;
    const described = node.properties ?? {};
    if (!open) {
      for (const field of Object.keys(value as Record<string, unknown>)) {
        if (!described[field]) {
          problems.push(`${at}${field} is emitted but the schema does not describe it`);
          continue;
        }
        compare((value as Record<string, unknown>)[field], described[field], `${at}${field}.`);
      }
    }
    for (const field of node.required ?? []) {
      if (!(field in (value as Record<string, unknown>))) {
        problems.push(`${at}${field} is required by the schema and not emitted`);
      }
    }
  };

  compare(manifest, schema, '');

  const toolNode = schema.$defs?.tool;
  for (const list of ['tools', 'compat_tools'] as const) {
    for (const tool of (manifest[list] as Array<Record<string, unknown>>) ?? []) {
      compare(tool, toolNode, `${list}[${String(tool.name)}].`);
    }
  }
  return problems;
}

/**
 * The full annotation set, every hint explicit. A missing hint is read as its
 * default, and a default nobody chose is a silent gap: clients gate their
 * confirmations and filters on exactly these four.
 *
 * `openWorldHint` is true everywhere. Every tool talks to a live service whose
 * contents other people change while the agent works, and whose text those
 * people write. That is an open world, whatever the workspace boundary
 * suggests, and calling it closed would understate the very risk we spend the
 * most care on.
 */
function annotationsFor(tool: { kind: string; destructive?: boolean; idempotent?: boolean }): Record<string, boolean> {
  return {
    readOnlyHint: tool.kind === 'read',
    destructiveHint: Boolean(tool.destructive),
    idempotentHint: tool.kind === 'read' ? true : Boolean(tool.idempotent),
    openWorldHint: true,
  };
}

/**
 * The protocol carries one description per tool, while the prose is written in
 * parts. Composing here rather than leaving it to the server means what a model
 * reads is decided in one place and reviewed as a whole; the parts stay in the
 * manifest for tooling that wants them apart.
 */
function composeDescription(
  prose: {
    description: string;
    whenToUse?: string[];
    notFor?: string[];
    examples?: string[];
    errorHints?: Record<string, string>;
  },
  branchTexts: string[] = [],
): string {
  const out = [[prose.description, ...branchTexts].join(' ')];
  if (prose.whenToUse?.length) out.push('', 'Use it when:', ...prose.whenToUse.map((x) => `- ${x}`));
  if (prose.notFor?.length) out.push('', 'Not for:', ...prose.notFor.map((x) => `- ${x}`));
  if (prose.examples?.length) out.push('', 'Examples:', ...prose.examples.map((x) => `- ${x}`));
  const hints = Object.entries(prose.errorHints ?? {});
  if (hints.length) out.push('', 'If it fails:', ...hints.map(([code, what]) => `- ${code}: ${what}`));
  return out.join('\n');
}

/* ── Who sees what ─────────────────────────────────────────────────────────
 * The listing is assembled per token: a tool appears when at least one of its
 * branches is open to the caller, and inside it only the arguments and enum
 * values of open branches remain. The specification allows exactly this — the
 * list may vary by the authorization presented, never by the connection — and
 * the manifest carries everything the server needs to do it: per branch, the
 * scope, the roles that may hold it, the plan and whether it wants a bot token.
 *
 * The owner can hold every scope, so the owner's listing is the largest there
 * is and the budgets below are checked against it, as well as every other role.
 */

type Role = 'owner' | 'admin' | 'user' | 'bot';
const ALL_ROLES: Role[] = ['owner', 'admin', 'user', 'bot'];

/**
 * The listings the server serves. The role decides almost everything; the plan
 * matters only to the owner, the one role the Corporation-only methods are for.
 */
const AUDIENCES: Array<{ key: string; role: Role; plan: string | null }> = [
  { key: 'owner:corporation', role: 'owner', plan: 'corporation' },
  { key: 'owner', role: 'owner', plan: null },
  { key: 'admin', role: 'admin', plan: null },
  { key: 'user', role: 'user', plan: null },
  { key: 'bot', role: 'bot', plan: null },
];

const normaliseScope = (scope: string): string => scope.replace(/[:.]/g, '_');

interface BranchAccess {
  scope: string | null;
  roles: Role[];
  plan: string | null;
  botTokenOnly: boolean;
}

function branchAccess(op: ToolOperation, docEn: YamlNode): BranchAccess {
  const item = docEn.paths?.[op.path]?.[op.method.toLowerCase()];
  const requirements = item?.['x-requirements'] ?? {};
  const scope: string | null = requirements.scope ?? null;
  const botTokenOnly = BOT_TOKEN_ONLY.has(key(op));
  const table = docEn.components?.schemas?.OAuthScope?.['x-scope-roles'] ?? {};
  let roles: Role[] = scope ? ((table[normaliseScope(scope)] ?? []) as Role[]) : [...ALL_ROLES];
  if (botTokenOnly) roles = roles.includes('bot') || !scope ? ['bot'] : [];
  return { scope, roles, plan: requirements.plan ?? null, botTokenOnly };
}

function isOpen(access: BranchAccess, audience: (typeof AUDIENCES)[number]): boolean {
  return access.roles.includes(audience.role) && (!access.plan || access.plan === audience.plan);
}

/** Branch texts of the open branches, in operation order, each once. */
function branchTexts(tool: McpCoreTool, open: boolean[]): string[] {
  const texts = MCP_TOOL_PROSE[tool.name]?.branchText ?? {};
  const out: string[] = [];
  tool.operations.forEach((op, i) => {
    const text = texts[key(op)];
    if (open[i] && text && !out.includes(text)) out.push(text);
  });
  return out;
}

/** Paging and detail level serve whichever branch runs. */
const SHARED_FIELDS = new Set(['limit', 'cursor', 'view']);

/** Operation indices a field belongs to; null when it serves every branch. */
function fieldOps(field: ToolField): number[] | null {
  if (field.ops) return field.ops;
  if (SHARED_FIELDS.has(field.name)) return null;
  if (field.from) return [Number(field.from.includes(':') ? field.from.split(':')[0] : 0)];
  return null;
}

/** The input schema one audience receives: closed branches take their fields and values along. */
function schemaFor(tool: McpCoreTool, schema: JsonSchema, open: boolean[]): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  for (const field of tool.input) {
    const ops = fieldOps(field);
    if (ops && !ops.some((i) => open[i])) continue;
    const prop = { ...schema.properties![field.name]! };
    if (field.branches && prop.enum) {
      prop.enum = prop.enum.filter((value) => (field.branches![value] ?? []).some((i) => open[i]));
    }
    properties[field.name] = prop;
  }
  const required = (schema.required ?? []).filter((name) => name in properties);
  return { ...schema, properties, ...(required.length ? { required } : {}) };
}

/**
 * What a tool costs the model. Clients hand the model the name, the
 * description and the argument schema; the title goes to the interface, the
 * annotations to the confirmation dialog, and the result schema is used to
 * check the answer — none of them reach the context. Codex, Gemini CLI and VS
 * Code were read at the source to establish this. Roughly 3.7 characters per
 * token for English prose and JSON punctuation.
 */
function modelTokens(tool: { name: string; description: string; inputSchema: JsonSchema }): number {
  const visible = { name: tool.name, description: tool.description, input_schema: tool.inputSchema };
  return Math.round(JSON.stringify(visible).length / 3.7);
}

/**
 * Several clients ask for the tool list once and never follow the cursor, so a
 * tool on a second page is invisible without a single error. Every listing has
 * to fit one page, and accuracy of choice falls past a few dozen similar tools,
 * so thirty is the ceiling for the largest listing any role receives.
 */
const MAX_TOOLS_IN_LISTING = 30;

/**
 * What the largest listing may cost the model, instructions included. Clients
 * that load everything pay it on every turn; clients that search for tools start
 * searching around ten thousand. Thirteen thousand is the target, sixteen the
 * ceiling the build enforces.
 */
const MAX_LISTING_TOKENS = 16_000;

/**
 * One tool, whatever the listing. One platform refuses a tool over five
 * thousand tokens and another drops the argument schema of a long one, so a
 * single tool never gets anywhere near either.
 */
const MAX_TOOL_TOKENS = 1_500;

/**
 * Client lint. Several popular clients silently drop a tool whose schema uses
 * composition keywords, so the manifest must not contain them at all: the
 * schema is a flat object with plain types, and that is checked, not assumed.
 */
const FORBIDDEN_KEYWORDS = ['$ref', 'allOf', 'oneOf', 'anyOf', 'not'];

function lintSchema(name: string, schema: JsonSchema): string[] {
  const problems: string[] = [];
  if (schema.type !== 'object') problems.push(`${name}: schema root must be an object`);
  const walk = (node: unknown, at: string): void => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_KEYWORDS.includes(k)) problems.push(`${name}: ${at}${k} is not allowed in a tool schema`);
      walk(v, `${at}${k}.`);
    }
  };
  walk(schema, '');
  return problems;
}


/**
 * Checks on the prose itself, needing no model.
 *
 * A judged run measures whether descriptions actually route a request to the
 * right tool, and that costs a model and a decision about keys. These are the
 * things worth catching before any of that: a reference to a tool that no
 * longer exists, a pair of confusable tools where only one side warns about the
 * other, a request that two tools both claim. They are cheap, deterministic and
 * fail the build like everything else here.
 */
function proseChecks(): string[] {
  const problems: string[] = [];
  const names = new Set([...MCP_CORE.map((t) => t.name), ...SERVICE_TOOLS.map((t) => t.name)]);
  // Argument names are quoted in backticks too; `list_tags` is a field, not a
  // missing tool.
  const argumentNames = new Set([...MCP_CORE, ...SERVICE_TOOLS].flatMap((t) => t.input.map((f) => f.name)));
  const referenced = (text: string): string[] =>
    [...text.matchAll(/`([a-z][a-z0-9_]*)`/g)].map((m) => m[1]!).filter((n) => names.has(n) || n.includes('_'));

  const claimed = new Map<string, string[]>();

  for (const [name, prose] of Object.entries(MCP_TOOL_PROSE)) {
    const surfaces = [...prose.notFor, ...(prose.nextSteps ?? [])];
    for (const line of surfaces) {
      for (const ref of referenced(line)) {
        // Only bare tool names are treated as references; anything else in
        // backticks is a field or a parameter and is left alone.
        if (
          !names.has(ref) &&
          !argumentNames.has(ref) &&
          /^(search|read|list|send|reply|create|add|remove|update|get|save|export|handle)_/.test(ref)
        ) {
          problems.push(`${name} points at "${ref}", which is not a tool`);
        }
      }
    }
    for (const prompt of prose.goldenPrompts ?? []) {
      const owners = claimed.get(prompt) ?? [];
      owners.push(name);
      claimed.set(prompt, owners);
    }
  }

  for (const [prompt, owners] of claimed) {
    if (owners.length > 1) {
      problems.push(`the request "${prompt}" is claimed by ${owners.join(' and ')} — an eval cannot score it`);
    }
  }

  // Both halves of a confusable pair must name the other, otherwise the warning
  // only reaches an agent that already opened the right tool.
  const PAIRS: Array<[string, string]> = [
    ['send_message', 'reply_in_thread'],
    ['create_chat', 'reply_in_thread'],
    ['read_chat', 'read_message'],
    ['list_users', 'read_user'],
    ['update_chat', 'update_chat_members'],
    ['update_message', 'delete'],
  ];
  // save_user already names update_my_profile. The reverse pointer is left out
  // on purpose: an employee sees update_my_profile without save_user, and a
  // description must not name a tool its reader does not have.
  for (const [a, b] of PAIRS) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ]) {
      const prose = MCP_TOOL_PROSE[from!];
      const mentions = [prose?.description ?? '', ...(prose?.notFor ?? [])].join(' ');
      if (!mentions.includes(`\`${to}\``)) {
        problems.push(`${from} never names ${to}, though the two are easy to confuse`);
      }
    }
  }

  // The scenario set is checked like everything else: a scenario naming a tool
  // that no longer exists would fail a run for a reason that has nothing to do
  // with the prose being measured.
  const seenIds = new Set<string>();
  const seenPrompts = new Set<string>();
  for (const scenario of TOOL_SCENARIOS) {
    if (seenIds.has(scenario.id)) problems.push(`duplicate scenario id: ${scenario.id}`);
    seenIds.add(scenario.id);
    if (seenPrompts.has(scenario.prompt)) problems.push(`two scenarios ask the same thing: ${scenario.prompt}`);
    seenPrompts.add(scenario.prompt);
    if (scenario.accept.length === 0) problems.push(`${scenario.id} accepts no tool at all`);
    for (const tool of scenario.accept) {
      // "none" and "ask" are legitimate answers that name no tool: the first
      // says the surface does not carry this at all, the second says the
      // request does not carry what the tool needs.
      if (tool !== 'none' && tool !== 'ask' && !names.has(tool)) {
        problems.push(`${scenario.id} expects "${tool}", which is not a tool`);
      }
    }
  }

  // A run shows the model a person's listing, so tools only a bot token ever
  // receives are measured elsewhere or not at all — they are not demanded here.
  const covered = new Set(TOOL_SCENARIOS.flatMap((s) => s.accept));
  for (const tool of MCP_CORE) {
    if (tool.operations.every((op) => BOT_TOKEN_ONLY.has(key(op)))) continue;
    if (!covered.has(tool.name)) problems.push(`no scenario reaches ${tool.name} — its description is unmeasured`);
  }

  // An example in a description is read by the model under test. If it carries
  // a number from a scenario prompt, the run is grading whether the model can
  // copy — and it can: in one run a deadline from an example turned up verbatim
  // in four calls out of nine, a value no model had picked on its own. Numbers
  // of three digits and more are ids, dates and times; they must not overlap.
  const promptNumbers = new Set(
    [...TOOL_SCENARIOS, ...ANSWER_SCENARIOS].flatMap((sc) => sc.prompt.match(/\d{3,}/g) ?? []),
  );
  for (const [tool, prose] of Object.entries(MCP_TOOL_PROSE)) {
    for (const example of prose.examples ?? []) {
      for (const n of example.match(/\d{3,}/g) ?? []) {
        if (promptNumbers.has(n)) {
          problems.push(`${tool} example reuses ${n} from a scenario prompt — the run would measure copying`);
        }
      }
    }
  }

  return problems;
}

/**
 * An assertion about arguments is only worth running if it is true of the
 * manifest: a scenario naming an argument the tool does not take, or a value
 * its enum does not allow, would fail every run for a reason that has nothing
 * to do with the model. The same for confirmation — demanding a yes before a
 * call that never asks measures nothing.
 */
function scenarioArgChecks(
  scenario: ToolScenario,
  built: Array<{ name: string; inputSchema: JsonSchema; confirm: string }>,
): string[] {
  const problems: string[] = [];
  const tools = scenario.accept
    .filter((n) => n !== 'none' && n !== 'ask')
    .map((n) => built.find((t) => t.name === `${TOOL_PREFIX}${n}`))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (scenario.args) {
    if (tools.length === 0) {
      problems.push(`${scenario.id} asserts arguments but accepts no tool that takes any`);
    }
    const named = [
      ...Object.keys(scenario.args.must ?? {}),
      ...(scenario.args.present ?? []),
      ...(scenario.args.absent ?? []),
    ];
    for (const arg of named) {
      // The assertion has to hold for at least one accepted tool; several
      // scenarios accept a pair, and only one of them carries the argument.
      const carrier = tools.find((t) => arg in ((t.inputSchema.properties ?? {}) as object));
      if (!carrier) {
        problems.push(`${scenario.id} asserts "${arg}", which none of its tools takes`);
      }
    }
    for (const [arg, value] of Object.entries(scenario.args.must ?? {})) {
      for (const tool of tools) {
        const prop = ((tool.inputSchema.properties ?? {}) as Record<string, JsonSchema>)[arg];
        const allowed = prop?.enum;
        if (Array.isArray(allowed) && !allowed.includes(value as never)) {
          problems.push(
            `${scenario.id} expects ${arg}=${String(value)}, which ${tool.name} does not allow`,
          );
        }
      }
    }
    for (const arg of scenario.args.present ?? []) {
      if (arg in (scenario.args.must ?? {})) {
        problems.push(`${scenario.id} asserts "${arg}" twice, as a value and as present`);
      }
    }
    for (const arg of scenario.args.absent ?? []) {
      if (arg in (scenario.args.must ?? {}) || (scenario.args.present ?? []).includes(arg)) {
        problems.push(`${scenario.id} both requires and forbids "${arg}"`);
      }
    }
  }

  if (scenario.confirmFirst === true && tools.length > 0 && tools.every((t) => t.confirm === 'auto')) {
    problems.push(`${scenario.id} demands confirmation, but none of its tools ever asks`);
  }
  if (scenario.confirmFirst === false && tools.length > 0 && tools.every((t) => t.confirm !== 'auto')) {
    // A false is a deliberate counterweight — it must sit on a tool that can
    // ask, otherwise the scenario proves nothing about the boundary.
    if (tools.length === 0) problems.push(`${scenario.id} has nothing to prove`);
  }
  return problems;
}

function validate(spec: Map<string, SpecOperation>): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const tool of MCP_CORE) {
    if (seen.has(tool.name)) problems.push(`duplicate tool name: ${tool.name}`);
    seen.add(tool.name);

    if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) {
      problems.push(`name is not snake_case: ${tool.name}`);
    }
    if ((TOOL_PREFIX + tool.name).length > 64) {
      problems.push(`name longer than 64 characters: ${TOOL_PREFIX}${tool.name}`);
    }
    if (!MCP_TOOL_PROSE[tool.name]) {
      problems.push(`no prose for tool: ${tool.name}`);
    }
    for (const op of tool.operations) {
      if (!spec.has(key(op))) {
        problems.push(`${tool.name} points at an operation missing from the spec: ${key(op)}`);
      }
    }
    if (tool.kind === 'read' && tool.confirm !== 'auto') {
      problems.push(`${tool.name} reads but asks for confirmation — reads have no side effects`);
    }
    for (const op of tool.operations) {
      if (tool.kind === 'read' && op.confirm && op.confirm !== 'auto') {
        problems.push(`${tool.name}: branch ${key(op)} reads but asks for confirmation`);
      }
      // One level of risk per tool: a read branch in a writing tool is fine
      // (picking up a finished export), a write branch in a reading tool is not.
      if (tool.kind === 'read' && op.method !== 'GET') {
        problems.push(`${tool.name} reads, yet its branch ${key(op)} changes something`);
      }
    }
    // A field tied to a branch that does not exist would never be shown, and a
    // value leading nowhere would be offered to every token.
    for (const field of tool.input) {
      for (const i of [...(field.ops ?? []), ...Object.values(field.branches ?? {}).flat()]) {
        if (!tool.operations[i]) problems.push(`${tool.name}.${field.name} points at branch ${i}, which the tool does not have`);
      }
      if (field.branches) {
        for (const value of field.enum ?? []) {
          if (!field.branches[value]) problems.push(`${tool.name}.${field.name}: the value "${value}" leads to no branch`);
        }
      }
    }
    // Every branch must be reachable: by an argument of its own, by a value of
    // a picking argument, or by a stated condition. A branch nothing selects is
    // dead weight the server would never run.
    if (tool.operations.length > 1) {
      tool.operations.forEach((op, i) => {
        const selected =
          Boolean(op.when) ||
          tool.input.some(
            (f) => (fieldOps(f) ?? []).includes(i) || Object.values(f.branches ?? {}).some((ops) => ops.includes(i)),
          );
        if (!selected && i > 0) problems.push(`${tool.name}: no argument leads to ${key(op)}`);
      });
    }
  }

  for (const service of SERVICE_TOOLS) {
    seen.add(service.name);
    if (!MCP_TOOL_PROSE[service.name]) problems.push(`no prose for service tool: ${service.name}`);
    for (const field of service.input) {
      if (!field.description) problems.push(`${service.name}.${field.name} needs a description`);
    }
  }

  for (const name of Object.keys(MCP_TOOL_PROSE)) {
    if (!seen.has(name)) problems.push(`prose for a tool that is not declared: ${name}`);
  }

  // Text tied to a branch the tool does not have would never be shown.
  for (const tool of MCP_CORE) {
    const ops = new Set(tool.operations.map(key));
    for (const op of Object.keys(MCP_TOOL_PROSE[tool.name]?.branchText ?? {})) {
      if (!ops.has(op)) problems.push(`${tool.name} has text for ${op}, which is not one of its branches`);
    }
  }

  for (const op of OUT_OF_SCOPE) {
    if (!spec.has(key(op))) {
      problems.push(`out-of-scope entry missing from the spec: ${key(op)}`);
    }
  }

  // The answer-quality set names operations the agent is supposed to hand over
  // when no tool fits. Those operations live outside the core by definition, so
  // nothing else in this file would notice one being renamed away — and a
  // scenario that asks for a method the API no longer has teaches the run to
  // demand a wrong answer.
  const answerIds = new Set<string>();
  const byPrompt = new Map(TOOL_SCENARIOS.map((s) => [s.prompt, s]));
  for (const scenario of ANSWER_SCENARIOS) {
    if (answerIds.has(scenario.id)) problems.push(`duplicate answer scenario id: ${scenario.id}`);
    answerIds.add(scenario.id);
    // A prompt shared with the tool set is the point, not a duplicate: the two
    // halves measure the same request, first the choice and then the sentence.
    // What they may not do is contradict each other.
    const twin = byPrompt.get(scenario.prompt);
    if (twin && !twin.accept.includes('none')) {
      problems.push(
        `${scenario.id} expects an answer without a tool, but ${twin.id} expects one to be called`,
      );
    }
    for (const op of scenario.mustName) {
      if (!spec.has(key(op))) {
        problems.push(`answer scenario ${scenario.id} names an operation missing from the spec: ${key(op)}`);
      }
    }
    if (scenario.reach === 'api') {
      if (scenario.mustName.length === 0) {
        problems.push(`${scenario.id} says the API can do it but names no method`);
      }
      // An operation the core already covers is not an answer-quality case: the
      // agent would just call the tool, and the scenario would measure nothing.
      for (const op of scenario.mustName) {
        const inCore = MCP_CORE.some((t) => t.operations.some((o) => key(o) === key(op)));
        if (inCore) problems.push(`${scenario.id} names ${key(op)}, which a core tool already covers`);
      }
    } else {
      if (scenario.mustName.length > 0) {
        problems.push(`${scenario.id} is marked absent yet names a method`);
      }
      if (!scenario.nearest) {
        problems.push(`${scenario.id} is marked absent with nothing offered in its place`);
      }
    }
  }

  return problems;
}

/**
 * Core, bridge and out-of-scope must together cover the spec exactly. A new
 * method added to the API therefore cannot stay unplaced: either it lands in
 * the core, or it is reachable through the bridge, or it is refused on purpose.
 */
function partition(spec: Map<string, SpecOperation>): {
  core: string[];
  tail: string[];
  refused: string[];
} {
  const core = new Set<string>();
  for (const tool of MCP_CORE) for (const op of tool.operations) core.add(key(op));
  const refused = new Set(OUT_OF_SCOPE.map(key));
  const tail: string[] = [];
  for (const k of spec.keys()) {
    if (!core.has(k) && !refused.has(k)) tail.push(k);
  }
  return { core: [...core].sort(), tail: tail.sort(), refused: [...refused].sort() };
}


function build(): void {
  const spec = readSpec();
  const docEn = yaml.load(fs.readFileSync(SPEC_EN_PATH, 'utf8')) as YamlNode;

  const schemas = new Map<string, JsonSchema>();
  const outputs = new Map<string, JsonSchema | null>();
  const problems = validate(spec);
  for (const tool of MCP_CORE) {
    const built = buildInputSchema(tool, docEn);
    problems.push(...built.problems, ...lintSchema(tool.name, built.schema));
    schemas.set(tool.name, built.schema);
    const out = buildOutputSchema(tool, docEn);
    problems.push(...out.problems);
    if (out.schema) problems.push(...lintSchema(`${tool.name} (output)`, out.schema));
    outputs.set(tool.name, out.schema ? stripDescriptions(out.schema) : null);
  }

  if (problems.length > 0) {
    console.error('MCP manifest not built:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  problems.push(...proseChecks());

  // Argument assertions need the built schemas, so they run once the tools
  // exist rather than alongside the rest of the scenario checks.
  const forScenarios = [
    ...MCP_CORE.map((t) => ({
      name: `${TOOL_PREFIX}${t.name}`,
      inputSchema: schemas.get(t.name)!,
      confirm: t.confirm as string,
    })),
    ...SERVICE_TOOLS.map((t) => ({
      name: `${TOOL_PREFIX}${t.name}`,
      inputSchema: buildInputSchema(t, docEn).schema,
      confirm: t.confirm as string,
    })),
  ];
  for (const scenario of TOOL_SCENARIOS) {
    problems.push(...scenarioArgChecks(scenario, forScenarios));
  }

  if (problems.length > 0) {
    console.error('MCP manifest not built:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const { core, tail, refused } = partition(spec);
  if (tail.length > 0) {
    console.error('The server does everything the public API offers, but these operations are in no tool:');
    for (const op of tail) console.error(`  - ${op}`);
    process.exit(1);
  }

  const access = new Map(MCP_CORE.map((tool) => [tool.name, tool.operations.map((op) => branchAccess(op, docEn))]));

  const tools = MCP_CORE.map((tool) => {
    const prose = MCP_TOOL_PROSE[tool.name]!;
    const branches = tool.operations.map((op, i) => {
      const a = access.get(tool.name)![i]!;
      const selectedBy = tool.input.flatMap((f) => {
        const byValue = Object.entries(f.branches ?? {})
          .filter(([, ops]) => ops.includes(i))
          .map(([value]) => `${f.name}=${value}`);
        if (byValue.length) return byValue;
        return (fieldOps(f) ?? []).includes(i) ? [f.name] : [];
      });
      return {
        operation: key(op),
        scope: a.scope,
        roles: a.roles,
        ...(a.plan ? { plan: a.plan } : {}),
        ...(a.botTokenOnly ? { bot_token_only: true } : {}),
        confirm: op.confirm ?? tool.confirm,
        arguments: selectedBy,
        ...(op.when ? { when: op.when } : {}),
      };
    });
    return {
      name: `${TOOL_PREFIX}${tool.name}`,
      title: prose.title,
      // The union of every branch. What a token actually receives is in
      // `audiences`, assembled from the branches open to it.
      description: composeDescription(prose, branchTexts(tool, tool.operations.map(() => true))),
      whenToUse: prose.whenToUse,
      notFor: prose.notFor,
      examples: prose.examples ?? [],
      errorHints: prose.errorHints ?? {},
      nextSteps: prose.nextSteps ?? [],
      inputSchema: schemas.get(tool.name)!,
      ...(outputs.get(tool.name) ? { outputSchema: outputs.get(tool.name)! } : {}),
      operations: tool.operations.map((op) => key(op)),
      branches,
      scopes: scopesFor(tool, spec),
      confirm: tool.confirm,
      annotations: annotationsFor(tool),
    };
  });

  // Everything a person may be asked for, requested at once: a person's
  // connection asks for every scope a person's token can use, and the role
  // decides which of them are granted. Bot-only operations are not a person's
  // to grant.
  const scopeUnion = [
    ...new Set(
      MCP_CORE.flatMap((tool) =>
        tool.operations.filter((op) => !BOT_TOKEN_ONLY.has(key(op))).map((op) => spec.get(key(op))?.scope),
      ).filter((s): s is string => Boolean(s)),
    ),
  ].sort();

  const serviceTools = SERVICE_TOOLS.map((tool) => {
    const prose = MCP_TOOL_PROSE[tool.name]!;
    const built = buildInputSchema(tool, docEn);
    problems.push(...built.problems, ...lintSchema(tool.name, built.schema));
    return {
      name: `${TOOL_PREFIX}${tool.name}`,
      title: prose.title,
      description: composeDescription(prose),
      whenToUse: prose.whenToUse,
      notFor: prose.notFor,
      errorHints: prose.errorHints ?? {},
      inputSchema: built.schema,
      scopes: [],
      confirm: tool.confirm,
      annotations: annotationsFor(tool),
    };
  });
  const listedService = serviceTools.filter((_, i) => !SERVICE_TOOLS[i]!.compat);

  // One tool, whatever the listing: the full version is the largest there is.
  for (const tool of [...tools, ...listedService]) {
    const cost = modelTokens(tool);
    if (cost > MAX_TOOL_TOKENS) problems.push(`${tool.name} costs about ${cost} tokens, over ${MAX_TOOL_TOKENS} for one tool`);
  }

  // Every role's listing, assembled the way the server will assemble it.
  const instructionTokens = Math.round(SERVER_INSTRUCTIONS.length / 3.7);
  type Override = { description?: string; inputSchema?: JsonSchema };
  const audiences: Record<string, { tools: string[]; model_tokens: number; overrides: Record<string, Override> }> = {};
  for (const audience of AUDIENCES) {
    const names: string[] = [];
    const overrides: Record<string, Override> = {};
    let cost = instructionTokens;
    MCP_CORE.forEach((tool, t) => {
      const open = access.get(tool.name)!.map((a) => isOpen(a, audience));
      if (!open.some(Boolean)) return;
      const base = tools[t]!;
      const listed = {
        name: base.name,
        description: composeDescription(MCP_TOOL_PROSE[tool.name]!, branchTexts(tool, open)),
        inputSchema: schemaFor(tool, schemas.get(tool.name)!, open),
      };
      const override: Override = {};
      if (listed.description !== base.description) override.description = listed.description;
      if (JSON.stringify(listed.inputSchema) !== JSON.stringify(base.inputSchema)) override.inputSchema = listed.inputSchema;
      if (Object.keys(override).length) overrides[base.name] = override;
      names.push(base.name);
      cost += modelTokens(listed);
    });
    for (const tool of listedService) {
      names.push(tool.name);
      cost += modelTokens(tool);
    }
    audiences[audience.key] = { tools: names, model_tokens: cost, overrides };
    if (names.length > MAX_TOOLS_IN_LISTING) {
      problems.push(`the ${audience.key} listing has ${names.length} tools, more than the ${MAX_TOOLS_IN_LISTING} that fit one page`);
    }
    if (cost > MAX_LISTING_TOKENS) {
      problems.push(`the ${audience.key} listing costs about ${cost} tokens, over the ${MAX_LISTING_TOKENS} budget`);
    }
  }
  for (const tool of tools) {
    if (!AUDIENCES.some((a) => audiences[a.key]!.tools.includes(tool.name))) {
      problems.push(`${tool.name} is open to no role at all`);
    }
  }
  // A description must not send its reader to a tool that reader does not
  // have: the model would call it, or promise the person something it cannot do.
  const allNames = new Set([...tools, ...listedService].map((t) => t.name));
  for (const audience of AUDIENCES) {
    const listing = audiences[audience.key]!;
    const present = new Set(listing.tools);
    for (const name of listing.tools) {
      const base = [...tools, ...listedService].find((t) => t.name === name)!;
      const text = listing.overrides[name]?.description ?? base.description;
      for (const [, ref] of text.matchAll(/`([a-z][a-z0-9_]*)`/g)) {
        const full = `${TOOL_PREFIX}${ref}`;
        if (allNames.has(full) && !present.has(full)) {
          problems.push(`${name} names ${ref} in the ${audience.key} listing, which does not have it`);
        }
      }
    }
  }

  if (problems.length > 0) {
    console.error('MCP manifest not built:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const manifest = {
    schema_version: SCHEMA_VERSION,
    // Provenance is a content hash, not a timestamp: the same spec must produce
    // a byte-identical manifest, otherwise the generated-sync check would fail
    // on every build. The publish step stamps a real release time on the
    // package itself.
    generated_from: 'packages/spec/openapi.yaml',
    spec_sha256: crypto.createHash('sha256').update(fs.readFileSync(SPEC_PATH)).digest('hex'),
    server: SERVER_INFO,
    instructions: SERVER_INSTRUCTIONS,
    cache: CACHE_POLICY,
    response_format: RESPONSE_FORMAT,
    refusals: REFUSALS,
    tool_prefix: TOOL_PREFIX,
    // What the client asks for when it registers, all at once: every scope a
    // person's token can use. The consent screen shows this list, and the
    // person's role decides what is actually granted.
    default_scopes: scopeUnion,
    tools: [...tools, ...listedService],
    // Served only to clients that ask for this shape; see SERVICE_TOOLS.
    compat_tools: serviceTools.filter((_, i) => SERVICE_TOOLS[i]!.compat),
    // The listing each role receives and what it costs the model. A tool in a
    // listing is its entry in `tools` with this audience's overrides applied:
    // the description and argument schema of the branches open to it.
    audiences,
    coverage: {
      // Everything the spec has, placed: in a tool, or refused on purpose. The
      // build fails when an operation lands nowhere.
      outside_tools: [],
      refused,
    },
  };

  const drift = checkAgainstSchema(manifest as unknown as Record<string, unknown>);
  if (drift.length > 0) {
    console.error('Manifest and its schema disagree:');
    for (const p of drift) console.error(`  - ${p}`);
    process.exit(1);
  }

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  const fields = tools.reduce((n, t) => n + Object.keys(t.inputSchema.properties ?? {}).length, 0);
  const withOutput = tools.filter((t) => 'outputSchema' in t).length;
  const perRole = AUDIENCES.map((a) => `${a.key} ${audiences[a.key]!.tools.length} tools ~${audiences[a.key]!.model_tokens}`).join(', ');
  console.log(
    `MCP manifest: ${tools.length} core + ${serviceTools.length} service tools, ${fields} arguments, ` +
      `${withOutput} with a response schema, ${scopeUnion.length} scopes requested, ` +
      `${core.length} operations in tools + ${refused.length} refused = ${spec.size}. ` +
      `Listings (model tokens): ${perRole}.`
  );
}

build();
