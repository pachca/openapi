'use client';

import Link from 'next/link';
import { PachkaLogo } from './pachka-logo';
import { ThemeToggle } from './theme-toggle';
import { SearchButton } from './search-button';

export function SidebarHeader() {
  return (
    <div className="flex-shrink-0 bg-background-secondary z-10 relative">
      <div className="p-4 pb-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none"
        >
          <PachkaLogo className="text-text-primary" />
          <span className="text-[14px] font-semibold text-primary tracking-tight translate-y-[1px]">
            API
          </span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="px-4 pb-4">
        <SearchButton />
      </div>
    </div>
  );
}
