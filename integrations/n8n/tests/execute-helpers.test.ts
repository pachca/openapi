import { describe, it, expect, vi } from 'vitest';
import type { IDataObject, IExecuteFunctions, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  simplifyItem,
  resolveResourceLocator,
  buildButtonRows,
  cleanFileAttachments,
  resolveFormBlocksFromParams,
  splitAndValidateCommaList,
  uploadFileToS3,
  buildMultipartBody,
} from '../nodes/Pachca/GenericFunctions';

// ============================================================================
// Mock helpers
// ============================================================================

const MOCK_NODE: INode = {
  id: 'test-node-id',
  name: 'Pachca',
  type: 'n8n-nodes-pachca.pachca',
  typeVersion: 2,
  position: [0, 0],
  parameters: {},
};

/**
 * Creates a minimal IExecuteFunctions mock.
 * Pass a dictionary of paramName -> value. getNodeParameter will look up values
 * from this dictionary, throwing for missing keys unless a default is provided.
 */
function createMockCtx(params: Record<string, unknown> = {}): IExecuteFunctions {
  const getNodeParameter = vi.fn(
    (paramName: string, _itemIndex: number, fallbackValue?: unknown) => {
      if (paramName in params) {
        return params[paramName];
      }
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw new Error(`Parameter "${paramName}" not found`);
    },
  );

  return {
    getNodeParameter,
    getNode: vi.fn(() => MOCK_NODE),
  } as unknown as IExecuteFunctions;
}

// ============================================================================
// simplifyItem
// ============================================================================

describe('simplifyItem', () => {
  it('should keep only key fields for message', () => {
    const item: IDataObject = {
      id: 1,
      entity_id: 100,
      chat_id: 200,
      content: 'Hello',
      user_id: 42,
      created_at: '2026-01-01',
      thread: null,
      files: [],
      extra_field: 'should be removed',
    };
    const result = simplifyItem(item, 'message');
    expect(result).toEqual({
      id: 1,
      entity_id: 100,
      chat_id: 200,
      content: 'Hello',
      user_id: 42,
      created_at: '2026-01-01',
    });
  });

  it('should keep only key fields for chat', () => {
    const item: IDataObject = {
      id: 10,
      name: 'General',
      channel: true,
      public: true,
      member_ids: [1, 2, 3],
      created_at: '2026-01-01',
      description: 'should be removed',
      owner_id: 1,
    };
    const result = simplifyItem(item, 'chat');
    expect(result).toEqual({
      id: 10,
      name: 'General',
      channel: true,
      public: true,
      member_ids: [1, 2, 3],
      created_at: '2026-01-01',
    });
  });

  it('should keep only key fields for user', () => {
    const item: IDataObject = {
      id: 5,
      first_name: 'John',
      last_name: 'Doe',
      nickname: 'johnd',
      email: 'john@example.com',
      role: 'admin',
      suspended: false,
      phone_number: '+1234567890',
      department: 'Engineering',
    };
    const result = simplifyItem(item, 'user');
    expect(result).toEqual({
      id: 5,
      first_name: 'John',
      last_name: 'Doe',
      nickname: 'johnd',
      email: 'john@example.com',
      role: 'admin',
      suspended: false,
    });
  });

  it('should keep only key fields for task', () => {
    const item: IDataObject = {
      id: 7,
      content: 'Fix bug',
      kind: 'task',
      status: 'open',
      priority: 1,
      due_at: '2026-02-01',
      created_at: '2026-01-15',
      performer_ids: [1, 2],
      assignee: 'Jane',
    };
    const result = simplifyItem(item, 'task');
    expect(result).toEqual({
      id: 7,
      content: 'Fix bug',
      kind: 'task',
      status: 'open',
      priority: 1,
      due_at: '2026-02-01',
      created_at: '2026-01-15',
    });
  });

  it('should keep only key fields for bot', () => {
    const item: IDataObject = { id: 3, webhook: { outgoing_url: 'https://example.com' }, token: 'secret' };
    const result = simplifyItem(item, 'bot');
    expect(result).toEqual({ id: 3, webhook: { outgoing_url: 'https://example.com' } });
  });

  it('should keep only key fields for groupTag', () => {
    const item: IDataObject = { id: 9, name: 'Developers', users_count: 12, color: '#ff0000' };
    const result = simplifyItem(item, 'groupTag');
    expect(result).toEqual({ id: 9, name: 'Developers', users_count: 12 });
  });

  it('should keep only key fields for reaction', () => {
    const item: IDataObject = { code: ':thumbsup:', name: 'thumbsup', user_id: 42, created_at: '2026-01-01', message_id: 999 };
    const result = simplifyItem(item, 'reaction');
    expect(result).toEqual({ code: ':thumbsup:', name: 'thumbsup', user_id: 42, created_at: '2026-01-01' });
  });

  it('should keep only key fields for export', () => {
    const item: IDataObject = { id: 20, status: 'completed', created_at: '2026-01-01', url: 'https://...', size: 1024 };
    const result = simplifyItem(item, 'export');
    expect(result).toEqual({ id: 20, status: 'completed', created_at: '2026-01-01' });
  });

  it('should return full item for unknown resource', () => {
    const item: IDataObject = { id: 1, foo: 'bar', baz: 42 };
    const result = simplifyItem(item, 'unknownResource');
    expect(result).toEqual(item);
    expect(result).toBe(item); // same reference
  });
});

