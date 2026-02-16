import { readFileSync, writeFileSync } from "fs";
import { parse, stringify } from "yaml";

const spec = parse(readFileSync("../../packages/spec/openapi.yaml", "utf-8"));

function strip(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(strip);
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj))
      if (k !== "x-enum-descriptions") result[k] = strip(v);
    return result;
  }
  return obj;
}

writeFileSync("generated/openapi-kotlin.yaml", stringify(strip(spec)));
