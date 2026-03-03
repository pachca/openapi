/**
 * Python facade generator.
 *
 * Reads the OpenAPI spec and emits `generated/pachca/pachca_client.py` —
 * an ergonomic wrapper over the low-level code produced by openapi-python-client.
 *
 * Usage: npx tsx generate-client.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

// ── Paths ──────────────────────────────────────────────────────────────────────

const SPEC_PATH = path.resolve(__dirname, "../../packages/spec/openapi.yaml");
const OUTPUT_PATH = path.resolve(
  __dirname,
  "generated/pachca/pachca_client.py",
);
const INIT_PATH = path.resolve(__dirname, "generated/pachca/__init__.py");

// ── Naming helpers ─────────────────────────────────────────────────────────────

function camelToSnake(s: string): string {
  return s
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function pascalToSnake(s: string): string {
  return s
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/** Tag → Python service class name.  "Group tags" → "GroupTagsService" */
function tagToServiceName(tag: string): string {
  return (
    tag
      .split(/\s+/)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") + "Service"
  );
}

/** Tag → client property name.  "Group tags" → "group_tags" */
function tagToPropertyName(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "_");
}

/** Tag → api subdirectory.  "Group tags" → "group_tags" */
function tagToApiDir(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "_");
}

/** operationId → method name.  "MessageOperations_createMessage" → "create_message" */
function operationIdToMethod(operationId: string): string {
  const idx = operationId.indexOf("_");
  const method = idx >= 0 ? operationId.slice(idx + 1) : operationId;
  return camelToSnake(method);
}

/** operationId → generated module name.  "MessageOperations_createMessage" → "message_operations_create_message" */
function operationIdToModule(operationId: string): string {
  // The generated module uses the full operationId converted: replace _ boundary correctly
  // Pattern: "MessageOperations_createMessage"
  // Split on the TypeSpec boundary underscore, snake each part, rejoin
  const parts = operationId.split("_"); // ["MessageOperations", "createMessage"]
  return parts.map((p) => pascalToSnake(p)).join("_");
}

/** Schema name → model module name.  "MessageCreateRequest" → "message_create_request" */
function schemaToModule(name: string): string {
  return pascalToSnake(name);
}

/** Resolve a $ref string to schema object */
function resolveRef(spec: any, ref: string): any {
  const parts = ref.replace("#/", "").split("/");
  let obj = spec;
  for (const p of parts) obj = obj[p];
  return obj;
}

