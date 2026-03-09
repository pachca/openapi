import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseOpenAPI } from '@pachca/openapi-parser';
import { transform } from './transform.js';
import type { LanguageGenerator } from './lang/types.js';
import { TypeScriptGenerator } from './lang/typescript.js';
import { PythonGenerator } from './lang/python.js';
import { GoGenerator } from './lang/go.js';
import { KotlinGenerator } from './lang/kotlin.js';
import { SwiftGenerator } from './lang/swift.js';

const generators: Record<string, LanguageGenerator> = {
  typescript: new TypeScriptGenerator(),
  python: new PythonGenerator(),
  go: new GoGenerator(),
  kotlin: new KotlinGenerator(),
  swift: new SwiftGenerator(),
};

export const SUPPORTED_LANGS = Object.keys(generators);

export function generate(specPath: string, outputDir: string, langs: string[]): void {
  // 1. Parse OpenAPI spec
  const spec = parseOpenAPI(specPath);
  console.log(`Parsed ${spec.info.title} v${spec.info.version}`);
  console.log(`  ${Object.keys(spec.schemas).length} schemas, ${spec.endpoints.length} endpoints`);

  // 2. Transform to IR
  const ir = transform(spec);
  console.log(`IR: ${ir.enums.length} enums, ${ir.models.length} models, ${ir.unions.length} unions, ${ir.services.length} services`);

  // 3. Generate for each language
  for (const lang of langs) {
    const generator = generators[lang];
    if (!generator) {
      console.error(`Unknown language: ${lang}. Supported: ${SUPPORTED_LANGS.join(', ')}`);
      process.exit(1);
    }

    const files = generator.generate(ir);
    const langDir = path.join(outputDir, generator.dirName);
    fs.mkdirSync(langDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(langDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content);
    }

    console.log(`  ${lang} → ${generator.dirName}/ (${files.length} files)`);
  }
}
