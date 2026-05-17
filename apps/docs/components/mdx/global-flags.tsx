import { getGlobalFlags } from '@/lib/cli-data';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';

/**
 * Global CLI flags table — single source of truth: packages/cli
 * src/data/global-flags.json (generated from BaseCommand.baseFlags).
 * Replaces hardcoded RU flag tables in the guide and README.
 */
export function GlobalFlags() {
  const flags = getGlobalFlags();

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">
        <thead className="border-b border-glass-border">
          <tr>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Флаг
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Короткий
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Описание
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-divider">
          {flags.map((f) => (
            <tr key={f.name}>
              <td className="py-4 pl-0! text-text-primary">
                <CopyableInlineCode>
                  {f.type === 'boolean' ? `--${f.name}` : `--${f.name} <value>`}
                </CopyableInlineCode>
              </td>
              <td className="py-4 pl-0! text-text-secondary">
                {f.char ? <CopyableInlineCode>{`-${f.char}`}</CopyableInlineCode> : null}
              </td>
              <td className="py-4 pl-0! text-text-primary">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
