import type { IR } from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';

export class KotlinGenerator implements LanguageGenerator {
  readonly dirName = 'kt';

  generate(_ir: IR): GeneratedFile[] {
    // TODO: implement Kotlin emitter
    return [];
  }
}
