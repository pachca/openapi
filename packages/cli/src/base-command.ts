import { Command, Flags, type Interfaces } from '@oclif/core';
import {
  resolveToken,
  TokenNotFoundError,
  ProfileNotFoundError,
  getAuthMethod,
  getDefaults,
  profileFlag,
} from './profiles.js';
import { ApiError, getExitCode, formatDryRun, request, type RequestOptions, type ClientFlags, type ErrorType } from './client.js';
import { outputData, outputError, outputSuccess, type OutputFormat, type OutputOptions } from './output.js';
import { defaultOutputFormat, isInteractive } from './utils.js';

export type BaseFlags = Interfaces.InferredFlags<typeof BaseCommand.baseFlags>;

export abstract class BaseCommand extends Command {
  static baseFlags = {
    output: Flags.string({
      char: 'o',
      description: 'Output format: table, json, yaml, csv',
      options: ['table', 'json', 'yaml', 'csv'],
    }),
    columns: Flags.string({
      char: 'c',
      description: 'Columns to display (comma-separated)',
    }),
    'no-header': Flags.boolean({
      description: 'Hide table header',
      default: false,
    }),
    'no-truncate': Flags.boolean({
      description: 'Do not truncate values in table',
      default: false,
    }),
    profile: Flags.string({
      char: 'p',
      description: 'Profile to use for this command',
    }),
    token: Flags.string({
      description: 'Bearer token for this call (not saved)',
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'Suppress output except errors',
      default: false,
    }),
    'no-color': Flags.boolean({
      description: 'Disable color output',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show HTTP request/response details',
      default: false,
    }),
    'no-input': Flags.boolean({
      description: 'Disable interactive prompts',
      default: false,
    }),
    'dry-run': Flags.boolean({
      description: 'Show HTTP request without sending',
      default: false,
    }),
    timeout: Flags.integer({
      description: 'Request timeout in seconds',
      // 0 or negative would abort on the next tick; fail loudly instead.
      min: 1,
    }),
    'no-retry': Flags.boolean({
      description: 'Disable auto-retry on 429, 5xx and network errors',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output as JSON (alias for --output json)',
      default: false,
      hidden: true,
    }),
    plain: Flags.boolean({
      description: 'Plain output: TSV, no header, ID column first, no color (for scripts)',
      default: false,
    }),
  };

  private _parsedFlags!: BaseFlags;
  protected get parsedFlags(): BaseFlags { return this._parsedFlags; }
  protected set parsedFlags(flags: BaseFlags) {
    this._parsedFlags = flags;
    if (flags['no-color']) {
      process.env.NO_COLOR = '1';
    }
  }

  /**
   * Get the resolved output format, respecting flag > config > TTY default.
   */
  protected getOutputFormat(): OutputFormat {
    if (this.parsedFlags.json) return 'json';
    if (this.parsedFlags.output) return this.parsedFlags.output as OutputFormat;
    const defaults = getDefaults();
    if (defaults.output) return defaults.output as OutputFormat;
    return defaultOutputFormat() as OutputFormat;
  }

  /**
   * Get output options from parsed flags.
   */
  protected getOutputOptions(): OutputOptions {
    return {
      format: this.getOutputFormat(),
      columns: this.parsedFlags.columns?.split(',').map((c) => c.trim()),
      noHeader: this.parsedFlags['no-header'],
      noTruncate: this.parsedFlags['no-truncate'],
      quiet: this.parsedFlags.quiet,
      plain: this.parsedFlags.plain,
    };
  }

