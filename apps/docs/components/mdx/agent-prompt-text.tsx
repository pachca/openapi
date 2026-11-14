'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getScrollOffset } from '@/lib/utils/scroll-offset';

/**
 * Текст промпта в блоке <AgentPrompt>: свёрнут до первых строк с затуханием и
 * разворачивается кнопкой. Весь текст остаётся в HTML: его читают поиск, агенты
 * и экранные дикторы, а кнопка копирования берёт его целиком и без разворота.
 */
export function AgentPromptText({ id, text }: { id: string; text: string }) {
  const [open, setOpen] = useState(false);
  // До замера считаем текст длинным: промпты длиннее пяти строк, и блок не прыгает при загрузке.
  const [foldable, setFoldable] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const collapsedByReader = useRef(false);

  // Короткий текст на широком экране целиком помещается в свёрнутую высоту: тогда кнопка не нужна.
  useLayoutEffect(() => {
    const pre = preRef.current;
    if (!pre || open) return;
    const measure = () => setFoldable(pre.scrollHeight > pre.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [open]);

  // Длинный текст сворачивается выше читателя: возвращаем к началу блока.
  useLayoutEffect(() => {
    if (open || !collapsedByReader.current) return;
    collapsedByReader.current = false;
    const block = rootRef.current?.closest('section') ?? rootRef.current;
    if (!block) return;
    const offset = getScrollOffset();
    const top = block.getBoundingClientRect().top;
    if (top < offset) {
      window.scrollTo({ top: top + window.scrollY - offset, behavior: 'smooth' });
    }
  }, [open]);

  const toggle = () => {
    collapsedByReader.current = open;
    setOpen(!open);
  };

  const folded = foldable && !open;

  return (
    <div ref={rootRef} className="border-y border-glass-border bg-glass px-4 pt-3.5 pb-3 sm:px-5">
      <pre
        ref={preRef}
        id={`agent-prompt-${id}`}
        className={`m-0 whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.65] text-text-primary ${
          open ? '' : 'max-h-[8.25em] overflow-hidden'
        } ${folded ? '[mask-image:linear-gradient(to_bottom,black_45%,transparent)]' : ''}`}
      >
        {text}
      </pre>
      {foldable && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={`agent-prompt-${id}`}
          className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {open ? 'Свернуть' : 'Развернуть'}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
