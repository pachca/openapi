import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputData } from '../src/output.js';

describe('C7 — --plain output mode', () => {
  let stdoutWrite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stdoutWrite = vi.fn();
    vi.spyOn(process.stdout, 'write').mockImplementation(stdoutWrite);
  });

  const lines = () => stdoutWrite.mock.calls.map((c: unknown[]) => c[0] as string);

  it('outputs TSV with no header', () => {
    outputData([{ id: 1, name: 'Alice' }], { format: 'table', plain: true });
    expect(lines()).toEqual(['1\tAlice\n']);
  });

  it('puts the id column first when no --columns given', () => {
    outputData([{ name: 'Bob', id: 7, role: 'admin' }], { format: 'table', plain: true });
    expect(lines()).toEqual(['7\tBob\tadmin\n']);
  });

  it('respects explicit --columns order (no id reordering)', () => {
    outputData([{ id: 1, name: 'Alice', email: 'a@x.io' }], {
      format: 'table',
      plain: true,
      columns: ['name', 'email'],
    });
    expect(lines()).toEqual(['Alice\ta@x.io\n']);
  });

  it('collapses tabs/newlines in values to keep one record per line', () => {
    outputData([{ id: 1, note: 'line1\nline2\twords' }], { format: 'table', plain: true });
    expect(lines()).toEqual(['1\tline1 line2 words\n']);
  });

  it('serializes objects/arrays and blanks null', () => {
    outputData([{ id: 1, meta: { a: 1 }, tags: ['x'], gone: null }], {
      format: 'table',
      plain: true,
    });
    expect(lines()).toEqual(['1\t{"a":1}\t["x"]\t\n']);
  });

  it('plain takes precedence and is silent when quiet', () => {
    outputData([{ id: 1 }], { format: 'json', plain: true, quiet: true });
    expect(stdoutWrite).not.toHaveBeenCalled();
  });

  it('does not affect normal csv/json output when plain is absent', () => {
    outputData([{ id: 1, name: 'A' }], { format: 'csv' });
    expect(lines()[0]).toBe('id,name\n');
  });
});
