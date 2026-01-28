'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import type { NavigationSection } from '@/lib/openapi/types';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface SidebarNavProps {
  navigation: NavigationSection[];
}

export function SidebarNav({ navigation }: SidebarNavProps) {
  const pathname = usePathname();
  const isInternalNav = useRef(false);

  // Инициализируем открытые секции на основе текущего пути
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const activeSection = navigation
      .slice(1)
      .find((section) => section.items.some((item) => item.href === pathname));
    return activeSection ? [activeSection.title] : [];
  });

  const handleItemClick = () => {
    isInternalNav.current = true;
  };

  // Автоматическая прокрутка к активному пункту только при внешней навигации
  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    // Проверяем размер экрана - пропускаем автоскролл на мобильных полностью
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      return; // На мобильных не скроллим сайдбар вообще
    }

    // Только для десктопа - находим контейнер скролла
    const container = document.getElementById('sidebar-scroll-container');
    if (!container) return;

    // Находим активный элемент в DOM
    const activeItem = container.querySelector('.bg-primary.text-white');

    if (activeItem) {
      const section = activeItem.closest('.navigation-section');
      if (section) {
        const containerRect = container.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();

        // Расстояние от верха контейнера до верха секции
        const relativeTop = sectionRect.top - containerRect.top + container.scrollTop;

        // Прокручиваем к началу секции, в которой находится активный пункт
        container.scrollTo({
          top: relativeTop,
          behavior: 'smooth',
        });
      }
    }
  }, [pathname]);

  const firstSection = navigation[0];
  const otherSections = navigation.slice(1);

  return (
    <div className="flex flex-col gap-2">
      {/* Первая секция (Начало работы) без заголовка */}
      {firstSection && (
        <div className="navigation-section">
          <ul className="space-y-0.5 list-none">
            {firstSection.items.map((item, idx) => (
              <SidebarItem key={idx} item={item} onItemClick={handleItemClick} />
            ))}
          </ul>
        </div>
      )}

      {/* Остальные секции в виде аккордеона */}
      <Accordion.Root
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-1"
      >
        {otherSections.map((section, idx) => {
          const activeItem = section.items.find((item) => item.href === pathname);
          const isOpen = openSections.includes(section.title);

          return (
            <Accordion.Item
              key={idx}
              value={section.title}
              className="navigation-section overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between px-2 py-1.5 text-[14px] leading-[1.4] rounded-md text-text-primary hover:bg-background-tertiary transition-colors duration-200 font-medium tracking-tight group cursor-pointer outline-none group">
                  <span className="truncate">{section.title}</span>
                  <ChevronDown
                    className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-all duration-200 -rotate-90 group-data-[state=open]:rotate-0"
                    strokeWidth={2.5}
                  />
                </Accordion.Trigger>
              </Accordion.Header>

              {/* Показываем активный пункт, когда секция свернута */}
              {!isOpen && activeItem && (
                <div className="ml-3 pl-4 border-l border-background-border/50 mt-1 space-y-0.5">
                  <ul className="list-none space-y-0.5">
                    <SidebarItem item={activeItem} onItemClick={handleItemClick} />
                  </ul>
                </div>
              )}

              <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
                <div className="ml-3 pl-4 border-l border-background-border/50 mt-1 space-y-0.5">
                  <ul className="list-none space-y-0.5">
                    {section.items.map((item, itemIdx) => (
                      <SidebarItem key={itemIdx} item={item} onItemClick={handleItemClick} />
                    ))}
                  </ul>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </div>
  );
}
