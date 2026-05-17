import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getCliSections, type CliCommand } from '@/lib/cli-data';
import {
  CliCommandsTable,
  type CommandRow,
  type ParamRow,
} from '@/components/mdx/cli-commands-table';
import type { EndpointRequirements } from '@/lib/openapi/types';

function commandHref(command: string): string {
  // "pachca messages create" → "/api/messages/create"
  return '/api/' + command.replace(/^pachca\s+/, '').replace(/\s+/g, '/');
}

function paramRows(cmd: CliCommand): ParamRow[] {
  return [
    ...(cmd.args ?? []).map((a) => ({
      token: `<${a.name}>`,
      type: 'аргумент',
      required: a.required,
      description: a.description,
    })),
    ...cmd.flags.map((f) => ({
      token: `--${f.name}`,
      type: f.options ? f.options.join(' | ') : f.type === 'boolean' ? 'boolean' : 'string',
      required: f.required,
      description: f.description,
    })),
  ];
}

export async function CliCommands() {
  const [sections, api] = await Promise.all([Promise.resolve(getCliSections()), parseOpenAPI()]);

  const requirementsMap = new Map<string, EndpointRequirements>();
  for (const ep of api.endpoints) {
    if (ep.requirements) {
      requirementsMap.set(generateUrlFromOperation(ep), ep.requirements);
    }
  }

  // Flat list (single table, as it was) — section data kept only for ordering.
  const commands: CommandRow[] = sections.flatMap((s) =>
    s.commands.map((cmd) => {
      const href = commandHref(cmd.command);
      const req = requirementsMap.get(href);
      return {
        command: cmd.command,
        href,
        method: cmd.method,
        summary: cmd.summary,
        scope: req?.scope,
        scopeRoles: req?.scopeRoles?.join(','),
        plan: req?.plan,
        noAuth: req?.auth === false,
        params: paramRows(cmd),
      };
    })
  );

  return <CliCommandsTable commands={commands} />;
}
