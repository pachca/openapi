import type {
  ParsedAPI,
  Schema,
  Endpoint,
  Parameter,
} from '@pachca/openapi-parser';
import { resolveAllOf, getSchemaType, isEnumSchema, isErrorSchema } from '@pachca/openapi-parser';
import type {
  IR,
  IREnum,
  IREnumMember,
  IRModel,
  IRUnion,
  IRField,
  IRFieldType,
  IRService,
  IROperation,
  IRParam,
  IRRequestBody,
  IRSuccessResponse,
  IRErrorResponse,
  IRParamsType,
  IRResponseType,
  UnwrapMode,
} from './ir.js';
import {
  refName,
  snakeToCamel,
  snakeToPascal,
  kebabToCamel,
  operationIdToMethod,
} from './naming.js';

// ----- Schema classification -----

function isUnion(schema: Schema): boolean {
  return !!schema.anyOf && schema.anyOf.length > 0;
}

// ----- Field type resolution -----

function resolveFieldType(schema: Schema): IRFieldType {
  // $ref → enum or model reference
  if (schema.$ref) {
    const name = refName(schema.$ref);
    return { kind: isEnumSchema(schema) ? 'enum' : 'model', ref: name };
  }

  // anyOf → union
  if (schema.anyOf) {
    return {
      kind: 'union',
      members: schema.anyOf.map(resolveFieldType),
    };
  }

  // allOf with single ref → treat as ref (common pattern for enum + description)
  if (schema.allOf && schema.allOf.length > 0) {
    const resolved = resolveAllOf(schema);
    if (schema.allOf.length === 1 && schema.allOf[0].$ref) {
      const allOfName = refName(schema.allOf[0].$ref);
      return { kind: isEnumSchema(schema.allOf[0]) ? 'enum' : 'model', ref: allOfName };
    }
    return resolveFieldType(resolved);
  }

  // Enum with single value → literal (discriminator)
  if (schema.enum && schema.enum.length === 1 && typeof schema.enum[0] === 'string') {
    return { kind: 'literal', literalValue: schema.enum[0] };
  }

  // Enum → enum reference (standalone enums should be handled at schema level)
  if (schema.enum) {
    return { kind: 'enum' };
  }

  // Array
  if (getSchemaType(schema) === 'array' && schema.items) {
    return {
      kind: 'array',
      items: resolveFieldType(schema.items),
    };
  }

  // Record (additionalProperties)
  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === 'object'
  ) {
    return {
      kind: 'record',
      valueType: resolveFieldType(schema.additionalProperties),
    };
  }

  // Binary
  if (schema.format === 'binary') {
    return { kind: 'binary' };
  }

  // Primitive
  const type = getSchemaType(schema);
  return {
    kind: 'primitive',
    primitive: type === 'integer' ? 'integer' : type,
    format: schema.format,
  };
}

// ----- Model extraction -----

/** Naive singularize: strip trailing 's' */
function singularize(name: string): string {
  if (name.endsWith('s') && name.length > 1) {
    return name.slice(0, -1);
  }
  return name;
}

/** Build inline name for array items, avoiding suffix duplication */
function arrayItemName(rootName: string, propName: string): string {
  const rawProp = propName.replace(/\[\]$/, '');
  const singular = singularize(rawProp);
  const pascalSingular = snakeToPascal(singular);
  // Avoid suffix duplication: e.g. ApiError + Error → ApiErrorItem
  if (rootName.endsWith(pascalSingular)) {
    return rootName + 'Item';
  }
  return rootName + pascalSingular;
}