/** Get schema name from $ref string */
function refName(ref: string): string {
  return ref.split("/").pop()!;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParamInfo {
  name: string;
  pyName: string;
  location: "path" | "query";
  required: boolean;
  type: string; // Python type
  default?: string; // Python default value
  schemaRef?: string; // enum $ref if applicable
}

interface FlatField {
  name: string;
  pyName: string;
  type: string;
  required: boolean;
  default?: string;
  schemaRef?: string;
}

interface RequestBodyInfo {
  outerSchema: string; // e.g. "MessageCreateRequest"
  isWrapper: boolean;
  wrapperProp?: string; // e.g. "message"
  innerSchema?: string; // e.g. "MessageCreateRequestMessage"
  fieldCount: number; // field count on inner/flat schema
  flatFields?: FlatField[]; // fields for flattening (≤2 fields)
}

type ResponseKind = "single" | "list" | "void" | "direct";

interface ResponseInfo {
  kind: ResponseKind;
  modelName?: string; // e.g. "Message"
  responseClass?: string; // e.g. "MessageOperationsCreateMessageResponse201"
}

interface OperationInfo {
  operationId: string;
  httpMethod: string;
  path: string;
  tag: string;
  methodName: string;
  moduleName: string;
  pathParams: ParamInfo[];
  queryParams: ParamInfo[];
  requestBody?: RequestBodyInfo;
  response: ResponseInfo;
}

// ── Spec analysis ──────────────────────────────────────────────────────────────

function resolveSchemaType(spec: any, schema: any): string {
  if (!schema) return "Any";
  if (schema.$ref) return refName(schema.$ref);
  if (schema.type === "integer") return "int";
  if (schema.type === "number") return "float";
  if (schema.type === "boolean") return "bool";
  if (schema.type === "string") {
    if (schema.format === "date-time") return "str";
    return "str";
  }
  if (schema.type === "array") return `list`;
  return "Any";
}

function analyzeParam(spec: any, param: any): ParamInfo {
  const schema = param.schema?.$ref
    ? resolveRef(spec, param.schema.$ref)
    : param.schema || {};
  const schemaRef = param.schema?.$ref;

  let pyType = resolveSchemaType(spec, param.schema);
  // If it's an enum ref, use the ref name as type (but not for array aliases)
  if (schemaRef && schema.enum) {
    pyType = refName(schemaRef);
  }
  // If the $ref resolves to an array type, don't treat it as a named type
  if (schemaRef && schema.type === "array") {
    pyType = "list";
  }

  let defaultVal: string | undefined;
  if (param.schema?.default !== undefined) {
    const d = param.schema.default;
    if (typeof d === "string") {
      // Check if it's an enum
      if (schemaRef && schema.enum) {
        defaultVal = `${refName(schemaRef)}.${String(d).toUpperCase()}`;
      } else {
        defaultVal = `"${d}"`;
      }
    } else if (typeof d === "number") {
      defaultVal = String(d);
    } else if (typeof d === "boolean") {
      defaultVal = d ? "True" : "False";
    }
  }

  // Don't set schemaRef for array type aliases (they don't have generated models)
  const isEnumRef = schemaRef && schema.enum && schema.type !== "array";

  return {
    name: param.name,
    pyName: param.name.replace(/[[\]{}]/g, "").replace(/\./g, "_"),
    location: param.in,
    required: param.required === true,
    type: pyType,
    default: defaultVal,
    schemaRef: isEnumRef ? refName(schemaRef) : undefined,
  };
}

function snakeToPascal(s: string): string {
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}

function resolveFieldType(spec: any, propSchema: any): string {
  if (!propSchema) return "Any";
  if (propSchema.$ref) return refName(propSchema.$ref);
  if (propSchema.allOf?.[0]?.$ref) return refName(propSchema.allOf[0].$ref);
  if (propSchema.type === "integer") return "int";
  if (propSchema.type === "number") return "float";
  if (propSchema.type === "boolean") return "bool";
  if (propSchema.type === "string") return "str";
  if (propSchema.type === "array") return "list";
  return "Any";
}

function analyzeRequestBody(
  spec: any,
  requestBody: any,
): RequestBodyInfo | undefined {
  if (!requestBody) return undefined;
  const content = requestBody.content?.["application/json"];
  if (!content?.schema?.$ref) return undefined;

  const outerName = refName(content.schema.$ref);
  const outerSchema = resolveRef(spec, content.schema.$ref);
  const props = outerSchema.properties || {};
  const propNames = Object.keys(props).filter(
    (k) => k !== "additional_properties" && k !== "additionalProperties",
  );

  // Check if wrapper: exactly 1 property that is either a $ref or an inline object
  if (propNames.length === 1) {
    const prop = props[propNames[0]];

    // Case 1: property is a $ref
    if (prop?.$ref) {
      const innerName = refName(prop.$ref);
      const innerSchema = resolveRef(spec, prop.$ref);
      const innerProps = Object.keys(innerSchema.properties || {}).filter(
        (k) => k !== "additional_properties" && k !== "additionalProperties",
      );
      return {
        outerSchema: outerName,
        isWrapper: true,
        wrapperProp: propNames[0],
        innerSchema: innerName,
        fieldCount: innerProps.length,
      };
    }

    // Case 2: property is an inline object (type: object with properties)
    if (prop?.type === "object" && prop?.properties) {
      // Inner model name: {OuterSchema}{PropertyPascalCase}
      const innerName = outerName + snakeToPascal(propNames[0]);
      const innerProps = Object.keys(prop.properties).filter(
        (k) => k !== "additional_properties" && k !== "additionalProperties",
      );
      return {
        outerSchema: outerName,
        isWrapper: true,
        wrapperProp: propNames[0],
        innerSchema: innerName,
        fieldCount: innerProps.length,
      };
    }

    // Case 3: property is an object with additionalProperties (map-like, e.g., LinkPreviewsRequest)
    if (prop?.type === "object" && prop?.additionalProperties) {
      // Not a wrapper in the usual sense — pass through
      return {
        outerSchema: outerName,
        isWrapper: false,
        fieldCount: 1,
      };
    }
  }

  // Flat body — collect fields for potential flattening
  const required = new Set(outerSchema.required || []);
  const flatFields: FlatField[] = propNames.map((name) => {
    const propSchema = props[name];
    const fieldType = resolveFieldType(spec, propSchema);
    const isRequired = required.has(name);
    const schemaRef = propSchema?.$ref
      ? refName(propSchema.$ref)
      : propSchema?.allOf?.[0]?.$ref
        ? refName(propSchema.allOf[0].$ref)
        : undefined;

    return {
      name,
      pyName: name,
      type: fieldType,
      required: isRequired,
      schemaRef,
    };
  });

  return {
    outerSchema: outerName,
    isWrapper: false,
    fieldCount: propNames.length,
    flatFields: propNames.length <= 2 ? flatFields : undefined,
  };
}

function analyzeResponse(
  spec: any,
  responses: any,
  operationId: string,
): ResponseInfo {
  // Check for 200 or 201 success response
  const successCode = responses["200"]
    ? "200"
    : responses["201"]
      ? "201"
      : null;

  if (!successCode) {
    // 204 or no success body
    return { kind: "void" };
  }

  const successResp = responses[successCode];
  const content = successResp?.content?.["application/json"];

  if (!content?.schema) {
    return { kind: "void" };
  }

  const schema = content.schema;
  // Check if schema has $ref
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    const schemaName = refName(schema.$ref);

    // Check if it has data property (wrapper pattern)
    if (resolved.properties?.data) {
      const dataProp = resolved.properties.data;

      if (dataProp.type === "array" && dataProp.items?.$ref) {
        // Pattern B: list with pagination
        return {
          kind: "list",
          modelName: refName(dataProp.items.$ref),
          responseClass: schemaName,
        };
      } else if (dataProp.$ref) {
        // Pattern A: single data wrapper (direct $ref)
        return {
          kind: "single",
          modelName: refName(dataProp.$ref),
          responseClass: schemaName,
        };
      } else if (dataProp.allOf?.[0]?.$ref) {
        // Pattern A variant: single data wrapper with allOf (e.g., nullable types)
        return {
          kind: "single",
          modelName: refName(dataProp.allOf[0].$ref),
          responseClass: schemaName,
        };
      }
    }

    // Direct model response (no .data wrapper)
    return { kind: "direct", modelName: schemaName };
  }

  // Inline schema — check for data property
  if (schema.properties?.data) {
    const dataProp = schema.properties.data;
    // Build response class name from operationId for inline schemas
    const inlineResponseClass = pascalToSnake(operationId.replace(/_/g, "")) + "_response_" + successCode;

    if (dataProp.type === "array" && dataProp.items?.$ref) {
      return { kind: "list", modelName: refName(dataProp.items.$ref) };
    }
    if (dataProp.$ref) {
      return { kind: "single", modelName: refName(dataProp.$ref) };
    }
    if (dataProp.allOf?.[0]?.$ref) {
      return { kind: "single", modelName: refName(dataProp.allOf[0].$ref) };
    }
  }

  return { kind: "void" };
}

