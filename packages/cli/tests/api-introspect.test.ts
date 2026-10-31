import { describe, it, expect } from 'vitest';
import { runCommand } from '@oclif/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type EndpointIndexEntry,
  buildListRows,
  detectIntrospectMode,
  positionals,
  findEndpoint,
  renderIntrospect,
} from '../src/api-introspect.js';

const CLI_ROOT = path.join(__dirname, '..');

const FIXTURE: EndpointIndexEntry[] = [
  {
    method: 'POST', path: '/messages', summary: 'Новое сообщение',
    scope: 'messages:create', plan: null, auth: true, paginated: false,
    command: 'pachca messages create', docLink: 'https://dev.pachca.com/api/messages/create',
    describe: '# POST /messages — Новое сообщение', spec: { method: 'POST', path: '/messages' },
    docs: '# Новое сообщение\n\n**Метод**: `POST`',
  },
  {
    method: 'GET', path: '/messages', summary: 'Список сообщений',
    scope: null, plan: null, auth: true, paginated: true,
    command: 'pachca messages list', docLink: 'https://dev.pachca.com/api/messages/list',
    describe: '# GET /messages', spec: { method: 'GET', path: '/messages' },
    docs: '# Список сообщений',
  },
];

describe('api-introspect pure helpers', () => {
  it('detectIntrospectMode picks the mode from raw argv', () => {
    expect(detectIntrospectMode(['POST', '/messages', '--describe'])).toBe('describe');
    expect(detectIntrospectMode(['GET', '/messages', '--spec'])).toBe('spec');
    expect(detectIntrospectMode(['POST', '/messages', '--docs'])).toBe('docs');
    expect(detectIntrospectMode(['POST', '/messages', '-f', 'a=b'])).toBeNull();
  });

  it('positionals strips flag tokens', () => {
    expect(positionals(['POST', '/messages', '--describe', '-o', 'json'])).toEqual([
      'POST',
      '/messages',
    ]);
  });

  it('findEndpoint matches by method+path, case-insensitive, trailing slash tolerant', () => {
    expect(findEndpoint(FIXTURE, 'post', '/messages')?.summary).toBe('Новое сообщение');
    expect(findEndpoint(FIXTURE, 'GET', '/messages/')?.summary).toBe('Список сообщений');
    expect(findEndpoint(FIXTURE, 'DELETE', '/messages')).toBeUndefined();
  });

  it('buildListRows projects the ls columns', () => {
    expect(buildListRows(FIXTURE)).toEqual([
      { method: 'POST', path: '/messages', summary: 'Новое сообщение', scope: 'messages:create' },
      { method: 'GET', path: '/messages', summary: 'Список сообщений', scope: '' },
    ]);
  });

  it('renderIntrospect returns the right slice per mode', () => {
    expect(renderIntrospect(FIXTURE[0], 'spec')).toBe(
      JSON.stringify({ method: 'POST', path: '/messages' }, null, 2),
    );
    expect(renderIntrospect(FIXTURE[0], 'docs')).toContain('**Метод**: `POST`');
    expect(renderIntrospect(FIXTURE[0], 'describe')).toContain('POST /messages');
  });
});

describe('generated endpoints.json', () => {
  const file = path.join(CLI_ROOT, 'src', 'data', 'endpoints.json');

  it('exists and is a non-empty array of well-formed entries', () => {
    expect(fs.existsSync(file)).toBe(true);
    const entries = JSON.parse(fs.readFileSync(file, 'utf-8')) as EndpointIndexEntry[];
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(50);
    const post = entries.find((e) => e.method === 'POST' && e.path === '/messages');
    expect(post).toBeDefined();
    expect(post!.scope).toBeTruthy();
    expect(post!.command).toMatch(/^pachca /);
    expect(post!.docs).toContain('**Метод**');
    expect(post!.describe).toContain('Эквивалентная команда');
  });

  // Per-field examples mix options that never go together in one request (a
  // bot-only display_name, a voice waveform on a picture), so a command built from
  // them failed when pasted. A hand-written request example is used as a whole:
  // the first of `examples`, else `example`.
  it('equivalent command sends the hand-written request example', () => {
    const entries = JSON.parse(fs.readFileSync(file, 'utf-8')) as EndpointIndexEntry[];
    const kebab = (name: string) => name.replace(/_/g, '-');
    let checked = 0;

    for (const entry of entries) {
      const spec = entry.spec as {
        requestBody?: { content?: Record<string, { example?: unknown; examples?: Record<string, { value?: unknown }> }> };
      };
      const media = spec.requestBody?.content?.['application/json'];
      const value = media?.examples ? Object.values(media.examples)[0]?.value : media?.example;
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;

      // The example's own keys, and those of the wrapper object (`{ message: {...} }`).
      const keys = new Set<string>();
      for (const [key, inner] of Object.entries(value)) {
        keys.add(kebab(key));
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
          for (const innerKey of Object.keys(inner)) keys.add(kebab(innerKey));
        }
      }

      const command = entry.describe.split('## Эквивалентная команда')[1]?.split('```')[1] ?? '';
      const flags = [...command.matchAll(/\s--(?:no-)?([a-z][a-z0-9-]*)/g)]
        .map((match) => match[1])
        .filter((flag) => !['json', 'token'].includes(flag));
      expect(flags.filter((flag) => !keys.has(flag)), `${entry.method} ${entry.path}`).toEqual([]);
      checked++;
    }

    expect(checked).toBeGreaterThan(0);
    const post = entries.find((e) => e.method === 'POST' && e.path === '/messages')!;
    const postCommand = post.describe.split('## Эквивалентная команда')[1];
    expect(postCommand).toContain('--entity-id=');
    expect(postCommand).not.toContain('--display-name');
    expect(postCommand).not.toContain('waveform');
  });
});

describe('pachca api self-documentation (integration)', () => {
  it('api ls --json outputs a JSON array of endpoints', async () => {
    const { stdout } = await runCommand(['api', 'ls', '--json'], { root: CLI_ROOT });
    const rows = JSON.parse(stdout) as { method: string; path: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(50);
    expect(rows.every((r) => r.method && r.path)).toBe(true);
  });

  it('api POST /messages --describe prints the compact reference', async () => {
    const { stdout } = await runCommand(['api', 'POST', '/messages', '--describe'], {
      root: CLI_ROOT,
    });
    expect(stdout).toContain('POST /messages');
    expect(stdout).toContain('Эквивалентная команда');
  });

  it('api GET /messages --spec prints a JSON fragment', async () => {
    const { stdout } = await runCommand(['api', 'GET', '/messages', '--spec'], {
      root: CLI_ROOT,
    });
    const spec = JSON.parse(stdout) as { method: string; path: string };
    expect(spec.method).toBe('GET');
    expect(spec.path).toBe('/messages');
  });

  it('unknown endpoint fails with a non-zero exit', async () => {
    const { error } = await runCommand(['api', 'POST', '/nope', '--describe'], {
      root: CLI_ROOT,
    });
    expect(error).toBeDefined();
    expect(error?.oclif?.exit).toBe(2);
  });
});
