import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Compatibility tests for the n8n Pachca node.
 *
 * With the VersionedNodeType refactoring, the node structure is:
 * - ROOT_DIR: Pachca.node.ts (VersionedNodeType wrapper), SharedRouter.ts, GenericFunctions.ts, PachcaTrigger.node.ts
 * - V1_DIR: Frozen V1 description files (from npm v1.0.27)
 * - V2_DIR: Generated V2 description files (clean, no v1 compat)
 *
 * These tests verify that:
 * 1. All expected files exist in the correct directories
 * 2. V1 descriptions maintain v1 operation names, parameter names, and alias operations
 * 3. V2 descriptions have clean structure (no @version, no v1 ops)
 * 4. SharedRouter.ts contains V1_RESOURCE_MAP and V1_OP_MAP for runtime v1→v2 mapping
 * 5. Pachca.node.ts is a VersionedNodeType wrapper with defaultVersion: 2
 */

const ROOT_DIR = path.resolve(__dirname, '../nodes/Pachca');
const V1_DIR = path.join(ROOT_DIR, 'V1');
const V2_DIR = path.join(ROOT_DIR, 'V2');
const CREDS_DIR = path.resolve(__dirname, '../credentials');

// ============================================================================
// STRUCTURAL TESTS
// ============================================================================

describe('Generated files exist', () => {
  const rootFiles = [
    'Pachca.node.ts',
    'PachcaTrigger.node.ts',
    'GenericFunctions.ts',
    'SharedRouter.ts',
  ];

  for (const file of rootFiles) {
    it(`should have ${file} in root`, () => {
      expect(fs.existsSync(path.join(ROOT_DIR, file))).toBe(true);
    });
  }

  it('should have V1/ directory', () => {
    expect(fs.existsSync(V1_DIR)).toBe(true);
  });

  it('should have V2/ directory', () => {
    expect(fs.existsSync(V2_DIR)).toBe(true);
  });

  const v1Files = [
    'PachcaV1.node.ts',
    'MessageDescription.ts',
    'UserDescription.ts',
    'ChatDescription.ts',
    'TaskDescription.ts',
    'BotDescription.ts',
    'GroupTagDescription.ts',
    'ThreadDescription.ts',
    'ReactionsDescription.ts',
    'StatusDescription.ts',
    'CustomFieldsDescription.ts',
    'FileDescription.ts',
    'FormDescription.ts',
  ];

  for (const file of v1Files) {
    it(`should have V1/${file}`, () => {
      expect(fs.existsSync(path.join(V1_DIR, file))).toBe(true);
    });
  }

  const v2Files = [
    'PachcaV2.node.ts',
    'MessageDescription.ts',
    'UserDescription.ts',
    'ChatDescription.ts',
    'TaskDescription.ts',
    'BotDescription.ts',
    'GroupTagDescription.ts',
    'MemberDescription.ts',
    'ReactionDescription.ts',
    'ThreadDescription.ts',
    'ProfileDescription.ts',
    'SearchDescription.ts',
    'FormDescription.ts',
    'SecurityDescription.ts',
    'CustomPropertyDescription.ts',
    'FileDescription.ts',
    'LinkPreviewDescription.ts',
    'ReadMemberDescription.ts',
    'ExportDescription.ts',
  ];

  for (const file of v2Files) {
    it(`should have V2/${file}`, () => {
      expect(fs.existsSync(path.join(V2_DIR, file))).toBe(true);
    });
  }

  it('should have PachcaApi.credentials.ts', () => {
    expect(fs.existsSync(path.join(CREDS_DIR, 'PachcaApi.credentials.ts'))).toBe(true);
  });
});

// ============================================================================
// MAIN NODE TESTS (VersionedNodeType wrapper)
// ============================================================================

describe('Pachca.node.ts (VersionedNodeType wrapper)', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(path.join(ROOT_DIR, 'Pachca.node.ts'), 'utf-8');
  });

  it('should export Pachca class extending VersionedNodeType', () => {
    expect(content).toContain('export class Pachca extends VersionedNodeType');
  });

  it('should have defaultVersion: 2', () => {
    expect(content).toContain('defaultVersion: 2');
  });

  it('should import and instantiate PachcaV1', () => {
    expect(content).toContain('PachcaV1');
    expect(content).toContain('new PachcaV1');
  });

  it('should import and instantiate PachcaV2', () => {
    expect(content).toContain('PachcaV2');
    expect(content).toContain('new PachcaV2');
  });

  it('should have nodeVersions with keys 1 and 2', () => {
    expect(content).toMatch(/1:\s*new PachcaV1/);
    expect(content).toMatch(/2:\s*new PachcaV2/);
  });
});

