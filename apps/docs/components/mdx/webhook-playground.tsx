'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, Play, ChevronDown } from 'lucide-react';
import { MessagePreview } from '@/components/mdx/message-preview';

type TemplateEngine = 'liquid' | 'mustache';

const STORAGE_KEY = 'webhook-playground';
const DEFAULT_JSON = `{
  "client": "Иван Петров",
  "amount": 15000,
  "status": "оплачен",
  "project": { "name": "Pachca" }
}`;
const DEFAULT_INITIAL_TEMPLATE = `Заказ от **{{ client }}** на сумму {{ amount }} ₽ — {{ status }}
Проект: {{ project.name }}`;

function loadState(): { engine: TemplateEngine; json: string; template: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        engine: parsed.engine === 'mustache' ? 'mustache' : 'liquid',
        json: typeof parsed.json === 'string' ? parsed.json : DEFAULT_JSON,
        template: typeof parsed.template === 'string' ? parsed.template : '',
      };
    }
  } catch {
    // ignore
  }
  return { engine: 'liquid', json: DEFAULT_JSON, template: DEFAULT_INITIAL_TEMPLATE };
}

function saveState(engine: TemplateEngine, json: string, template: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ engine, json, template }));
  } catch {
    // ignore
  }
}

/** Backend-compatible CleanContent: unescape HTML entities, trim leading/trailing newlines */
function cleanContent(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

const DEFAULT_TEMPLATE = '{{message}}';
const MAX_MESSAGE_LENGTH = 40_000;

async function renderTemplate(
  engine: TemplateEngine,
  jsonStr: string,
  template: string
): Promise<{ content: string; error?: string }> {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { content: '', error: 'JSON parse error' };
  }

  // Backend: template.presence || '{{message}}'
  const effectiveTemplate = template.trim() || DEFAULT_TEMPLATE;

  let rendered: string;
  try {
    if (engine === 'liquid') {
      const { Liquid } = await import('liquidjs');
      const liquid = new Liquid();
      rendered = liquid.parseAndRenderSync(effectiveTemplate, data);
    } else {
      const Mustache = await import('mustache');
      rendered = Mustache.default.render(effectiveTemplate, data);
    }
  } catch (e) {
    // Backend: template errors are sent as regular messages
    const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
    return { content: `Ошибка в шаблоне: ${msg}` };
  }

  // Backend: Webhooks::CleanContent — unescape HTML entities, trim newlines
  const cleaned = cleanContent(rendered);

  // Backend: empty content or over 40,000 chars → message not sent
  if (!cleaned) {
    return { content: '', error: 'Пустое сообщение — не будет отправлено' };
  }

  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    return {
      content: '',
      error: `Сообщение превышает ${MAX_MESSAGE_LENGTH.toLocaleString()} символов (${cleaned.length.toLocaleString()}) — не будет отправлено`,
    };
  }

  return { content: cleaned };
}

const ENGINE_LABELS: Record<TemplateEngine, string> = {
  liquid: 'Liquid',
  mustache: 'Mustache',
};

function EngineDropdown({
  value,
  onChange,
}: {
  value: TemplateEngine;
  onChange: (v: TemplateEngine) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center bg-glass border border-glass-border gap-1.5 px-2 py-1.5 rounded-md text-[13px] font-medium text-text-primary transition-colors cursor-pointer outline-none select-none">
          {ENGINE_LABELS[value]}
          <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="mt-2 z-[10000] min-w-[140px] bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 space-y-0.5 shadow-xl animate-dropdown"
          align="start"
        >
          {(Object.keys(ENGINE_LABELS) as TemplateEngine[]).map((key) => (
            <DropdownMenu.Item
              key={key}
              onClick={() => onChange(key)}
              className={`flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                key === value
                  ? 'text-primary bg-glass-hover'
                  : 'text-text-primary hover:bg-glass-hover'
              }`}
            >
              {ENGINE_LABELS[key]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

interface WebhookPlaygroundProps {
  buttonText?: string;
}

export function WebhookPlayground({ buttonText = 'Попробовать шаблон' }: WebhookPlaygroundProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [engine, setEngine] = useState<TemplateEngine>(() => loadState().engine);
  const [jsonInput, setJsonInput] = useState(() => loadState().json);
  const [template, setTemplate] = useState(() => loadState().template);
  const [renderedContent, setRenderedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Save state on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => saveState(engine, jsonInput, template), 500);
    return () => clearTimeout(timer);
  }, [engine, jsonInput, template]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when open
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

  // Render template
  const doRender = useCallback(async () => {
    const result = await renderTemplate(engine, jsonInput, template);
    setRenderedContent(result.content || '');
    setError(result.error ?? null);
  }, [engine, jsonInput, template]);

  // Auto-render on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(doRender, 300);
    return () => clearTimeout(timer);
  }, [doRender]);

  const handleEngineChange = (newEngine: TemplateEngine) => {
    setEngine(newEngine);
  };

  const modal = isOpen
    ? createPortal(
        <div className="fixed inset-0 bg-[oklch(0%_0_0/0.6)] z-[9999] flex items-center justify-center pt-[60px] pb-[60px] px-4">
          <div className="bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl shadow-xl w-full max-w-[1200px] h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-glass-heavy-border shrink-0">
              <h2 className="text-[16px] font-semibold text-text-primary">
                Превью входящего вебхука
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer rounded-lg hover:bg-glass-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body — split */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              {/* Left: editors */}
              <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-glass-border">
                {/* JSON editor */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-3 shrink-0">
                    <span className="text-[13px] font-medium text-text-primary">Входящий JSON</span>
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
                    className="flex-1 w-full resize-none px-4 py-3 font-mono text-[13px] leading-relaxed text-text-primary bg-transparent outline-none custom-scrollbar"
                    placeholder='{ "message": "Текст сообщения" }'
                  />
                </div>

                {/* Template editor — always visible */}
                <div className="flex-1 flex flex-col min-h-0 border-t border-glass-border">
                  <div className="px-4 py-3 shrink-0 flex items-center justify-between">
                    <EngineDropdown value={engine} onChange={handleEngineChange} />
                  </div>
                  <textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const t = e.currentTarget;
                        const s = t.selectionStart;
                        const end = t.selectionEnd;
                        const v = t.value.substring(0, s) + '  ' + t.value.substring(end);
                        setTemplate(v);
                        requestAnimationFrame(() => {
                          t.selectionStart = t.selectionEnd = s + 2;
                        });
                      }
                    }}
                    spellCheck={false}
                    className="flex-1 w-full resize-none px-4 py-3 font-mono text-[13px] leading-relaxed text-text-primary bg-transparent outline-none custom-scrollbar"
                    placeholder="Оставьте пустым, чтобы использовать поле message из JSON"
                  />
                </div>
              </div>

              {/* Right: preview */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="min-h-full flex items-center justify-center p-6">
                    <div className="w-full max-w-[480px] bg-glass-heavy backdrop-blur-xl rounded-2xl border border-glass-heavy-border overflow-hidden">
                      {error ? (
                        <div className="p-4 text-[13px] text-accent-red">{error}</div>
                      ) : (
                        <MessagePreview
                          msg={{ content: renderedContent, display_name: 'Заявки' }}
                        />
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
        className="inline-flex items-center gap-2 px-5 h-10 text-[14px] font-medium text-white rounded-full bg-primary/80 backdrop-blur-md border border-primary/20 hover:bg-primary/90 transition-all duration-200 cursor-pointer my-4 shadow-[0_2px_12px_var(--color-primary)/15%]"
      >
        <Play className="w-4 h-4" />
        {buttonText}
      </button>
      {modal}
    </>
  );
}
