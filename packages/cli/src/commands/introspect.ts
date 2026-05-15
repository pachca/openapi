import * as fs from 'node:fs';
import * as path from 'node:path';
import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command.js';
import { listCommandEntries, normalizeCommand, type ManifestCommands } from '../lib/manifest.js';

export default class Introspect extends BaseCommand {
  static override description = 'Метаданные команды в машиночитаемом формате';

  static override examples = [
    '<%= config.bin %> introspect messages create',
    '<%= config.bin %> introspect',
  ];

  static override strict = false;

  static override args = {
    command: Args.string({
      description: 'Command name (e.g., "messages create")',
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(Introspect);
    this.parsedFlags = flags;

    // Load oclif manifest
    let manifest: Record<string, unknown> = {};
    try {
      const manifestPath = path.join(this.config.root, 'oclif.manifest.json');
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      }
    } catch {
      // Empty manifest
    }

    const commands = (manifest.commands || {}) as ManifestCommands;
    const commandArgs = argv as string[];
    const commandId = commandArgs.join(':');

    if (!commandId) {
      // List all commands with metadata
      this.output(listCommandEntries(commands));
      return;
    }

    // Single command introspection
    const cmdMeta = commands[commandId];
    if (!cmdMeta) {
      this.validationError(
        [{ message: `Command not found: ${commandArgs.join(' ')}` }],
        { hint: 'pachca introspect', type: 'PACHCA_COMMAND_NOT_FOUND' },
      );
    }

    // D3 single source: baseFlagNames derived from BaseCommand.baseFlags
    const baseFlagNames = new Set(Object.keys(BaseCommand.baseFlags));
    this.output(normalizeCommand(commandId, cmdMeta, baseFlagNames));
  }
}