// ============================================================================
// V1 NODE CLASS
// ============================================================================

describe('PachcaV1.node.ts', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(path.join(V1_DIR, 'PachcaV1.node.ts'), 'utf-8');
  });

  it('should export PachcaV1 class', () => {
    expect(content).toContain('export class PachcaV1');
  });

  it('should have version: 1', () => {
    expect(content).toContain('version: 1');
  });

  it('should reference pachcaApi credentials', () => {
    expect(content).toContain("name: 'pachcaApi'");
  });

  it('should have v1 resource values (reactions, status, customFields)', () => {
    expect(content).toContain("value: 'reactions'");
    expect(content).toContain("value: 'status'");
    expect(content).toContain("value: 'customFields'");
  });

  it('should use router from SharedRouter', () => {
    expect(content).toContain("from '../SharedRouter'");
  });
});

// ============================================================================
// V2 NODE CLASS
// ============================================================================

describe('PachcaV2.node.ts', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(path.join(V2_DIR, 'PachcaV2.node.ts'), 'utf-8');
  });

  it('should export PachcaV2 class', () => {
    expect(content).toContain('export class PachcaV2');
  });

  it('should have version: 2', () => {
    expect(content).toContain('version: 2');
  });

  it('should have usableAsTool: true', () => {
    expect(content).toContain('usableAsTool: true');
  });

  it('should reference pachcaApi credentials', () => {
    expect(content).toContain("name: 'pachcaApi'");
  });

  it('should have v2 resource values (reaction, profile, customProperty)', () => {
    expect(content).toContain("value: 'reaction'");
    expect(content).toContain("value: 'profile'");
    expect(content).toContain("value: 'customProperty'");
  });

  it('should use router from SharedRouter', () => {
    expect(content).toContain("from '../SharedRouter'");
  });
});

// ============================================================================
// SHARED ROUTER V1 COMPATIBILITY MAPS
// ============================================================================

describe('SharedRouter.ts v1 compatibility maps', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(path.join(ROOT_DIR, 'SharedRouter.ts'), 'utf-8');
  });

  it('should have V1_RESOURCE_MAP', () => {
    expect(content).toContain('V1_RESOURCE_MAP');
    expect(content).toContain("customFields: 'customProperty'");
    expect(content).toContain("status: 'profile'");
    expect(content).toContain("reactions: 'reaction'");
  });

  it('should have V1_OP_MAP', () => {
    expect(content).toContain('V1_OP_MAP');
    expect(content).toContain("send: 'create'");
    expect(content).toContain("getById: 'get'");
    expect(content).toContain("addReaction: 'create'");
    expect(content).toContain("getCustomProperties: 'get'");
  });
});

// ============================================================================
// V1 OPERATION COMPATIBILITY (V1/ files)
// ============================================================================

describe('V1 operation compatibility', () => {
  it('message: should have v1 "send" operation', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("value: 'send'");
  });

  it('message: should have v1 "getById" operation', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("value: 'getById'");
  });

  it('chat: should have v1 "getById" operation', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("value: 'getById'");
  });

  it('user: should have v1 "getById" operation', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'UserDescription.ts'), 'utf-8');
    expect(content).toContain("value: 'getById'");
  });
});

// ============================================================================
// V2 OPERATIONS ARE CLEAN
// ============================================================================