function extractFields(
  schema: Schema,
  parentName: string,
  inlineObjects: IRModel[],
  rootName?: string,
): IRField[] {
  const root = rootName ?? parentName;
  const required = new Set(schema.required || []);
  const fields: IRField[] = [];

  for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
    // Direct inline object → extract
    if (
      getSchemaType(propSchema) === 'object' &&
      propSchema.properties &&
      !propSchema.$ref
    ) {
      const extractedName = parentName + snakeToPascal(propName);
      const extracted = extractInlineModel(
        propSchema,
        extractedName,
        inlineObjects,
        root,
      );
      inlineObjects.push(extracted);
      fields.push({
        name: propName,
        type: { kind: 'model', ref: extractedName },
        required: required.has(propName),
        nullable: !!propSchema.nullable,
        description: propSchema.description,
      });
      continue;
    }

    // Inline object in array items → extract (array[object])
    if (
      getSchemaType(propSchema) === 'array' &&
      propSchema.items &&
      !propSchema.items.$ref &&
      getSchemaType(propSchema.items) === 'object' &&
      propSchema.items.properties
    ) {
      const extractedName = arrayItemName(root, propName);
      const extracted = extractInlineModel(
        propSchema.items,
        extractedName,
        inlineObjects,
        root,
      );
      inlineObjects.push(extracted);
      fields.push({
        name: propName,
        type: { kind: 'array', items: { kind: 'model', ref: extractedName } },
        required: required.has(propName),
        nullable: !!propSchema.nullable,
        description: propSchema.description,
      });
      continue;
    }

    // Array of arrays with inline object items → extract (array[array[object]])
    if (
      getSchemaType(propSchema) === 'array' &&
      propSchema.items &&
      getSchemaType(propSchema.items) === 'array' &&
      propSchema.items.items &&
      !propSchema.items.items.$ref &&
      getSchemaType(propSchema.items.items) === 'object' &&
      propSchema.items.items.properties
    ) {
      const extractedName = arrayItemName(root, propName);
      const innerExtracted = extractInlineModel(
        propSchema.items.items,
        extractedName,
        inlineObjects,
        root,
      );
      inlineObjects.push(innerExtracted);
      fields.push({
        name: propName,
        type: {
          kind: 'array',
          items: { kind: 'array', items: { kind: 'model', ref: extractedName } },
        },
        required: required.has(propName),
        nullable: !!propSchema.nullable,
        description: propSchema.description,
      });
      continue;
    }

    fields.push({
      name: propName,
      type: resolveFieldType(propSchema),
      required: required.has(propName),
      nullable: !!propSchema.nullable,
      description: propSchema.description,
      defaultValue: propSchema.default,
    });
  }

  return fields;
}

function extractInlineModel(
  schema: Schema,
  name: string,
  inlineObjects: IRModel[],
  rootName: string,
): IRModel {
  const fields = extractFields(schema, name, inlineObjects, rootName);
  return {
    name,
    description: schema.description,
    fields,
    isError: false,
    inlineObjects: [],
  };
}

// ----- Schema → IR -----

function transformEnum(name: string, schema: Schema): IREnum {
  const descriptions = schema['x-enum-descriptions'] || {};
  const hasDescriptions = !!schema['x-enum-descriptions'];
  const members: IREnumMember[] = (schema.enum || []).map((value) => ({
    value: String(value),
    description: descriptions[String(value)],
  }));
  return { name, description: schema.description, members, hasDescriptions };
}

function transformModel(name: string, schema: Schema): IRModel {
  const inlineObjects: IRModel[] = [];
  const fields = extractFields(schema, name, inlineObjects);
  const isError = isErrorSchema(schema) || name === 'ApiError' || name === 'OAuthError';

  return { name, description: schema.description, fields, isError, inlineObjects };
}

function transformUnion(name: string, schema: Schema): IRUnion {
  const memberRefs = (schema.anyOf || [])
    .filter((s) => s.$ref)
    .map((s) => refName(s.$ref!));
  return { name, memberRefs };
}

// ----- Operations → IR -----

