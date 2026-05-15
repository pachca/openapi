import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getCliSections, type CliCommand } from '@/lib/cli-data';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';
import type { EndpointRequirements } from '@/lib/openapi/types';

function commandHref(command: string): string {
  // "pachca messages create" → "/api/messages/create"
  return '/api/' + command.replace(/^pachca\s+/, '').replace(/\s+/g, '/');
}

function FlagsArgs({ cmd }: { cmd: CliCommand }) {
  const rows = [
    ...(cmd.args ?? []).map((a) => ({
      token: `<${a.name}>`,
      type: 'аргумент',
      required: a.required,
      description: a.description,
    })),
    ...cmd.flags.map((f) => ({
      token: `--${f.name}`,
      type: f.options ? f.options.join(' | ') : f.type === 'boolean' ? 'boolean' : 'string',
      required: f.required,
      description: f.description,
    })),
  ];
  if (rows.length === 0) return null;
  return (
    <table className="w-full border-none text-[13px] mt-2 mb-1">
      <tbody className="divide-y divide-glass-divider">
        {rows.map((r) => (
          <tr key={r.token}>
            <td className="py-2 pl-0! align-top whitespace-nowrap text-text-primary">
              <CopyableInlineCode>{r.token}</CopyableInlineCode>
              {r.required ? <span className="text-danger ml-1">*</span> : null}
            </td>
            <td className="py-2 align-top whitespace-nowrap text-text-secondary pr-4">{r.type}</td>
            <td className="py-2 pl-0! align-top text-text-secondary">{r.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export async function CliCommands() {
  const [sections, api] = await Promise.all([Promise.resolve(getCliSections()), parseOpenAPI()]);

  const requirementsMap = new Map<string, EndpointRequirements>();
  for (const ep of api.endpoints) {
    if (ep.requirements) {
      requirementsMap.set(generateUrlFromOperation(ep), ep.requirements);
    }
  }

  return (
    <div className="my-6 not-prose">
      {sections.map((section) => (
        <section key={section.section} className="mb-10">
          <h3 className="text-[15px] font-semibold text-text-primary mb-3 font-mono">
            {section.section}
          </h3>
          <div className="space-y-5">
            {section.commands.map((cmd) => {
              const href = commandHref(cmd.command);
              const req = requirementsMap.get(href);
              return (
                <div key={cmd.command}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <CopyableInlineCode>{cmd.command}</CopyableInlineCode>
                    {cmd.method ? (
                      <EndpointLink
                        method={cmd.method}
                        href={href}
                        scope={req?.scope}
                        scopeRoles={req?.scopeRoles?.join(',')}
                        plan={req?.plan}
                        noAuth={req?.auth === false}
                      >
                        {cmd.summary}
                      </EndpointLink>
                    ) : (
                      <span className="text-text-secondary text-[14px]">{cmd.summary}</span>
                    )}
                  </div>
                  <FlagsArgs cmd={cmd} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
