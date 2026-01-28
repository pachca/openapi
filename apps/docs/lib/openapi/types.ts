// TypeScript types for OpenAPI parsing

export interface ParsedAPI {
  info: APIInfo;
  servers: Server[];
  tags: Tag[];
  endpoints: Endpoint[];
  schemas: Record<string, Schema>;
}

export interface APIInfo {
  title: string;
  version: string;
  description?: string;
}

export interface Server {
  url: string;
  description?: string;
}

export interface Tag {
  name: string;
  description?: string;
}

export interface Endpoint {
  id: string; // operationId
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  tags: string[];
  summary?: string;
  description?: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: SecurityRequirement[];
  url?: string; // Generated URL for the docs page
  title?: string; // Human-readable title
}

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema: Schema;
  example?: unknown;
  examples?: Record<string, Example>;
  explode?: boolean;
  style?: string;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema: Schema;
  example?: unknown;
  examples?: Record<string, Example>;
  encoding?: Record<string, unknown>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, Header>;
}

export interface Header {
  description?: string;
  schema?: Schema;
}

export interface Schema {
  type?: string | string[];
  format?: string;
  description?: string;
  title?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: unknown[];
  'x-enum-descriptions'?: Record<string, string>;
  default?: unknown;
  example?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  $ref?: string;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  additionalProperties?: boolean | Schema;
}

export interface Example {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

export interface SecurityRequirement {
  [key: string]: string[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  title: string;
  href: string;
  badge?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}
