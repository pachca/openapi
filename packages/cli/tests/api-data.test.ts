import { describe, it, expect, beforeEach } from 'vitest';
import { runCommand } from '@oclif/test';
import * as path from 'node:path';
import { parseQueryFlags } from '../src/commands/api.js';

const CLI_ROOT = path.join(__dirname, '..');

describe('pachca api --query', () => {
  beforeEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true, configurable: true });
  });

  it('collects a repeated key into a list, in order', () => {
    expect(parseQueryFlags(['company_roles[]=admin', 'chat_id=1', 'company_roles[]=user', 'company_roles[]=guest']))
      .toEqual({ 'company_roles[]': ['admin', 'user', 'guest'], chat_id: '1' });
  });

  it('keeps a single key a plain value and `=` inside the value', () => {
    expect(parseQueryFlags(['query=a=b'])).toEqual({ query: 'a=b' });
    expect(parseQueryFlags(undefined)).toEqual({});
  });

  it('treats a key named like an Object method as an ordinary key', () => {
    const query = parseQueryFlags(['constructor=a', 'toString=b', 'toString=c']);
    expect(query.constructor).toBe('a');
    expect(query.toString).toEqual(['b', 'c']);
  });

  it('sends every value of a repeated key (dry-run)', async () => {
    const { stdout } = await runCommand(
      [
        'api', 'GET', '/search/users',
        '--query', 'company_roles[]=admin',
        '--query', 'company_roles[]=user',
        '--query', 'limit=5',
        '--dry-run', '--token', 'X',
      ],
      { root: CLI_ROOT },
    );
    const url = new URL((JSON.parse(stdout) as { url: string }).url);
    expect(url.searchParams.getAll('company_roles[]')).toEqual(['admin', 'user']);
    expect(url.searchParams.getAll('limit')).toEqual(['5']);
  });
});

describe('C6 — pachca api --data (inline JSON body)', () => {
  beforeEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true, configurable: true });
  });

  it('parses --data into the request body (dry-run)', async () => {
    const { stdout } = await runCommand(
      [
        'api', 'POST', '/messages',
        '--data', '{"message":{"entity_id":1,"content":"hi"}}',
        '--dry-run', '--token', 'X',
      ],
      { root: CLI_ROOT },
    );
    const out = JSON.parse(stdout) as { dry_run: boolean; body: { message: { content: string } } };
    expect(out.dry_run).toBe(true);
    expect(out.body.message.content).toBe('hi');
  });

  it('is mutually exclusive with -f/-F', async () => {
    const { stderr, error } = await runCommand(
      ['api', 'POST', '/messages', '--data', '{}', '-f', 'a=b', '--dry-run', '--token', 'X'],
      { root: CLI_ROOT },
    );
    expect(error?.oclif?.exit).toBe(2);
    expect(stderr).toContain('--data is mutually exclusive');
  });

  it('is mutually exclusive with --input', async () => {
    const { error } = await runCommand(
      ['api', 'POST', '/messages', '--data', '{}', '--input', 'x.json', '--dry-run', '--token', 'X'],
      { root: CLI_ROOT },
    );
    expect(error?.oclif?.exit).toBe(2);
  });

  it('rejects invalid JSON with exit 2', async () => {
    const { stderr, error } = await runCommand(
      ['api', 'POST', '/messages', '--data', 'not-json', '--dry-run', '--token', 'X'],
      { root: CLI_ROOT },
    );
    expect(error?.oclif?.exit).toBe(2);
    expect(stderr).toContain('Invalid JSON in --data');
  });
});