// ============================================================================
// resolveResourceLocator
// ============================================================================

describe('resolveResourceLocator', () => {
  it('should return plain number value', () => {
    const ctx = createMockCtx({ chatId: 123 });
    const result = resolveResourceLocator(ctx, 'chatId', 0);
    expect(result).toBe(123);
  });

  it('should return plain string value', () => {
    const ctx = createMockCtx({ name: 'general' });
    const result = resolveResourceLocator(ctx, 'name', 0);
    expect(result).toBe('general');
  });

  it('should extract value from resourceLocator object with __rl', () => {
    const ctx = createMockCtx({
      chatId: { mode: 'list', value: 456, __rl: true },
    });
    const result = resolveResourceLocator(ctx, 'chatId', 0);
    expect(result).toBe(456);
  });

  it('should extract string value from resourceLocator object', () => {
    const ctx = createMockCtx({
      chatId: { mode: 'id', value: 'abc-123', __rl: true },
    });
    const result = resolveResourceLocator(ctx, 'chatId', 0);
    expect(result).toBe('abc-123');
  });

  it('should fall back to fallbackParam when primary is missing', () => {
    const ctx = createMockCtx({ entity_id: 789 });
    const result = resolveResourceLocator(ctx, 'chatId', 0, 'entity_id');
    expect(result).toBe(789);
  });

  it('should throw NodeOperationError when param is missing and no fallback', () => {
    const ctx = createMockCtx({});
    expect(() => resolveResourceLocator(ctx, 'chatId', 0)).toThrow(NodeOperationError);
    expect(() => resolveResourceLocator(ctx, 'chatId', 0)).toThrow('Missing required parameter: chatId');
  });

  it('should throw NodeOperationError when both primary and fallback are missing', () => {
    const ctx = createMockCtx({});
    // fallbackParam also not in params, so getNodeParameter for fallback will also throw
    expect(() => resolveResourceLocator(ctx, 'chatId', 0, 'entityId')).toThrow();
  });
});

// ============================================================================
// buildButtonRows
// ============================================================================

