import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command.js';

interface WorkflowStep {
  description: string;
  command?: string;
}

interface Workflow {
  title: string;
  skill: string;
  steps: WorkflowStep[];
}

export default class Guide extends BaseCommand {
  static override description = 'Поиск сценариев использования';

  static override examples = [
    '<%= config.bin %> guide "отправить файл"',
    '<%= config.bin %> guide "создать бота"',
    '<%= config.bin %> guide',
  ];

  static override args = {
    query: Args.string({
      description: 'Search query',
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Guide);
    this.parsedFlags = flags;

    let workflows: Workflow[] = [];
    try {
      const data = await import('../data/workflows.json', { with: { type: 'json' } });
      workflows = (data.default || data) as Workflow[];
    } catch {
      workflows = [];
    }

    const format = this.getOutputFormat();

    if (!args.query) {
      // List all workflows grouped by skill
      const grouped = new Map<string, Workflow[]>();
      for (const w of workflows) {
        if (!grouped.has(w.skill)) grouped.set(w.skill, []);
        grouped.get(w.skill)!.push(w);
      }

      if (format === 'json') {
        this.output(workflows);
        return;
      }

      if (workflows.length === 0) {
        process.stderr.write('Нет доступных сценариев.\n');
        return;
      }

      for (const [skill, items] of grouped) {
        process.stdout.write(`  ${skill}  (${items.length} сценариев)\n`);
        for (const w of items) {
          process.stdout.write(`    · ${w.title}\n`);
        }
        process.stdout.write('\n');
      }
      return;
    }

    // Search workflows
    const query = args.query.toLowerCase();
    const matches = workflows.filter((w) => {
      if (w.title.toLowerCase().includes(query)) return true;
      return w.steps.some(
        (s) =>
          s.description.toLowerCase().includes(query) ||
          (s.command && s.command.toLowerCase().includes(query)),
      );
    });

    if (format === 'json') {
      this.output(matches);
      return;
    }

    if (matches.length === 0) {
      process.stderr.write(`Ничего не найдено по запросу "${args.query}".\n`);
      process.stderr.write(`Все сценарии: pachca guide\n`);
      return;
    }

    for (const w of matches) {
      process.stdout.write(`  Сценарий: ${w.title}  (${w.skill})\n\n`);
      for (let i = 0; i < w.steps.length; i++) {
        const step = w.steps[i];
        if (step.command) {
          process.stdout.write(`  ${i + 1}. $ ${step.command}\n`);
        } else {
          process.stdout.write(`  ${i + 1}. ${step.description}\n`);
        }
      }
      process.stdout.write('\n');
    }
  }
}
