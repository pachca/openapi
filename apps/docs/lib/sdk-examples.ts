import * as fs from 'fs';
import * as path from 'path';

const SDK_ROOT = path.join(process.cwd(), '..', '..', 'sdk');
const LOCATION_PATH = path.join(SDK_ROOT, 'examples-location.json');

interface ExampleEntry {
  usage: string;
  imports?: string[];
  output?: string;
}

type ExamplesJson = Record<string, ExampleEntry>;

const SDK_LANGUAGES = ['typescript', 'python', 'go', 'kotlin', 'swift', 'csharp'] as const;
type SdkLanguage = (typeof SDK_LANGUAGES)[number];

let cached: Record<SdkLanguage, ExamplesJson> | null = null;

function loadAll(): Record<SdkLanguage, ExamplesJson> {
  if (cached) return cached;

  const locations: Record<string, string> = JSON.parse(fs.readFileSync(LOCATION_PATH, 'utf8'));

  const result = {} as Record<SdkLanguage, ExamplesJson>;
  for (const lang of SDK_LANGUAGES) {
    const relPath = locations[lang];
    if (!relPath) {
      result[lang] = {};
      continue;
    }
    const fullPath = path.join(SDK_ROOT, relPath);
    result[lang] = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  }

  cached = result;
  return result;
}

const COMMENT_PREFIX: Record<SdkLanguage, string> = {
  typescript: '//',
  python: '#',
  go: '//',
  kotlin: '//',
  swift: '//',
  csharp: '//',
};

function buildImportBlock(
  lang: SdkLanguage,
  clientImports: string[],
  modelImports: string[]
): string {
  const clientSet = [...new Set(clientImports)].sort();
  const modelSet = [...new Set(modelImports)].sort();

  switch (lang) {
    case 'typescript': {
      const all = [...new Set([...clientSet, ...modelSet])].sort();
      return all.length > 0 ? `import { ${all.join(', ')} } from "@pachca/sdk"` : '';
    }
    case 'python': {
      const lines: string[] = [];
      if (clientSet.length > 0) lines.push(`from pachca.client import ${clientSet.join(', ')}`);
      if (modelSet.length > 0) lines.push(`from pachca.models import ${modelSet.join(', ')}`);
      return lines.join('\n');
    }
    case 'go': {
      return `import pachca "github.com/pachca/openapi/sdk/go/generated"`;
    }
    case 'kotlin': {
      const all = [...new Set([...clientSet, ...modelSet])].sort();
      return all.map((i) => `import com.pachca.sdk.${i}`).join('\n');
    }
    case 'swift': {
      return `import PachcaSDK`;
    }
    case 'csharp': {
      return `using Pachca.Sdk;`;
    }
  }
}

function appendOutput(lang: SdkLanguage, usage: string, output: string): string {
  const prefix = COMMENT_PREFIX[lang];
  return `${usage}\n${prefix} → ${output}`;
}

export function getSdkExampleForLang(
  lang: string,
  operations: Array<{ id: string; comment?: string }>,
  showInit = true
): string {
  const all = loadAll();
  const sdkLang = lang as SdkLanguage;
  const langData = all[sdkLang];
  if (!langData) return '';

  const prefix = COMMENT_PREFIX[sdkLang] ?? '//';

  const initEntry = langData['Client_Init'];
  const clientImports: string[] = [];
  const modelImports: string[] = [];
  if (showInit && initEntry?.imports) clientImports.push(...initEntry.imports);
  for (const op of operations) {
    const entry = langData[op.id];
    if (entry?.imports) modelImports.push(...entry.imports);
  }

  const parts: string[] = [];

  const importBlock = buildImportBlock(sdkLang, clientImports, modelImports);
  if (importBlock) parts.push(importBlock);

  if (showInit) {
    const init = initEntry?.usage;
    if (init) parts.push(init);
  }

  for (const op of operations) {
    const entry = langData[op.id];
    if (!entry?.usage) continue;
    let block = entry.usage;
    if (entry.output) block = appendOutput(sdkLang, block, entry.output);
    if (op.comment) {
      parts.push(`${prefix} ${op.comment}\n${block}`);
    } else {
      parts.push(block);
    }
  }

  return parts.join('\n\n');
}

export function getSdkExamples(operationId: string): Record<string, string> {
  const all = loadAll();
  const result: Record<string, string> = {};

  for (const lang of SDK_LANGUAGES) {
    const langData = all[lang];
    const initEntry = langData['Client_Init'];
    const entry = langData[operationId];

    if (entry?.usage) {
      const clientImports = initEntry?.imports ?? [];
      const modelImports = entry.imports ?? [];
      const parts: string[] = [];

      const importBlock = buildImportBlock(lang, clientImports, modelImports);
      if (importBlock) parts.push(importBlock);

      if (initEntry?.usage) parts.push(initEntry.usage);

      const usage = entry.output ? appendOutput(lang, entry.usage, entry.output) : entry.usage;
      parts.push(usage);

      result[lang] = parts.join('\n\n');
    } else {
      result[lang] = '';
    }
  }

  return result;
}