  /**
   * Safely parse JSON string from a flag value.
   */
  protected parseJSON(value: string, flagName: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      this.validationError([{ message: `Invalid JSON in --${flagName}`, flag: flagName }]);
    }
  }

  /**
   * Report validation error(s) with structured output and exit.
   */
  protected validationError(
    errors: { message: string; flag?: string }[],
    opts?: { hint?: string; type?: ErrorType },
  ): never {
    const format = this.getOutputFormat();
    const type = opts?.type ?? 'PACHCA_VALIDATION_ERROR';
    const helpCmd = this.id ? `pachca introspect ${this.id.replace(/:/g, ' ')}` : undefined;
    const hint = opts?.hint ?? helpCmd;

    if (errors.length === 1) {
      outputError({
        error: errors[0].message,
        code: null,
        type,
        ...(errors[0].flag ? { flag: `--${errors[0].flag}` } : {}),
        ...(hint ? { hint } : {}),
      }, format);
    } else {
      outputError({
        error: 'Validation failed',
        code: null,
        type,
        errors: errors.map((e) => ({
          message: e.message,
          ...(e.flag ? { flag: `--${e.flag}` } : {}),
        })),
        ...(hint ? { hint } : {}),
      }, format);
    }
    this.exit(2);
  }

  /**
   * Get client flags for the HTTP client.
   */
  protected getClientFlags(): ClientFlags {
    const defaults = getDefaults();
    return {
      output: this.getOutputFormat(),
      quiet: this.parsedFlags.quiet,
      verbose: this.parsedFlags.verbose,
      'dry-run': this.parsedFlags['dry-run'],
      'no-retry': this.parsedFlags['no-retry'],
      timeout: this.parsedFlags.timeout ?? defaults.timeout,
    };
  }

  /**
   * Whether the CLI is in interactive mode for this command.
   */
  protected isInteractive(): boolean {
    if (this.parsedFlags['no-input']) return false;
    return isInteractive();
  }

  /**
   * Resolve the auth token.
   */
  protected resolveAuth(): ReturnType<typeof resolveToken> {
    return resolveToken({
      token: this.parsedFlags.token,
      profile: this.parsedFlags.profile,
    });
  }

  /**
   * Make an authenticated API request.
   */
  protected async apiRequest(opts: Omit<RequestOptions, 'token'>): Promise<{ data: unknown; status: number; headers: Headers }> {
    const clientFlags = this.getClientFlags();

    // --dry-run sends nothing, so it needs no token: the preview masks the header
    // either way. Resolving first made it fail with «Token not found» before login.
    const token = clientFlags['dry-run'] ? '' : this.resolveAuth().token;
    const fullOpts: RequestOptions = { ...opts, token };

    if (clientFlags['dry-run']) {
      const dryRunOutput = formatDryRun(fullOpts, this.getOutputFormat() === 'json');
      if (typeof dryRunOutput === 'string') {
        process.stdout.write(dryRunOutput + '\n');
      } else {
        process.stdout.write(JSON.stringify(dryRunOutput, null, 2) + '\n');
      }
      this.exit(0);
    }

    return request(fullOpts, clientFlags);
  }

  /**
   * Output data in the configured format.
   */
  protected output(data: unknown): void {
    const opts = this.getOutputOptions();
    // If user didn't specify --columns, use command's defaultColumns
    if (!opts.columns) {
      const defaultCols = (this.constructor as unknown as { defaultColumns?: string[] }).defaultColumns;
      if (defaultCols) opts.columns = defaultCols;
    }
    outputData(data, opts);
  }

  /**
   * Warn about a non-empty list from the response `meta` (e.g. `not_found_member_ids`).
   *
   * stdout keeps printing only `data`, so `-o json` output keeps its shape. The list
   * goes to stderr in every output mode, like the other `⚠` notices.
   */
  protected warnMetaList(meta: unknown, field: string, message: string, hint: string): void {
    const value = meta && typeof meta === 'object' ? (meta as Record<string, unknown>)[field] : undefined;
    if (!Array.isArray(value) || value.length === 0) return;
    process.stderr.write(`⚠ ${message}: ${value.join(', ')}.\n  ${hint}\n`);
  }

  /**
   * Output a success message to stderr.
   */
  protected success(message: string): void {
    const format = this.getOutputFormat();
    if (format === 'json') {
      process.stdout.write(JSON.stringify({ ok: true }) + '\n');
    }
    outputSuccess(message, this.parsedFlags.quiet);
  }

  /**
   * Explain a scope refusal instead of printing a bare 403.
   *
   * An agent cannot walk through a consent screen — the most useful thing it can
   * do is hand control back to a human with the reason spelled out.
   *
   * `insufficient_scope` always means the token itself lacks the scope. A role
   * that does not allow the action comes back as `role_forbidden` instead, see
   * reportRoleRefusal. The fix differs by how the profile was authorised.
   */
  private reportScopeError(err: ApiError): never {
    const format = this.getOutputFormat();
    const scope = typeof err.details.scope === 'string' ? err.details.scope : undefined;

    if (format === 'json' || !process.stderr.isTTY) {
      outputError(err.details, format);
      this.exit(3);
    }

    const resolved = this.tryResolveProfile();
    const profile = resolved?.profile;

    process.stderr.write(`✗ Не хватает права${scope ? ` ${scope}` : ''}.\n`);

    if (!profile) {
      process.stderr.write(`  У токена ${scope ? 'этого' : 'нужного'} права нет.\n`);
      process.stderr.write(`  Проверить права токена: pachca oauth token-info -o json\n`);
      this.exit(3);
    }

    // The scope list in the profile is a copy taken at login. When it still names
    // the scope the server just refused, the copy is stale: the token's scopes were
    // changed after login. Naming the scope needs the server's message to carry it.
    const flag = profileFlag(resolved?.profileName);
    const listedLocally = !!scope && !!profile.scopes?.includes(scope);
    if (listedLocally) {
      process.stderr.write(`  В сохранённом списке право есть, но у токена его уже нет: список устарел.\n`);
      process.stderr.write(`  Обновить список: pachca auth status --remote${flag}\n`);
    } else {
      process.stderr.write(`  У токена ${scope ? 'этого' : 'нужного'} права нет.\n`);
    }

    if (getAuthMethod(profile) === 'oauth') {
      process.stderr.write(`  При входе через браузер права выдаются по роли на момент подтверждения.\n`);
      process.stderr.write(`  Если роль с тех пор расширили, войдите заново: pachca auth login${flag}\n`);
    } else {
      process.stderr.write(`  Добавьте право токену в Пачке или выпустите новый токен с ним.\n`);
    }
    this.exit(3);
  }

  /**
   * Explain a role refusal: the token carries the scope, but the role of the
   * account behind it does not allow the action. No new login or token changes
   * that, so say who can. The API names no scope here; a generated command
   * knows the one its method requires.
   */
  private reportRoleRefusal(err: ApiError): never {
    const format = this.getOutputFormat();
    if (format === 'json' || !process.stderr.isTTY) {
      outputError(err.details, format);
      this.exit(3);
    }

    const profile = this.tryResolveProfile()?.profile;
    const scope = (this.constructor as unknown as { scope?: string }).scope;
    const right = scope ? `Право ${scope}` : 'Право';

    if (profile?.type === 'bot') {
      process.stderr.write(`✗ ${right} есть у токена, но его не даёт роль бота.\n`);
      process.stderr.write(`  Это действие выполняют персональным токеном сотрудника с подходящей ролью.\n`);
    } else {
      process.stderr.write(`✗ ${right} есть у токена, но его не даёт роль.\n`);
      process.stderr.write(`  Новый вход или новый токен не помогут: роль меняет администратор пространства.\n`);
    }
    this.exit(3);
  }

  /** The profile the call ran with, or undefined when the token came from --token or PACHCA_TOKEN. */
  private tryResolveProfile(): ReturnType<typeof resolveToken> | undefined {
    try {
      return resolveToken({ token: this.parsedFlags.token, profile: this.parsedFlags.profile });
    } catch {
      return undefined;
    }
  }

  /**
   * What to do after a 401: the login was revoked, or the saved token no longer works.
   *
   * A browser login is fixed by logging in again, a saved token by saving a new one.
   * The command carries the profile the call ran with, so it can be pasted as is.
   * JSON output gets the bare command, like the other hints there.
   */
  private reloginHint(): string {
    const format = this.getOutputFormat();
    const human = format !== 'json' && process.stderr.isTTY;

    let resolved: ReturnType<typeof resolveToken> | undefined;
    try {
      resolved = resolveToken({ token: this.parsedFlags.token, profile: this.parsedFlags.profile });
    } catch {
      // no profile resolved — the token came in from a flag or the environment
    }

    if (!resolved?.profile || !resolved.profileName) {
      return human
        ? 'Токен из --token или PACHCA_TOKEN недействителен или отозван.'
        : 'token from --token or PACHCA_TOKEN is invalid or revoked';
    }

    const flag = profileFlag(resolved.profileName);
    if (getAuthMethod(resolved.profile) === 'oauth') {
      return human
        ? `Вход завершён или отозван. Войдите заново: pachca auth login${flag}`
        : `pachca auth login${flag}`;
    }
    return human
      ? `Токен недействителен или отозван. Сохраните новый: pachca auth login${flag} --token <токен>`
      : `pachca auth login${flag} --token <token>`;
  }

  /**
   * Handle errors with structured output.
   */
  protected override async catch(err: Error & { exitCode?: number }): Promise<void> {
    if (err instanceof ApiError && err.details.type === 'PACHCA_SCOPE_ERROR') {
      this.reportScopeError(err);
    }

    if (err instanceof ApiError && err.details.code === 403 && err.details.message === 'role_forbidden') {
      this.reportRoleRefusal(err);
    }

    if (err instanceof ApiError) {
      if (err.details.code === 401 && !err.details.hint) {
        err.details.hint = this.reloginHint();
      }
      outputError(err.details, this.getOutputFormat());
      this.exit(getExitCode(err));
    }

    if (err instanceof TokenNotFoundError) {
      const format = this.getOutputFormat();
      if (format === 'json' || !process.stderr.isTTY) {
        outputError(
          { error: 'Token not found', type: 'PACHCA_AUTH_ERROR', code: null, hint: 'pachca auth login, or set PACHCA_TOKEN' },
          format,
        );
      } else {
        process.stderr.write(`✗ Токен не найден. Войдите в аккаунт:\n\n`);
        process.stderr.write(`  Вход через браузер:\n`);
        process.stderr.write(`    pachca auth login\n\n`);
        process.stderr.write(`  Готовым токеном (агент, CI):\n`);
        process.stderr.write(`    pachca auth login --token <ваш токен>\n`);
        process.stderr.write(`    либо переменная окружения PACHCA_TOKEN — без входа вообще\n\n`);
        process.stderr.write(`  Получить токен: https://dev.pachca.com/api/authorization\n`);
      }
      this.exit(3);
    }

    if (err instanceof ProfileNotFoundError) {
      outputError(
        { error: `Profile "${err.profileName}" not found`, type: 'PACHCA_USAGE_ERROR', code: null, hint: 'pachca auth list' },
        this.getOutputFormat(),
      );
      this.exit(2);
    }

    // Default oclif error handling
    throw err;
  }
}
