import React from 'react';

type CalloutType = 'info' | 'warning';

interface CalloutProps {
  children: React.ReactNode;
  type?: CalloutType;
}

const styles: Record<CalloutType, { bg: string; border: string; content: string }> = {
  info: {
    bg: 'bg-glass',
    border: 'border-glass-border',
    content:
      '[&_p]:text-text-primary/90! text-text-primary/90! [&_em]:text-text-secondary [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-text-primary [&_a]:text-primary [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_li]:text-text-primary/90! [&_li]:text-[13px]!',
  },
  warning: {
    bg: 'bg-callout-warning-bg',
    border: 'border-callout-warning-border',
    content:
      '[&_p]:text-callout-warning-text/90! text-callout-warning-text/90! [&_em]:text-callout-warning-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-warning-text [&_a]:text-callout-warning-text [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_.endpoint-badge]:text-callout-warning-text! [&_.endpoint-badge]:bg-callout-warning-text/10! [&_li]:text-callout-warning-text/90! [&_li]:text-[13px]!',
  },
};

export function Callout({ children, type = 'info' }: CalloutProps) {
  const { bg, border, content } = styles[type];

  return (
    <div
      className={`my-8 rounded-xl border overflow-hidden not-prose py-3 px-4 backdrop-blur-md [&_p]:text-[13px]! text-[13px]! leading-relaxed [&_em]:not-italic ${bg} ${border} ${content}`}
    >
      {children}
    </div>
  );
}