// Union of reserved words across all target languages (lowercase short keywords
// that could collide with camelCase SDK names or snake_case Python names).
const RESERVED_IDENTIFIERS = new Set([
  // Python
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
  'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
  'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  // Kotlin
  'fun', 'interface', 'object', 'package', 'super', 'this', 'throw',
  'typealias', 'typeof', 'val', 'var', 'when',
  // Swift
  'case', 'catch', 'default', 'defer', 'do', 'enum', 'extension',
  'fallthrough', 'fileprivate', 'func', 'guard', 'init', 'inout',
  'internal', 'let', 'nil', 'open', 'operator', 'override', 'precedencegroup',
  'private', 'protocol', 'public', 'rethrows', 'self', 'static', 'struct',
  'subscript', 'switch', 'throws', 'where',
  // TypeScript
  'delete', 'instanceof', 'new', 'typeof', 'void',
]);

function transformParam(param: Parameter): IRParam {
  const isArray = param.name.endsWith('[]');
  const rawName = isArray ? param.name.slice(0, -2) : param.name;

  // SDK name: x-param-names override, or derive from raw name
  let sdkName: string;
  if (param['x-param-names'] && param['x-param-names'].length > 0) {
    sdkName = snakeToCamel(param['x-param-names'][0].name.replace(/\[(\w+)\]/g, '_$1'));
  } else if (param.name.includes('[')) {
    // "sort[field]" → "sortField"
    sdkName = snakeToCamel(rawName.replace(/\[(\w+)\]/g, '_$1'));
  } else {
    sdkName = snakeToCamel(rawName);
  }

  if (RESERVED_IDENTIFIERS.has(sdkName) || RESERVED_IDENTIFIERS.has(rawName)) {
    throw new Error(
      `Parameter "${param.name}" resolves to reserved identifier "${sdkName}". ` +
      `Use x-param-names to provide an alternative name.`,
    );
  }

  let type = resolveFieldType(param.schema);
  if (isArray && type.kind !== 'array') {
    type = { kind: 'array', items: type };
  }

  return {
    name: param.name,
    sdkName,
    type,
    required: !!param.required,
    isArray,
  };
}

function determineUnwrapMode(schema: Schema): UnwrapMode {
  const props = Object.keys(schema.properties || {});
  const requiredSet = new Set(schema.required || []);
  const requiredProps = props.filter((p) => requiredSet.has(p));

  if (requiredProps.length === 1 && props.length === 1) return 'single';
  if (props.length === 0) return 'none';
  return 'full';
}

function transformRequestBody(
  endpoint: Endpoint,
  schemas: Record<string, Schema>,
  models: IRModel[],
): IRRequestBody | undefined {
  if (!endpoint.requestBody) return undefined;

  const contentTypes = Object.keys(endpoint.requestBody.content);
  const isMultipart = contentTypes.some((ct) => ct.includes('multipart'));
  const contentType: 'json' | 'multipart' = isMultipart ? 'multipart' : 'json';

  const mediaType =
    endpoint.requestBody.content['multipart/form-data'] ||
    endpoint.requestBody.content['application/json'];
  if (!mediaType) return undefined;

  const bodySchema = mediaType.schema;
  let schemaRef = bodySchema.$ref ? refName(bodySchema.$ref) : '';
  if (
    !schemaRef &&
    getSchemaType(bodySchema) === 'object' &&
    bodySchema.properties
  ) {
    const pascalMethod =
      operationIdToMethod(endpoint.id).charAt(0).toUpperCase() +
      operationIdToMethod(endpoint.id).slice(1);
    const baseName = `${pascalMethod}Request`;
    let modelName = baseName;
    let n = 2;
    while (models.some((m) => m.name === modelName)) {
      modelName = `${baseName}${n}`;
      n += 1;
    }
    models.push(transformModel(modelName, bodySchema));
    schemaRef = modelName;
  }

  // Determine unwrap mode from the resolved schema
  const resolvedSchema = schemaRef && schemas[schemaRef] ? schemas[schemaRef] : bodySchema;
  const unwrapMode = determineUnwrapMode(resolvedSchema);

  let unwrapField: IRField | undefined;
  if (unwrapMode === 'single') {
    // Use field type from already-transformed model (has correct inline object refs)
    const model = models.find((m) => m.name === schemaRef);
    if (model && model.fields.length === 1) {
      unwrapField = model.fields[0];
    } else {
      const props = Object.entries(resolvedSchema.properties || {});
      if (props.length === 1) {
        const [propName, propSchema] = props[0];
        unwrapField = {
          name: propName,
          type: resolveFieldType(propSchema),
          required: true,
          nullable: false,
          description: propSchema.description,
        };
      }
    }
  }

  return { contentType, schemaRef, unwrapMode, unwrapField };
}

