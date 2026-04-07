#!/usr/bin/env tsx
/**
 * n8n Node Generator — produces declarative n8n node files from OpenAPI spec.
 *
 * Sources:
 * - @pachca/openapi-parser → ParsedAPI (endpoints, schemas, tags)
 * - packages/spec/workflows.ts → English descriptions
 * - packages/generator/src/naming.ts → case conversion utilities
 * - apps/docs/lib/openapi/mapper.ts → groupEndpointsByTag
 *
 * Output:
 * - nodes/Pachca/*Description.ts (16 resource files)
 * - nodes/Pachca/Pachca.node.ts (main node)
 * - credentials/PachcaApi.credentials.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseOpenAPI, resolveAllOf, getSchemaType } from '@pachca/openapi-parser';
import type { Endpoint, Schema, Parameter } from '@pachca/openapi-parser';
import { snakeToCamel, snakeToPascal } from '../../../packages/generator/src/naming.js';
import { extractBodyFields, getWrapperKey, type BodyField } from './utils.js';
import { generateUrlFromOperation } from '../../../apps/docs/lib/openapi/mapper.js';
import { generateExample } from '../../../apps/docs/lib/openapi/example-generator.js';

// ============================================================================
// PATHS
// ============================================================================
const ROOT = path.resolve(__dirname, '../../..');
const EN_SPEC_PATH = path.join(ROOT, 'packages/spec/openapi.en.yaml');
const OUTPUT_DIR = path.resolve(__dirname, '../nodes/Pachca/V2');
const CREDS_DIR = path.resolve(__dirname, '../credentials');

// ============================================================================
// V1 COMPATIBILITY TABLES
// ============================================================================

/** v2 resource value → v1 resource value (for resources that were renamed) */
const V1_COMPAT_RESOURCES: Record<string, string> = {
  customProperty: 'customFields',
  profile: 'status',
  reaction: 'reactions',
};

/** v2 operation value → v1 operation value (per resource) */
const V1_COMPAT_OPS: Record<string, Record<string, string>> = {
  message: { create: 'send', get: 'getById' },
  user: { get: 'getById' },
  chat: { get: 'getById' },
  groupTag: { get: 'getById', getAllUsers: 'getUsers' },
  profile: { get: 'getProfile' },
  customProperty: { get: 'getCustomProperties' },
  reaction: { create: 'addReaction', delete: 'deleteReaction', getAll: 'getReactions' },
  thread: { create: 'createThread', get: 'getThread' },
  form: { create: 'createView' },
  file: { create: 'upload' },
};

/** Alias operations in old resources — shown only for @version:[1] */
const V1_ALIAS_OPS: Record<string, string[]> = {
  message: ['getReadMembers', 'unfurl'],
  chat: ['getMembers', 'addUsers', 'removeUser', 'updateRole', 'leaveChat'],
  groupTag: ['addTags', 'removeTag'],
};

/** v1 parameter name overrides (resource-prefixed names) */
const V1_COMPAT_PARAMS: Record<string, Record<string, Record<string, string>>> = {
  reactions: {
    '*': { id: 'reactionsMessageId', code: 'reactionsReactionCode' },
  },
  thread: {
    createThread: { id: 'threadMessageId' },
    getThread: { id: 'threadThreadId' },
  },
  groupTag: {
    '*': { id: 'groupTagId' },
    create: { name: 'groupTagName' },
    update: { name: 'groupTagName' },
    addTags: { chatId: 'groupTagChatId', groupTagIds: 'groupTagIds' },
    removeTag: { chatId: 'groupTagChatId', tagId: 'tagId' },
    getUsers: { id: 'groupTagId' },
  },
  chat: {
    create: { name: 'chatName' },
    update: { name: 'chatName' },
  },
  task: {
    create: { kind: 'taskKind', content: 'taskContent', dueAt: 'taskDueAt', priority: 'taskPriority' },
  },
  status: {
    updateStatus: { emoji: 'statusEmoji', title: 'statusTitle', expiresAt: 'statusExpiresAt' },
  },
  bot: {
    update: { id: 'botId', outgoingUrl: 'webhookUrl' },
  },
  form: {
    createView: { title: 'formTitle', blocks: 'formBlocks', builderMode: 'formBuilderMode' },
  },
};

/** v1 collection name overrides */
const V1_COMPAT_COLLECTIONS: Record<string, Record<string, Record<string, string>>> = {
  user: {
    getAll: { additionalFields: 'additionalOptions' },
  },
  chat: {
    getMembers: { additionalFields: 'chatMembersOptions' },
  },
  message: {
    getReadMembers: { additionalFields: 'readMembersOptions' },
  },
  reactions: {
    getReactions: { additionalFields: 'reactionsOptions' },
  },
};

/** v1 sub-collection names for fixedCollections */
const V1_COMPAT_SUBCOLLECTIONS: Record<string, string> = {
  buttons: 'button',
  files: 'file',
  customProperties: 'property',
  formBlocks: 'block',
  linkPreviews: 'preview',
  options: 'option',
};

/** v1 alias operations: optional query params (not from OpenAPI) */
const V1_ALIAS_QUERY_PARAMS: Record<string, Record<string, [string, string][]>> = {
  chat: {
    getMembers: [['role', 'role'], ['limit', 'limit'], ['cursor', 'cursor']],
  },
  message: {
    getReadMembers: [['per', 'readMembersPer'], ['page', 'readMembersPage']],
  },
  reactions: {
    getReactions: [['limit', 'reactionsPer'], ['cursor', 'reactionsCursor']],
  },
};

/** v1 compat: pagination fields from V1 collections → API query params (for primary ops, not aliases) */
const V1_COMPAT_PAGINATION: Record<string, Record<string, [string, string][]>> = {
  chat: {
    getMembers: [['limit', 'limit'], ['cursor', 'cursor']],
  },
  message: {
    getReadMembers: [['per', 'readMembersPer'], ['page', 'readMembersPage']],
  },
  reaction: {
    getAll: [['limit', 'reactionsPer'], ['cursor', 'reactionsCursor']],
  },
};

/** v1 alias operations: special handlers */
const V1_ALIAS_SPECIALS: Record<string, Record<string, string>> = {
  message: {
    unfurl: 'unfurlLinkPreviews',
  },
};

/** Extra body fields for v2 operations not in OpenAPI (v1 compat) */
const V1_EXTRA_BODY_FIELDS: Record<string, Record<string, [string, string][]>> = {
};

/** Resources only visible in v2 (new, not in v1) */
const V2_ONLY_RESOURCES = new Set(['member', 'readMember', 'linkPreview', 'search', 'security', 'export']);

/** Resources whose endpoints are sub-paths of another resource but should use standard CRUD names */
const STANDARD_CRUD_SUBRESOURCES = new Set(['reaction', 'member', 'readMember', 'linkPreview', 'thread', 'export']);

/** Preferred default operation per resource (for better UX — list-first resources default to getAll) */
const PREFERRED_DEFAULT_OPS: Record<string, string> = {
  chat: 'getAll',
  groupTag: 'getAll',
  user: 'getAll',
  member: 'getAll',
};

/** v1 ID parameter fallback — shared ops where v1 used prefixed names (chatId, messageId, userId) */
const V1_ID_FALLBACKS: Record<string, { v1Name: string; sharedOps: string[] }> = {
  chat: { v1Name: 'chatId', sharedOps: ['get', 'getById', 'update', 'archive', 'unarchive'] },
  message: { v1Name: 'messageId', sharedOps: ['get', 'getById', 'update', 'delete', 'pin', 'unpin'] },
  user: { v1Name: 'userId', sharedOps: ['get', 'getById', 'update', 'delete'] },
};

/** Routing for v1 alias operations (cross-resource, @version:[1] only) */
const V1_ALIAS_ROUTING: Record<string, Record<string, { method: string; url: string; wrapperKey?: string; pagination?: boolean; splitComma?: [string, string, 'int' | 'string'][] }>> = {
  chat: {
    getMembers: { method: 'GET', url: '=/chats/{{$parameter["chatId"]}}/members', pagination: true },
    addUsers: { method: 'POST', url: '=/chats/{{$parameter["chatId"]}}/members', splitComma: [['memberIds', 'member_ids', 'int']] },
    removeUser: { method: 'DELETE', url: '=/chats/{{$parameter["chatId"]}}/members/{{$parameter["userId"]}}' },
    updateRole: { method: 'PUT', url: '=/chats/{{$parameter["chatId"]}}/members/{{$parameter["userId"]}}' },
    leaveChat: { method: 'DELETE', url: '=/chats/{{$parameter["chatId"]}}/leave' },
  },
  message: {
    getReadMembers: { method: 'GET', url: '=/messages/{{$parameter["messageId"]}}/read_member_ids', pagination: true },
    unfurl: { method: 'POST', url: '=/messages/{{$parameter["messageId"]}}/link_previews' },
  },
  groupTag: {
    addTags: { method: 'POST', url: '=/chats/{{$parameter["groupTagChatId"]}}/group_tags', splitComma: [['groupTagIds', 'group_tag_ids', 'int']] },
    removeTag: { method: 'DELETE', url: '=/chats/{{$parameter["groupTagChatId"]}}/group_tags/{{$parameter["tagId"]}}' },
  },
};

/** Field definitions for V1_ALIAS_OPS — these operations get no fields from the OpenAPI loop */
type AliasFieldDef = {
  name: string;
  displayName: string;
  type: 'number' | 'string' | 'boolean' | 'options';
  required?: boolean;
  default?: unknown;
  description?: string;
  placeholder?: string;
  options?: { name: string; value: string }[];
  routing?: { send: { type: 'body' | 'query'; property: string } };
};

const V1_ALIAS_FIELDS: Record<string, Record<string, { fields: AliasFieldDef[]; pagination?: boolean }>> = {
  chat: {
    getMembers: {
      pagination: true,
      fields: [
        { name: 'chatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat' },
      ],
    },
    addUsers: {
      fields: [
        { name: 'chatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat' },
        { name: 'memberIds', displayName: 'Member IDs', type: 'string', required: true, default: '', description: 'Comma-separated list of user IDs to add', placeholder: '186,187' },
        { name: 'silent', displayName: 'Silent', type: 'boolean', default: false, description: 'Whether to skip creating a system message about adding members', routing: { send: { type: 'body', property: 'silent' } } },
      ],
    },
    removeUser: {
      fields: [
        { name: 'chatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat' },
        { name: 'userId', displayName: 'User ID', type: 'number', required: true, default: 0, description: 'ID of the user to remove' },
      ],
    },
    updateRole: {
      fields: [
        { name: 'chatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat' },
        { name: 'userId', displayName: 'User ID', type: 'number', required: true, default: 0, description: 'ID of the user' },
        { name: 'newRole', displayName: 'Role', type: 'options', required: true, default: 'member',
          options: [{ name: 'Admin', value: 'admin' }, { name: 'Editor', value: 'editor' }, { name: 'Member', value: 'member' }],
          routing: { send: { type: 'body', property: 'role' } } },
      ],
    },
    leaveChat: {
      fields: [
        { name: 'chatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat' },
      ],
    },
  },
  message: {
    getReadMembers: {
      pagination: true,
      fields: [
        { name: 'messageId', displayName: 'Message ID', type: 'number', required: true, default: 0, description: 'ID of the message' },
      ],
    },
    unfurl: {
      fields: [
        { name: 'messageId', displayName: 'Message ID', type: 'number', required: true, default: 0, description: 'ID of the message' },
        { name: 'linkPreviews', displayName: 'Link Previews', type: 'json', required: true, default: '',
          description: 'JSON map of link previews where each key is a URL',
          placeholder: '{"https://example.com":{"title":"Example","description":"Desc"}}',
          routing: { send: { type: 'body', property: 'link_previews' } } },
      ],
    },
  },
  groupTag: {
    addTags: {
      fields: [
        { name: 'groupTagChatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat to add tags to' },
        { name: 'groupTagIds', displayName: 'Tag IDs', type: 'string', required: true, default: '', description: 'Comma-separated list of group tag IDs', placeholder: '1,2,3' },
      ],
    },
    removeTag: {
      fields: [
        { name: 'groupTagChatId', displayName: 'Chat ID', type: 'number', required: true, default: 0, description: 'ID of the chat' },
        { name: 'tagId', displayName: 'Tag ID', type: 'number', required: true, default: 0, description: 'ID of the tag to remove' },
      ],
    },
  },
};

/** Optional fields promoted to top-level (not inside additionalFields) for ALL versions */
const PROMOTED_TOP_LEVEL_FIELDS: Record<string, Record<string, Set<string>>> = {
  message: { create: new Set(['entity_type']), send: new Set(['entity_type']) },
};

// ============================================================================
// WEBHOOK EVENT MAPPING (for PachcaTrigger generation)
// ============================================================================

/** Maps (type:event) from webhook payload schemas to user-friendly n8n event options */
const WEBHOOK_EVENT_MAP: Record<string, { name: string; value: string }> = {
  'message:new': { name: 'New Message', value: 'new_message' },
  'message:update': { name: 'Message Updated', value: 'message_updated' },
  'message:delete': { name: 'Message Deleted', value: 'message_deleted' },
  'message:link_shared': { name: 'Link Shared', value: 'link_shared' },
  'reaction:new': { name: 'New Reaction', value: 'new_reaction' },
  'reaction:delete': { name: 'Reaction Deleted', value: 'reaction_deleted' },
  'button:click': { name: 'Button Pressed', value: 'button_pressed' },
  'view:submit': { name: 'Form Submitted', value: 'form_submitted' },
  'chat_member:add': { name: 'Chat Member Added', value: 'chat_member_added' },
  'chat_member:remove': { name: 'Chat Member Removed', value: 'chat_member_removed' },
  'company_member:invite': { name: 'User Invited', value: 'company_member_invite' },
  'company_member:confirm': { name: 'User Confirmed', value: 'company_member_confirm' },
  'company_member:update': { name: 'User Updated', value: 'company_member_update' },
  'company_member:suspend': { name: 'User Suspended', value: 'company_member_suspend' },
  'company_member:activate': { name: 'User Activated', value: 'company_member_activate' },
  'company_member:delete': { name: 'User Deleted', value: 'company_member_delete' },
};

/** Fallback placeholders for fields without OpenAPI examples */
const FIELD_PLACEHOLDERS: Record<string, string> = {
  blocks: '[{"type":"input","name":"field_1","label":"Your name"}]',
};

