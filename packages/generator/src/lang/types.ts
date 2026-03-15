import type { IR, IRModel } from '../ir.js';

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
