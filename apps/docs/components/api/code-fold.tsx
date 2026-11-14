'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { getScrollOffset } from '@/lib/utils/scroll-offset';

/** С этого числа строк блок кода сворачивается: короткий код виден целиком */
const MIN_LINES = 25;

/**
 * Свёрнутая высота: отступ над кодом и шестнадцать строк по 19,5 px (13 px, межстрочный 1,5),
 * последняя уходит в затухание.
 */
const FOLDED_HEIGHT = 'max-h-[340px]';

/**
 * Длинный блок кода в гайде: свёрнут до первых строк с затуханием, как промпт в
 * <AgentPrompt>, и разворачивается кнопкой. Весь код остаётся в HTML, поэтому его
 * находят поиск и агенты, а кнопка копирования берёт его целиком без разворота.
 * `className` получает прокручиваемый контейнер с кодом, кнопка стоит под ним
 * и вбок вместе с кодом не прокручивается.
 */
export function CodeFold({
  lines,
  className,
  children,
}: {
  lines: number;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const collapsedByReader = useRef(false);

  // Свёрнутый код уходит выше читателя: возвращаем к началу блока.
  useLayoutEffect(() => {
    if (open || !collapsedByReader.current) return;
    collapsedByReader.current = false;
    // Рамка блока вместе с заголовком файла, а не только код под ним.
    const block = rootRef.current?.closest('.not-prose') ?? rootRef.current;
    if (!block) return;
    const offset = getScrollOffset();
    const top = block.getBoundingClientRect().top;
    if (top < offset) {
      window.scrollTo({ top: top + window.scrollY - offset, behavior: 'smooth' });
    }
  }, [open]);

  if (lines < MIN_LINES) return <div className={className}>{children}</div>;

  const toggle = () => {
    collapsedByReader.current = open;
    setOpen(!open);
  };

  return (
    <div ref={rootRef}>
      <div
        className={`${className ?? ''} ${
          open
            ? ''
            : `${FOLDED_HEIGHT} [mask-image:linear-gradient(to_bottom,black_70%,transparent)]`
        }`}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="mb-2.5 ml-4 inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        {open ? 'Свернуть' : 'Развернуть'}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}