describe('buildButtonRows', () => {
  it('should return empty array when buttonLayout is none', () => {
    const ctx = createMockCtx({ buttonLayout: 'none' });
    expect(buildButtonRows(ctx, 0)).toEqual([]);
  });

  it('should return empty array when buttonLayout param is missing', () => {
    const ctx = createMockCtx({});
    expect(buildButtonRows(ctx, 0)).toEqual([]);
  });

  it('should build a single row from visual builder', () => {
    const ctx = createMockCtx({
      buttonLayout: 'single_row',
      buttons: {
        button: [
          { text: 'Click me', type: 'callback', data: 'btn1' },
          { text: 'Open URL', type: 'url', url: 'https://example.com' },
        ],
      },
    });
    const result = buildButtonRows(ctx, 0);
    expect(result).toEqual([
      [
        { text: 'Click me', data: 'btn1' },
        { text: 'Open URL', url: 'https://example.com' },
      ],
    ]);
  });

  it('should build multiple rows from visual builder', () => {
    const ctx = createMockCtx({
      buttonLayout: 'multiple_rows',
      buttons: {
        buttonRow: [
          { text: 'Row 1', data: 'r1' },
          { text: 'Row 2', data: 'r2' },
        ],
      },
    });
    const result = buildButtonRows(ctx, 0);
    expect(result).toEqual([
      [{ text: 'Row 1', data: 'r1' }],
      [{ text: 'Row 2', data: 'r2' }],
    ]);
  });

  it('should parse raw JSON flat array into single row', () => {
    const ctx = createMockCtx({
      buttonLayout: 'raw_json',
      rawJsonButtons: JSON.stringify([
        { text: 'A', data: 'a' },
        { text: 'B', data: 'b' },
      ]),
    });
    const result = buildButtonRows(ctx, 0);
    expect(result).toEqual([
      [
        { text: 'A', data: 'a' },
        { text: 'B', data: 'b' },
      ],
    ]);
  });

  it('should parse raw JSON nested array as multiple rows', () => {
    const ctx = createMockCtx({
      buttonLayout: 'raw_json',
      rawJsonButtons: JSON.stringify([
        [{ text: 'Row1-A' }],
        [{ text: 'Row2-A' }, { text: 'Row2-B' }],
      ]),
    });
    const result = buildButtonRows(ctx, 0);
    expect(result).toEqual([
      [{ text: 'Row1-A' }],
      [{ text: 'Row2-A' }, { text: 'Row2-B' }],
    ]);
  });

  it('should return empty array for raw_json with empty array string', () => {
    const ctx = createMockCtx({
      buttonLayout: 'raw_json',
      rawJsonButtons: '[]',
    });
    expect(buildButtonRows(ctx, 0)).toEqual([]);
  });

  it('should throw NodeOperationError for invalid JSON', () => {
    const ctx = createMockCtx({
      buttonLayout: 'raw_json',
      rawJsonButtons: '{not valid json',
    });
    expect(() => buildButtonRows(ctx, 0)).toThrow(NodeOperationError);
    expect(() => buildButtonRows(ctx, 0)).toThrow('The buttons JSON is not valid');
  });

  it('should throw NodeOperationError when JSON is not an array', () => {
    const ctx = createMockCtx({
      buttonLayout: 'raw_json',
      rawJsonButtons: '{"text": "not an array"}',
    });
    expect(() => buildButtonRows(ctx, 0)).toThrow(NodeOperationError);
    expect(() => buildButtonRows(ctx, 0)).toThrow('Buttons JSON must be an array');
  });
});

// ============================================================================
// cleanFileAttachments
// ============================================================================

