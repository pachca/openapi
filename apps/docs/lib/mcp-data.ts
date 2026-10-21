/**
 * Loader for the MCP tool manifest built by packages/spec/scripts/generate-mcp-manifest.ts.
 *
 * The docs read it through a cwd-relative path, the same pattern lib/cli-data.ts
 * uses for the CLI data files. No cross-package TS import.
 */
import * as fs from 'fs';
import * as path from 'path';
import { TAG_TRANSLATIONS } from './tag-translations';
import { SCOPE_ROLE_LABELS, type ScopeRole } from './scope-roles';

const MANIFEST_PATH = path.join(process.cwd(), '..', '..', 'packages', 'spec', 'mcp-manifest.json');

interface ManifestTool {
  name: string;
  title: string;
  operation: string;
  kind: 'read' | 'write';
  scope?: string;
  plan?: string;
  roles?: string[];
  bot_token_only?: boolean;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
}

interface McpManifest {
  tools: ManifestTool[];
}

export interface McpTool {
  name: string;
  /** «GET /chats/{id}» */
  operation: string;
  method: string;
  scope?: string;
  plan?: string;
  roles: string[];
  /** Кому доступен: «Все», «Все, кроме бота», «Владелец на «Корпорации»» */
  audience: string;
  /** Чтение, изменение или опасное изменение, как его помечает сервер */
  action: 'read' | 'write' | 'destructive';
}

export interface McpToolGroup {
  /** Тег спеки, по которому сгруппированы методы API */
  tag: string;
  title: string;
  tools: McpTool[];
}

function readManifest(): McpManifest | null {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as McpManifest;
  } catch {
    return null;
  }
}

function actionOf(tool: ManifestTool): McpTool['action'] {
  if (tool.annotations?.readOnlyHint) return 'read';
  return tool.annotations?.destructiveHint ? 'destructive' : 'write';
}

const PLAN_LABELS: Record<string, string> = { corporation: 'Корпорации' };

/**
 * Who gets the tool, in words: the roles of the workspace plus the bot token.
 * Owner, admin and user together read as «Все», less whoever is missing.
 */
function audienceOf(roles: string[], plan?: string): string {
  if (roles.length === 1 && roles[0] === 'bot') return 'Только бот';
  let label: string;
  if (['owner', 'admin', 'user'].every((r) => roles.includes(r))) {
    const missing = [
      ...(roles.includes('multi_guest') ? [] : ['мульти-гостя']),
      ...(roles.includes('bot') ? [] : ['бота']),
    ];
    label = missing.length ? `Все, кроме ${missing.join(' и ')}` : 'Все';
  } else {
    const names = roles
      .map((r) => SCOPE_ROLE_LABELS[r as ScopeRole]?.toLowerCase() ?? r)
      .join(', ');
    label = names.charAt(0).toUpperCase() + names.slice(1);
  }
  return plan ? `${label} на «${PLAN_LABELS[plan] ?? plan}»` : label;
}

export const MCP_ACTION_LABELS: Record<McpTool['action'], string> = {
  read: 'Чтение',
  write: 'Изменение',
  destructive: 'Опасное изменение',
};

/**
 * The tools of the manifest grouped by the spec tag of the method each one
 * calls, in the order of the API sidebar. `tagOf` maps «METHOD /path» to that tag.
 */
export function getMcpToolGroups(tagOf: (operation: string) => string | undefined): McpToolGroup[] {
  const manifest = readManifest();
  if (!manifest) return [];
  const groups = new Map<string, McpTool[]>();
  for (const tool of manifest.tools) {
    const [method] = tool.operation.split(' ');
    const tag = tagOf(tool.operation) ?? 'Общее';
    const roles = tool.bot_token_only ? ['bot'] : (tool.roles ?? []);
    const row: McpTool = {
      name: tool.name,
      operation: tool.operation,
      method: method!,
      scope: tool.scope,
      plan: tool.plan,
      roles,
      audience: audienceOf(roles, tool.plan),
      action: actionOf(tool),
    };
    groups.set(tag, [...(groups.get(tag) ?? []), row]);
  }
  const order = Object.keys(TAG_TRANSLATIONS);
  return [...groups.entries()]
    .sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    })
    .map(([tag, tools]) => ({ tag, title: TAG_TRANSLATIONS[tag] ?? tag, tools }));
}
