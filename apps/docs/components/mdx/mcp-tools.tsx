import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateTitle, generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getMcpToolGroups, MCP_ACTION_LABELS } from '@/lib/mcp-data';
import { McpToolsTable, type McpToolRow } from './mcp-tools-table';

/**
 * Every tool of the MCP server in one table, in the order of the API sidebar:
 * the tool name, the method it calls (with its scope, roles and plan in the
 * link's popover), who gets the tool and whether it reads or changes data, with
 * a search and filters by action and role.
 * Source: the manifest packages/spec/mcp-manifest.json.
 */
export async function McpTools() {
  const api = await parseOpenAPI();
  const endpoints = new Map(api.endpoints.map((ep) => [`${ep.method} ${ep.path}`, ep]));
  const rows: McpToolRow[] = getMcpToolGroups(
    (operation) => endpoints.get(operation)?.tags[0]
  ).flatMap((group) =>
    group.tools.map((tool) => {
      const ep = endpoints.get(tool.operation);
      return {
        name: tool.name,
        method: tool.method,
        title: ep ? generateTitle(ep) : tool.operation,
        operation: tool.operation,
        href: ep ? generateUrlFromOperation(ep) : undefined,
        scope: tool.scope,
        plan: tool.plan,
        roles: tool.roles,
        audience: tool.audience,
        action: tool.action,
        actionLabel: MCP_ACTION_LABELS[tool.action],
        area: group.title,
      };
    })
  );

  return <McpToolsTable rows={rows} />;
}