/** fixedCollection sub-fields that should use loadOptions instead of manual input */
const LOAD_OPTIONS_SUBFIELDS: Record<string, Record<string, { method: string; displayName: string; description: string }>> = {
  custom_properties: {
    id: { method: 'getCustomProperties', displayName: 'Custom Property Name or ID', description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>' },
  },
};

/** Notices shown above operation fields — informational tips for specific operations */
// Scope-to-roles mapping — loaded from x-scope-roles in TokenScope schema at runtime
let scopeRolesMap = new Map<string, string[]>();
const ALL_ROLES = ['owner', 'admin', 'user', 'bot'];

/** Build a notice from endpoint requirements (scope → roles, plan) */
function buildOperationNotice(ep: Endpoint): string | undefined {
  const scope = ep.requirements?.scope;
  const plan = ep.requirements?.plan;
  if (!scope && !plan) return undefined;

  let rolePart = '';
  if (scope) {
    const scopeKey = scope.replace(/:/g, '_');
    const roles = scopeRolesMap.get(scopeKey);
    if (roles && roles.length < ALL_ROLES.length) {
      if (roles.length === 1 && roles[0] === 'owner') {
        rolePart = 'owner role';
      } else {
        const missing = ALL_ROLES.filter(r => !roles.includes(r));
        if (missing.includes('user') && missing.includes('bot')) {
          rolePart = 'admin permissions';
        } else {
          rolePart = `${roles.join(', ')} roles`;
        }
      }
    }
  }

  let planPart = '';
  if (plan) {
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
    planPart = `"${planName}" plan`;
  }

  if (!rolePart && !planPart) return undefined;

  if (rolePart && planPart) return `Requires ${rolePart} and the ${planPart}`;
  if (rolePart) return `Requires ${rolePart}`;
  return `Requires the ${planPart}`;
}

/** URL extraction patterns for resourceLocator url mode (search method → regex + placeholder) */
const URL_PATTERNS: Record<string, { regex: string; placeholder: string; error: string }> = {
  searchChats: {
    regex: 'https?://[^/]+/chats/(\\d+)',
    placeholder: 'https://app.pachca.com/chats/12345',
    error: 'Not a valid Pachca chat URL',
  },
  searchUsers: {
    regex: 'https?://[^/]+/users/(\\d+)',
    placeholder: 'https://app.pachca.com/users/12345',
    error: 'Not a valid Pachca user URL',
  },
};

/** Body fields that should use resourceLocator with searchable dropdown (resource.field → searchMethod) */
const BODY_FIELD_SEARCH: Record<string, Record<string, string>> = {
  message: { entity_id: 'searchEntities' },  // dynamic: searches chats or users based on entityType
};

/** Path parameters that use resourceLocator with searchable dropdown */
const PATH_PARAM_SEARCH: Record<string, Record<string, string>> = {
  chat: { id: 'searchChats' },
  user: { id: 'searchUsers' },
  member: { id: 'searchChats', user_id: 'searchUsers' },  // member's `id` is chat_id, `user_id` is user
};

/** Query parameters that use resourceLocator in v2 */
const SEARCHABLE_QUERY_PARAMS: Record<string, { method: string }> = {
  chat_id: { method: 'searchChats' },
  user_id: { method: 'searchUsers' },
};

/** Hints for fields — contextual tips for no-code users (resource.field → hint) */
const FIELD_HINTS: Record<string, Record<string, string>> = {
  message: {
    files: 'Upload a file first using File > Create, then use the returned key here',
  },
  form: {
    trigger_id: 'Trigger ID from a button press webhook event — expires in 3 seconds',
  },
  export: {
    webhook_url: 'Set this to a Webhook node URL in another workflow to receive the export-ready notification',
  },
};

// EN description lookup maps (populated from openapi.en.yaml in main())
let enParamDescs = new Map<string, string>();     // key: `${endpointId}:${paramName}`
let enBodyDescs = new Map<string, string>();      // key: `${endpointId}:${fieldName}`
let enSubFieldDescs = new Map<string, string>();  // key: `${endpointId}:${fieldName}:${subName}`
let enEnumDescs = new Map<string, Record<string, string>>();  // key: `${endpointId}:${fieldName}`
let enEndpoints = new Map<string, Endpoint>();    // key: endpointId

/** Get English enum descriptions for a field from EN spec */
function getEnumDescriptions(fieldName: string, endpointId: string): Record<string, string> | undefined {
  return enEnumDescs.get(`${endpointId}:${fieldName}`);
}

/** Get English field description from EN spec, with fallback to original (Russian) description */
function getFieldDescription(fieldName: string, fallback: string | undefined, endpointId: string, parentField?: string): string | undefined {
  if (parentField) {
    const desc = enSubFieldDescs.get(`${endpointId}:${parentField}:${fieldName}`);
    if (desc) return desc;
  }
  return enParamDescs.get(`${endpointId}:${fieldName}`)
    ?? enBodyDescs.get(`${endpointId}:${fieldName}`)
    ?? fallback;
}

// ============================================================================
// TAG → RESOURCE MAPPING
// ============================================================================

/** OpenAPI tag → n8n resource value (singular, camelCase) */
function tagToResource(tag: string): string {
  const MAP: Record<string, string> = {
    'Users': 'user',
    'Messages': 'message',
    'Chats': 'chat',
    'Members': 'member',
    'Threads': 'thread',
    'Reactions': 'reaction',
    'Group tags': 'groupTag',
    'Profile': 'profile',
    'Common': 'common',
    'Tasks': 'task',
    'Bots': 'bot',
    'Views': 'form',
    'Read members': 'readMember',
    'Link Previews': 'linkPreview',
    'Search': 'search',
    'Security': 'security',
  };
  return MAP[tag] || tag.toLowerCase().replace(/s$/, '');
}

/** Resource value → display name (Title Case, singular) */
function resourceDisplayName(resource: string): string {
  const MAP: Record<string, string> = {
    user: 'User', message: 'Message', chat: 'Chat', member: 'Chat Member',
    thread: 'Thread', reaction: 'Reaction', groupTag: 'Group Tag',
    profile: 'Profile', customProperty: 'Custom Property', task: 'Task',
    bot: 'Bot', file: 'File', form: 'Form', readMember: 'Read Member',
    linkPreview: 'Link Preview', search: 'Search', security: 'Security',
    export: 'Chat Export',
  };
  return MAP[resource] || snakeToPascal(resource);
}

// ============================================================================
// OPERATION MAPPING
// ============================================================================

/** Map HTTP method + path pattern → n8n operation value */
function endpointToOperation(ep: Endpoint, resource: string): string {
  const method = ep.method;
  const segments = ep.path.split('/').filter(Boolean);
  const staticSegments = segments.filter(s => !s.startsWith('{'));
  const lastStatic = staticSegments[staticSegments.length - 1];
  const hasTrailingParam = segments[segments.length - 1]?.startsWith('{') && staticSegments.length > 1;

  // Special action paths
  if (lastStatic === 'pin') return method === 'POST' ? 'pin' : 'unpin';
  if (lastStatic === 'archive') return 'archive';
  if (lastStatic === 'unarchive') return 'unarchive';
  if (lastStatic === 'leave') return 'leave';
  // /views/open is the primary create operation for forms
  if (ep.path === '/views/open' && method === 'POST') return 'create';

  // Sub-resource action paths (e.g., /users/{id}/status → getStatus, updateStatus)
  // When last static segment differs from the resource root and is NOT a CRUD collection
  if (staticSegments.length > 1) {
    const resourceRoot = staticSegments[0];
    if (lastStatic !== resourceRoot) {
      // Check if this is a "standard CRUD sub-resource" — endpoints live under another
      // resource's path but should use simple CRUD names (e.g., /messages/{id}/reactions → create/delete/getAll)
      const lastStaticCamel = snakeToCamel(lastStatic);
      const resourcePlural = resource.endsWith('y') ? resource.slice(0, -1) + 'ies' : resource + 's';
      if (STANDARD_CRUD_SUBRESOURCES.has(resource) && (lastStaticCamel === resourcePlural || lastStaticCamel === resource)) {
        if (hasTrailingParam) {
          if (method === 'DELETE') return 'delete';
          if (method === 'PUT' || method === 'PATCH') return 'update';
          return 'get';
        }
        if (method === 'GET') return 'getAll';
        if (method === 'POST') return 'create';
        if (method === 'PUT') return 'update';
        if (method === 'DELETE') return 'delete';
      }

      const subName = snakeToPascal(lastStatic);

      // Single item sub-resource with trailing param (e.g., /chats/{id}/members/{user_id})
      if (hasTrailingParam) {
        if (method === 'DELETE') return `remove${subName}`;
        if (method === 'PUT' || method === 'PATCH') return `update${subName}`;
        return `get${subName}`;
      }

      // Collection sub-resource (e.g., /chats/{id}/members, /users/{id}/status)
      if (method === 'GET') {
        const hasCursor = ep.parameters.some(p => p.in === 'query' && p.name === 'cursor');
        return hasCursor ? `getAll${subName}` : `get${subName}`;
      }
      if (method === 'POST') return `add${subName}`;
      if (method === 'PUT') return `update${subName}`;
      if (method === 'DELETE') return `delete${subName}`;
    }
  }

  // Standard CRUD
  if (method === 'GET' && !segments.some(s => s.startsWith('{'))) {
    const hasCursor = ep.parameters.some(p => p.in === 'query' && p.name === 'cursor');
    return hasCursor ? 'getAll' : 'get';
  }
  if (method === 'GET') return 'get';
  if (method === 'POST') return 'create';
  if (method === 'PUT' || method === 'PATCH') return 'update';
  if (method === 'DELETE') return 'delete';

  return 'execute';
}

/** Get the v1-compatible operation value */
function getV1OpValue(resource: string, v2Op: string): string {
  return V1_COMPAT_OPS[resource]?.[v2Op] ?? v2Op;
}

/** Generate n8n operation display name */
function operationDisplayName(op: string): string {
  const MAP: Record<string, string> = {
    getAll: 'Get Many', get: 'Get', create: 'Create', update: 'Update', delete: 'Delete',
    add: 'Add', remove: 'Remove', pin: 'Pin', unpin: 'Unpin',
    archive: 'Archive', unarchive: 'Unarchive', leave: 'Leave', updateRole: 'Update Role',
  };
  if (MAP[op]) return MAP[op];
  // Sub-resource operations: "getAllStatus" → "Get Many Status", "updateMembers" → "Update Members"
  return op.replace(/([A-Z])/g, ' $1').replace(/^\s/, '').replace(/^(get All|get|add|update|delete|remove)/i, (m) => {
    const lower = m.toLowerCase();
    if (lower === 'get all') return 'Get Many';
    return m.charAt(0).toUpperCase() + m.slice(1);
  }).replace(/\bIds?\b/g, m => m === 'Id' ? 'ID' : 'IDs');
}

/** Generate n8n action label (eslint format: "Get many users") */
function actionLabel(op: string, resourceName: string, resource?: string): string {
  const singular = resourceName.toLowerCase();
  const plural = singular.endsWith('y') ? singular.slice(0, -1) + 'ies' : singular + 's';

  // Resource-specific overrides for better semantics
  const RESOURCE_PLURAL_OVERRIDES: Record<string, string> = {
    security: 'audit events',
  };
  const overriddenPlural = RESOURCE_PLURAL_OVERRIDES[singular] ?? plural;

  // Standard CRUD
  if (op === 'getAll') return `Get many ${overriddenPlural}`;
  if (op === 'get') return `Get a ${singular}`;
  if (op === 'create') return `Create a ${singular}`;
  if (op === 'update') return `Update a ${singular}`;
  if (op === 'delete') return `Delete a ${singular}`;
  if (op === 'add') return `Add a ${singular}`;
  if (op === 'remove') return `Remove a ${singular}`;
  if (op === 'pin') return `Pin a ${singular}`;
  if (op === 'unpin') return `Unpin a ${singular}`;
  if (op === 'archive') return `Archive a ${singular}`;
  if (op === 'unarchive') return `Unarchive a ${singular}`;
  if (op === 'leave') {
    if (resource === 'member') return 'Leave chat';
    return `Leave ${singular}`;
  }

  // Alias operations with readable labels
  const ALIAS_LABELS: Record<string, string> = {
    getMembers: 'Get members',
    addUsers: 'Add users',
    removeUser: 'Remove user',
    updateRole: 'Update member role',
    leaveChat: 'Leave chat',
    getReadMembers: 'Get read members',
    unfurl: 'Unfurl link preview',
    addTags: 'Add tags to chat',
    removeTag: 'Remove tag from chat',
  };
  if (ALIAS_LABELS[op]) return ALIAS_LABELS[op];

  // Sub-resource operations: extract action + sub-resource name
  const subMatch = op.match(/^(getAll|get|add|update|delete|remove)(.+)$/);
  if (subMatch) {
    const [, action, subPascal] = subMatch;
    let subWords = subPascal.replace(/([A-Z])/g, ' $1').trim().toLowerCase();

    // Remove resource name prefix from sub-resource to avoid stutter
    // e.g., readMember.getAllReadMemberIds → "read member ids" not "read member read member ids"
    if (subWords.startsWith(singular + ' ')) {
      subWords = subWords.slice(singular.length + 1);
    }

    if (action === 'getAll') {
      if (resource === 'search') return `Search ${subWords}`;
      return `Get many ${singular} ${subWords}`;
    }
    if (action === 'get') return `Get ${singular} ${subWords}`;
    if (action === 'update') return `Update ${singular} ${subWords}`;
    if (action === 'delete') return `Delete ${singular} ${subWords}`;
    if (action === 'add') return `Add ${subWords} to ${singular}`;
    if (action === 'remove') return `Remove ${subWords} from ${singular}`;
  }

  // Fallback
  return `${operationDisplayName(op)} a ${singular}`;
}

// ============================================================================
// PARAMETER NAME RESOLUTION
// ============================================================================

/** Get the v1-compatible parameter name */
function getParamName(resource: string, op: string, fieldName: string): string {
  // Use v1 resource name for lookup (e.g., "reactions" not "reaction")
  const v1Resource = V1_COMPAT_RESOURCES[resource] ?? resource;
  const opMap = V1_COMPAT_PARAMS[v1Resource];
  if (opMap) {
    const wildcard = opMap['*']?.[snakeToCamel(fieldName)];
    if (wildcard) return wildcard;
    const specific = opMap[op]?.[snakeToCamel(fieldName)];
    if (specific) return specific;
  }
  return snakeToCamel(fieldName);
}

// ============================================================================
// n8n TYPE MAPPING
// ============================================================================

/** Resolve array items schema (handles allOf wrappers) */
function resolveArrayItems(field: BodyField): Schema | undefined {
  if (!field.items) return undefined;
  return field.items.allOf ? resolveAllOf(field.items) : field.items;
}

/** Map OpenAPI type → n8n field type */
function toN8nType(field: BodyField): string {
  if (field.enum && field.enum.length > 0) return 'options';
  if (field.format === 'date-time') return 'dateTime';
  if (field.type === 'boolean') return 'boolean';
  if (field.type === 'integer' || field.type === 'number') return 'number';
  if (field.type === 'array' && resolveArrayItems(field)?.properties) return 'fixedCollection';
  // Array of primitives → comma-separated string (transformed via splitCommaToArray)
  if (field.type === 'array' && !resolveArrayItems(field)?.properties) return 'string';
  if (field.type === 'object') return 'json';
  return 'string';
}

/** Resolve allOf wrapper on query parameter schemas so enums are visible */
function resolveQuerySchema(schema: Schema): Schema {
  if (schema.allOf) return resolveAllOf(schema);
  return schema;
}

/** Map OpenAPI query parameter schema → n8n field type */
function queryParamN8nType(schema: Schema): string {
  const resolved = resolveQuerySchema(schema);
  if (resolved.enum) return 'options';
  const type = getSchemaType(resolved);
  if (type === 'boolean') return 'boolean';
  if (resolved.format === 'date-time') return 'dateTime';
  if (type === 'integer' || type === 'number') return 'number';
  return 'string';
}

/** Check if a field is an array of primitives (needs splitCommaToArray preSend) */
function isPrimitiveArray(field: BodyField): boolean {
  return field.type === 'array' && !resolveArrayItems(field)?.properties;
}

/** Get the item type for primitive arrays */
function getArrayItemType(field: BodyField): 'int' | 'string' {
  const resolved = resolveArrayItems(field);
  const itemType = resolved ? getSchemaType(resolved) : 'string';
  return (itemType === 'integer' || itemType === 'number') ? 'int' : 'string';
}

/** Check if a query parameter is an array of primitives */
function isQueryParamArray(param: Parameter): boolean {
  const schema = resolveQuerySchema(param.schema);
  return getSchemaType(schema) === 'array' && !!schema.items && !schema.items.properties;
}

/** Get the item type for a query parameter array */
function getQueryArrayItemType(param: Parameter): 'int' | 'string' {
  const schema = resolveQuerySchema(param.schema);
  const items = schema.items;
  if (!items) return 'string';
  const resolved = items.allOf ? resolveAllOf(items) : items;
  const itemType = getSchemaType(resolved);
  return (itemType === 'integer' || itemType === 'number') ? 'int' : 'string';
}

/** Ensure boolean descriptions start with "Whether" (eslint requirement) */
function booleanDescription(desc?: string): string {
  if (!desc) return 'Whether to enable this option';
  if (desc.startsWith('Whether')) return desc;
  return `Whether to ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`;
}

// ============================================================================
// CODE GENERATION HELPERS
// ============================================================================



function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function generateEnumOptions(values: unknown[], enumDescriptions?: Record<string, string>): string {
  return values
    .map(v => {
      const val = String(v);
      const name = formatDisplayName(val);
      const desc = enumDescriptions?.[val];
      if (desc && desc.toLowerCase() !== name.toLowerCase()) {
        return { name, val, str: `{ name: ${quote(name)}, value: ${quote(val)}, description: ${quote(desc)} }` };
      }
      return { name, val, str: `{ name: ${quote(name)}, value: ${quote(val)} }` };
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(o => o.str)
    .join(',\n');
}

// ============================================================================
// GENERATE RESOURCE DESCRIPTION FILE
// ============================================================================

interface OperationInfo {
  v2Op: string;
  v1Op: string;
  endpoint: Endpoint;
  fields: BodyField[];
  queryParams: Parameter[];
  pathParams: Parameter[];
  hasPagination: boolean;
  wrapperKey: string | null;
  description: string;
}

function generateResourceDescription(
  resource: string,
  operations: OperationInfo[],
): string {
  const displayName = resourceDisplayName(resource);

  const allResourceValues = [resource];

  const lines: string[] = [];
  // Description files are now UI-only — no routing imports needed (execute() handles it)
  lines.push(`import type { INodeProperties } from 'n8n-workflow';`);
  lines.push('');
  lines.push(`export const ${snakeToCamel(resource)}Operations: INodeProperties[] = [`);

  // --- Operation dropdown ---
  lines.push('\t{');
  lines.push(`\t\tdisplayName: 'Operation',`);
  lines.push(`\t\tname: 'operation',`);
  lines.push(`\t\ttype: 'options',`);
  lines.push(`\t\tnoDataExpression: true,`);
  lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}] } },`);
  lines.push(`\t\toptions: [`);

  // Collect all operation option objects, then sort alphabetically by name
  const opItems: { name: string; lines: string[] }[] = [];

  for (const op of operations) {
    const displayOpName = operationDisplayName(op.v2Op);
    const action = actionLabel(op.v2Op, displayName, resource);

    opItems.push({ name: displayOpName, lines: [
      `\t\t\t{`,
      `\t\t\t\tname: ${quote(displayOpName)},`,
      `\t\t\t\tvalue: ${quote(op.v2Op)},`,
      `\t\t\t\taction: ${quote(action)},`,
      `\t\t\t},`,
    ]});
  }

  // Sort alphabetically by display name (n8n lint rule: node-param-options-type-unsorted-items)
  opItems.sort((a, b) => a.name.localeCompare(b.name));
  for (const item of opItems) {
    lines.push(...item.lines);
  }

  lines.push(`\t\t],`);
  const preferredDefault = PREFERRED_DEFAULT_OPS[resource];
  const defaultOp = preferredDefault && operations.some(o => o.v2Op === preferredDefault)
    ? preferredDefault
    : (operations[0]?.v2Op ?? operations[0]?.v1Op ?? 'getAll');
  lines.push(`\t\tdefault: ${quote(defaultOp)},`);
  lines.push(`\t},`);
  lines.push(`];`);

  // --- Fields ---
  lines.push('');
  lines.push(`export const ${snakeToCamel(resource)}Fields: INodeProperties[] = [`);

  for (const op of operations) {
    const allOpValues = [op.v2Op];

    // Path parameters — with resourceLocator for searchable resources
    // When V1_ID_FALLBACKS exists for this resource and op is a shared op,
    // the v2 field should only show for v2 (legacy ID field handles v1).
    const pathOpValues = allOpValues;
    const pathVersionConstraint = '';

    for (const param of op.pathParams) {
      const paramName = getParamName(resource, op.v1Op, param.name);
      const paramDesc = getFieldDescription(param.name, param.description, op.endpoint.id);
      const searchMethod = PATH_PARAM_SEARCH[resource]?.[param.name];

      if (searchMethod) {
        // v2: resourceLocator with searchable dropdown
        lines.push(`\t{`);
        lines.push(`\t\tdisplayName: ${quote(formatDisplayName(param.name))},`);
        lines.push(`\t\tname: ${quote(paramName)},`);
        lines.push(`\t\ttype: 'resourceLocator',`);
        lines.push(`\t\tdefault: { mode: 'list', value: '' },`);
        lines.push(`\t\trequired: true,`);
        if (paramDesc && paramDesc.toLowerCase() !== formatDisplayName(param.name).toLowerCase()) lines.push(`\t\tdescription: ${quote(sanitizeDescription(paramDesc))},`);
        lines.push(`\t\tmodes: [`);
        lines.push(`\t\t\t{`);
        lines.push(`\t\t\t\tdisplayName: 'From List',`);
        lines.push(`\t\t\t\tname: 'list',`);
        lines.push(`\t\t\t\ttype: 'list',`);
        lines.push(`\t\t\t\ttypeOptions: { searchListMethod: ${quote(searchMethod)}, searchable: true },`);
        lines.push(`\t\t\t},`);
        lines.push(`\t\t\t{`);
        lines.push(`\t\t\t\tdisplayName: 'By ID',`);
        lines.push(`\t\t\t\tname: 'id',`);
        lines.push(`\t\t\t\ttype: 'string',`);
        const pathEx = getPlaceholder(param.example ?? param.schema?.example);
        lines.push(`\t\t\t\tplaceholder: ${quote(pathEx ? `e.g. ${pathEx}` : 'e.g. 12345')},`);
        lines.push(`\t\t\t},`);
        const urlPattern = URL_PATTERNS[searchMethod];
        if (urlPattern) {
          lines.push(`\t\t\t{`);
          lines.push(`\t\t\t\tdisplayName: 'By URL',`);
          lines.push(`\t\t\t\tname: 'url',`);
          lines.push(`\t\t\t\ttype: 'string',`);
          lines.push(`\t\t\t\tplaceholder: ${quote(urlPattern.placeholder)},`);
          lines.push(`\t\t\t\textractValue: { type: 'regex', regex: ${quote(urlPattern.regex)} },`);
          lines.push(`\t\t\t\tvalidation: [{ type: 'regex', properties: { regex: ${quote(urlPattern.regex)}, errorMessage: ${quote(urlPattern.error)} } }],`);
          lines.push(`\t\t\t},`);
        }
        lines.push(`\t\t],`);
        lines.push(`\t\tdisplayOptions: { show: { ${pathVersionConstraint}resource: [${allResourceValues.map(quote).join(', ')}], operation: [${pathOpValues.map(quote).join(', ')}] } },`);
        lines.push(`\t},`);
      } else {
        lines.push(`\t{`);
        lines.push(`\t\tdisplayName: ${quote(formatDisplayName(param.name))},`);
        lines.push(`\t\tname: ${quote(paramName)},`);
        lines.push(`\t\ttype: 'number',`);
        lines.push(`\t\trequired: true,`);
        lines.push(`\t\tdefault: 0,`);
        lines.push(`\t\tdisplayOptions: { show: { ${pathVersionConstraint}resource: [${allResourceValues.map(quote).join(', ')}], operation: [${pathOpValues.map(quote).join(', ')}] } },`);
        if (paramDesc && paramDesc.toLowerCase() !== formatDisplayName(param.name).toLowerCase()) {
          lines.push(`\t\tdescription: ${quote(sanitizeDescription(paramDesc))},`);
        }
        lines.push(`\t},`);
      }
    }

    // Operation notice — auto-generated from scope roles + plan requirements
    const noticeText = buildOperationNotice(op.endpoint);
    if (noticeText) {
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: ${quote(noticeText)},`);
      lines.push(`\t\tname: ${quote(`${resource}${snakeToPascal(op.v2Op)}Notice`)},`);
      lines.push(`\t\ttype: 'notice',`);
      lines.push(`\t\tdefault: '',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);
    }

    // Pagination: returnAll + limit
    if (op.hasPagination) {
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Return All',`);
      lines.push(`\t\tname: 'returnAll',`);
      lines.push(`\t\ttype: 'boolean',`);
      lines.push(`\t\tdefault: false,`);
      lines.push(`\t\tdescription: 'Whether to return all results or only up to a given limit',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);

      lines.push(`\t{`);
      const limitParam = op.queryParams.find(p => p.name === 'limit');
      const maxLimit = limitParam?.schema?.maximum ?? 50;
      lines.push(`\t\tdisplayName: 'Limit',`);
      lines.push(`\t\tname: 'limit',`);
      lines.push(`\t\ttype: 'number',`);
      lines.push(`\t\tdefault: 50,`);
      lines.push(`\t\tdescription: 'Max number of results to return',`);
      lines.push(`\t\ttypeOptions: { minValue: 1, maxValue: ${maxLimit} },`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}], returnAll: [false] } },`);
      lines.push(`\t},`);

    }

    // Simplify toggle for GET operations (v2 only, skip for noDataWrapper resources like export)
    if (op.endpoint.method === 'GET' && resource !== 'export') {
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Simplify',`);
      lines.push(`\t\tname: 'simplify',`);
      lines.push(`\t\ttype: 'boolean',`);
      lines.push(`\t\tdefault: true,`);
      lines.push(`\t\tdescription: 'Whether to return a simplified version of the response instead of all fields',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);
    }

    // Required body fields + promoted optional fields (for v1 compat)
    const promotedSet = PROMOTED_TOP_LEVEL_FIELDS[resource]?.[op.v2Op] ?? PROMOTED_TOP_LEVEL_FIELDS[resource]?.[op.v1Op];
    let requiredFields = op.fields.filter(f => (f.required || promotedSet?.has(f.name)) && !f.readOnly);
    const optionalFields = op.fields.filter(f => !f.required && !promotedSet?.has(f.name) && !f.readOnly);

    // Bot update: replace webhook json field with webhookUrl string field
    if (resource === 'bot' && (op.v2Op === 'update' || op.v1Op === 'update')) {
      requiredFields = requiredFields.filter(f => f.name !== 'webhook');
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Webhook URL',`);
      lines.push(`\t\tname: 'webhookUrl',`);
      lines.push(`\t\ttype: 'string',`);
      lines.push(`\t\trequired: true,`);
      lines.push(`\t\tdefault: '',`);
      lines.push(`\t\tplaceholder: 'https://example.com/webhook',`);
      lines.push(`\t\tdescription: 'URL for the outgoing webhook',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);
    }

    // Form create: skip `blocks` from required fields — handled by form builder below
    if (resource === 'form') {
      requiredFields = requiredFields.filter(f => f.name !== 'blocks');
    }

    // Avatar upload: replace `image` body field with binary property reference
    if (getSpecialHandler(resource, op.v2Op) === 'avatarUpload') {
      requiredFields = requiredFields.filter(f => f.name !== 'image');
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Input Binary Field',`);
      lines.push(`\t\tname: 'image',`);
      lines.push(`\t\ttype: 'string',`);
      lines.push(`\t\trequired: true,`);
      lines.push(`\t\tdefault: "data",`);
      lines.push(`\t\tdescription: 'Name of the binary property containing the avatar image. Use a previous node (e.g. HTTP Request, Read Binary File) to load the image.',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);
    }

    for (const field of requiredFields) {
      lines.push(generateFieldProperty(field, resource, op, allResourceValues, allOpValues, true));
    }

    // Optional fields in "Additional Fields" collection
    // Skip `buttons` for message ops — handled by visual button constructor above
    const filteredOptionalFields = resource === 'message'
      ? optionalFields.filter(f => f.name !== 'buttons')
      : optionalFields;
    if (filteredOptionalFields.length > 0) {
      const collectionName = getCollectionName(resource, op.v1Op, 'additionalFields');
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Additional Fields',`);
      lines.push(`\t\tname: ${quote(collectionName)},`);
      lines.push(`\t\ttype: 'collection',`);
      lines.push(`\t\tplaceholder: 'Add Field',`);
      lines.push(`\t\tdefault: {},`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t\toptions: [`);
      const sortedOptionalFields = [...filteredOptionalFields].sort((a, b) => formatDisplayName(a.name).localeCompare(formatDisplayName(b.name)));
      for (const field of sortedOptionalFields) {
        lines.push(generateFieldProperty(field, resource, op, allResourceValues, allOpValues, false, true));
      }
      lines.push(`\t\t],`);
      lines.push(`\t},`);
    }

    // Query parameters (non-pagination, skip parameterized params with {})
    // Primary query params are required or named 'query' (shown top-level for all resources)
    const PRIMARY_QUERY_PARAMS = new Set(['query']);
    // Resources where optional query params should be wrapped in Additional Fields
    const QUERY_FILTER_RESOURCES = new Set(['search', 'security']);

    const nonPaginationParams = op.queryParams.filter(
      p => !['limit', 'cursor', 'per', 'page'].includes(p.name) && !p.name.includes('{')
    );

    // Split into primary (top-level) and filter (collection) params.
    // Optional boolean query params always go into filter (Additional Fields) because
    // boolean default false is indistinguishable from "not set" at the UI level,
    // but the API may treat absence differently from false (e.g. chat.getAll personal).
    const shouldWrapFilters = QUERY_FILTER_RESOURCES.has(resource);
    const isOptionalBool = (p: Parameter) => !p.required && queryParamN8nType(p.schema) === 'boolean';
    const primaryParams = shouldWrapFilters
      ? nonPaginationParams.filter(p => p.required || PRIMARY_QUERY_PARAMS.has(p.name))
      : nonPaginationParams.filter(p => !isOptionalBool(p));
    const filterParams = shouldWrapFilters
      ? nonPaginationParams.filter(p => !p.required && !PRIMARY_QUERY_PARAMS.has(p.name))
      : nonPaginationParams.filter(p => isOptionalBool(p));

    for (const param of primaryParams) {
      const paramName = getParamName(resource, op.v1Op, param.name);
      const searchable = SEARCHABLE_QUERY_PARAMS[param.name];
      const queryDesc = getFieldDescription(param.name, param.description, op.endpoint.id);

      if (searchable) {
        // v2: resourceLocator with searchable dropdown
        lines.push(`\t{`);
        lines.push(`\t\tdisplayName: ${quote(formatDisplayName(param.name))},`);
        lines.push(`\t\tname: ${quote(paramName)},`);
        lines.push(`\t\ttype: 'resourceLocator',`);
        if (param.required) lines.push(`\t\trequired: true,`);
        lines.push(`\t\tdefault: { mode: 'list', value: '' },`);
        if (queryDesc && queryDesc.toLowerCase() !== formatDisplayName(param.name).toLowerCase()) lines.push(`\t\tdescription: ${quote(sanitizeDescription(queryDesc))},`);
        lines.push(`\t\tmodes: [`);
        lines.push(`\t\t\t{`);
        lines.push(`\t\t\t\tdisplayName: 'From List',`);
        lines.push(`\t\t\t\tname: 'list',`);
        lines.push(`\t\t\t\ttype: 'list',`);
        lines.push(`\t\t\t\ttypeOptions: { searchListMethod: ${quote(searchable.method)}, searchable: true },`);
        lines.push(`\t\t\t},`);
        lines.push(`\t\t\t{`);
        lines.push(`\t\t\t\tdisplayName: 'By ID',`);
        lines.push(`\t\t\t\tname: 'id',`);
        lines.push(`\t\t\t\ttype: 'string',`);
        const qPathEx = getPlaceholder(param.example ?? param.schema?.example);
        lines.push(`\t\t\t\tplaceholder: ${quote(qPathEx ? `e.g. ${qPathEx}` : 'e.g. 12345')},`);
        lines.push(`\t\t\t},`);
        const qUrlPattern = URL_PATTERNS[searchable.method];
        if (qUrlPattern) {
          lines.push(`\t\t\t{`);
          lines.push(`\t\t\t\tdisplayName: 'By URL',`);
          lines.push(`\t\t\t\tname: 'url',`);
          lines.push(`\t\t\t\ttype: 'string',`);
          lines.push(`\t\t\t\tplaceholder: ${quote(qUrlPattern.placeholder)},`);
          lines.push(`\t\t\t\textractValue: { type: 'regex', regex: ${quote(qUrlPattern.regex)} },`);
          lines.push(`\t\t\t\tvalidation: [{ type: 'regex', properties: { regex: ${quote(qUrlPattern.regex)}, errorMessage: ${quote(qUrlPattern.error)} } }],`);
          lines.push(`\t\t\t},`);
        }
        lines.push(`\t\t],`);
        lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
        lines.push(`\t\trouting: { send: { type: 'query', property: ${quote(param.name)} } },`);
        lines.push(`\t},`);

        continue;
      }

      lines.push(generateQueryParamField(param, paramName, queryDesc, op.endpoint.id, allResourceValues, allOpValues, '\t'));
    }

    // Optional query params wrapped in Additional Fields (for search/security resources)
    if (filterParams.length > 0) {
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Additional Fields',`);
      lines.push(`\t\tname: 'additionalFields',`);
      lines.push(`\t\ttype: 'collection',`);
      lines.push(`\t\tplaceholder: 'Add Field',`);
      lines.push(`\t\tdefault: {},`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t\toptions: [`);
      const sortedFilterParams = [...filterParams].sort((a, b) => formatDisplayName(a.name).localeCompare(formatDisplayName(b.name)));
      for (const param of sortedFilterParams) {
        const paramName = getParamName(resource, op.v1Op, param.name);
        const queryDesc = getFieldDescription(param.name, param.description, op.endpoint.id);
        lines.push(generateQueryParamField(param, paramName, queryDesc, op.endpoint.id, allResourceValues, allOpValues, '\t\t\t', true));
      }
      lines.push(`\t\t],`);
      lines.push(`\t},`);
    }

    // Visual button constructor for message create/send/update
    if (resource === 'message' && (op.v2Op === 'create' || op.v1Op === 'send' || op.v2Op === 'update')) {
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Button Layout',`);
      lines.push(`\t\tname: 'buttonLayout',`);
      lines.push(`\t\ttype: 'options',`);
      lines.push(`\t\toptions: [`);
      lines.push(`\t\t\t{ name: 'None', value: 'none' },`);
      lines.push(`\t\t\t{ name: 'Single Row', value: 'single_row' },`);
      lines.push(`\t\t\t{ name: 'Multiple Rows', value: 'multiple_rows' },`);
      lines.push(`\t\t\t{ name: 'Raw JSON', value: 'raw_json' },`);
      lines.push(`\t\t],`);
      lines.push(`\t\tdefault: 'none',`);
      lines.push(`\t\tdescription: 'How to layout buttons in the message',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);
      // Visual button fixedCollection (shown for single_row / multiple_rows)
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Buttons',`);
      lines.push(`\t\tname: 'buttons',`);
      lines.push(`\t\ttype: 'fixedCollection',`);
      lines.push(`\t\ttypeOptions: { multipleValues: true },`);
      lines.push(`\t\toptions: [{`);
      lines.push(`\t\t\tname: 'button',`);
      lines.push(`\t\t\tdisplayName: 'Button',`);
      lines.push(`\t\t\tvalues: [`);
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Text',`);
      lines.push(`\t\t\t\t\tname: 'text',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdescription: 'Button label (max 255 characters)',`);
      lines.push(`\t\t\t\t\tplaceholder: 'Click me',`);
      lines.push(`\t\t\t\t},`);
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Type',`);
      lines.push(`\t\t\t\t\tname: 'type',`);
      lines.push(`\t\t\t\t\ttype: 'options',`);
      lines.push(`\t\t\t\t\toptions: [`);
      lines.push(`\t\t\t\t\t\t{ name: 'Data (Webhook)', value: 'data' },`);
      lines.push(`\t\t\t\t\t\t{ name: 'URL (Link)', value: 'url' },`);
      lines.push(`\t\t\t\t\t],`);
      lines.push(`\t\t\t\t\tdefault: 'data',`);
      lines.push(`\t\t\t\t\tdescription: 'Data sends a webhook on click, URL opens a link',`);
      lines.push(`\t\t\t\t},`);
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Data',`);
      lines.push(`\t\t\t\t\tname: 'data',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdescription: 'Data sent via webhook when button is clicked (max 255 characters)',`);
      lines.push(`\t\t\t\t\tplaceholder: 'action_confirm',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['data'] } },`);
      lines.push(`\t\t\t\t},`);
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'URL',`);
      lines.push(`\t\t\t\t\tname: 'url',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdescription: 'URL to open when button is clicked',`);
      lines.push(`\t\t\t\t\tplaceholder: 'https://example.com',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['url'] } },`);
      lines.push(`\t\t\t\t},`);
      lines.push(`\t\t\t],`);
      lines.push(`\t\t}],`);
      lines.push(`\t\tdefault: {},`);
      lines.push(`\t\tdescription: 'Buttons to add to the message. Max 100 buttons, up to 8 per row.',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}], buttonLayout: ['single_row', 'multiple_rows'] } },`);
      lines.push(`\t},`);
      // Raw JSON field (shown for raw_json mode)
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Buttons (JSON)',`);
      lines.push(`\t\tname: 'rawJsonButtons',`);
      lines.push(`\t\ttype: 'json',`);
      lines.push(`\t\tdefault: '[]',`);
      lines.push(`\t\tdescription: 'Buttons as JSON: array of rows, each row is an array of buttons. To remove all buttons, send [].',`);
      lines.push(`\t\tplaceholder: '[[{"text":"OK","data":"confirm"}],[{"text":"Link","url":"https://example.com"}]]',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}], buttonLayout: ['raw_json'] } },`);
      lines.push(`\t},`);
    }

    // Form builder for form create/createView (Phase 13)
    if (resource === 'form' && (op.v2Op === 'create' || op.v1Op === 'createView')) {
      // Builder mode selector: Visual Builder / JSON
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Builder Mode',`);
      lines.push(`\t\tname: 'formBuilderMode',`);
      lines.push(`\t\ttype: 'options',`);
      lines.push(`\t\toptions: [`);
      lines.push(`\t\t\t{ name: 'Visual Builder', value: 'builder' },`);
      lines.push(`\t\t\t{ name: 'JSON', value: 'json' },`);
      lines.push(`\t\t],`);
      lines.push(`\t\tdefault: 'builder',`);
      lines.push(`\t\tdescription: 'Build form visually or paste JSON',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
      lines.push(`\t},`);
      // Visual builder — fixedCollection with all block types (shown in builder mode)
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Form Blocks',`);
      lines.push(`\t\tname: 'formBlocks',`);
      lines.push(`\t\ttype: 'fixedCollection',`);
      lines.push(`\t\ttypeOptions: { multipleValues: true, sortable: true },`);
      lines.push(`\t\tdefault: {},`);
      lines.push(`\t\tdescription: 'Add form blocks using the visual builder',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}], formBuilderMode: ['builder'] } },`);
      lines.push(`\t\toptions: [{`);
      lines.push(`\t\t\tname: 'block',`);
      lines.push(`\t\t\tdisplayName: 'Block',`);
      lines.push(`\t\t\tvalues: [`);
      // Block type selector — MUST be first because other fields reference it via displayOptions.show.type
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Type',`);
      lines.push(`\t\t\t\t\tname: 'type',`);
      lines.push(`\t\t\t\t\ttype: 'options',`);
      lines.push(`\t\t\t\t\toptions: [`);
      lines.push(`\t\t\t\t\t\t{ name: '☑️ Checkboxes', value: 'checkbox' },`);
      lines.push(`\t\t\t\t\t\t{ name: '➖ Divider', value: 'divider' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📄 Plain Text', value: 'plain_text' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📅 Date Picker', value: 'date' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📋 Select Dropdown', value: 'select' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📎 File Upload', value: 'file_input' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📝 Header', value: 'header' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📝 Markdown', value: 'markdown' },`);
      lines.push(`\t\t\t\t\t\t{ name: '📝 Text Input', value: 'input' },`);
      lines.push(`\t\t\t\t\t\t{ name: '🔘 Radio Buttons', value: 'radio' },`);
      lines.push(`\t\t\t\t\t\t{ name: '🕐 Time Picker', value: 'time' },`);
      lines.push(`\t\t\t\t\t],`);
      lines.push(`\t\t\t\t\tdefault: 'input',`);
      lines.push(`\t\t\t\t},`);
      // Remaining fields in alphabetical order by displayName
      // Allowed File Types (file_input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Allowed File Types',`);
      lines.push(`\t\t\t\t\tname: 'filetypes',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tplaceholder: 'png,jpg,pdf',`);
      lines.push(`\t\t\t\t\tdescription: 'Comma-separated list of allowed file extensions',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['file_input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Field Name (for input fields)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Field Name',`);
      lines.push(`\t\t\t\t\tname: 'name',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdescription: 'Unique field identifier (used in form submission data)',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Hint
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Hint',`);
      lines.push(`\t\t\t\t\tname: 'hint',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Initial Date (date only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Initial Date',`);
      lines.push(`\t\t\t\t\tname: 'initial_date',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tplaceholder: '2024-01-01',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['date'] } },`);
      lines.push(`\t\t\t\t},`);
      // Initial Time (time only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Initial Time',`);
      lines.push(`\t\t\t\t\tname: 'initial_time',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tplaceholder: '09:00',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['time'] } },`);
      lines.push(`\t\t\t\t},`);
      // Initial Value (input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Initial Value',`);
      lines.push(`\t\t\t\t\tname: 'initial_value',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Label
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Label',`);
      lines.push(`\t\t\t\t\tname: 'label',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Max Files (file_input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Max Files',`);
      lines.push(`\t\t\t\t\tname: 'max_files',`);
      lines.push(`\t\t\t\t\ttype: 'number',`);
      lines.push(`\t\t\t\t\tdefault: 10,`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['file_input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Max Length (input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Max Length',`);
      lines.push(`\t\t\t\t\tname: 'max_length',`);
      lines.push(`\t\t\t\t\ttype: 'number',`);
      lines.push(`\t\t\t\t\tdefault: 0,`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Min Length (input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Min Length',`);
      lines.push(`\t\t\t\t\tname: 'min_length',`);
      lines.push(`\t\t\t\t\ttype: 'number',`);
      lines.push(`\t\t\t\t\tdefault: 0,`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Multiline (input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Multiline',`);
      lines.push(`\t\t\t\t\tname: 'multiline',`);
      lines.push(`\t\t\t\t\ttype: 'boolean',`);
      lines.push(`\t\t\t\t\tdefault: false,`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Options (for select, radio, checkbox) — nested fixedCollection
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Options',`);
      lines.push(`\t\t\t\t\tname: 'options',`);
      lines.push(`\t\t\t\t\ttype: 'fixedCollection',`);
      lines.push(`\t\t\t\t\ttypeOptions: { multipleValues: true },`);
      lines.push(`\t\t\t\t\tdefault: {},`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['select', 'radio', 'checkbox'] } },`);
      lines.push(`\t\t\t\t\toptions: [{`);
      lines.push(`\t\t\t\t\t\tname: 'option',`);
      lines.push(`\t\t\t\t\t\tdisplayName: 'Option',`);
      lines.push(`\t\t\t\t\t\tvalues: [`);
      lines.push(`\t\t\t\t\t\t\t{ displayName: 'Checked by Default', name: 'checked', type: 'boolean', default: false },`);
      lines.push(`\t\t\t\t\t\t\t{ displayName: 'Description', name: 'description', type: 'string', default: '' },`);
      lines.push(`\t\t\t\t\t\t\t{ displayName: 'Selected by Default', name: 'selected', type: 'boolean', default: false },`);
      lines.push(`\t\t\t\t\t\t\t{ displayName: 'Text', name: 'text', type: 'string', default: '' },`);
      lines.push(`\t\t\t\t\t\t\t{ displayName: 'Value', name: 'value', type: 'string', default: '' },`);
      lines.push(`\t\t\t\t\t\t],`);
      lines.push(`\t\t\t\t\t}],`);
      lines.push(`\t\t\t\t},`);
      // Placeholder (input only)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Placeholder',`);
      lines.push(`\t\t\t\t\tname: 'placeholder',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Required
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Required',`);
      lines.push(`\t\t\t\t\tname: 'required',`);
      lines.push(`\t\t\t\t\ttype: 'boolean',`);
      lines.push(`\t\t\t\t\tdefault: false,`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'] } },`);
      lines.push(`\t\t\t\t},`);
      // Text (for header, plain_text, markdown)
      lines.push(`\t\t\t\t{`);
      lines.push(`\t\t\t\t\tdisplayName: 'Text',`);
      lines.push(`\t\t\t\t\tname: 'text',`);
      lines.push(`\t\t\t\t\ttype: 'string',`);
      lines.push(`\t\t\t\t\tdefault: '',`);
      lines.push(`\t\t\t\t\tdisplayOptions: { show: { type: ['header', 'plain_text', 'markdown'] } },`);
      lines.push(`\t\t\t\t},`);
      lines.push(`\t\t\t],`);
      lines.push(`\t\t}],`);
      lines.push(`\t},`);
      // Raw JSON blocks (shown in json mode)
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Blocks (JSON)',`);
      lines.push(`\t\tname: 'formBlocks',`);
      lines.push(`\t\ttype: 'json',`);
      lines.push(`\t\trequired: true,`);
      lines.push(`\t\tdefault: '[]',`);
      lines.push(`\t\tdescription: 'Paste an array of blocks or the full form JSON from the <a href="https://dev.pachca.com/guides/forms/overview">visual form builder</a>',`);
      lines.push(`\t\thint: 'Build your form visually at dev.pachca.com/guides/forms/overview, then paste the JSON here',`);
      lines.push(`\t\tplaceholder: '{"title":"My form","blocks":[{"type":"input","name":"field_1","label":"Your name"}]}',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}], formBuilderMode: ['json'] } },`);
      lines.push(`\t},`);

      // v1-only processSubmission parameters
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'This operation is deprecated. In v2, use the Pachca Trigger node to receive form submissions via webhook, then process the data with standard n8n nodes.',`);
      lines.push(`\t\tname: 'processSubmissionNotice',`);
      lines.push(`\t\ttype: 'notice',`);
      lines.push(`\t\tdefault: '',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: ['processSubmission'] } },`);
      lines.push(`\t},`);
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Form Type',`);
      lines.push(`\t\tname: 'formType',`);
      lines.push(`\t\ttype: 'options',`);
      lines.push(`\t\toptions: [`);
      lines.push(`\t\t\t{ name: 'Auto-Detect', value: 'auto' },`);
      lines.push(`\t\t\t{ name: 'Feedback Form', value: 'feedback_form' },`);
      lines.push(`\t\t\t{ name: 'Task Request', value: 'task_request' },`);
      lines.push(`\t\t\t{ name: 'Timeoff Request', value: 'timeoff_request' },`);
      lines.push(`\t\t],`);
      lines.push(`\t\tdefault: 'auto',`);
      lines.push(`\t\tdescription: 'Form type for processing data',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: ['processSubmission'] } },`);
      lines.push(`\t},`);
      lines.push(`\t{`);
      lines.push(`\t\tdisplayName: 'Validation Errors',`);
      lines.push(`\t\tname: 'validationErrors',`);
      lines.push(`\t\ttype: 'json',`);
      lines.push(`\t\tdefault: '{}',`);
      lines.push(`\t\tdescription: 'Validation errors to send to user (JSON object with field names and messages)',`);
      lines.push(`\t\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: ['processSubmission'] } },`);
      lines.push(`\t},`);

    }

  }

  lines.push(`];`);

  return lines.join('\n');
}