function collectOperations(spec: any): OperationInfo[] {
  const ops: OperationInfo[] = [];
  const paths = spec.paths || {};

  for (const [pathStr, pathItem] of Object.entries<any>(paths)) {
    for (const httpMethod of [
      "get",
      "post",
      "put",
      "patch",
      "delete",
    ] as const) {
      const operation = pathItem[httpMethod];
      if (!operation) continue;

      const operationId = operation.operationId;
      if (!operationId) continue;

      const tag = operation.tags?.[0] || "Common";
      const parameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || []),
      ];

      const pathParams: ParamInfo[] = [];
      const queryParams: ParamInfo[] = [];

      for (const param of parameters) {
        const p = param.$ref ? resolveRef(spec, param.$ref) : param;
        const info = analyzeParam(spec, p);
        if (info.location === "path") pathParams.push(info);
        else queryParams.push(info);
      }

      const requestBody = analyzeRequestBody(spec, operation.requestBody);
      const response = analyzeResponse(
        spec,
        operation.responses || {},
        operationId,
      );

      ops.push({
        operationId,
        httpMethod,
        path: pathStr,
        tag,
        methodName: operationIdToMethod(operationId),
        moduleName: operationIdToModule(operationId),
        pathParams,
        queryParams,
        requestBody,
        response,
      });
    }
  }

  return ops;
}

