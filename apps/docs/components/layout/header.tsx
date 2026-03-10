'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ArrowUpRight } from 'lucide-react';
import { LogoLink } from './pachka-logo';
import { TABS, STATUS_URL, getActiveTab } from '@/lib/tabs-config';
import { Moon, Sun, SunMoon, BookOpenText, BookText, BookMinus } from 'lucide-react';
import { useTheme, SettingsDropdown } from './sidebar-footer';
import { useDisplaySettings, type SchemaDetail } from './display-settings-context';
import { SearchButton } from './search-button';

export function Header() {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <header
      className="fixed top-0 left-0 right-0 bg-background border-b border-background-border z-50 flex items-center px-3"
      style={{ height: 'var(--mobile-header-height)' }}
    >
      {/* Hamburger — mobile only, left side */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
        className="lg:hidden p-2 rounded-lg transition-colors cursor-pointer text-text-primary mr-2"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <LogoLink />

      {/* Tabs — desktop only, centered */}
      <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        {TABS.map((tab) => {
          const href = tab.id === 'guide' ? '/guides/ai-agents' : '/api/quickstart';
          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[14px] leading-[1.4] font-medium rounded-lg transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-text-primary bg-background-tertiary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
              }`}
            >
              {tab.title}
            </Link>
          );
        })}
        <a
          href={STATUS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[14px] leading-[1.4] font-medium rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors duration-200"
        >
          Статус
          <ArrowUpRight className="w-4 h-4 text-text-tertiary" />
        </a>
      </nav>

      <div className="flex-1" />

      {/* Right side — all buttons flat in one container */}
      <RightSideButtons />
    </header>
  );
}

type Theme = 'light' | 'dark' | 'system';

const themeOptions = [
  { value: 'light' as Theme, label: 'Светлая', icon: Sun },
  { value: 'dark' as Theme, label: 'Тёмная', icon: Moon },
  { value: 'system' as Theme, label: 'Системная', icon: SunMoon },
];

const schemaDetailOptions = [
  {
    value: 'full' as SchemaDetail,
    label: 'Полные схемы',
    icon: BookOpenText,
    description: 'Описания параметров и примеры',
  },
  {
    value: 'compact' as SchemaDetail,
    label: 'Без примеров',
    icon: BookText,
    description: 'Только описания параметров',
  },
  {
    value: 'minimal' as SchemaDetail,
    label: 'Минимальные',
    icon: BookMinus,
    description: 'Без описаний и примеров',
  },
];

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
