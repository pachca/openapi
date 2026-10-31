'use client';

import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';
import { InlineCodeText } from '@/components/api/inline-code-text';

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
  /** Кто может вызвать метод, через запятую */
  roles?: string;
  plan?: string;
  noAuth?: boolean;
  /** Without `method`: a link title to `href`, with `summary` under it */
  title?: string;
  params: ParamRow[];
}

const TH =
  'text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!';

// Framed, self-contained panel. Two columns mirroring the outer command
// table: token + type on the left, description on the right. The split is
// the table's own, and the grid row has no horizontal padding, so the
// boundary lines up with the outer table's second column.
function ParamsPanel({ params, split }: { params: ParamRow[]; split: number }) {
  return (
    <div className="my-2 rounded-xl border border-glass-border bg-glass backdrop-blur-md overflow-hidden text-[13px]">
      {params.map((p, i) => (
        <div
          key={p.token}
          className={`grid py-3 ${i > 0 ? 'border-t border-glass-border' : ''}`}
          style={{ gridTemplateColumns: `${split}% 1fr` }}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0 pl-5 pr-3">
            <span className="min-w-0 break-words text-text-primary">
              <CopyableInlineCode>{p.token}</CopyableInlineCode>
              {p.required ? <span className="text-method-delete font-bold ml-1">*</span> : null}
            </span>
            <span className="min-w-0 break-words text-text-secondary">{p.type}</span>
          </div>
          <div className="min-w-0 break-words text-text-secondary pr-4">
            <InlineCodeText text={p.description} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CliCommandsTable({
  commands,
  headers = ['Команда', 'Метод API'],
  commandWidth = 50,
}: {
  commands: CommandRow[];
  headers?: [string, string];
  /** Width of the command column in percent; the other column takes the rest. */
  commandWidth?: number;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    // overflow-x-auto + min-w: on small screens the table scrolls
    // horizontally (like the models page) instead of crushing columns.
    <div className="my-6 overflow-x-auto not-prose">
      {/* table-fixed + colgroup: opening a params panel never shifts the
          two columns of the command table. */}
      <table className="w-full min-w-[620px] table-fixed border-none text-[14px]">
        <colgroup>
          <col style={{ width: `${commandWidth}%` }} />
          <col />
        </colgroup>
        <thead className="border-b border-glass-border">
          <tr>
            <th className={TH}>{headers[0]}</th>
            <th className={TH}>{headers[1]}</th>
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
                    <span className="flex min-w-0 items-baseline gap-2">
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
                      {/* A long command (plugin commands with their parts) wraps at
                          spaces inside its chip instead of running into the next column. */}
                      <CopyableInlineCode className="min-w-0 whitespace-normal! break-words">
                        {c.command}
                      </CopyableInlineCode>
                    </span>
                  </td>
                  <td className="py-4 pl-0! align-top text-text-primary break-words">
                    {c.method ? (
                      <EndpointLink
                        method={c.method}
                        href={c.href}
                        scope={c.scope}
                        roles={c.roles}
                        plan={c.plan}
                        noAuth={c.noAuth}
                      >
                        {c.summary}
                      </EndpointLink>
                    ) : c.title ? (
                      <>
                        <a
                          href={c.href}
                          className="font-semibold text-text-primary underline underline-offset-[3px] decoration-1 decoration-current/30 hover:decoration-current hover:decoration-[1.5px] transition-all"
                        >
                          {c.title}
                        </a>
                        <div className="mt-1 text-text-secondary">{c.summary}</div>
                      </>
                    ) : (
                      <span className="text-text-secondary">{c.summary}</span>
                    )}
                  </td>
                </tr>
                {isOpen && hasParams ? (
                  <tr>
                    <td colSpan={2} className="!px-0 !pt-0 !pb-4">
                      <ParamsPanel params={c.params} split={commandWidth} />
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