// ============================================================================
// FIELD GENERATION
// ============================================================================

function generateFieldProperty(
  field: BodyField,
  resource: string,
  op: OperationInfo,
  allResourceValues: string[],
  allOpValues: string[],
  isRequired: boolean,
  isInsideCollection = false,
): string {
  const paramName = getParamName(resource, op.v1Op, field.name);
  const n8nType = toN8nType(field);
  const displayName = formatDisplayName(field.name);

  const lines: string[] = [];
  const tab = isInsideCollection ? '\t\t\t' : '\t';

  // Check if this body field should be a resourceLocator (searchable dropdown)
  const bodySearchMethod = !isInsideCollection ? BODY_FIELD_SEARCH[resource]?.[field.name] : undefined;
  if (bodySearchMethod) {
    lines.push(`${tab}{`);
    lines.push(`${tab}\tdisplayName: ${quote(displayName)},`);
    lines.push(`${tab}\tname: ${quote(paramName)},`);
    lines.push(`${tab}\ttype: 'resourceLocator',`);
    lines.push(`${tab}\tdefault: { mode: 'list', value: '' },`);
    if (isRequired) lines.push(`${tab}\trequired: true,`);
    const rawDesc = getFieldDescription(field.name, field.description, op.endpoint.id);
    if (rawDesc && rawDesc.toLowerCase() !== displayName.toLowerCase()) lines.push(`${tab}\tdescription: ${quote(sanitizeDescription(rawDesc))},`);
    const fieldHint = FIELD_HINTS[resource]?.[field.name];
    if (fieldHint) lines.push(`${tab}\thint: ${quote(fieldHint)},`);
    lines.push(`${tab}\tmodes: [`);
    lines.push(`${tab}\t\t{`);
    lines.push(`${tab}\t\t\tdisplayName: 'From List',`);
    lines.push(`${tab}\t\t\tname: 'list',`);
    lines.push(`${tab}\t\t\ttype: 'list',`);
    lines.push(`${tab}\t\t\ttypeOptions: { searchListMethod: ${quote(bodySearchMethod)}, searchable: true },`);
    lines.push(`${tab}\t\t},`);
    lines.push(`${tab}\t\t{`);
    lines.push(`${tab}\t\t\tdisplayName: 'By ID',`);
    lines.push(`${tab}\t\t\tname: 'id',`);
    lines.push(`${tab}\t\t\ttype: 'string',`);
    const bodyEx = getPlaceholder(field.schema?.example);
    lines.push(`${tab}\t\t\tplaceholder: ${quote(bodyEx ? `e.g. ${bodyEx}` : 'e.g. 12345')},`);
    lines.push(`${tab}\t\t},`);
    const bUrlPattern = URL_PATTERNS[bodySearchMethod];
    if (bUrlPattern) {
      lines.push(`${tab}\t\t{`);
      lines.push(`${tab}\t\t\tdisplayName: 'By URL',`);
      lines.push(`${tab}\t\t\tname: 'url',`);
      lines.push(`${tab}\t\t\ttype: 'string',`);
      lines.push(`${tab}\t\t\tplaceholder: ${quote(bUrlPattern.placeholder)},`);
      lines.push(`${tab}\t\t\textractValue: { type: 'regex', regex: ${quote(bUrlPattern.regex)} },`);
      lines.push(`${tab}\t\t\tvalidation: [{ type: 'regex', properties: { regex: ${quote(bUrlPattern.regex)}, errorMessage: ${quote(bUrlPattern.error)} } }],`);
      lines.push(`${tab}\t\t},`);
    }
    lines.push(`${tab}\t],`);
    lines.push(`${tab}\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
    lines.push(`${tab}\trouting: { send: { type: 'body', property: ${quote(field.name)} } },`);
    lines.push(`${tab}},`);
    return lines.join('\n');
  }

  // Check for field type overrides (e.g. priority → options instead of number)
  const fieldOverride = FIELD_OPTIONS_OVERRIDES[field.name];

  lines.push(`${tab}{`);
  lines.push(`${tab}\tdisplayName: ${quote(displayName)},`);
  lines.push(`${tab}\tname: ${quote(paramName)},`);
  lines.push(`${tab}\ttype: ${quote(fieldOverride ? 'options' : n8nType)},`);

  if (isRequired) {
    lines.push(`${tab}\trequired: true,`);
  }

  // Type-specific options
  if (fieldOverride) {
    const optStr = fieldOverride.options.map(o => `{ name: ${quote(o.name)}, value: ${JSON.stringify(o.value)} }`).join(',\n');
    lines.push(`${tab}\toptions: [${optStr}],`);
  } else if (n8nType === 'options' && field.enum) {
    const enumDescs = getEnumDescriptions(field.name, op.endpoint.id);
    lines.push(`${tab}\toptions: [${generateEnumOptions(field.enum, enumDescs)}],`);
  }

  if (n8nType === 'fixedCollection' && field.items?.properties) {
    const subName = V1_COMPAT_SUBCOLLECTIONS[paramName] ?? `${paramName}Values`;
    lines.push(`${tab}\ttypeOptions: { multipleValues: true },`);
    lines.push(`${tab}\toptions: [{`);
    lines.push(`${tab}\t\tname: ${quote(subName)},`);
    lines.push(`${tab}\t\tdisplayName: ${quote(formatDisplayName(singularize(field.name)))},`);
    lines.push(`${tab}\t\tvalues: [`);
    const subSchema = resolveAllOf(field.items);
    if (subSchema.properties) {
      const sortedSubEntries = Object.entries(subSchema.properties).sort((a, b) => formatDisplayName(a[0]).localeCompare(formatDisplayName(b[0])));
      for (const [subName2, rawSubProp] of sortedSubEntries) {
        const subProp = rawSubProp.allOf ? resolveAllOf(rawSubProp) : rawSubProp;
        const subSchemaType = getSchemaType(subProp);

        // Check if this sub-field should use loadOptions
        const loadOpt = LOAD_OPTIONS_SUBFIELDS[field.name]?.[subName2];
        if (loadOpt) {
          lines.push(`${tab}\t\t\t{`);
          lines.push(`${tab}\t\t\t\tdisplayName: ${quote(loadOpt.displayName)},`);
          lines.push(`${tab}\t\t\t\tname: ${quote(subName2)},`);
          lines.push(`${tab}\t\t\t\ttype: 'options',`);
          lines.push(`${tab}\t\t\t\ttypeOptions: { loadOptionsMethod: ${quote(loadOpt.method)} },`);
          lines.push(`${tab}\t\t\t\tdefault: '',`);
          lines.push(`${tab}\t\t\t\tdescription: ${quote(loadOpt.description)},`);
          lines.push(`${tab}\t\t\t},`);
          continue;
        }

        const subType = subProp.enum ? 'options' : (subSchemaType === 'boolean' ? 'boolean' : ((subSchemaType === 'integer' || subSchemaType === 'number') ? 'number' : 'string'));
        lines.push(`${tab}\t\t\t{`);
        lines.push(`${tab}\t\t\t\tdisplayName: ${quote(formatDisplayName(subName2))},`);
        lines.push(`${tab}\t\t\t\tname: ${quote(subName2)},`);
        lines.push(`${tab}\t\t\t\ttype: ${quote(subType)},`);
        if (subType === 'options' && subProp.enum) {
          const subEnumDescs = subProp['x-enum-descriptions'] as Record<string, string> | undefined;
          lines.push(`${tab}\t\t\t\toptions: [${generateEnumOptions(subProp.enum, subEnumDescs)}],`);
        }
        const subDefaultFallback = subType === 'number' ? 0 : (subType === 'boolean' ? false : '');
        const subDefault = (typeof subProp.default === 'string' && /[а-яА-ЯёЁ]/.test(subProp.default)) ? subDefaultFallback : (subProp.default ?? subDefaultFallback);
        lines.push(`${tab}\t\t\t\tdefault: ${JSON.stringify(subDefault)},`);
        if (subProp.description) {
          const subDisplayName = formatDisplayName(subName2);
          const subDesc = getFieldDescription(subName2, subProp.description, op.endpoint.id, field.name);
          if (subDesc && subDesc.toLowerCase() !== subDisplayName.toLowerCase()) {
            lines.push(`${tab}\t\t\t\tdescription: ${quote(sanitizeDescription(subDesc))},`);
          }
        }
        lines.push(`${tab}\t\t\t},`);
      }
    }
    lines.push(`${tab}\t\t],`);
    lines.push(`${tab}\t}],`);
  }

  if (field.type === 'string' && field.name === 'content') {
    lines.push(`${tab}\ttypeOptions: { rows: 4 },`);
  }

  // Default value
  const defaultVal = getDefaultValue(field, resource, op.v1Op, paramName);
  lines.push(`${tab}\tdefault: ${JSON.stringify(defaultVal)},`);

  // Description — EN spec first, then RU fallback
  // Skip if identical to displayName (n8n lint: node-param-description-identical-to-display-name)
  const rawDesc = getFieldDescription(field.name, field.description, op.endpoint.id);
  if (rawDesc && rawDesc.toLowerCase() !== displayName.toLowerCase()) {
    const desc = sanitizeDescription(n8nType === 'boolean' ? booleanDescription(rawDesc) : rawDesc);
    lines.push(`${tab}\tdescription: ${quote(desc)},`);
  }

  // Hint — contextual tips for no-code users
  const fieldHint = FIELD_HINTS[resource]?.[field.name];
  if (fieldHint) {
    lines.push(`${tab}\thint: ${quote(fieldHint)},`);
  }

  // displayOptions (only for top-level fields, not inside collections)
  if (!isInsideCollection) {
    lines.push(`${tab}\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
  }

  // Placeholder from OpenAPI example
  if (n8nType !== 'fixedCollection' && n8nType !== 'options' && n8nType !== 'boolean') {
    const example = field.schema?.example;
    const placeholder = getPlaceholder(example);
    if (placeholder && !isPrimitiveArray(field)) {
      lines.push(`${tab}\tplaceholder: ${quote(placeholder)},`);
    }
  }

  // routing.send
  if (n8nType === 'fixedCollection') {
    // fixedCollection fields need routing on the collection itself
    lines.push(`${tab}\trouting: { send: { type: 'body', property: ${quote(field.name)} } },`);
  } else if (isPrimitiveArray(field)) {
    // Primitive arrays: routing handled by splitCommaToArray preSend, not inline routing
    const example = field.schema?.example;
    const placeholder = getPlaceholder(example) ?? FIELD_PLACEHOLDERS[field.name];
    if (placeholder) {
      lines.push(`${tab}\tplaceholder: ${quote(placeholder)},`);
    } else {
      const arrayItemType = getArrayItemType(field);
      lines.push(`${tab}\tplaceholder: ${quote(arrayItemType === 'int' ? '1,2,3' : 'tag1,tag2')},`);
    }
    // No routing here — splitCommaToArray preSend handles it
  } else {
    lines.push(`${tab}\trouting: { send: { type: 'body', property: ${quote(field.name)} } },`);
  }

  lines.push(`${tab}},`);
  return lines.join('\n');
}

/** Generate a single query parameter field (reused for top-level and inside collection) */
function generateQueryParamField(
  param: Parameter,
  paramName: string,
  queryDesc: string | undefined,
  endpointId: string,
  allResourceValues: string[],
  allOpValues: string[],
  tab: string,
  isInsideCollection = false,
): string {
  const lines: string[] = [];
  const resolvedSchema = resolveQuerySchema(param.schema);
  const n8nType = queryParamN8nType(param.schema);
  lines.push(`${tab}{`);
  lines.push(`${tab}\tdisplayName: ${quote(formatDisplayName(param.name))},`);
  lines.push(`${tab}\tname: ${quote(paramName)},`);
  lines.push(`${tab}\ttype: ${quote(n8nType)},`);
  if (param.required && !isInsideCollection) {
    lines.push(`${tab}\trequired: true,`);
  }
  if (n8nType === 'options' && resolvedSchema.enum) {
    const qEnumDescs = getEnumDescriptions(param.name, endpointId);
    lines.push(`${tab}\toptions: [${generateEnumOptions(resolvedSchema.enum, qEnumDescs)}],`);
  }
  // Use resolved default, falling back to original schema default (resolveAllOf may drop sibling defaults)
  const rawDefault = resolvedSchema.default ?? param.schema.default;
  const qDefault = (typeof rawDefault === 'string' && /[а-яА-ЯёЁ]/.test(rawDefault)) ? '' : (rawDefault ?? (n8nType === 'boolean' ? false : (n8nType === 'number' ? 0 : '')));
  lines.push(`${tab}\tdefault: ${JSON.stringify(qDefault)},`);
  if (queryDesc && queryDesc.toLowerCase() !== formatDisplayName(param.name).toLowerCase()) {
    const desc = sanitizeDescription(n8nType === 'boolean' ? booleanDescription(queryDesc) : queryDesc);
    lines.push(`${tab}\tdescription: ${quote(desc)},`);
  }
  const qPlaceholder = getPlaceholder(param.example ?? param.schema.example);
  if (qPlaceholder && n8nType !== 'options' && n8nType !== 'boolean') {
    lines.push(`${tab}\tplaceholder: ${quote(qPlaceholder)},`);
  }
  if (!isInsideCollection) {
    lines.push(`${tab}\tdisplayOptions: { show: { resource: [${allResourceValues.map(quote).join(', ')}], operation: [${allOpValues.map(quote).join(', ')}] } },`);
  }
  lines.push(`${tab}\trouting: { send: { type: 'query', property: ${quote(param.name)} } },`);
  lines.push(`${tab}},`);
  return lines.join('\n');
}

/** Safe defaults for enum fields where alphabetical first value is dangerous.
 * Multiple values: first match in the enum wins. E.g., 'role' tries 'member' then 'user'. */
const SAFE_ENUM_DEFAULTS: Record<string, string[]> = {
  role: ['member', 'user'],
};

/** Fields that should be rendered as 'options' type regardless of OpenAPI schema.
 * Used when OpenAPI uses plain integer but valid values are a small fixed set. */
const FIELD_OPTIONS_OVERRIDES: Record<string, { options: Array<{ name: string; value: number | string }>; default: number | string }> = {
  priority: {
    options: [
      { name: 'None', value: 0 },
      { name: '1 — Normal', value: 1 },
      { name: '2 — Important', value: 2 },
      { name: '3 — Very Important', value: 3 },
    ],
    default: 0,
  },
};

function getDefaultValue(field: BodyField, resource: string, op: string, paramName: string): unknown {
  // Field type overrides have priority
  const fieldOverride = FIELD_OPTIONS_OVERRIDES[field.name];
  if (fieldOverride) return fieldOverride.default;
  // Use OpenAPI default if set and not Russian text
  if (field.default !== undefined && !(typeof field.default === 'string' && /[а-яА-ЯёЁ]/.test(field.default))) return field.default;
  if (field.enum && field.enum.length > 0) {
    // Use safe default if the field has one (e.g., role → 'member'/'user' instead of 'admin')
    const safeCandidates = SAFE_ENUM_DEFAULTS[field.name];
    if (safeCandidates) {
      const safe = safeCandidates.find(c => field.enum!.includes(c));
      if (safe) return safe;
    }
    return field.enum[0];
  }

  // Safe type-based defaults (examples go into placeholder, not default)
  // Use n8n type to determine default — OpenAPI type may differ from n8n type
  // (e.g., object without properties → string in n8n → default should be '' not {})
  const n8nFieldType = toN8nType(field);
  if (field.type === 'boolean') return false;
  if (field.type === 'integer' || field.type === 'number') return 0;
  if (field.type === 'array' && !field.items?.properties) return '';
  if (field.type === 'array') return [];
  if (field.type === 'object' && n8nFieldType === 'string') return '';
  if (field.type === 'object') return '{}'; // n8n json type expects string default
  return '';
}

/** Extract placeholder string from OpenAPI example (body field or query param) */
function getPlaceholder(example: unknown): string | undefined {
  if (example === undefined || example === null) return undefined;
  if (typeof example === 'string') {
    if (/[а-яА-ЯёЁ]/.test(example)) return undefined; // skip Russian
    return example;
  }
  if (typeof example === 'number' || typeof example === 'boolean') return String(example);
  if (Array.isArray(example)) {
    // [1, 2, 3] → "1,2,3", [{...}] → JSON
    if (example.length === 0) return undefined;
    if (typeof example[0] === 'object') return JSON.stringify(example);
    return example.join(',');
  }
  if (typeof example === 'object') return JSON.stringify(example);
  return undefined;
}

function getCollectionName(resource: string, op: string, defaultName: string): string {
  const v1Resource = V1_COMPAT_RESOURCES[resource] ?? resource;
  return V1_COMPAT_COLLECTIONS[v1Resource]?.[op]?.[defaultName] ?? defaultName;
}

function singularize(name: string): string {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('s')) return name.slice(0, -1);
  return name;
}

