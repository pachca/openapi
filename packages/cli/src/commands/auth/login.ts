import { Flags } from '@oclif/core';
import * as clack from '@clack/prompts';
import { BaseCommand } from '../../base-command.js';
import { setProfile, setActiveProfile, getActiveProfile, type Profile } from '../../profiles.js';
import { ApiError, request } from '../../client.js';
import { outputError } from '../../output.js';

export default class AuthLogin extends BaseCommand {
  static override description = 'Авторизация и сохранение токена';

  static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --profile personal',
    '<%= config.bin %> auth login --profile ci --token $PACHCA_TOKEN',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    profile: Flags.string({
      char: 'p',
      description: 'Profile name (default: "default")',
      default: 'default',
    }),
    token: Flags.string({
      description: 'Token to save (skips prompt)',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    this.parsedFlags = flags;

    const profileName = flags.profile ?? 'default';
    let token = flags.token;

    // Interactive token prompt
    if (!token) {
      if (!this.isInteractive()) {
        outputError(
          { error: 'Token required in non-interactive mode. Use --token flag.', type: 'PACHCA_USAGE_ERROR', code: null },
          this.getOutputFormat(),
        );
        this.exit(2);
      }

      const result = await clack.password({
        message: 'Вставьте API токен:',
      });
      if (clack.isCancel(result)) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
      token = result;
    }

    if (!token) {
      outputError(
        { error: 'Token is required', type: 'PACHCA_USAGE_ERROR', code: null },
        this.getOutputFormat(),
      );
      this.exit(2);
    }

    // Validate token via GET /oauth/token/info
    let tokenInfo: { user_id: number; user_name?: string; user_email?: string; bot?: boolean };
    try {
      const response = await request(
        { method: 'GET', path: '/oauth/token/info', token },
        { quiet: flags.quiet },
      );
      const wrapper = response.data as { data: typeof tokenInfo };
      tokenInfo = wrapper.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details.code === 401) {
          const format = this.getOutputFormat();
          if (format === 'json' || !process.stderr.isTTY) {
            outputError(
              { error: 'Invalid token', code: 401, type: 'PACHCA_AUTH_LOGIN_ERROR', message: 'Токен недействителен — сохранение отменено' },
              format,
            );
          } else {
            process.stderr.write(`✗ Токен недействителен — сохранение отменено\n\n`);
            process.stderr.write(`  Проверьте токен и попробуйте снова:\n`);
            process.stderr.write(`    pachca auth login --token <ваш токен>\n\n`);
            process.stderr.write(`  Документация: https://dev.pachca.com/guides/authorization\n`);
          }
          this.exit(3);
        }
        if (error.details.type === 'PACHCA_NETWORK_ERROR') {
          const format = this.getOutputFormat();
          if (format === 'json' || !process.stderr.isTTY) {
            outputError(
              { error: 'Network error', code: null, type: 'PACHCA_NETWORK_ERROR', message: 'Не удалось подключиться к серверу — сохранение отменено' },
              format,
            );
          } else {
            process.stderr.write(`✗ Не удалось подключиться к серверу — сохранение отменено\n\n`);
            process.stderr.write(`  Проверьте подключение к интернету и попробуйте снова:\n`);
            process.stderr.write(`    pachca auth login\n`);
          }
          this.exit(1);
        }
      }
      throw error;
    }

    // Get user info
    let userName = `User #${tokenInfo.user_id}`;
    let userEmail: string | null = null;
    let isBot = false;

    try {
      const profileResponse = await request(
        { method: 'GET', path: '/profile', token },
        { quiet: true },
      );
      const profileData = (profileResponse.data as { data: Record<string, unknown> }).data;
      const firstName = profileData.first_name || '';
      const lastName = profileData.last_name || '';
      userName = `${firstName} ${lastName}`.trim() || userName;
      userEmail = (profileData.email as string) || null;
      isBot = (profileData.bot as boolean) || false;
    } catch {
      // profile:read scope not available — use user_id from token info
    }

    const profileType: 'user' | 'bot' = isBot ? 'bot' : 'user';

    // Save profile
    const profile: Profile = {
      type: profileType,
      token,
      user: isBot ? `${userName} (бот)` : userName,
      email: userEmail,
    };

    setProfile(profileName, profile);

    // Set as active if no active profile
    if (!getActiveProfile()) {
      setActiveProfile(profileName);
    }

    const format = this.getOutputFormat();
    if (format === 'json') {
      this.output({
        profile: profileName,
        type: profileType,
        user: profile.user,
        email: userEmail,
      });
    } else if (!flags.quiet) {
      const typeLabel = profileType === 'bot' ? 'bot' : 'user';
      const emailStr = userEmail ? ` (${userEmail})` : '';
      process.stderr.write(`✔ Подключён как: ${profile.user}${emailStr}  [${typeLabel}]\n`);
      process.stderr.write(`  Профиль сохранён [${profileName}]\n`);
    }
  }
}