// ── Code generation ────────────────────────────────────────────────────────────

function generateImports(
  grouped: Map<string, OperationInfo[]>,
): string {
  const lines: string[] = [];
  lines.push(
    '"""Ergonomic facade for Pachca API. Auto-generated — do not edit."""',
  );
  lines.push("");
  lines.push("from __future__ import annotations");
  lines.push("");
  lines.push("from typing import Any");
  lines.push("");
  lines.push("from .client import AuthenticatedClient");
  lines.push("from .types import UNSET, Unset");
  lines.push("from .models.api_error import ApiError");
  lines.push("from .models.o_auth_error import OAuthError");
  lines.push("");
  lines.push("import httpx");
  lines.push("");

  // Collect all operation module imports and model imports
  const opImports = new Set<string>();
  const modelImports = new Set<string>();
  const enumImports = new Set<string>();

  for (const [tag, ops] of grouped) {
    const apiDir = tagToApiDir(tag);
    for (const op of ops) {
      opImports.add(
        `from .api.${apiDir} import ${op.moduleName}`,
      );

      // Request body model imports
      if (op.requestBody) {
        modelImports.add(
          `from .models.${schemaToModule(op.requestBody.outerSchema)} import ${op.requestBody.outerSchema}`,
        );
        if (op.requestBody.isWrapper && op.requestBody.innerSchema) {
          modelImports.add(
            `from .models.${schemaToModule(op.requestBody.innerSchema)} import ${op.requestBody.innerSchema}`,
          );
        }
        // Import enum types for flat fields
        if (op.requestBody.flatFields) {
          for (const f of op.requestBody.flatFields) {
            if (f.schemaRef) {
              enumImports.add(
                `from .models.${schemaToModule(f.schemaRef)} import ${f.schemaRef}`,
              );
            }
          }
        }
      }

      // Response model imports
      if (op.response.modelName) {
        modelImports.add(
          `from .models.${schemaToModule(op.response.modelName)} import ${op.response.modelName}`,
        );
      }
      if (op.response.responseClass) {
        modelImports.add(
          `from .models.${schemaToModule(op.response.responseClass)} import ${op.response.responseClass}`,
        );
      }

      // Enum imports for query params
      for (const p of op.queryParams) {
        if (p.schemaRef) {
          enumImports.add(
            `from .models.${schemaToModule(p.schemaRef)} import ${p.schemaRef}`,
          );
        }
      }
    }
  }

  // Sort and emit
  const sortedOps = [...opImports].sort();
  const sortedModels = [...modelImports].sort();
  const sortedEnums = [...enumImports].sort();

  if (sortedOps.length > 0) {
    lines.push("# Operation modules");
    for (const imp of sortedOps) lines.push(imp);
    lines.push("");
  }

  if (sortedModels.length > 0) {
    lines.push("# Models");
    for (const imp of sortedModels) lines.push(imp);
    lines.push("");
  }

  if (sortedEnums.length > 0) {
    lines.push("# Enums");
    for (const imp of sortedEnums) lines.push(imp);
    lines.push("");
  }

  return lines.join("\n");
}

