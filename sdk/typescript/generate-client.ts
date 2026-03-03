/**
 * generate-client.ts
 *
 * Post-generation step: parses hey-api generated TypeScript SDK and
 * the OpenAPI YAML spec to produce src/pachca.ts — a convenience
 * wrapper class with grouped services and pagination helpers.
 *
 * Reads:
 *   src/generated/sdk.gen.ts          — Exported SDK functions
 *   ../../packages/spec/openapi.yaml  — Tags for grouping + pagination detection
 *
 * Writes:
 *   src/pachca.ts                     — Pachca facade class
 */

import { readFileSync, writeFileSync } from "fs";
import { parse } from "yaml";

// ─────────────────────────────────────────────────
// 1. Parse SDK functions from sdk.gen.ts
// ─────────────────────────────────────────────────

const sdkSrc = readFileSync("src/generated/sdk.gen.ts", "utf-8");

interface ParsedFn {
  fnName: string; // e.g. "createMessage"
  dataType: string; // e.g. "CreateMessageData"
  optionality: "required" | "optional"; // whether options param has ?
}

const fns: ParsedFn[] = [];

// Match: export const fnName = <ThrowOnError ...>(options: Options<DataType, ThrowOnError>) =>
// or:   export const fnName = <ThrowOnError ...>(options?: Options<DataType, ThrowOnError>) =>
const fnRe =
  /export const (\w+) = <[^>]+>\(options(\??):\s*Options<(\w+)/g;

let match: RegExpExecArray | null;
while ((match = fnRe.exec(sdkSrc)) !== null) {
  fns.push({
    fnName: match[1],
    dataType: match[3],
    optionality: match[2] === "?" ? "optional" : "required",
  });
}

console.log(`Parsed ${fns.length} functions from sdk.gen.ts`);

// ─────────────────────────────────────────────────
// 2. Parse OpenAPI YAML for tags and pagination
// ─────────────────────────────────────────────────

const spec = parse(readFileSync("../../packages/spec/openapi.yaml", "utf-8"));

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
];

interface OpInfo {
  strippedId: string; // operationId after stripping *Operations_
  tag: string; // first tag
  paginated: boolean; // has cursor query param
}

const opInfoMap = new Map<string, OpInfo>();

for (const [, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of HTTP_METHODS) {
    const op = (pathItem as Record<string, any>)[method];
    if (!op?.operationId) continue;

    const originalId: string = op.operationId;
    const strippedId = originalId.replace(/^\w+Operations_/, "");
    const tag: string = op.tags?.[0] ?? "Common";

    // Detect pagination: operation has a "cursor" query parameter
    const params: any[] = op.parameters ?? [];
    const paginated = params.some(
      (p: any) => p.in === "query" && p.name === "cursor"
    );

    opInfoMap.set(strippedId, { strippedId, tag, paginated });
  }
}

console.log(
  `Parsed ${opInfoMap.size} operations from OpenAPI spec (${[...opInfoMap.values()].filter((o) => o.paginated).length} paginated)`
);

// ─────────────────────────────────────────────────
// 3. Map tags → service names
// ─────────────────────────────────────────────────

const TAG_TO_SERVICE: Record<string, string> = {
  Messages: "messages",
  Chats: "chats",
  Users: "users",
  Tasks: "tasks",
  "Group tags": "tags",
  Members: "members",
  Reactions: "reactions",
  Thread: "threads",
  Profile: "profile",
  Bots: "bots",
  Security: "security",
  // Merged into "common"
  Common: "common",
  Views: "common",
  Search: "common",
  "Link Previews": "common",
  "Read member": "common",
};

// ─────────────────────────────────────────────────
// 4. Group functions by service
// ─────────────────────────────────────────────────

interface ServiceMethod {
  fn: ParsedFn;
  paginated: boolean;
}

const services = new Map<string, ServiceMethod[]>();

for (const fn of fns) {
  const info = opInfoMap.get(fn.fnName);
  if (!info) {
    console.warn(`No OpenAPI info for function: ${fn.fnName}`);
    continue;
  }

  const serviceName = TAG_TO_SERVICE[info.tag] ?? "common";

  if (!services.has(serviceName)) {
    services.set(serviceName, []);
  }
  services.get(serviceName)!.push({
    fn,
    paginated: info.paginated,
  });
}

// ─────────────────────────────────────────────────
// 5. Generate listAll method name for paginated ops
// ─────────────────────────────────────────────────