describe('cleanFileAttachments', () => {
  it('should return empty array when no files', () => {
    const ctx = createMockCtx({ additionalFields: {} });
    expect(cleanFileAttachments(ctx, 0)).toEqual([]);
  });

  it('should return empty array when additionalFields param is missing', () => {
    const ctx = createMockCtx({});
    expect(cleanFileAttachments(ctx, 0)).toEqual([]);
  });

  it('should handle files as a plain array', () => {
    const ctx = createMockCtx({
      additionalFields: {
        files: [
          { key: 'uploads/test.pdf', name: 'test.pdf', fileType: 'file' },
        ],
      },
    });
    const result = cleanFileAttachments(ctx, 0);
    expect(result).toEqual([
      { key: 'uploads/test.pdf', name: 'test.pdf', file_type: 'file' },
    ]);
  });

  it('should handle files as fixedCollection format { file: [...] }', () => {
    const ctx = createMockCtx({
      additionalFields: {
        files: {
          file: [
            { key: 'uploads/img.png', name: 'img.png', fileType: 'image' },
          ],
        },
      },
    });
    const result = cleanFileAttachments(ctx, 0);
    expect(result).toEqual([
      { key: 'uploads/img.png', name: 'img.png', file_type: 'image' },
    ]);
  });

  it('should strip empty string, null, and undefined fields', () => {
    const ctx = createMockCtx({
      additionalFields: {
        files: [
          { key: 'uploads/a.txt', name: '', description: null, extra: undefined, fileType: 'file' },
        ],
      },
    });
    const result = cleanFileAttachments(ctx, 0);
    expect(result).toEqual([
      { key: 'uploads/a.txt', file_type: 'file' },
    ]);
  });

  it('should strip zero-value height and width', () => {
    const ctx = createMockCtx({
      additionalFields: {
        files: [
          { key: 'uploads/img.png', height: 0, width: '', fileType: 'image' },
        ],
      },
    });
    const result = cleanFileAttachments(ctx, 0);
    expect(result).toEqual([
      { key: 'uploads/img.png', file_type: 'image' },
    ]);
  });

  it('should keep non-zero height and width', () => {
    const ctx = createMockCtx({
      additionalFields: {
        files: [
          { key: 'uploads/img.png', height: 100, width: 200, fileType: 'image' },
        ],
      },
    });
    const result = cleanFileAttachments(ctx, 0);
    expect(result).toEqual([
      { key: 'uploads/img.png', height: 100, width: 200, file_type: 'image' },
    ]);
  });

  it('should map fileType to file_type', () => {
    const ctx = createMockCtx({
      additionalFields: {
        files: [{ key: 'k', fileType: 'image' }],
      },
    });
    const result = cleanFileAttachments(ctx, 0);
    expect(result[0]).toHaveProperty('file_type', 'image');
    expect(result[0]).not.toHaveProperty('fileType');
  });
});

// ============================================================================
// resolveFormBlocksFromParams
// ============================================================================

