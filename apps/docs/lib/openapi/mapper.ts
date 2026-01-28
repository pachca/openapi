import type { Endpoint } from './types';

// Cyrillic to Latin transliteration map
const TRANSLIT_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/**
 * Transliterates Cyrillic text to Latin for URL-safe segments.
 */
function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => TRANSLIT_MAP[char] ?? char)
    .join('')
    .replace(/\s+/g, '-');
}

export function generateUrlFromOperation(endpoint: Endpoint): string {
  const tag = endpoint.tags[0] || 'common';
  const section = tagToUrlSegment(tag);
  const action = extractActionFromEndpoint(endpoint);

  return `/${section}/${action}`;
}

/**
 * Extracts action from endpoint based on path structure and HTTP method.
 * This approach is universal and doesn't rely on specific operationIds.
 *
 * The URL format is: /{section}/{action}[-{sub-action}]
 *
 * Examples:
 * - GET /chats → list
 * - GET /chats/{id} → get
 * - POST /chats → create
 * - PUT /chats/{id} → update
 * - DELETE /chats/{id} → delete
 * - PUT /chats/{id}/archive → archive
 * - POST /chats/{id}/members → add-members
 * - GET /chats/{id}/members → list-members
 * - DELETE /chats/{id}/members/{userId} → remove-member
 * - POST /uploads → uploads (special action-only path)
 */
function extractActionFromEndpoint(endpoint: Endpoint): string {
  const method = endpoint.method;
  const path = endpoint.path;

  // Split path into segments
  const segments = path.split('/').filter((seg) => seg);

  // Separate parameter segments (like {id}) from static segments
  const staticSegments = segments.filter((seg) => !seg.startsWith('{'));
  const hasIdParameter = segments.some((seg) => seg.startsWith('{'));

  // Get the last static segment (action indicator)
  const lastStaticSegment = staticSegments[staticSegments.length - 1];
  const firstStaticSegment = staticSegments[0]; // The resource name

  // If we have more than one static segment, it means we have a sub-resource or action
  if (staticSegments.length > 1) {
    const subResource = lastStaticSegment.replace(/_/g, '-');

    // Check if there's a parameter between the resource and sub-resource
    // e.g., /messages/{id}/reactions has {id} between messages and reactions
    const lastSegmentIndex = segments.lastIndexOf(lastStaticSegment);
    const hasPreviousParam = lastSegmentIndex > 0 && segments[lastSegmentIndex - 1].startsWith('{');

    // Special case: /messages/{id}/pin with POST/DELETE should be pin/unpin
    if (subResource === 'pin') {
      return method === 'POST' ? 'pin' : 'unpin';
    }

    // If there's a parameter after the sub-resource (e.g., /chats/{chatId}/members/{userId})
    // it's typically a single-item operation (get/update/delete)
    const hasTrailingParam = lastSegmentIndex < segments.length - 1;

    if (hasTrailingParam) {
      // Operations on a specific item of a sub-resource
      const actionMap: Record<string, string> = {
        GET: `get-${subResource}`,
        PUT: `update-${subResource}`,
        PATCH: `update-${subResource}`,
        DELETE: `remove-${subResource.replace(/s$/, '')}`, // Remove trailing 's' for singular
        POST: `add-${subResource}`,
      };
      return actionMap[method] || subResource;
    } else {
      // Operations on a collection of sub-resource
      const actionMap: Record<string, string> = {
        GET: `list-${subResource}`,
        POST: `add-${subResource}`,
        PUT: `update-${subResource}`,
        PATCH: `update-${subResource}`,
        DELETE: `remove-${subResource}`,
      };

      // If no previous param, it might be a special action (like /chats/exports)
      if (!hasPreviousParam) {
        // For paths like /chats/exports (no {id} before exports)
        const specialActionMap: Record<string, string> = {
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
  // Standard CRUD resources follow pattern: /resource and /resource/{id}
  // Action-only endpoints: /direct_url, /uploads (non-plural, non-standard names)
  const isStandardResource = lastStaticSegment.endsWith('s') || hasIdParameter;

  if (!isStandardResource && !hasIdParameter) {
    // Special action-only endpoint (e.g., /direct_url, /uploads)
    // Use the path itself as the action name
    return lastStaticSegment.replace(/_/g, '-');
  }

  // Standard CRUD operations on the main resource
  const crudActions: Record<string, (hasParam: boolean) => string> = {
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

  // Fallback - should rarely happen
  return 'operation';
}

export function generateTitle(endpoint: Endpoint): string {
  // Use summary if available - this is usually the "full name" in YAML
  if (endpoint.summary) {
    return endpoint.summary;
  }

  // Use only the first line of description as title
  if (endpoint.description) {
    const firstLine = endpoint.description.split('\n')[0].trim();
    return firstLine;
  }

  // Generate from operationId
  return generateTitleFromOperationId(endpoint.id);
}

// Get description without the title (first line)
export function getDescriptionWithoutTitle(endpoint: Endpoint): string | undefined {
  if (!endpoint.description) {
    return undefined;
  }

  const lines = endpoint.description.split('\n');

  // If there's only one line, return undefined (no additional description)
  if (lines.length <= 1) {
    return undefined;
  }

  // Skip the first line (title) and join the rest
  const descriptionLines = lines.slice(1).join('\n').trim();

  return descriptionLines || undefined;
}

function tagToUrlSegment(tag: string): string {
  return transliterate(tag);
}

function generateTitleFromOperationId(operationId: string): string {
  // Extract action part from operationId (e.g., "MessagesOperations_getMessages" -> "getMessages")
  const parts = operationId.split('_');
  const actionPart = parts.length > 1 ? parts[1] : operationId;

  // Convert camelCase to words with spaces
  return actionPart.replace(/([A-Z])/g, ' $1').trim();
}

export function groupEndpointsByTag(endpoints: Endpoint[]): Map<string, Endpoint[]> {
  const groups = new Map<string, Endpoint[]>();

  for (const endpoint of endpoints) {
    const tag = endpoint.tags[0] || 'Общее';
    if (!groups.has(tag)) {
      groups.set(tag, []);
    }
    groups.get(tag)!.push(endpoint);
  }

  return groups;
}
