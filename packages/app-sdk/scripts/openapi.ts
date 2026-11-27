
export type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  nullable?: boolean;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  items?: Schema;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  "x-query-array"?: string;
};
type Param = { name: string; in: string; required?: boolean; description?: string; schema: Schema };
type Operation = {
  operationId: string;
  description?: string;
  tags?: string[];
  parameters?: Param[];
  requestBody?: { required?: boolean; content?: Record<string, { schema: Schema }> };
  responses?: Record<string, { content?: Record<string, { schema: Schema }> }>;
  "x-requirements"?: { scope?: string | null; roles?: string[] };
};
export type Spec = {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema & { "x-scope-roles"?: Record<string, string[]> }> };
};

const SPEC = "packages/spec/openapi.yaml";

export const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const notForApps = (scope: string) => scope.startsWith("apps:");

export function scopes(spec: Spec): Record<string, string[] | null> {
  const s = spec.components.schemas.OAuthScope;
  if (!s?.enum) throw new Error(`${SPEC}: нет списка скоупов OAuthScope`);
  const roles = s["x-scope-roles"] ?? {};
  return Object.fromEntries(
    s.enum.filter((v) => !notForApps(String(v))).map((v) => [String(v), roles[String(v).replace(/:/g, "_")] ?? null]),
  );
}

