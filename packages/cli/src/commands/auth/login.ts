import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import {
  setProfile,
  setActiveProfile,
  getActiveProfile,
  getProfile,
  getSecretStorage,
  expiresAtFromNow,
  type Profile,
} from '../../profiles.js';
import { isSecretStoreAvailable } from '../../secret-store.js';
import { ApiError, request } from '../../client.js';
import { outputError } from '../../output.js';
import {
  OAuthError,
  copyToClipboard,
  openBrowser,
  pollForToken,
  requestDeviceCode,
  type DeviceCodeGrant,
  type TokenGrant,
} from '../../oauth.js';

interface TokenInfo {
  user_id: number;
  scopes?: string[];
  expires_in?: number | null;
}

export default class AuthLogin extends BaseCommand {
  static override description = 'Вход в аккаунт и сохранение профиля';

  static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --profile personal',
    '<%= config.bin %> auth login --profile ci --token $PACHCA_TOKEN',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    profile: Flags.string({
      char: 'p',
      description: 'Имя профиля (по умолчанию "default")',
      default: 'default',
    }),
    token: Flags.string({
      description:
        'Войти готовым токеном вместо входа через браузер. Значение `-` читает токен из потока ввода, не оставляя его в истории оболочки',
    }),
    'no-browser': Flags.boolean({
      description: 'Не открывать браузер — только напечатать адрес и код',
      default: false,
    }),
    'insecure-storage': Flags.boolean({
      description: 'Хранить токен в файле конфигурации, а не в хранилище ключей ОС',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    this.parsedFlags = flags;

    const profileName = flags.profile ?? 'default';

    // `--token -` reads the value from stdin. A secret passed as an argument
    // lands in the shell history and is visible in the process list to everyone
    // on the machine — and this is the CI path, where the token is long-lived.
    // Reading a terminal instead of a pipe would just hang with no output until
    // the person guesses to press Ctrl-D. Say what was expected instead.
    if (flags.token === '-' && process.stdin.isTTY) {
      outputError(
        {
          error: 'Option --token - reads the token from stdin. Pipe it in: echo "$TOKEN" | pachca auth login --token -',
          type: 'PACHCA_USAGE_ERROR',
          code: null,
        },
        this.getOutputFormat(),
      );
      this.exit(2);
    }

    const token = flags.token === '-' ? await readTokenFromStdin() : flags.token;
    if (flags.token === '-' && !token) {
      outputError(
        { error: 'No token on stdin', type: 'PACHCA_USAGE_ERROR', code: null },
        this.getOutputFormat(),
      );
      this.exit(2);
    }
    flags.token = token;

    // Confirmation happens in a browser, so without a person at the terminal
    // there is nobody to confirm. CI and scripts pass a ready token instead.
    if (!flags.token && !this.isInteractive()) {
      outputError(
        {
          error: 'Token required in non-interactive mode. Use --token flag or PACHCA_TOKEN.',
          type: 'PACHCA_USAGE_ERROR',
          code: null,
        },
        this.getOutputFormat(),
      );
      this.exit(2);
    }

    const grant = flags.token
      ? { access_token: flags.token }
      : await this.deviceLogin(!flags['no-browser'], flags.quiet);

    const tokenInfo = await this.verifyToken(grant.access_token);
    const identity = await this.fetchIdentity(grant.access_token, tokenInfo.user_id);

    const scopes = grant.scope ? grant.scope.split(' ').filter(Boolean) : tokenInfo.scopes;

    const profile: Profile = {
      type: identity.isBot ? 'bot' : 'user',
      token: grant.access_token,
      user: identity.isBot ? `${identity.name} (бот)` : identity.name,
      email: identity.email,
      ...(flags.token
        ? { auth: 'token' as const }
        : {
            auth: 'oauth' as const,
            refresh_token: grant.refresh_token,
            expires_at: grant.expires_in ? expiresAtFromNow(grant.expires_in) : undefined,
          }),
      ...(scopes?.length ? { scopes } : {}),
      // Probed rather than assumed: on Linux the module loads even with no
      // Secret Service running, and a profile marked `keyring` that cannot be
      // read back would lock the user out of the session they just created.
      storage:
        !flags['insecure-storage'] && isSecretStoreAvailable()
          ? ('keyring' as const)
          : ('file' as const),
    };

    setProfile(profileName, profile);
    if (!getActiveProfile()) setActiveProfile(profileName);

    // setProfile downgrades to the file if the write failed, so report what was
    // actually stored, not what was asked for.
    const saved = getProfile(profileName) ?? profile;
    this.report(profileName, saved, scopes);
  }

  /**
   * Device authorization grant: the user confirms in a browser, we poll.
   *
   * The address and the code are printed separately and the ready-made link with
   * the code baked in is never shown — a link like that works as phishing when it
   * is forwarded to someone else's device.
   */
  private async deviceLogin(useBrowser: boolean, quiet?: boolean): Promise<TokenGrant> {
    let grant: DeviceCodeGrant;
    try {
      grant = await requestDeviceCode();
    } catch (error) {
      this.failOAuth(error, 'Не удалось начать вход');
    }

    if (!quiet) {
      const copied = copyToClipboard(grant.user_code);
      process.stderr.write(`\n  Откройте ${grant.verification_uri}\n`);
      process.stderr.write(`  и введите код: ${grant.user_code}\n`);
      if (copied) process.stderr.write(`  (код скопирован в буфер обмена)\n`);
      process.stderr.write(`\n  Ожидаю подтверждения…\n`);
    }

    if (useBrowser) openBrowser(grant.verification_uri);

    try {
      return await pollForToken(grant);
    } catch (error) {
      this.failOAuth(error, 'Вход не завершён');
    }
  }

  private failOAuth(error: unknown, summary: string): never {
    if (!(error instanceof OAuthError)) throw error;

    const explanations: Record<string, string> = {
      access_denied: 'Вход отклонён в браузере',
      expired_token: 'Код истёк — запустите вход заново',
      network_error: 'Не удалось подключиться к серверу',
    };
    const message = explanations[error.code] ?? error.description ?? error.code;

    outputError(
      {
        error: summary,
        code: error.status ?? null,
        type: 'PACHCA_AUTH_LOGIN_ERROR',
        message,
        oauth_error: error.code,
      },
      this.getOutputFormat(),
    );
    this.exit(3);
  }

  private async verifyToken(token: string): Promise<TokenInfo> {
    try {
      const response = await request(
        { method: 'GET', path: '/oauth/token/info', token },
        { quiet: this.parsedFlags.quiet },
      );
      return (response.data as { data: TokenInfo }).data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details.code === 401) {
          const format = this.getOutputFormat();
          if (format === 'json' || !process.stderr.isTTY) {
            outputError(
              {
                error: 'Invalid token',
                code: 401,
                type: 'PACHCA_AUTH_LOGIN_ERROR',
                message: 'Токен недействителен — сохранение отменено',
              },
              format,
            );
          } else {
            process.stderr.write(`✗ Токен недействителен — сохранение отменено.\n\n`);
            process.stderr.write(`  Проверьте токен и попробуйте снова:\n`);
            process.stderr.write(`    pachca auth login --token <ваш токен>\n\n`);
            process.stderr.write(`  Документация: https://dev.pachca.com/api/authorization\n`);
          }
          this.exit(3);
        }
        if (error.details.type === 'PACHCA_NETWORK_ERROR') {
          const format = this.getOutputFormat();
          if (format === 'json' || !process.stderr.isTTY) {
            outputError(
              {
                error: 'Network error',
                code: null,
                type: 'PACHCA_NETWORK_ERROR',
                message: 'Не удалось подключиться к серверу — сохранение отменено',
              },
              format,
            );
          } else {
            process.stderr.write(`✗ Не удалось подключиться к серверу — сохранение отменено.\n\n`);
            process.stderr.write(`  Проверьте подключение к интернету и попробуйте снова:\n`);
            process.stderr.write(`    pachca auth login\n`);
          }
          this.exit(1);
        }
      }
      throw error;
    }
  }

  private async fetchIdentity(
    token: string,
    userId: number,
  ): Promise<{ name: string; email: string | null; isBot: boolean }> {
    try {
      const response = await request({ method: 'GET', path: '/profile', token }, { quiet: true });
      const data = (response.data as { data: Record<string, unknown> }).data;
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      return {
        name: name || `User #${userId}`,
        email: (data.email as string) || null,
        isBot: (data.bot as boolean) || false,
      };
    } catch {
      // profile:read scope not available — user_id from token info is enough
      return { name: `User #${userId}`, email: null, isBot: false };
    }
  }

  private report(profileName: string, profile: Profile, scopes?: string[]): void {
    const format = this.getOutputFormat();

    if (format === 'json') {
      this.output({
        profile: profileName,
        type: profile.type,
        user: profile.user,
        email: profile.email ?? null,
        auth: profile.auth ?? 'token',
        expires_at: profile.expires_at ?? null,
        scopes: scopes ?? null,
        storage: getSecretStorage(profile),
      });
      return;
    }

    if (this.parsedFlags.quiet) return;

    const emailStr = profile.email ? ` (${profile.email})` : '';
    process.stderr.write(`✔ Подключён как: ${profile.user}${emailStr}  [${profile.type}]\n`);
    process.stderr.write(`  Профиль сохранён [${profileName}]\n`);
    if (scopes?.length) process.stderr.write(`  Права: ${scopes.length}\n`);

    // Where the token landed is a security fact the user cannot check any other
    // way, so it is said at login and not left to `auth status`.
    if (getSecretStorage(profile) === 'keyring') {
      process.stderr.write(`  Токен в хранилище ключей ОС\n`);
    } else {
      process.stderr.write(`  Токен в файле конфигурации (хранилище ключей недоступно)\n`);
    }

    process.stderr.write(`  Состояние входа: pachca auth status\n`);
  }
}

/** Read a token piped into the command, so it never appears in the shell history. */
async function readTokenFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8').trim();
}
