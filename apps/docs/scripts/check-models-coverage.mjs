import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, '..', '..', '..', 'packages', 'spec', 'openapi.yaml');
const modelsPath = path.join(__dirname, '..', 'content', 'api', 'models.mdx');

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'];

/**
 * The models page (content/api/models.mdx) maps every data model to the methods
 * that operate on it. Unlike the left nav it is hand-curated — endpoints are
 * grouped by the model they read/write, a dimension that does not exist in the
 * spec (DELETE/action endpoints carry no response schema $ref, and model
 * sections cut across tags). So it cannot be generated.
 *
 * This guard makes drift loud instead of silent: every operation in the spec
 * must be referenced on the page (as `(METHOD /path)`), and every reference on
 * the page must still exist in the spec. When the backend adds or removes an
 * endpoint, `turbo check` fails until models.mdx is updated.
 *
 * Operations that genuinely never belong on the models page (if any ever
 * appear) go in ALLOWLIST below with a reason.
 */
const ALLOWLIST = new Set([
  // 'METHOD /path', // reason
]);

const openapi = yaml.load(fs.readFileSync(openapiPath, 'utf8'));

const specOps = new Set();
for (const [pathStr, pathItem] of Object.entries(openapi.paths)) {
  for (const method of Object.keys(pathItem)) {
    if (HTTP_METHODS.includes(method.toLowerCase())) {
      specOps.add(`${method.toUpperCase()} ${pathStr}`);
    }
  }
}

const mdx = fs.readFileSync(modelsPath, 'utf8');
const referenced = new Set();
const refRe = /\((GET|POST|PUT|DELETE|PATCH)\s+(\/[^)]+)\)/g;
let m;
while ((m = refRe.exec(mdx)) !== null) {
  referenced.add(`${m[1]} ${m[2]}`);
}

const missing = [...specOps].filter((op) => !referenced.has(op) && !ALLOWLIST.has(op)).sort();
const stale = [...referenced].filter((op) => !specOps.has(op)).sort();

console.log('=== MODELS PAGE COVERAGE ===\n');
console.log(`Spec operations:      ${specOps.size}`);
console.log(`Referenced on page:   ${referenced.size}`);
console.log(`Allowlisted:          ${ALLOWLIST.size}\n`);

let failed = false;

if (missing.length > 0) {
  failed = true;
  console.error('❌ In the spec but NOT on the models page (content/api/models.mdx):\n');
  missing.forEach((op) => console.error(`   ${op}`));
  console.error(
    '\n   Add each new endpoint to the matching model section in models.mdx,' +
      '\n   or add it to ALLOWLIST in this script if it does not return a data model.\n'
  );
}

if (stale.length > 0) {
  failed = true;
  console.error('❌ On the models page but NOT in the spec (stale references):\n');
  stale.forEach((op) => console.error(`   ${op}`));
  console.error('\n   Remove or fix these references in models.mdx.\n');
}

if (failed) {
  console.error('❌ Build failed: models page is out of sync with the OpenAPI spec.\n');
  process.exit(1);
}

console.log('✅ Models page covers every spec operation.\n');
