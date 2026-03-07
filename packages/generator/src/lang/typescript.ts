import type { IR } from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';

export class TypeScriptGenerator implements LanguageGenerator {
  readonly dirName = 'ts';

  generate(_ir: IR): GeneratedFile[] {
    // TODO: implement TypeScript emitter
    return [];
  }
}
