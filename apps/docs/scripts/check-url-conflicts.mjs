import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем OpenAPI файл
const openapiPath = path.join(__dirname, '..', '..', '..', 'packages', 'spec', 'openapi.yaml');
const fileContents = fs.readFileSync(openapiPath, 'utf8');
const openapi = yaml.load(fileContents);

// Tag to URL segment (synchronized with lib/openapi/mapper.ts, which slugs the tag).
// Spec tags are English, e.g. "Tasks" → tasks, "Group tags" → group-tags.
function tagToUrlSegment(tag) {
  return tag
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Функция для генерации URL (synchronized with lib/openapi/mapper.ts)
function generateUrl(endpoint, tag) {
  const section = tagToUrlSegment(tag);
  const action = extractActionFromEndpoint(endpoint);
  return `/${section}/${action}`;
}

/**
 * Extracts action from endpoint based on path structure and HTTP method.
 * This approach is universal and doesn't rely on specific operationIds.
 * Synchronized with lib/openapi/mapper.ts extractActionFromEndpoint
 */
function extractActionFromEndpoint(endpoint) {
  const method = endpoint.method;
  const path = endpoint.path;

  // Split path into segments
  const segments = path.split('/').filter((seg) => seg);

  // Separate parameter segments (like {id}) from static segments
  const staticSegments = segments.filter((seg) => !seg.startsWith('{'));
  const hasIdParameter = segments.some((seg) => seg.startsWith('{'));

  // Get the last static segment (action indicator)
  const lastStaticSegment = staticSegments[staticSegments.length - 1];

  // If we have more than one static segment, it means we have a sub-resource or action
  if (staticSegments.length > 1) {
    const subResource = lastStaticSegment.replace(/_/g, '-');

    // Check if there's a parameter between the resource and sub-resource
    const lastSegmentIndex = segments.lastIndexOf(lastStaticSegment);
    const hasPreviousParam = lastSegmentIndex > 0 && segments[lastSegmentIndex - 1].startsWith('{');

    // Special case: /messages/{id}/pin with POST/DELETE should be pin/unpin
    if (subResource === 'pin') {
      return method === 'POST' ? 'pin' : 'unpin';
    }

    // If there's a parameter after the sub-resource (e.g., /chats/{id}/members/{user_id})
    const hasTrailingParam = lastSegmentIndex < segments.length - 1;

    if (hasTrailingParam) {
      // Operations on a specific item of a sub-resource
      const actionMap = {
        GET: `get-${subResource}`,
        PUT: `update-${subResource}`,
        PATCH: `update-${subResource}`,
        DELETE: `remove-${subResource.replace(/s$/, '')}`, // Remove trailing 's'
        POST: `add-${subResource}`,
      };
      return actionMap[method] || subResource;
    } else {
      // Operations on a collection of sub-resource
      const actionMap = {
        GET: `list-${subResource}`,
        POST: `add-${subResource}`,
        PUT: `update-${subResource}`,
        PATCH: `update-${subResource}`,
        DELETE: `remove-${subResource}`,
      };

      // If no previous param, it might be a special action (like /chats/exports)
      if (!hasPreviousParam) {
        const specialActionMap = {
          GET: subResource.endsWith('s') ? `list-${subResource}` : `get-${subResource}`,
          POST: subResource === 'exports' ? 'request-export' : `create-${subResource}`,
          PUT: `update-${subResource}`,
          DELETE: `delete-${subResource}`,
        };
        return specialActionMap[method] || subResource;
      }

      return actionMap[method] || subResource;
    }
  }

  // Single-segment paths - check if it's a standard CRUD resource or action-only endpoint
  const isStandardResource = lastStaticSegment.endsWith('s') || hasIdParameter;

  if (!isStandardResource && !hasIdParameter) {
    // Special action-only endpoint (e.g., /direct_url, /uploads)
    return lastStaticSegment.replace(/_/g, '-');
  }

  // Standard CRUD operations on the main resource
  const crudActions = {
    GET: (hasParam) => (hasParam ? 'get' : 'list'),
    POST: () => 'create',
    PUT: () => 'update',
    PATCH: () => 'update',
    DELETE: () => 'delete',
  };

  const actionFn = crudActions[method];
  if (actionFn) {
    return actionFn(hasIdParameter);
  }

  // Fallback
  return 'operation';
}

// Парсим эндпоинты
const endpoints = [];
for (const [pathStr, pathItem] of Object.entries(openapi.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
      const endpoint = {
        id: operation.operationId || `${method}_${pathStr}`,
        method: method.toUpperCase(),
        path: pathStr,
        tags: operation.tags || ['Common'],
        description: operation.description || operation.summary,
        operationId: operation.operationId || `${method}_${pathStr}`,
      };
      endpoints.push(endpoint);
    }
  }
}

// Анализируем URL
const urlMap = new Map();

for (const endpoint of endpoints) {
  const tag = endpoint.tags[0];
  const url = generateUrl(endpoint, tag);
  endpoint.url = url;

  if (!urlMap.has(url)) {
    urlMap.set(url, []);
  }

  urlMap.get(url).push(endpoint);
}

// Находим конфликты
const conflicts = [];
for (const [url, endpointList] of urlMap.entries()) {
  if (endpointList.length > 1) {
    conflicts.push({ url, endpoints: endpointList });
  }
}

console.log('=== URL ANALYSIS ===\n');
console.log(`Total endpoints: ${endpoints.length}`);
console.log(`Unique URLs: ${urlMap.size}`);
console.log(`Conflicts: ${conflicts.length}\n`);

if (conflicts.length > 0) {
  console.log('=== ⚠️  CONFLICTS FOUND ===\n');
  conflicts.forEach(({ url, endpoints }) => {
    console.log(`❌ URL: ${url}`);
    endpoints.forEach((e) => {
      console.log(`   - ${e.method.padEnd(6)} ${e.path}`);
      console.log(`     ID: ${e.id}`);
      console.log(`     Description: ${e.description}`);
    });
    console.log('');
  });
  console.error('\n❌ Build failed: URL conflicts detected. Please fix the conflicts above.\n');
  process.exit(1);
} else {
  console.log('✅ No conflicts found!\n');
}

// Показываем все URL по тегам
console.log('=== ALL ENDPOINTS BY TAG ===\n');
const byTag = new Map();
for (const endpoint of endpoints) {
  const tag = endpoint.tags[0];
  if (!byTag.has(tag)) {
    byTag.set(tag, []);
  }
  byTag.get(tag).push(endpoint);
}

for (const [tag, tagEndpoints] of byTag.entries()) {
  console.log(`📁 ${tag} (${tagEndpoints.length} endpoints):`);
  tagEndpoints.forEach((e) => {
    console.log(`   ${e.url.padEnd(40)} ${e.method.padEnd(6)} ${e.path}`);
  });
  console.log('');
}
