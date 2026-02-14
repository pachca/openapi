import React from 'react';

type CalloutType = 'info' | 'warning' | 'danger';

interface CalloutProps {
  children: React.ReactNode;
  type?: CalloutType;
}

const styles: Record<CalloutType, { bg: string; border: string; content: string }> = {
  info: {
    bg: 'bg-callout-info-bg',
    border: 'border-callout-info-border',
    content:
      '[&_p]:text-callout-info-text/90! text-callout-info-text/90! [&_em]:text-callout-info-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-info-text [&_a]:text-callout-info-text [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_.endpoint-badge]:text-callout-info-text! [&_.endpoint-badge]:bg-callout-info-text/10! [&_li]:text-callout-info-text/90! [&_li]:text-[13px]!',
  },
  warning: {
    bg: 'bg-callout-warning-bg',
    border: 'border-callout-warning-border',
    content:
      '[&_p]:text-callout-warning-text/90! text-callout-warning-text/90! [&_em]:text-callout-warning-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-warning-text [&_a]:text-callout-warning-text [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_.endpoint-badge]:text-callout-warning-text! [&_.endpoint-badge]:bg-callout-warning-text/10! [&_li]:text-callout-warning-text/90! [&_li]:text-[13px]!',
  },
  danger: {
    bg: 'bg-callout-danger-bg',
    border: 'border-callout-danger-border',
    content:
      '[&_p]:text-callout-danger-text/90! text-callout-danger-text/90! [&_em]:text-callout-danger-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-danger-text [&_a]:text-callout-danger-text [&_a]:underline [&_p+ul]:mt-4! [&_p+ul]:mb-0! [&_p+ol]:mt-4! [&_.endpoint-badge]:text-callout-danger-text! [&_.endpoint-badge]:bg-callout-danger-text/10! [&_li]:text-callout-danger-text/90! [&_li]:text-[13px]!',
  },
};

export function Callout({ children, type = 'info' }: CalloutProps) {
  const { bg, border, content } = styles[type];

  return (
    <div
      className={`my-8 rounded-lg border overflow-hidden not-prose py-3 px-4 [&_p]:text-[13px]! text-[13px]! leading-relaxed [&_em]:not-italic ${bg} ${border} ${content}`}
    >
      {children}
    </div>
  );
}