function generateHelpers(): string {
  return `
# ── Exceptions ──────────────────────────────────────────────────────────────────


class PachcaAPIError(Exception):
    """Raised on 4xx/5xx API errors."""

    def __init__(self, *, errors: list[dict[str, str]] | None = None, message: str | None = None):
        self.errors = errors or []
        self.message = message or (self.errors[0]["message"] if self.errors else "API error")
        super().__init__(self.message)


class PachcaAuthError(Exception):
    """Raised on 401/403 OAuth errors."""

    def __init__(self, *, message: str = "Auth error"):
        self.message = message
        super().__init__(self.message)


# ── Helpers ─────────────────────────────────────────────────────────────────────


def _raise_for_error(result: Any) -> None:
    """Check sync() result and raise on API/OAuth errors."""
    if isinstance(result, ApiError):
        errors = [{"key": e.key, "message": e.message} for e in result.errors] if result.errors else []
        raise PachcaAPIError(errors=errors)
    if isinstance(result, OAuthError):
        raise PachcaAuthError(message=result.error_description or result.error or "Auth error")
    if result is None:
        raise PachcaAPIError(message="Unexpected empty response")


def _get_cursor(result: Any) -> str | None:
    """Extract pagination cursor from response meta."""
    meta = getattr(result, "meta", UNSET)
    if isinstance(meta, Unset):
        return None
    paginate = getattr(meta, "paginate", UNSET)
    if isinstance(paginate, Unset):
        return None
    next_page = getattr(paginate, "next_page", UNSET)
    if isinstance(next_page, Unset):
        return None
    return next_page


class PaginatedResponse(list):
    """List subclass with pagination metadata."""

    def __init__(self, data: list, next_cursor: str | None = None):
        super().__init__(data)
        self.next_cursor = next_cursor
`;
}

function generateMethodSignature(op: OperationInfo): string {
  const parts: string[] = ["self"];

  // Path params as positional args
  for (const p of op.pathParams) {
    parts.push(`${p.pyName}: ${p.type}`);
  }

  // Request body param
  if (op.requestBody) {
    if (op.requestBody.isWrapper && op.requestBody.innerSchema) {
      // Wrapper: take inner model as param
      const paramName = op.requestBody.wrapperProp || "body";
      parts.push(`${paramName}: ${op.requestBody.innerSchema}`);
    } else if (op.requestBody.flatFields && op.requestBody.fieldCount <= 2) {
      // Flat with ≤2 fields: flatten into kwargs
      for (const f of op.requestBody.flatFields) {
        if (f.required) {
          parts.push(`${f.pyName}: ${f.type}`);
        } else {
          parts.push(`${f.pyName}: ${f.type} | Unset = UNSET`);
        }
      }
    } else {
      // 3+ fields or no field info: pass model directly
      parts.push(`body: ${op.requestBody.outerSchema}`);
    }
  }

  // Query params
  for (const p of op.queryParams) {
    const pyType = p.required ? p.type : `${p.type} | Unset`;
    const defaultVal = p.required ? "" : ` = ${p.default || "UNSET"}`;
    parts.push(`${p.pyName}: ${pyType}${defaultVal}`);
  }

  // Return type
  let returnType: string;
  if (op.response.kind === "void") {
    returnType = "None";
  } else if (op.response.kind === "list" && op.response.modelName) {
    returnType = `PaginatedResponse[${op.response.modelName}]`;
  } else if (
    (op.response.kind === "single" || op.response.kind === "direct") &&
    op.response.modelName
  ) {
    returnType = op.response.modelName;
  } else {
    returnType = "Any";
  }

  return `    def ${op.methodName}(${parts.join(", ")}) -> ${returnType}:`;
}

function generateMethodBody(op: OperationInfo): string {
  const lines: string[] = [];

  // Build call args
  const callArgs: string[] = [];

  // Path params (positional)
  for (const p of op.pathParams) {
    callArgs.push(`${p.pyName}`);
  }

  // Keyword args
  const kwArgs: string[] = [];
  kwArgs.push("client=self._client");

  // Body
  if (op.requestBody) {
    if (op.requestBody.isWrapper && op.requestBody.innerSchema) {
      // Wrapper: construct outer from inner param
      const wrapperProp = op.requestBody.wrapperProp || "body";
      kwArgs.push(
        `body=${op.requestBody.outerSchema}(${wrapperProp}=${wrapperProp})`,
      );
    } else if (op.requestBody.flatFields && op.requestBody.fieldCount <= 2) {
      // Flat ≤2 fields: construct body from flattened kwargs
      const fieldAssignments = op.requestBody.flatFields
        .map((f) => `${f.pyName}=${f.pyName}`)
        .join(", ");
      kwArgs.push(`body=${op.requestBody.outerSchema}(${fieldAssignments})`);
    } else {
      kwArgs.push("body=body");
    }
  }

  // Query params
  for (const p of op.queryParams) {
    kwArgs.push(`${p.pyName}=${p.pyName}`);
  }

  // Build sync() call
  const allArgs = [...callArgs, ...kwArgs];
  lines.push(
    `        result = ${op.moduleName}.sync(${allArgs.join(", ")})`,
  );

  // Error check
  lines.push("        _raise_for_error(result)");

  // Return
  if (op.response.kind === "void") {
    // No return needed
  } else if (op.response.kind === "list") {
    lines.push(
      "        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))",
    );
  } else if (op.response.kind === "single") {
    lines.push("        return result.data");
  } else if (op.response.kind === "direct") {
    lines.push("        return result");
  }

  return lines.join("\n");
}

