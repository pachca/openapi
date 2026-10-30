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

// Standard-library names an example may use besides the SDK, detected in its code:
// the import block has to bring them in for the example to compile as shown.
const GO_STD_PACKAGES: Array<[string, RegExp]> = [
  ['bytes', /\bbytes\.NewReader\(/],
  ['context', /\bcontext\.Background\(/],
  ['time', /\btime\.(Date|Now|UTC|FixedZone)\b/],
];

function buildImportBlock(
  lang: SdkLanguage,
  clientImports: string[],
  modelImports: string[],
  code = ''
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
      if (/\bdatetime\.fromisoformat\(/.test(code)) lines.push('from datetime import datetime', '');
      if (clientSet.length > 0) lines.push(`from pachca.client import ${clientSet.join(', ')}`);
      if (modelSet.length > 0) lines.push(`from pachca.models import ${modelSet.join(', ')}`);
      return lines.join('\n').trim();
    }
    case 'go': {
      const sdk = 'pachca "github.com/pachca/openapi/sdk/go/generated"';
      const std = GO_STD_PACKAGES.filter(([, re]) => re.test(code)).map(([pkg]) => pkg);
      if (std.length === 0) return `import ${sdk}`;
      return `import (\n${std.map((pkg) => `\t"${pkg}"`).join('\n')}\n\n\t${sdk}\n)`;
    }
    case 'kotlin': {
      const all = [...new Set([...clientSet, ...modelSet])].sort();
      const lines = all.map((i) => `import com.pachca.sdk.${i}`);
      if (/\bOffsetDateTime\.parse\(/.test(code)) lines.push('import java.time.OffsetDateTime');
      return lines.join('\n');
    }
    case 'swift': {
      // Data (file and avatar uploads) is a Foundation type: such an example needs the import.
      return /\bData\(/.test(code) ? 'import Foundation\nimport PachcaSDK' : 'import PachcaSDK';
    }
    case 'csharp': {
      // TaskStatus is also a type in System.Threading.Tasks, imported implicitly by .NET projects.
      const lines = ['using Pachca.Sdk;'];
      if (/\bTaskStatus\./.test(code)) lines.push('using TaskStatus = Pachca.Sdk.TaskStatus;');
      return lines.join('\n');
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

  const code = [
    showInit ? (initEntry?.usage ?? '') : '',
    ...operations.map((op) => langData[op.id]?.usage ?? ''),
  ].join('\n');
  const importBlock = buildImportBlock(sdkLang, clientImports, modelImports, code);
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

/**
 * Build-time validation: returns all valid SDK symbols (service.method pairs and import names)
 * extracted from examples.json for a given language.
 */
const MODEL_SOURCES: Partial<Record<SdkLanguage, { file: string; pattern: RegExp }>> = {
  typescript: {
    file: path.join('typescript', 'src', 'generated', 'types.ts'),
    pattern: /^export (?:interface|type|enum|class) (\w+)/gm,
  },
  python: {
    file: path.join('python', 'generated', 'pachca', 'models.py'),
    pattern: /^class (\w+)/gm,
  },
};

function exportedModelNames(lang: SdkLanguage): string[] {
  const source = MODEL_SOURCES[lang];
  if (!source) return [];
  const fullPath = path.join(SDK_ROOT, source.file);
  if (!fs.existsSync(fullPath)) return [];
  const code = fs.readFileSync(fullPath, 'utf8');
  return [...code.matchAll(source.pattern)].map((m) => m[1]);
}

export function getValidSdkSymbols(lang: string): {
  methods: Map<string, Set<string>>;
  imports: Set<string>;
} {
  const all = loadAll();
  const sdkLang = lang as SdkLanguage;
  const langData = all[sdkLang];
  if (!langData) return { methods: new Map(), imports: new Set() };

  const methods = new Map<string, Set<string>>();
  const imports = new Set<string>();
  const methodRegex = /client\.(\w+)\.(\w+)\s*\(/g;

  for (const [opId, entry] of Object.entries(langData)) {
    if (opId === 'Client_Init') continue;

    // Extract service.method pairs from usage code
    let match;
    while ((match = methodRegex.exec(entry.usage)) !== null) {
      const [, service, method] = match;
      if (!methods.has(service)) methods.set(service, new Set());
      methods.get(service)!.add(method);
    }
    methodRegex.lastIndex = 0;

    if (entry.imports) {
      for (const imp of entry.imports) {
        imports.add(imp);
      }
    }
  }

  // Client_Init imports (PachcaClient etc.)
  const initEntry = langData['Client_Init'];
  if (initEntry?.imports) {
    for (const imp of initEntry.imports) {
      imports.add(imp);
    }
  }

  // Models the SDK exports but no example imports (a request example may leave
  // out optional nested types, e.g. MessageCreateRequestFile)
  for (const name of exportedModelNames(sdkLang)) {
    imports.add(name);
  }

  // Add *All / *_all pagination variants (auto-generated wrappers not in examples.json)
  for (const methodSet of methods.values()) {
    const variants: string[] = [];
    for (const method of methodSet) {
      variants.push(lang === 'python' ? method + '_all' : method + 'All');
    }
    for (const v of variants) {
      methodSet.add(v);
    }
  }

  return { methods, imports };
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

      const code = `${initEntry?.usage ?? ''}\n${entry.usage}`;
      const importBlock = buildImportBlock(lang, clientImports, modelImports, code);
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