const ident = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
const typeName = (ref: string) => ref.split("/").pop()!.replace(/[^\w$]/g, "_");
const doc = (text: string | undefined, indent: string) => {
  if (!text?.trim()) return "";
  const lines = text.trim().replace(/\*\//g, "*\\/").split("\n");
  return lines.length === 1 ? `${indent}/** ${lines[0]} */\n` : `${indent}/**\n${lines.map((l) => `${indent} *${l ? ` ${l}` : ""}`).join("\n")}\n${indent} */\n`;
};

class Gen {
  outgoing = new Set<string>();
  private spec: Spec;
  constructor(spec: Spec) {
    this.spec = spec;
  }

  resolve(s: Schema): Schema {
    let seen = 0;
    while (s.$ref && seen++ < 20) s = this.spec.components.schemas[typeName(s.$ref)] ?? {};
    return s;
  }

  type(s: Schema | undefined, indent = "", out = false): string {
    if (!s) return "unknown";
    const nul = s.nullable ? " | null" : "";
    if (s.$ref) {
      if (out) this.collect(s, new Set());
      return typeName(s.$ref) + nul;
    }
    if (s.allOf) return (s.allOf.length === 1 ? this.type(s.allOf[0], indent, out) : s.allOf.map((x) => this.type(x, indent, out)).join(" & ")) + nul;
    const union = s.oneOf ?? s.anyOf;
    if (union) return `(${union.map((x) => this.type(x, indent, out)).join(" | ")})${nul}`;
    if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ") + nul;
    if (s.type === "string" && s.format === "binary") return "PachcaFileInput" + nul;
    switch (s.type) {
      case "string": return "string" + nul;
      case "integer": case "number": return "number" + nul;
      case "boolean": return "boolean" + nul;
      case "array": return `Array<${this.type(s.items, indent, out)}>` + nul;
    }
    if (s.properties || s.additionalProperties || s.type === "object") {
      const parts: string[] = [];
      if (s.properties) {
        const inner = indent + "  ";
        const req = new Set(s.required ?? []);
        const fields = Object.entries(s.properties).map(([k, v]) => {
          if (out) this.outgoing.add(k);
          return `${doc(v.description, inner)}${inner}${ident(toCamel(k))}${req.has(k) ? "" : "?"}: ${this.type(v, inner, out)};`;
        });
        parts.push(`{\n${fields.join("\n")}\n${indent}}`);
      }
      if (s.additionalProperties) {
        parts.push(`Record<string, ${s.additionalProperties === true ? "unknown" : this.type(s.additionalProperties, indent, out)}>`);
      }
      return (parts.length ? parts.join(" & ") : "Record<string, unknown>") + nul;
    }
    return "unknown";
  }

  collect(s: Schema | undefined, seen: Set<string>): void {
    if (!s) return;
    if (s.$ref) {
      if (seen.has(s.$ref)) return;
      seen.add(s.$ref);
      return this.collect(this.resolve(s), seen);
    }
    for (const x of [...(s.allOf ?? []), ...(s.oneOf ?? []), ...(s.anyOf ?? [])]) this.collect(x, seen);
    if (s.items) this.collect(s.items, seen);
    for (const [k, v] of Object.entries(s.properties ?? {})) {
      this.outgoing.add(k);
      this.collect(v, seen);
    }
    if (typeof s.additionalProperties === "object") this.collect(s.additionalProperties, seen);
  }

  records(s: Schema | undefined, path: string, out: Set<string>, seen: string[] = []): void {
    if (!s) return;
    if (s.$ref) {
      if (seen.includes(s.$ref)) return;
      return this.records(this.resolve(s), path, out, [...seen, s.$ref]);
    }
    for (const x of [...(s.allOf ?? []), ...(s.oneOf ?? []), ...(s.anyOf ?? [])]) this.records(x, path, out, seen);
    if (s.items) this.records(s.items, path, out, seen);
    const child = (k: string) => (path ? `${path}.${k}` : k);
    for (const [k, v] of Object.entries(s.properties ?? {})) this.records(v, child(k), out, seen);
    if (typeof s.additionalProperties === "object") {
      out.add(path);
      this.records(s.additionalProperties, child("*"), out, seen);
    }
  }
}

const SECTION = (tag: string) =>
  tag.split(/\s+/).map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join("");
const METHOD = (operationId: string) => {
  const parts = operationId.split("_");
  return parts.length > 1 ? parts.slice(1).join("_") : parts[0]!;
};
const json = (c: Record<string, unknown> | undefined) => !c || Object.keys(c).every((k) => k === "application/json");
const binary = (c: Record<string, { schema: Schema }> | undefined) =>
  !!c && Object.keys(c).length > 0 && Object.entries(c).every(([k, v]) => k !== "application/json" && v.schema?.type === "string" && v.schema.format === "binary");

export interface PachcaOpRow {
  method: string;
  path: string;
  scope: string;
  unwrap: "data" | "full" | "none" | "binary";
  botOnly?: boolean;
  bodyRecords?: string[];
  resultRecords?: string[];
  queryArrays?: string[];
  multipart?: string[];
}

export function generatePachca(spec: Spec): { source: string; ops: Record<string, PachcaOpRow> } {
  const g = new Gen(spec);
  const sections = new Map<string, string[]>();
  const table: Record<string, PachcaOpRow> = {};
  for (const [path, ops] of Object.entries(spec.paths)) {
    for (const [verb, op] of Object.entries(ops)) {
      if (!["get", "post", "put", "patch", "delete"].includes(verb)) continue;
      const scope = op["x-requirements"]?.scope;
      if (!scope || notForApps(scope)) continue;
      const okCode = Object.keys(op.responses ?? {}).find((c) => /^2\d\d$/.test(c));
      const okContent = okCode ? op.responses![okCode]!.content : undefined;
      const binaryResult = binary(okContent);
      const form = op.requestBody?.content?.["multipart/form-data"]?.schema;
      if ((!json(op.requestBody?.content) && !form) || (!json(okContent) && !binaryResult)) continue;
      if (op.tags?.[0] === "Files" && !binaryResult) continue;

      const section = SECTION(op.tags?.[0] ?? "Common");
      const method = METHOD(op.operationId);
      const params = op.parameters ?? [];
      const group = (where: string) => {
        const ps = params.filter((p) => p.in === where);
        if (!ps.length) return undefined;
        for (const p of ps) if (where === "query") g.outgoing.add(p.name);
        const fields = ps.map((p) => `${doc(p.description, "      ")}      ${ident(toCamel(p.name))}${p.required ? "" : "?"}: ${g.type(p.schema, "      ")};`);
        return { required: ps.some((p) => p.required), text: `{\n${fields.join("\n")}\n    }` };
      };
      const args: string[] = [];
      const pathArgs = group("path");
      if (pathArgs) args.push(`    path: ${pathArgs.text};`);
      const queryArgs = group("query");
      if (queryArgs) args.push(`    query${queryArgs.required ? "" : "?"}: ${queryArgs.text};`);
      const body = op.requestBody?.content?.["application/json"]?.schema ?? form;
      if (body) args.push(`    body${op.requestBody?.required ? "" : "?"}: ${g.type(body, "    ", true)};`);
      const multipart = form ? Object.entries(g.resolve(form).properties ?? {}).filter(([, v]) => v.type === "string" && v.format === "binary").map(([k]) => k) : [];

      let unwrap: PachcaOpRow["unwrap"] = "none";
      let result = "void";
      const resSchema = okContent?.["application/json"]?.schema;
      if (binaryResult) {
        unwrap = "binary";
        result = "PachcaDownload";
      } else if (resSchema) {
        const top = g.resolve(resSchema);
        const keys = Object.keys(top.properties ?? {});
        if (keys.length === 1 && keys[0] === "data") {
          unwrap = "data";
          result = g.type(top.properties!.data, "    ");
        } else {
          unwrap = "full";
          result = g.type(resSchema, "    ");
        }
      }
      const bodyRecords = new Set<string>();
      g.records(body, "", bodyRecords);
      const resultRecords = new Set<string>();
      g.records(resSchema, "", resultRecords);
      const queryArrays = params.filter((p) => p.in === "query" && p.schema["x-query-array"] === "brackets").map((p) => p.name);
      const botOnly = op["x-requirements"]?.roles?.length === 1 && op["x-requirements"]!.roles![0] === "bot";

      const note = `${op.description?.trim() ?? op.operationId}\n\nСкоуп \`${scope}\`${botOnly ? ", только бот" : ""}. ${verb.toUpperCase()} ${path}`;
      const argsType = args.length ? `{\n${args.join("\n")}\n  }` : "{}";
      (sections.get(section) ?? sections.set(section, []).get(section)!).push(
        `${doc(note, "    ")}    ${method}: PachcaOp<${JSON.stringify(scope)}, ${botOnly}, ${argsType.replace(/\n/g, "\n  ")}, ${result.replace(/\n/g, "\n  ")}>;`
      );
      const row: PachcaOpRow = { method: verb.toUpperCase(), path, scope, unwrap };
      if (botOnly) row.botOnly = true;
      if (bodyRecords.size) row.bodyRecords = [...bodyRecords];
      if (resultRecords.size) row.resultRecords = [...resultRecords];
      if (queryArrays.length) row.queryArrays = queryArrays;
      if (multipart.length) row.multipart = multipart;
      table[`${section}.${method}`] = row;
    }
  }

  const broken = [...g.outgoing].filter((k) => toSnake(toCamel(k)) !== k);
  if (broken.length) throw new Error(`${SPEC}: имена полей не переводятся в camelCase и обратно: ${broken.join(", ")}`);

  const models = Object.entries(spec.components.schemas).map(([name, s]) => `${doc(s.description, "")}export type ${typeName(name)} = ${g.type(s)};`);
  const api = [...sections].map(([name, methods]) => `  ${name}: {\n${methods.join("\n")}\n  };`);
  const source = `// Сгенерировано из ${SPEC} (bun run generate в packages/app-sdk). Не править.
import type { PachcaDownload, PachcaFileInput, PachcaOp } from "../pachca.js";

${models.join("\n\n")}

/** Методы API Пачки: \`ctx.pachca.bot\` и \`ctx.pachca.user\` с правами из манифеста. */
export interface PachcaApi {
${api.join("\n")}
}
`;
  const ops = Object.fromEntries(Object.entries(table).sort(([a], [b]) => a.localeCompare(b)));
  return { source, ops };
}
