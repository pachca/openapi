import type { IR, IRFieldType, IRModel } from '../ir.js';

export interface GeneratedFile {
  /** Relative path within the language directory: "types.ts", "models.py" */
  path: string;
  content: string;
}

export interface GenerateOptions {
  /** Generate examples.json with sample input/output for each operation */
  examples?: boolean;
}

export interface LanguageGenerator {
  /** Output subdirectory name: "ts", "py", "go", "kt", "swift" */
  readonly dirName: string;
  /** Generate source files from IR */
  generate(ir: IR, options?: GenerateOptions): GeneratedFile[];
}

/** Collect all enum/model/union type names referenced by a field type. */
export function collectTypeRefs(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
): Set<string> {
  const refs = new Set<string>();
  switch (ft.kind) {
    case 'enum':
      if (ft.ref) refs.add(ft.ref);
      break;
    case 'model': {
      const name = ft.ref;
      if (!name || visited.has(name)) break;
      refs.add(name);
      const model = models.get(name);
      if (model) {
        const next = new Set(visited);
        next.add(name);
        for (const f of model.fields) {
          for (const r of collectTypeRefs(f.type, ir, models, next)) refs.add(r);
        }
      }
      break;
    }
    case 'union': {
      if (ft.ref) refs.add(ft.ref);
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        for (const r of collectTypeRefs({ kind: 'model', ref: u.memberRefs[0] }, ir, models, visited)) refs.add(r);
      }
      break;
    }
    case 'array':
      if (ft.items) for (const r of collectTypeRefs(ft.items, ir, models, visited)) refs.add(r);
      break;
    case 'record':
      if (ft.valueType) for (const r of collectTypeRefs(ft.valueType, ir, models, visited)) refs.add(r);
      break;
  }
  return refs;
}

/** Index models (including inline objects) by name for quick lookup. */
export function buildModelIndex(ir: IR): Map<string, IRModel> {
  const index = new Map<string, IRModel>();
  for (const m of ir.models) {
    index.set(m.name, m);
    for (const inl of m.inlineObjects) {
      index.set(inl.name, inl);
    }
  }
  return index;
}
