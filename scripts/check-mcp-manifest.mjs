#!/usr/bin/env node
/**
 * Checks the @pachca/mcp-manifest package the way its consumer will.
 *
 *   1. `mcp-manifest.json` validates against `mcp-manifest.schema.json` with a
 *      JSON Schema 2020-12 validator (Ajv2020). These are the files that ship
 *      in the tarball, not the ones in packages/spec, so this is the check a
 *      server runs at start.
 *   2. With `--against-npm`: the version declared in the package's
 *      package.json keeps the versioning rule. When the `schema_version` major
 *      differs from the one in the `latest` release on npm, the server has to
 *      change before it loads the file, and when a tool or an argument of that
 *      release is gone, a client loses what it called: either way the declared
 *      version must be a major step. check-release only checks that the step is
 *      exact; which step is right is decided here.
 *
 * The package files are copies of what packages/spec generates; that they are
 * in sync is check-generated-sync's job (and the workflow's).
 *
 * Usage: node scripts/check-mcp-manifest.mjs [--against-npm]
 * Exits 1 on any problem. npm being unreachable is a problem too, only a real
 * E404 (the package is not published yet) is not.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = path.join(import.meta.dirname, '..');
const PKG_DIR = path.join(ROOT, 'packages', 'mcp-manifest');
const NPM_NAME = '@pachca/mcp-manifest';
const AGAINST_NPM = process.argv.includes('--against-npm');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const major = (version) => Number(String(version).split('.')[0]);

const manifest = readJson(path.join(PKG_DIR, 'mcp-manifest.json'));
const schema = readJson(path.join(PKG_DIR, 'mcp-manifest.schema.json'));
const problems = [];

// 1. The manifest against its schema. Same options as the generator: lenient
// about keywords Ajv does not know, so a description-only keyword is no error.
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  for (const e of (validate.errors ?? []).slice(0, 50)) {
    problems.push(`${e.instancePath || '/'} ${e.message} ${JSON.stringify(e.params)}`);
  }
}
if (!/^\d+\.\d+\.\d+$/.test(String(manifest.schema_version))) {
  problems.push(`schema_version "${manifest.schema_version}" is not X.Y.Z`);
}

// 2. The versioning rule against the `latest` release on npm.
function npm(args) {
  try {
    return execSync(`npm ${args}`, { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch (error) {
    const stderr = String(error?.stderr ?? error?.message ?? error);
    if (/E404|404 Not Found/.test(stderr)) return null;
    console.error(`[mcp-manifest] npm unreachable: ${stderr.slice(0, 300)}`);
    process.exit(1);
  }
}

/** One file out of a gunzipped npm tarball (ustar), or null. */
function fileFromTar(tar, wanted) {
  const field = (buf, from, to) => buf.toString('utf8', from, to).replace(/\0.*$/s, '');
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = field(header, 0, 100);
    const prefix = field(header, 345, 500);
    const size = parseInt(field(header, 124, 136).trim(), 8) || 0;
    offset += 512;
    if ((prefix ? `${prefix}/${name}` : name) === wanted) {
      return tar.subarray(offset, offset + size).toString('utf8');
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return null;
}

async function checkStep() {
  const declared = readJson(path.join(PKG_DIR, 'package.json')).version;
  if (!/^\d+\.\d+\.\d+$/.test(String(declared))) {
    problems.push(`packages/mcp-manifest/package.json: version "${declared}" is not X.Y.Z`);
    return;
  }
  const latest = npm(`view ${NPM_NAME} version`);
  if (!latest) {
    console.error(`[mcp-manifest] ${NPM_NAME} is not on npm yet: ${declared} is its first release`);
    return;
  }
  if (latest === declared) {
    console.error(`[mcp-manifest] ${declared} is already the latest on npm, no release to check`);
    return;
  }
  const tarball = npm(`view ${NPM_NAME}@${latest} dist.tarball`);
  const response = await fetch(tarball);
  if (!response.ok) {
    console.error(`[mcp-manifest] ${tarball} answered ${response.status}`);
    process.exit(1);
  }
  const tar = zlib.gunzipSync(Buffer.from(await response.arrayBuffer()));
  const published = fileFromTar(tar, 'package/mcp-manifest.json');
  if (!published) {
    // The bootstrap placeholder 0.0.0 (scripts/npm-bootstrap.mjs) is one.
    console.error(
      `[mcp-manifest] ${NPM_NAME}@${latest} carries no manifest, nothing to compare with`
    );
    return;
  }
  const previous = JSON.parse(published);
  const before = previous.schema_version;
  const now = manifest.schema_version;
  const contractChanged = major(before) !== major(now);
  // A tool or an argument that is gone takes away something a client of the
  // server may call, so it is a major step too, whatever the contract says.
  const argsOf = (tool) => Object.keys(tool.inputSchema?.properties ?? {});
  const current = new Map(manifest.tools.map((tool) => [tool.name, new Set(argsOf(tool))]));
  const removed = [];
  for (const tool of previous.tools ?? []) {
    const args = current.get(tool.name);
    if (!args) removed.push(tool.name);
    else for (const arg of argsOf(tool)) if (!args.has(arg)) removed.push(`${tool.name}.${arg}`);
  }
  if (removed.length > 0 && major(declared) <= major(latest)) {
    problems.push(
      `gone since ${latest}: ${removed.slice(0, 20).join(', ')}${removed.length > 20 ? ', …' : ''} — ` +
        `removing a tool or an argument is a major step (${major(latest) + 1}.0.0)`
    );
  }
  console.error(
    `[mcp-manifest] npm latest ${latest} (schema_version ${before}) → declared ${declared} ` +
      `(schema_version ${now})`
  );
  if (contractChanged && major(declared) <= major(latest)) {
    problems.push(
      `schema_version moved from ${before} to ${now}: the server has to change, so ` +
        `${declared} must be a major step after ${latest} (${major(latest) + 1}.0.0)`
    );
  }
}

if (AGAINST_NPM) await checkStep();

if (problems.length > 0) {
  console.error('\n✗ @pachca/mcp-manifest check failed:\n');
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✓ @pachca/mcp-manifest: ${manifest.tools.length} tools, schema_version ${manifest.schema_version}, ` +
    `valid against its schema${AGAINST_NPM ? ', version step keeps the rule' : ''}`
);
