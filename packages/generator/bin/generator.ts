#!/usr/bin/env node

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generate, SUPPORTED_LANGS } from '../src/index.js';

const DEFAULT_SPEC_URL = 'https://dev.pachca.com/openapi.yaml';

function usage(): never {
  console.error(`Usage: @pachca/generator [--spec <path|url>] --output <dir> --lang <langs> [--examples]`);
  console.error(`  --spec      Path or URL to OpenAPI YAML spec (default: ${DEFAULT_SPEC_URL})`);
  console.error(`  --output    Output directory`);
  console.error(`  --lang      Comma-separated languages: ${SUPPORTED_LANGS.join(', ')}`);
  console.error(`  --examples  Generate examples.json with sample input/output`);
  process.exit(1);
}

async function fetchSpec(url: string): Promise<string> {
  console.error(`Fetching spec from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
    process.exit(1);
  }
  const content = await response.text();
  const tempFile = path.join(os.tmpdir(), `openapi-${Date.now()}.yaml`);
  fs.writeFileSync(tempFile, content);
  return tempFile;
}

async function parseArgs(): Promise<{ spec: string; output: string; langs: string[]; examples: boolean }> {
  const args = process.argv.slice(2);
  let spec = '';
  let output = '';
  let lang = '';
  let examples = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--spec':
        spec = args[++i] || '';
        break;
      case '--output':
        output = args[++i] || '';
        break;
      case '--lang':
        lang = args[++i] || '';
        break;
      case '--examples':
        examples = true;
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        usage();
    }
  }

  if (!output || !lang) usage();

  if (!spec) {
    spec = await fetchSpec(DEFAULT_SPEC_URL);
  } else if (spec.startsWith('http://') || spec.startsWith('https://')) {
    spec = await fetchSpec(spec);
  } else if (!fs.existsSync(spec)) {
    console.error(`Spec file not found: ${spec}`);
    process.exit(1);
  }

  const langs = lang.split(',').map((l) => l.trim());
  for (const l of langs) {
    if (!SUPPORTED_LANGS.includes(l)) {
      console.error(`Unknown language: ${l}. Supported: ${SUPPORTED_LANGS.join(', ')}`);
      process.exit(1);
    }
  }

  return { spec, output, langs, examples };
}

const { spec, output, langs, examples } = await parseArgs();
generate(spec, output, langs, { examples });
