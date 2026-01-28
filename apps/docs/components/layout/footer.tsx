'use client';

import Link from 'next/link';
import type { NavigationItem } from '@/lib/openapi/types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';

interface FooterProps {
  adjacent?: {
    prev: NavigationItem | null;
    next: NavigationItem | null;
  };
  noMargin?: boolean;
}

export function Footer({ adjacent, noMargin }: FooterProps) {
  return (
    <footer className="mt-auto pb-8">
      <div className={`${noMargin ? 'mt-2' : 'mx-8 xl:mx-10'} pt-10`}>
        {adjacent && (adjacent.prev || adjacent.next) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {adjacent.prev ? <PrevButton item={adjacent.prev} /> : <div />}

            {adjacent.next && <NextButton item={adjacent.next} />}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-text-tertiary">
          <div>
            © 2026{' '}
            <a
              href="https://pachca.com"
              className="font-medium hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Пачка
            </a>
            . Сделано с заботой.
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://pachca.com/security/bug-bounty"
              className="font-medium hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bug bounty
            </a>
            <a
              href="https://pachca.com/help-center"
              className="font-medium hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              База знаний
            </a>
            <a
              href="https://pachca.com/glossary"
              className="font-medium hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Глоссарий
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PrevButton({ item }: { item: NavigationItem }) {
  const { isLoading, handleClick } = useNavigationLoading(item.href, 200);

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className="flex flex-col gap-1 p-4 rounded-lg border border-background-border hover:bg-background-tertiary transition-all duration-200 group"
    >
      <div className="flex items-center gap-1 text-text-tertiary transition-colors duration-200">
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronLeft size={16} />}
        <span className="text-[13px]">Назад</span>
      </div>
      <span className="text-[14px] font-medium text-text-primary transition-colors duration-200 truncate text-ellipsis overflow-hidden block w-full">
        {item.title}
      </span>
    </Link>
  );
}

function NextButton({ item }: { item: NavigationItem }) {
  const { isLoading, handleClick } = useNavigationLoading(item.href, 200);

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className="flex flex-col items-end gap-1 p-4 rounded-lg border border-background-border hover:bg-background-tertiary transition-all duration-200 group text-right"
    >
      <div className="flex items-center gap-1 text-text-tertiary transition-colors duration-200">
        <span className="text-[13px]">Вперед</span>
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
      </div>
      <span className="text-[14px] font-medium text-text-primary transition-colors duration-200 truncate text-ellipsis overflow-hidden block w-full">
        {item.title}
      </span>
    </Link>
  );
}
