import { BaseCommand } from '../base-command.js';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: '+' | '-' | '~'; command: string; description: string }[];
}

export default class Changelog extends BaseCommand {
  static override description = 'История изменений CLI';

  static override examples = [
    '<%= config.bin %> changelog',
    '<%= config.bin %> changelog -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Changelog);
    this.parsedFlags = flags;

    let entries: ChangelogEntry[] = [];
    try {
      const data = await import('../data/changelog.json', { with: { type: 'json' } });
      entries = (data.default || data) as ChangelogEntry[];
    } catch {
      entries = [];
    }

    const format = this.getOutputFormat();

    if (format === 'json') {
      this.output(entries);
      return;
    }

    if (entries.length === 0) {
      process.stdout.write('Нет записей в changelog.\n');
      return;
    }

    for (const entry of entries) {
      process.stdout.write(`${entry.version}  (${entry.date})\n`);
      for (const change of entry.changes) {
        process.stdout.write(`  ${change.type} ${change.command.padEnd(30)} — ${change.description}\n`);
      }
      process.stdout.write('\n');
    }
  }
}
