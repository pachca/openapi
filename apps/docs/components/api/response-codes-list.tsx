import React from 'react';

interface CodeItem {
  code: string;
  message?: string;
  description: string;
}

interface ResponseCodesListProps {
  title: string;
  items: CodeItem[];
}

export function ResponseCodesList({ title, items }: ResponseCodesListProps) {
  return (
    <div className="not-prose my-8 border border-glass-border rounded-xl overflow-hidden bg-glass backdrop-blur-md">
      <div className="flex items-center justify-between px-3 bg-glass border-b border-glass-border h-[var(--boxed-header-height)]">
        <span className="text-[13px] font-medium text-text-primary truncate">{title}</span>
      </div>
      <div className="divide-y divide-glass-divider">
        {items.map((item, index) => (
          <div key={index} className="px-4 py-4 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-mono text-text-primary">{item.code}</span>
              {item.message && (
                <span className="text-[14px] font-mono font-bold text-text-primary">
                  {item.message}
                </span>
              )}
            </div>
            <div
              className="text-[14px] text-text-secondary leading-relaxed [&_code]:bg-glass [&_code]:text-text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:font-medium [&_code]:border [&_code]:border-glass-border"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
