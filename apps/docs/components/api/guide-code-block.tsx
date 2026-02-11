'use client';

import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';
import { BoxedPanel } from './boxed-panel';

interface GuideCodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

export function GuideCodeBlock({ code, language, title }: GuideCodeBlockProps) {
  return (
    <BoxedPanel
      header={
        <>
          {title ? (
            <span className="text-[13px] font-medium text-text-primary truncate">{title}</span>
          ) : (
            <div />
          )}
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
