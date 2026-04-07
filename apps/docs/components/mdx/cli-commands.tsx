import { generateNavigation } from '@/lib/navigation';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';
import type { EndpointRequirements } from '@/lib/openapi/types';

export async function CliCommands() {
  const [sections, api] = await Promise.all([generateNavigation(), parseOpenAPI()]);
  const methodsSection = sections.find((s) => s.title === 'Методы API');
  const allCommands = methodsSection
    ? methodsSection.items.flatMap((group) => group.children ?? [])
    : [];

  // Build a map from URL to requirements for tooltip data
  const requirementsMap = new Map<string, EndpointRequirements>();
  for (const ep of api.endpoints) {
    if (ep.requirements) {
      requirementsMap.set(generateUrlFromOperation(ep), ep.requirements);
    }
  }

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">
        <thead className="border-b border-glass-border">
          <tr>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Команда
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Метод API
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-divider">
          {allCommands.map((item) => {
            const command = `pachca ${item.href.replace(/^\/api\//, '').replace(/\//g, ' ')}`;
            const req = requirementsMap.get(item.href);
            return (
              <tr key={item.href}>
                <td className="py-5 pl-0! text-text-primary">
                  <CopyableInlineCode>{command}</CopyableInlineCode>
                </td>
                <td className="py-5 pl-0! text-text-primary">
                  <EndpointLink
                    method={item.method}
                    href={item.href}
                    scope={req?.scope}
                    scopeRoles={req?.scopeRoles?.join(',')}
                    plan={req?.plan}
                    noAuth={req?.auth === false}
                  >
                    {item.title}
                  </EndpointLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
