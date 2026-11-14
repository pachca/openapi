import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { agentPromptHint, agentPromptSkillHref, getAgentPrompt } from '@/lib/agent-prompts';
import { AgentPromptCopy } from './agent-prompt-copy';
import { AgentPromptText } from './agent-prompt-text';

/**
 * Готовый промпт для ИИ-агента: читатель копирует его, вставляет в чат со своим агентом,
 * и агент выполняет задачу страницы сам. Шаги для работы вручную остаются ниже на странице.
 *
 * <AgentPrompt id="create-bot" />
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
      className="@container not-prose my-6 overflow-hidden rounded-xl border border-glass-border"
    >
      {/* В широком блоке описание стоит под заголовком, а кнопка по центру справа. В узком
          (колонка главной, телефон) кнопка стоит под описанием по ширине своего текста. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start px-4 py-3.5 @md:gap-x-5 @md:px-5">
        <div className="col-span-2 col-start-1 row-start-1 flex min-w-0 items-center gap-2 @md:col-span-1">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
          <div className="min-w-0 text-[14px] font-semibold leading-[1.45] text-text-primary">
            {prompt.title}
          </div>
        </div>
        <div className="col-span-2 col-start-1 row-start-2 mt-0.5 pl-[22px] text-[14px] leading-[1.55] text-text-secondary @md:col-span-1">
          {prompt.does}
        </div>
        <div className="col-start-1 row-start-3 mt-3 pl-[22px] @md:col-start-2 @md:row-span-2 @md:row-start-1 @md:mt-0 @md:self-center @md:pl-0">
          <AgentPromptCopy text={prompt.text} />
        </div>
      </div>
      {/* Первые строки видны сразу, остальное разворачивается: читатель видит, что отдаёт агенту. */}
      <AgentPromptText id={id} text={prompt.text} />
      <div className="px-4 py-2.5 text-[13px] leading-[1.5] text-text-secondary @md:px-5">
        {hint.before}
        {hint.link && (
          <Link
            href={hint.link.href}
            className="text-text-primary underline underline-offset-[3px] transition-colors duration-200 hover:text-primary"
          >
            {hint.link.text}
          </Link>
        )}
        {prompt.skill && (
          <>
            . Правила задачи знает скилл{' '}
            <Link
              href={agentPromptSkillHref(prompt.skill)}
              className="font-mono text-[12.5px] text-text-primary underline underline-offset-[3px] transition-colors duration-200 hover:text-primary"
            >
              {prompt.skill}
            </Link>
            .
          </>
        )}
      </div>
    </section>
  );
}
