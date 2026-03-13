'use client';

import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';
import { BoxedPanel } from './boxed-panel';

interface GuideCodeBlockProps {
  code: string;
  language: string;
  title?: string;
  className?: string;
  copyButton?: boolean;
}

export function GuideCodeBlock({
  code,
  language,
  title,
  className,
  copyButton = true,
}: GuideCodeBlockProps) {
  if (!title) {
    return (
      <div
        className={`bg-glass rounded-xl border border-glass-border overflow-hidden not-prose relative ${className ?? 'my-4'}`}
      >
        {copyButton && (
          <div className="absolute top-0 right-0 z-10 pl-3 pb-2 pt-2 pr-3 rounded-bl-xl rounded-tl-xl backdrop-blur-sm">
            <CopyButton text={code} />
          </div>
        )}
        <div
          className={`overflow-x-auto overflow-y-hidden custom-scrollbar py-2.5 headerless-code rounded-xl ${copyButton ? 'min-h-[var(--boxed-header-height)]' : 'no-copy'}`}
        >
          <CodeBlock code={code.trim()} language={language} />
        </div>
      </div>
    );
  }

  return (
    <BoxedPanel
      className={className ?? 'my-4'}
      header={
        <>
          <span className="text-[13px] font-medium text-text-primary truncate">{title}</span>
          {copyButton && <CopyButton text={code} />}
        </>
      }
      headerClassName=""
      contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
    >
      <CodeBlock code={code.trim()} language={language} />
    </BoxedPanel>
  );
}
