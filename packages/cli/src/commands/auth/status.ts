import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import {
  getActiveProfile,
  getAuthMethod,
  getProfile,
  getSecretStorage,
  updateProfileScopes,
  type Profile,
} from '../../profiles.js';
import { request } from '../../client.js';
import { outputError } from '../../output.js';

/** Human-readable time left, or null when the token has no expiry at all. */
function describeExpiry(profile: Profile): string | null {
  if (getAuthMethod(profile) === 'token') return null;
  if (!profile.expires_at) return null;

  const msLeft = Date.parse(profile.expires_at) - Date.now();
  if (Number.isNaN(msLeft)) return null;
  if (msLeft <= 0) return 'истёк, обновится при следующей команде';

  const minutes = Math.round(msLeft / 60_000);
  return minutes < 60 ? `осталось ${minutes} мин` : `осталось ${Math.round(minutes / 60)} ч`;
}

export default class AuthStatus extends BaseCommand {
  static override description = 'Статус текущего профиля';

  static override examples = [
    '<%= config.bin %> auth status',
    '<%= config.bin %> auth status -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    remote: Flags.boolean({
      description: 'Спросить права у сервера, а не показывать сохранённые при входе',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus);
    this.parsedFlags = flags;

    const profileName = flags.profile || process.env.PACHCA_PROFILE || getActiveProfile();
    const format = this.getOutputFormat();

    if (!profileName) {
      outputError(
        { error: 'No active profile. Run: pachca auth login', type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    const profile = getProfile(profileName!);
    if (!profile) {
      outputError(
        { error: `Profile "${profileName}" not found`, type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    const authMethod = getAuthMethod(profile!);

    // The stored scope list is frozen at login. A role change since then makes it
    // stale, and this is the command people are sent to when a call is refused —
    // so offer to ask the server what the token actually carries.
    let scopes = profile!.scopes;
    let drifted = false;
    // Whether the answer really came from the server. `--remote` alone is not
    // enough: the request can fail, and labelling the cached list as server truth
    // is worse than not asking at all.
    let fromServer = false;
    if (flags.remote && profile!.token) {
      const remote = await this.fetchRemoteScopes(profile!.token);
      if (remote) {
        fromServer = true;
        drifted = JSON.stringify([...(scopes ?? [])].sort()) !== JSON.stringify([...remote].sort());
        scopes = remote;
        if (drifted) updateProfileScopes(profileName!, remote);
      }
    }

    if (format === 'json') {
      this.output({
        profile: profileName,
        type: profile!.type,
        user: profile!.user,
        email: profile!.email || null,
        auth: authMethod,
        expires_at: profile!.expires_at || null,
        scopes: scopes || null,
        scopes_source: fromServer ? 'server' : 'profile',
        storage: getSecretStorage(profile!),
        // A keyring-backed profile with no token means the store did not answer.
        // Surfaced here because this is the command people run to debug access.
        secret_readable: !!profile!.token,
      });
      return;
    }

    const emailStr = profile!.email ? ` (${profile!.email})` : '';
    process.stderr.write(`  Подключён как: ${profile!.user}${emailStr}  [${profile!.type}, profile: ${profileName}]\n`);

    const expiry = describeExpiry(profile!);
    if (authMethod === 'oauth') {
      process.stderr.write(`  Вход: через браузер${expiry ? `, ${expiry}` : ''}\n`);
    } else {
      process.stderr.write(`  Вход: готовым токеном, без срока\n`);
    }

    if (getSecretStorage(profile!) === 'keyring') {
      process.stderr.write(
        profile!.token
          ? `  Хранение: хранилище ключей ОС\n`
          : `  Хранение: хранилище ключей ОС — не читается, войдите заново\n`,
      );
    } else {
      process.stderr.write(`  Хранение: файл конфигурации\n`);
    }

    if (scopes?.length) {
      const source = fromServer ? ' по данным сервера' : '';
      process.stderr.write(`  Права${source} (${scopes.length}): ${scopes.join(', ')}\n`);
    } else if (fromServer) {
      // An empty set is an answer, not a missing one — and a token that carries
      // no rights is exactly the failure worth naming out loud.
      process.stderr.write(`  Права по данным сервера: ни одного\n`);
    }

    if (drifted) {
      process.stderr.write(`  Список прав в профиле расходился с сервером и был обновлён\n`);
    }
  }

  /** Ask the server what the token really carries. Null when it cannot be asked. */
  private async fetchRemoteScopes(token: string): Promise<string[] | null> {
    try {
      const response = await request(
        { method: 'GET', path: '/oauth/token/info', token },
        { quiet: true },
      );
      const info = (response.data as { data?: { scopes?: string[] } }).data;
      return info?.scopes ?? null;
    } catch {
      // Offline or a dead token: the local view is still worth printing.
      process.stderr.write(`  Спросить права у сервера не удалось — показаны сохранённые при входе\n`);
      return null;
    }
  }
}