function transformSuccessResponse(endpoint: Endpoint): IRSuccessResponse {
  // Find the success status code
  const successCodes = Object.keys(endpoint.responses)
    .filter((s) => s.startsWith('2') || s.startsWith('3'))
    .sort();

  if (successCodes.length === 0) {
    return {
      statusCode: 200,
      hasBody: false,
      isList: false,
      isUnwrap: false,
      isRedirect: false,
    };
  }

  const statusCode = parseInt(successCodes[0], 10);
  const response = endpoint.responses[successCodes[0]];

  // 302 redirect
  if (statusCode === 302) {
    return {
      statusCode,
      hasBody: false,
      isList: false,
      isUnwrap: false,
      isRedirect: true,
    };
  }

  // 204 no content
  if (statusCode === 204 || !response.content) {
    return {
      statusCode,
      hasBody: false,
      isList: false,
      isUnwrap: false,
      isRedirect: false,
    };
  }

  const mediaType = response.content['application/json'];
  if (!mediaType) {
    return {
      statusCode,
      hasBody: false,
      isList: false,
      isUnwrap: false,
      isRedirect: false,
    };
  }

  const responseSchema = mediaType.schema;

  // Check for { data: T[], meta? } pattern (list)
  if (responseSchema.properties?.data) {
    const dataSchema = responseSchema.properties.data;
    const hasMeta = !!responseSchema.properties.meta;
    const dataIsArray = getSchemaType(dataSchema) === 'array';

    if (dataIsArray) {
      const dataRef =
        dataSchema.items?.$ref ? refName(dataSchema.items.$ref) : undefined;
      const metaRef =
        hasMeta && responseSchema.properties.meta?.$ref
          ? refName(responseSchema.properties.meta.$ref)
          : undefined;
      const metaIsRequired = (responseSchema.required || []).includes('meta');

      return {
        statusCode,
        hasBody: true,
        isList: true,
        isUnwrap: false,
        dataRef,
        isRedirect: false,
      };
    }

    // { data: T } → unwrap single
    const dataRef = dataSchema.$ref ? refName(dataSchema.$ref) : undefined;
    return {
      statusCode,
      hasBody: true,
      isList: false,
      isUnwrap: true,
      dataRef,
      isRedirect: false,
    };
  }

  // Direct $ref response (not wrapped in { data: T })
  const directRef = responseSchema.$ref ? refName(responseSchema.$ref) : undefined;
  return {
    statusCode,
    hasBody: true,
    isList: false,
    isUnwrap: false,
    dataRef: directRef,
    isRedirect: false,
  };
}

function transformErrorResponses(endpoint: Endpoint): IRErrorResponse[] {
  const errors: IRErrorResponse[] = [];
  for (const [status, response] of Object.entries(endpoint.responses)) {
    const code = parseInt(status, 10);
    if (code >= 400 && response.content) {
      const mediaType = response.content['application/json'];
      if (mediaType?.schema?.$ref) {
        errors.push({ statusCode: code, errorRef: refName(mediaType.schema.$ref) });
      }
    }
  }
  return errors;
}