describe('V2 operations are clean (no v1 compat)', () => {
  it('message: should have "create" not "send"', () => {
    const content = fs.readFileSync(path.join(V2_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("value: 'create'");
    expect(content).not.toContain("value: 'send'");
  });

  it('message: should have "get" not "getById"', () => {
    const content = fs.readFileSync(path.join(V2_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("value: 'get'");
    expect(content).not.toContain("value: 'getById'");
  });

  it('V2 operations should not have v1-only operation values', () => {
    // V2 description files should not have v1-renamed operations
    const msgContent = fs.readFileSync(path.join(V2_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(msgContent).not.toContain("value: 'send'");
    expect(msgContent).not.toContain("value: 'getById'");

    const chatContent = fs.readFileSync(path.join(V2_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(chatContent).not.toContain("value: 'getById'");

    const userContent = fs.readFileSync(path.join(V2_DIR, 'UserDescription.ts'), 'utf-8');
    expect(userContent).not.toContain("value: 'getById'");
  });
});

// ============================================================================
// PAGINATION (V2 files)
// ============================================================================

describe('Pagination pattern', () => {
  const paginatedResources = ['MessageDescription.ts', 'UserDescription.ts', 'ChatDescription.ts', 'TaskDescription.ts'];

  for (const file of paginatedResources) {
    it(`V2/${file} should have returnAll toggle`, () => {
      const content = fs.readFileSync(path.join(V2_DIR, file), 'utf-8');
      expect(content).toContain("name: 'returnAll'");
    });

    it(`V2/${file} should have limit field`, () => {
      const content = fs.readFileSync(path.join(V2_DIR, file), 'utf-8');
      expect(content).toContain("name: 'limit'");
    });
  }
});

// ============================================================================
// UNIQUE OPERATIONS (no duplicates, V2 files)
// ============================================================================

describe('No duplicate operation values', () => {
  it('user resource should have unique operation values', () => {
    const content = fs.readFileSync(path.join(V2_DIR, 'UserDescription.ts'), 'utf-8');
    const opSection = content.split('export const userOperations')[1]?.split('export const userFields')[0] ?? '';
    const opValues = [...opSection.matchAll(/value: '([^']+)'/g)].map(m => m[1]);
    expect(opValues.length).toBeGreaterThan(0);
    const unique = new Set(opValues);
    expect(opValues.length).toBe(unique.size);
  });

  it('chat resource should have unique operation values', () => {
    const content = fs.readFileSync(path.join(V2_DIR, 'ChatDescription.ts'), 'utf-8');
    const opSection = content.split('export const chatOperations')[1]?.split('export const chatFields')[0] ?? '';
    const opValues = [...opSection.matchAll(/value: '([^']+)'/g)].map(m => m[1]);
    expect(opValues.length).toBeGreaterThan(0);
    const unique = new Set(opValues);
    expect(opValues.length).toBe(unique.size);
  });
});

// ============================================================================
// CREDENTIALS
// ============================================================================

describe('PachcaApi.credentials.ts', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(path.join(CREDS_DIR, 'PachcaApi.credentials.ts'), 'utf-8');
  });

  it('should export PachcaApi class', () => {
    expect(content).toContain('export class PachcaApi');
  });

  it('should have Bearer auth', () => {
    expect(content).toContain('Bearer {{$credentials.accessToken}}');
  });

  it('should test credentials via GET /oauth/token/info', () => {
    expect(content).toContain("url: '/oauth/token/info'");
  });

  it('should have signingSecret field', () => {
    expect(content).toContain("name: 'signingSecret'");
  });

  it('should have botId field', () => {
    expect(content).toContain("name: 'botId'");
  });
});

// ============================================================================
// TRIGGER NODE
// ============================================================================

describe('PachcaTrigger.node.ts', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(path.join(ROOT_DIR, 'PachcaTrigger.node.ts'), 'utf-8');
  });

  it('should export PachcaTrigger class', () => {
    expect(content).toContain('export class PachcaTrigger');
  });

  it('should have webhook event options', () => {
    expect(content).toContain("value: 'new_message'");
    expect(content).toContain("value: 'button_pressed'");
    expect(content).toContain("value: 'form_submitted'");
  });

  it('should verify webhook signature', () => {
    expect(content).toContain('verifyWebhookSignature');
  });

  it('should register webhook via PUT /bots/{id}', () => {
    expect(content).toContain('/bots/${botId}');
  });
});

// ============================================================================
// V1 ALIAS OPERATIONS (V1/ files)
// ============================================================================

describe('V1 alias operations', () => {
  it('chat: should have v1 alias ops (getMembers, addUsers, removeUser, updateRole, leaveChat)', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    for (const op of ['getMembers', 'addUsers', 'removeUser', 'updateRole', 'leaveChat']) {
      expect(content).toContain(`value: '${op}'`);
    }
  });

  it('message: should have v1 alias ops (getReadMembers, unfurl)', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    for (const op of ['getReadMembers', 'unfurl']) {
      expect(content).toContain(`value: '${op}'`);
    }
  });
});

// ============================================================================
// V1 COMPAT PARAMETERS (V1/ files)
// ============================================================================

describe('V1 compatibility parameters', () => {
  it('reactions: should use reactionsMessageId (not id) for path param', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ReactionsDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'reactionsMessageId'");
  });

  it('thread: should use threadMessageId for path param', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ThreadDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'threadMessageId'");
  });

  it('user: should have getAllUsersNoLimit hidden v1 param', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'UserDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'getAllUsersNoLimit'");
  });

  it('message: should have buttonLayout param', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'buttonLayout'");
  });

  it('message: entityType should be top-level for send operation', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'entityType'");
  });
});

