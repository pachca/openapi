import { BaseCommand } from '../../base-command.js';
import { ensureFreshToken } from '../../token-refresh.js';

/**
 * The token itself, for another program to call the API with.
 *
 * `pachca-app` (the command of `@pachca/app-sdk`) and scripts take the login
 * from here instead of reading the config file or the keychain: the storage
 * stays this CLI's own. A browser login is renewed first, so the token printed
 * works for the next hour. Nothing but the token goes to stdout.
 */
export default class AuthToken extends BaseCommand {
  static override description = 'Напечатать токен профиля для другой программы, обновив его, если срок подходит к концу';

  static override examples = [
    '<%= config.bin %> auth token',
    '<%= config.bin %> auth token --profile work',
    'PACHCA_TOKEN=$(<%= config.bin %> auth token) npx pachca-app ship',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthToken);
    this.parsedFlags = flags;

    const { token, profileName, profile } = this.resolveAuth();
    const fresh = profileName && profile ? (await ensureFreshToken(profileName, profile)).token : token;
    process.stdout.write(`${fresh}\n`);
  }
}
