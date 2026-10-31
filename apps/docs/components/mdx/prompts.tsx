import { Fragment, type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { splitAsks } from '@/lib/prompts';

/**
 * Просьбы к агенту и что он по ним сделает — диалогом, а не таблицей.
 *
 * <Prompts>
 *   <Prompt ask="«Подключи Пачку», «Настрой MCP Пачки»">Подскажет способ входа…</Prompt>
 * </Prompts>
 *
 * Одна рамка без заливки на список, пары разделены линиями. В паре сверху просьба человека
 * в пузыре сообщения (несколько просьб в «ёлочках» дают несколько пузырей),
 * под ней действие агента обычным текстом со значком.
 * Markdown-версия: lib/mdx-expander.ts собирает из тех же пар таблицу.
 */
export function Prompts({ children }: { children: ReactNode }) {
  return (
    <dl className="not-prose my-6 divide-y divide-glass-border overflow-hidden rounded-xl border border-glass-border">
      {children}
    </dl>
  );
}

interface PromptProps {
  /** Что говорит человек: одна или несколько просьб в «ёлочках» */
  ask: string;
  /** Что сделает агент, можно с markdown-разметкой */
  children: ReactNode;
}

export function Prompt({ ask, children }: PromptProps) {
  return (
    <div className="px-4 py-3.5 sm:px-5">
      <dt className="flex flex-wrap gap-1.5">
        {splitAsks(ask).map((phrase, i) => (
          <span
            key={i}
            className="inline-block max-w-full rounded-2xl rounded-bl-md border border-glass-border bg-glass px-3.5 py-1.5 text-[14px] leading-[1.45] text-text-primary"
          >
            <Phrase text={phrase} />
          </span>
        ))}
      </dt>
      <dd className="mt-2.5 flex min-w-0 gap-2 text-[14px] leading-[1.55] text-text-primary [&_p]:mb-0! [&_p]:text-[14px]! [&_p]:leading-[1.55]! [&_a]:underline [&_a]:underline-offset-[3px]">
        <Sparkles className="mt-[3px] h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
        <div className="min-w-0">{children}</div>
      </dd>
    </div>
  );
}

/** Текст просьбы: `код` в обратных кавычках становится моноширинным */
function Phrase({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className="font-mono text-[12.5px] text-text-primary">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
