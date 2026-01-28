'use client';

import { Moon, Sun, SunMoon } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

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

  const toggleTheme = () => {
    // Циклическое переключение: light → dark → system → light
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const newTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Получаем текущую иконку в зависимости от темы
  const getIcon = () => {
    if (theme === 'system') {
      return <SunMoon className="w-5 h-5" />;
    }
    
    if (theme === 'light') {
      return <Sun className="w-5 h-5" />;
    }
    
    return <Moon className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Светлая тема';
    if (theme === 'dark') return 'Темная тема';
    return 'Системная тема';
  };

  // Предотвращаем layout shift - показываем placeholder с теми же размерами
  if (!mounted) {
    return (
      <div className="w-9 h-9 flex items-center justify-center rounded-lg">
        <SunMoon className="w-5 h-5 opacity-0" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex shrink-0 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer out"
      aria-label={`Текущая: ${getLabel()}. Нажмите для переключения`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
