/**
 * generate-client.ts
 *
 * Parses ogen-generated Go code and produces pachca_client.go —
 * a convenience wrapper with grouped services, flattened params,
 * type aliases, and unwrapped response types.
 *
 * Reads:
 *   generated/oas_client_gen.go      — Client methods
 *   generated/oas_parameters_gen.go  — Params structs (for flattening)
 *   generated/oas_schemas_gen.go     — Interface implementors and error type definitions
 *
 * Writes:
 *   generated/pachca_client.go       — Convenience wrapper
 *   generated/go.mod                 — Go module file (if not present)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";

// ─────────────────────────────────────────────────
// 1. Parse Client methods from oas_client_gen.go
// ─────────────────────────────────────────────────

const clientSrc = readFileSync("generated/oas_client_gen.go", "utf-8");

interface ParsedMethod {
  fullName: string; // e.g. "MessageOperationsCreateMessage"
  group: string; // e.g. "Message"
  shortName: string; // e.g. "CreateMessage"
  requestArg: string | null; // e.g. "request *MessageCreateRequest"
  paramsType: string | null; // e.g. "MessageOperationsGetMessageParams"
  returnType: string | null; // e.g. "MessageOperationsCreateMessageRes" — null if returns only error
}

const methods: ParsedMethod[] = [];

// Match: func (c *Client) Name(ctx context.Context[, args...]) (ReturnType, error) {
// Or:   func (c *Client) Name(ctx context.Context[, args...]) error {
const methodRe =
  /^func \(c \*Client\) (\w+)\(ctx context\.Context(?:,\s*(.*?))?\)\s+(?:\(([^)]+)\)|error)\s*\{/gm;

let match: RegExpExecArray | null;
while ((match = methodRe.exec(clientSrc)) !== null) {
  const fullName = match[1];
  const argsStr = (match[2] || "").trim();
  const retStr = (match[3] || "").trim();

  // Skip ogen's private send* methods (they're internal implementation details)
  if (fullName.startsWith("send")) continue;

  // Extract group from {Group}Operations{Method} pattern
  const groupMatch = fullName.match(/^(\w+?)Operations(\w+)$/);
  if (!groupMatch) continue;

  const group = groupMatch[1];
  const shortName = groupMatch[2];

  // Parse args: "request *Type" and/or "params Type"
  let requestArg: string | null = null;
  let paramsType: string | null = null;

  if (argsStr) {
    for (const part of argsStr.split(",").map((s) => s.trim())) {
      if (part.startsWith("request ")) {
        requestArg = part;
      } else if (part.startsWith("params ")) {
        paramsType = part.replace(/^params\s+/, "");
      }
    }
  }

  // Parse return type (first element before ", error")
  // Handle both unnamed "SomeType, error" and named "res SomeType, err error"
  let returnType: string | null = null;
  if (retStr) {
    const parts = retStr.split(",").map((s) => s.trim());
    if (parts[0] && parts[0] !== "error") {
      // Strip named return variable (e.g. "res SomeType" → "SomeType")
      const retTokens = parts[0].split(/\s+/);
      returnType =
        retTokens.length > 1 ? retTokens.slice(1).join(" ") : retTokens[0];
    }
  }

  methods.push({
    fullName,
    group,
    shortName,
    requestArg,
    paramsType,
    returnType,
  });
}

console.log(`Parsed ${methods.length} methods from oas_client_gen.go`);

// ─────────────────────────────────────────────────
// 2. Parse Params structs from oas_parameters_gen.go
// ─────────────────────────────────────────────────

interface ParamField {
  name: string; // Go field name, e.g. "ID"
  type: string; // Go type, e.g. "int32"
}

const paramsMap = new Map<string, ParamField[]>();

const paramsPath = "generated/oas_parameters_gen.go";
if (existsSync(paramsPath)) {
  const paramsSrc = readFileSync(paramsPath, "utf-8");

  // Match: type SomeParams struct { ... }
  // Use a simple state machine since struct bodies can be multiline
  const structStartRe = /^type (\w+Params) struct \{/gm;
  let structMatch: RegExpExecArray | null;

  while ((structMatch = structStartRe.exec(paramsSrc)) !== null) {
    const structName = structMatch[1];
    const startIdx = structMatch.index + structMatch[0].length;

    // Find closing brace
    let depth = 1;
    let endIdx = startIdx;
    for (let i = startIdx; i < paramsSrc.length && depth > 0; i++) {
      if (paramsSrc[i] === "{") depth++;
      if (paramsSrc[i] === "}") depth--;
      if (depth === 0) endIdx = i;
    }

    const body = paramsSrc.slice(startIdx, endIdx);
    const fields: ParamField[] = [];

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (
        !trimmed ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*")
      )
        continue;

      // Match: FieldName Type `json:"..."` or just FieldName Type
      const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)/);
      if (fieldMatch) {
        fields.push({ name: fieldMatch[1], type: fieldMatch[2] });
      }
    }

    if (fields.length > 0) {
      paramsMap.set(structName, fields);
    }
  }
}

console.log(`Parsed ${paramsMap.size} Params structs from oas_parameters_gen.go`);

// ─────────────────────────────────────────────────
// 3. Parse interface implementors from oas_schemas_gen.go
// ─────────────────────────────────────────────────

const schemasSrc = readFileSync("generated/oas_schemas_gen.go", "utf-8");

// Map: interface method name → implementor type names
// e.g. "messageOperationsCreateMessageRes" → ["MessageOperationsCreateMessageCreated", ...]
const resImplementors = new Map<string, string[]>();
const implRe = /func \(\*(\w+)\) (\w+Res)\(\)/g;
let implMatch: RegExpExecArray | null;
while ((implMatch = implRe.exec(schemasSrc)) !== null) {
  const typeName = implMatch[1];
  const interfaceMethod = implMatch[2];
  if (!resImplementors.has(interfaceMethod))
    resImplementors.set(interfaceMethod, []);
  resImplementors.get(interfaceMethod)!.push(typeName);
}

// Map: error type name → underlying type ("ApiError" | "OAuthError")
// e.g. "MessageOperationsCreateMessageBadRequest" → "ApiError"
const errorTypeMap = new Map<string, string>();
const errorTypeRe = /^type (\w+) (ApiError|OAuthError)$/gm;
let errorMatch: RegExpExecArray | null;
while ((errorMatch = errorTypeRe.exec(schemasSrc)) !== null) {
  errorTypeMap.set(errorMatch[1], errorMatch[2]);
}

console.log(
  `Parsed ${resImplementors.size} Res interfaces, ${errorTypeMap.size} error type definitions from oas_schemas_gen.go`
);

// ─────────────────────────────────────────────────
// 4. Classify interface implementors
// ─────────────────────────────────────────────────

interface ErrorCase {
  typeName: string; // e.g. "MessageOperationsCreateMessageBadRequest"
  errorType: string; // "ApiError" or "OAuthError"
  isRaw: boolean; // true if typeName IS "ApiError"/"OAuthError" directly
}

interface ResInfo {
  successType: string | null; // concrete success type or null
  isVoid: boolean; // true if success is NoContent (empty struct)
  noContentType: string | null; // e.g. "MessageOperationsDeleteMessageNoContent"
  errorCases: ErrorCase[];
}

const RAW_SUCCESS_TYPES = new Set(["Reaction", "UploadParams"]);
const RAW_ERROR_TYPES = new Set(["ApiError", "OAuthError"]);

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function classifyRes(returnType: string): ResInfo {
  const interfaceMethod = lowerFirst(returnType);
  const impls = resImplementors.get(interfaceMethod) || [];

  let successType: string | null = null;
  let isVoid = false;
  let noContentType: string | null = null;
  const errorCases: ErrorCase[] = [];

  for (const impl of impls) {
    if (RAW_ERROR_TYPES.has(impl)) {
      errorCases.push({ typeName: impl, errorType: impl, isRaw: true });
    } else if (RAW_SUCCESS_TYPES.has(impl)) {
      successType = impl;
    } else if (impl.endsWith("OK") || impl.endsWith("Created")) {
      successType = impl;
    } else if (impl.endsWith("NoContent")) {
      isVoid = true;
      noContentType = impl;
    } else {
      const underlying = errorTypeMap.get(impl);
      if (underlying) {
        errorCases.push({
          typeName: impl,
          errorType: underlying,
          isRaw: false,
        });
      }
    }
  }

  return { successType, isVoid, noContentType, errorCases };
}

// ─────────────────────────────────────────────────
// 5. Group methods and build alias maps
// ─────────────────────────────────────────────────

// group name → service name mapping
const SERVICE_NAMES: Record<string, string> = {
  Message: "Messages",
  Chat: "Chats",
  ChatMember: "ChatMembers",
  ChatMessage: "ChatMessages",
  User: "Users",
  UserStatus: "UserStatuses",
  Task: "Tasks",
  GroupTag: "Tags",
  Search: "Search",
  Security: "Security",
  Profile: "Profile",
  Bot: "Bots",
  Reaction: "Reactions",
  Thread: "Threads",
  Export: "Exports",
  Upload: "Uploads",
  Form: "Forms",
  Common: "Common",
  DirectUpload: "DirectUploads",
  LinkPreview: "LinkPreviews",
  ReadMember: "ReadMembers",
  OAuth: "OAuth",
};

function getServiceName(group: string): string {
  return SERVICE_NAMES[group] || group + "s";
}

const groups = new Map<string, ParsedMethod[]>();
for (const m of methods) {
  if (!groups.has(m.group)) groups.set(m.group, []);
  groups.get(m.group)!.push(m);
}

// Ensure Exports and Uploads groups exist (for manual methods)
if (!groups.has("Export")) groups.set("Export", []);
if (!groups.has("Upload")) groups.set("Upload", []);

console.log(`Found ${groups.size} service groups`);

// Build response type aliases: verbose ogen name → short alias
// e.g. "MessageOperationsCreateMessageCreated" → "CreateMessageResponse"
const responseAliases = new Map<string, string>();
// Build params type aliases: verbose ogen name → short alias
// e.g. "UserOperationsListUsersParams" → "ListUsersParams"
const paramsAliases = new Map<string, string>();

for (const m of methods) {
  // Response aliases
  if (m.returnType) {
    const info = classifyRes(m.returnType);
    if (info.successType && !RAW_SUCCESS_TYPES.has(info.successType)) {
      const prefix = `${m.group}Operations`;
      if (info.successType.startsWith(prefix)) {
        const stripped = info.successType.slice(prefix.length);
        let alias: string;
        if (stripped.endsWith("OK")) {
          alias = stripped.slice(0, -2) + "Response";
        } else if (stripped.endsWith("Created")) {
          alias = stripped.slice(0, -7) + "Response";
        } else {
          alias = stripped + "Response";
        }
        responseAliases.set(info.successType, alias);
      }
    }
  }

  // Params aliases
  if (m.paramsType) {
    const prefix = `${m.group}Operations`;
    if (m.paramsType.startsWith(prefix)) {
      const alias = m.paramsType.slice(prefix.length);
      paramsAliases.set(m.paramsType, alias);
    }
  }
}

console.log(
  `Generated ${responseAliases.size} response aliases, ${paramsAliases.size} params aliases`
);

// ─────────────────────────────────────────────────
// 6. Helpers for code generation
// ─────────────────────────────────────────────────

function shouldFlatten(paramsType: string): boolean {
  const fields = paramsMap.get(paramsType);
  return !!fields && fields.length <= 2;
}

function getReturnSignature(m: ParsedMethod): string {
  if (!m.returnType) return "error";

  const info = classifyRes(m.returnType);

  // Void method (NoContent success) — return just error
  if (info.isVoid && !info.successType) return "error";

  // Data method — return concrete success type
  if (info.successType) {
    const alias = responseAliases.get(info.successType);
    const typeName = alias || info.successType;
    return `(*${typeName}, error)`;
  }

  // Fallback: return original interface type
  return `(${m.returnType}, error)`;
}

function buildSignature(m: ParsedMethod, svcName: string): string {
  const args: string[] = ["ctx context.Context"];

  if (m.requestArg) {
    args.push(m.requestArg);
  }

  if (m.paramsType) {
    if (shouldFlatten(m.paramsType)) {
      const fields = paramsMap.get(m.paramsType)!;
      for (const f of fields) {
        args.push(`${lowerFirst(f.name)} ${f.type}`);
      }
    } else {
      const alias = paramsAliases.get(m.paramsType);
      args.push(`params ${alias || m.paramsType}`);
    }
  }

  const ret = getReturnSignature(m);
  return `func (s *${svcName}Service) ${m.shortName}(${args.join(", ")}) ${ret}`;
}

function buildCallExpr(m: ParsedMethod): string {
  const callArgs: string[] = ["ctx"];

  if (m.requestArg) {
    const varName = m.requestArg.split(" ")[0];
    callArgs.push(varName);
  }

  if (m.paramsType) {
    if (shouldFlatten(m.paramsType)) {
      const fields = paramsMap.get(m.paramsType)!;
      const assigns = fields
        .map((f) => `${f.name}: ${lowerFirst(f.name)}`)
        .join(", ");
      callArgs.push(`${m.paramsType}{${assigns}}`);
    } else {
      callArgs.push("params");
    }
  }

  return `s.client.${m.fullName}(${callArgs.join(", ")})`;
}

function buildMethodBody(m: ParsedMethod): string[] {
  const call = buildCallExpr(m);

  // No interface return — simple delegation
  if (!m.returnType) {
    return [`\treturn ${call}`];
  }

  const info = classifyRes(m.returnType);

  // No implementors found — fall back to simple delegation
  if (
    !info.successType &&
    !info.isVoid &&
    info.errorCases.length === 0
  ) {
    return [`\treturn ${call}`];
  }

  const hasData = !!info.successType;
  const body: string[] = [];

  body.push(`\tres, err := ${call}`);
  body.push(`\tif err != nil {`);
  body.push(hasData ? `\t\treturn nil, err` : `\t\treturn err`);
  body.push(`\t}`);
  body.push(`\tswitch v := res.(type) {`);

  // Success case
  if (info.successType) {
    body.push(`\tcase *${info.successType}:`);
    body.push(`\t\treturn v, nil`);
  }

  // Void success case
  if (info.noContentType) {
    body.push(`\tcase *${info.noContentType}:`);
    body.push(hasData ? `\t\treturn nil, nil` : `\t\treturn nil`);
  }

  // Error cases
  for (const ec of info.errorCases) {
    body.push(`\tcase *${ec.typeName}:`);
    if (ec.errorType === "ApiError") {
      // ApiError has Error() method added in pachca_client.go
      const expr = ec.isRaw ? "v" : `(*ApiError)(v)`;
      body.push(hasData ? `\t\treturn nil, ${expr}` : `\t\treturn ${expr}`);
    } else {
      // OAuthError needs wrapping (Error field conflicts with Error() method)
      const expr = ec.isRaw
        ? `&OAuthErrorResponse{v}`
        : `&OAuthErrorResponse{(*OAuthError)(v)}`;
      body.push(hasData ? `\t\treturn nil, ${expr}` : `\t\treturn ${expr}`);
    }
  }

  // Default case
  body.push(`\tdefault:`);
  body.push(
    hasData
      ? `\t\treturn nil, fmt.Errorf("unexpected response type: %T", res)`
      : `\t\treturn fmt.Errorf("unexpected response type: %T", res)`
  );
  body.push(`\t}`);

  return body;
}

// ─────────────────────────────────────────────────
// 7. Generate pachca_client.go
// ─────────────────────────────────────────────────

const lines: string[] = [];
const w = (s: string) => lines.push(s);

w("// Code generated by generate-client.ts. DO NOT EDIT.");
w("package pachca");
w("");
w("import (");
w('\t"bytes"');
w('\t"context"');
w('\t"fmt"');
w('\t"io"');
w('\t"mime/multipart"');
w('\t"net/http"');
w('\t"strings"');
w(")");
w("");

// Response type aliases
if (responseAliases.size > 0) {
  w("// Response type aliases for cleaner API usage.");
  w("type (");
  for (const [original, alias] of responseAliases) {
    w(`\t${alias} = ${original}`);
  }
  w(")");
  w("");
}

// Params type aliases
if (paramsAliases.size > 0) {
  w("// Params type aliases for cleaner API usage.");
  w("type (");
  for (const [original, alias] of paramsAliases) {
    w(`\t${alias} = ${original}`);
  }
  w(")");
  w("");
}

// Error helpers — make ApiError and OAuthError usable as Go errors
w("// Error implements the error interface for ApiError.");
w("func (e *ApiError) Error() string {");
w("\tif len(e.Errors) > 0 {");
w('\t\treturn "api error: " + e.Errors[0].Message');
w("\t}");
w('\treturn "api error"');
w("}");
w("");
w("// OAuthErrorResponse wraps OAuthError as a Go error value.");
w("// OAuthError has an Error field, so it cannot directly implement the error interface.");
w("type OAuthErrorResponse struct {");
w("\t*OAuthError");
w("}");
w("");
w("// Error implements the error interface for OAuthErrorResponse.");
w("func (e *OAuthErrorResponse) Error() string {");
w('\treturn "oauth error: " + e.GetError() + ": " + e.ErrorDescription');
w("}");
w("");

// Bearer token source
w("// bearerTokenSource implements SecuritySource for Bearer authentication.");
w("type bearerTokenSource struct {");
w("\ttoken string");
w("}");
w("");
w(
  "func (s *bearerTokenSource) BearerAuth(ctx context.Context, operationName string) (BearerAuth, error) {"
);
w("\treturn BearerAuth{Token: s.token}, nil");
w("}");
w("");

// PachcaClient struct
w("// PachcaClient provides a convenient grouped interface to the Pachca API.");
w("type PachcaClient struct {");
w("\tserverURL string");
w("\ttoken     string");
for (const [group] of groups) {
  const svc = getServiceName(group);
  w(`\t${svc} *${svc}Service`);
}
w("}");
w("");

// Constructor
w("// NewPachcaClient creates a new Pachca API client.");
w(
  "func NewPachcaClient(serverURL, token string) (*PachcaClient, error) {"
);
w(
  "\tclient, err := NewClient(serverURL, &bearerTokenSource{token: token})"
);
w("\tif err != nil {");
w("\t\treturn nil, err");
w("\t}");
w("\tp := &PachcaClient{");
w("\t\tserverURL: serverURL,");
w("\t\ttoken:     token,");
w("\t}");
for (const [group] of groups) {
  const svc = getServiceName(group);
  if (group === "Export") {
    w(
      `\tp.${svc} = &${svc}Service{client: client, serverURL: serverURL, token: token}`
    );
  } else {
    w(`\tp.${svc} = &${svc}Service{client: client}`);
  }
}
w("\treturn p, nil");
w("}");

// Service structs and methods
for (const [group, groupMethods] of groups) {
  const svc = getServiceName(group);

  w("");
  w(`// ${svc}Service provides ${group} API operations.`);
  if (group === "Export") {
    w(`type ${svc}Service struct {`);
    w("\tclient    *Client");
    w("\tserverURL string");
    w("\ttoken     string");
    w("}");
  } else {
    w(`type ${svc}Service struct {`);
    w("\tclient *Client");
    w("}");
  }

  for (const m of groupMethods) {
    w("");
    w(`${buildSignature(m, svc)} {`);
    for (const line of buildMethodBody(m)) {
      w(line);
    }
    w("}");
  }
}

// ─────────────────────────────────────────────────
// 8. Manual methods: UploadFile and DownloadExport
// ─────────────────────────────────────────────────

w("");
w("// UploadFile uploads a file to S3 using params from GetUploadParams.");
w("// This handles step 2 of the 3-step upload flow:");
w("//   1. Call Uploads.GetUploadParams() to get signing params and direct_url");
w("//   2. Call Uploads.UploadFile() with those params (this method)");
w("//   3. Use the key to attach the file to a message or other entity");
w(
  "func (s *UploadsService) UploadFile(ctx context.Context, uploadParams *UploadParams, file io.Reader, filename string) error {"
);
w("\tvar body bytes.Buffer");
w("\twriter := multipart.NewWriter(&body)");
w("");
w(
  '\tkey := strings.Replace(uploadParams.Key, "${filename}", filename, 1)'
);
w("");
w(
  '\t_ = writer.WriteField("Content-Disposition", uploadParams.ContentMinusDisposition)'
);
w('\t_ = writer.WriteField("acl", uploadParams.ACL)');
w('\t_ = writer.WriteField("policy", uploadParams.Policy)');
w(
  '\t_ = writer.WriteField("x-amz-credential", uploadParams.XMinusAmzMinusCredential)'
);
w(
  '\t_ = writer.WriteField("x-amz-algorithm", uploadParams.XMinusAmzMinusAlgorithm)'
);
w('\t_ = writer.WriteField("x-amz-date", uploadParams.XMinusAmzMinusDate)');
w(
  '\t_ = writer.WriteField("x-amz-signature", uploadParams.XMinusAmzMinusSignature)'
);
w('\t_ = writer.WriteField("key", key)');
w("");
w('\tpart, err := writer.CreateFormFile("file", filename)');
w("\tif err != nil {");
w("\t\treturn err");
w("\t}");
w("\tif _, err := io.Copy(part, file); err != nil {");
w("\t\treturn err");
w("\t}");
w("\tif err := writer.Close(); err != nil {");
w("\t\treturn err");
w("\t}");
w("");
w(
  '\treq, err := http.NewRequestWithContext(ctx, "POST", uploadParams.DirectURL, &body)'
);
w("\tif err != nil {");
w("\t\treturn err");
w("\t}");
w('\treq.Header.Set("Content-Type", writer.FormDataContentType())');
w("");
w("\tresp, err := http.DefaultClient.Do(req)");
w("\tif err != nil {");
w("\t\treturn err");
w("\t}");
w("\tdefer resp.Body.Close()");
w("");
w("\tif resp.StatusCode != http.StatusCreated {");
w('\t\treturn fmt.Errorf("upload failed with status %d", resp.StatusCode)');
w("\t}");
w("\treturn nil");
w("}");

w("");
w("// Download retrieves the download URL for a completed export.");
w(
  "// Returns the redirect Location URL without following the redirect."
);
w(
  "func (s *ExportsService) Download(ctx context.Context, id int32) (string, error) {"
);
w("\thttpClient := &http.Client{");
w(
  "\t\tCheckRedirect: func(req *http.Request, via []*http.Request) error {"
);
w("\t\t\treturn http.ErrUseLastResponse");
w("\t\t},");
w("\t}");
w("");
w(
  '\treqURL := fmt.Sprintf("%s/chats/exports/%d", s.serverURL, id)'
);
w(
  '\treq, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)'
);
w("\tif err != nil {");
w("\t\treturn \"\", err");
w("\t}");
w(
  '\treq.Header.Set("Authorization", "Bearer "+s.token)'
);
w("");
w("\tresp, err := httpClient.Do(req)");
w("\tif err != nil {");
w("\t\treturn \"\", err");
w("\t}");
w("\tdefer resp.Body.Close()");
w("");
w("\tif resp.StatusCode != http.StatusFound {");
w(
  '\t\treturn "", fmt.Errorf("expected 302 redirect, got %d", resp.StatusCode)'
);
w("\t}");
w("");
w('\tlocation := resp.Header.Get("Location")');
w("\tif location == \"\" {");
w('\t\treturn "", fmt.Errorf("no Location header in redirect response")');
w("\t}");
w("\treturn location, nil");
w("}");

// Write the file
const output = lines.join("\n") + "\n";
writeFileSync("generated/pachca_client.go", output);
console.log(
  `Generated pachca_client.go (${lines.length} lines, ${groups.size} services, ${methods.length} methods)`
);

// ─────────────────────────────────────────────────
// 9. Generate go.mod if not present
// ─────────────────────────────────────────────────

if (!existsSync("generated/go.mod")) {
  const goMod = `module github.com/pachca/openapi/sdk/go/generated

go 1.24.0

require github.com/ogen-go/ogen v1.20.0
`;
  writeFileSync("generated/go.mod", goMod);
  console.log("Generated go.mod");
}
