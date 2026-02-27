'use client';

import { useState } from 'react';
import { Check, Copy, ChevronDown, FileText, Link, Bot } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CopiedTooltip } from './copied-tooltip';

interface MarkdownActionsProps {
  pageUrl: string;
  pageTitle?: string;
}

export function MarkdownActions({ pageUrl }: MarkdownActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
        console.error('Both clipboard methods failed:', execError);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      // Fetch markdown content from the .md route
      const mdUrl = pageUrl.endsWith('/') ? `${pageUrl.slice(0, -1)}.md` : `${pageUrl}.md`;

      const response = await fetch(mdUrl);
      if (response.ok) {
        const markdown = await response.text();
        await copyToClipboard(markdown);
        setDropdownOpen(false);
      }
    } catch (error) {
      console.error('Failed to copy markdown:', error);
    }
  };

  const handleCopyMarkdownUrl = async () => {
    const mdUrl = pageUrl.endsWith('/') ? `${pageUrl.slice(0, -1)}.md` : `${pageUrl}.md`;
    const fullMdUrl = typeof window !== 'undefined' ? `${window.location.origin}${mdUrl}` : mdUrl;
    await copyToClipboard(fullMdUrl);
    setDropdownOpen(false);
  };

  const handleCopyPageUrl = async () => {
    const fullUrl = typeof window !== 'undefined' ? window.location.href : pageUrl;
    await copyToClipboard(fullUrl);
    setDropdownOpen(false);
  };

  const handleOpenMarkdown = () => {
    const mdUrl = pageUrl.endsWith('/') ? `${pageUrl.slice(0, -1)}.md` : `${pageUrl}.md`;
    window.open(mdUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-3 text-[13px]">
      <button
        onClick={handleOpenMarkdown}
        className="flex h-7 items-center gap-1 text-text-secondary font-medium hover:text-text-primary transition-colors cursor-pointer text-nowrap overflow-hidden outline-none"
      >
        <svg
          className="shrink-0"
          aria-hidden="true"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7L5.5 7 4 5H2v6h2V8l1.5 1.92L7 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z"
          />
        </svg>
        <span className="text-ellipsis overflow-hidden block w-full">Открыть как Markdown</span>
      </button>

      <div className="w-px h-4 bg-background-border" />

      <div className="relative">
        <CopiedTooltip open={copied}>
          <div>
            <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenu.Trigger asChild>
                <button className="h-7 outline-none flex items-center gap-1 text-text-secondary font-medium hover:text-text-primary transition-colors cursor-pointer text-nowrap overflow-hidden">
                  {copied ? (
                    <Check
                      className="w-3.5 h-3.5 text-[#50A14F] dark:text-[#98C379] shrink-0"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                  )}
                  <span className="text-ellipsis overflow-hidden block w-full">Скопировать</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[220px] bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-dropdown"
                  align="start"
                >
                  <DropdownMenu.Item
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                  >
                    <Bot className="w-4 h-4" />
                    Версию страницы для LLM
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onClick={handleCopyMarkdownUrl}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                  >
                    <FileText className="w-4 h-4" />
                    Ссылку на .md версию
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onClick={handleCopyPageUrl}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                  >
                    <Link className="w-4 h-4" />
                    Ссылку на страницу
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </CopiedTooltip>
      </div>
    </div>
  );
}
