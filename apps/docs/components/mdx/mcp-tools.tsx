import { Fragment } from 'react';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateTitle, generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getMcpToolGroups, MCP_ACTION_LABELS } from '@/lib/mcp-data';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';

const TH =
  'text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!';

/**
 * Every tool of the MCP server, grouped by the area of the API it belongs to:
 * the tool name, the method it calls (with its scope, roles and plan in the
 * link's popover), who gets the tool and whether it reads or changes data.
 * Source: the manifest packages/spec/mcp-manifest.json.
 */
export async function McpTools() {
  const api = await parseOpenAPI();
  const endpoints = new Map(api.endpoints.map((ep) => [`${ep.method} ${ep.path}`, ep]));
  const groups = getMcpToolGroups((operation) => endpoints.get(operation)?.tags[0]);

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full min-w-[480px] table-fixed border-none text-[14px]">
        <colgroup>
          <col className="w-[54%]" />
          <col className="w-[26%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead className="border-b border-glass-border">
          <tr>
            <th className={TH}>Инструмент и метод API</th>
            <th className={TH}>Кому доступен</th>
            <th className={TH}>Действие</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.tag}>
              <tr>
                <td
                  colSpan={3}
                  className="pt-6! pb-2! pl-0! text-[13px] font-semibold uppercase tracking-wide text-text-secondary"
                >
                  {group.title}
                </td>
              </tr>
              {group.tools.map((tool) => {
                const ep = endpoints.get(tool.operation);
                return (
                  <tr key={tool.name}>
                    <td className="py-3 pl-0! pr-3 align-top text-text-primary break-words">
                      <CopyableInlineCode>{tool.name}</CopyableInlineCode>
                      <div className="mt-1.5">
                        <EndpointLink
                          method={tool.method}
                          href={ep ? generateUrlFromOperation(ep) : undefined}
                          scope={tool.scope}
                          roles={tool.roles.join(',')}
                          plan={tool.plan}
                        >
                          {ep ? generateTitle(ep) : tool.operation}
                        </EndpointLink>
                      </div>
                    </td>
                    <td className="py-3 pl-0! pr-3 align-top text-text-secondary">
                      {tool.audience}
                    </td>
                    <td className="py-3 pl-0! align-top text-text-secondary">
                      {MCP_ACTION_LABELS[tool.action]}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
