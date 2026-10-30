#!/usr/bin/env node
// Watches a Pachca thread or chat through the `pachca` CLI and prints one JSON line
// per new message from someone else, oldest first. A program that wakes the agent on
// output (the Monitor tool in Claude Code) turns each line into an event. With --once
// the script exits after the first new messages, for programs that wake the agent
// when a background command finishes.
//
//   node watch.mjs --chat <chat_id> [--after <message_id>] [--interval 30] [--once] [--include-own]
//
// The CLI picks its token as usual: PACHCA_TOKEN, then PACHCA_PROFILE, then the active
// profile. Lines on stdout:
//   {"event":"message","id":…,"user_id":…,"display_name":…,"created_at":…,"parent_message_id":…,"url":…,"content":…,"files":[…]}
//   {"event":"more","after":…}   more new messages than one check reads: read the chat directly
//   {"event":"stopped","reason":"auth"|"access"|"error","error":…,"hint":…}   the script ends
// Everything else goes to stderr and wakes no one. Exit codes: 0 after --once, 1 access
// or repeated errors, 2 bad arguments, 3 sign-in or rights.

import { execFile } from 'node:child_process';

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

function emit(line) {
  process.stdout.write(`${JSON.stringify(line)}\n`);
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
      return {
        stop: { event: 'stopped', reason, error: res.detail.error ?? null, hint: res.detail.hint ?? null },
        code: reason === 'auth' ? 3 : 1,
      };
    }
    process.stderr.write(`watch.mjs: check failed (${res.detail.error ?? 'unknown error'})\n`);
    await sleep(interval * 1000);
  }
}

function toLine(m) {
  const content = m.content ?? '';
  const long = content.length > MAX_CONTENT;
  return {
    event: 'message',
    id: m.id,
    user_id: m.user_id,
    // Set on messages a bot sent under its own name.
    ...(m.display_name ? { display_name: m.display_name } : {}),
    created_at: m.created_at,
    parent_message_id: m.parent_message_id ?? null,
    url: m.url ?? null,
    content: long ? `${content.slice(0, MAX_CONTENT)}…` : content,
    ...(long ? { truncated: true } : {}),
    files: (m.files ?? []).map((f) => f.name),
  };
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
      if (fresh.length === PAGE) emit({ event: 'more', after });
      const shown = fresh.filter((m) => self === null || m.user_id !== self);
      for (const m of shown) emit(toLine(m));
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
