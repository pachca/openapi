import { describe, it, expect } from 'vitest';
import {
  verifyWebhookSignature,
  detectMimeType,
  buildMultipartBody,
} from '../nodes/Pachca/GenericFunctions';
import * as crypto from 'crypto';

// ============================================================================
// verifyWebhookSignature
// ============================================================================

describe('verifyWebhookSignature', () => {
  const secret = 'test-secret-key';

  function sign(body: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  it('should accept a valid signature', () => {
    const body = '{"event":"new_message"}';
    const signature = sign(body);
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it('should reject an invalid signature', () => {
    const body = '{"event":"new_message"}';
    expect(verifyWebhookSignature(body, 'bad-signature', secret)).toBe(false);
  });

  it('should reject a signature from a different secret', () => {
    const body = '{"event":"new_message"}';
    const wrongSig = crypto
      .createHmac('sha256', 'wrong-secret')
      .update(body)
      .digest('hex');
    expect(verifyWebhookSignature(body, wrongSig, secret)).toBe(false);
  });

  it('should reject when body is tampered', () => {
    const body = '{"event":"new_message"}';
    const signature = sign(body);
    expect(
      verifyWebhookSignature(body + 'x', signature, secret),
    ).toBe(false);
  });

  it('should reject empty signature', () => {
    expect(verifyWebhookSignature('{}', '', secret)).toBe(false);
  });

  it('should handle empty body', () => {
    const signature = sign('');
    expect(verifyWebhookSignature('', signature, secret)).toBe(true);
  });
});

// ============================================================================
// detectMimeType
// ============================================================================

describe('detectMimeType', () => {
  it('should detect common image types', () => {
    expect(detectMimeType('photo.jpg')).toBe('image/jpeg');
    expect(detectMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(detectMimeType('image.png')).toBe('image/png');
    expect(detectMimeType('anim.gif')).toBe('image/gif');
    expect(detectMimeType('pic.webp')).toBe('image/webp');
  });

  it('should detect document types', () => {
    expect(detectMimeType('doc.pdf')).toBe('application/pdf');
    expect(detectMimeType('report.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(detectMimeType('data.xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('should detect text types', () => {
    expect(detectMimeType('readme.txt')).toBe('text/plain');
    expect(detectMimeType('data.csv')).toBe('text/csv');
    expect(detectMimeType('config.json')).toBe('application/json');
  });

  it('should return octet-stream for unknown extensions', () => {
    expect(detectMimeType('file.xyz')).toBe('application/octet-stream');
    expect(detectMimeType('noext')).toBe('application/octet-stream');
  });

  it('should be case-insensitive', () => {
    expect(detectMimeType('PHOTO.JPG')).toBe('image/jpeg');
    expect(detectMimeType('DOC.PDF')).toBe('application/pdf');
  });
});

// ============================================================================
// buildMultipartBody
// ============================================================================

describe('buildMultipartBody', () => {
  it('should produce valid multipart structure', () => {
    const fields = { acl: 'public-read', policy: 'encoded-policy' };
    const fileBuffer = Buffer.from('file-content');
    const result = buildMultipartBody(
      fields,
      fileBuffer,
      'test.txt',
      'text/plain',
    );

    expect(result.contentType).toMatch(/^multipart\/form-data; boundary=/);
    const bodyStr = result.body.toString();
    expect(bodyStr).toContain('name="acl"');
    expect(bodyStr).toContain('public-read');
    expect(bodyStr).toContain('name="policy"');
    expect(bodyStr).toContain('encoded-policy');
    expect(bodyStr).toContain('name="file"');
    expect(bodyStr).toContain('filename="test.txt"');
    expect(bodyStr).toContain('Content-Type: text/plain');
    expect(bodyStr).toContain('file-content');
  });

  it('should place file last in the body', () => {
    const fields = { key: 'uploads/file.txt' };
    const result = buildMultipartBody(
      fields,
      Buffer.from('data'),
      'file.txt',
      'text/plain',
    );
    const bodyStr = result.body.toString();
    const keyPos = bodyStr.indexOf('name="key"');
    const filePos = bodyStr.indexOf('name="file"');
    expect(keyPos).toBeLessThan(filePos);
  });
});

// Functions wrapBodyInKey, splitCommaToArray, nestBotWebhook, handlePachcaError,
// getCursorPaginator, transformButtons, resolveFormBlocks were removed from
// GenericFunctions.ts in the execute() migration and are no longer tested here.
