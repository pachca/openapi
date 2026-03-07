import type { IR } from '../ir.js';

export interface GeneratedFile {
  /** Relative path within the language directory: "types.ts", "models.py" */
  path: string;
  content: string;
}

export interface LanguageGenerator {
  /** Output subdirectory name: "ts", "py", "go", "kt", "swift" */
  readonly dirName: string;
  /** Generate source files from IR */
  generate(ir: IR): GeneratedFile[];
}
