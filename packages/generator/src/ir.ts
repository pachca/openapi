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
  /** For literal: the literal string value */
  literalValue?: string;
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
  contentType: 'json' | 'multipart';
  /** Name of the request schema */
  schemaRef: string;
  unwrapMode: UnwrapMode;
  /** For single-field unwrap: the unwrapped field */
  unwrapField?: IRField;
}

export interface IRSuccessResponse {
  statusCode: number;
  hasBody: boolean;
  /** { data: T[], meta? } pattern */
  isList: boolean;
  /** { data: T } → return T */
  isUnwrap: boolean;
  /** Referenced model name for data */
  dataRef?: string;
  /** For list responses: generated Response type name */
  responseRef?: string;
  /** 302 redirect → return Location header */
  isRedirect: boolean;
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
  pathParams: IRParam[];
  queryParams: IRParam[];
  requestBody?: IRRequestBody;
  successResponse: IRSuccessResponse;
  errorResponses: IRErrorResponse[];
  hasApiError: boolean;
  hasOAuthError: boolean;
  /** Parameter name for external URL (from x-external-url) */
  externalUrl?: string;
}

export interface IRService {
  tag: string;
  operations: IROperation[];
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
  dataIsArray: boolean;
  metaRef?: string;
  metaIsRequired: boolean;
}

// ----- Top-level IR -----

export interface IR {
  title: string;
  version: string;
  baseUrl?: string;
  enums: IREnum[];
  models: IRModel[];
  unions: IRUnion[];
  services: IRService[];
  params: IRParamsType[];
  responses: IRResponseType[];
}
