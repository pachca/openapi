'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { LogoLink } from './pachka-logo';
import { TABS } from '@/lib/tabs-config';
import { useTheme, SettingsDropdown, themeOptions, schemaDetailOptions } from './settings-controls';
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
      {/* Hamburger — mobile only, left side */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
        className="lg:hidden p-2 rounded-md transition-colors cursor-pointer text-text-primary mr-2"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <LogoLink />

      {/* Tabs — desktop only, centered */}
      <nav className="hidden lg:flex items-center gap-0.5 px-1 py-1 rounded-full bg-glass backdrop-blur-md border border-glass-border absolute left-1/2 -translate-x-1/2">
        {TABS.map((tab) => {
          const href = tab.id === 'guide' ? '/guides/quickstart' : '/api/authorization';
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center px-2.5 py-1 text-[13px] leading-[1.4] font-medium rounded-full transition-colors duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
              }`}
            >
              {tab.title}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

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
      {/* Theme: compact until lg, full from lg */}
      <div className="lg:hidden">
        <SettingsDropdown
          options={themeOptions}
          value={theme}
          onChange={selectTheme}
          ariaLabel="Тема оформления"
          compact
        />
      </div>
      <div className="hidden lg:block">
        <SettingsDropdown
          options={themeOptions}
          value={theme}
          onChange={selectTheme}
          ariaLabel="Тема оформления"
        />
      </div>
      {/* Schema: compact until lg, full from lg */}
      <div className="lg:hidden">
        <SettingsDropdown
          options={schemaDetailOptions}
          value={schemaDetail}
          onChange={setSchemaDetail}
          ariaLabel="Детализация схемы"
          compact
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
      {/* Search — mobile only */}
      <SearchButton variant="header" className="lg:hidden" />
    </div>
  );
}
