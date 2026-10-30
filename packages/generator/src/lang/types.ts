import type { IR, IRField, IRFieldType, IRModel, IRRequestBody } from '../ir.js';
import { shouldUnwrapBody } from '../ir.js';

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
        break;
      }
      // A field may point at a union by a model ref: the example literal is
      // its first member, so that member is referenced too.
      const u = ir.unions.find((un) => un.name === name);
      if (u && u.memberRefs.length > 0) {
        for (const r of collectTypeRefs({ kind: 'model', ref: u.memberRefs[0] }, ir, models, visited)) refs.add(r);
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

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * The body a usage example sends, with what the literal builders need to spell it.
 *
 * With a hand-written body example in the spec, the literal follows it instead of
 * listing every field of the model: a model holds only the fields the example sets
 * (and its required ones), a primitive or an enum takes the example's value, an
 * array its first item, and a union puts first the member the example matches. A
 * model can allow fields that exclude each other (a button carries `url` or `data`,
 * a voice field means nothing on a picture), and only the example knows which go
 * together. Without an example the IR and the model index come back as they are.
 */
export function bodyExample(
  rb: IRRequestBody,
  ir: IR,
  models: Map<string, IRModel>,
): { type: IRFieldType; ir: IR; models: Map<string, IRModel> } {
  const unwrapped = shouldUnwrapBody(rb) && rb.unwrapField ? rb.unwrapField : undefined;
  const type: IRFieldType = unwrapped ? unwrapped.type : { kind: 'model', ref: rb.schemaRef };
  if (!isPlainObject(rb.example)) return { type, ir, models };
  const value = unwrapped ? rb.example[unwrapped.name] : rb.example;
  if (value === undefined || value === null) return { type, ir, models };

  const scoped = new Map(models);
  const firstMembers = new Map<string, string>();
  const done = new Set<string>();

  const unionOf = (ref: string | undefined) => (ref ? ir.unions.find((u) => u.name === ref) : undefined);

  /** The member whose fields hold every key of the value; a literal field must match. */
  const pickMember = (memberRefs: string[], v: Record<string, unknown>): string | undefined => {
    let best: { ref: string; score: number } | undefined;
    for (const ref of memberRefs) {
      const m = models.get(ref);
      if (!m) continue;
      const names = new Set(m.fields.map((f) => f.name));
      if (!Object.keys(v).every((k) => names.has(k))) continue;
      const literalMismatch = m.fields.some(
        (f) => f.type.kind === 'literal' && v[f.name] !== undefined && v[f.name] !== f.type.literalValue,
      );
      if (literalMismatch) continue;
      // Fewer fields the value leaves out is the closer member.
      const score = m.fields.filter((f) => !(f.name in v)).length;
      if (!best || score < best.score) best = { ref, score };
    }
    return best?.ref;
  };

  const apply = (ft: IRFieldType, v: unknown): IRFieldType => {
    if (v === undefined || v === null) return ft;
    switch (ft.kind) {
      case 'primitive':
      case 'enum':
        return { ...ft, example: v };
      case 'array':
        return Array.isArray(v) && v.length > 0 && ft.items ? { ...ft, items: apply(ft.items, v[0]) } : ft;
      case 'record': {
        if (!isPlainObject(v) || !ft.valueType) return ft;
        const first = Object.values(v)[0];
        return first === undefined ? ft : { ...ft, valueType: apply(ft.valueType, first) };
      }
      case 'model':
      case 'union': {
        if (!isPlainObject(v)) return ft;
        const u = unionOf(ft.ref);
        if (u) {
          const member = pickMember(u.memberRefs, v);
          if (member) {
            firstMembers.set(u.name, member);
            scopeModel(member, v);
          }
          return ft;
        }
        if (ft.ref) scopeModel(ft.ref, v);
        return ft;
      }
      default:
        return ft;
    }
  };

  const scopeModel = (name: string, v: Record<string, unknown>): void => {
    // A model met twice keeps the shape of its first value.
    if (done.has(name)) return;
    const model = models.get(name);
    if (!model) return;
    done.add(name);
    const fields: IRField[] = model.fields
      .filter((f) => (v[f.name] !== undefined && v[f.name] !== null) || f.required)
      .map((f) => ({ ...f, type: apply(f.type, v[f.name]) }));
    scoped.set(name, { ...model, fields });
  };

  const scopedType = apply(type, value);
  const scopedIr: IR = firstMembers.size === 0
    ? ir
    : {
        ...ir,
        unions: ir.unions.map((u) => {
          const first = firstMembers.get(u.name);
          return first ? { ...u, memberRefs: [first, ...u.memberRefs.filter((r) => r !== first)] } : u;
        }),
      };
  return { type: scopedType, ir: scopedIr, models: scoped };
}
