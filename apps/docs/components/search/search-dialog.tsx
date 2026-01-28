'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, SquareTerminal, Loader2, BookText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/search/indexer';

// Генерация param ID из пути (аналогично schema-tree.tsx)
// Путь может содержать -- как разделитель для enum значений
function generateParamId(path: string): string {
  return `param-${path
    .replace(/\./g, '-')
    .replace(/\[\]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

interface SearchDialogProps {
  onClose: () => void;
}

export function SearchDialog({ onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Handle navigation with optional param hash
  const handleResultClick = (result: SearchResult) => {
    onClose();

    // If we have a matched field with a path, navigate with hash
    if (result.matchedValue?.path) {
      const paramId = generateParamId(result.matchedValue.path);
      const url = `${result.url}#${paramId}`;
      router.push(url);
      // Trigger section opening and scroll
      // First event opens sections, second event (after sections render) triggers scroll
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('param-navigation'));
      }, 100);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('param-navigation'));
      }, 400);
    } else {
      router.push(result.url);
    }
  };

  // Remove tags from description
  const removeTagsFromDescription = (text: string) => {
    return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  };

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  if (!mounted) {
    return null;
  }

  const dialogContent = (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-start justify-center pt-[60px] pb-[60px] px-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-2xl w-full max-w-2xl max-h-[calc(100vh-120px)] overflow-hidden border border-background-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Поиск в документации..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-lg bg-transparent text-text-primary font-medium text-[15px]"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-background-secondary rounded text-text-tertiary">
            ESC
          </kbd>
        </div>

        <div className="overflow-y-auto  max-h-[calc(100vh-168px)] custom-scrollbar">
          {isLoading && (
            <div className="p-6 text-[14px]! text-center text-text-tertiary border-t border-background-border flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> <span>Поиск...</span>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="p-6 text-[14px]! text-center text-text-secondary border-t border-background-border">
              Ничего не найдено
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="divide-y divide-background-border border-t border-background-border">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="block w-full text-left px-4 py-3 hover:bg-background-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {result.type === 'guide' ? (
                        <BookText className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <SquareTerminal className="w-4 h-4 text-text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary mb-1 text-[15px]">
                        {result.title}
                      </div>
                      {result.matchedValue?.path && (
                        <div className=" text-xs mb-1">
                          <span className="text-text-secondary flex items-center overflow-hidden gap-1 min-w-0">
                            <code className="text-[13px] font-bold font-mono text-text-secondary shrink-0">
                              {result.matchedValue.value}
                            </code>
                            {result.matchedValue.description && (
                              <span className="text-[13px] text-nowrap overflow-hidden text-ellipsis">
                                {' '}
                                {result.matchedValue.description.toLowerCase()}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {result.description && (
                        <div className="text-sm text-text-primary line-clamp-2">
                          {removeTagsFromDescription(result.description)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
