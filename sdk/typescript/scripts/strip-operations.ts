/**
 * strip-operations.ts
 *
 * Pre-generation step: reads the OpenAPI YAML spec and strips
 * the `*Operations_` prefix from all operationId values.
 *
 * Input:  ../../packages/spec/openapi.yaml
 * Output: src/generated/openapi.yaml
 *
 * Example: `SecurityOperations_getAuditEvents` → `getAuditEvents`
 *
 * All 64 operationIds are verified unique after stripping.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { parse, stringify } from "yaml";

const INPUT = "../../packages/spec/openapi.yaml";
const OUTPUT = "src/generated/openapi.yaml";

const spec = parse(readFileSync(INPUT, "utf-8"));

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];

const seen = new Set<string>();
let count = 0;

for (const pathItem of Object.values(spec.paths ?? {})) {
  for (const method of HTTP_METHODS) {
    const op = (pathItem as Record<string, any>)[method];
    if (!op?.operationId) continue;

    const original: string = op.operationId;
    // Strip prefix: `SecurityOperations_getAuditEvents` → `getAuditEvents`
    const stripped = original.replace(/^\w+Operations_/, "");

    if (seen.has(stripped)) {
      throw new Error(
        `Collision after stripping: "${stripped}" (from "${original}")`
      );
    }
    seen.add(stripped);

    op.operationId = stripped;
    count++;
  }
}

mkdirSync("src/generated", { recursive: true });
writeFileSync(OUTPUT, stringify(spec, { lineWidth: 0 }));
console.log(`Stripped ${count} operationIds → ${OUTPUT}`);