function formatDisplayName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bIds?\b/g, m => m === 'Id' ? 'ID' : 'IDs')
    .replace(/\bUrl\b/g, 'URL');
}

/** Sanitize description for n8n lint compliance:
 * - Single-sentence: strip trailing period (node-param-description-excess-final-period)
 * - Multi-sentence: ensure trailing period (node-param-description-missing-final-period)
 * - Uppercase "json" to "JSON" (node-param-description-miscased-json)
 *
 * The n8n lint rules count sentences by splitting on ". " (after removing "e.g.").
 */
function sanitizeDescription(desc: string): string {
  let result = desc;
  // Uppercase all occurrences of "json" (any case) to "JSON" — n8n lint requires uppercase
  result = result.replace(/\bjson\b/gi, 'JSON');
  // Strip leading quoted/backticked word so description starts with a letter (n8n lint)
  result = result.replace(/^`([^`]+)`\s*/, (_m, w: string) => w + ' ');
  result = result.replace(/^"([^"]+)"\s*/, (_m, w: string) => w + ' ');
  // Ensure first character is uppercase
  result = result.replace(/^([a-z])/, (_m, c: string) => c.toUpperCase());
  // Count sentences: split on ". " after removing "e.g."
  const egLess = result.replace(/e\.g\./g, '');
  const sentenceCount = egLess.split('. ').length;
  if (sentenceCount === 1) {
    // Single sentence — must NOT end with period
    result = result.replace(/\.\s*$/, '');
  } else if (sentenceCount >= 2) {
    // Multi-sentence — MUST end with period
    if (!result.endsWith('.')) result += '.';
  }
  return result;
}

// ============================================================================
// GENERATE MAIN NODE FILE
// ============================================================================

function generateV2Node(resources: string[]): string {
  const imports = resources.map(r => {
    const camel = snakeToCamel(r);
    return `import { ${camel}Operations, ${camel}Fields } from './${snakeToPascal(r)}Description';`;
  });

  const sortedResources = [...resources].sort((a, b) => resourceDisplayName(a).localeCompare(resourceDisplayName(b)));
  const resourceOptions = sortedResources.map(r => {
    const display = resourceDisplayName(r);
    return `\t\t\t\t\t{ name: ${quote(display)}, value: ${quote(r)} },`;
  });

  const properties = resources.map(r => `\t\t\t\t...${snakeToCamel(r)}Operations,\n\t\t\t\t...${snakeToCamel(r)}Fields,`);

  return `import type {
\tINodeType,
\tINodeTypeBaseDescription,
\tINodeTypeDescription,
\tIExecuteFunctions,
\tINodeExecutionData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { router } from '../SharedRouter';
import { searchChats, searchUsers, searchEntities, getCustomProperties } from '../GenericFunctions';

${imports.join('\n')}

export class PachcaV2 implements INodeType {
\tdescription: INodeTypeDescription;

\tconstructor(baseDescription: INodeTypeBaseDescription) {
\t\tthis.description = {
\t\t\t...baseDescription,
\t\t\tversion: 2,
\t\t\tdefaults: { name: 'Pachca' },
\t\t\tusableAsTool: true,
\t\t\tinputs: [NodeConnectionTypes.Main],
\t\t\toutputs: [NodeConnectionTypes.Main],
\t\t\tcredentials: [{ name: 'pachcaApi', required: true }],
\t\t\tproperties: [
\t\t\t\t{
\t\t\t\t\tdisplayName: 'Resource',
\t\t\t\t\tname: 'resource',
\t\t\t\t\ttype: 'options',
\t\t\t\t\tnoDataExpression: true,
\t\t\t\t\toptions: [
${resourceOptions.join('\n')}
\t\t\t\t\t],
\t\t\t\t\tdefault: 'message',
\t\t\t\t},
${properties.join('\n')}
\t\t\t],
\t\t};
\t}

\tasync execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
\t\treturn router.call(this);
\t}

\tmethods = {
\t\tlistSearch: { searchChats, searchUsers, searchEntities },
\t\tloadOptions: { getCustomProperties },
\t};
}
`;
}

function generateVersionedWrapper(): string {
  return `import { VersionedNodeType } from 'n8n-workflow';
