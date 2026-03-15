import type { IR } from '../ir.js';

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
