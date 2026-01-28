'use client';

import { PachkaLogo } from './pachka-logo';
import { SearchButton } from './search-button';

export function Header() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-background-border z-50 flex items-center px-6">
        <div className="flex items-center gap-8 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
            <PachkaLogo className="text-primary" />
            <span className="text-[18px] font-semibold text-text-secondary tracking-tight translate-y-[1px]">API Docs</span>
          </div>
          
          <div className="flex-1 max-w-md">
            <SearchButton variant="header" />
          </div>

          <a 
            href="https://pachca.com" 
            className="text-sm hover:text-primary transition-colors"
          >
            Вернуться на сайт
          </a>
        </div>
      </header>
    </>
  );
}
