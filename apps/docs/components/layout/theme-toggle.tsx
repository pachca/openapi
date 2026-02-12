'use client';

import { Moon, Sun, SunMoon } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

type Theme = 'light' | 'dark' | 'system';

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: SunMoon },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Применяем тему к документу
  const applyTheme = (newTheme: Theme, disableTransitions = true) => {
    if (disableTransitions) {
      document.documentElement.classList.add('disable-transitions');
    }

    // Удаляем оба класса
    document.documentElement.classList.remove('dark', 'light');

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    }
    // Если 'system' - классы уже удалены, работает @media

    if (disableTransitions) {
      setTimeout(() => {
        document.documentElement.classList.remove('disable-transitions');
      }, 0);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required for hydration safety
    setMounted(true);

    // Проверяем системную тему
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Получаем сохраненную тему, по умолчанию 'system'
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'system';

    // Если темы нет, устанавливаем 'system' по умолчанию
    if (!savedTheme) {
      localStorage.setItem('theme', 'system');
    }

    setTheme(initialTheme);
    // Применяем тему после гидратации React (React перезаписывает className)
    applyTheme(initialTheme);

    // Слушаем изменения системной темы
    const handleChange = () => {
      // Применяем изменение только если выбран режим 'system'
      const currentTheme = localStorage.getItem('theme') as Theme | null;
      if (!currentTheme || currentTheme === 'system') {
        // Принудительно перерисовываем, убирая и добавляя классы
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

  // Получаем текущую иконку в зависимости от темы
  const CurrentIcon = themeOptions.find((o) => o.value === theme)?.icon ?? SunMoon;

  // Предотвращаем layout shift - показываем placeholder с теми же размерами
  if (!mounted) {
    return (
      <div className="w-9 h-9 flex items-center justify-center rounded-lg">
        <SunMoon className="w-5 h-5 opacity-0" />
      </div>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="w-9 h-9 flex shrink-0 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 select-none"
          aria-label="Переключить тему"
        >
          <CurrentIcon className="w-5 h-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[140px] bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          align="end"
        >
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={value}
              onClick={() => selectTheme(value)}
              className={`flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                theme === value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
