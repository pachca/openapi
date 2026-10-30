// ----- Field Types -----

export type IRFieldTypeKind =
  | 'primitive'
  | 'enum'
  | 'model'
  | 'array'
  | 'record'
  | 'union'
  | 'literal'
  | 'binary';

export interface IRFieldType {
  kind: IRFieldTypeKind;
  /** For primitive: 'string' | 'number' | 'boolean' | 'integer' */
  primitive?: string;
  /** For primitive: 'int32' | 'int64' | 'date-time' | 'date' | 'binary' etc. */
  format?: string;
  /** For enum/model/union: referenced type name */
  ref?: string;
  /** For array: element type */
  items?: IRFieldType;
  /** For record (additionalProperties): value type */
  valueType?: IRFieldType;
  /** For union: member types */
  members?: IRFieldType[];
  /**
   * For union: the name of the value union this field takes (see IRValueUnion).
   * Set when the members are of different JSON kinds (a list and an object, for
   * instance): the SDK decodes such a field by the kind of the JSON value.
   */
  valueUnion?: string;
  /** For literal: the literal string value */
  literalValue?: string;
  /** Example value from the OpenAPI spec */
  example?: unknown;
}

// ----- Fields -----

export interface IRField {
  /** Original snake_case name from OpenAPI */
  name: string;
  type: IRFieldType;
  required: boolean;
  nullable: boolean;
  description?: string;
  defaultValue?: unknown;
}

// ----- Schemas -----

export interface IREnumMember {
  /** Original enum value: "admin", "is_member" */
  value: string;
  /** From x-enum-descriptions */
  description?: string;
}

export interface IREnum {
  name: string;
  description?: string;
  members: IREnumMember[];
  /** Whether x-enum-descriptions was present */
  hasDescriptions: boolean;
  /**
   * Open enum: a value the spec does not list decodes without an error and keeps
   * the raw string. Every enum a response, a webhook or nothing at all reaches is
   * open; only an enum that appears in requests alone stays closed.
   */
  open: boolean;
}

export interface IRModel {
  name: string;
  description?: string;
  fields: IRField[];
  /** ApiError, OAuthError etc. */
  isError: boolean;
  /** Extracted inline nested objects (for Python/Go/Kotlin) */
  inlineObjects: IRModel[];
}

export interface IRUnion {
  name: string;
  /** Referenced type names */
  memberRefs: string[];
  /**
   * Discriminator field name detected from literal fields (e.g. "type",
   * "entity_type"). Undefined when the members share no common literal — such
   * unions are emitted with a structural (shape-matching) decoder instead.
   */
  discriminatorField?: string;
  /** Optional named custom deserializer strategy from spec extension */
  unionDeserializer?: string;
}

/**
 * A field that takes values of different JSON kinds: `string[] | ScopesChange`
 * is a list or an object. Each member is of its own JSON kind (array, object,
 * string, number, boolean), so the kind of the JSON value picks the member, and
 * no discriminator or key matching is needed. Named after the model and the
 * field (`DetailsBotScopes`), with `Value` appended when a schema has that name.
 */
export interface IRValueUnion {
  name: string;
  /** Members in spec order, each of a distinct JSON kind */
  members: IRFieldType[];
  description?: string;
}

/** The JSON kind of a value union member. */
export type IRJsonKind = 'array' | 'object' | 'string' | 'number' | 'boolean';

export function jsonKindOf(ft: IRFieldType): IRJsonKind | undefined {
  switch (ft.kind) {
    case 'array':
      return 'array';
    case 'model':
      return 'object';
    case 'enum':
    case 'literal':
      return 'string';
    case 'primitive':
      if (ft.primitive === 'string') return 'string';
      if (ft.primitive === 'integer' || ft.primitive === 'number') return 'number';
      if (ft.primitive === 'boolean') return 'boolean';
      return undefined;
    default:
      return undefined;
  }
}

/**
 * The name a member takes inside its value union: the case of a Swift enum, the
 * variant of a Kotlin sealed interface, the property of a Go or C# wrapper.
 * `string[]` → StringList, `ScopesChange` → ScopesChange, `integer` → Int.
 */
export function valueUnionMemberName(ft: IRFieldType): string {
  switch (ft.kind) {
    case 'array':
      return `${valueUnionMemberName(ft.items!)}List`;
    case 'model':
    case 'enum':
      return ft.ref ?? 'Object';
    case 'literal':
      return 'String';
    case 'primitive':
      if (ft.primitive === 'integer') return 'Int';
      if (ft.primitive === 'number') return 'Double';
      if (ft.primitive === 'boolean') return 'Bool';
      return 'String';
    default:
      return 'Value';
  }
}

