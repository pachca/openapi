'use client';

import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';
import { BoxedPanel } from './boxed-panel';

interface GuideCodeBlockProps {
  code: string;
  language: string;
  title?: string;
  className?: string;
}

export function GuideCodeBlock({ code, language, title, className }: GuideCodeBlockProps) {
  if (!title) {
    return (
      <div
        className={`bg-background-tertiary rounded-lg border border-background-border overflow-hidden not-prose relative ${className ?? 'my-8'}`}
      >
        <div className="absolute top-0 right-0 z-10 bg-background-tertiary pl-3 pb-2 pt-2 pr-3 rounded-bl-md">
          <CopyButton text={code} />
        </div>
        <div className="overflow-x-auto custom-scrollbar py-2.5 headerless-code min-h-[var(--boxed-header-height)]">
          <CodeBlock code={code.trim()} language={language} />
        </div>
      </div>
    );
  }

  return (
    <BoxedPanel
      className={className}
      header={
        <>
          <span className="text-[13px] font-medium text-text-primary truncate">{title}</span>
          <CopyButton text={code} />
        </>
      }
      headerClassName=""
      contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
    >
      <CodeBlock code={code.trim()} language={language} />
    </BoxedPanel>
  );
}
