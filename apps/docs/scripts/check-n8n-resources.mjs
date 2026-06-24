import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const V2_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'integrations',
  'n8n',
  'nodes',
  'Pachca',
  'V2'
);
const GUIDE = path.join(__dirname, '..', 'content', 'guides', 'n8n', 'resources.mdx');

/**
 * The n8n resources guide (content/guides/n8n/resources.mdx) is hand-written:
 * it maps each node Resource → Operation to the API method it calls. Unlike the
 * SDK/CLI references it is NOT generated, so it silently drifts when the node
 * gains or loses an operation (e.g. the Bot resource gained Create / Get /
 * Update Webhook but the guide kept listing only 3 of 6 operations).
 *
 * This guard makes that drift loud: every operation exposed by the V2 node
 * descriptions must be listed in the guide under its resource, with the exact
 * same operation name — and the guide must not list operations the node does
 * not have. `turbo check` fails until resources.mdx matches the node.
 */

// node resource key (from <Name>Description.ts) → guide section heading
const SECTION = {
  Bot: 'Bot',
  Chat: 'Chat',
  CustomProperty: 'Custom Property',
  File: 'File',
  Form: 'Form',
  GroupTag: 'Group Tag',
  Member: 'Chat Member',
  Message: 'Message',
  Oauth: 'OAuth',
  Profile: 'Profile',
  Reaction: 'Reaction',
  ReadMember: 'Read Member',
  Search: 'Search',
  Security: 'Security',
  Task: 'Task',
  Thread: 'Thread',
  User: 'User',
};

// Operation options carry name + value + action; field options (name + value only)
// do not — so requiring `action:` isolates real operations.
const OP_RE = /name: '([^'\n]+)',\s*\n\s*value: '[^'\n]+',\s*\n\s*action: '/g;

function nodeOps() {
  const out = {};
  for (const f of fs.readdirSync(V2_DIR).filter((x) => x.endsWith('Description.ts'))) {
    const txt = fs.readFileSync(path.join(V2_DIR, f), 'utf8');
    out[f.replace('Description.ts', '')] = [...txt.matchAll(OP_RE)].map((m) => m[1]);
  }
  return out;
}

function guideSections() {
  const lines = fs.readFileSync(GUIDE, 'utf8').split('\n');
  const sections = {};
  let cur = null;
  for (const ln of lines) {
    const h = ln.match(/^## (.+)$/);
    if (h) {
      cur = h[1].trim();
      sections[cur] = [];
      continue;
    }
    const row = ln.match(/^\|\s*([A-Za-z][A-Za-z ]+?)\s*\|\s*\[/);
    if (cur && row && row[1].trim() !== 'Операция') sections[cur].push(row[1].trim());
  }
  return sections;
}

const node = nodeOps();
const guide = guideSections();
const problems = [];

for (const [res, ops] of Object.entries(node)) {
  const section = SECTION[res];
  if (!section) {
    problems.push(`Resource "${res}" has no SECTION mapping in check-n8n-resources.mjs.`);
    continue;
  }
  const listed = guide[section] || [];
  const missing = ops.filter((o) => !listed.includes(o));
  const extra = listed.filter((o) => !ops.includes(o));
  if (missing.length) {
    problems.push(`## ${section}: node operations not listed in the guide: ${missing.join(', ')}`);
  }
  if (extra.length) {
    problems.push(
      `## ${section}: guide lists operations the node does not have: ${extra.join(', ')}`
    );
  }
}

if (problems.length) {
  console.error('❌ n8n resources guide is out of sync with the node:\n');
  problems.forEach((p) => console.error(`   ${p}`));
  console.error(
    '\n   Update apps/docs/content/guides/n8n/resources.mdx (Resource → Operation tables)\n' +
      '   so every n8n operation is listed with its exact operation name.\n'
  );
  process.exit(1);
}

const total = Object.values(node).reduce((n, o) => n + o.length, 0);
console.log(
  `✅ n8n resources guide covers all ${total} node operations across ${Object.keys(node).length} resources.\n`
);