/**
 * What a union without a discriminator checks in a payload before it takes a
 * member, in Go and C#: their decoders fill a missing field with its zero value,
 * where Kotlin, Python and Swift fail and try the next member. `required` lists
 * the keys a model cannot do without (a required field that may hold null is
 * left out: its key may be missing), `nested` the fields that hold a model, a
 * list of models, or a value union with a model member (a list or an object),
 * whose own keys are checked in turn when the value is there.
 */
export interface IRRequiredShape {
  model: string;
  required: string[];
  nested: { key: string; model: string }[];
}

/**
 * The model a field holds for the required-key check: the model itself, the item
 * model of a list (of lists), or the one model a value union holds. A union that
 * is a type of its own decodes and checks itself, a record holds open values.
 */
function nestedModelOf(ft: IRFieldType, models: Map<string, IRModel>): string | undefined {
  switch (ft.kind) {
    case 'model':
      return ft.ref && models.has(ft.ref) ? ft.ref : undefined;
    case 'array':
      return ft.items ? nestedModelOf(ft.items, models) : undefined;
    case 'union': {
      if (!ft.valueUnion) return undefined;
      const held = new Set((ft.members ?? []).map((m) => nestedModelOf(m, models)).filter((m) => m !== undefined));
      return held.size === 1 ? [...held][0] : undefined;
    }
    default:
      return undefined;
  }
}

/**
 * The required-key shapes of the members of every union without a discriminator
 * and of the models nested in them, each model once, members first. A model with
 * nothing to check, here or deeper, is left out.
 */
export function unionRequiredShapes(unions: IRUnion[], models: IRModel[]): IRRequiredShape[] {
  const byName = new Map(models.flatMap((m) => [...m.inlineObjects, m]).map((m) => [m.name, m]));
  const order: string[] = [];
  const queue = unions.filter((u) => !u.discriminatorField).flatMap((u) => u.memberRefs);
  while (queue.length > 0) {
    const name = queue.shift()!;
    const model = byName.get(name);
    if (!model || order.includes(name)) continue;
    order.push(name);
    for (const f of model.fields) {
      const nested = nestedModelOf(f.type, byName);
      if (nested) queue.push(nested);
    }
  }
  const requiredOf = (name: string) => byName.get(name)!.fields.filter((f) => f.required && !f.nullable).map((f) => f.name);
  const nestedOf = (name: string) =>
    byName.get(name)!.fields.flatMap((f) => {
      const model = nestedModelOf(f.type, byName);
      return model ? [{ key: f.name, model }] : [];
    });
  // A model has something to check when it has required keys, or holds one that
  // does: grown until nothing changes, so a model that holds itself ends.
  const checked = new Set(order.filter((name) => requiredOf(name).length > 0));
  for (let grown = true; grown; ) {
    grown = false;
    for (const name of order) {
      if (!checked.has(name) && nestedOf(name).some((n) => checked.has(n.model))) {
        checked.add(name);
        grown = true;
      }
    }
  }
  return order
    .filter((name) => checked.has(name))
    .map((name) => ({ model: name, required: requiredOf(name), nested: nestedOf(name).filter((n) => checked.has(n.model)) }));
}

// ----- Operations -----

export interface IRParam {
  /** Original query/path param name: "sort[field]", "chat_ids[]" */
  name: string;
  /** SDK-friendly name: "sortField", "chatIds" */
  sdkName: string;
  type: IRFieldType;
  required: boolean;
  /** Whether this is an array query param (name ends with []) */
  isArray: boolean;
}

export type UnwrapMode = 'none' | 'single' | 'full';

export interface IRRequestBody {
  /** form — `application/x-www-form-urlencoded`, as the OAuth flow requires */
  contentType: 'json' | 'multipart' | 'form';
  /** Name of the request schema */
  schemaRef: string;
  unwrapMode: UnwrapMode;
  /** For single-field unwrap: the unwrapped field */
  unwrapField?: IRField;
  /**
   * The hand-written body example in wire names: the first of `examples`, else
   * `example`. The usage examples build the request from it (see bodyExample).
   */
  example?: unknown;
  /**
   * The named body examples (`examples`), in spec order, the first included.
   * examples.json gives each its own usage under the operation's entry.
   */
  examples?: IRBodyExample[];
}

/** One named request body example: the key of `examples`, its `summary` and its value. */
export interface IRBodyExample {
  name: string;
  summary?: string;
  value: unknown;
}

