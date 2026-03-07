import type { IR } from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';

export class SwiftGenerator implements LanguageGenerator {
  readonly dirName = 'swift';

  generate(_ir: IR): GeneratedFile[] {
    // TODO: implement Swift emitter
    return [];
  }
}
