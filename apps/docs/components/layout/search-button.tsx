'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SearchDialog } from '../search/search-dialog';

interface SearchButtonProps {
  className?: string;
  variant?: 'sidebar' | 'header';
}

export function SearchButton({ className = '', variant = 'sidebar' }: SearchButtonProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isHeader = variant === 'header';

  return (
    <>
      <button
        onClick={() => setSearchOpen(true)}
        className={` ${
          isHeader
            ? 'w-9 h-9 flex justify-center cursor-pointer items-center rounded-lg text-text-secondary hover:text-text-primary'
            : 'w-full py-1.5 pr-4 relative text-[14px] leading-[1.4] font-medium group cursor-pointer border border-background-border bg-background text-left px-2 pl-9 rounded-lg text-text-tertiary hover:text-text-secondary'
        } ${className}`}
      >
        <Search
          className={` stroke-2 ${
            isHeader
              ? 'w-5 h-5'
              : 'w-4 h-4 absolute top-1/2 -translate-y-1/2 left-2.5 text-text-tertiary group-hover:text-text-secondary'
          }`}
        />

        {isHeader ? '' : 'Поиск'}
      </button>

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </>
  );
}
