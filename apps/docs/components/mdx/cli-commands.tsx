import Link from 'next/link';
import { generateNavigation } from '@/lib/navigation';

export async function CliCommands() {
  const sections = await generateNavigation();
  const allCommands = sections.filter((s) => s.items[0]?.method != null).flatMap((s) => s.items);

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">
        <thead className="border-b border-background-border">
          <tr>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Команда
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Описание
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-background-border/40">
          {allCommands.map((item) => {
            const command = `pachca ${item.href.slice(1).replace(/\//g, ' ')}`;
            return (
              <tr key={item.href}>
                <td className="py-5 pl-0! text-text-primary">
                  <Link href={item.href} className="no-underline!">
                    <code className="bg-background-secondary border border-background-border px-1 py-0.5 rounded text-[13px] font-mono text-text-primary hover:bg-background-tertiary transition-colors">
                      {command}
                    </code>
                  </Link>
                </td>
                <td className="py-5 pl-0! text-text-primary">{item.title}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
