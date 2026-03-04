import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { outputData, outputError, outputSuccess, type OutputFormat, type OutputOptions } from '../src/output.js';

describe('output', () => {
  let stdoutWrite: ReturnType<typeof vi.fn>;
  let stderrWrite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stdoutWrite = vi.fn();
    stderrWrite = vi.fn();
    vi.spyOn(process.stdout, 'write').mockImplementation(stdoutWrite);
    vi.spyOn(process.stderr, 'write').mockImplementation(stderrWrite);
  });

  describe('json', () => {
    it('should output JSON with pretty formatting', () => {
      const data = [{ id: 1, name: 'Test' }];
      outputData(data, { format: 'json', quiet: false });
      expect(stdoutWrite).toHaveBeenCalledWith(
        JSON.stringify(data, null, 2) + '\n',
      );
    });

    it('should output single object as JSON', () => {
      const data = { id: 1, name: 'Test' };
      outputData(data, { format: 'json', quiet: false });
      expect(stdoutWrite).toHaveBeenCalledWith(
        JSON.stringify(data, null, 2) + '\n',
      );
    });
  });

  describe('yaml', () => {
    it('should output YAML', () => {
      const data = [{ id: 1, name: 'Test' }];
      outputData(data, { format: 'yaml', quiet: false });
      const output = stdoutWrite.mock.calls[0][0] as string;
      expect(output).toContain('id: 1');
      expect(output).toContain('name: Test');
    });
  });

  describe('csv', () => {
    it('should output CSV with header', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      outputData(data, { format: 'csv', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[0]).toBe('id,name\n');
      expect(calls[1]).toBe('1,Alice\n');
      expect(calls[2]).toBe('2,Bob\n');
    });

    it('should output CSV without header when noHeader=true', () => {
      const data = [{ id: 1, name: 'Alice' }];
      outputData(data, { format: 'csv', noHeader: true, quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[0]).toBe('1,Alice\n');
    });

    it('should output CSV with selected columns', () => {
      const data = [{ id: 1, name: 'Alice', email: 'alice@test.com' }];
      outputData(data, { format: 'csv', columns: ['name', 'email'], quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[0]).toBe('name,email\n');
      expect(calls[1]).toBe('Alice,alice@test.com\n');
    });

    it('should escape CSV values with commas', () => {
      const data = [{ name: 'Last, First' }];
      outputData(data, { format: 'csv', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[1]).toBe('"Last, First"\n');
    });

    it('should escape CSV values with quotes', () => {
      const data = [{ name: 'She said "hello"' }];
      outputData(data, { format: 'csv', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[1]).toBe('"She said ""hello"""\n');
    });

    it('should handle null values as empty string', () => {
      const data = [{ id: 1, name: null }];
      outputData(data, { format: 'csv', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[1]).toBe('1,\n');
    });

    it('should escape CSV values with newlines', () => {
      const data = [{ desc: 'Line 1\nLine 2' }];
      outputData(data, { format: 'csv', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls[1]).toBe('"Line 1\nLine 2"\n');
    });
  });

  describe('table', () => {
    it('should output table with header and rows', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      outputData(data, { format: 'table', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      // First call is the header
      expect(calls[0]).toMatch(/ID/);
      expect(calls[0]).toMatch(/NAME/);
      // Data rows
      expect(calls[1]).toContain('1');
      expect(calls[1]).toContain('Alice');
      expect(calls[2]).toContain('2');
      expect(calls[2]).toContain('Bob');
    });

    it('should output table with selected columns', () => {
      const data = [{ id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' }];
      outputData(data, { format: 'table', columns: ['name', 'role'], quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      expect(calls[0]).toMatch(/NAME/);
      expect(calls[0]).toMatch(/ROLE/);
      expect(calls[0]).not.toMatch(/ID/);
      expect(calls[0]).not.toMatch(/EMAIL/);
      expect(calls[1]).toContain('Alice');
      expect(calls[1]).toContain('admin');
    });

    it('should output table without header when noHeader=true', () => {
      const data = [{ id: 1, name: 'Alice' }];
      outputData(data, { format: 'table', noHeader: true, quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      // Should have only 1 call (data row, no header)
      expect(calls).toHaveLength(1);
      expect(calls[0]).toContain('1');
      expect(calls[0]).toContain('Alice');
    });

    it('should output table without truncation when noTruncate=true', () => {
      const longName = 'A'.repeat(200);
      const data = [{ id: 1, name: longName }];
      outputData(data, { format: 'table', noTruncate: true, quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      // Data row should contain the full long name
      expect(calls[1]).toContain(longName);
    });

    it('should show "No results found" for empty array', () => {
      outputData([], { format: 'table', quiet: false });
      const calls = stderrWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      expect(calls[0]).toContain('No results found');
    });

    it('should format boolean values', () => {
      const data = [{ id: 1, active: true, deleted: false }];
      outputData(data, { format: 'table', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      expect(calls[1]).toContain('true');
      expect(calls[1]).toContain('false');
    });

    it('should format arrays as "[N items]"', () => {
      const data = [{ id: 1, scopes: ['a', 'b', 'c'] }];
      outputData(data, { format: 'table', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      expect(calls[1]).toContain('[3 items]');
    });

    it('should format empty arrays as "[]"', () => {
      const data = [{ id: 1, scopes: [] as unknown[] }];
      outputData(data, { format: 'table', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      expect(calls[1]).toContain('[]');
    });

    it('should handle single object (non-array) as table', () => {
      const data = { id: 1, name: 'Test' };
      outputData(data, { format: 'table', quiet: false });
      const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      // Header + 1 row
      expect(calls).toHaveLength(2);
      expect(calls[0]).toMatch(/ID/);
      expect(calls[1]).toContain('1');
    });
  });

  describe('quiet', () => {
    it('should suppress output when quiet=true for json', () => {
      outputData([{ id: 1 }], { format: 'json', quiet: true });
      expect(stdoutWrite).not.toHaveBeenCalled();
    });

    it('should suppress output when quiet=true for table', () => {
      outputData([{ id: 1 }], { format: 'table', quiet: true });
      expect(stdoutWrite).not.toHaveBeenCalled();
    });
  });

  describe('outputError', () => {
    it('should output JSON error when format is json', () => {
      outputError({ error: 'Not found', code: 404, type: 'PACHCA_API_ERROR', request_id: 'req_123' }, 'json');
      const output = stderrWrite.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.error).toBe('Not found');
      expect(parsed.code).toBe(404);
      expect(parsed.request_id).toBe('req_123');
    });

    it('should output human-readable error in TTY mode', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      outputError({ error: 'Not found', code: 404, type: 'PACHCA_API_ERROR' }, 'table');
      const output = stderrWrite.mock.calls[0][0] as string;
      expect(output).toContain('404');
      expect(output).toContain('Not found');
    });

    it('should include request_id in human-readable error', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      outputError({ error: 'Server error', code: 500, request_id: 'req_abc' }, 'table');
      const calls = stderrWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      const combined = calls.join('');
      expect(combined).toContain('req_abc');
    });

    it('should include hint in human-readable error', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      outputError({ error: 'Unauthorized', code: 401, hint: 'pachca auth login' }, 'table');
      const calls = stderrWrite.mock.calls.map((c: unknown[]) => c[0]) as string[];
      const combined = calls.join('');
      expect(combined).toContain('pachca auth login');
    });

    it('should output JSON for non-TTY regardless of format', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: false, writable: true, configurable: true });
      outputError({ error: 'Test', code: null, type: 'PACHCA_API_ERROR' }, 'table');
      const output = stderrWrite.mock.calls[0][0] as string;
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should not show "null" when error code is null in TTY', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      outputError({ error: 'Network error', code: null, type: 'PACHCA_NETWORK_ERROR' }, 'table');
      const combined = stderrWrite.mock.calls.map((c: unknown[]) => c[0]).join('');
      expect(combined).not.toContain('null');
      expect(combined).toContain('Network error');
    });
  });

  describe('outputSuccess', () => {
    it('should output success message in TTY', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      outputSuccess('Done');
      const output = stderrWrite.mock.calls[0][0] as string;
      expect(output).toContain('Done');
    });

    it('should suppress success message when quiet=true', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      outputSuccess('Done', true);
      expect(stderrWrite).not.toHaveBeenCalled();
    });

    it('should output plain success message in non-TTY', () => {
      Object.defineProperty(process.stderr, 'isTTY', { value: false, writable: true, configurable: true });
      outputSuccess('Done');
      expect(stderrWrite).toHaveBeenCalledWith('Done\n');
    });
  });
});