describe('resolveFormBlocksFromParams', () => {
  describe('json mode', () => {
    it('should parse a valid JSON array of blocks', () => {
      const blocks = [
        { type: 'header', text: 'Title' },
        { type: 'input', name: 'field1', label: 'Field 1' },
      ];
      const ctx = createMockCtx({
        formBuilderMode: 'json',
        formBlocks: JSON.stringify(blocks),
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual(blocks);
    });

    it('should unwrap { blocks: [...] } object', () => {
      const blocks = [{ type: 'header', text: 'Hello' }];
      const ctx = createMockCtx({
        formBuilderMode: 'json',
        formBlocks: JSON.stringify({ blocks }),
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual(blocks);
    });

    it('should throw NodeOperationError for invalid JSON', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'json',
        formBlocks: '{not valid',
      });
      expect(() => resolveFormBlocksFromParams(ctx, 0)).toThrow(NodeOperationError);
      expect(() => resolveFormBlocksFromParams(ctx, 0)).toThrow('The JSON is not valid');
    });

    it('should throw for JSON that is neither array nor object with blocks', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'json',
        formBlocks: JSON.stringify({ foo: 'bar' }),
      });
      expect(() => resolveFormBlocksFromParams(ctx, 0)).toThrow(NodeOperationError);
      expect(() => resolveFormBlocksFromParams(ctx, 0)).toThrow('Expected a JSON array of blocks');
    });

    it('should return empty array for empty formBlocks', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'json',
        formBlocks: '',
      });
      expect(resolveFormBlocksFromParams(ctx, 0)).toEqual([]);
    });
  });


  describe('builder mode', () => {
    it('should build header block', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [{ type: 'header', text: 'My Form' }],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([{ type: 'header', text: 'My Form' }]);
    });

    it('should build divider block (no extra fields)', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [{ type: 'divider' }],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([{ type: 'divider' }]);
    });

    it('should build input block with all properties', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [
            {
              type: 'input',
              name: 'comment',
              label: 'Comment',
              required: true,
              hint: 'Enter text',
              placeholder: 'Type here...',
              multiline: true,
              initial_value: 'default',
              min_length: 5,
              max_length: 500,
            },
          ],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([
        {
          type: 'input',
          name: 'comment',
          label: 'Comment',
          required: true,
          hint: 'Enter text',
          placeholder: 'Type here...',
          multiline: true,
          initial_value: 'default',
          min_length: 5,
          max_length: 500,
        },
      ]);
    });

    it('should build select block with options', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [
            {
              type: 'select',
              name: 'choice',
              label: 'Pick one',
              options: {
                option: [
                  { text: 'Option A', value: 'a', selected: true },
                  { text: 'Option B', value: 'b' },
                ],
              },
            },
          ],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([
        {
          type: 'select',
          name: 'choice',
          label: 'Pick one',
          options: [
            { text: 'Option A', value: 'a', selected: true },
            { text: 'Option B', value: 'b' },
          ],
        },
      ]);
    });

    it('should build date block with initial_date', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [
            { type: 'date', name: 'start_date', label: 'Start', initial_date: '2026-01-01' },
          ],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([
        { type: 'date', name: 'start_date', label: 'Start', initial_date: '2026-01-01' },
      ]);
    });

    it('should build file_input block with filetypes and max_files', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [
            { type: 'file_input', name: 'docs', label: 'Docs', filetypes: 'png, jpg, pdf', max_files: 3 },
          ],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([
        {
          type: 'file_input',
          name: 'docs',
          label: 'Docs',
          filetypes: ['png', 'jpg', 'pdf'],
          max_files: 3,
        },
      ]);
    });

    it('should return empty array when no blocks in builder', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: { block: [] },
      });
      expect(resolveFormBlocksFromParams(ctx, 0)).toEqual([]);
    });

    it('should skip empty hint and placeholder in input blocks', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [
            { type: 'input', name: 'field', label: 'Field', hint: '  ', placeholder: '  ' },
          ],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([{ type: 'input', name: 'field', label: 'Field' }]);
    });

    it('should build radio block with checked options', () => {
      const ctx = createMockCtx({
        formBuilderMode: 'builder',
        formBlocks: {
          block: [
            {
              type: 'radio',
              name: 'priority',
              label: 'Priority',
              options: {
                option: [
                  { text: 'High', value: 'high', checked: true },
                  { text: 'Low', value: 'low' },
                ],
              },
            },
          ],
        },
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result[0]!.options).toEqual([
        { text: 'High', value: 'high', checked: true },
        { text: 'Low', value: 'low' },
      ]);
    });
  });

  describe('default mode fallback', () => {
    it('should default to json mode when formBuilderMode param is missing', () => {
      const ctx = createMockCtx({
        formBlocks: JSON.stringify([{ type: 'header', text: 'Default' }]),
      });
      const result = resolveFormBlocksFromParams(ctx, 0);
      expect(result).toEqual([{ type: 'header', text: 'Default' }]);
    });
  });
});

// ============================================================================
// splitAndValidateCommaList
// ============================================================================