import type { INodeTypeBaseDescription } from 'n8n-workflow';
import { PachcaV1 } from './V1/PachcaV1.node';
import { PachcaV2 } from './V2/PachcaV2.node';

export class Pachca extends VersionedNodeType {
\tconstructor() {
\t\tconst baseDescription: INodeTypeBaseDescription = {
\t\t\tdisplayName: 'Pachca',
\t\t\tname: 'pachca',
\t\t\ticon: { light: 'file:pachca.svg', dark: 'file:pachca.dark.svg' },
\t\t\tgroup: ['transform'],
\t\t\tsubtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
\t\t\tdescription: 'Interact with Pachca API',
\t\t\tdefaultVersion: 2,
\t\t};

\t\tconst nodeVersions = {
\t\t\t1: new PachcaV1(baseDescription),
\t\t\t2: new PachcaV2(baseDescription),
\t\t};

\t\tsuper(nodeVersions, baseDescription);
\t}
}
`;
}

// ============================================================================
// GENERATE CREDENTIALS
// ============================================================================

function generateCredentials(): string {
  return `import type {
\tIAuthenticateGeneric,
\tICredentialTestRequest,
\tICredentialType,
\tINodeProperties,
} from 'n8n-workflow';

export class PachcaApi implements ICredentialType {
\tname = 'pachcaApi';
\tdisplayName = 'Pachca API';
\ticon = { light: 'file:pachca.svg', dark: 'file:pachca.dark.svg' } as const;
\tdocumentationUrl = 'https://dev.pachca.com/api/authorization';

\tproperties: INodeProperties[] = [
\t\t{
\t\t\tdisplayName: 'Base URL',
\t\t\tname: 'baseUrl',
\t\t\ttype: 'string',
\t\t\tdefault: 'https://api.pachca.com/api/shared/v1',
\t\t\tdescription: 'Base URL of the Pachca API. Change only for on-premise installations or API proxies.',
\t\t},
\t\t{
\t\t\tdisplayName: 'Access Token',
\t\t\tname: 'accessToken',
\t\t\ttype: 'string',
\t\t\ttypeOptions: { password: true },
\t\t\tdefault: '',
\t\t},
\t\t{
\t\t\tdisplayName: 'Bot ID',
\t\t\tname: 'botId',
\t\t\ttype: 'number',
\t\t\tdefault: 0,
\t\t\tdescription: 'Bot ID for automatic webhook registration (found in bot settings). Leave empty to auto-detect from token. Only needed for Pachca Trigger node.',
\t\t\thint: 'Only required when using a bot token with the Pachca Trigger node',
\t\t},
\t\t{
\t\t\tdisplayName: 'Webhook Signing Secret',
\t\t\tname: 'signingSecret',
\t\t\ttype: 'string',
\t\t\ttypeOptions: { password: true },
\t\t\tdefault: '',
\t\t\tdescription: 'Used to verify incoming webhook requests from Pachca. Found in bot settings under the Webhook section.',
\t\t\thint: 'Only required when using the Pachca Trigger node',
\t\t},
\t\t{
\t\t\tdisplayName: 'Webhook Allowed IPs',
\t\t\tname: 'webhookAllowedIps',
\t\t\ttype: 'string',
\t\t\tdefault: '',
\t\t\tdescription: 'Comma-separated list of IP addresses allowed to send webhooks. Pachca sends from 37.200.70.177. Leave empty to allow all.',
\t\t\tplaceholder: '37.200.70.177',
\t\t\thint: 'Only used with the Pachca Trigger node',
\t\t},
\t];

\tauthenticate: IAuthenticateGeneric = {
\t\ttype: 'generic',
\t\tproperties: {
\t\t\theaders: {
\t\t\t\tAuthorization: '=Bearer {{$credentials.accessToken}}',
\t\t\t},
\t\t},
\t};

\ttest: ICredentialTestRequest = {
\t\trequest: {
\t\t\tbaseURL: '={{$credentials.baseUrl}}',
\t\t\turl: '/oauth/token/info',
\t\t\tmethod: 'GET',
\t\t},
\t};
}
`;
}

// ============================================================================
// WORKFLOW DESCRIPTIONS (English, from packages/spec/workflows.ts)
// ============================================================================

interface WorkflowStep {
  descriptionEn?: string;
  apiMethod?: string;
  apiPath?: string;
  notesEn?: string;
}

interface Workflow {
  titleEn?: string;
  steps: WorkflowStep[];
}

interface SkillConfig {
  name: string;
  tags: string[];
}

let WORKFLOWS: Record<string, Workflow[]> = {};
let SKILL_TAG_MAP: SkillConfig[] = [];

async function loadWorkflowsAndSkills(): Promise<void> {
  try {
    const workflowsPath = path.join(ROOT, 'packages', 'spec', 'workflows.ts');
    if (fs.existsSync(workflowsPath)) {
      const mod = await import(workflowsPath);
      WORKFLOWS = mod.WORKFLOWS ?? {};
    }
  } catch { /* workflows optional */ }

  try {
    const configPath = path.join(ROOT, 'apps', 'docs', 'scripts', 'skills', 'config.ts');
    if (fs.existsSync(configPath)) {
      const mod = await import(configPath);
      SKILL_TAG_MAP = mod.SKILL_TAG_MAP ?? [];
    }
  } catch { /* skill config optional */ }
}

/**
 * Get English description from workflows.ts for a given tag + API path.
 * Falls back to undefined if no matching workflow found.
 */
function getWorkflowDescription(tag: string, operationPath: string): string | undefined {
  const skill = SKILL_TAG_MAP.find(s => s.tags.includes(tag));
  if (!skill) return undefined;

  const workflows = WORKFLOWS[skill.name] ?? [];
  for (const wf of workflows) {
    for (const step of wf.steps) {
      if (step.apiPath === operationPath && step.descriptionEn) {
        return step.descriptionEn;
      }
    }
  }
  return undefined;
}

/**
 * Get a documentation URL for an endpoint (links to dev.pachca.com).
 */
function getDocUrl(endpoint: Endpoint): string {
  try {
    return `https://dev.pachca.com${generateUrlFromOperation(endpoint)}`;
  } catch {
    return '';
  }
}

