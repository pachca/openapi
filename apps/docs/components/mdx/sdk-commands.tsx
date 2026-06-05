import { parseOpenAPI } from '@/lib/openapi/parser';
import { groupEndpointsByTag, generateUrlFromOperation, generateTitle } from '@/lib/openapi/mapper';
import { sortTagsByOrder } from '@/lib/guides-config';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';
import type { EndpointRequirements } from '@/lib/openapi/types';

const METHOD_ORDER: Record<string, number> = { POST: 0, GET: 1, PUT: 2, PATCH: 3, DELETE: 4 };

type SdkLanguage = 'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp';

/** Tag name → service property: "Group tags" → "groupTags" */
function tagToProperty(tag: string): string {
  const words = tag.split(/\s+/);
  return words
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');
}

/** "ChatOperations_listChats" → "listChats" */
function operationToMethod(operationId: string): string {
  const parts = operationId.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : parts[0];
}

/** camelCase → snake_case */
function camelToSnake(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/** camelCase → PascalCase */
function camelToPascal(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatMethodCall(tag: string, operationId: string, lang: SdkLanguage): string {
  const service = tagToProperty(tag);
  const method = operationToMethod(operationId);

  switch (lang) {
    case 'python':
      return `client.${camelToSnake(service)}.${camelToSnake(method)}()`;
    case 'go':
      return `client.${camelToPascal(service)}.${camelToPascal(method)}()`;
    case 'csharp':
      return `client.${camelToPascal(service)}.${camelToPascal(method)}Async()`;
    default:
      return `client.${service}.${method}()`;
  }
}

interface SdkCommandsProps {
  lang: SdkLanguage;
}

export async function SdkCommands({ lang }: SdkCommandsProps) {
  const api = await parseOpenAPI();
  const grouped = groupEndpointsByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  const rows: Array<{
    sdkCall: string;
    method: string;
    href: string;
    title: string;
    requirements?: EndpointRequirements;
  }> = [];

  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    endpoints.sort((a, b) => (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99));

    for (const endpoint of endpoints) {
      rows.push({
        sdkCall: formatMethodCall(tag, endpoint.id, lang),
        method: endpoint.method,
        href: generateUrlFromOperation(endpoint),
        title: generateTitle(endpoint),
        requirements: endpoint.requirements,
      });
    }
  }

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">
        <thead className="border-b border-glass-border">
          <tr>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Метод
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Метод API
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-divider">
          {rows.map((row) => (
            <tr key={row.href}>
              <td className="py-5 pl-0! text-text-primary">
                <CopyableInlineCode>{row.sdkCall}</CopyableInlineCode>
              </td>
              <td className="py-5 pl-0! text-text-primary">
                <EndpointLink
                  method={row.method}
                  href={row.href}
                  scope={row.requirements?.scope}
                  scopeRoles={row.requirements?.scopeRoles?.join(',')}
                  plan={row.requirements?.plan}
                  noAuth={row.requirements?.auth === false}
                >
                  {row.title}
                </EndpointLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