describe('splitAndValidateCommaList', () => {
  it('should split and convert valid integers', () => {
    const ctx = createMockCtx({});
    const result = splitAndValidateCommaList(ctx, '1, 2, 3', 'Member IDs', 'int', 0);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should split valid strings', () => {
    const ctx = createMockCtx({});
    const result = splitAndValidateCommaList(ctx, 'alpha, beta, gamma', 'Tags', 'string', 0);
    expect(result).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('should filter out empty segments', () => {
    const ctx = createMockCtx({});
    const result = splitAndValidateCommaList(ctx, '1,,2, ,3', 'IDs', 'int', 0);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should filter out empty segments for strings', () => {
    const ctx = createMockCtx({});
    const result = splitAndValidateCommaList(ctx, 'a,,b, ,c', 'Names', 'string', 0);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should throw NodeOperationError for invalid int values', () => {
    const ctx = createMockCtx({});
    expect(() =>
      splitAndValidateCommaList(ctx, '1, abc, 3', 'Member IDs', 'int', 0),
    ).toThrow(NodeOperationError);
    expect(() =>
      splitAndValidateCommaList(ctx, '1, abc, 3', 'Member IDs', 'int', 0),
    ).toThrow('Member IDs must be numbers. Invalid values: abc');
  });

  it('should handle single value', () => {
    const ctx = createMockCtx({});
    expect(splitAndValidateCommaList(ctx, '42', 'ID', 'int', 0)).toEqual([42]);
    expect(splitAndValidateCommaList(ctx, 'hello', 'Tag', 'string', 0)).toEqual(['hello']);
  });

  it('should handle whitespace-heavy input', () => {
    const ctx = createMockCtx({});
    const result = splitAndValidateCommaList(ctx, '  10 , 20 , 30  ', 'IDs', 'int', 0);
    expect(result).toEqual([10, 20, 30]);
  });
});

// ============================================================================
// BUG 4: S3 upload retry must rebuild multipart body with fresh presigned params
// ============================================================================

describe('uploadFileToS3 retry rebuilds multipart body', () => {
  it('uses fresh presigned params on retry', async () => {
    const presigned1 = {
      'Content-Disposition': 'inline',
      acl: 'public-read',
      policy: 'policy-1',
      'x-amz-credential': 'cred-1',
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-date': '20260101T000000Z',
      'x-amz-signature': 'sig-1',
      key: 'uploads/${filename}',
      direct_url: 'https://s3.example.com/bucket-1',
    };
    const presigned2 = {
      ...presigned1,
      policy: 'policy-2',
      'x-amz-signature': 'sig-2',
      direct_url: 'https://s3.example.com/bucket-2',
    };

    let apiCallCount = 0;
    let s3CallCount = 0;
    const s3Bodies: Buffer[] = [];

    const mockCtx = {
      getNodeParameter: vi.fn((name: string) => {
        if (name === 'fileSource') return 'url';
        if (name === 'fileName') return 'test.txt';
        if (name === 'contentType') return 'text/plain';
        if (name === 'fileUrl') return 'https://example.com/test.txt';
        return '';
      }),
      getNode: vi.fn(() => MOCK_NODE),
      getCredentials: vi.fn(async () => ({
        baseUrl: 'https://api.pachca.com/api/shared/v1',
        accessToken: 'test-token',
      })),
      helpers: {
        httpRequestWithAuthentication: vi.fn(async () => {
          apiCallCount++;
          return {
            statusCode: 200,
            body: apiCallCount === 1 ? presigned1 : presigned2,
          };
        }),
        httpRequest: vi.fn(async (opts: { method?: string; url?: string; body?: Buffer }) => {
          if (opts.method === 'GET') {
            // File download
            return Buffer.from('file-content');
          }
          // S3 POST upload
          s3CallCount++;
          s3Bodies.push(opts.body as Buffer);
          if (s3CallCount === 1) {
            throw new Error('S3 temporary failure');
          }
          return {};
        }),
      },
    } as unknown as IExecuteFunctions;

    const result = await uploadFileToS3(mockCtx, 0);

    // Should have called /uploads twice (initial + retry)
    expect(apiCallCount).toBe(2);
    // Should have attempted S3 upload twice
    expect(s3CallCount).toBe(2);
    // Second S3 upload body must contain fresh signature
    const body2 = s3Bodies[1].toString();
    expect(body2).toContain('sig-2');
    expect(body2).toContain('policy-2');
    expect(body2).not.toContain('sig-1');
    expect(body2).not.toContain('policy-1');
    // Result should have the correct key
    expect(result.key).toBe('uploads/test.txt');
  });
});