/**
 * Get a schema-aware default value using example-generator.
 */
function getSchemaDefault(schema: Schema | undefined): unknown {
  if (!schema) return undefined;
  try {
    return generateExample(schema as any, 0, { requiredOnly: true, minimal: true });
  } catch {
    return undefined;
  }
}

// ============================================================================
// MAIN
// ============================================================================

function groupEndpointsByTag(endpoints: Endpoint[]): Map<string, Endpoint[]> {
  const groups = new Map<string, Endpoint[]>();
  for (const endpoint of endpoints) {
    const tag = endpoint.tags[0] || 'Common';
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag)!.push(endpoint);
  }
  return groups;
}

/** Filter out "Common" tag endpoints that should map to specific resources */
function resolveCommonEndpoints(byTag: Map<string, Endpoint[]>): Map<string, Endpoint[]> {
  const common = byTag.get('Common') ?? [];
  const result = new Map(byTag);
  result.delete('Common');

  for (const ep of common) {
    // /custom_properties → customProperty
    if (ep.path.startsWith('/custom_properties')) {
      const tag = 'CustomProperty';
      if (!result.has(tag)) result.set(tag, []);
      result.get(tag)!.push(ep);
    }
    // /uploads → file
    else if (ep.path.startsWith('/uploads')) {
      const tag = 'File';
      if (!result.has(tag)) result.set(tag, []);
      result.get(tag)!.push(ep);
    }
    // /chats/exports → export
    else if (ep.path.startsWith('/chats/exports')) {
      const tag = 'Export';
      if (!result.has(tag)) result.set(tag, []);
      result.get(tag)!.push(ep);
    }
    // Other common endpoints
    else {
      if (!result.has('Common')) result.set('Common', []);
      result.get('Common')!.push(ep);
    }
  }

  return result;
}

// ============================================================================
// POST-PROCESS: INJECT FILE UPLOAD FIELDS
// ============================================================================

/**
 * The /uploads endpoint has no request body in OpenAPI, so the generator produces
 * empty fileFields. This function injects the actual file upload UI fields.
 * The actual upload logic is handled by uploadFileToS3() in Router.ts via execute().
 */
function injectFileUploadFields(outputDir: string): void {
  const filePath = path.join(outputDir, 'FileDescription.ts');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipped file upload injection (FileDescription.ts not found)');
    return;
  }

  let code = fs.readFileSync(filePath, 'utf-8');

  // Replace empty fileFields with actual upload fields
  const fieldsCode = `export const fileFields: INodeProperties[] = [
\t{
\t\tdisplayName: 'File Source',
\t\tname: 'fileSource',
\t\ttype: 'options',
\t\toptions: [
\t\t\t{ name: 'Binary Data', value: 'binary' },
\t\t\t{ name: 'URL', value: 'url' },
\t\t],
\t\tdefault: 'binary',
\t\tdescription: 'Where to get the file to upload',
\t\tdisplayOptions: { show: { resource: ['file'], operation: ['create'] } },
\t},
\t{
\t\tdisplayName: 'File URL',
\t\tname: 'fileUrl',
\t\ttype: 'string',
\t\trequired: true,
\t\tdefault: '',
\t\tdescription: 'URL of the file to upload',
\t\tdisplayOptions: { show: { resource: ['file'], operation: ['create'], fileSource: ['url'] } },
\t},
\t{
\t\tdisplayName: 'Input Binary Field',
\t\tname: 'binaryProperty',
\t\ttype: 'string',
\t\trequired: true,
\t\tdefault: 'data',
\t\thint: 'The name of the input binary field containing the file to be uploaded',
\t\tdisplayOptions: { show: { resource: ['file'], operation: ['create'], fileSource: ['binary'] } },
\t},
\t{
\t\tdisplayName: 'Additional Fields',
\t\tname: 'additionalFields',
\t\ttype: 'collection',
\t\tplaceholder: 'Add Field',
\t\tdefault: {},
\t\tdisplayOptions: { show: { resource: ['file'], operation: ['create'] } },
\t\toptions: [
\t\t\t{
\t\t\t\tdisplayName: 'Content Type',
\t\t\t\tname: 'contentType',
\t\t\t\ttype: 'string',
\t\t\t\tdefault: '',
\t\t\t\tdescription: 'MIME type of the file (e.g. image/png). If not set, auto-detected from file extension.',
\t\t\t},
\t\t\t{
\t\t\t\tdisplayName: 'File Name',
\t\t\t\tname: 'fileName',
\t\t\t\ttype: 'string',
\t\t\t\tdefault: '',
\t\t\t\tdescription: 'Name of the file. If not set, auto-detected from source.',
\t\t\t},
\t\t],
\t},
];`;

  code = code.replace(
    /export const fileFields: INodeProperties\[\] = \[\n\];/,
    fieldsCode,
  );

  fs.writeFileSync(filePath, code);
  console.log('  Injected file upload fields into FileDescription.ts');
}

// injectExportHandling() removed — export response format handled by Router.ts executeRoute()

// ============================================================================
// PACHCA TRIGGER NODE GENERATION
// ============================================================================

interface WebhookEventOption {
  name: string;
  value: string;
  type: string;
  event: string;
}

/**
 * Extract webhook event types from the WebhookPayloadUnion schema.
 * Each member has a `type` enum (e.g. ["button"]) and `event` enum (e.g. ["click"]).
 */
function extractWebhookEvents(schemas: Record<string, Schema>): WebhookEventOption[] {
  const union = schemas['WebhookPayloadUnion'];
  if (!union?.anyOf) {
    console.warn('  Warning: WebhookPayloadUnion not found or has no anyOf');
    return [];
  }

  const events: WebhookEventOption[] = [];

  for (const member of union.anyOf) {
    const resolved = resolveAllOf(member);
    const props = resolved.properties;
    if (!props) continue;

    // Extract type values (usually single-value enum like ["button"])
    const typeProp = props['type'];
    const typeResolved = typeProp?.allOf ? resolveAllOf(typeProp) : typeProp;
    const typeValues = typeResolved?.enum as string[] | undefined;
    if (!typeValues?.length) continue;

    // Extract event values (may be multi-value enum like ["new","update","delete"])
    const eventProp = props['event'];
    const eventResolved = eventProp?.allOf ? resolveAllOf(eventProp) : eventProp;
    const eventValues = eventResolved?.enum as string[] | undefined;
    if (!eventValues?.length) continue;

    for (const typeVal of typeValues) {
      for (const eventVal of eventValues) {
        const key = `${typeVal}:${eventVal}`;
        const mapped = WEBHOOK_EVENT_MAP[key];
        if (mapped) {
          events.push({ ...mapped, type: typeVal, event: eventVal });
        } else {
          // Fallback: generate name/value from type+event
          const name = `${snakeToPascal(typeVal)} ${snakeToPascal(eventVal)}`;
          const value = `${typeVal}_${eventVal}`;
          events.push({ name, value, type: typeVal, event: eventVal });
        }
      }
    }
  }

  // Sort by name for consistent output
  events.sort((a, b) => a.name.localeCompare(b.name));
  return events;
}

/**
 * Generate the PachcaTrigger.node.ts file content from extracted webhook events.
 */
function generateTriggerNode(events: WebhookEventOption[]): string {
  // Build event options for the n8n property
  const optionEntries = events.map(e =>
    `\t\t\t\t\t{ name: '${e.name}', value: '${e.value}' },`
  ).join('\n');

  // Build event filter map: value → { type, event }
  const filterEntries = events.map(e =>
    `\t'${e.value}': { type: '${e.type}', event: '${e.event}' },`
  ).join('\n');

  return `import type {
\tIDataObject,
\tIHookFunctions,
\tINodeType,
\tINodeTypeDescription,
\tIWebhookFunctions,
\tIWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { verifyWebhookSignature, resolveBotId } from './GenericFunctions';

/** Maps n8n event value to webhook payload { type, event } for filtering */
const EVENT_FILTER: Record<string, { type: string; event: string }> = {
${filterEntries}
};

export class PachcaTrigger implements INodeType {
\tdescription: INodeTypeDescription = {
\t\tdisplayName: 'Pachca Trigger',
\t\tname: 'pachcaTrigger',
\t\ticon: { light: 'file:pachca.svg', dark: 'file:pachca.dark.svg' },
\t\tgroup: ['trigger'],
\t\tversion: 1,
\t\tsubtitle: '={{$parameter["event"]}}',
\t\tdescription: 'Starts workflow when Pachca events occur',
\t\tdefaults: { name: 'Pachca Trigger' },
\t\tinputs: [],
\t\toutputs: [NodeConnectionTypes.Main],
\t\tcredentials: [{ name: 'pachcaApi', required: true }],
\t\twebhooks: [
\t\t\t{
\t\t\t\tname: 'default',
\t\t\t\thttpMethod: 'POST',
\t\t\t\tresponseMode: 'onReceived',
\t\t\t\tpath: 'webhook',
\t\t\t\trawBody: true,
\t\t\t},
\t\t],
\t\tproperties: [
\t\t\t{
\t\t\t\tdisplayName: 'Event',
\t\t\t\tname: 'event',
\t\t\t\ttype: 'options',
\t\t\t\tnoDataExpression: true,
\t\t\t\toptions: [
\t\t\t\t\t{ name: 'All Events', value: '*' },
${optionEntries}
\t\t\t\t],
\t\t\t\tdefault: 'new_message',
\t\t\t\tdescription: 'The event to listen for',
\t\t\t},
\t\t],
\t\tusableAsTool: true,
\t};

\twebhookMethods = {
\t\tdefault: {
\t\t\tasync checkExists(this: IHookFunctions): Promise<boolean> {
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tlet botId: number;
\t\t\t\ttry {
\t\t\t\t\tbotId = await resolveBotId(this, credentials);
\t\t\t\t} catch {
\t\t\t\t\treturn false; // Network error → treat as not exists, will trigger create
\t\t\t\t}
\t\t\t\tif (!botId) return false;
\t\t\t\tconst webhookUrl = this.getNodeWebhookUrl('default');
\t\t\t\ttry {
\t\t\t\t\tconst response = (await this.helpers.httpRequestWithAuthentication.call(
\t\t\t\t\t\tthis,
\t\t\t\t\t\t'pachcaApi',
\t\t\t\t\t\t{
\t\t\t\t\t\t\tmethod: 'GET',
\t\t\t\t\t\t\turl: \`\${credentials.baseUrl}/bots/\${botId}\`,
\t\t\t\t\t\t},
\t\t\t\t\t)) as IDataObject;
\t\t\t\t\tconst data = response.data as IDataObject | undefined;
\t\t\t\t\tconst webhook = data?.webhook as IDataObject | undefined;
\t\t\t\t\treturn webhook?.outgoing_url === webhookUrl;
\t\t\t\t} catch {
\t\t\t\t\treturn false;
\t\t\t\t}
\t\t\t},

\t\t\tasync create(this: IHookFunctions): Promise<boolean> {
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tconst botId = await resolveBotId(this, credentials);
\t\t\t\tif (!botId) {
\t\t\t\t\tthis.logger.warn('Pachca Trigger: token is not a bot token. Webhook was NOT registered automatically. Configure webhook URL manually in Pachca bot settings.');
\t\t\t\t\treturn true;
\t\t\t\t}
\t\t\t\tconst webhookUrl = this.getNodeWebhookUrl('default');
\t\t\t\tawait this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
\t\t\t\t\tmethod: 'PUT',
\t\t\t\t\turl: \`\${credentials.baseUrl}/bots/\${botId}\`,
\t\t\t\t\tbody: { bot: { webhook: { outgoing_url: webhookUrl } } },
\t\t\t\t});
\t\t\t\treturn true;
\t\t\t},

\t\t\tasync delete(this: IHookFunctions): Promise<boolean> {
\t\t\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\t\t\tlet botId: number;
\t\t\t\ttry {
\t\t\t\t\tbotId = await resolveBotId(this, credentials);
\t\t\t\t} catch {
\t\t\t\t\treturn true; // Can't resolve bot → nothing to clean up
\t\t\t\t}
\t\t\t\tif (!botId) return true;
\t\t\t\ttry {
\t\t\t\t\tawait this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
\t\t\t\t\t\tmethod: 'PUT',
\t\t\t\t\t\turl: \`\${credentials.baseUrl}/bots/\${botId}\`,
\t\t\t\t\t\tbody: { bot: { webhook: { outgoing_url: '' } } },
\t\t\t\t\t});
\t\t\t\t} catch {
\t\t\t\t\t// Ignore errors on cleanup
\t\t\t\t}
\t\t\t\treturn true;
\t\t\t},
\t\t},
\t};

\tasync webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
\t\tconst body = this.getBodyData() as IDataObject;
\t\tconst headerData = this.getHeaderData() as IDataObject;
\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\tconst event = this.getNodeParameter('event') as string;

\t\t// IP allowlist check
\t\tconst allowedIps = ((credentials.webhookAllowedIps as string) || '').split(',').map(s => s.trim()).filter(Boolean);
\t\tif (allowedIps.length > 0) {
\t\t\tconst request = this.getRequestObject();
\t\t\tconst clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.socket?.remoteAddress || '';
\t\t\tconst normalizedIp = clientIp.replace(/^::ffff:/, '');
\t\t\tif (!allowedIps.includes(normalizedIp)) {
\t\t\t\treturn { webhookResponse: 'Forbidden' };
\t\t\t}
\t\t}

\t\t// Signing secret verification (use raw body bytes for accurate HMAC)
\t\tconst signingSecret = ((credentials.signingSecret as string) || '').trim();
\t\tif (signingSecret) {
\t\t\tconst signature = headerData['pachca-signature'] as string;
\t\t\tif (!signature) {
\t\t\t\treturn { webhookResponse: 'Rejected' };
\t\t\t}
\t\t\tconst request = this.getRequestObject();
\t\t\tconst rawBody = request.rawBody
\t\t\t\t? request.rawBody.toString()
\t\t\t\t: JSON.stringify(body);
\t\t\tif (
\t\t\t\t!verifyWebhookSignature(
\t\t\t\t\trawBody,
\t\t\t\t\tsignature,
\t\t\t\t\tsigningSecret,
\t\t\t\t)
\t\t\t) {
\t\t\t\treturn { webhookResponse: 'Rejected' };
\t\t\t}
\t\t}

\t\t// Replay protection — reject events older than 5 minutes
\t\tconst webhookTs = body.webhook_timestamp as number | undefined;
\t\tif (webhookTs) {
\t\t\tconst ageMs = Date.now() - webhookTs * 1000;
\t\t\tif (ageMs < -60_000 || ageMs > 5 * 60 * 1000) {
\t\t\t\treturn { webhookResponse: 'Rejected' };
\t\t\t}
\t\t}

\t\t// Event filtering using type+event from payload
\t\tif (event !== '*') {
\t\t\tconst filter = EVENT_FILTER[event];
\t\t\tif (filter) {
\t\t\t\tconst bodyType = body.type as string | undefined;
\t\t\t\tconst bodyEvent = body.event as string | undefined;
\t\t\t\tif (bodyType !== filter.type || bodyEvent !== filter.event) {
\t\t\t\t\treturn { webhookResponse: 'Event filtered' };
\t\t\t\t}
\t\t\t}
\t\t}

\t\treturn {
\t\t\tworkflowData: [this.helpers.returnJsonArray(body)],
\t\t};
\t}
}
`;
}

// ============================================================================
// ROUTER GENERATION (execute() dispatcher)
// ============================================================================

/** Detect special handler for an operation */
function getSpecialHandler(resource: string, v2Op: string): string | null {
  if (resource === 'file' && v2Op === 'create') return 'fileUpload';
  if (resource === 'message' && (v2Op === 'create' || v2Op === 'update')) return 'messageButtons';
  if (resource === 'form' && v2Op === 'create') return 'formBlocks';
  if (resource === 'bot' && v2Op === 'update') return 'botWebhook';
  if (resource === 'user' && v2Op === 'getAll') return 'userGetAllFilters';
  if (resource === 'export' && v2Op === 'get') return 'exportDownload';
  if ((resource === 'profile' || resource === 'user') && v2Op === 'updateAvatar') return 'avatarUpload';
  return null;
}

/** Build one FieldMap entry as TypeScript literal */
function buildFieldMapStr(resource: string, op: OperationInfo, f: BodyField): string {
  const n8nName = getParamName(resource, op.v1Op, f.name);
  const parts: string[] = [`api: '${f.name}'`, `n8n: '${n8nName}'`];

  if (isPrimitiveArray(f)) {
    parts.push('isArray: true');
    parts.push(`arrayType: '${getArrayItemType(f)}'`);
  }

  // resourceLocator for body fields (e.g., message.entity_id → searchEntities)
  if (BODY_FIELD_SEARCH[resource]?.[f.name]) {
    parts.push('locator: true');
  }

  // fixedCollection subKey
  if (f.type === 'array' && f.items?.properties) {
    const subKey = V1_COMPAT_SUBCOLLECTIONS[n8nName] ?? singularize(n8nName);
    parts.push(`subKey: '${subKey}'`);
  }

  return `{ ${parts.join(', ')} }`;
}

