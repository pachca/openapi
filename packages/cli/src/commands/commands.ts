import { Flags } from '@oclif/core';
import { BaseCommand } from '../base-command.js';
import { resolveToken, TokenNotFoundError } from '../profiles.js';
import { request } from '../client.js';

export default class Commands extends BaseCommand {
  static override description = 'Список всех команд';

  static override examples = [
    '<%= config.bin %> commands',
    '<%= config.bin %> commands --available',
    '<%= config.bin %> commands --available -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    available: Flags.boolean({
      description: 'Show only commands available to current token',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Commands);
    this.parsedFlags = flags;

    const format = this.getOutputFormat();
    const allCommands = this.config.commands;

    // Get all generated command data
    const commandList = allCommands
      .filter((cmd) => !cmd.hidden)
      .map((cmd) => {
        const meta = cmd as unknown as {
          scope?: string;
          plan?: string;
          apiMethod?: string;
          apiPath?: string;
        };
        return {
          command: `pachca ${cmd.id.replace(/:/g, ' ')}`,
          id: cmd.id,
          summary: cmd.summary || cmd.description || '',
          scope: meta.scope || null,
          plan: meta.plan || null,
        };
      })
      .sort((a, b) => a.command.localeCompare(b.command));

    if (!flags.available) {
      this.output(commandList.map(({ command, summary }) => ({ command, summary })));
      return;
    }

    // --available: check token scopes via API
    let tokenScopes: string[] = [];
    try {
      const { token } = resolveToken({ token: flags.token, profile: flags.profile });

      const response = await request(
        { method: 'GET', path: '/oauth/token/info', token },
        { quiet: true },
      );
      const wrapper = response.data as { data: { scopes: string[] } };
      tokenScopes = wrapper.data.scopes || [];
    } catch (error) {
      if (error instanceof TokenNotFoundError) {
        process.stderr.write('⚠ Нет активного токена — показаны все команды\n');
      }
    }

    const entries = commandList
      .filter((cmd) => !cmd.scope || tokenScopes.includes(cmd.scope))
      .map((cmd) => ({
        command: cmd.command,
        summary: cmd.summary,
        scope: cmd.scope,
        plan: cmd.plan,
      }));

    this.output(entries);
  }
}
