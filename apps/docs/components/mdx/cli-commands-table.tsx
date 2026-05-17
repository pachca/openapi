'use client';

import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';

export interface ParamRow {
  token: string;
  type: string;
  required: boolean;
  description: string;
}

export interface CommandRow {
  command: string;
  href: string;
  method: string | null;
  summary: string;
  scope?: string;
  scopeRoles?: string;
  plan?: string;
  noAuth?: boolean;
  params: ParamRow[];
}

const TH =
  'text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!';

// Framed, self-contained panel. Two 50/50 columns mirroring the outer
// command table: left half = token + type, right half = description.
// No horizontal padding on the grid row, so the 50% boundary lines up
// with the outer table's second column ("Метод API").
function ParamsPanel({ params }: { params: ParamRow[] }) {
  return (
    <div className="my-2 rounded-xl border border-glass-border bg-glass backdrop-blur-md overflow-hidden text-[13px]">
      {params.map((p, i) => (
        <div
          key={p.token}
          className={`grid grid-cols-2 py-3 ${i > 0 ? 'border-t border-glass-border' : ''}`}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0 pl-5 pr-3">
            <span className="min-w-0 break-words text-text-primary">
              <CopyableInlineCode>{p.token}</CopyableInlineCode>
              {p.required ? <span className="text-method-delete font-bold ml-1">*</span> : null}
            </span>
            <span className="min-w-0 break-words text-text-secondary">{p.type}</span>
          </div>
          <div className="min-w-0 break-words text-text-secondary pr-4">{p.description}</div>
        </div>
      ))}
    </div>
  );
}

export function CliCommandsTable({ commands }: { commands: CommandRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    // overflow-x-auto + min-w: on small screens the table scrolls
    // horizontally (like the models page) instead of crushing columns.
    <div className="my-6 overflow-x-auto not-prose">
      {/* table-fixed + colgroup: opening a params panel never shifts the
          two columns of the command table. */}
      <table className="w-full min-w-[620px] table-fixed border-none text-[14px]">
        <colgroup>
          <col className="w-1/2" />
          <col className="w-1/2" />
        </colgroup>
        <thead className="border-b border-glass-border">
          <tr>
            <th className={TH}>Команда</th>
            <th className={TH}>Метод API</th>
          </tr>
        </thead>
        <tbody>
          {commands.map((c) => {
            const isOpen = !!open[c.command];
            const hasParams = c.params.length > 0;
            // Row separators come from the global `.prose td` border-bottom
            // (not cancelled by not-prose). Suppress it on an OPEN command
            // row so its panel attaches with no divider in between.
            return (
              <Fragment key={c.command}>
                <tr className={isOpen ? '[&>td]:!border-b-0' : ''}>
                  <td className="py-4 pl-0! pr-3 align-top text-text-primary">
                    <span className="inline-flex items-baseline gap-2">
                      {hasParams ? (
                        <button
                          type="button"
                          onClick={() => setOpen((o) => ({ ...o, [c.command]: !o[c.command] }))}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? 'Скрыть параметры' : 'Показать параметры'}
                          className="shrink-0 self-center flex items-center justify-center cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-text-secondary hover:text-text-primary transition-all duration-200 ${
                              isOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                            strokeWidth={2.5}
                          />
                        </button>
                      ) : (
                        <span className="inline-block w-3.5 shrink-0" />
                      )}
                      <CopyableInlineCode>{c.command}</CopyableInlineCode>
                    </span>
                  </td>
                  <td className="py-4 pl-0! align-top text-text-primary break-words">
                    {c.method ? (
                      <EndpointLink
                        method={c.method}
                        href={c.href}
                        scope={c.scope}
                        scopeRoles={c.scopeRoles}
                        plan={c.plan}
                        noAuth={c.noAuth}
                      >
                        {c.summary}
                      </EndpointLink>
                    ) : (
                      <span className="text-text-secondary">{c.summary}</span>
                    )}
                  </td>
                </tr>
                {isOpen && hasParams ? (
                  <tr>
                    <td colSpan={2} className="!px-0 !pt-0 !pb-4">
                      <ParamsPanel params={c.params} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
