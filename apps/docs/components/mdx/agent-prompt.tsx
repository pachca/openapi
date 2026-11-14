import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { agentPromptHint, getAgentPrompt } from '@/lib/agent-prompts';
import { AgentPromptCopy } from './agent-prompt-copy';
import { AgentPromptText } from './agent-prompt-text';

/**
 * Готовый промпт для ИИ-агента: читатель копирует его, вставляет в чат со своим агентом,
 * и агент выполняет задачу страницы сам. Шаги для работы вручную остаются ниже на странице.
 *
 * <AgentPrompt id="first-bot" />
 *
 * Текст лежит в content/prompts/<id>.md: во фронтматтере `does` (что сделает агент, одно
 * предложение без точки), по желанию `title`, а для промпта, которому подключённая Пачка
 * не нужна, `mcp: false` и своя подпись `hint`. В теле сам промпт: на странице он свёрнут
 * до первых строк и разворачивается кнопкой, а копируется всегда целиком и дословно.
 * Markdown-версия: lib/mdx-expander.ts ставит тот же текст блоком кода.
 */
export function AgentPrompt({ id }: { id: string }) {
  const prompt = getAgentPrompt(id);
  const hint = agentPromptHint(prompt);

  return (
    <section
      aria-label={prompt.title}
      className="not-prose my-6 overflow-hidden rounded-xl border border-glass-border"
    >
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5">
        <div className="flex min-w-0 gap-2">
          <Sparkles className="mt-[3px] h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
          <div className="min-w-0">
            <div className="text-[14px] font-semibold leading-[1.45] text-text-primary">
              {prompt.title}
            </div>
            <div className="mt-0.5 text-[14px] leading-[1.55] text-text-secondary">
              {prompt.does}
            </div>
          </div>
        </div>
        <AgentPromptCopy text={prompt.text} />
      </div>
      {/* Первые строки видны сразу, остальное разворачивается: читатель видит, что отдаёт агенту. */}
      <AgentPromptText id={id} text={prompt.text} />
      <div className="px-4 py-2.5 text-[13px] leading-[1.5] text-text-secondary sm:px-5">
        {hint.before}
        {hint.link && (
          <Link
            href={hint.link.href}
            className="text-text-primary underline underline-offset-[3px] transition-colors duration-200 hover:text-primary"
          >
            {hint.link.text}
          </Link>
        )}
      </div>
    </section>
  );
}
