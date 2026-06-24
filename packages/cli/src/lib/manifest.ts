/**
 * D2 — single oclif.manifest.json parsing/normalization logic.
 *
 * Used by both the `introspect` command (runtime) and the build-time
 * commands.json emitter (scripts/emit-commands.ts) that feeds the docs
 * Commands page. One source of data (oclif.manifest.json), one parsing
 * logic — no second implementation in the docs component.
 */

export type ManifestCommands = Record<string, Record<string, unknown>>;

export interface NormalizedFlag {
  name: string;
  type: string;
  required: boolean;
  description: string;
  options?: unknown;
  maxLength?: number;
}

export interface NormalizedArg {
  name: string;
  required: boolean;
  description: string;
}

export interface CommandListEntry {
  command: string;
  summary: string;
  method: string | null;
  path: string | null;
  scope: string | null;
  plan: string | null;
}

export interface NormalizedCommand extends CommandListEntry {
  args?: NormalizedArg[];
  flags: NormalizedFlag[];
}

/** `pachca introspect` (no arg) — list every command with metadata. */
export function listCommandEntries(commands: ManifestCommands): CommandListEntry[] {
  return Object.entries(commands).map(([id, meta]) => ({
    command: `pachca ${id.replace(/:/g, ' ')}`,
    summary: (meta.summary || meta.description || '') as string,
    method: (meta.apiMethod || null) as string | null,
    path: (meta.apiPath || null) as string | null,
    scope: (meta.scope || null) as string | null,
    plan: (meta.plan || null) as string | null,
  }));
}

/** `pachca introspect <command>` — full metadata for one command. */
export function normalizeCommand(
  commandId: string,
  cmdMeta: Record<string, unknown>,
  baseFlagNames: Set<string>,
): NormalizedCommand {
  const requiredFlagNames = new Set((cmdMeta.requiredFlags as string[] | undefined) || []);

  const flagsMeta = cmdMeta.flags as Record<string, Record<string, unknown>> | undefined;
  const flags: NormalizedFlag[] = flagsMeta
    ? Object.entries(flagsMeta)
        .filter(([name]) => !baseFlagNames.has(name))
        .map(([name, meta]) => ({
          name,
          type: (meta.type || 'string') as string,
          required: requiredFlagNames.has(name),
          description: (meta.description || '') as string,
          ...(meta.options ? { options: meta.options } : {}),
          ...(meta.maxLength ? { maxLength: meta.maxLength as number } : {}),
        }))
    : [];

  const argsMeta = cmdMeta.args as Record<string, Record<string, unknown>> | undefined;
  const args: NormalizedArg[] = argsMeta
    ? Object.entries(argsMeta).map(([name, meta]) => ({
        name,
        required: (meta.required || false) as boolean,
        description: (meta.description || '') as string,
      }))
    : [];

  return {
    command: `pachca ${commandId.replace(/:/g, ' ')}`,
    summary: (cmdMeta.summary || cmdMeta.description || '') as string,
    method: (cmdMeta.apiMethod || null) as string | null,
    path: (cmdMeta.apiPath || null) as string | null,
    scope: (cmdMeta.scope || null) as string | null,
    plan: (cmdMeta.plan || null) as string | null,
    ...(args.length > 0 ? { args } : {}),
    flags,
  };
}

export interface CommandSection {
  section: string;
  commands: NormalizedCommand[];
}

/**
 * Group every command by its topic/section (the part before the first ':',
 * e.g. "messages:create" → "messages"; "doctor" → "doctor"). Used by the
 * build-time emitter for the docs Commands page.
 */
export function groupCommandsBySection(
  commands: ManifestCommands,
  baseFlagNames: Set<string>,
): CommandSection[] {
  // Collect backward-compat hidden aliases (old command ids kept working after an IA rename).
  // oclif registers them as resolvable command entries, but they must NOT appear in docs/help —
  // only the new canonical command names are shown.
  const hiddenAliasIds = new Set<string>();
  for (const meta of Object.values(commands)) {
    for (const a of (meta.hiddenAliases as string[] | undefined) ?? []) hiddenAliasIds.add(a);
  }

  const bySection = new Map<string, NormalizedCommand[]>();
  for (const [id, meta] of Object.entries(commands)) {
    if (hiddenAliasIds.has(id)) continue; // hidden backward-compat alias — keep it out of docs/help
    const section = id.includes(':') ? id.split(':')[0] : id;
    const normalized = normalizeCommand(id, meta, baseFlagNames);
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(normalized);
  }
  return [...bySection.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([section, cmds]) => ({ section, commands: cmds }));
}
