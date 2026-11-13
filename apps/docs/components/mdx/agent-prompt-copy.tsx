'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { CopiedTooltip } from '../api/copied-tooltip';

type CopyState = 'idle' | 'copied' | 'failed';

const TOOLTIPS: Record<CopyState, string> = {
  idle: '',
  copied: 'Скопировано',
  failed: 'Не скопировалось',
};

const ANNOUNCEMENTS: Record<CopyState, string> = {
  idle: '',
  copied: 'Промпт скопирован',
  failed: 'Промпт не скопировался: разверните его и выделите текст вручную',
};

/** Запасной путь без Clipboard API (старый браузер, страница не по HTTPS): копирование выделением. */
function copyBySelection(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  try {
    textArea.focus();
    textArea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

/**
 * Кнопка «Скопировать» блока <AgentPrompt>. Текст уходит в буфер дословно:
 * переносы строк и нумерация шагов в промпте значимы. Как у остальных кнопок копирования
 * на сайте, после нажатия иконка сменяется галочкой и над кнопкой появляется подсказка.
 * «Скопировано» показывается только после настоящего копирования: иначе читатель вставит
 * агенту то, что лежало в буфере раньше.
 */
export function AgentPromptCopy({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>('idle');

  const handleCopy = async () => {
    let ok: boolean;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = copyBySelection(text);
    }
    setState(ok ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), ok ? 2000 : 4000);
  };

  return (
    <>
      <CopiedTooltip open={state !== 'idle'} label={TOOLTIPS[state] || TOOLTIPS.copied}>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Скопировать промпт"
          className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/80 px-4 text-[13px] font-medium text-white shadow-[0_2px_12px_var(--color-primary)/15%] backdrop-blur-md transition-all duration-200 hover:bg-primary/90"
        >
          {state === 'copied' ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
          Скопировать
        </button>
      </CopiedTooltip>
      {/* Объявление для экранного диктора стоит рядом с кнопкой, а не внутри: так оно не попадает в её имя. */}
      <span aria-live="polite" className="sr-only">
        {ANNOUNCEMENTS[state]}
      </span>
    </>
  );
}
