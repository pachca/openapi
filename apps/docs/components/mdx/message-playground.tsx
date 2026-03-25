'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play } from 'lucide-react';
import { MessagePreview } from '@/components/mdx/message-preview';
import type { MessagePayload } from '@/components/mdx/message-preview';

// ─── constants ───────────────────────────────────────────────────

const STORAGE_KEY = 'message-playground';

const DEFAULT_JSON = `{
  "message": {
    "entity_id": 334,
    "content": "Новая заявка на отпуск от **Иван Петров**\\n20.03 – 02.04 (14 дней)",
    "buttons": [
      [
        { "text": "👍 Согласовать", "data": "approve" },
        { "text": "❌ Отклонить", "data": "reject" }
      ],
      [
        { "text": "🕒 Перенести на неделю", "data": "postpone" }
      ],
      [
        { "text": "Открыть заявку", "url": "https://hr.example.com/requests/42" }
      ]
    ],
    "display_name": "HR-бот"
  }
}`;

// ─── helpers ─────────────────────────────────────────────────────

interface ParsedRequest {
  message?: MessagePayload;
  link_preview?: boolean;
}

function loadState(): { json: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { json: typeof parsed.json === 'string' ? parsed.json : DEFAULT_JSON };
    }
  } catch {
    // ignore
  }
  return { json: DEFAULT_JSON };
}

function saveState(json: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ json }));
  } catch {
    // ignore
  }
}

function parseMessage(jsonStr: string): { payload: ParsedRequest | null; error: string | null } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { payload: null, error: 'JSON должен быть объектом' };
    }
    return { payload: data as ParsedRequest, error: null };
  } catch {
    return { payload: null, error: 'Невалидный JSON' };
  }
}

// ─── main component ──────────────────────────────────────────────

interface MessagePlaygroundProps {
  buttonText?: string;
}

export function MessagePlayground({ buttonText = 'Попробовать' }: MessagePlaygroundProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState(() => loadState().json);
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persist state
  useEffect(() => {
    const timer = setTimeout(() => saveState(jsonInput), 500);
    return () => clearTimeout(timer);
  }, [jsonInput]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Parse JSON
  const doParse = useCallback(() => {
    const { payload, error: err } = parseMessage(jsonInput);
    setParsed(payload);
    setError(err);
  }, [jsonInput]);

  useEffect(() => {
    const timer = setTimeout(doParse, 300);
    return () => clearTimeout(timer);
  }, [doParse]);

  const msg = parsed?.message;
  const linkPreview = parsed?.link_preview ?? false;

  const modal = isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0%_0_0/0.6)] px-4 pt-[60px] pb-[60px]">
          <div className="flex h-[calc(100vh-120px)] w-full max-w-[1200px] flex-col overflow-hidden rounded-xl border border-glass-heavy-border bg-glass-heavy shadow-xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-glass-heavy-border px-4 py-3">
              <h2 className="text-[16px] font-semibold text-text-primary">Превью сообщения</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-glass-hover hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — split */}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              {/* Left: JSON editor */}
              <div className="flex min-h-0 flex-1 flex-col border-b border-glass-border lg:border-r lg:border-b-0">
                <div className="shrink-0 px-4 py-3">
                  <span className="text-[13px] font-medium text-text-primary">
                    JSON-объект сообщения
                  </span>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const t = e.currentTarget;
                      const s = t.selectionStart;
                      const end = t.selectionEnd;
                      const v = t.value.substring(0, s) + '  ' + t.value.substring(end);
                      setJsonInput(v);
                      requestAnimationFrame(() => {
                        t.selectionStart = t.selectionEnd = s + 2;
                      });
                    }
                  }}
                  spellCheck={false}
                  className="custom-scrollbar w-full flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-text-primary outline-none"
                  placeholder='{ "message": { "entity_id": 334, "content": "Текст" } }'
                />
              </div>

              {/* Right: preview */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="custom-scrollbar flex-1 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-6">
                    <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-glass-heavy-border bg-glass-heavy backdrop-blur-xl">
                      {error ? (
                        <div className="p-4 text-[13px] text-accent-red">{error}</div>
                      ) : msg ? (
                        <MessagePreview msg={msg} linkPreview={linkPreview} />
                      ) : (
                        <div className="p-4 text-[13px] text-text-tertiary">
                          Добавьте объект <code className="wp-inline-code">message</code> в JSON
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="my-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-primary/80 px-5 text-[14px] font-medium text-white shadow-[0_2px_12px_var(--color-primary)/15%] backdrop-blur-md transition-all duration-200 hover:bg-primary/90"
      >
        <Play className="h-4 w-4" />
        {buttonText}
      </button>
      {modal}
    </>
  );
}
