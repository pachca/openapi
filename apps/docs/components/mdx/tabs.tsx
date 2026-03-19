'use client';

import { useState, Children, isValidElement, type ReactNode, type ReactElement } from 'react';

interface TabsProps {
  children: ReactNode;
}

interface TabProps {
  /** Tab label displayed in the tab bar */
  label: string;
  children: ReactNode;
}

export function Tabs({ children }: TabsProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> => isValidElement(child) && child.type === Tab
  );

  const [activeIndex, setActiveIndex] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="not-prose">
      {/* Tab bar */}
      <div className="flex gap-6 border-b border-glass-border mb-6">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`pb-2 text-[14px] font-medium transition-colors cursor-pointer select-none border-b-2 -mb-px ${
              i === activeIndex
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div>{tabs[activeIndex]?.props.children}</div>
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}
