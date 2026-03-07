'use client';

import { useState } from 'react';
import { CodeBlock } from '../api/code-block';
import { CopyButton } from '../api/copy-button';
import { BoxedPanel } from '../api/boxed-panel';

interface Tab {
  label: string;
  language: string;
  code: string;
}

interface CodeTabsProps {
  tabs: Tab[];
  title?: string;
}

export function CodeTabs({ tabs, title }: CodeTabsProps) {
  const [active, setActive] = useState(0);
  const current = tabs[active];

  return (
    <BoxedPanel
      header={
        <>
          <div className="flex items-center gap-0 overflow-x-auto custom-scrollbar -mx-1">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActive(i)}
                className={`px-2.5 h-7 rounded-md text-[13px] font-medium whitespace-nowrap transition-all outline-none cursor-pointer select-none ${
                  active === i
                    ? 'text-text-primary bg-background'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0 shrink-0">
            {title && (
              <span className="text-[12px] text-text-tertiary font-medium mr-1 whitespace-nowrap">
                {title}
              </span>
            )}
            <CopyButton text={current.code} />
          </div>
        </>
      }
      contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
    >
      <CodeBlock code={current.code.trim()} language={current.language} />
    </BoxedPanel>
  );
}