// ============================================================================
// V1 ALIAS OPERATION FIELDS (V1/ files)
// ============================================================================

describe('V1 alias operation fields', () => {
  it('chat alias ops: should have chatId field for getMembers/addUsers/removeUser/updateRole/leaveChat', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'chatId'");
    // chatId should cover alias operations
    expect(content).toContain("'getMembers'");
    expect(content).toContain("'addUsers'");
    expect(content).toContain("'removeUser'");
    expect(content).toContain("'updateRole'");
    expect(content).toContain("'leaveChat'");
  });

  it('chat: addUsers should have memberIds and silent fields', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'memberIds'");
    expect(content).toContain("name: 'silent'");
  });

  it('chat: updateRole should have newRole options field', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'newRole'");
  });

  it('chat: removeUser/updateRole should have userId field', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'userId'");
  });

  it('message: getReadMembers should have messageId field', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'messageId'");
  });

  it('message: unfurl should have linkPreviews field', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'linkPreviews'");
  });

  it('groupTag: addTags should have groupTagChatId and groupTagIds fields', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'GroupTagDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'groupTagChatId'");
    expect(content).toContain("name: 'groupTagIds'");
  });

  it('groupTag: removeTag should have groupTagChatId and tagId fields', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'GroupTagDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'tagId'");
  });

  it('chat: getMembers alias should have returnAll and limit for pagination', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("operation: ['getMembers']");
  });

  it('message: getReadMembers alias should have pagination fields', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'MessageDescription.ts'), 'utf-8');
    expect(content).toContain("operation: ['getReadMembers']");
  });
});

// ============================================================================
// BOT UPDATE UX (V2 file)
// ============================================================================

describe('Bot update UX', () => {
  it('bot update: should have webhookUrl field instead of raw JSON', () => {
    const content = fs.readFileSync(path.join(V2_DIR, 'BotDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'webhookUrl'");
  });
});

// ============================================================================
// ENGLISH DESCRIPTIONS (V2 files)
// ============================================================================

describe('English descriptions for common fields', () => {
  it('returnAll and limit should have English descriptions', () => {
    for (const file of ['UserDescription.ts', 'ChatDescription.ts', 'MessageDescription.ts']) {
      const content = fs.readFileSync(path.join(V2_DIR, file), 'utf-8');
      expect(content).toContain("Whether to return all results or only up to a given limit");
      expect(content).toContain("Max number of results to return");
    }
  });

  it('main resource path param ID should have resource-specific description', () => {
    const expected: Record<string, string> = {
      'UserDescription.ts': 'User ID',
      'ChatDescription.ts': 'Chat ID',
      'MessageDescription.ts': 'Message ID',
      'TaskDescription.ts': 'Task ID',
    };
    for (const [file, desc] of Object.entries(expected)) {
      const content = fs.readFileSync(path.join(V2_DIR, file), 'utf-8');
      expect(content).toContain(`description: '${desc}'`);
    }
  });
});

// ============================================================================
// V1 TOP-LEVEL FIELD DUPLICATES (V1/ files — fields that were promoted in v1)
// ============================================================================

describe('V1 top-level field duplicates', () => {
  it('V1 chat.create: should have top-level channel and public', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'ChatDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'channel'");
    expect(content).toContain("name: 'public'");
  });

  it('V1 user.create: should have top-level firstName', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'UserDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'firstName'");
  });

  it('V1 task.create: should have top-level taskContent', () => {
    const content = fs.readFileSync(path.join(V1_DIR, 'TaskDescription.ts'), 'utf-8');
    expect(content).toContain("name: 'taskContent'");
  });
});

// ============================================================================
// NO TEMPLATE PARAMETERS (V2 files)
// ============================================================================