/** Build one RouteConfig entry for a regular operation */
function buildRouteEntry(resource: string, op: OperationInfo): string {
  const { v2Op, endpoint, fields, queryParams, pathParams, hasPagination, wrapperKey } = op;
  const parts: string[] = [];

  parts.push(`method: '${endpoint.method}' as IHttpRequestMethods`);
  parts.push(`path: '${endpoint.path}'`);

  // Path params
  const ppEntries: string[] = [];
  for (const param of pathParams) {
    const n8nName = getParamName(resource, op.v1Op, param.name);
    const locator = !!PATH_PARAM_SEARCH[resource]?.[param.name];
    const fallbackInfo = V1_ID_FALLBACKS[resource];
    const isSharedOp = fallbackInfo?.sharedOps.includes(v2Op);
    const v1Fallback = isSharedOp && n8nName === 'id' ? fallbackInfo!.v1Name : undefined;

    const pp: string[] = [`api: '${param.name}'`, `n8n: '${n8nName}'`];
    if (locator) pp.push('locator: true');
    if (v1Fallback) pp.push(`v1Fallback: '${v1Fallback}'`);
    ppEntries.push(`{ ${pp.join(', ')} }`);
  }
  if (ppEntries.length) parts.push(`pathParams: [${ppEntries.join(', ')}]`);

  if (wrapperKey) parts.push(`wrapperKey: '${wrapperKey}'`);

  // Sibling fields (stay outside wrapper)
  const siblingFields = fields.filter(f => f.isSibling).map(f => f.name);
  if (siblingFields.length) parts.push(`siblingFields: [${siblingFields.map(f => `'${f}'`).join(', ')}]`);

  if (hasPagination) parts.push('paginated: true');
  if (resource === 'export') parts.push('noDataWrapper: true');

  const special = getSpecialHandler(resource, v2Op);
  if (special) parts.push(`special: '${special}'`);

  // For file upload / avatar upload, skip body/query — handled entirely by special handler
  if (special === 'fileUpload' || special === 'avatarUpload') {
    return `\t\t${v2Op}: {\n\t\t\t${parts.join(',\n\t\t\t')},\n\t\t}`;
  }

  // Required body fields
  const promotedSet = PROMOTED_TOP_LEVEL_FIELDS[resource]?.[v2Op] ?? PROMOTED_TOP_LEVEL_FIELDS[resource]?.[op.v1Op];
  let requiredFields = fields.filter(f => (f.required || promotedSet?.has(f.name)) && !f.readOnly);
  const optionalFields = fields.filter(f => !f.required && !promotedSet?.has(f.name) && !f.readOnly);

  // Filter out special fields handled by special handlers
  if (resource === 'bot') requiredFields = requiredFields.filter(f => f.name !== 'webhook');
  if (resource === 'form') requiredFields = requiredFields.filter(f => f.name !== 'blocks');

  const bodyMapEntries: string[] = [];
  for (const f of requiredFields) {
    bodyMapEntries.push(buildFieldMapStr(resource, op, f));
  }
  if (bodyMapEntries.length) {
    parts.push(`bodyMap: [\n\t\t\t\t${bodyMapEntries.join(',\n\t\t\t\t')},\n\t\t\t]`);
  }

  // Optional body fields (skip buttons for message — handled by messageButtons special)
  let filteredOptional = optionalFields;
  if (resource === 'message') filteredOptional = filteredOptional.filter(f => f.name !== 'buttons');

  const optBodyEntries: string[] = [];
  for (const f of filteredOptional) {
    optBodyEntries.push(buildFieldMapStr(resource, op, f));
  }
  // v1 compat: extra body fields not in OpenAPI (e.g. groupTag color)
  const extraBodyFields = V1_EXTRA_BODY_FIELDS[resource]?.[v2Op];
  if (extraBodyFields) {
    for (const [api, n8n] of extraBodyFields) {
      optBodyEntries.push(`{ api: '${api}', n8n: '${n8n}' }`);
    }
  }
  if (optBodyEntries.length) {
    parts.push(`optionalBodyMap: [\n\t\t\t\t${optBodyEntries.join(',\n\t\t\t\t')},\n\t\t\t]`);
  }

  // v1 collection name override
  const v1Resource = V1_COMPAT_RESOURCES[resource] ?? resource;
  const collOverride = V1_COMPAT_COLLECTIONS[v1Resource]?.[op.v1Op]?.['additionalFields'];
  if (collOverride && collOverride !== 'additionalFields') {
    parts.push(`v1Collection: '${collOverride}'`);
  }

  // Query params
  const nonPaginationParams = queryParams.filter(
    p => !['limit', 'cursor', 'per', 'page'].includes(p.name) && !p.name.includes('{')
  );
  const QUERY_FILTER_RESOURCES = new Set(['search', 'security']);
  const PRIMARY_QUERY_PARAMS = new Set(['query']);
  const shouldWrapFilters = QUERY_FILTER_RESOURCES.has(resource);
  // BUG 1 fix: user.getAll query param must be in optionalQueryMap (read from v1Collection with fallback)
  const isUserGetAll = resource === 'user' && op.v2Op === 'getAll';

  // Optional boolean query params always go to optionalQueryMap (same logic as Description generation)
  const isOptionalBool = (p: Parameter) => !p.required && queryParamN8nType(p.schema) === 'boolean';
  const topLevelQueryParams = shouldWrapFilters
    ? nonPaginationParams.filter(p => p.required || PRIMARY_QUERY_PARAMS.has(p.name))
    : isUserGetAll ? [] : nonPaginationParams.filter(p => !isOptionalBool(p));
  const filterQueryParams = shouldWrapFilters
    ? nonPaginationParams.filter(p => !p.required && !PRIMARY_QUERY_PARAMS.has(p.name))
    : isUserGetAll ? nonPaginationParams : nonPaginationParams.filter(p => isOptionalBool(p));

  const queryMapEntries: string[] = [];
  for (const p of topLevelQueryParams) {
    const n8nName = getParamName(resource, op.v1Op, p.name);
    const locator = !!SEARCHABLE_QUERY_PARAMS[p.name];
    const qm: string[] = [`api: '${p.name}'`, `n8n: '${n8nName}'`];
    if (locator) qm.push('locator: true');
    if (p.required) qm.push('required: true');
    if (isQueryParamArray(p)) {
      qm.push('isArray: true');
      qm.push(`arrayType: '${getQueryArrayItemType(p)}'`);
    }
    queryMapEntries.push(`{ ${qm.join(', ')} }`);
  }
  if (queryMapEntries.length) parts.push(`queryMap: [${queryMapEntries.join(', ')}]`);

  const optQueryEntries: string[] = [];
  for (const p of filterQueryParams) {
    const n8nName = getParamName(resource, op.v1Op, p.name);
    const qm: string[] = [`api: '${p.name}'`, `n8n: '${n8nName}'`];
    if (isQueryParamArray(p)) {
      qm.push('isArray: true');
      qm.push(`arrayType: '${getQueryArrayItemType(p)}'`);
    }
    optQueryEntries.push(`{ ${qm.join(', ')} }`);
  }
  // v1 compat: pagination fields from V1-specific collections (not in OpenAPI spec)
  const v1Pagination = V1_COMPAT_PAGINATION[resource]?.[v2Op];
  if (v1Pagination) {
    for (const [api, n8n] of v1Pagination) {
      optQueryEntries.push(`{ api: '${api}', n8n: '${n8n}' }`);
    }
  }
  if (optQueryEntries.length) parts.push(`optionalQueryMap: [${optQueryEntries.join(', ')}]`);

  return `\t\t${v2Op}: {\n\t\t\t${parts.join(',\n\t\t\t')},\n\t\t}`;
}

/** Build one RouteConfig entry for a v1 alias operation */
function buildAliasRouteEntry(
  resource: string,
  aliasOp: string,
  routing: { method: string; url: string; wrapperKey?: string; pagination?: boolean; splitComma?: [string, string, 'int' | 'string'][] },
): string {
  const parts: string[] = [];
  parts.push(`method: '${routing.method}' as IHttpRequestMethods`);

  // Convert declarative URL '=/path/{{$parameter["x"]}}/sub' → '/path/{x}/sub'
  let apiPath = routing.url.replace(/^=/, '');
  const pathParamNames: string[] = [];
  apiPath = apiPath.replace(/\{\{\$parameter\["(\w+)"\]\}\}/g, (_, paramName) => {
    pathParamNames.push(paramName);
    return `{${paramName}}`;
  });
  parts.push(`path: '${apiPath}'`);

  if (pathParamNames.length) {
    const ppEntries = pathParamNames.map(p => `{ api: '${p}', n8n: '${p}' }`);
    parts.push(`pathParams: [${ppEntries.join(', ')}]`);
  }

  if (routing.pagination) parts.push('paginated: true');

  // v1 collection name override for alias ops
  const v1Resource = V1_COMPAT_RESOURCES[resource] ?? resource;
  const collOverride = V1_COMPAT_COLLECTIONS[v1Resource]?.[aliasOp]?.['additionalFields'];
  if (collOverride && collOverride !== 'additionalFields') {
    parts.push(`v1Collection: '${collOverride}'`);
  }

  // v1 optional query params for alias ops (e.g. role for chat.getMembers)
  const aliasQueryParams = V1_ALIAS_QUERY_PARAMS[resource]?.[aliasOp];
  if (aliasQueryParams?.length) {
    const qEntries = aliasQueryParams.map(([api, n8n]) => `{ api: '${api}', n8n: '${n8n}' }`);
    parts.push(`optionalQueryMap: [${qEntries.join(', ')}]`);
  }

  // Special handler for alias ops
  const aliasSpecial = V1_ALIAS_SPECIALS[resource]?.[aliasOp];
  if (aliasSpecial) parts.push(`special: '${aliasSpecial}'`);

  // Collect body fields from splitComma + V1_ALIAS_FIELDS routing
  const bodyEntries: string[] = [];
  const optBodyEntries: string[] = [];
  if (routing.splitComma) {
    for (const [n8n, api, type] of routing.splitComma) {
      bodyEntries.push(`{ api: '${api}', n8n: '${n8n}', isArray: true, arrayType: '${type}' }`);
    }
  }
  const aliasFieldDefs = V1_ALIAS_FIELDS[resource]?.[aliasOp];
  if (aliasFieldDefs) {
    for (const f of aliasFieldDefs.fields) {
      if (f.routing) {
        const entry = `{ api: '${f.routing.send.property}', n8n: '${f.name}' }`;
        if (f.required) {
          bodyEntries.push(entry);
        } else {
          optBodyEntries.push(entry);
        }
      }
    }
  }
  if (bodyEntries.length) parts.push(`bodyMap: [${bodyEntries.join(', ')}]`);
  if (optBodyEntries.length) parts.push(`optionalBodyMap: [${optBodyEntries.join(', ')}]`);

  return `\t\t${aliasOp}: {\n\t\t\t${parts.join(',\n\t\t\t')},\n\t\t}`;
}

