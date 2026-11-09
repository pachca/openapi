import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import {
  getActiveProfile,
  getAuthMethod,
  getProfile,
  getSecretStorage,
  listProfiles,
  tokenSource,
  updateProfileScopes,
  type Profile,
} from '../../profiles.js';
import { ApiError, request } from '../../client.js';
import { outputError } from '../../output.js';
import { fetchIdentity, type TokenInfo } from '../../identity.js';

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
  static override description = 'Чей токен используют команды и какие у него права';

  static override examples = [
    '<%= config.bin %> auth status',
    '<%= config.bin %> auth status -o json',
    'PACHCA_TOKEN=$TOKEN <%= config.bin %> auth status -o json',
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

    const format = this.getOutputFormat();

    // The token every other command would use, picked in the same order:
    // --token, --profile, PACHCA_TOKEN, PACHCA_PROFILE, the active profile.
    // Agents and CI usually pass PACHCA_TOKEN with no profile at all, and this
    // is the command they are sent to check the connection.
    const source = tokenSource({ token: flags.token, profile: flags.profile });
    if (source.kind === 'flag') {
      await this.showPassedToken(flags.token!, '--token');
      return;
    }
    if (source.kind === 'env') {
      await this.showPassedToken(process.env.PACHCA_TOKEN!, 'PACHCA_TOKEN');
      return;
    }

    if (source.kind === 'none') {
      outputError(
        {
          error: 'No active profile. Run: pachca auth login',
          type: 'PACHCA_USAGE_ERROR',
          code: null,
          hint: 'pachca auth login, or set PACHCA_TOKEN',
        },
        format,
      );
      this.exit(2);
    }

    const profileName = source.kind === 'profile' ? source.profileName : undefined;
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
        source: source.kind === 'profile' ? source.via : null,
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

  /**
   * A token passed to the command rather than saved in a profile. Nothing about it
   * is stored, so everything comes from the server: whose it is and what it carries.
   * A revoked token or no network ends the command with the usual error and hint.
   */
  private async showPassedToken(token: string, label: '--token' | 'PACHCA_TOKEN'): Promise<void> {
    // A PACHCA_TOKEN left in the environment silently wins over the profile the
    // person thinks they are using. Name that profile, so the mix-up is visible,
    // also when the forgotten token no longer works.
    const profileName = label === 'PACHCA_TOKEN' ? process.env.PACHCA_PROFILE || getActiveProfile() : undefined;
    const unusedProfile = profileName && listProfiles()[profileName] ? profileName : null;

    const clientFlags = { ...this.getClientFlags(), quiet: true };
    let info: TokenInfo;
    try {
      const response = await request({ method: 'GET', path: '/oauth/token/info', token }, clientFlags);
      info = (response.data as { data: TokenInfo }).data;
    } catch (error) {
      // A dead token (401) or one whose owner lost access (403 access_denied):
      // the profile it hides may still work, so say so.
      const dead =
        error instanceof ApiError &&
        (error.details.code === 401 || (error.details.code === 403 && error.details.validation_code === 'access_denied'));
      if (dead && unusedProfile) {
        const human = this.getOutputFormat() !== 'json' && process.stderr.isTTY;
        error.details.unused_profile = unusedProfile;
        error.details.hint = human
          ? `Профиль ${unusedProfile} не используется, пока задан PACHCA_TOKEN: уберите переменную или добавьте --profile ${unusedProfile}`
          : `unset PACHCA_TOKEN, or add --profile ${unusedProfile}`;
      }
      throw error;
    }

    const identity = await fetchIdentity(token, info.user_id, clientFlags);
    const type = identity.isBot === null ? null : identity.isBot ? 'bot' : 'user';
    const user = identity.isBot ? `${identity.name} (бот)` : identity.name;
    const scopes = info.scopes ?? [];
    // A CLI login or an app's token lives an hour from issue, and nothing renews a
    // token passed to the command. Other tokens have no lifetime at all.
    const expiresIn = info.expires_in ?? null;
    const issuedAt = info.created_at ? Date.parse(info.created_at) : Number.NaN;
    const expiresAt = expiresIn && !Number.isNaN(issuedAt) ? new Date(issuedAt + expiresIn * 1000) : null;

    if (this.getOutputFormat() === 'json') {
      this.output({
        profile: null,
        source: label,
        type,
        user,
        user_id: info.user_id,
        email: identity.email,
        auth: 'token',
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        expires_in: expiresIn,
        scopes,
        scopes_source: 'server',
        storage: null,
        secret_readable: true,
        unused_profile: unusedProfile,
      });
      return;
    }

    const emailStr = identity.email ? ` (${identity.email})` : '';
    const from = label === '--token' ? 'флага --token' : 'PACHCA_TOKEN';
    const typeStr =
      type ?? (identity.noScope ? 'бот или сотрудник: без права profile:read не узнать' : 'бот или сотрудник: профиль не прочитан');
    process.stderr.write(`  Подключён как: ${user}${emailStr}  [${typeStr}]\n`);
    if (expiresIn) {
      const minutesLeft = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / 60_000) : null;
      const left =
        minutesLeft === null ? `живёт ${Math.round(expiresIn / 60)} мин от выдачи` : minutesLeft > 0 ? `осталось ${minutesLeft} мин` : 'истёк';
      process.stderr.write(`  Вход: токеном из ${from}, ${left}, CLI его не продлевает\n`);
    } else {
      process.stderr.write(`  Вход: готовым токеном из ${from}\n`);
    }
    process.stderr.write(
      scopes.length
        ? `  Права по данным сервера (${scopes.length}): ${scopes.join(', ')}\n`
        : `  Права по данным сервера: ни одного\n`,
    );
    if (unusedProfile) {
      process.stderr.write(
        `  Профиль ${unusedProfile} не используется, пока задан PACHCA_TOKEN. Чтобы работать с ним, добавьте --profile ${unusedProfile} или уберите переменную.\n`,
      );
    }
  }

  /** Ask the server what the token really carries. Null when it cannot be asked. */
  private async fetchRemoteScopes(token: string): Promise<string[] | null> {
    try {
      const response = await request(
        { method: 'GET', path: '/oauth/token/info', token },
        { ...this.getClientFlags(), quiet: true },
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
