import React from 'react';
import { BoxedPanel } from './boxed-panel';

interface CalloutProps {
  children: React.ReactNode;
  title?: string;
  type?: 'info' | 'warning';
}

export function Callout({ children, title, type = 'info' }: CalloutProps) {
  const defaultTitle = type === 'warning' ? 'ВНИМАНИЕ' : 'ПРИМЕЧАНИЕ';
  const isWarning = type === 'warning';
  
  const bgClass = isWarning ? 'bg-callout-warning-bg!' : 'bg-callout-info-bg!';
  const borderClass = isWarning ? 'border-callout-warning-border!' : 'border-callout-info-border!';
  const headerBgClass = isWarning ? 'bg-callout-warning-header-bg!' : 'bg-callout-info-header-bg!';
  const headerTextClass = isWarning ? 'text-callout-warning-text' : 'text-callout-info-text';
  const contentTextClass = isWarning 
    ? '[&_p]:text-callout-warning-text/90! text-callout-warning-text/90! [&_em]:text-callout-warning-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-warning-text [&_a]:text-callout-warning-text [&_a]:underline' 
    : '[&_p]:text-callout-info-text/90! text-callout-info-text/90! [&_em]:text-callout-info-text/70 [&]:text-inherit [&_p]:mb-0! [&_p]:last:mb-0 [&_code]:text-callout-info-text [&_a]:text-callout-info-text [&_a]:underline';

  return (
    <BoxedPanel 
      header={
        <span className={`text-[10px] font-bold uppercase tracking-widest ${headerTextClass}`}>
          {title || defaultTitle}
        </span>
      }
      className={`my-8 ${bgClass} ${borderClass}`}
      headerClassName={`${headerBgClass} ${borderClass}`}
      contentClassName={`p-4 [&_p]:text-[13px]! text-[13px]! leading-relaxed [&_em]:not-italic ${contentTextClass}`}
    >
      {children}
    </BoxedPanel>
  );
}
