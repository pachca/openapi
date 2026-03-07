#!/usr/bin/env bun

import * as fs from 'node:fs';
import { generate, SUPPORTED_LANGS } from '../src/index.js';

function usage(): never {
  console.error(`Usage: @pachca/generator --spec <path> --output <dir> --lang <langs>`);
  console.error(`  --spec    Path to OpenAPI YAML spec`);
  console.error(`  --output  Output directory`);
  console.error(`  --lang    Comma-separated languages: ${SUPPORTED_LANGS.join(', ')}`);
  process.exit(1);
}

function parseArgs(): { spec: string; output: string; langs: string[] } {
  const args = process.argv.slice(2);
  let spec = '';
  let output = '';
  let lang = '';

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
      default:
        console.error(`Unknown argument: ${args[i]}`);
        usage();
    }
  }

  if (!spec || !output || !lang) usage();

  if (!fs.existsSync(spec)) {
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

  return { spec, output, langs };
}

const { spec, output, langs } = parseArgs();
generate(spec, output, langs);
