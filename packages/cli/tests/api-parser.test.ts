import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { setBracketNotation, parseTypedValue } from '../src/commands/api.js';

describe('setBracketNotation', () => {
  it('should set simple key', () => {
    const obj: Record<string, unknown> = {};
    setBracketNotation(obj, 'name', 'hello');
    expect(obj).toEqual({ name: 'hello' });
  });

  it('should set nested key with brackets', () => {
    const obj: Record<string, unknown> = {};
    setBracketNotation(obj, 'message[chat_id]', 123);
    expect(obj).toEqual({ message: { chat_id: 123 } });
  });

  it('should set deeply nested key', () => {
    const obj: Record<string, unknown> = {};
    setBracketNotation(obj, 'a[b][c]', 'value');
    expect(obj).toEqual({ a: { b: { c: 'value' } } });
  });

  it('should merge multiple bracket notations', () => {
    const obj: Record<string, unknown> = {};
    setBracketNotation(obj, 'message[chat_id]', 12345);
    setBracketNotation(obj, 'message[content]', 'Привет');
    expect(obj).toEqual({
      message: { chat_id: 12345, content: 'Привет' },
    });
  });

  it('should handle array push with empty brackets', () => {
    const obj: Record<string, unknown> = { items: [] };
    setBracketNotation(obj, 'items[]', 'a');
    setBracketNotation(obj, 'items[]', 'b');
    expect(obj).toEqual({ items: ['a', 'b'] });
  });

  it('should handle numeric array index', () => {
    const obj: Record<string, unknown> = { items: [] };
    setBracketNotation(obj, 'items[0]', 'first');
    setBracketNotation(obj, 'items[1]', 'second');
    expect(obj).toEqual({ items: ['first', 'second'] });
  });

  it('should throw on depth > 5', () => {
    const obj: Record<string, unknown> = {};
    expect(() => {
      setBracketNotation(obj, 'a[b][c][d][e][f]', 'value');
    }).toThrow('Key depth exceeds maximum of 5');
  });

  it('should handle depth exactly 5 without error', () => {
    const obj: Record<string, unknown> = {};
    setBracketNotation(obj, 'a[b][c][d][e]', 'value');
    expect(obj).toEqual({ a: { b: { c: { d: { e: 'value' } } } } });
  });

  it('should overwrite existing value', () => {
    const obj: Record<string, unknown> = {};
    setBracketNotation(obj, 'key', 'old');
    setBracketNotation(obj, 'key', 'new');
    expect(obj).toEqual({ key: 'new' });
  });
});

describe('parseTypedValue', () => {
  it('should parse integer', () => {
    expect(parseTypedValue('123')).toBe(123);
  });

  it('should parse negative integer', () => {
    expect(parseTypedValue('-42')).toBe(-42);
  });

  it('should parse float', () => {
    expect(parseTypedValue('3.14')).toBe(3.14);
  });

  it('should parse negative float', () => {
    expect(parseTypedValue('-1.5')).toBe(-1.5);
  });

  it('should parse "true" as boolean', () => {
    expect(parseTypedValue('true')).toBe(true);
  });

  it('should parse "false" as boolean', () => {
    expect(parseTypedValue('false')).toBe(false);
  });

  it('should parse "null" as null', () => {
    expect(parseTypedValue('null')).toBe(null);
  });

  it('should keep regular strings as strings', () => {
    expect(parseTypedValue('hello')).toBe('hello');
  });

  it('should keep string "true1" as string (not boolean)', () => {
    expect(parseTypedValue('true1')).toBe('true1');
  });

  it('should keep string "123abc" as string (not number)', () => {
    expect(parseTypedValue('123abc')).toBe('123abc');
  });

  it('should read @file content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-test-'));
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'file content');

    try {
      expect(parseTypedValue(`@${filePath}`)).toBe('file content');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should throw on @file when file does not exist', () => {
    expect(() => parseTypedValue('@/nonexistent/path.txt')).toThrow('File not found');
  });

  it('should distinguish -f (string) vs -F (typed) usage', () => {
    // -f always passes raw string, so "123" stays as string
    const merged: Record<string, unknown> = {};
    setBracketNotation(merged, 'message[chat_id]', parseTypedValue('12345')); // -F → number
    setBracketNotation(merged, 'message[content]', 'Привет'); // -f → string stays string

    expect(merged).toEqual({
      message: { chat_id: 12345, content: 'Привет' },
    });
    expect(typeof (merged.message as Record<string, unknown>).chat_id).toBe('number');
    expect(typeof (merged.message as Record<string, unknown>).content).toBe('string');
  });
});
