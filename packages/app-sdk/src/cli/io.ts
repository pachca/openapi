// Всё, чем команды касаются внешнего мира: папка, переменные окружения, терминал, сеть, запуск программ.
// Тесты подменяют это целиком и проверяют команды без процесса, терминала и сети.
import { spawn, spawnSync } from 'node:child_process';

export interface RunResult {
  status: number | null;
  stdout: string;
  /** Программы нет (`ENOENT`). */
  missing: boolean;
}

export interface Io {
  cwd: string;
  env: Record<string, string | undefined>;
  /** Человек за терминалом: можно спросить и показать анимацию. */
  tty: boolean;
  /** Служебный вывод и ошибки. */
  err(text: string): void;
  /** Результат для программ (id приложения, токен). */
  out(text: string): void;
  /** Строка от человека; `hidden` без эха. Без терминала читает строку из stdin. */
  ask(prompt: string, options?: { hidden?: boolean }): Promise<string>;
  /** Запуск программы: `capture` забирает stdout, иначе вывод идёт в терминал. */
  run(command: string, args: string[], options?: { capture?: boolean; cwd?: string; env?: Record<string, string> }): RunResult;
  /** Программа с выводом для разбора: stdout и stderr забираются, `input` уходит в stdin. Не блокирует анимацию шага. */
  exec(command: string, args: string[], options?: { input?: string; env?: Record<string, string> }): Promise<ExecResult>;
  fetch: typeof fetch;
  sleep(ms: number): Promise<void>;
}

export interface ExecResult {
  status: number | null;
  stdout: string;
  stderr: string;
  /** Программы нет (`ENOENT`). */
  missing: boolean;
}

/** Настоящий процесс. */
export function nodeIo(): Io {
  return {
    cwd: process.cwd(),
    env: process.env,
    tty: Boolean(process.stdin.isTTY && process.stderr.isTTY),
    err: (t) => void process.stderr.write(t),
    out: (t) => void process.stdout.write(t),
    ask: askLine,
    run(command, args, options = {}) {
      const r = spawnSync(command, args, {
        cwd: options.cwd,
        env: options.env ? { ...process.env, ...options.env } : process.env,
        encoding: 'utf8',
        stdio: options.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
        shell: process.platform === 'win32',
      });
      const missing = (r.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT';
      return { status: r.status, stdout: r.stdout ?? '', missing };
    },
    exec: (command, args, options = {}) =>
      new Promise((done) => {
        const child = spawn(command, args, {
          env: options.env ? { ...process.env, ...options.env } : process.env,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: process.platform === 'win32',
        });
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8').on('data', (c: string) => (stdout += c));
        child.stderr.setEncoding('utf8').on('data', (c: string) => (stderr += c));
        child.on('error', (e: NodeJS.ErrnoException) => done({ status: null, stdout, stderr, missing: e.code === 'ENOENT' }));
        child.on('close', (status) => done({ status, stdout, stderr, missing: false }));
        child.stdin.on('error', () => {});
        child.stdin.end(options.input ?? '');
      }),
    fetch: (...a) => fetch(...a),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  };
}

function askLine(prompt: string, options: { hidden?: boolean } = {}): Promise<string> {
  return new Promise((done) => {
    const stdin = process.stdin;
    const raw = Boolean(options.hidden && stdin.isTTY);
    let buf = '';
    if (stdin.isTTY) process.stderr.write(prompt);
    if (raw) stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    const finish = () => {
      stdin.off('data', onData);
      stdin.off('end', finish);
      if (raw) {
        stdin.setRawMode(false);
        process.stderr.write('\n');
      }
      stdin.pause();
      done(buf.trim());
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (raw && ch === '\u0003') {
          stdin.setRawMode(false);
          process.exit(130);
        }
        if (ch === '\r' || ch === '\n') return finish();
        if (raw && (ch === '\u007f' || ch === '\b')) buf = buf.slice(0, -1);
        else buf += ch;
      }
    };
    stdin.on('data', onData);
    stdin.on('end', finish);
    stdin.resume();
  });
}

const paint = (io: Io, code: number) => (t: string) => (io.tty && !io.env.NO_COLOR ? `\x1b[${code}m${t}\x1b[0m` : t);

/** Цвета только для человека за терминалом. */
export function colors(io: Io) {
  return { dim: paint(io, 2), green: paint(io, 32), red: paint(io, 31), cyan: paint(io, 36), bold: paint(io, 1) };
}

/** Ошибка команды с текстом для человека и кодом выхода (2 это неверный вызов). */
export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
  }
}

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/** Шаг с итогом в одну строку. Вывод внутри шага (`log`) показывается, только если шаг упал. */
export async function step<T>(io: Io, label: string, fn: (log: (m: string) => void) => T | Promise<T>, detail?: (r: T) => string): Promise<T> {
  const c = colors(io);
  const pad = label.padEnd(14);
  const logs: string[] = [];
  let i = 0;
  const timer = io.tty ? setInterval(() => io.err(`\r  ${c.cyan(FRAMES[i++ % FRAMES.length]!)} ${pad}`), 80) : undefined;
  const started = Date.now();
  const clear = io.tty ? '\r\x1b[2K' : '';
  try {
    const r = await fn((m) => void logs.push(m));
    if (timer) clearInterval(timer);
    io.err(`${clear}  ${c.green('✔')} ${pad}${detail ? detail(r) : ''} ${c.dim(`${((Date.now() - started) / 1000).toFixed(1)}s`)}\n`);
    return r;
  } catch (e) {
    if (timer) clearInterval(timer);
    io.err(`${clear}  ${c.red('✖')} ${pad}${c.red('ошибка')}\n`);
    for (const l of logs) io.err(`${c.dim('    │')} ${l.split('\n').join(`\n${c.dim('    │')} `)}\n`);
    throw e;
  }
}

/** Да или нет от человека; без терминала всегда нет. */
export async function confirm(io: Io, question: string, byDefault = false): Promise<boolean> {
  if (!io.tty) return false;
  const answer = (await io.ask(question)).trim();
  if (!answer) return byDefault;
  return /^(y|yes|д|да)$/i.test(answer);
}
