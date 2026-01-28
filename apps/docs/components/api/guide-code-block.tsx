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
            <span className="py-2 text-[10px] font-bold uppercase tracking-widest text-text-primary">
              {title}
            </span>
          ) : <div />}
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
