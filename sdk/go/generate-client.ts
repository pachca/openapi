/**
 * generate-client.ts
 *
 * Parses ogen-generated Go code and produces pachca_client.go —
 * a convenience wrapper with grouped services, flattened params, and manual methods.
 *
 * Reads:
 *   generated/oas_client_gen.go      — Client methods (method names, arg types, return types)
 *   generated/oas_parameters_gen.go  — Params structs (field names and types for flattening)
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
  returnType: string | null; // e.g. "*SomeType" or "[]SomeType" — null if returns only error
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
  let returnType: string | null = null;
  if (retStr) {
    const parts = retStr.split(",").map((s) => s.trim());
    if (parts[0] && parts[0] !== "error") {
      returnType = parts[0];
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
// 3. Group methods by operations prefix
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

// ─────────────────────────────────────────────────
// 4. Helpers for code generation
// ─────────────────────────────────────────────────

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function shouldFlatten(paramsType: string): boolean {
  const fields = paramsMap.get(paramsType);
  return !!fields && fields.length <= 2;
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
      args.push(`params ${m.paramsType}`);
    }
  }

  const ret = m.returnType ? `(${m.returnType}, error)` : "error";

  return `func (s *${svcName}Service) ${m.shortName}(${args.join(", ")}) ${ret}`;
}

function buildCall(m: ParsedMethod): string {
  const callArgs: string[] = ["ctx"];

  if (m.requestArg) {
    // Extract variable name from "request *Type"
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

// ─────────────────────────────────────────────────
// 5. Generate pachca_client.go
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
  // Exports service needs serverURL and token for manual Download method
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
    w(`\treturn ${buildCall(m)}`);
    w("}");
  }
}

// ─────────────────────────────────────────────────
// 6. Manual methods: UploadFile and DownloadExport
// ─────────────────────────────────────────────────

// Find the return type of UploadOperationsGetUploadParams to reference it
const uploadParamsMethod = methods.find(
  (m) => m.fullName === "UploadOperationsGetUploadParams"
);
const uploadParamsReturnType = uploadParamsMethod?.returnType || "*UploadOperationsGetUploadParamsCreated";

w("");
w("// UploadFile uploads a file to S3 using params from GetUploadParams.");
w("// This handles step 2 of the 3-step upload flow:");
w("//   1. Call Uploads.GetUploadParams() to get signing params and direct_url");
w("//   2. Call Uploads.UploadFile() with those params (this method)");
w("//   3. Use the key to attach the file to a message or other entity");
w(
  `func (s *UploadsService) UploadFile(ctx context.Context, directURL string, uploadParams ${uploadParamsReturnType}, file io.Reader, filename string) error {`
);
w("\tvar body bytes.Buffer");
w("\twriter := multipart.NewWriter(&body)");
w("");
w(
  '\tkey := strings.Replace(uploadParams.Data.Key, "${filename}", filename, 1)'
);
w("");
w(
  '\t_ = writer.WriteField("Content-Disposition", uploadParams.Data.ContentDisposition)'
);
w('\t_ = writer.WriteField("acl", uploadParams.Data.Acl)');
w('\t_ = writer.WriteField("policy", uploadParams.Data.Policy)');
w(
  '\t_ = writer.WriteField("x-amz-credential", uploadParams.Data.XAmzCredential)'
);
w(
  '\t_ = writer.WriteField("x-amz-algorithm", uploadParams.Data.XAmzAlgorithm)'
);
w('\t_ = writer.WriteField("x-amz-date", uploadParams.Data.XAmzDate)');
w(
  '\t_ = writer.WriteField("x-amz-signature", uploadParams.Data.XAmzSignature)'
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
  '\treq, err := http.NewRequestWithContext(ctx, "POST", directURL, &body)'
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
// 7. Generate go.mod if not present
// ─────────────────────────────────────────────────

if (!existsSync("generated/go.mod")) {
  const goMod = `module github.com/pachca/openapi/sdk/go/generated

go 1.24.0

require github.com/ogen-go/ogen v1.20.0
`;
  writeFileSync("generated/go.mod", goMod);
  console.log("Generated go.mod");
}
