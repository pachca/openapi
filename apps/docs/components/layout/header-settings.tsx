'use client';

import { useDisplaySettings, type SchemaDetail } from './display-settings-context';
import { useTheme, MobileSettingsButtons } from './sidebar-footer';
import { Moon, Sun, SunMoon, BookOpenText, BookText, BookMinus } from 'lucide-react';
import { SettingsDropdown } from './sidebar-footer';

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

export function HeaderSettings() {
  const { theme, selectTheme, mounted } = useTheme();
  const { schemaDetail, setSchemaDetail } = useDisplaySettings();

  if (!mounted) return null;

  return (
    <>
      {/* Mobile: compact icon buttons */}
      <div className="flex items-center md:hidden">
        <MobileSettingsButtons />
      </div>
      {/* Desktop: full buttons with labels */}
      <div className="hidden md:flex items-center gap-2">
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
    </>
  );
}
