'use client';

import { useState } from 'react';
import { CopiedTooltip } from './copied-tooltip';

export function CopyableInlineCode({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = children;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(textArea);
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <code
        onClick={handleCopy}
        className={`bg-glass backdrop-blur-md border border-glass-border px-1 py-0.5 rounded-md text-[13px] font-mono text-text-primary mx-0.5 cursor-pointer hover:bg-glass-hover transition-colors whitespace-nowrap ${className || ''}`}
      >
        {children}
      </code>
    </CopiedTooltip>
  );
}
