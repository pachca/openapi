import { Command, Flags, type Interfaces } from '@oclif/core';
import {
  resolveToken,
  TokenNotFoundError,
  ProfileNotFoundError,
  getDefaults,
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
    }),
    'no-retry': Flags.boolean({
      description: 'Disable auto-retry on 429/503',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output as JSON (alias for --output json)',
      default: false,
      hidden: true,
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
    const { token } = this.resolveAuth();
    const clientFlags = this.getClientFlags();

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
   * Handle errors with structured output.
   */
  protected override async catch(err: Error & { exitCode?: number }): Promise<void> {
    if (err instanceof ApiError) {
      outputError(err.details, this.getOutputFormat());
      this.exit(getExitCode(err));
    }

    if (err instanceof TokenNotFoundError) {
      const format = this.getOutputFormat();
      if (format === 'json' || !process.stderr.isTTY) {
        outputError(
          { error: 'Token not found', type: 'PACHCA_AUTH_ERROR', code: null, hint: 'pachca auth login --token <your-token>' },
          format,
        );
      } else {
        process.stderr.write(`✗ Токен не найден. Войдите в аккаунт:\n\n`);
        process.stderr.write(`  Интерактивно (человек):\n`);
        process.stderr.write(`    pachca auth login\n\n`);
        process.stderr.write(`  Неинтерактивно (агент, CI):\n`);
        process.stderr.write(`    pachca auth login --token <ваш токен>\n\n`);
        process.stderr.write(`  Получить токен: https://dev.pachca.com/guides/authorization\n`);
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
