/**
 * Build gate: no two API methods may map to the same page URL.
 *
 * URLs come from `generateUrlFromOperation` in `lib/openapi/mapper.ts`, the
 * function the site itself uses, so the check sees `OPERATION_OVERRIDES` and the
 * section-name stripping. The earlier copy of that logic here drifted and checked
 * URLs the site no longer served.
 */

import { parseOpenAPI } from '../lib/openapi/parser';
import { generateUrlFromOperation } from '../lib/openapi/mapper';

const api = await parseOpenAPI();
const owner = new Map<string, string>();
const conflicts: string[] = [];

for (const endpoint of api.endpoints) {
  const url = generateUrlFromOperation(endpoint);
  const method = `${endpoint.method} ${endpoint.path}`;
  const first = owner.get(url);
  if (first) conflicts.push(`${url}: ${first} and ${method}`);
  else owner.set(url, method);
}

if (conflicts.length > 0) {
  console.error(`✗ ${conflicts.length} URL conflict(s):\n  - ${conflicts.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ ${owner.size} method pages, no URL conflicts`);
