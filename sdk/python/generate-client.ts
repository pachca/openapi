/**
 * Python facade generator.
 *
 * Reads the generated Python SDK (produced by openapi-python-client) and emits
 * `generated/pachca/pachca_client.py` — an ergonomic wrapper over the low-level code.
 *
 * Usage: npx tsx generate-client.ts
 */

import * as fs from "fs";
import * as path from "path";

// ── Paths ──────────────────────────────────────────────────────────────────────

const GENERATED_PATH = path.resolve(__dirname, "generated/pachca");
const API_PATH = path.join(GENERATED_PATH, "api");
const MODELS_PATH = path.join(GENERATED_PATH, "models");
const OUTPUT_PATH = path.resolve(
  __dirname,
  "generated/pachca/pachca_client.py",
);
const INIT_PATH = path.resolve(__dirname, "generated/pachca/__init__.py");

// ── Naming helpers ─────────────────────────────────────────────────────────────

function pascalToSnake(s: string): string {
  return s
    .replace(/([A-Z])/g, "_$1")
    .replace(/([a-zA-Z])(\d)/g, "$1_$2")
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

/** Schema name → model module name.  "MessageCreateRequest" → "message_create_request" */
function schemaToModule(name: string): string {
  return pascalToSnake(name);
}

/** Directory name → tag.  "group_tags" → "Group tags", "bots" → "Bots" */
function dirNameToTag(dirName: string): string {
  return dirName
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Module name → facade method name.  "bot_operations_delete_webhook_event" → "delete_webhook_event" */
function moduleNameToMethodName(moduleName: string): string {
  const match = moduleName.match(/_operations_(.+)$/);
  return match ? match[1] : moduleName;
}

function snakeToPascal(s: string): string {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
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
  primitiveItemType?: string; // e.g. "int" for data: [integer]
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

// ── Python SDK analysis ────────────────────────────────────────────────────────

const enumCache = new Map<string, boolean>();

/** Check if a model type is an enum by reading its model file for `(str, Enum)`. */
function isEnumModel(typeName: string): boolean {
  if (["int", "str", "float", "bool", "list", "dict", "Any"].includes(typeName)) {
    return false;
  }
  if (enumCache.has(typeName)) return enumCache.get(typeName)!;
  const modelFile = path.join(MODELS_PATH, schemaToModule(typeName) + ".py");
  if (!fs.existsSync(modelFile)) {
    enumCache.set(typeName, false);
    return false;
  }
  const content = fs.readFileSync(modelFile, "utf8");
  const isEnum = /class \w+\(str, Enum\)/.test(content);
  enumCache.set(typeName, isEnum);
  return isEnum;
}

/** Count real attrs fields in a model (excluding additional_properties). */
function countModelFields(modelName: string): number {
  const modelFile = path.join(MODELS_PATH, schemaToModule(modelName) + ".py");
  if (!fs.existsSync(modelFile)) return 0;
  const content = fs.readFileSync(modelFile, "utf8");
  // Match attr lines at 4-space indent inside the class body, before first method
  const classBody = content.match(/@_attrs_define\nclass \w+[^]*?"""\n\n([^]*?)(?:\n\n\n|\n    def )/);
  if (!classBody) return 0;
  const lines = classBody[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("additional_properties:") && /^\w+:\s/.test(l));
  return lines.length;
}

interface ParsedSync {
  pathParams: ParamInfo[];
  queryParams: ParamInfo[];
  bodyType?: string;
  successResponseType?: string; // undefined = void
}

/** Parse sync() function from an operation module file. Returns null if no sync() found. */
function parseSyncSignature(filePath: string): ParsedSync | null {
  const content = fs.readFileSync(filePath, "utf8");

  // Match `def sync(\n...\n) -> ReturnType:`
  const syncMatch = content.match(/^def sync\(\n([\s\S]*?)\n\) -> (.*?):/m);
  if (!syncMatch) return null;

  const paramsBlock = syncMatch[1];
  const returnTypeStr = syncMatch[2].trim();

  // Split on `*,` to separate positional (path) from keyword params
  const starIdx = paramsBlock.indexOf("*,");
  const positionalBlock = starIdx >= 0 ? paramsBlock.slice(0, starIdx) : "";
  const keywordBlock = starIdx >= 0 ? paramsBlock.slice(starIdx + 2) : paramsBlock;

  const pathParams: ParamInfo[] = [];
  const queryParams: ParamInfo[] = [];
  let bodyType: string | undefined;

  // Parse positional params (path params)
  for (const line of positionalBlock.split("\n")) {
    const m = line.trim().match(/^(\w+):\s*(.+?)\s*,?\s*$/);
    if (!m || m[1] === "client") continue;
    pathParams.push({
      name: m[1],
      pyName: m[1],
      location: "path",
      required: true,
      type: m[2].trim(),
    });
  }

  // Parse keyword params (query params + body)
  for (const line of keywordBlock.split("\n")) {
    const m = line.trim().match(/^(\w+):\s*(.+?)(?:\s*=\s*(.+?))?\s*,?\s*$/);
    if (!m) continue;

    const [, name, rawType, rawDefault] = m;
    if (name === "client") continue;

    if (name === "body") {
      bodyType = rawType.trim();
      continue;
    }

    const isOptional = rawType.includes("| Unset");
    const cleanType = rawType.replace(/\s*\|\s*Unset/, "").trim();
    const isEnum = isEnumModel(cleanType);

    queryParams.push({
      name,
      pyName: name,
      location: "query",
      required: !isOptional,
      type: cleanType,
      default: rawDefault?.trim(),
      schemaRef: isEnum ? cleanType : undefined,
    });
  }

  // Parse return type: filter out error types to find success response
  const returnTypes = returnTypeStr.split("|").map((t) => t.trim());
  const errorTypes = new Set(["ApiError", "OAuthError", "None", "Any"]);
  const successTypes = returnTypes.filter((t) => !errorTypes.has(t));
  const successResponseType = successTypes.length === 1 ? successTypes[0] : undefined;

  return { pathParams, queryParams, bodyType, successResponseType };
}

/** Analyze a response model to determine kind (list/single/void/direct). */
function analyzeResponseModel(responseClassName: string): ResponseInfo {
  const modelFile = path.join(MODELS_PATH, schemaToModule(responseClassName) + ".py");
  if (!fs.existsSync(modelFile)) {
    return { kind: "direct", modelName: responseClassName };
  }

  const content = fs.readFileSync(modelFile, "utf8");

  // Look for `data:` attribute in the class body
  const dataMatch = content.match(/^\s{4}data:\s*(.+)$/m);
  if (!dataMatch) {
    return { kind: "direct", modelName: responseClassName };
  }

  const dataType = dataMatch[1].trim();

  // list[SomeModel] or list[int]
  const listMatch = dataType.match(/^list\[(\w+(?:\.\w+)?)\]$/);
  if (listMatch) {
    const itemType = listMatch[1];
    const isPrimitive = ["int", "str", "float", "bool"].includes(itemType);
    if (isPrimitive) {
      return {
        kind: "list",
        responseClass: responseClassName,
        primitiveItemType: itemType,
      };
    }
    return {
      kind: "list",
      modelName: itemType,
      responseClass: responseClassName,
    };
  }

  // Single data: "data: SomeModel"
  const singleMatch = dataType.match(/^(\w+)$/);
  if (singleMatch) {
    return {
      kind: "single",
      modelName: singleMatch[1],
      responseClass: responseClassName,
    };
  }

  return { kind: "direct", modelName: responseClassName };
}

/** Analyze a request body model to determine wrapper/flat pattern. */
function analyzeRequestModel(bodyTypeName: string): RequestBodyInfo {
  const modelFile = path.join(MODELS_PATH, schemaToModule(bodyTypeName) + ".py");
  if (!fs.existsSync(modelFile)) {
    return { outerSchema: bodyTypeName, isWrapper: false, fieldCount: 0 };
  }

  const content = fs.readFileSync(modelFile, "utf8");

  // Extract attrs fields from class body (between docstring and first method)
  const classBody = content.match(/@_attrs_define\nclass \w+[^]*?"""\n\n([^]*?)(?:\n\n\n|\n    def )/);
  if (!classBody) {
    return { outerSchema: bodyTypeName, isWrapper: false, fieldCount: 0 };
  }

  const attrLines = classBody[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("additional_properties:") && /^\w+:\s/.test(l));

  interface ModelField {
    name: string;
    type: string;
    isUnset: boolean;
    defaultVal?: string;
  }

  const fields: ModelField[] = [];
  for (const line of attrLines) {
    const m = line.match(/^(\w+):\s*(.+?)(?:\s*=\s*(.+))?\s*$/);
    if (!m) continue;
    fields.push({
      name: m[1],
      type: m[2].trim(),
      isUnset: m[2].includes("Unset"),
      defaultVal: m[3]?.trim(),
    });
  }

  const fieldCount = fields.length;

  // Wrapper detection: exactly 1 field that is a non-primitive, non-enum model with real fields
  if (fields.length === 1) {
    const field = fields[0];
    const cleanType = field.type.replace(/\s*\|\s*Unset/, "").trim();
    const isPrimitive = ["int", "str", "float", "bool", "list", "dict", "Any"].includes(cleanType)
      || cleanType.startsWith("list[");
    if (!isPrimitive && !isEnumModel(cleanType)) {
      const innerFieldCount = countModelFields(cleanType);
      if (innerFieldCount > 0) {
        return {
          outerSchema: bodyTypeName,
          isWrapper: true,
          wrapperProp: field.name,
          innerSchema: cleanType,
          fieldCount: innerFieldCount,
        };
      }
    }
  }

  // Flat body — collect fields for potential flattening (≤2 fields)
  if (fieldCount <= 2) {
    const flatFields: FlatField[] = fields.map((f) => {
      const cleanType = f.type.replace(/\s*\|\s*Unset/, "").trim();
      const isEnum = isEnumModel(cleanType);
      return {
        name: f.name,
        pyName: f.name,
        type: cleanType,
        required: !f.isUnset,
        schemaRef: isEnum ? cleanType : undefined,
      };
    });
    return {
      outerSchema: bodyTypeName,
      isWrapper: false,
      fieldCount,
      flatFields,
    };
  }

  return { outerSchema: bodyTypeName, isWrapper: false, fieldCount };
}

/** Extract HTTP method and URL path from _get_kwargs in an operation module. */
function extractHttpMethodAndPath(content: string): { httpMethod: string; urlPath: string } {
  const methodMatch = content.match(/"method":\s*"(\w+)"/);
  const urlMatch = content.match(/"url":\s*"([^"]+)"/);
  return {
    httpMethod: methodMatch ? methodMatch[1] : "get",
    urlPath: urlMatch ? urlMatch[1] : "",
  };
}

/** Walk generated Python SDK and build OperationInfo for each operation. */
function collectOperationsFromPython(): OperationInfo[] {
  const ops: OperationInfo[] = [];

  const apiDirs = fs.readdirSync(API_PATH).filter((d) => {
    const full = path.join(API_PATH, d);
    return (
      fs.statSync(full).isDirectory() &&
      d !== "__pycache__" &&
      !d.startsWith(".")
    );
  });

  for (const dirName of apiDirs) {
    const tag = dirNameToTag(dirName);
    const dirPath = path.join(API_PATH, dirName);

    const modules = fs.readdirSync(dirPath).filter(
      (f) => f.endsWith(".py") && f !== "__init__.py",
    );

    for (const moduleFile of modules) {
      const moduleName = moduleFile.replace(/\.py$/, "");
      const filePath = path.join(dirPath, moduleFile);
      const content = fs.readFileSync(filePath, "utf8");

      // Parse sync() signature
      const parsed = parseSyncSignature(filePath);
      if (!parsed) continue; // Skip modules without sync() (e.g., multipart upload)

      // Analyze response
      let response: ResponseInfo;
      if (!parsed.successResponseType) {
        response = { kind: "void" };
      } else {
        response = analyzeResponseModel(parsed.successResponseType);
      }

      // Analyze request body
      let requestBody: RequestBodyInfo | undefined;
      if (parsed.bodyType) {
        requestBody = analyzeRequestModel(parsed.bodyType);
      }

      // Extract HTTP method and path
      const { httpMethod, urlPath } = extractHttpMethodAndPath(content);

      const methodName = moduleNameToMethodName(moduleName);

      ops.push({
        operationId: moduleName,
        httpMethod,
        path: urlPath,
        tag,
        methodName,
        moduleName,
        pathParams: parsed.pathParams,
        queryParams: parsed.queryParams,
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
  } else if (op.response.kind === "list" && op.response.primitiveItemType) {
    returnType = `PaginatedResponse[${op.response.primitiveItemType}]`;
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
  console.log("Scanning generated SDK:", API_PATH);

  const operations = collectOperationsFromPython();
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
