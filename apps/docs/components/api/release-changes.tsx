'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { getScrollOffset } from '@/lib/utils/scroll-offset';

/**
 * The changes of one release, folded to the first few like a long quote in a
 * messenger. Every item stays in the HTML, so search and agents read the whole
 * list; folding only hides the rest until the reader opens it.
 */
export function ReleaseChanges({
  items,
  visible = 3,
  moreLabel,
}: {
  items: ReactNode[];
  visible?: number;
  moreLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const collapsedByReader = useRef(false);
  const foldable = items.length > visible + 1;

  // A long list folds away above the reader: bring the top of its card back.
  useLayoutEffect(() => {
    if (open || !collapsedByReader.current) return;
    collapsedByReader.current = false;
    const card = rootRef.current?.closest('[data-release-card]') ?? rootRef.current;
    if (!card) return;
    const offset = getScrollOffset();
    const top = card.getBoundingClientRect().top;
    if (top < offset) {
      window.scrollTo({ top: top + window.scrollY - offset, behavior: 'smooth' });
    }
  }, [open]);

  const toggle = () => {
    collapsedByReader.current = open;
    setOpen(!open);
  };

  return (
    <div ref={rootRef}>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className={foldable && !open && i >= visible ? 'hidden' : undefined}>
            {item}
          </div>
        ))}
      </div>
      {foldable && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          {open ? 'Свернуть' : moreLabel}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
