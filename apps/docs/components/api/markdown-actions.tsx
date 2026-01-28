'use client';

import { useState } from 'react';
import { Check, Copy, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CopiedTooltip } from './copied-tooltip';

interface MarkdownActionsProps {
  pageUrl: string;
  pageTitle?: string;
  method?: string;
  path?: string;
}

export function MarkdownActions({ pageUrl, pageTitle, method, path }: MarkdownActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
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
        console.error('Both clipboard methods failed:', execError);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      // Fetch markdown content from the .md route
      const mdUrl = pageUrl.endsWith('/') 
        ? `${pageUrl.slice(0, -1)}.md` 
        : `${pageUrl}.md`;
      
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

  const handleCopyMethodPath = async () => {
    if (pageTitle && method && path) {
      const text = `${pageTitle} (${method.toUpperCase()} ${path})`;
      await copyToClipboard(text);
    }
    setDropdownOpen(false);
  };

  const handleCopyPageUrl = async () => {
    const fullUrl = typeof window !== 'undefined' ? window.location.href : pageUrl;
    await copyToClipboard(fullUrl);
    setDropdownOpen(false);
  };

  const handleOpenMarkdown = () => {
    const mdUrl = pageUrl.endsWith('/') 
      ? `${pageUrl.slice(0, -1)}.md` 
      : `${pageUrl}.md`;
    window.open(mdUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-3 text-[13px]">
      <button
        onClick={handleOpenMarkdown}
        className="flex h-7 items-center gap-1 text-text-secondary font-medium hover:text-text-primary transition-colors cursor-pointer text-nowrap overflow-hidden outline-none"
      >
        <svg className='shrink-0' height="16" viewBox="0 0 208 128" width="20" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" clipRule="evenodd" d="m15 10a5 5 0 0 0 -5 5v98a5 5 0 0 0 5 5h178a5 5 0 0 0 5-5v-98a5 5 0 0 0 -5-5zm-15 5c0-8.284 6.716-15 15-15h178c8.284 0 15 6.716 15 15v98c0 8.284-6.716 15-15 15h-178c-8.284 0-15-6.716-15-15z" fillRule="evenodd"/><path fill="currentColor" d="m30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zm125 0-30-33h20v-35h20v35h20z"/></svg>
        <span className="text-ellipsis overflow-hidden block w-full">Открыть как Markdown</span>
      </button>

      <div className="w-px h-4 bg-background-border" />

      <div className="relative">
        <CopiedTooltip open={copied}>
          <div>
            <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenu.Trigger asChild>
                <button
                  className="h-7 outline-none flex items-center gap-1 text-text-secondary font-medium hover:text-text-primary transition-colors cursor-pointer text-nowrap overflow-hidden"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#50A14F] dark:text-[#98C379] shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                  )}
                  <span className="text-ellipsis overflow-hidden block w-full">Скопировать</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content 
                  className="z-50 min-w-[220px] bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                  align="start"
                >
                  <DropdownMenu.Item
                    onClick={handleCopyMarkdown}
                    className="flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                  >
                    Версию страницы для LLM
                  </DropdownMenu.Item>
                  
                  {pageTitle && method && path && (
                    <DropdownMenu.Item
                      onClick={handleCopyMethodPath}
                      className="flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                    >
                      Название метода и путь
                    </DropdownMenu.Item>
                  )}
                  
                  <DropdownMenu.Item
                    onClick={handleCopyPageUrl}
                    className="flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                  >
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
