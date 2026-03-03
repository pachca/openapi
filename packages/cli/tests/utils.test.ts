import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isInteractive, useColor, defaultOutputFormat, formatSize, levenshtein } from '../src/utils.js';

describe('utils', () => {
  const savedEnv: Record<string, string | undefined> = {};

  function setEnv(key: string, value: string | undefined) {
    if (!(key in savedEnv)) savedEnv[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    for (const key of Object.keys(savedEnv)) delete savedEnv[key];
  });

  describe('isInteractive()', () => {
    it('should return true when TTY and no CI/PACHCA_PROMPT_DISABLED', () => {
      Object.defineProperty(process.stdin, 'isTTY', { value: true, writable: true, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      setEnv('CI', undefined);
      setEnv('PACHCA_PROMPT_DISABLED', undefined);
      expect(isInteractive()).toBe(true);
    });

    it('should return false when stdin is not TTY', () => {
      Object.defineProperty(process.stdin, 'isTTY', { value: undefined, writable: true, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      expect(isInteractive()).toBe(false);
    });

    it('should return false when stdout is not TTY', () => {
      Object.defineProperty(process.stdin, 'isTTY', { value: true, writable: true, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: undefined, writable: true, configurable: true });
      expect(isInteractive()).toBe(false);
    });

    it('should return false when CI=true', () => {
      Object.defineProperty(process.stdin, 'isTTY', { value: true, writable: true, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      setEnv('CI', 'true');
      expect(isInteractive()).toBe(false);
    });

    it('should return false when PACHCA_PROMPT_DISABLED', () => {
      Object.defineProperty(process.stdin, 'isTTY', { value: true, writable: true, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      setEnv('PACHCA_PROMPT_DISABLED', '1');
      expect(isInteractive()).toBe(false);
    });
  });

  describe('useColor()', () => {
    it('should return true with TTY (default)', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      setEnv('FORCE_COLOR', undefined);
      setEnv('NO_COLOR', undefined);
      setEnv('TERM', undefined);
      expect(useColor()).toBe(true);
    });

    it('should return true when FORCE_COLOR is set', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: undefined, writable: true, configurable: true });
      setEnv('FORCE_COLOR', '1');
      expect(useColor()).toBe(true);
    });

    it('should return false when NO_COLOR is set', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      setEnv('NO_COLOR', '1');
      setEnv('FORCE_COLOR', undefined);
      expect(useColor()).toBe(false);
    });

    it('should return false when TERM=dumb', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      setEnv('TERM', 'dumb');
      setEnv('FORCE_COLOR', undefined);
      setEnv('NO_COLOR', undefined);
      expect(useColor()).toBe(false);
    });
  });

  describe('defaultOutputFormat()', () => {
    it('should return "table" when TTY', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      expect(defaultOutputFormat()).toBe('table');
    });

    it('should return "json" when not TTY', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: undefined, writable: true, configurable: true });
      expect(defaultOutputFormat()).toBe('json');
    });
  });

  describe('formatSize()', () => {
    it('should format 0 bytes', () => {
      expect(formatSize(0)).toBe('0 B');
    });

    it('should format bytes under 1 KB', () => {
      expect(formatSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(1024)).toBe('1.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('levenshtein()', () => {
    it('should return 0 for equal strings', () => {
      expect(levenshtein('hello', 'hello')).toBe(0);
    });

    it('should return 1 for one character difference', () => {
      expect(levenshtein('hello', 'hallo')).toBe(1);
    });

    it('should return length for empty vs non-empty', () => {
      expect(levenshtein('', 'abc')).toBe(3);
      expect(levenshtein('abc', '')).toBe(3);
    });

    it('should handle multi-character differences', () => {
      expect(levenshtein('kitten', 'sitting')).toBe(3);
    });
  });
});
