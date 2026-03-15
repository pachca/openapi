/**
 * Shared utilities for SDK code example generators.
 * Maps Endpoint (from OpenAPI parser) → SDK call structure.
 *
 * Core naming functions are imported from @pachca/generator to stay
 * in sync with the generated SDK code (single source of truth).
 */

import type { Endpoint, Schema } from '../openapi/types';
import {
  generateRequestExample,
  generateParameterExample,
  type ExampleOptions,
} from '../openapi/example-generator';
import {
  snakeToCamel,
  snakeToPascal,
  camelToSnake,
  tagToProperty,
  operationIdToMethod,
  refName,
} from '@pachca/generator/naming';

// Re-export naming functions used by individual language generators
export { snakeToCamel, snakeToPascal, camelToSnake, tagToProperty, operationIdToMethod };

// ─── Docs-specific naming helpers ───

/** Tag → Python service property: "Group Tags" → "group_tags" */
export function tagToPythonProperty(tag: string): string {
  return camelToSnake(tagToProperty(tag));
}

/** Tag → Go service property: "Messages" → "Messages", "Group Tags" → "GroupTags" */
export function tagToGoProperty(tag: string): string {
  const words = tag.split(/\s+/);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/** Go PascalCase with ID/URL/OAuth fixes */
export function goName(str: string): string {
  return snakeToPascal(str)
    .replace(/Id(?=[A-Z]|$)/g, 'ID')
    .replace(/Url(?=[A-Z]|$)/g, 'URL')
    .replace(/Api(?=[A-Z]|$)/g, 'API');
}

// ─── SDK Call Info ───

export interface PathParamInfo {
  name: string;
  sdkName: string;
  example: unknown;
}

export interface SdkCallInfo {
  /** Service property: "messages", "chats", etc. */
  service: string;
  /** Python service: "messages", "group_tags" */
  servicePython: string;
  /** Go service: "Messages", "GroupTags" */
  serviceGo: string;
  /** Method names by language convention */
  methodName: string; // camelCase: "createMessage"
  methodNamePython: string; // snake_case: "create_message"
  methodNameGo: string; // PascalCase: "CreateMessage"
  /** Path parameters with examples */
  pathParams: PathParamInfo[];
  /** Request body schema ref name, e.g. "MessageCreateRequest" */
  requestBodyRef: string | undefined;
  /** Whether the endpoint has a JSON request body */
  hasBody: boolean;
  /** Whether the endpoint has multipart body */
  isMultipart: boolean;
  /** Whether the endpoint returns void (204) */
  isVoid: boolean;
  /** Whether the endpoint supports cursor-based pagination */
  paginated: boolean;
  /** External URL parameter name (endpoint sends request to dynamic URL) */
  externalUrl: string | undefined;
}

/** Extract SDK call metadata from an Endpoint */
export function getSdkCallInfo(endpoint: Endpoint): SdkCallInfo {
  const tag = endpoint.tags[0] || 'Common';
  const methodName = operationIdToMethod(endpoint.id);

  const pathParams: PathParamInfo[] = endpoint.parameters
    .filter((p) => p.in === 'path')
    .map((p) => ({
      name: p.name,
      sdkName: snakeToCamel(p.name),
      example: generateParameterExample(p),
    }));

  const hasBody = !!endpoint.requestBody;
  const isMultipart = hasBody && 'multipart/form-data' in (endpoint.requestBody?.content ?? {});
  const jsonContent = endpoint.requestBody?.content['application/json'];
  const bodySchema = jsonContent?.schema;
  const requestBodyRef = bodySchema?.$ref ? refName(bodySchema.$ref) : undefined;

  const successCodes = Object.keys(endpoint.responses)
    .filter((s) => s.startsWith('2'))
    .sort();
  const isVoid = successCodes[0] === '204' || !endpoint.responses[successCodes[0]]?.content;

  return {
    service: tagToProperty(tag),
    servicePython: tagToPythonProperty(tag),
    serviceGo: tagToGoProperty(tag),
    methodName,
    methodNamePython: camelToSnake(methodName),
    methodNameGo: methodName.charAt(0).toUpperCase() + methodName.slice(1),
    pathParams,
    requestBodyRef,
    hasBody,
    isMultipart,
    isVoid,
    paginated: !!endpoint.paginated,
    externalUrl: endpoint.externalUrl,
  };
}

// ─── Schema-aware body rendering ───

/**
 * Recursively renders example data as SDK constructor syntax.
 * Walks the schema to find $ref type names and maps keys to target naming convention.
 */
export function renderSdkBody(
  data: unknown,
  schema: Schema | undefined,
  options: {
    /** Key transformation */
    keyTransform: (key: string) => string;
    /** How to wrap objects with a known type: (typeName, inner) => code */
    typeConstructor: (typeName: string, inner: string) => string;
    /** How to render an untyped object literal: (inner) => code */
    objectLiteral: (inner: string) => string;
    /** How to render a string value */
    stringLiteral: (value: string) => string;
    /** How to render a number */
    numberLiteral: (value: number) => string;
    /** How to render a boolean */
    booleanLiteral: (value: boolean) => string;
    /** How to render null */
    nullLiteral: string;
    /** How to render an array */
    arrayLiteral: (items: string[]) => string;
    /** Key-value separator in objects: ": " for TS, "=" for Python, etc. */
    kvSep: string;
    /** Indent string */
    indent: string;
    /** Append trailing comma after last field (required for Go) */
    trailingComma?: boolean;
  },
  depth = 0
): string {
  if (data === null || data === undefined) return options.nullLiteral;
  if (typeof data === 'string') return options.stringLiteral(data);
  if (typeof data === 'number') return options.numberLiteral(data);
  if (typeof data === 'boolean') return options.booleanLiteral(data);

  if (Array.isArray(data)) {
    const itemSchema = schema?.items;
    const items = data.map((item) => renderSdkBody(item, itemSchema, options, depth));
    return options.arrayLiteral(items);
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const entries = Object.entries(record);
    if (entries.length === 0) {
      const typeName = schema?.$ref ? refName(schema.$ref) : undefined;
      return typeName ? options.typeConstructor(typeName, '') : options.objectLiteral('');
    }

    const ind = options.indent.repeat(depth + 1);
    const outerInd = options.indent.repeat(depth);

    const fields = entries.map(([key, value]) => {
      const propSchema = schema?.properties?.[key];
      const transformedKey = options.keyTransform(key);
      const renderedValue = renderSdkBody(value, propSchema, options, depth + 1);
      return `${ind}${transformedKey}${options.kvSep}${renderedValue}`;
    });

    const inner = fields.join(',\n') + (options.trailingComma ? ',' : '');
    const typeName = schema?.$ref ? refName(schema.$ref) : undefined;
    const body = `\n${inner}\n${outerInd}`;

    return typeName ? options.typeConstructor(typeName, body) : options.objectLiteral(body);
  }

  return String(data);
}

// ─── Example data extraction ───

/** Get request body example data and its schema */
export function getRequestBodyExample(
  endpoint: Endpoint,
  opts?: ExampleOptions
): { data: unknown; schema: Schema | undefined } {
  const jsonContent = endpoint.requestBody?.content['application/json'];
  if (!jsonContent) return { data: undefined, schema: undefined };
  const data = generateRequestExample(endpoint.requestBody!, opts);
  return { data, schema: jsonContent.schema };
}
