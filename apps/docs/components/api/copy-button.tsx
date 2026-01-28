'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { CopiedTooltip } from './copied-tooltip';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (clipboardError) {
      // Fallback to older method if clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (execError) {
        console.error('Failed to copy:', execError);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <button
        onClick={handleCopy}
        className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-200 cursor-pointer text-text-secondary hover:text-text-primary`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#50A14F] dark:text-[#98C379]" strokeWidth={2.5} />
        ) : (
          <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />
        )}
      </button>
    </CopiedTooltip>
  );
}