/** Generate the complete Router.ts file */
function generateRouter(resourceOperations: Map<string, OperationInfo[]>): string {
  // --- Build ROUTES table entries ---
  const routeBlocks: string[] = [];
  for (const [resource, operations] of resourceOperations) {
    const opEntries: string[] = [];
    for (const op of operations) {
      opEntries.push(buildRouteEntry(resource, op));
    }
    // V1 alias operation routes
    for (const aliasOp of (V1_ALIAS_OPS[resource] ?? [])) {
      const routing = V1_ALIAS_ROUTING[resource]?.[aliasOp];
      if (routing) opEntries.push(buildAliasRouteEntry(resource, aliasOp, routing));
    }
    // V1-only form operations (no real API call)
    if (resource === 'form') {
      opEntries.push(`\t\tprocessSubmission: {\n\t\t\tmethod: 'GET' as IHttpRequestMethods,\n\t\t\tpath: '/profile',\n\t\t\tspecial: 'formProcessSubmission',\n\t\t}`);
    }
    if (opEntries.length) {
      routeBlocks.push(`\t${resource}: {\n${opEntries.join(',\n')},\n\t}`);
    }
  }

  // --- Build V1_RESOURCE_MAP (inverse of V1_COMPAT_RESOURCES) ---
  const v1ResEntries = Object.entries(V1_COMPAT_RESOURCES)
    .map(([v2, v1]) => `\t${v1}: '${v2}'`).join(',\n');

  // --- Build V1_OP_MAP (inverse of V1_COMPAT_OPS) ---
  const v1OpEntries = Object.entries(V1_COMPAT_OPS).map(([resource, ops]) => {
    const inverted = Object.entries(ops).map(([v2, v1]) => `${v1}: '${v2}'`).join(', ');
    return `\t${resource}: { ${inverted} }`;
  }).join(',\n');

  return `// ============================================================================
// SharedRouter.ts — Generated execute() dispatcher for Pachca node (shared by V1 and V2)
// DO NOT EDIT — this file is auto-generated by generate-n8n.ts
// ============================================================================

import type { IExecuteFunctions, INodeExecutionData, IDataObject, IHttpRequestMethods } from 'n8n-workflow';
import {
\tmakeApiRequest,
\tmakeApiRequestAllPages,
\tresolveResourceLocator,
\tbuildButtonRows,
\tcleanFileAttachments,
\tresolveFormBlocksFromParams,
\tuploadFileToS3,
\tuploadAvatar,
\tsplitAndValidateCommaList,
\tsimplifyItem,
\tsanitizeBaseUrl,
} from './GenericFunctions';

// ============================================================================
// Types
// ============================================================================

interface PathParam {
\tapi: string;
\tn8n: string;
\tlocator?: boolean;
\tv1Fallback?: string;
}

interface FieldMap {
\tapi: string;
\tn8n: string;
\tisArray?: boolean;
\tarrayType?: 'int' | 'string';
\tlocator?: boolean;
\tsubKey?: string;
}

interface QueryMap {
\tapi: string;
\tn8n: string;
\tlocator?: boolean;
\trequired?: boolean;
\tisArray?: boolean;
\tarrayType?: 'int' | 'string';
}

interface RouteConfig {
\tmethod: IHttpRequestMethods;
\tpath: string;
\tpathParams?: PathParam[];
\twrapperKey?: string;
\tsiblingFields?: string[];
\tpaginated?: boolean;
\tnoDataWrapper?: boolean;
\tbodyMap?: FieldMap[];
\toptionalBodyMap?: FieldMap[];
\tqueryMap?: QueryMap[];
\toptionalQueryMap?: QueryMap[];
\tv1Collection?: string;
\tspecial?: string;
}

// ============================================================================
// V1 Compatibility Maps
// ============================================================================

/** v1 resource name → v2 resource name */
const V1_RESOURCE_MAP: Record<string, string> = {
${v1ResEntries},
};

/** v1 operation name → v2 operation name (per v2 resource) */
const V1_OP_MAP: Record<string, Record<string, string>> = {
${v1OpEntries},
};

// ============================================================================
// Routes Table
// ============================================================================

const ROUTES: Record<string, Record<string, RouteConfig>> = {
${routeBlocks.join(',\n')},
};

// ============================================================================
// Router Entry Point
// ============================================================================

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
\tconst items = this.getInputData();
\tconst returnData: INodeExecutionData[] = [];
\tconst nodeVersion = this.getNode().typeVersion;

\tfor (let i = 0; i < items.length; i++) {
\t\ttry {
\t\t\tlet resource = this.getNodeParameter('resource', i) as string;
\t\t\tlet operation = this.getNodeParameter('operation', i) as string;

\t\t\t// v1 compat: map old resource/operation names to v2
\t\t\tif (nodeVersion === 1) {
\t\t\t\tresource = V1_RESOURCE_MAP[resource] ?? resource;
\t\t\t\toperation = V1_OP_MAP[resource]?.[operation] ?? operation;
\t\t\t}

\t\t\tconst route = ROUTES[resource]?.[operation];
\t\t\tif (!route) {
\t\t\t\tthrow new Error(\`Unknown operation: \${resource}.\${operation}\`);
\t\t\t}

\t\t\tconst result = await executeRoute.call(this, route, resource, i, nodeVersion);
\t\t\treturnData.push(...result.map(item => ({ ...item, pairedItem: { item: i } })));
\t\t} catch (error) {
\t\t\tif (this.continueOnFail()) {
\t\t\t\treturnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
\t\t\t} else {
\t\t\t\tthrow error;
\t\t\t}
\t\t}
\t}

\treturn [returnData];
}

// ============================================================================
// Generic Route Executor
// ============================================================================

async function executeRoute(
\tthis: IExecuteFunctions,
\troute: RouteConfig,
\tresource: string,
\ti: number,
\tnodeVersion: number,
): Promise<INodeExecutionData[]> {
\t// === Special-only operations (no API call needed) ===
\tif (route.special === 'fileUpload') {
\t\tconst result = await uploadFileToS3(this, i);
\t\treturn [{ json: result }];
\t}
\tif (route.special === 'formProcessSubmission') {
\t\t// v1 only: pass through form submission data from webhook input
\t\tconst inputData = this.getInputData()[i].json;
\t\treturn [{ json: inputData }];
\t}
\tif (route.special === 'exportDownload') {
\t\tconst exportId = this.getNodeParameter('id', i) as number;
\t\tconst credentials = await this.getCredentials('pachcaApi');
\t\tconst base = sanitizeBaseUrl(credentials.baseUrl as string);
\t\tconst resp = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
\t\t\tmethod: 'GET',
\t\t\turl: \`\${base}/chats/exports/\${exportId}\`,
\t\t\tignoreHttpStatusErrors: true,
\t\t\treturnFullResponse: true,
\t\t\tdisableFollowRedirect: true,
\t\t}) as { statusCode: number; headers: Record<string, string>; body: unknown };
\t\tconst location = resp.headers?.location;
\t\tif (location) {
\t\t\treturn [{ json: { id: exportId, url: location } as unknown as IDataObject }];
\t\t}
\t\tif (typeof resp.body === 'object' && resp.body) {
\t\t\treturn [{ json: resp.body as IDataObject }];
\t\t}
\t\treturn [{ json: { id: exportId, success: true } as unknown as IDataObject }];
\t}
\tif (route.special === 'avatarUpload') {
\t\tlet avatarUrl = route.path;
\t\tfor (const pp of route.pathParams ?? []) {
\t\t\tconst value = this.getNodeParameter(pp.n8n, i) as number;
\t\t\tavatarUrl = avatarUrl.replace(\`{\${pp.api}}\`, String(value));
\t\t}
\t\tconst result = await uploadAvatar(this, i, avatarUrl);
\t\treturn [{ json: result }];
\t}
\t// === Build URL with path params ===
\tlet url = route.path;
\tfor (const pp of route.pathParams ?? []) {
\t\tlet value: number | string;
\t\tif (pp.locator) {
\t\t\tvalue = resolveResourceLocator(this, pp.n8n, i, pp.v1Fallback);
\t\t} else {
\t\t\ttry {
\t\t\t\tvalue = this.getNodeParameter(pp.n8n, i) as number;
\t\t\t} catch (e) {
\t\t\t\tif (pp.v1Fallback) {
\t\t\t\t\tvalue = this.getNodeParameter(pp.v1Fallback, i) as number;
\t\t\t\t} else {
\t\t\t\t\tthrow e;
\t\t\t\t}
\t\t\t}
\t\t}
\t\tif (value === undefined || value === null || value === '') {
\t\t\tthrow new Error(\`Missing required path parameter: \${pp.n8n}\`);
\t\t}
\t\turl = url.replace(\`{\${pp.api}}\`, String(value));
\t}

\t// === Build body from required fields ===
\tconst body: IDataObject = {};
\tfor (const fm of route.bodyMap ?? []) {
\t\tlet raw: unknown;
\t\tif (fm.locator) {
\t\t\traw = resolveResourceLocator(this, fm.n8n, i);
\t\t} else {
\t\t\traw = this.getNodeParameter(fm.n8n, i);
\t\t}
\t\tif (fm.isArray && typeof raw === 'string') {
\t\t\tbody[fm.api] = splitAndValidateCommaList(this, raw, fm.n8n, fm.arrayType!, i);
\t\t} else {
\t\t\tbody[fm.api] = raw as IDataObject;
\t\t}
\t}

\t// === Read optional body fields from collection ===
\tconst collectionName = (nodeVersion === 1 && route.v1Collection) ? route.v1Collection : 'additionalFields';
\tlet additional: IDataObject = {};
\ttry { additional = this.getNodeParameter(collectionName, i, {}) as IDataObject; } catch { /* no collection */ }

\tfor (const fm of route.optionalBodyMap ?? []) {
\t\tlet val: unknown = additional[fm.n8n];

\t\t// If not in collection, try as top-level param (v1 compat for V1_TOP_LEVEL_PARAMS)
\t\tif (val === undefined) {
\t\t\ttry { val = this.getNodeParameter(fm.n8n, i, undefined); } catch { /* not present */ }
\t\t}

\t\tif (val === undefined || val === null || val === '') continue;

\t\t// fixedCollection: extract inner array using subKey
\t\tif (fm.subKey && typeof val === 'object' && !Array.isArray(val)) {
\t\t\tval = (val as IDataObject)[fm.subKey] ?? val;
\t\t}
\t\tif (fm.isArray && typeof val === 'string') {
\t\t\tbody[fm.api] = splitAndValidateCommaList(this, val, fm.n8n, fm.arrayType!, i);
\t\t} else if (fm.locator && typeof val === 'object' && val !== null && (val as IDataObject).__rl) {
\t\t\tbody[fm.api] = (val as IDataObject).value;
\t\t} else {
\t\t\tbody[fm.api] = val as IDataObject;
\t\t}
\t}

\t// === Read top-level query params ===
\tconst qs: IDataObject = {};
\tfor (const qm of route.queryMap ?? []) {
\t\ttry {
\t\t\tlet val: unknown;
\t\t\tif (qm.locator) {
\t\t\t\tval = resolveResourceLocator(this, qm.n8n, i);
\t\t\t} else {
\t\t\t\tval = this.getNodeParameter(qm.n8n, i);
\t\t\t}
\t\t\tif (val !== undefined && val !== null && val !== '') {
\t\t\t\tif (qm.isArray && typeof val === 'string') {
\t\t\t\t\tqs[qm.api] = splitAndValidateCommaList(this, val, qm.n8n, qm.arrayType!, i);
\t\t\t\t} else {
\t\t\t\t\tqs[qm.api] = val as IDataObject;
\t\t\t\t}
\t\t\t}
\t\t} catch (e) {
\t\t\tif (qm.required) throw e;
\t\t}
\t}

\t// Read query params from collection, with top-level fallback (same pattern as optionalBodyMap)
\tfor (const qm of route.optionalQueryMap ?? []) {
\t\tlet val: unknown = additional[qm.n8n];
\t\tif (val === undefined) {
\t\t\ttry { val = this.getNodeParameter(qm.n8n, i, undefined); } catch { /* not present */ }
\t\t}
\t\tif (val !== undefined && val !== null && val !== '') {
\t\t\tif (qm.isArray && typeof val === 'string') {
\t\t\t\tqs[qm.api] = splitAndValidateCommaList(this, val, qm.n8n, qm.arrayType!, i);
\t\t\t} else {
\t\t\t\tqs[qm.api] = val;
\t\t\t}
\t\t}
\t}

\t// === Special handlers ===
\tif (route.special === 'messageButtons') {
\t\tconst buttons = buildButtonRows(this, i);
\t\tif (buttons.length) body.buttons = buttons;
\t\tconst files = cleanFileAttachments(this, i);
\t\tif (files.length) body.files = files;
\t}
\tif (route.special === 'formBlocks') {
\t\tconst blocks = resolveFormBlocksFromParams(this, i);
\t\tif (blocks.length) body.blocks = blocks;
\t}
\tif (route.special === 'unfurlLinkPreviews') {
\t\t// v1 compat: linkPreviews was a fixedCollection { preview: [{ url, title, description, imageUrl }] }
\t\t// v2: linkPreviews is a JSON string. API expects { "url": { title, description, image_url } }
\t\tconst raw = body.link_previews;
\t\tif (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as IDataObject).preview) {
\t\t\tconst previews = (raw as IDataObject).preview as IDataObject[];
\t\t\tconst converted: IDataObject = {};
\t\t\tfor (const p of previews) {
\t\t\t\tif (!p.url) continue;
\t\t\t\tconst entry: IDataObject = {};
\t\t\t\tif (p.title) entry.title = p.title;
\t\t\t\tif (p.description) entry.description = p.description;
\t\t\t\tif (p.imageUrl) entry.image_url = p.imageUrl;
\t\t\t\tconverted[p.url as string] = entry;
\t\t\t}
\t\t\tbody.link_previews = converted;
\t\t} else if (typeof raw === 'string') {
\t\t\ttry { body.link_previews = JSON.parse(raw); } catch { /* leave as-is */ }
\t\t}
\t}
\tif (route.special === 'botWebhook') {
\t\tlet webhookUrl: string | undefined;
\t\ttry { webhookUrl = this.getNodeParameter('webhookUrl', i, '') as string; } catch { /* */ }
\t\tif (webhookUrl) {
\t\t\tbody.webhook = { outgoing_url: webhookUrl };
\t\t}
\t}

\t// === Wrap body in key ===
\tlet finalBody: IDataObject | undefined;
\tif (Object.keys(body).length > 0) {
\t\tif (route.wrapperKey) {
\t\t\tconst inner: IDataObject = {};
\t\t\tconst outer: IDataObject = {};
\t\t\tconst siblingSet = new Set(route.siblingFields ?? []);
\t\t\tfor (const [k, v] of Object.entries(body)) {
\t\t\t\tif (siblingSet.has(k)) {
\t\t\t\t\touter[k] = v;
\t\t\t\t} else {
\t\t\t\t\tinner[k] = v;
\t\t\t\t}
\t\t\t}
\t\t\tfinalBody = { [route.wrapperKey]: inner, ...outer };
\t\t} else {
\t\t\tfinalBody = body;
\t\t}
\t}

\t// === Execute API call ===
\tif (route.paginated) {
\t\tlet results = await makeApiRequestAllPages.call(
\t\t\tthis, route.method, url, qs, i, resource, nodeVersion,
\t\t);

\t\t// v1 client-side post-filters for user.getAll
\t\tif (route.special === 'userGetAllFilters' && nodeVersion === 1) {
\t\t\tlet filterOptions: IDataObject = {};
\t\t\ttry { filterOptions = this.getNodeParameter('filterOptions', i, {}) as IDataObject; } catch { /* */ }

\t\t\tconst filterRole = filterOptions.filterRole as string[] | undefined;
\t\t\tconst filterBot = filterOptions.filterBot as string | undefined;
\t\t\tconst filterSuspended = filterOptions.filterSuspended as string | undefined;
\t\t\tconst filterInviteStatus = filterOptions.filterInviteStatus as string[] | undefined;

\t\t\tif (filterRole?.length || (filterBot && filterBot !== 'all') ||
\t\t\t\t(filterSuspended && filterSuspended !== 'all') || filterInviteStatus?.length) {
\t\t\t\tresults = results.filter(item => {
\t\t\t\t\tconst d = item.json;
\t\t\t\t\tif (filterRole?.length && !filterRole.includes(d.role as string)) return false;
\t\t\t\t\tif (filterBot === 'users' && d.bot === true) return false;
\t\t\t\t\tif (filterBot === 'bots' && d.bot !== true) return false;
\t\t\t\t\tif (filterSuspended === 'active' && d.suspended === true) return false;
\t\t\t\t\tif (filterSuspended === 'suspended' && d.suspended !== true) return false;
\t\t\t\t\tif (filterInviteStatus?.length && !filterInviteStatus.includes(d.invite_status as string)) return false;
\t\t\t\t\treturn true;
\t\t\t\t});
\t\t\t}
\t\t}

\t\treturn results;
\t}

\tconst response = await makeApiRequest.call(
\t\tthis, route.method, url, finalBody,
\t\tObject.keys(qs).length > 0 ? qs : undefined, i,
\t);

\t// === Handle response ===
\tif (route.method === 'DELETE') {
\t\treturn [{ json: { success: true } }];
\t}

\t// Handle 204 No Content for non-DELETE methods (archive, unarchive, pin, addMembers, etc.)
\tif (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
\t\treturn [{ json: { success: true } }];
\t}

\tif (route.noDataWrapper) {
\t\tif (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
\t\t\treturn [{ json: { success: true } as unknown as IDataObject }];
\t\t}
\t\treturn [{ json: response }];
\t}

\tconst data = (response.data as IDataObject) ?? response;

\t// Simplify for GET single item (v2 only)
\tif (nodeVersion >= 2 && route.method === 'GET' && !route.paginated) {
\t\tlet doSimplify = false;
\t\ttry { doSimplify = this.getNodeParameter('simplify', i, false) as boolean; } catch { /* */ }
\t\tif (doSimplify) {
\t\t\treturn [{ json: simplifyItem(data, resource) }];
\t\t}
\t}

\treturn [{ json: data }];
}
`;
}

async function main() {
  console.log('Loading workflows and skill config...');
  await loadWorkflowsAndSkills();
  console.log(`Loaded ${Object.keys(WORKFLOWS).length} workflow groups, ${SKILL_TAG_MAP.length} skills`);

  console.log('Parsing EN OpenAPI spec...');
  const api = parseOpenAPI(EN_SPEC_PATH);
  console.log(`Found ${api.endpoints.length} endpoints, ${api.tags.length} tags`);

  // Also parse EN spec into lookup maps for getFieldDescription/getEnumDescriptions
  const enApi = api;
  for (const ep of enApi.endpoints) {
    enEndpoints.set(ep.id, ep);
    for (const param of ep.parameters) {
      if (param.description) enParamDescs.set(`${ep.id}:${param.name}`, param.description);
    }
    const enFields = extractBodyFields(ep.requestBody);
    for (const field of enFields) {
      if (field.description) enBodyDescs.set(`${ep.id}:${field.name}`, field.description);
      // Enum descriptions from EN spec
      const enResolved = resolveAllOf(field.schema);
      const enEnumDesc = enResolved['x-enum-descriptions'] as Record<string, string> | undefined;
      if (enEnumDesc) enEnumDescs.set(`${ep.id}:${field.name}`, enEnumDesc);
      // Sub-field descriptions for fixedCollection items
      if (field.items?.properties) {
        const subSchema = resolveAllOf(field.items);
        if (subSchema.properties) {
          for (const [subName, subProp] of Object.entries(subSchema.properties)) {
            if (subProp.description) enSubFieldDescs.set(`${ep.id}:${field.name}:${subName}`, subProp.description);
          }
        }
      }
    }
    // Query param enum descriptions
    for (const param of ep.parameters) {
      const pResolved = resolveQuerySchema(param.schema);
      const pEnumDesc = pResolved?.['x-enum-descriptions'] as Record<string, string> | undefined;
      if (pEnumDesc) enEnumDescs.set(`${ep.id}:${param.name}`, pEnumDesc);
    }
  }
  console.log(`  EN descriptions: ${enParamDescs.size} params, ${enBodyDescs.size} body fields, ${enSubFieldDescs.size} sub-fields`);

  // Load scope → roles mapping from x-scope-roles in TokenScope schema
  // Parse the YAML section directly to avoid adding js-yaml dependency
  const specContent = fs.readFileSync(EN_SPEC_PATH, 'utf8');
  const scopeRolesStart = specContent.indexOf('x-scope-roles:');
  if (scopeRolesStart !== -1) {
    // Find the indentation level of x-scope-roles
    const lineStart = specContent.lastIndexOf('\n', scopeRolesStart) + 1;
    const baseIndent = scopeRolesStart - lineStart;
    const lines = specContent.substring(scopeRolesStart).split('\n');
    let currentScope = '';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      const indent = line.length - line.trimStart().length;
      if (indent <= baseIndent) break; // End of x-scope-roles section
      const trimmed = line.trim();
      if (trimmed.endsWith(':') && !trimmed.startsWith('-')) {
        currentScope = trimmed.slice(0, -1);
        scopeRolesMap.set(currentScope, []);
      } else if (trimmed.startsWith('- ') && currentScope) {
        scopeRolesMap.get(currentScope)!.push(trimmed.slice(2));
      }
    }
  }
  console.log(`  Scope-roles: ${scopeRolesMap.size} scopes loaded`);

  let byTag = groupEndpointsByTag(api.endpoints);
  byTag = resolveCommonEndpoints(byTag);

  const generatedResources: string[] = [];
  const resourceOperations = new Map<string, OperationInfo[]>();

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(CREDS_DIR, { recursive: true });
  const ROOT_NODE_DIR = path.resolve(__dirname, '../nodes/Pachca');

  for (const [tag, endpoints] of byTag) {
    const resource = tag === 'CustomProperty' ? 'customProperty'
      : tag === 'File' ? 'file'
      : tag === 'Export' ? 'export'
      : tagToResource(tag);

    if (resource === 'common') continue; // Skip unmapped common endpoints

    const operations: OperationInfo[] = [];

    for (const ep of endpoints) {
      const v2Op = endpointToOperation(ep, resource);
      const v1Op = getV1OpValue(resource, v2Op);
      const fields = extractBodyFields(ep.requestBody);
      const queryParams = ep.parameters.filter(p => p.in === 'query');
      const pathParams = ep.parameters.filter(p => p.in === 'path');
      const hasPagination = queryParams.some(p => p.name === 'cursor');
      const wrapperKey = getWrapperKey(ep.requestBody);
      const epTag = ep.tags[0] || tag;
      const workflowDesc = getWorkflowDescription(epTag, ep.path);
      const docUrl = getDocUrl(ep);
      const enEp = enEndpoints.get(ep.id);
      const baseDesc = workflowDesc ?? enEp?.summary ?? enEp?.description ?? ep.summary ?? ep.description ?? '';
      const description = docUrl ? `${baseDesc}. <a href="${docUrl}">API docs</a>` : baseDesc;

      operations.push({
        v2Op, v1Op, endpoint: ep, fields, queryParams, pathParams,
        hasPagination, wrapperKey, description,
      });
    }

    if (operations.length === 0) continue;

    const code = generateResourceDescription(resource, operations);
    const fileName = `${snakeToPascal(resource)}Description.ts`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, code);
    console.log(`  Generated ${fileName} (${operations.length} operations)`);
    generatedResources.push(resource);
    resourceOperations.set(resource, operations);
  }

  // Post-process: inject file upload fields
  injectFileUploadFields(OUTPUT_DIR);

  // Generate Router.ts (execute() dispatcher with ROUTES table)
  const routerCode = generateRouter(resourceOperations);
  fs.writeFileSync(path.join(ROOT_NODE_DIR, 'SharedRouter.ts'), routerCode);
  console.log(`  Generated SharedRouter.ts (${resourceOperations.size} resources)`);

  // Generate main node file
  const mainNode = generateV2Node(generatedResources);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'PachcaV2.node.ts'), mainNode);
  console.log(`  Generated PachcaV2.node.ts (${generatedResources.length} resources)`);

  // Generate VersionedNodeType wrapper (root level)
  const wrapperNode = generateVersionedWrapper();
  fs.writeFileSync(path.join(ROOT_NODE_DIR, 'Pachca.node.ts'), wrapperNode);
  console.log('  Generated Pachca.node.ts (VersionedNodeType wrapper)');

  // Generate credentials
  const credentials = generateCredentials();
  fs.writeFileSync(path.join(CREDS_DIR, 'PachcaApi.credentials.ts'), credentials);
  console.log('  Generated PachcaApi.credentials.ts');

  // Generate trigger node from webhook payload schemas
  const webhookEvents = extractWebhookEvents(api.schemas);
  const triggerNode = generateTriggerNode(webhookEvents);
  fs.writeFileSync(path.join(ROOT_NODE_DIR, 'PachcaTrigger.node.ts'), triggerNode);
  console.log(`  Generated PachcaTrigger.node.ts (${webhookEvents.length} event types)`);

  // Generate Codex files for node discoverability
  const codex = {
    categories: ['Communication'],
    subcategories: { Communication: ['Team Messaging'] },
    resources: { primaryDocumentation: [{ url: 'https://dev.pachca.com/guides/n8n/overview' }] },
    alias: ['pachca', 'messenger', 'chat', 'team', 'corporate messenger'],
  };
  fs.writeFileSync(path.join(ROOT_NODE_DIR, 'Pachca.node.json'), JSON.stringify(codex, null, '\t') + '\n');
  fs.writeFileSync(path.join(ROOT_NODE_DIR, 'PachcaTrigger.node.json'), JSON.stringify(codex, null, '\t') + '\n');
  console.log('  Generated Pachca.node.json + PachcaTrigger.node.json (codex)');

  console.log(`\nDone! Generated ${generatedResources.length} resources, 1 main node, 1 trigger node, 1 credentials, 2 codex.`);
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
