/**
 * Loaders for generated Pachca CLI data files.
 *
 * These JSON files are produced by packages/cli/scripts/generate-cli.ts from
 * the single source of truth (BaseCommand.baseFlags). The docs read them via
 * a cwd-relative path — the same pattern lib/openapi/parser.ts uses for
 * packages/spec/openapi.yaml. No cross-package TS import.
 */
import * as fs from 'fs';
import * as path from 'path';

const CLI_DATA_DIR = path.join(process.cwd(), '..', '..', 'packages', 'cli', 'src', 'data');

export interface GlobalFlag {
  name: string;
  char?: string;
  type: 'boolean' | 'string';
  description: string;
  options?: string[];
  hidden: boolean;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(CLI_DATA_DIR, file), 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

/** Visible global flags (hidden ones excluded). */
export function getGlobalFlags(): GlobalFlag[] {
  return readJson<GlobalFlag[]>('global-flags.json', []).filter((f) => !f.hidden);
}

export interface CommandFlag {
  name: string;
  type: string;
  required: boolean;
  description: string;
  options?: string[];
}

export interface CommandArg {
  name: string;
  required: boolean;
  description: string;
}

export interface CliCommand {
  command: string;
  summary: string;
  method: string | null;
  path: string | null;
  scope: string | null;
  plan: string | null;
  args?: CommandArg[];
  flags: CommandFlag[];
}

export interface CliSection {
  section: string;
  commands: CliCommand[];
}

/**
 * All CLI commands grouped by section — generated from oclif.manifest.json
 * via the shared src/lib/manifest.ts normalization (same logic as
 * `pachca introspect`).
 */
export function getCliSections(): CliSection[] {
  return readJson<CliSection[]>('commands.json', []);
}
