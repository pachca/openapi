import { describe, it, expect, beforeEach } from 'vitest';
import { runCommand } from '@oclif/test';
import * as path from 'node:path';

const CLI_ROOT = path.join(__dirname, '..');

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
