import type { IR } from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';

export class PythonGenerator implements LanguageGenerator {
  readonly dirName = 'py';

  generate(_ir: IR): GeneratedFile[] {
    // TODO: implement Python emitter
    return [];
  }
}
