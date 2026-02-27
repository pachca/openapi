'use client';

import { Moon, Sun, SunMoon, BookOpenText, BookText, BookMinus, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useDisplaySettings, type SchemaDetail } from './display-settings-context';

type Theme = 'light' | 'dark' | 'system';

interface Option<T> {
  value: T;
  label: string;
  icon: typeof Sun;
  description?: string;
}

const themeOptions: Option<Theme>[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: SunMoon },
];

const schemaDetailOptions: Option<SchemaDetail>[] = [
  {
    value: 'full',
    label: 'Полные схемы',
    icon: BookOpenText,
    description: 'Описания параметров и примеры',
  },
  {
    value: 'compact',
    label: 'Без примеров',
    icon: BookText,
    description: 'Только описания параметров',
  },
  {
    value: 'minimal',
    label: 'Минимальные',
    icon: BookMinus,
    description: 'Без описаний и примеров',
  },
];

function applyTheme(newTheme: Theme) {
  document.documentElement.classList.add('disable-transitions');
  document.documentElement.classList.remove('dark', 'light');

  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (newTheme === 'light') {
    document.documentElement.classList.add('light');
  }

  setTimeout(() => {
    document.documentElement.classList.remove('disable-transitions');
  }, 0);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required for hydration safety
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'system');
    }
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as Theme | null;
      if (!currentTheme || currentTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const selectTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return { theme, selectTheme, mounted };
}

function SettingsDropdown<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  compact,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const CurrentIcon = current?.icon ?? options[0].icon;

  return (
    <div className={compact ? '' : 'flex-auto min-w-0'}>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          {compact ? (
            <button
              className="w-9 h-9 flex justify-center items-center rounded-lg cursor-pointer text-text-secondary hover:text-text-primary"
              aria-label={ariaLabel}
            >
              <CurrentIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 w-full rounded-lg bg-background border border-background-border text-text-primary transition-colors cursor-pointer outline-none"
              aria-label={ariaLabel}
            >
              <CurrentIcon className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-medium flex-1 text-left">{current?.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>
          )}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[140px] bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-dropdown"
            align={compact ? 'end' : 'start'}
            side={compact ? 'bottom' : 'top'}
            sideOffset={8}
          >
            {options.map(({ value: optValue, label, icon: Icon, description }) => (
              <DropdownMenu.Item
                key={optValue}
                onClick={() => onChange(optValue)}
                className={`flex items-start gap-2 px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                  value === optValue
                    ? 'bg-primary text-white'
                    : 'text-text-primary hover:bg-background-tertiary'
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span>{label}</span>
                  {description && (
                    <span
                      className={`text-[12px] font-normal ${value === optValue ? 'text-white/70' : 'text-text-secondary'}`}
                    >
                      {description}
                    </span>
                  )}
                </div>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export function MobileSettingsButtons() {
  const { theme, selectTheme, mounted } = useTheme();
  const { schemaDetail, setSchemaDetail } = useDisplaySettings();

  if (!mounted) return null;

  return (
    <>
      <SettingsDropdown
        options={themeOptions}
        value={theme}
        onChange={selectTheme}
        ariaLabel="Тема оформления"
        compact
      />
      <SettingsDropdown
        options={schemaDetailOptions}
        value={schemaDetail}
        onChange={setSchemaDetail}
        ariaLabel="Детализация схемы"
        compact
      />
    </>
  );
}

export function SidebarFooter() {
  const { theme, selectTheme, mounted } = useTheme();
  const { schemaDetail, setSchemaDetail } = useDisplaySettings();

  if (!mounted) {
    return <div className="flex-shrink-0 h-[49px]" />;
  }

  return (
    <div className="flex-shrink-0 px-2.5 pt-4 pb-2.5 flex items-center gap-2">
      <SettingsDropdown
        options={themeOptions}
        value={theme}
        onChange={selectTheme}
        ariaLabel="Тема оформления"
      />
      <SettingsDropdown
        options={schemaDetailOptions}
        value={schemaDetail}
        onChange={setSchemaDetail}
        ariaLabel="Детализация схемы"
      />
    </div>
  );
}
