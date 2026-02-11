import React from 'react';

interface CalloutProps {
  children: React.ReactNode;
  type?: 'info' | 'warning';
}

export function Callout({ children, type = 'info' }: CalloutProps) {
  const isWarning = type === 'warning';

  const bgClass = isWarning ? 'bg-callout-warning-bg' : 'bg-callout-info-bg';
  const borderClass = isWarning ? 'border-callout-warning-border' : 'border-callout-info-border';
  const contentTextClass = isWarning
    ? '[&_p]:text-callout-warning-text/90! text-callout-warning-text/90! [&_em]:text-callout-warning-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-warning-text [&_a]:text-callout-warning-text [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_.endpoint-badge]:text-callout-warning-text! [&_.endpoint-badge]:bg-callout-warning-text/10! [&_li]:text-callout-warning-text/90! [&_li]:text-[13px]!'
    : '[&_p]:text-callout-info-text/90! text-callout-info-text/90! [&_em]:text-callout-info-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-info-text [&_a]:text-callout-info-text [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_.endpoint-badge]:text-callout-info-text! [&_.endpoint-badge]:bg-callout-info-text/10! [&_li]:text-callout-info-text/90! [&_li]:text-[13px]!';

  return (
    <div
      className={`my-8 rounded-lg border overflow-hidden not-prose py-3 px-4 [&_p]:text-[13px]! text-[13px]! leading-relaxed [&_em]:not-italic ${bgClass} ${borderClass} ${contentTextClass}`}
    >
      {children}
    </div>
  );
}
