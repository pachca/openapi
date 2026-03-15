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

export function Header() {
  const activeTab = useActiveTab();

  return (
    <header
      className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-background-border z-50 flex items-center px-3"
      style={{ height: 'var(--mobile-header-height)' }}
    >
      {/* Logo */}
      <LogoLink />

      <div className="flex-1 min-w-2 lg:hidden" />

      {/* Tabs — space-between on mobile, absolute-centered on desktop */}
      <nav className="flex items-center gap-0.5 px-1 py-1 rounded-full bg-glass backdrop-blur-md border border-glass-border lg:absolute lg:left-1/2 lg:-translate-x-1/2 min-w-0 shrink lg:shrink-0">
        {TABS.map((tab) => {
          const href = tab.id === 'guide' ? '/guides/quickstart' : '/api/authorization';
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center justify-center ${tab.id === 'guide' ? 'min-w-0' : 'shrink-0'} h-[26px] px-2.5 text-[13px] font-medium rounded-full whitespace-nowrap transition-colors duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
              }`}
            >
              <span className="lg:hidden truncate">{tab.shortTitle}</span>
              <span className="hidden lg:inline whitespace-nowrap">{tab.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 min-w-2 lg:min-w-0" />

      {/* Right side — all buttons flat in one container */}
      <RightSideButtons />
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
