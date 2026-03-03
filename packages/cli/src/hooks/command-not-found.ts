import { Hook } from '@oclif/core';
import { levenshtein, defaultOutputFormat } from '../utils.js';
import { outputError } from '../output.js';

const hook: Hook<'command_not_found'> = async function (opts) {
  const commandId = opts.id;
  const format = defaultOutputFormat();

  // Try to load alternatives from bundled data
  let alternatives: Record<string, string> = {};
  try {
    const data = await import('../data/alternatives.json', { with: { type: 'json' } });
    alternatives = data.default || data;
  } catch {
    // No alternatives data — just show basic error
  }

  // Find similar commands
  const allCommands = Object.keys(alternatives);
  const suggestions = allCommands
    .map((cmd) => ({ cmd, distance: levenshtein(commandId, cmd) }))
    .filter(({ distance }) => distance <= 3)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ cmd }) => ({
      command: `pachca ${cmd.replace(/:/g, ' ')}`,
      description: alternatives[cmd] || '',
    }));

  if (format === 'json' || !process.stderr.isTTY) {
    const errorObj = {
      error: 'Command not found' as const,
      code: null as null,
      type: 'PACHCA_COMMAND_NOT_FOUND' as const,
      command: commandId,
      ...(suggestions.length > 0 ? { suggestions: suggestions.map((s) => s.command) } : {}),
    };
    outputError(errorObj, 'json');
  } else {
    process.stderr.write(`✗ Команда не найдена: ${commandId.replace(/:/g, ' ')}\n`);

    if (suggestions.length > 0) {
      process.stderr.write(`\n  Возможно, вы имели в виду:\n`);
      for (const s of suggestions) {
        const desc = s.description ? ` — ${s.description}` : '';
        process.stderr.write(`    ${s.command}${desc}\n`);
      }
    }

    process.stderr.write(`\n  Все команды: pachca commands\n`);
    process.stderr.write(`  Помощь по сценариям: pachca guide\n`);
  }

  process.exit(2);
};

export default hook;
