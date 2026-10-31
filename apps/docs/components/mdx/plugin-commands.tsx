import { CliCommandsTable, type CommandRow } from '@/components/mdx/cli-commands-table';
import { PLUGIN_COMMANDS } from '@/lib/plugin-commands';

// Таблица команд плагина в том же виде, что команды CLI: структура команды,
// раздел страницы и раскрывающиеся части команды.
export function PluginCommands() {
  const commands: CommandRow[] = PLUGIN_COMMANDS.map((c) => ({
    command: c.usage,
    href: `#${c.anchor}`,
    method: null,
    title: c.title,
    summary: c.summary,
    params: c.args.map((a) => ({
      token: a.token,
      type: 'аргумент',
      required: a.required,
      description: a.description,
    })),
  }));

  return <CliCommandsTable commands={commands} headers={['Команда', 'Что делает']} />;
}
