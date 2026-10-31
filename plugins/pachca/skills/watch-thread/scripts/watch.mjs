#!/usr/bin/env node
// Watches a Pachca thread or chat through the `pachca` CLI and prints each batch of new
// messages from someone else as one Markdown block, oldest first. A program that wakes
// the agent on output (the Monitor tool in Claude Code) turns each block into an event.
// With --once the script exits after the first new messages, for programs that wake the
// agent when a background command finishes.
//
//   node watch.mjs --chat <chat_id> [--after <message_id>] [--interval 30] [--once] [--include-own]
//
// The CLI picks its token as usual: PACHCA_TOKEN, then PACHCA_PROFILE, then the active
// profile. Blocks on stdout:
//   ## New messages in chat <chat_id>
//   ### <author> (user <user_id>[, guest|bot]) · <created_at> · message <id>[, reply to <id>]
//   <pachca_content_…>text as written</pachca_content_…>
//   Files: <name> (file <id>) <url>
//   Link: <url>
// The text of each message sits in a tag with a random suffix, so nothing in it can pass
// for the markup around it. "## More than 50 new messages after <id>" means one check
// could not read them all, and "## Watching stopped" ends the script.
// Everything else goes to stderr and wakes no one. Exit codes: 0 after --once, 1 access
// or repeated errors, 2 bad arguments, 3 sign-in or rights.

import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const PAGE = 50;
const MAX_CONTENT = 4000;
const MAX_FAILURES = 5;
const WINDOWS = process.platform === 'win32';

function parseArgs(argv) {
  const opts = { interval: 30, once: false, includeOwn: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--once') opts.once = true;
    else if (a === '--include-own') opts.includeOwn = true;
    else if (a === '--chat') opts.chat = Number(argv[++i]);
    else if (a === '--after') opts.after = Number(argv[++i]);
    else if (a === '--interval') opts.interval = Number(argv[++i]);
    else fail(`unknown argument ${a}`);
  }
  if (!Number.isInteger(opts.chat) || opts.chat <= 0) fail('--chat <chat_id> is required');
  if (opts.after !== undefined && !Number.isInteger(opts.after)) fail('--after takes a message id');
  if (!(opts.interval >= 10)) fail('--interval is at least 10 seconds');
  return opts;
}

function fail(message) {
  process.stderr.write(`watch.mjs: ${message}\n`);
  process.exit(2);
}

const TAG = `pachca_content_${randomBytes(6).toString('hex')}`;

function emit(block) {
  process.stdout.write(`${block}\n`);
}

function pachca(args) {
  return new Promise((resolve) => {
    execFile(
      'pachca',
      [...args, '-o', 'json'],
      // npm installs the CLI as pachca.cmd on Windows, which only a shell can start.
      { maxBuffer: 16 * 1024 * 1024, timeout: 120_000, shell: WINDOWS },
      (err, stdout, stderr) => {
        if (!err) {
          try {
            return resolve({ ok: true, data: JSON.parse(stdout) });
          } catch {
            return resolve({ ok: false, exit: null, detail: { error: 'unreadable CLI output' } });
          }
        }
        let detail = {};
        try {
          detail = JSON.parse(stderr);
        } catch {
          detail = { error: (stderr || err.message).trim() };
        }
        resolve({ ok: false, exit: typeof err.code === 'number' ? err.code : null, detail });
      }
    );
  });
}