function generateServiceClass(
  tag: string,
  operations: OperationInfo[],
): string {
  const className = tagToServiceName(tag);
  const lines: string[] = [];

  lines.push("");
  lines.push("");
  lines.push(`class ${className}:`);
  lines.push("    def __init__(self, client: AuthenticatedClient):");
  lines.push("        self._client = client");

  for (const op of operations) {
    lines.push("");
    lines.push(generateMethodSignature(op));
    lines.push(generateMethodBody(op));
  }

  return lines.join("\n");
}

function generatePachcaClass(tags: string[]): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("");
  lines.push(
    "# ── Client ──────────────────────────────────────────────────────────────────────",
  );
  lines.push("");
  lines.push("");
  lines.push("class Pachca:");
  lines.push('    """Ergonomic Pachca API client."""');
  lines.push("");
  lines.push(
    '    def __init__(self, token: str, *, base_url: str = "https://api.pachca.com/api/shared/v1", timeout: float = 30.0):',
  );
  lines.push("        self._client = AuthenticatedClient(");
  lines.push("            base_url=base_url,");
  lines.push("            token=token,");
  lines.push("            timeout=httpx.Timeout(timeout),");
  lines.push("            raise_on_unexpected_status=True,");
  lines.push("        )");

  for (const tag of tags) {
    const prop = tagToPropertyName(tag);
    const cls = tagToServiceName(tag);
    lines.push(`        self.${prop} = ${cls}(self._client)`);
  }

  lines.push("");
  lines.push("    def close(self) -> None:");
  lines.push("        self._client.__exit__(None, None, None)");
  lines.push("");
  lines.push("    def __enter__(self) -> Pachca:");
  lines.push("        self._client.__enter__()");
  lines.push("        return self");
  lines.push("");
  lines.push("    def __exit__(self, *args: Any) -> None:");
  lines.push("        self._client.__exit__(*args)");

  return lines.join("\n");
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  console.log("Reading spec:", SPEC_PATH);
  const specText = fs.readFileSync(SPEC_PATH, "utf8");
  const spec = yaml.parse(specText);

  const operations = collectOperations(spec);
  console.log(`Found ${operations.length} operations`);

  // Group by tag
  const grouped = new Map<string, OperationInfo[]>();
  for (const op of operations) {
    if (!grouped.has(op.tag)) grouped.set(op.tag, []);
    grouped.get(op.tag)!.push(op);
  }

  // Sort tags for deterministic output
  const sortedTags = [...grouped.keys()].sort();

  console.log(`Tags: ${sortedTags.join(", ")}`);

  // Generate output
  const parts: string[] = [];

  parts.push(generateImports(grouped));
  parts.push(generateHelpers());

  // Service classes
  parts.push("");
  parts.push(
    "# ── Services ────────────────────────────────────────────────────────────────────",
  );

  for (const tag of sortedTags) {
    parts.push(generateServiceClass(tag, grouped.get(tag)!));
  }

  // Pachca class
  parts.push(generatePachcaClass(sortedTags));

  // Write output
  const output = parts.join("\n") + "\n";
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log("Generated:", OUTPUT_PATH);

  // Update __init__.py to re-export facade
  updateInit();
}

function updateInit() {
  const initContent = fs.readFileSync(INIT_PATH, "utf8");
  const marker = "# facade re-exports";

  if (initContent.includes(marker)) {
    console.log("__init__.py already has facade re-exports");
    return;
  }

  const addition = `
${marker}
from .pachca_client import Pachca, PachcaAPIError, PachcaAuthError, PaginatedResponse
`;

  fs.writeFileSync(INIT_PATH, initContent.trimEnd() + "\n" + addition, "utf8");
  console.log("Updated:", INIT_PATH);
}

main();
