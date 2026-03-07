import type { IR } from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';

export class GoGenerator implements LanguageGenerator {
  readonly dirName = 'go';

  generate(_ir: IR): GeneratedFile[] {
    // TODO: implement Go emitter
    return [];
  }
}
