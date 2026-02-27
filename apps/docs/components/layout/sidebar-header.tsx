'use client';

import { LogoLink } from './pachka-logo';
import { SearchButton } from './search-button';

export function SidebarHeader() {
  return (
    <div className="flex-shrink-0 bg-background-secondary z-10 relative">
      <div className="p-4 pb-3 flex items-center">
        <LogoLink />
      </div>
      <div className="px-2.5 pb-4">
        <SearchButton />
      </div>
    </div>
  );
}
