'use client';

import Link from 'next/link';
import { LogoLink } from './pachka-logo';
import { TABS } from '@/lib/tabs-config';
import {
  useTheme,
  SettingsDropdown,
  CombinedSettingsDropdown,
  themeOptions,
  schemaDetailOptions,
} from './settings-controls';
import { useDisplaySettings } from './display-settings-context';
import { SearchButton } from './search-button';
import { useActiveTab } from './use-last-tab';

interface HeaderProps {
  hasNewUpdates: boolean;
}

export function Header({ hasNewUpdates }: HeaderProps) {
  const activeTab = useActiveTab();

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-background-border z-50 flex flex-col">
      {/* Top row: logo, centered search (desktop), right-side buttons */}
      <div className="flex items-center px-3" style={{ height: 'var(--mobile-header-height)' }}>
        <LogoLink />

        {/* Centered search on desktop */}
        <div className="hidden lg:flex flex-1 justify-center px-6 min-w-0">
          <div className="w-full max-w-[480px]">
            <SearchButton />
          </div>
        </div>

        <div className="flex-1 lg:hidden" />

        <RightSideButtons />
      </div>

      {/* Bottom row: tabs under the logo (desktop only) */}
      <nav
        className="hidden lg:flex items-center gap-1 px-3 border-t border-background-border/60"
        style={{ height: 'var(--header-tabs-height)' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'updates' && hasNewUpdates;
          return (
            <Link
              key={tab.id}
              href={tab.defaultHref}
              className={`relative flex items-center h-full px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-200 ${
                isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{tab.title}</span>
              {showBadge && (
                <span
                  className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary"
                  aria-label="новые обновления"
                />
              )}
              {isActive && (
                <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function RightSideButtons() {
  const { theme, selectTheme, mounted } = useTheme();
  const { schemaDetail, setSchemaDetail } = useDisplaySettings();

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Desktop: two separate dropdowns */}
      <div className="hidden lg:block">
        <SettingsDropdown
          options={themeOptions}
          value={theme}
          onChange={selectTheme}
          ariaLabel="Тема оформления"
        />
      </div>
      <div className="hidden lg:block">
        <SettingsDropdown
          options={schemaDetailOptions}
          value={schemaDetail}
          onChange={setSchemaDetail}
          ariaLabel="Детализация схемы"
        />
      </div>
      {/* Mobile: search + combined kebab menu */}
      <SearchButton variant="header" className="lg:hidden" />
      <div className="lg:hidden">
        <CombinedSettingsDropdown
          theme={theme}
          onThemeChange={selectTheme}
          schemaDetail={schemaDetail}
          onSchemaDetailChange={setSchemaDetail}
        />
      </div>
    </div>
  );
}
