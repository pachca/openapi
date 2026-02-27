'use client';

import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';
import { CopiedTooltip } from './copied-tooltip';

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

export function HeadingLink({ id, searchParam }: { id: string; searchParam?: string }) {
  const [copied, setCopied] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleCopyLink = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const basePath = searchParam
      ? `${window.location.origin}/guides/updates/${encodeURIComponent(searchParam)}`
      : `${window.location.origin}${window.location.pathname}`;
    const url = `${basePath}#${id}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setShowCheck(true);
      setIsVisible(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setIsVisible(false), 2110);
      setTimeout(() => setShowCheck(false), 2260);
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <button
        onClick={handleCopyLink}
        className={`heading-link-btn cursor-pointer absolute right-full mr-1 top-[0.6em] -translate-y-1/2 ${isVisible ? 'opacity-100' : 'opacity-0'} group-hover/heading:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-background-tertiary shrink-0`}
        title="Скопировать ссылку"
        type="button"
      >
        {showCheck ? (
          <Check
            className="w-4 h-4 text-[#50A14F] dark:text-[#98C379] transition-colors"
            strokeWidth={2.5}
          />
        ) : (
          <LinkIcon className="w-4 h-4 text-text-secondary transition-colors" strokeWidth={2.5} />
        )}
      </button>
    </CopiedTooltip>
  );
}
