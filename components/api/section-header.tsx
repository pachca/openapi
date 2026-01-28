import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, children }: SectionHeaderProps) {
  return (
    <div className="flex items-start sm:items-center justify-between mb-0 gap-4 flex-col sm:flex-row min-h-[38px]">
      <div className="flex items-center gap-3">
        <h2 className="mt-0! mb-0!">{title}</h2>
        {subtitle && (
          <span className="text-[13px] text-text-secondary mt-1">{subtitle}</span>
        )}
      </div>
      {children && (
        <div className="flex bg-background-tertiary rounded-lg p-0.5 border border-background-border h-fit">
          {children}
        </div>
      )}
    </div>
  );
}
