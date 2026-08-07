import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '..', 'oclif.manifest.json');
const commandsPath = path.join(__dirname, '..', 'src', 'data', 'commands.json');

/**
 * The docs command list (`src/data/commands.json`, rendered on /guides/cli/commands)
 * is produced from the oclif manifest by `emit-commands.ts`. Generation alone does
 * not guarantee the page shows everything: the emitter filters flags, and a filter
 * that is a little too wide drops real ones silently — the page still builds, still
 * looks complete, and a flag simply is not there.
 *
 * That happened: global flags are dropped by name, so `auth login --token`, which
 * redefines the global flag with its own meaning, vanished from the page while the
 * command kept accepting it.
 *
 * This guard compares the two sides. Every visible command and every visible flag
 * of the real CLI must appear in the docs data, and nothing may appear there that
 * the CLI does not have.
 */

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

const manifest = read(manifestPath);
const sections = read(commandsPath);

// Global flags are documented once in their own table. A command may redefine one
// with a different meaning — then it belongs on the command too, and the docs data
// must carry it.
const { BaseCommand } = await import('../dist/base-command.js');
const baseFlags = BaseCommand.baseFlags;
const baseFlagDescription = new Map(
  Object.entries(baseFlags).map(([name, def]) => [name, def?.description ?? '']),
);

const hiddenAliases = new Set();
for (const meta of Object.values(manifest.commands ?? {})) {
  for (const alias of meta.hiddenAliases ?? []) hiddenAliases.add(alias);
}

// The page stores the invocation (`pachca auth login`); the manifest keys by id
// (`auth:login`).
const idFromInvocation = (invocation) => invocation.replace(/^pachca\s+/, '').replace(/\s+/g, ':');

const documented = new Map();
for (const section of sections) {
  for (const command of section.commands) {
    documented.set(
      idFromInvocation(command.command),
      new Set((command.flags ?? []).map((f) => f.name)),
    );
  }
}

const errors = [];

for (const [id, meta] of Object.entries(manifest.commands ?? {})) {
  if (hiddenAliases.has(id) || meta.hidden) continue;

  const documentedFlags = documented.get(id);
  if (!documentedFlags) {
    errors.push(`команда \`${id}\` есть в CLI, но её нет на странице команд`);
    continue;
  }

  for (const [name, flag] of Object.entries(meta.flags ?? {})) {
    if (flag.hidden) continue;

    const globalDescription = baseFlagDescription.get(name);
    const isPlainGlobal =
      globalDescription !== undefined && (flag.description ?? '') === globalDescription;
    if (isPlainGlobal) continue;

    if (!documentedFlags.has(name)) {
      errors.push(`флаг \`--${name}\` команды \`${id}\` не попал на страницу команд`);
    }
  }
}

for (const id of documented.keys()) {
  if (!manifest.commands?.[id]) {
    errors.push(`команда \`${id}\` есть на странице команд, но её нет в CLI`);
  }
}

if (errors.length > 0) {
  console.error('[check-commands-coverage] страница команд разошлась с CLI:\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(
    '\nСтраница собирается из oclif.manifest.json через emit-commands.ts.' +
      '\nЗапустите `npx turbo build --filter=@pachca/cli` и проверьте фильтры в src/lib/manifest.ts.',
  );
  process.exit(1);
}

console.log(
  `[check-commands-coverage] ✓ страница команд совпадает с CLI (${documented.size} команд)`,
);