function paginatedMethodName(fnName: string): string {
  // listUsers → listAllUsers, listChats → listAllChats
  if (fnName.startsWith("list")) {
    return fnName.replace(/^list/, "listAll");
  }
  // searchChats → searchAllChats
  if (fnName.startsWith("search")) {
    return fnName.replace(/^search/, "searchAll");
  }
  // getTagUsers → getAllTagUsers, getAuditEvents → getAllAuditEvents
  if (fnName.startsWith("get")) {
    return fnName.replace(/^get/, "getAll");
  }
  return `${fnName}All`;
}

// ─────────────────────────────────────────────────
// 6. Generate src/pachca.ts
// ─────────────────────────────────────────────────

// Collect all imports
const fnImports = new Set<string>();
const typeImports = new Set<string>();

for (const methods of services.values()) {
  for (const { fn } of methods) {
    fnImports.add(fn.fnName);
    typeImports.add(fn.dataType);
  }
}

// Service order (matches Go SDK)
const SERVICE_ORDER = [
  "messages",
  "chats",
  "users",
  "tasks",
  "tags",
  "members",
  "reactions",
  "threads",
  "profile",
  "bots",
  "security",
  "common",
];

let hasPagination = false;
for (const methods of services.values()) {
  if (methods.some((m) => m.paginated)) {
    hasPagination = true;
    break;
  }
}

const lines: string[] = [];

lines.push("// AUTO-GENERATED by generate-client.ts — do not edit manually");
lines.push("");
lines.push(
  `import { createClient } from "./generated/client/index.js";`
);
lines.push(
  `import type { Client, Options } from "./generated/client/index.js";`
);

// SDK function imports
const sortedFnImports = [...fnImports].sort();
lines.push(
  `import {\n  ${sortedFnImports.join(",\n  ")},\n} from "./generated/sdk.gen.js";`
);

// Type imports
const sortedTypeImports = [...typeImports].sort();
lines.push(
  `import type {\n  ${sortedTypeImports.join(",\n  ")},\n} from "./generated/types.gen.js";`
);

if (hasPagination) {
  lines.push(`import { paginate } from "./paginate.js";`);
}

lines.push("");
lines.push("export interface PachcaConfig {");
lines.push("  /** Bearer access token */");
lines.push("  token: string;");
lines.push(
  "  /** Base URL (default: https://api.pachca.com/api/shared/v1) */"
);
lines.push("  baseUrl?: string;");
lines.push("}");
lines.push("");
lines.push("export class Pachca {");
lines.push("  private readonly client: Client;");
lines.push("");
lines.push("  constructor(config: PachcaConfig) {");
lines.push("    this.client = createClient({");
lines.push(
  '      baseUrl: config.baseUrl ?? "https://api.pachca.com/api/shared/v1",'
);
lines.push("      auth: () => config.token,");
lines.push("    });");
lines.push("  }");

for (const serviceName of SERVICE_ORDER) {
  const methods = services.get(serviceName);
  if (!methods || methods.length === 0) continue;

  lines.push("");
  lines.push(`  // ── ${serviceName} ${"─".repeat(Math.max(0, 50 - serviceName.length))}`);
  lines.push("");
  lines.push(`  readonly ${serviceName} = {`);

  // Regular methods
  for (let i = 0; i < methods.length; i++) {
    const { fn } = methods[i];
    const optsMark = fn.optionality === "optional" ? "?" : "";
    lines.push(
      `    ${fn.fnName}: (options${optsMark}: Omit<Options<${fn.dataType}>, "client">) =>`
    );
    lines.push(
      `      ${fn.fnName}({ ...options, client: this.client } as Options<${fn.dataType}>),`
    );
  }

  // Pagination listAll methods
  const paginatedMethods = methods.filter((m) => m.paginated);
  for (const { fn } of paginatedMethods) {
    const allName = paginatedMethodName(fn.fnName);
    const optsMark = fn.optionality === "optional" ? "?" : "";
    lines.push(
      `    ${allName}: (options${optsMark}: Omit<Options<${fn.dataType}>, "client">) =>`
    );
    lines.push(
      `      paginate(`
    );
    lines.push(
      `        (opts: any) => ${fn.fnName}({ ...opts, client: this.client }),`
    );
    lines.push(`        (options ?? {}) as any,`);
    lines.push(`      ),`);
  }

  lines.push("  };");
}

lines.push("}");
lines.push("");

writeFileSync("src/pachca.ts", lines.join("\n"));
console.log(
  `Generated src/pachca.ts with ${SERVICE_ORDER.filter((s) => services.has(s)).length} services`
);