export interface IRSuccessResponse {
  statusCode: number;
  hasBody: boolean;
  /** { data: T[], meta? } pattern */
  isList: boolean;
  /** { data: T } → return T */
  isUnwrap: boolean;
  /**
   * { data: T, meta } with one object in `data`: the method returns the response
   * whole, data and meta, the way a list method does — `meta` is not dropped.
   */
  isSingleWithMeta?: boolean;
  /** Referenced model name for data */
  dataRef?: string;
  /** For list and single-with-meta responses: generated Response type name */
  responseRef?: string;
  /** 302 redirect → return Location header */
  isRedirect: boolean;
  /** A body that is not JSON (`application/octet-stream`) is the file itself → return its bytes */
  isBinary?: boolean;
}

export interface IRErrorResponse {
  statusCode: number;
  /** "OAuthError", "ApiError" */
  errorRef: string;
}

export interface IROperation {
  /** Derived method name: "listChats", "getChat" */
  methodName: string;
  operationId: string;
  method: string;
  path: string;
  tag: string;
  description?: string;
  /** Operation marked as deprecated in the spec */
  deprecated?: boolean;
  /**
   * Backward-compat alias of an operation that moved to a new service after an IA retag.
   * Emitted (so old `client.<oldService>.<method>()` keeps working) but skipped in examples/docs.
   */
  isAlias?: boolean;
  pathParams: IRParam[];
  queryParams: IRParam[];
  requestBody?: IRRequestBody;
  successResponse: IRSuccessResponse;
  errorResponses: IRErrorResponse[];
  hasApiError: boolean;
  hasOAuthError: boolean;
  /** Parameter name for external URL (from x-external-url) */
  externalUrl?: string;
  /** Skip Authorization header (from x-requirements.auth: false) */
  noAuth?: boolean;
  /** Generate *All pagination helper (from x-paginated: true) */
  isPaginated?: boolean;
  /**
   * Headers the SDK always sends: a header parameter that allows exactly one value
   * (`Prefer: return=representation`) is a choice already made, not an argument.
   */
  requestHeaders?: IRRequestHeader[];
}

export interface IRRequestHeader {
  name: string;
  value: string;
}

export interface IRService {
  tag: string;
  operations: IROperation[];
  /**
   * Backward-compat alias service: re-exposes operations that moved to other services
   * after an IA retag. Emitted as a working but deprecated accessor, and excluded from
   * generated examples/docs so only the new service names are documented.
   */
  deprecated?: boolean;
}

// ----- Params & Responses (generated types) -----

export interface IRParamsType {
  name: string;
  params: IRParam[];
  /** Whether any param is required (affects method signature optionality) */
  hasRequired: boolean;
}

export interface IRResponseType {
  name: string;
  dataRef: string;
  /** `data: T[]` for a list, `data: T` for a single object with meta */
  dataIsArray: boolean;
  metaRef?: string;
  metaIsRequired: boolean;
}

// ----- Helpers -----

/** Whether a single-field request body should be unwrapped into a direct parameter */
export function shouldUnwrapBody(rb: IRRequestBody): boolean {
  if (rb.unwrapMode !== 'single' || !rb.unwrapField) return false;
  const k = rb.unwrapField.type.kind;
  return k !== 'model' && k !== 'record';
}

// ----- Top-level IR -----

export interface IR {
  title: string;
  version: string;
  baseUrl?: string;
  enums: IREnum[];
  models: IRModel[];
  unions: IRUnion[];
  /** Fields that take values of different JSON kinds, one type per field */
  valueUnions: IRValueUnion[];
  services: IRService[];
  params: IRParamsType[];
  responses: IRResponseType[];
  /**
   * Where the authorization link of the OAuth flow points (`x-oauth-authorize-url`
   * on the code exchange). The SDK builds the link and the PKCE pair for it.
   */
  oauthAuthorizeUrl?: string;
}

/** The model behind `meta.paginate` of a list response, if the spec declares one. */
export function paginateModel(ir: IR, metaRef: string | undefined): IRModel | undefined {
  if (!metaRef) return undefined;
  const allModels = ir.models.flatMap((m) => [...m.inlineObjects, m]);
  const meta = allModels.find((m) => m.name === metaRef);
  const ref = meta?.fields.find((f) => f.name === 'paginate')?.type.ref;
  return ref ? allModels.find((m) => m.name === ref) : undefined;
}

/**
 * Whether `meta.paginate` of a list response carries `has_next`, and in which
 * form. The `*All()` helpers stop on it where it exists and on an empty page
 * otherwise; a required flag is read without a fallback.
 */
export function paginateHasNext(ir: IR, metaRef: string | undefined): 'required' | 'optional' | undefined {
  const field = paginateModel(ir, metaRef)?.fields.find((f) => f.name === 'has_next');
  if (!field) return undefined;
  return field.required && !field.nullable ? 'required' : 'optional';
}