// Exit code 3 is a sign-in or rights problem: retrying will not help. A 403 with
// `errors` (exit 1) or 404 (exit 4) means the chat itself is out of reach.
function stopReason(res) {
  if (res.exit === 3 || res.detail.type === 'PACHCA_AUTH_ERROR') return 'auth';
  if (res.exit === 4 || res.detail.code === 403 || res.detail.code === 404) return 'access';
  if (res.detail.error?.includes('ENOENT') || res.exit === 127) return 'error';
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs a CLI call, retrying transient failures. Returns the result, or a stop line.
async function call(args, interval) {
  for (let failures = 1; ; failures++) {
    const res = await pachca(args);
    if (res.ok) return { res };
    const reason = stopReason(res) ?? (failures >= MAX_FAILURES ? 'error' : null);
    if (reason) {
      const why = [res.detail.error, res.detail.hint && `Hint: ${res.detail.hint}`].filter(Boolean).join('. ');
      return {
        stop: `## Watching stopped (${reason})${why ? `\n${why}` : ''}`,
        code: reason === 'auth' ? 3 : 1,
      };
    }
    process.stderr.write(`watch.mjs: check failed (${res.detail.error ?? 'unknown error'})\n`);
    await sleep(interval * 1000);
  }
}

// Names are looked up once per author. A failed lookup (a deleted user, a bot) leaves
// the id alone rather than stopping the watch.
const authors = new Map();
async function author(m) {
  // Set on messages a bot sent under its own name.
  if (m.display_name) return `${m.display_name} (user ${m.user_id}, bot)`;
  if (!authors.has(m.user_id)) {
    const r = await pachca(['users', 'get', String(m.user_id)]);
    const u = r.ok ? r.data : null;
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.nickname : null;
    const kind = u?.bot ? ', bot' : u?.role === 'guest' || u?.role === 'multi_guest' ? ', guest' : '';
    authors.set(m.user_id, name ? `${name} (user ${m.user_id}${kind})` : `user ${m.user_id}`);
  }
  return authors.get(m.user_id);
}

async function toBlock(m) {
  const content = m.content ?? '';
  const long = content.length > MAX_CONTENT;
  const reply = m.parent_message_id ? `, reply to ${m.parent_message_id}` : '';
  const lines = [
    `### ${await author(m)} · ${m.created_at} · message ${m.id}${reply}`,
    `<${TAG}>`,
    long ? `${content.slice(0, MAX_CONTENT)}…` : content,
    `</${TAG}>`,
  ];
  if (long) lines.push(`Cut at ${MAX_CONTENT} characters: read message ${m.id} for the rest.`);
  const files = (m.files ?? []).map((f) => `${f.name} (file ${f.id})${f.url ? ` ${f.url}` : ''}`);
  if (files.length) lines.push(`Files: ${files.join('; ')}`);
  if (m.url) lines.push(`Link: ${m.url}`);
  return lines.join('\n');
}

// Returns the exit code. The process exits once stdout has drained, so no line is cut.
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let self = null;
  if (!opts.includeOwn) {
    const me = await call(['profile', 'get'], opts.interval);
    if (me.stop) {
      emit(me.stop);
      return me.code;
    }
    self = me.res.data.id;
  }

  let after = opts.after;
  for (;;) {
    const r = await call(['messages', 'list', String(opts.chat), '--limit', String(PAGE)], opts.interval);
    if (r.stop) {
      emit(r.stop);
      return r.code;
    }
    const page = Array.isArray(r.res.data) ? r.res.data : [];
    const newest = page.reduce((m, msg) => Math.max(m, msg.id), after ?? 0);
    if (after !== undefined) {
      const fresh = page.filter((m) => m.id > after).sort((a, b) => a.id - b.id);
      const shown = fresh.filter((m) => self === null || m.user_id !== self);
      const blocks = [];
      if (fresh.length === PAGE) blocks.push(`## More than ${PAGE} new messages after ${after}\nRead the chat itself for the ones before these.`);
      if (shown.length) blocks.push(`## New messages in chat ${opts.chat}`);
      for (const m of shown) blocks.push(await toBlock(m));
      // One write per check, so the program that wakes the agent gets the batch as one event.
      if (blocks.length) emit(blocks.join('\n\n'));
      if (opts.once && shown.length > 0) return 0;
    }
    // The first check without --after only sets the starting point.
    after = newest;
    await sleep(opts.interval * 1000);
  }
}

main().then((code) => {
  process.exitCode = code;
});