function transformOperation(
  endpoint: Endpoint,
  schemas: Record<string, Schema>,
  models: IRModel[],
): IROperation {
  const methodName = operationIdToMethod(endpoint.id);
  const tag = endpoint.tags[0] || 'Common';

  const pathParams = endpoint.parameters
    .filter((p) => p.in === 'path')
    .map(transformParam);

  const queryParams = endpoint.parameters
    .filter((p) => p.in === 'query')
    .map(transformParam);

  const requestBody = transformRequestBody(endpoint, schemas, models);
  const successResponse = transformSuccessResponse(endpoint);
  const errorResponses = transformErrorResponses(endpoint);

  const hasApiError = errorResponses.some((e) => e.errorRef === 'ApiError');
  const hasOAuthError = errorResponses.some((e) => e.errorRef === 'OAuthError');

  return {
    methodName,
    operationId: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    tag,
    description: endpoint.description,
    pathParams,
    queryParams,
    requestBody,
    successResponse,
    errorResponses,
    hasApiError,
    hasOAuthError,
  };
}

// ----- Params & Response type generation -----

function generateParamsType(op: IROperation): IRParamsType | undefined {
  if (op.queryParams.length === 0) return undefined;

  // Derive name: "ListChats" → "ListChatsParams"
  const pascalMethod = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
  return {
    name: `${pascalMethod}Params`,
    params: op.queryParams,
    hasRequired: op.queryParams.some((p) => p.required),
  };
}

function generateResponseType(
  op: IROperation,
  endpoint: Endpoint,
): IRResponseType | undefined {
  if (!op.successResponse.isList || !op.successResponse.dataRef) return undefined;

  const pascalMethod = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
  const response = endpoint.responses[String(op.successResponse.statusCode)];
  const responseSchema = response?.content?.['application/json']?.schema;

  const metaSchema = responseSchema?.properties?.meta;
  const metaRef = metaSchema?.$ref ? refName(metaSchema.$ref) : undefined;
  const metaIsRequired = (responseSchema?.required || []).includes('meta');

  return {
    name: `${pascalMethod}Response`,
    dataRef: op.successResponse.dataRef,
    dataIsArray: true,
    metaRef,
    metaIsRequired,
  };
}

// ----- Main transform -----

export function transform(spec: ParsedAPI): IR {
  const enums: IREnum[] = [];
  const models: IRModel[] = [];
  const unions: IRUnion[] = [];

  // Classify and transform schemas
  for (const [name, schema] of Object.entries(spec.schemas)) {
    if (isUnion(schema)) {
      unions.push(transformUnion(name, schema));
    } else if (isEnumSchema(schema)) {
      enums.push(transformEnum(name, schema));
    } else {
      models.push(transformModel(name, schema));
    }
  }

  // Transform operations grouped by tag
  const serviceMap = new Map<string, IROperation[]>();
  const params: IRParamsType[] = [];
  const responses: IRResponseType[] = [];

  for (const endpoint of spec.endpoints) {
    const op = transformOperation(endpoint, spec.schemas, models);
    const tag = op.tag;

    if (!serviceMap.has(tag)) serviceMap.set(tag, []);
    serviceMap.get(tag)!.push(op);

    const paramsType = generateParamsType(op);
    if (paramsType) params.push(paramsType);

    const responseType = generateResponseType(op, endpoint);
    if (responseType) responses.push(responseType);
  }

  // Sort operations within each service by HTTP method priority
  const methodOrder: Record<string, number> = {
    GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4,
  };
  // Preserve spec order for services (Map insertion order)
  const services: IRService[] = [...serviceMap.entries()]
    .map(([tag, operations]) => ({
      tag,
      operations: [...operations].sort((a, b) => {
        const aOrder = methodOrder[a.method] ?? 99;
        const bOrder = methodOrder[b.method] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.path.localeCompare(b.path);
      }),
    }));

  const baseUrl = spec.servers[0]?.url;

  return {
    title: spec.info.title,
    version: spec.info.version,
    baseUrl,
    enums,
    models,
    unions,
    services,
    params,
    responses,
  };
}
