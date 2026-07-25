#!/usr/bin/env node
/**
 * Build gate: every example hand-authored in the spec must actually reach the
 * generated docs.
 *
 * An operation-level `example` on a media type is the request/response the API
 * really produces for THAT operation — something a schema-derived example
 * cannot know. `POST /threads` returns `message_id: null` because a standalone
 * thread has no message, while the `Thread` schema's own property example is a
 * real id.
 *
 * Both docs example generators used to skip straight to the schema, so all nine
 * authored examples were silently discarded and the pages showed values the API
 * never returns. Nothing caught it: the output was still valid JSON, still
 * matched the schema, and the committed artefacts were "in sync" with the
 * generator that produced them. This check compares against the SPEC instead.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';

const ROOT = resolve(import.meta.dirname, '../../..');
const SPEC = join(ROOT, 'packages/spec/openapi.yaml');
const API_DOCS = join(ROOT, 'apps/docs/public/api');

/** Every .md file under public/api, concatenated with its path. */
function loadDocs(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...loadDocs(full));
    else if (entry.endsWith('.md')) out.push({ path: full, text: readFileSync(full, 'utf-8') });
  }
  return out;
}

const spec = yaml.load(readFileSync(SPEC, 'utf-8'));
const docs = loadDocs(API_DOCS);
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** Authored examples: [{ where, example }] */
const authored = [];
for (const [path, item] of Object.entries(spec.paths ?? {})) {
  for (const method of METHODS) {
    const op = item[method];
    if (!op) continue;
    const label = `${method.toUpperCase()} ${path}`;

    const reqContent = op.requestBody?.content ?? {};
    for (const [media, obj] of Object.entries(reqContent)) {
      if (obj?.example !== undefined) {
        authored.push({ where: `${label} request (${media})`, example: obj.example });
      }
    }
    for (const [code, resp] of Object.entries(op.responses ?? {})) {
      for (const [media, obj] of Object.entries(resp?.content ?? {})) {
        if (obj?.example !== undefined) {
          authored.push({ where: `${label} response ${code} (${media})`, example: obj.example });
        }
      }
    }
  }
}

const errors = [];
for (const { where, example } of authored) {
  // The generators emit examples as JSON.stringify(value, null, 2).
  const rendered = JSON.stringify(example, null, 2);
  if (!docs.some((d) => d.text.includes(rendered))) {
    errors.push(
      `${where}: the spec declares an example, but it appears in no page under public/api.\n` +
        `      Expected this block verbatim:\n${rendered
          .split('\n')
          .slice(0, 6)
          .map((l) => `        ${l}`)
          .join('\n')}${rendered.split('\n').length > 6 ? '\n        …' : ''}`
    );
  }
}

if (authored.length === 0) {
  console.error('[check-examples] no authored examples found in the spec — is the parse right?');
  process.exit(1);
}

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} of ${authored.length} authored example(s) missing:\n`);
  for (const e of errors) console.error(`  • ${e}\n`);
  console.error(
    'A hand-written example in the spec beats a schema-derived one — it is the\n' +
      'response the API actually returns. Check that the docs example generators\n' +
      'still prefer the media-type `example` over generating from the schema.\n'
  );
  process.exit(1);
}

console.log(`✓ all ${authored.length} spec-authored examples reach the docs`);
