import React from 'react';

interface BoxedPanelProps {
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  id?: string;
}

export function BoxedPanel({
  header,
  children,
  className = 'my-8',
  headerClassName = '',
  contentClassName = '',
  id,
}: BoxedPanelProps) {
  return (
    <div
      id={id}
      className={`bg-glass backdrop-blur-md rounded-xl border border-glass-border overflow-hidden flex flex-col h-fit not-prose ${className}`}
    >
      <div
        className={`flex gap-2 items-center justify-between pr-3 pl-4 border-b border-glass-border min-h-[var(--boxed-header-height)] ${headerClassName}`}
      >
        {header}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
