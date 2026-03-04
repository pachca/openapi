import * as fs from 'node:fs';
import * as path from 'node:path';
import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command.js';

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

    const commands = (manifest.commands || {}) as Record<string, Record<string, unknown>>;
    const commandArgs = argv as string[];
    const commandId = commandArgs.join(':');

    if (!commandId) {
      // List all commands with metadata
      const entries = Object.entries(commands).map(([id, meta]) => ({
        command: `pachca ${id.replace(/:/g, ' ')}`,
        summary: meta.summary || meta.description || '',
        method: meta.apiMethod || null,
        path: meta.apiPath || null,
        scope: meta.scope || null,
        plan: meta.plan || null,
      }));
      this.output(entries);
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

    const baseFlagNames = new Set(['output', 'columns', 'no-header', 'no-truncate', 'profile', 'token', 'quiet', 'no-color', 'verbose', 'no-input', 'dry-run', 'timeout', 'no-retry', 'json']);
    const requiredFlagNames = new Set((cmdMeta.requiredFlags as string[] | undefined) || []);

    const flagsMeta = cmdMeta.flags as Record<string, Record<string, unknown>> | undefined;
    const flagEntries = flagsMeta
      ? Object.entries(flagsMeta)
        .filter(([name]) => !baseFlagNames.has(name))
        .map(([name, meta]) => ({
          name,
          type: meta.type || 'string',
          required: requiredFlagNames.has(name),
          description: meta.description || '',
          ...(meta.options ? { options: meta.options } : {}),
          ...(meta.maxLength ? { maxLength: meta.maxLength } : {}),
        }))
      : [];

    const argsMeta = cmdMeta.args as Record<string, Record<string, unknown>> | undefined;
    const argEntries = argsMeta
      ? Object.entries(argsMeta).map(([name, meta]) => ({
        name,
        required: meta.required || false,
        description: meta.description || '',
      }))
      : [];

    const result = {
      command: `pachca ${commandId.replace(/:/g, ' ')}`,
      summary: cmdMeta.summary || cmdMeta.description || '',
      method: cmdMeta.apiMethod || null,
      path: cmdMeta.apiPath || null,
      scope: cmdMeta.scope || null,
      plan: cmdMeta.plan || null,
      ...(argEntries.length > 0 ? { args: argEntries } : {}),
      flags: flagEntries,
    };

    this.output(result);
  }
}