describe('No template parameters in output', () => {
  it('should not have sort[{field}] parameter in V2 descriptions', () => {
    const files = fs.readdirSync(V2_DIR).filter(f => f.endsWith('Description.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(V2_DIR, file), 'utf-8');
      expect(content).not.toContain('sort[{field}]');
    }
  });
});

// ============================================================================
// VISUAL BUTTON CONSTRUCTOR (V2 file)
// ============================================================================

describe('Visual button constructor', () => {
  let messageContent: string;
  beforeAll(() => {
    messageContent = fs.readFileSync(path.join(V2_DIR, 'MessageDescription.ts'), 'utf-8');
  });

  it('buttonLayout field present (no @version restriction)', () => {
    const layoutMatch = messageContent.match(/name: 'buttonLayout'[\s\S]*?displayOptions: \{[^}]+\}/);
    expect(layoutMatch).toBeTruthy();
    expect(layoutMatch![0]).not.toContain('@version');
  });

  it('buttonLayout has none, single_row, multiple_rows, and raw_json options', () => {
    expect(messageContent).toContain("value: 'none'");
    expect(messageContent).toContain("value: 'single_row'");
    expect(messageContent).toContain("value: 'multiple_rows'");
    expect(messageContent).toContain("value: 'raw_json'");
  });

  it('buttons fixedCollection shown for single_row and multiple_rows', () => {
    const match = messageContent.match(/name: 'buttons',\s*type: 'fixedCollection'[\s\S]*?buttonLayout: \[([^\]]+)\]/);
    expect(match).toBeTruthy();
    expect(match![1]).toContain("'single_row'");
    expect(match![1]).toContain("'multiple_rows'");
  });

  it('buttons fixedCollection has button subcollection with text, type, data, url', () => {
    expect(messageContent).toContain("name: 'button'");
    expect(messageContent).toContain("name: 'text'");
    expect(messageContent).toContain("name: 'type'");
    expect(messageContent).toContain("value: 'data'");
    expect(messageContent).toContain("value: 'url'");
  });

  it('rawJsonButtons shown for raw_json mode', () => {
    const match = messageContent.match(/name: 'rawJsonButtons'[\s\S]*?displayOptions: \{[^}]+\}/);
    expect(match).toBeTruthy();
    expect(match![0]).toContain("buttonLayout: ['raw_json']");
  });

  it('buttons NOT in additionalFields', () => {
    const additionalFieldsMatch = messageContent.match(/name: 'additionalFields'[\s\S]*?options: \[([\s\S]*?)\n\t\t\],/);
    if (additionalFieldsMatch) {
      expect(additionalFieldsMatch[1]).not.toContain("name: 'buttons'");
    }
  });

  it('buttonLayout and buttons present for both create and update operations', () => {
    // V2 uses 'create' (not 'create', 'send')
    const createSection = messageContent.match(/operation: \['create'\].*?buttonLayout/s);
    expect(createSection).toBeTruthy();
    const updateSection = messageContent.match(/operation: \['update'\].*?buttonLayout/s);
    expect(updateSection).toBeTruthy();
  });
});

// ============================================================================
// FORM BUILDER (V2 file)
// ============================================================================

describe('Form builder (templates + JSON)', () => {
  let formContent: string;
  beforeAll(() => {
    formContent = fs.readFileSync(path.join(V2_DIR, 'FormDescription.ts'), 'utf-8');
  });

  it('formBuilderMode field exists with template and json options', () => {
    expect(formContent).toContain("name: 'formBuilderMode'");
    expect(formContent).toContain("value: 'template'");
    expect(formContent).toContain("value: 'json'");
  });

  it('formBuilderMode field exists in the form fields section', () => {
    expect(formContent).toContain("name: 'formBuilderMode'");
  });

  it('formTemplate shown only in template mode', () => {
    const match = formContent.match(/name: 'formTemplate'[\s\S]*?displayOptions: \{[^}]*formBuilderMode: \[([^\]]+)\]/);
    expect(match).toBeTruthy();
    expect(match![1]).toContain("'template'");
    expect(match![1]).not.toContain("'json'");
  });

  it('formTemplate has all 4 templates', () => {
    expect(formContent).toContain("value: 'feedback'");
    expect(formContent).toContain("value: 'timeoff'");
    expect(formContent).toContain("value: 'survey'");
    expect(formContent).toContain("value: 'bug_report'");
  });

  it('formBlocks shown for builder and json modes', () => {
    expect(formContent).toContain("formBuilderMode: ['builder']");
    expect(formContent).toContain("formBuilderMode: ['json']");
  });

  it('formBlocks has both fixedCollection (builder) and json (json mode) variants', () => {
    const fcMatch = formContent.match(/name: 'formBlocks',\s*type: 'fixedCollection'/);
    expect(fcMatch).toBeTruthy();
    const jsonMatch = formContent.match(/name: 'formBlocks',\s*type: 'json'/);
    expect(jsonMatch).toBeTruthy();
  });

  it('blocks not in required fields or additionalFields', () => {
    expect(formContent).not.toMatch(/name: 'blocks'[^}]*routing:/);
  });

  it('BUG 3: form builder options fixedCollection has multipleValues: true', () => {
    const optionsMatch = formContent.match(
      /name: 'options',\s*type: 'fixedCollection',\s*typeOptions:\s*\{\s*multipleValues:\s*true\s*\}/
    );
    expect(optionsMatch).toBeTruthy();
  });
});
