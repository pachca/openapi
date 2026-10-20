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
 *      version must be a major step. A schema that changed beyond its
 *      descriptions needs a new schema_version, and a rule the server executes
 *      that changed (response_format, refusals, files and the rest) is a minor
 *      step at least: the README keeps patch for texts a model reads.
 *      check-release only checks that the step is exact; which step is right is
 *      decided here.
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

/**
 * Releases no server in use was built on, so a tool or an argument of theirs may
 * go in a minor step. 1.0.0 was replaced before any server in use took it:
 * 1.1.0 removed the arguments that let the server fetch a link a model wrote.
 */
const UNUSED_RELEASES = new Set(['1.0.0']);
const major = (version) => Number(String(version).split('.')[0]);
const minor = (version) => Number(String(version).split('.')[1]);

/** A value with its keys in order, so that moving a key is no change. */
const canonical = (node) =>
  Array.isArray(node)
    ? node.map(canonical)
    : node && typeof node === 'object'
      ? Object.fromEntries(
          Object.keys(node)
            .sort()
            .map((key) => [key, canonical(node[key])])
        )
      : node;

/**
 * A schema without its descriptions: what a server executes, not what it reads.
 * A description is dropped as text only, so a property named description stays.
 */
const structureOf = (node) =>
  Array.isArray(node)
    ? node.map(structureOf)
    : node && typeof node === 'object'
      ? Object.fromEntries(
          Object.keys(node)
            .filter((key) => !(key === 'description' && typeof node[key] === 'string'))
            .sort()
            .map((key) => [key, structureOf(node[key])])
        )
      : node;

/** The parts of the manifest the server executes rather than hands to a model. */
const RULES = [
  'response_format',
  'refusals',
  'files',
  'cache',
  'instruction_placeholders',
  'compat_address',
  'web_links',
  'authors',
  'compact_projections',
  'single_read_omit',
  'audiences',
];

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
  const allTools = (m) => [...(m.tools ?? []), ...(m.service_tools ?? [])];
  const current = new Map(allTools(manifest).map((tool) => [tool.name, new Set(argsOf(tool))]));
  const removed = [];
  for (const tool of allTools(previous)) {
    const args = current.get(tool.name);
    if (!args) removed.push(tool.name);
    else for (const arg of argsOf(tool)) if (!args.has(arg)) removed.push(`${tool.name}.${arg}`);
  }
  if (removed.length > 0 && major(declared) <= major(latest) && !UNUSED_RELEASES.has(latest)) {
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
  // The contract itself: a schema that changed beyond its descriptions is a new
  // schema_version, whatever the manifest says.
  const publishedSchema = fileFromTar(tar, 'package/mcp-manifest.schema.json');
  if (
    publishedSchema &&
    before === now &&
    JSON.stringify(structureOf(JSON.parse(publishedSchema))) !== JSON.stringify(structureOf(schema))
  ) {
    problems.push(
      `mcp-manifest.schema.json changed since ${latest} beyond its descriptions, and schema_version ` +
        `is still ${now}: raise it — the minor when a server built for ${before} still loads the ` +
        `file, the major when it has to change`
    );
  }
  // A patch is for texts a model reads: a rule the server executes, a tool or an
  // argument beyond its wording, and the contract version are no text fix.
  const changedRules = RULES.filter(
    (key) =>
      JSON.stringify(canonical(previous[key] ?? null)) !==
      JSON.stringify(canonical(manifest[key] ?? null))
  );
  const toolShape = (m) =>
    JSON.stringify(
      allTools(m).map(({ title: _t, description: _d, signature: _s, ...tool }) => ({
        ...canonical(tool),
        inputSchema: structureOf(tool.inputSchema ?? null),
        outputSchema: structureOf(tool.outputSchema ?? null),
      }))
    );
  const reasons = [
    ...changedRules,
    ...(before !== now ? [`schema_version ${before} → ${now}`] : []),
    ...(toolShape(previous) !== toolShape(manifest) ? ['tools or arguments'] : []),
  ];
  const patchStep = major(declared) === major(latest) && minor(declared) === minor(latest);
  if (reasons.length > 0 && patchStep) {
    problems.push(
      `changed since ${latest} beyond texts (${reasons.join(', ')}): ${declared} is a patch ` +
        `step, and this is a minor step at least (${major(latest)}.${minor(latest) + 1}.0)`
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
