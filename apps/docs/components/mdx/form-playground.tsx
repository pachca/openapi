'use client';

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Plus,
  Heading2,
  Type,
  Code2,
  Minus,
  TextCursorInput,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CheckSquare,
  Calendar,
  Clock,
  Paperclip,
  Trash2,
  FileText,
  Settings,
  Copy,
  Check,
  Braces,
  Eye,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { renderMarkdown } from '@/components/mdx/message-preview';

// ─── types ───────────────────────────────────────────────────────

interface ViewBlock {
  type: string;
  _id: string;
  [key: string]: unknown;
}

let _blockIdCounter = 0;
function nextBlockId(): string {
  _blockIdCounter += 1;
  return `blk_${Date.now()}_${_blockIdCounter}`;
}

interface FormState {
  title: string;
  submit_text: string;
  close_text: string;
  blocks: ViewBlock[];
}

interface SelectOption {
  text: string;
  value: string;
  description?: string;
  selected?: boolean;
}

interface CheckboxOption {
  text: string;
  value: string;
  description?: string;
  checked?: boolean;
}

// ─── constants ───────────────────────────────────────────────────

const STORAGE_KEY = 'form-playground';

const DEFAULT_STATE: FormState = {
  title: 'Заявка на отпуск',
  submit_text: 'Отправить',
  close_text: 'Отменить',
  blocks: [
    { _id: 'def_1', type: 'header', text: 'Заполните данные заявки' },
    {
      _id: 'def_2',
      type: 'input',
      name: 'reason',
      label: 'Причина',
      required: true,
      placeholder: 'Укажите причину отпуска',
      hint: 'Кратко опишите причину отсутствия',
    },
    { _id: 'def_3', type: 'date', name: 'date_start', label: 'Дата начала', required: true },
    { _id: 'def_4', type: 'date', name: 'date_end', label: 'Дата окончания', required: true },
    {
      _id: 'def_5',
      type: 'select',
      name: 'type',
      label: 'Тип отпуска',
      options: [
        { text: 'Ежегодный', value: 'annual' },
        { text: 'За свой счёт', value: 'unpaid' },
        { text: 'Учебный', value: 'study' },
      ],
    },
  ],
};

interface BlockTemplate {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  category: 'display' | 'input';
  create: (index: number) => ViewBlock;
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    type: 'header',
    label: 'Заголовок',
    icon: Heading2,
    category: 'display',
    create: () => ({ _id: nextBlockId(), type: 'header', text: 'Заголовок секции' }),
  },
  {
    type: 'plain_text',
    label: 'Текст',
    icon: Type,
    category: 'display',
    create: () => ({ _id: nextBlockId(), type: 'plain_text', text: 'Обычный текст' }),
  },
  {
    type: 'markdown',
    label: 'Markdown',
    icon: Code2,
    category: 'display',
    create: () => ({ _id: nextBlockId(), type: 'markdown', text: '**Жирный** и *курсив*' }),
  },
  {
    type: 'divider',
    label: 'Разделитель',
    icon: Minus,
    category: 'display',
    create: () => ({ _id: nextBlockId(), type: 'divider' }),
  },
  {
    type: 'input',
    label: 'Текстовое поле',
    icon: TextCursorInput,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'input',
      name: `field_${i}`,
      label: 'Текстовое поле',
      placeholder: 'Введите текст',
    }),
  },
  {
    type: 'select',
    label: 'Выпадающий список',
    icon: ChevronDown,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'select',
      name: `select_${i}`,
      label: 'Выбор',
      options: [
        { text: 'Вариант 1', value: '1' },
        { text: 'Вариант 2', value: '2' },
      ],
    }),
  },
  {
    type: 'radio',
    label: 'Радиокнопки',
    icon: CircleDot,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'radio',
      name: `radio_${i}`,
      label: 'Выбор варианта',
      options: [
        { text: 'Вариант A', value: 'a' },
        { text: 'Вариант B', value: 'b' },
      ],
    }),
  },
  {
    type: 'checkbox',
    label: 'Чекбоксы',
    icon: CheckSquare,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'checkbox',
      name: `checkbox_${i}`,
      label: 'Множественный выбор',
      options: [
        { text: 'Пункт 1', value: '1' },
        { text: 'Пункт 2', value: '2' },
      ],
    }),
  },
  {
    type: 'date',
    label: 'Дата',
    icon: Calendar,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'date',
      name: `date_${i}`,
      label: 'Выберите дату',
    }),
  },
  {
    type: 'time',
    label: 'Время',
    icon: Clock,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'time',
      name: `time_${i}`,
      label: 'Выберите время',
    }),
  },
  {
    type: 'file_input',
    label: 'Файл',
    icon: Paperclip,
    category: 'input',
    create: (i) => ({
      _id: nextBlockId(),
      type: 'file_input',
      name: `file_${i}`,
      label: 'Прикрепите файл',
    }),
  },
];

// ─── helpers ─────────────────────────────────────────────────────

function loadState(): FormState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks)) {
        // Migrate blocks without _id
        parsed.blocks = parsed.blocks.map((b: ViewBlock) =>
          b._id ? b : { ...b, _id: nextBlockId() }
        );
        return parsed as FormState;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function saveState(state: FormState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function stateToJson(state: FormState): string {
  // Strip internal _id from output
  const clean = {
    ...state,
    blocks: state.blocks.map(({ _id, ...rest }) => rest),
  };
  return JSON.stringify(clean, null, 2);
}

function jsonToState(json: string): { state: FormState | null; error: string | null } {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') {
      return { state: null, error: 'JSON должен быть объектом' };
    }
    if (!Array.isArray(data.blocks)) {
      return { state: null, error: 'Поле blocks должно быть массивом' };
    }
    return {
      state: {
        title: String(data.title || ''),
        submit_text: String(data.submit_text || 'Отправить'),
        close_text: String(data.close_text || 'Отменить'),
        blocks: data.blocks.map((b: ViewBlock) => (b._id ? b : { ...b, _id: nextBlockId() })),
      },
      error: null,
    };
  } catch {
    return { state: null, error: 'Невалидный JSON' };
  }
}

// ─── block palette ───────────────────────────────────────────────

function BlockPalette({ onAdd }: { onAdd: (template: BlockTemplate) => void }) {
  const displayBlocks = BLOCK_TEMPLATES.filter((b) => b.category === 'display');
  const inputBlocks = BLOCK_TEMPLATES.filter((b) => b.category === 'input');

  return (
    <div className="flex h-full flex-col overflow-y-auto custom-scrollbar">
      <div className="px-3 pt-3 pb-2">
        <span className="text-[13px] font-medium text-text-primary">Отображение</span>
      </div>
      <div className="flex flex-col gap-0.5 px-2">
        {displayBlocks.map((tpl) => (
          <button
            key={tpl.type}
            onClick={() => onAdd(tpl)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-text-primary transition-colors hover:bg-glass-hover"
          >
            <Plus className="h-4 w-4 shrink-0 text-text-secondary" />
            <tpl.icon className="h-4 w-4 shrink-0 text-text-primary" />
            <span>{tpl.label}</span>
          </button>
        ))}
      </div>

      <div className="px-3 pt-4 pb-2">
        <span className="text-[13px] font-medium text-text-primary">Ввод данных</span>
      </div>
      <div className="flex flex-col gap-0.5 px-2 pb-3">
        {inputBlocks.map((tpl) => (
          <button
            key={tpl.type}
            onClick={() => onAdd(tpl)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-text-primary transition-colors hover:bg-glass-hover"
          >
            <Plus className="h-4 w-4 shrink-0 text-text-secondary" />
            <tpl.icon className="h-4 w-4 shrink-0 text-text-primary" />
            <span>{tpl.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── form preview blocks ─────────────────────────────────────────

function PreviewHeader({ block }: { block: ViewBlock }) {
  return <p className="text-[15px] font-semibold text-text-primary">{String(block.text || '')}</p>;
}

function PreviewPlainText({ block }: { block: ViewBlock }) {
  return (
    <p className="text-[14px] leading-relaxed text-text-primary">{String(block.text || '')}</p>
  );
}

function PreviewMarkdown({ block }: { block: ViewBlock }) {
  const html = renderMarkdown(String(block.text || ''));
  return (
    <div
      className="text-[14px] leading-relaxed text-text-primary wp-message"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function PreviewDivider() {
  return (
    <div className="py-2">
      <hr className="border-glass-border" />
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block cursor-[inherit] text-[13px] font-medium text-text-primary">
      {label}
      {required && <span className="ml-0.5 text-accent-red">*</span>}
    </label>
  );
}

function FieldHint({ hint }: { hint?: string }) {
  if (!hint) return null;
  return <p className="mt-1 text-[12px] text-text-tertiary">{hint}</p>;
}

function PreviewInput({ block }: { block: ViewBlock }) {
  const multiline = !!block.multiline;
  const initial = String(block.initial_value || '');
  const [prevInitial, setPrevInitial] = useState(initial);
  const [value, setValue] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setValue(initial);
  }
  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={String(block.placeholder || '')}
          className="min-h-[76px] w-full rounded-lg border border-glass-border bg-glass px-3 py-2 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={String(block.placeholder || '')}
          className="flex h-9 w-full items-center rounded-lg border border-glass-border bg-glass px-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary"
        />
      )}
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

function PreviewSelect({ block }: { block: ViewBlock }) {
  const options = (block.options as SelectOption[] | undefined) || [];
  const [pickedValue, setPickedValue] = useState<string | null>(() => {
    const pre = options.find((o) => o.selected);
    return pre ? pre.value : null;
  });
  const [open, setOpen] = useState(false);
  const picked = options.find((o) => o.value === pickedValue);
  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-glass-border bg-glass px-3 text-left outline-none transition-colors hover:border-text-tertiary"
          >
            <span className={`text-[14px] ${picked ? 'text-text-primary' : 'text-text-tertiary'}`}>
              {picked ? picked.text : 'Выберите значение'}
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-text-primary" />
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-[10000] max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-lg border border-glass-heavy-border bg-glass-heavy p-1 shadow-xl backdrop-blur-xl animate-dropdown custom-scrollbar"
            sideOffset={4}
            align="start"
            collisionPadding={16}
          >
            {options.map((opt, i) => (
              <DropdownMenu.Item
                key={i}
                onSelect={() => setPickedValue(opt.value)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 outline-none transition-colors ${
                  opt.value === pickedValue
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-primary hover:bg-glass-hover'
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col truncate">
                  <span className="truncate text-[14px] font-medium">{opt.text}</span>
                  {opt.description && (
                    <span className="text-[12px] text-text-tertiary">{opt.description}</span>
                  )}
                </span>
                {opt.value === pickedValue && (
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4.5 w-4.5 shrink-0 text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 10l3.5 3.5 6.5-6.5" />
                  </svg>
                )}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

function PreviewRadio({ block }: { block: ViewBlock }) {
  const options = (block.options as SelectOption[] | undefined) || [];
  const [selected, setSelected] = useState<string | null>(() => {
    const pre = options.find((o) => o.selected);
    return pre ? pre.value : null;
  });
  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      <div className="flex flex-col gap-3.5 pt-1.5">
        {options.map((opt, i) => (
          <div
            key={i}
            className="flex cursor-pointer items-start gap-2.5"
            onClick={() => setSelected(opt.value)}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected === opt.value ? 'border-primary' : 'border-glass-heavy-border'
              }`}
            >
              {selected === opt.value && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <div className="overflow-hidden">
              <p className="truncate text-[14px] text-text-primary">{opt.text}</p>
              {opt.description && (
                <p className="overflow-hidden text-[12px] text-ellipsis whitespace-normal text-text-tertiary">
                  {opt.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

function PreviewCheckbox({ block }: { block: ViewBlock }) {
  const options = (block.options as CheckboxOption[] | undefined) || [];
  const [checked, setChecked] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const opt of options) {
      if (opt.checked) initial.add(opt.value);
    }
    return initial;
  });
  const toggle = (value: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };
  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      <div className="flex flex-col gap-3.5 pt-1.5">
        {options.map((opt, i) => {
          const isChecked = checked.has(opt.value);
          return (
            <div
              key={i}
              className="flex cursor-pointer items-start gap-2.5"
              onClick={() => toggle(opt.value)}
            >
              <div className="inline-flex h-5 w-5 items-center justify-center">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    isChecked ? 'border-primary bg-primary' : 'border-glass-heavy-border'
                  }`}
                >
                  {isChecked && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2.5 6l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-[14px] text-text-primary">{opt.text}</p>
                {opt.description && (
                  <p className="overflow-hidden text-[12px] text-ellipsis whitespace-normal text-text-tertiary">
                    {opt.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

const MONTH_NAMES_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const DAY_NAMES_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface CalendarCell {
  day: number;
  month: number; // 0-based
  year: number;
  outside: boolean;
}

function CalendarGrid({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const [viewDate, setViewDate] = useState(() => selected || new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build 6-row fixed grid with outside days (like react-day-picker fixedWeeks + showOutsideDays)
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];
  // Previous month trailing days
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ day: d, month: pm, year: py, outside: true });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, outside: false });
  }
  // Next month leading days — fill to 42 (6 rows)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ day: d, month: nm, year: ny, outside: true });
  }

  const isSelected = (cell: CalendarCell) =>
    selected &&
    selected.getFullYear() === cell.year &&
    selected.getMonth() === cell.month &&
    selected.getDate() === cell.day;

  const today = new Date();
  const isToday = (cell: CalendarCell) =>
    today.getFullYear() === cell.year &&
    today.getMonth() === cell.month &&
    today.getDate() === cell.day;

  return (
    <div className="w-[268px] p-3">
      {/* Month/year header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="cursor-pointer rounded p-1 text-text-secondary transition-colors hover:bg-glass-hover"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[14px] font-medium text-text-primary">
          {MONTH_NAMES_RU[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="cursor-pointer rounded p-1 text-text-secondary transition-colors hover:bg-glass-hover"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {/* Day-of-week header */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_NAMES_RU.map((d) => (
          <div
            key={d}
            className="flex h-8 items-center justify-center text-[13px] text-text-tertiary"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Day cells — 6 rows */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const sel = isSelected(cell);
          const tod = isToday(cell);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(new Date(cell.year, cell.month, cell.day))}
              className={`flex h-8 w-full cursor-pointer items-center justify-center rounded-md text-[13px] font-medium transition-colors ${
                sel
                  ? 'bg-primary/15 text-primary'
                  : tod
                    ? 'font-bold text-text-primary ring-1 ring-inset ring-glass-border hover:bg-glass-hover'
                    : cell.outside
                      ? 'text-text-tertiary hover:bg-glass-hover'
                      : 'text-text-primary hover:bg-glass-hover'
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseInitialDate(raw: unknown): Date | null {
  if (!raw) return null;
  const d = new Date(String(raw));
  return isNaN(d.getTime()) ? null : d;
}

function PreviewDate({ block }: { block: ViewBlock }) {
  const initialKey = String(block.initial_date || '');
  const [prevKey, setPrevKey] = useState(initialKey);
  const [value, setValue] = useState<Date | null>(() => parseInitialDate(block.initial_date));
  if (prevKey !== initialKey) {
    setPrevKey(initialKey);
    setValue(parseInitialDate(block.initial_date));
  }
  const [open, setOpen] = useState(false);

  const formatted = value
    ? `${String(value.getDate()).padStart(2, '0')}.${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`
    : null;

  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-glass-border bg-glass px-3 outline-none transition-colors hover:border-text-tertiary"
          >
            <Calendar className="h-4.5 w-4.5 shrink-0 text-text-secondary" />
            <span
              className={`flex-1 text-left text-[14px] ${formatted ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              {formatted || 'дд.мм.гггг'}
            </span>
            {value && (
              <span
                role="button"
                className="shrink-0 cursor-pointer rounded p-0.5 text-text-tertiary transition-colors hover:text-text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setValue(null);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-[10000] rounded-lg border border-glass-heavy-border bg-glass-heavy shadow-xl backdrop-blur-xl animate-dropdown"
            sideOffset={4}
            align="start"
          >
            <CalendarGrid
              selected={value}
              onSelect={(d) => {
                setValue(d);
                setOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

// Generate time options at 5-min intervals (matching web client)
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 5) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

/** Validate partial/full time string (matching web client logic) */
function isValidTimeInput(val: string): boolean {
  if (!val) return true;
  const regexp = /^\d{0,2}?:?\d{0,2}$/;
  if (!regexp.test(val)) return false;

  const [hoursStr, minutesStr] = val.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return false;
  if (minutesStr !== undefined && !Number.isNaN(minutes) && (minutes < 0 || minutes > 59))
    return false;
  if (minutesStr && minutesStr.length && Number(minutesStr[0]) > 5) return false;
  return true;
}

/** Auto-pad incomplete time on blur */
function padTime(time: string): string | null {
  if (!time.length) return null;
  if (time.length >= 5) return time;
  if (time.length === 1) return `0${time}:00`;
  if (time.length === 2) return `${time}:00`;
  return `${time}${'0'.repeat(5 - time.length)}`;
}

function PreviewTime({ block }: { block: ViewBlock }) {
  const initial = block.initial_time ? String(block.initial_time) : '';
  const [prevInitial, setPrevInitial] = useState(initial);
  const [value, setValue] = useState<string>(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setValue(initial);
  }
  const [listOpen, setListOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (val: string) => {
    if (val.length > 5) return;
    if (!isValidTimeInput(val)) return;

    let newTime = val;
    // Auto-append ":" after typing 2 digits
    if (val.length === 2 && value.length !== 3 && !val.includes(':')) {
      newTime = val + ':';
    }
    // Backspace from "HH:" to "H"
    if (val.length === 2 && value.length === 3) {
      newTime = val.slice(0, 1);
    }
    if (newTime.length > 5) return;
    setValue(newTime);
  };

  const handleBlur = () => {
    const padded = padTime(value);
    if (padded && padded.length === 5) {
      setValue(padded);
    } else if (!value) {
      setValue('');
    }
  };

  const handleSelectOption = (t: string) => {
    setValue(t);
    setListOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      <Popover.Root open={listOpen} onOpenChange={setListOpen}>
        <Popover.Anchor asChild>
          <div
            className="flex h-9 w-full cursor-text items-center gap-2 rounded-lg border border-glass-border bg-glass px-3 transition-colors focus-within:border-primary hover:not-focus-within:border-text-tertiary"
            onClick={() => {
              inputRef.current?.focus();
              setListOpen(true);
            }}
          >
            <Clock className="h-4.5 w-4.5 shrink-0 text-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              placeholder="чч:мм"
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={(e) => {
                e.target.select();
                setListOpen(true);
              }}
              onBlur={handleBlur}
              className="w-full flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-tertiary"
            />
            {value && (
              <span
                role="button"
                className="shrink-0 cursor-pointer rounded p-0.5 text-text-tertiary transition-colors hover:text-text-primary"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            className="z-[10000] max-h-[var(--radix-popover-content-available-height)] min-w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-lg border border-glass-heavy-border bg-glass-heavy p-1 shadow-xl backdrop-blur-xl animate-dropdown custom-scrollbar"
            sideOffset={4}
            align="start"
            collisionPadding={16}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectOption(t)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-[14px] transition-colors ${
                  t === value
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-primary hover:bg-glass-hover'
                }`}
              >
                <span>{t}</span>
                {t === value && (
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 10l3.5 3.5 6.5-6.5" />
                  </svg>
                )}
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

interface PickedFile {
  name: string;
  size: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PreviewFileInput({ block }: { block: ViewBlock }) {
  const filetypes = block.filetypes as string[] | undefined;
  const maxFiles = (block.max_files as number) || 10;
  const [files, setFiles] = useState<PickedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => {
    if (files.length >= maxFiles) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked) return;
    const newFiles: PickedFile[] = [];
    for (let i = 0; i < picked.length && files.length + newFiles.length < maxFiles; i++) {
      const f = picked[i];
      if (f) newFiles.push({ name: f.name, size: f.size });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    // Reset so same file can be picked again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <FieldLabel label={String(block.label || '')} required={!!block.required} />
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={filetypes ? filetypes.join(',') : undefined}
        multiple={maxFiles > 1}
        onChange={handleChange}
      />
      {/* Selected files — shown above the button (like web) */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg border border-glass-border bg-glass px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text-primary">{file.name}</p>
                <p className="text-[12px] text-text-tertiary">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="cursor-pointer rounded p-0.5 text-text-tertiary transition-colors hover:text-accent-red"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {files.length < maxFiles && (
        <button
          type="button"
          onClick={handlePick}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-[14px] font-medium text-text-primary transition-colors hover:bg-glass-hover"
        >
          <Plus className="h-4 w-4 shrink-0 text-primary" />
          Добавить файл
        </button>
      )}
      <FieldHint hint={block.hint as string | undefined} />
    </div>
  );
}

// ─── block settings ─────────────────────────────────────────────

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-text-primary">{label}</span>
      {children}
    </div>
  );
}

const sInputCls =
  'h-7 w-full rounded-md border border-glass-border bg-glass px-2 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary';

function SettingsToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex cursor-pointer items-center gap-2" onClick={() => onChange(!checked)}>
      <div
        role="switch"
        aria-checked={checked}
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-glass-heavy-border'}`}
      >
        <span
          className={`absolute top-[2px] h-3 w-3 rounded-full bg-white transition-transform ${checked ? 'left-[16px]' : 'left-[2px]'}`}
        />
      </div>
      <span className="text-[13px] text-text-primary">{label}</span>
    </div>
  );
}

interface OptionItem {
  text: string;
  value: string;
  description?: string;
  selected?: boolean;
  checked?: boolean;
}

function OptionsEditor({
  options,
  onChange,
  preselect,
}: {
  options: OptionItem[];
  onChange: (opts: OptionItem[]) => void;
  /** 'select' = checkmark, 'radio' = dot-in-circle, 'checked' = checkbox (multi) */
  preselect?: 'select' | 'radio' | 'checked';
}) {
  const update = (index: number, field: string, val: string) => {
    onChange(
      options.map((o, i) => {
        if (i !== index) return o;
        if (field === 'description' && !val.trim()) {
          const { description: _, ...rest } = o;
          return rest;
        }
        return { ...o, [field]: val };
      })
    );
  };

  const togglePreselect = (index: number) => {
    if (!preselect) return;
    if (preselect === 'select' || preselect === 'radio') {
      // Single select — only one can be selected
      onChange(
        options.map((o, i) => {
          const copy = { ...o };
          if (i === index) {
            if (copy.selected) {
              delete copy.selected;
            } else {
              copy.selected = true;
            }
          } else {
            delete copy.selected;
          }
          return copy;
        })
      );
    } else {
      // Checkbox — toggle individually
      onChange(
        options.map((o, i) => {
          if (i !== index) return o;
          const copy = { ...o };
          if (copy.checked) {
            delete copy.checked;
          } else {
            copy.checked = true;
          }
          return copy;
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-medium text-text-primary">Варианты</span>
      {options.map((opt, i) => (
        <div key={i} className="flex items-start gap-1.5">
          {preselect && (
            <Tooltip.Provider delayDuration={0}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => togglePreselect(i)}
                    className="mt-1 cursor-pointer rounded p-0.5 text-text-tertiary transition-colors"
                  >
                    {preselect === 'select' ? (
                      <Check className={`h-3.5 w-3.5 ${opt.selected ? 'text-primary' : ''}`} />
                    ) : preselect === 'radio' ? (
                      <CircleDot className={`h-3.5 w-3.5 ${opt.selected ? 'text-primary' : ''}`} />
                    ) : (
                      <CheckSquare className={`h-3.5 w-3.5 ${opt.checked ? 'text-primary' : ''}`} />
                    )}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    align="center"
                    sideOffset={2}
                    className="z-[10002] pointer-events-none animate-tooltip rounded-md bg-text-primary px-2.5 py-1.5 text-[12px] font-semibold text-background shadow-xl whitespace-nowrap"
                  >
                    {preselect === 'checked' ? 'Отмечено по умолчанию' : 'Выбрано по умолчанию'}
                    <Tooltip.Arrow className="fill-text-primary" width={8} height={4} />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
          <div className="flex flex-1 flex-col gap-1">
            <input
              type="text"
              value={opt.text}
              onChange={(e) => update(i, 'text', e.target.value)}
              placeholder="Текст"
              className={sInputCls}
            />
            <input
              type="text"
              value={opt.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              placeholder="value"
              className={`${sInputCls} font-mono`}
            />
            <input
              type="text"
              value={opt.description || ''}
              onChange={(e) => update(i, 'description', e.target.value)}
              placeholder="Пояснение (необязательно)"
              className={sInputCls}
            />
          </div>
          {options.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(options.filter((_, j) => j !== i))}
              className="mt-1 cursor-pointer rounded p-0.5 text-text-tertiary transition-colors hover:text-accent-red"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          const n = options.length + 1;
          onChange([...options, { text: `Вариант ${n}`, value: String(n) }]);
        }}
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-glass-hover"
      >
        <Plus className="h-4 w-4" />
        Добавить
      </button>
    </div>
  );
}

function BlockSettingsContent({
  block,
  onUpdate,
}: {
  block: ViewBlock;
  onUpdate: (updated: ViewBlock) => void;
}) {
  const set = (key: string, value: unknown) => {
    onUpdate({ ...block, [key]: value });
  };
  const setOptional = (key: string, value: unknown) => {
    if (value === undefined || value === '' || value === false || value === null) {
      const next = { ...block };
      delete next[key];
      onUpdate(next);
    } else {
      onUpdate({ ...block, [key]: value });
    }
  };

  // Text blocks
  if (block.type === 'header' || block.type === 'plain_text' || block.type === 'markdown') {
    return (
      <div className="flex flex-col gap-3 p-3">
        <SettingsField label="Текст">
          <textarea
            value={String(block.text || '')}
            onChange={(e) => set('text', e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-glass-border bg-glass px-2 py-1.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </SettingsField>
      </div>
    );
  }

  const commonFields = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <SettingsField label="Подпись">
          <input
            type="text"
            value={String(block.label || '')}
            onChange={(e) => set('label', e.target.value)}
            className={sInputCls}
          />
        </SettingsField>
        <SettingsField label="Имя (name)">
          <input
            type="text"
            value={String(block.name || '')}
            onChange={(e) => set('name', e.target.value)}
            placeholder="field_name"
            className={`${sInputCls} font-mono`}
          />
        </SettingsField>
      </div>
      <SettingsField label="Подсказка">
        <input
          type="text"
          value={String(block.hint || '')}
          onChange={(e) => setOptional('hint', e.target.value)}
          className={sInputCls}
        />
      </SettingsField>
      <SettingsToggle
        checked={!!block.required}
        onChange={(v) => setOptional('required', v)}
        label="Обязательное"
      />
    </>
  );

  switch (block.type) {
    case 'input':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <SettingsField label="Placeholder">
            <input
              type="text"
              value={String(block.placeholder || '')}
              onChange={(e) => setOptional('placeholder', e.target.value)}
              className={sInputCls}
            />
          </SettingsField>
          <SettingsField label="Начальное значение">
            <input
              type="text"
              value={String(block.initial_value || '')}
              onChange={(e) => setOptional('initial_value', e.target.value)}
              className={sInputCls}
            />
          </SettingsField>
          <SettingsToggle
            checked={!!block.multiline}
            onChange={(v) => setOptional('multiline', v)}
            label="Многострочное"
          />
          <div className="grid grid-cols-2 gap-2">
            <SettingsField label="Мин. символов">
              <input
                type="number"
                value={block.min_length !== undefined ? String(block.min_length) : ''}
                onChange={(e) =>
                  setOptional('min_length', e.target.value ? Number(e.target.value) : undefined)
                }
                min={0}
                className={sInputCls}
              />
            </SettingsField>
            <SettingsField label="Макс. символов">
              <input
                type="number"
                value={block.max_length !== undefined ? String(block.max_length) : ''}
                onChange={(e) =>
                  setOptional('max_length', e.target.value ? Number(e.target.value) : undefined)
                }
                min={0}
                className={sInputCls}
              />
            </SettingsField>
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <OptionsEditor
            options={(block.options as OptionItem[]) || []}
            onChange={(opts) => set('options', opts)}
            preselect="select"
          />
        </div>
      );

    case 'radio':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <OptionsEditor
            options={(block.options as OptionItem[]) || []}
            onChange={(opts) => set('options', opts)}
            preselect="radio"
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <OptionsEditor
            options={(block.options as OptionItem[]) || []}
            onChange={(opts) => set('options', opts)}
            preselect="checked"
          />
        </div>
      );

    case 'date':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <SettingsField label="Начальная дата">
            <input
              type="text"
              value={String(block.initial_date || '')}
              onChange={(e) => setOptional('initial_date', e.target.value)}
              placeholder="YYYY-MM-DD"
              className={`${sInputCls} font-mono`}
            />
          </SettingsField>
        </div>
      );

    case 'time':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <SettingsField label="Начальное время">
            <input
              type="text"
              value={String(block.initial_time || '')}
              onChange={(e) => setOptional('initial_time', e.target.value)}
              placeholder="HH:mm"
              className={`${sInputCls} font-mono`}
            />
          </SettingsField>
        </div>
      );

    case 'file_input':
      return (
        <div className="flex flex-col gap-3 p-3">
          {commonFields}
          <div className="grid grid-cols-2 gap-2">
            <SettingsField label="Макс. файлов">
              <input
                type="number"
                value={block.max_files !== undefined ? String(block.max_files) : ''}
                onChange={(e) =>
                  setOptional('max_files', e.target.value ? Number(e.target.value) : undefined)
                }
                min={1}
                max={20}
                placeholder="10"
                className={sInputCls}
              />
            </SettingsField>
            <SettingsField label="Типы файлов">
              <input
                type="text"
                value={
                  Array.isArray(block.filetypes) ? (block.filetypes as string[]).join(', ') : ''
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setOptional(
                    'filetypes',
                    v.trim()
                      ? v
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : undefined
                  );
                }}
                placeholder=".pdf, .doc"
                className={sInputCls}
              />
            </SettingsField>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function PreviewBlock({ block }: { block: ViewBlock }) {
  switch (block.type) {
    case 'header':
      return <PreviewHeader block={block} />;
    case 'plain_text':
      return <PreviewPlainText block={block} />;
    case 'markdown':
      return <PreviewMarkdown block={block} />;
    case 'divider':
      return <PreviewDivider />;
    case 'input':
      return <PreviewInput block={block} />;
    case 'select':
      return <PreviewSelect block={block} />;
    case 'radio':
      return <PreviewRadio block={block} />;
    case 'checkbox':
      return <PreviewCheckbox block={block} />;
    case 'date':
      return <PreviewDate block={block} />;
    case 'time':
      return <PreviewTime block={block} />;
    case 'file_input':
      return <PreviewFileInput block={block} />;
    default:
      return (
        <div className="rounded-lg border border-accent-red/20 bg-accent-red/5 px-3 py-2 text-[13px] text-accent-red">
          Неизвестный блок: {block.type}
        </div>
      );
  }
}

// ─── form preview (modal mockup) ─────────────────────────────────

function FormPreview({
  formState,
  onRemoveBlock,
  onMoveBlock,
  onUpdateBlock,
  onUpdateForm,
}: {
  formState: FormState;
  onRemoveBlock: (index: number) => void;
  onMoveBlock: (from: number, to: number) => void;
  onUpdateBlock: (index: number, block: ViewBlock) => void;
  onUpdateForm: (patch: Partial<FormState>) => void;
}) {
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<number | string | null>(null);
  const [hoverTitle, setHoverTitle] = useState(false);
  const [hoverFooter, setHoverFooter] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const draggedId = useRef<string | null>(null);
  const lastSwapTime = useRef(0);
  const swapLock = useRef<'up' | 'down' | null>(null);

  const touchDrag = useRef<{
    startY: number;
    index: number;
    active: boolean;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef<{ speed: number; raf: number | null }>({ speed: 0, raf: null });

  const startAutoScroll = (speed: number) => {
    autoScroll.current.speed = speed;
    if (autoScroll.current.raf) return;
    const tick = () => {
      if (scrollRef.current) scrollRef.current.scrollTop += autoScroll.current.speed;
      autoScroll.current.raf = requestAnimationFrame(tick);
    };
    autoScroll.current.raf = requestAnimationFrame(tick);
  };

  const stopAutoScroll = () => {
    if (autoScroll.current.raf) {
      cancelAnimationFrame(autoScroll.current.raf);
      autoScroll.current.raf = null;
    }
    autoScroll.current.speed = 0;
  };

  /** Snapshot block positions, swap, and update dragIndex (shared by mouse & touch). */
  /* eslint-disable react-hooks/purity -- only called from event handlers, not render */
  const swapBlocks = (fromIndex: number, targetIndex: number) => {
    if (Date.now() - lastSwapTime.current < 150) return;
    lastSwapTime.current = Date.now();

    blockRefs.current.forEach((el) => {
      el.style.transition = 'none';
      el.style.transform = '';
    });
    void document.body.offsetHeight;
    const rects = new Map<string, DOMRect>();
    blockRefs.current.forEach((el, id) => {
      rects.set(id, el.getBoundingClientRect());
    });
    prevRects.current = rects;

    onMoveBlock(fromIndex, targetIndex);
    setDragIndex(targetIndex);
    if (touchDrag.current) touchDrag.current.index = targetIndex;
  };
  /* eslint-enable react-hooks/purity */

  /** Check edges and start/stop auto-scroll (shared by mouse & touch). */
  const updateAutoScroll = (clientY: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const edge = 50;
    const distTop = clientY - cr.top;
    const distBottom = cr.bottom - clientY;
    if (distTop < edge) {
      startAutoScroll(-Math.round(8 * (1 - distTop / edge)));
    } else if (distBottom < edge) {
      startAutoScroll(Math.round(8 * (1 - distBottom / edge)));
    } else {
      stopAutoScroll();
    }
  };

  const cleanupDrag = () => {
    setDragIndex(null);
    draggedId.current = null;
    touchDrag.current = null;
    swapLock.current = null;
    stopAutoScroll();
    if (scrollRef.current) scrollRef.current.style.overflowY = '';
    blockRefs.current.forEach((el) => {
      el.style.transition = '';
      el.style.transform = '';
    });
  };

  // ── Mouse (HTML5 Drag) ──

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    draggedId.current = formState.blocks[index]?._id ?? null;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => cleanupDrag();

  const handleDragOverBlock = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === targetIndex) return;

    updateAutoScroll(e.clientY);

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (dragIndex < targetIndex && e.clientY < midY) return;
    if (dragIndex > targetIndex && e.clientY > midY) return;

    swapBlocks(dragIndex, targetIndex);
  };

  // ── Touch (long-press to drag) ──

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (settingsOpen !== null) return;
    if ((e.target as HTMLElement).closest('.block-actions-btn')) return;
    const touch = e.touches[0];
    if (!touch) return;

    const timer = setTimeout(() => {
      if (!touchDrag.current) return;
      touchDrag.current.active = true;
      swapLock.current = null;
      setDragIndex(index);
      draggedId.current = formState.blocks[index]?._id ?? null;
      if (scrollRef.current) scrollRef.current.style.overflowY = 'hidden';
    }, 300);

    touchDrag.current = { startY: touch.clientY, index, active: false, timer };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDrag.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    // Before long-press fires: cancel on movement > 5px (user is scrolling)
    if (!touchDrag.current.active) {
      if (Math.abs(touch.clientY - touchDrag.current.startY) > 5) {
        clearTimeout(touchDrag.current.timer!);
        touchDrag.current = null;
      }
      return;
    }

    e.preventDefault();
    updateAutoScroll(touch.clientY);

    const curIdx = touchDrag.current.index;
    const curBlock = formState.blocks[curIdx];
    if (!curBlock) return;
    const curEl = blockRefs.current.get(curBlock._id);
    if (!curEl) return;
    const curRect = curEl.getBoundingClientRect();
    const curMid = curRect.top + curRect.height / 2;

    // Clear swap lock when finger returns to current block area
    if (touch.clientY >= curRect.top && touch.clientY <= curRect.bottom) {
      swapLock.current = null;
    }

    // Swap down (finger below center of current block)
    if (
      touch.clientY > curMid &&
      curIdx + 1 < formState.blocks.length &&
      swapLock.current !== 'up'
    ) {
      swapBlocks(curIdx, curIdx + 1);
      swapLock.current = 'down';
    }
    // Swap up (finger above center of current block)
    else if (touch.clientY < curMid && curIdx - 1 >= 0 && swapLock.current !== 'down') {
      swapBlocks(curIdx, curIdx - 1);
      swapLock.current = 'up';
    }
  };

  const handleTouchEnd = () => {
    if (!touchDrag.current) return;
    clearTimeout(touchDrag.current.timer!);
    if (touchDrag.current.active) cleanupDrag();
    else touchDrag.current = null;
  };

  const isDragging = dragIndex !== null;

  // FLIP animation: smoothly animate blocks to new positions after reorder
  useLayoutEffect(() => {
    const prev = prevRects.current;
    if (prev.size === 0) return;
    prevRects.current = new Map();

    const moving: { el: HTMLElement; dy: number }[] = [];
    blockRefs.current.forEach((el, id) => {
      if (id === draggedId.current) return;
      const oldRect = prev.get(id);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dy) > 1) moving.push({ el, dy });
    });

    if (moving.length === 0) return;

    for (const { el, dy } of moving) {
      el.style.transform = `translateY(${dy}px)`;
    }
    void document.body.offsetHeight;
    for (const { el } of moving) {
      el.style.transition = 'transform 200ms ease';
      el.style.transform = '';
      el.addEventListener(
        'transitionend',
        () => {
          el.style.transition = '';
        },
        { once: true }
      );
    }
  });

  return (
    <div
      ref={scrollRef}
      className="flex h-full items-start justify-center overflow-y-auto p-6 custom-scrollbar"
    >
      <div className="w-full max-w-[420px]">
        {/* Modal frame */}
        <div className="overflow-hidden rounded-xl border border-glass-heavy-border bg-glass-heavy">
          {/* Modal header */}
          <div
            className="group/title relative flex items-center justify-between border-b border-glass-border px-5 py-3.5"
            onMouseEnter={() => setHoverTitle(true)}
            onMouseLeave={() => setHoverTitle(false)}
          >
            <h3 className="text-[17px] font-semibold text-text-primary">
              {formState.title || 'Без заголовка'}
            </h3>
            <div className="flex h-6 w-6 items-center justify-center rounded-md text-text-tertiary">
              <X className="h-4 w-4" />
            </div>
            <div
              className={`block-actions-btn absolute right-5 top-3 items-center gap-0.5 rounded-md border border-glass-border bg-glass-heavy p-0.5 ${hoverTitle || settingsOpen === 'title' ? 'flex' : 'hidden'}`}
            >
              <Popover.Root
                open={settingsOpen === 'title'}
                onOpenChange={(open) => setSettingsOpen(open ? 'title' : null)}
              >
                <Popover.Trigger asChild>
                  <button
                    className="cursor-pointer rounded p-0.5 text-text-primary transition-colors hover:bg-glass-hover"
                    title="Настройки"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="z-[10001] w-[260px] rounded-lg border border-glass-heavy-border bg-glass-heavy shadow-xl backdrop-blur-xl animate-dropdown"
                    sideOffset={8}
                    align="end"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col gap-3 p-3">
                      <SettingsField label="Заголовок">
                        <input
                          type="text"
                          value={formState.title}
                          onChange={(e) => onUpdateForm({ title: e.target.value })}
                          className={sInputCls}
                        />
                      </SettingsField>
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>

          {/* Modal body — blocks */}
          <div
            className="flex flex-col gap-4 px-5 pb-4 pt-4"
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndex !== null) updateAutoScroll(e.clientY);
            }}
          >
            {formState.blocks.length === 0 && (
              <p className="py-6 text-center text-[13px] text-text-tertiary">
                Добавьте блоки из панели слева
              </p>
            )}

            {formState.blocks.map((block, i) => (
              <div
                key={block._id}
                ref={(el) => {
                  if (el) blockRefs.current.set(block._id, el);
                  else blockRefs.current.delete(block._id);
                }}
                className={`group/block relative rounded-lg transition-all ${
                  isDragging && dragIndex === i
                    ? 'opacity-30'
                    : hoveredBlock === i && !isDragging
                      ? 'cursor-grab'
                      : ''
                }`}
                onMouseEnter={() => !isDragging && setHoveredBlock(i)}
                onMouseLeave={() => setHoveredBlock(null)}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOverBlock(e, i)}
                onTouchStart={(e) => handleTouchStart(e, i)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                  if (touchDrag.current) e.preventDefault();
                }}
              >
                <PreviewBlock block={block} />
                <div
                  className={`block-actions-btn absolute right-0 -top-1 items-center gap-0.5 rounded-md border border-glass-border bg-glass-heavy p-0.5 ${(hoveredBlock === i || settingsOpen === i) && !isDragging ? 'flex' : 'hidden'}`}
                >
                  {block.type !== 'divider' && (
                    <Popover.Root
                      open={settingsOpen === i}
                      onOpenChange={(open) => setSettingsOpen(open ? i : null)}
                    >
                      <Popover.Trigger asChild>
                        <button
                          className="cursor-pointer rounded p-0.5 text-text-primary transition-colors hover:bg-glass-hover"
                          title="Настройки"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          className="z-[10001] max-h-[var(--radix-popover-content-available-height)] w-[300px] overflow-y-auto rounded-lg border border-glass-heavy-border bg-glass-heavy shadow-xl backdrop-blur-xl animate-dropdown custom-scrollbar"
                          sideOffset={8}
                          align="end"
                          collisionPadding={16}
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <BlockSettingsContent
                            block={block}
                            onUpdate={(updated) => onUpdateBlock(i, updated)}
                          />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  )}
                  <button
                    onClick={() => onRemoveBlock(i)}
                    className="cursor-pointer rounded p-0.5 text-text-primary transition-colors hover:bg-accent-red/10 hover:text-accent-red"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal footer */}
          <div
            className="relative flex items-center justify-end gap-2.5 border-t border-glass-border px-5 py-3"
            onMouseEnter={() => setHoverFooter('footer')}
            onMouseLeave={() => setHoverFooter(null)}
          >
            <button className="cursor-default rounded-lg border border-glass-border bg-glass px-4 py-1.5 text-[14px] font-medium text-text-primary transition-colors">
              {formState.close_text || 'Отменить'}
            </button>
            <button className="cursor-default rounded-lg bg-primary px-4 py-1.5 text-[14px] font-medium text-white transition-colors">
              {formState.submit_text || 'Отправить'}
            </button>
            <div
              className={`block-actions-btn absolute right-5 -top-4 items-center gap-0.5 rounded-md border border-glass-border bg-glass-heavy p-0.5 ${hoverFooter === 'footer' || settingsOpen === 'footer' ? 'flex' : 'hidden'}`}
            >
              <Popover.Root
                open={settingsOpen === 'footer'}
                onOpenChange={(open) => setSettingsOpen(open ? 'footer' : null)}
              >
                <Popover.Trigger asChild>
                  <button
                    className="cursor-pointer rounded p-0.5 text-text-primary transition-colors hover:bg-glass-hover"
                    title="Настройки"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="z-[10001] w-[260px] rounded-lg border border-glass-heavy-border bg-glass-heavy shadow-xl backdrop-blur-xl animate-dropdown"
                    sideOffset={8}
                    align="end"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col gap-3 p-3">
                      <SettingsField label="Кнопка отправки">
                        <input
                          type="text"
                          value={formState.submit_text}
                          onChange={(e) => onUpdateForm({ submit_text: e.target.value })}
                          className={sInputCls}
                        />
                      </SettingsField>
                      <SettingsField label="Кнопка отмены">
                        <input
                          type="text"
                          value={formState.close_text}
                          onChange={(e) => onUpdateForm({ close_text: e.target.value })}
                          className={sInputCls}
                        />
                      </SettingsField>
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────

interface FormPlaygroundProps {
  buttonText?: string;
}

export function FormPlayground({ buttonText = 'Конструктор форм' }: FormPlaygroundProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(() => loadState());
  const [jsonInput, setJsonInput] = useState(() => stateToJson(loadState()));
  const [error, setError] = useState<string | null>(null);
  const [jsonCopied, setJsonCopied] = useState<'desktop' | 'mobile' | false>(false);
  const [mobileView, setMobileView] = useState<'form' | 'json'>('form');
  // Track whether the JSON was last changed by the user (typing) or programmatically (palette)
  const jsonSourceRef = useRef<'code' | 'palette'>('palette');
  const blockCounterRef = useRef(0);

  // Persist state (debounced)
  useEffect(() => {
    const timer = setTimeout(() => saveState(formState), 500);
    return () => clearTimeout(timer);
  }, [formState]);

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

  // Parse JSON from code editor → update formState (debounced)
  const parseJson = useCallback(() => {
    if (jsonSourceRef.current !== 'code') return;
    const { state, error: err } = jsonToState(jsonInput);
    if (state) {
      setFormState(state);
      setError(null);
    } else {
      setError(err);
    }
  }, [jsonInput]);

  useEffect(() => {
    const timer = setTimeout(parseJson, 300);
    return () => clearTimeout(timer);
  }, [parseJson]);

  // Update formState from palette → update JSON
  const updateFromPalette = useCallback((newState: FormState) => {
    jsonSourceRef.current = 'palette';
    setFormState(newState);
    setJsonInput(stateToJson(newState));
    setError(null);
  }, []);

  const handleJsonChange = useCallback((value: string) => {
    jsonSourceRef.current = 'code';
    setJsonInput(value);
  }, []);

  const handleAddBlock = useCallback(
    (template: BlockTemplate) => {
      blockCounterRef.current += 1;
      const newBlock = template.create(blockCounterRef.current);
      const newState = { ...formState, blocks: [...formState.blocks, newBlock] };
      updateFromPalette(newState);
    },
    [formState, updateFromPalette]
  );

  const handleRemoveBlock = useCallback(
    (index: number) => {
      const newBlocks = formState.blocks.filter((_, i) => i !== index);
      updateFromPalette({ ...formState, blocks: newBlocks });
    },
    [formState, updateFromPalette]
  );

  const handleMoveBlock = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const newBlocks = [...formState.blocks];
      const [moved] = newBlocks.splice(from, 1);
      if (moved) {
        newBlocks.splice(to, 0, moved);
        updateFromPalette({ ...formState, blocks: newBlocks });
      }
    },
    [formState, updateFromPalette]
  );

  const handleUpdateBlock = useCallback(
    (index: number, block: ViewBlock) => {
      const newBlocks = formState.blocks.map((b, i) => (i === index ? block : b));
      updateFromPalette({ ...formState, blocks: newBlocks });
    },
    [formState, updateFromPalette]
  );

  const handleUpdateForm = useCallback(
    (patch: Partial<FormState>) => {
      updateFromPalette({ ...formState, ...patch });
    },
    [formState, updateFromPalette]
  );

  const modal = isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0%_0_0/0.6)] px-4 pt-[60px] pb-[60px]">
          <div className="flex h-[calc(100vh-120px)] w-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-glass-heavy-border bg-glass-heavy shadow-xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-glass-heavy-border px-4 py-3">
              <h2 className="hidden text-[17px] font-semibold text-text-primary lg:block">
                Конструктор форм
              </h2>
              {/* Mobile view toggle — pill style like header tabs */}
              <nav className="flex items-center gap-0.5 rounded-full border border-glass-border bg-glass px-1 py-1 lg:hidden">
                <button
                  onClick={() => setMobileView('form')}
                  className={`flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors duration-200 ${
                    mobileView === 'form'
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Превью
                </button>
                <button
                  onClick={() => setMobileView('json')}
                  className={`flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors duration-200 ${
                    mobileView === 'json'
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
                  }`}
                >
                  <Braces className="h-3.5 w-3.5" />
                  JSON
                </button>
              </nav>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-glass-hover hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — three columns */}
            <div className="flex min-h-0 flex-1">
              {/* Left: block palette */}
              <div className="hidden w-[200px] shrink-0 border-r border-glass-border lg:block">
                <BlockPalette onAdd={handleAddBlock} />
              </div>

              {/* Center: form preview */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {/* Mobile-only: horizontal palette */}
                <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-glass-border px-3 py-2 lg:hidden custom-scrollbar">
                  {BLOCK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.type}
                      onClick={() => handleAddBlock(tpl)}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-glass-border bg-glass px-2.5 py-1.5 text-[12px] font-medium text-text-primary transition-colors hover:bg-glass-hover"
                    >
                      <Plus className="h-3.5 w-3.5 text-text-secondary" />
                      <tpl.icon className="h-4 w-4 text-text-secondary" />
                      {tpl.label}
                    </button>
                  ))}
                </div>
                {/* Mobile: conditional view */}
                <div
                  className={`min-h-0 flex-1 ${mobileView === 'json' ? 'flex flex-col lg:hidden' : 'hidden'}`}
                >
                  <div className="flex shrink-0 items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-text-primary">JSON</span>
                      <Tooltip.Provider delayDuration={0}>
                        <Tooltip.Root open={jsonCopied === 'mobile'}>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(jsonInput);
                                setJsonCopied('mobile');
                                setTimeout(() => setJsonCopied(false), 2000);
                              }}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
                            >
                              {jsonCopied === 'mobile' ? (
                                <Check
                                  className="h-3.5 w-3.5 text-accent-green"
                                  strokeWidth={2.5}
                                />
                              ) : (
                                <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
                              )}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              align="center"
                              sideOffset={2}
                              className="z-[10000] pointer-events-none animate-tooltip rounded-md bg-text-primary px-2.5 py-1.5 text-[12px] font-semibold text-background shadow-xl whitespace-nowrap"
                            >
                              Скопировано
                              <Tooltip.Arrow className="fill-text-primary" width={8} height={4} />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                    {error && <span className="text-[12px] text-accent-red">{error}</span>}
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const t = e.currentTarget;
                        const s = t.selectionStart;
                        const end = t.selectionEnd;
                        const v = t.value.substring(0, s) + '  ' + t.value.substring(end);
                        handleJsonChange(v);
                        requestAnimationFrame(() => {
                          t.selectionStart = t.selectionEnd = s + 2;
                        });
                      }
                    }}
                    spellCheck={false}
                    className="w-full flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-text-primary outline-none custom-scrollbar"
                  />
                </div>
                {/* Form preview: always on desktop, conditional on mobile */}
                <div className={`min-h-0 flex-1 ${mobileView === 'json' ? 'hidden lg:block' : ''}`}>
                  <FormPreview
                    formState={formState}
                    onRemoveBlock={handleRemoveBlock}
                    onMoveBlock={handleMoveBlock}
                    onUpdateBlock={handleUpdateBlock}
                    onUpdateForm={handleUpdateForm}
                  />
                </div>
              </div>

              {/* Right: JSON editor */}
              <div className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-glass-border lg:flex">
                <div className="flex shrink-0 items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary">JSON</span>
                    <Tooltip.Provider delayDuration={0}>
                      <Tooltip.Root open={jsonCopied === 'desktop'}>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(jsonInput);
                              setJsonCopied('desktop');
                              setTimeout(() => setJsonCopied(false), 2000);
                            }}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
                          >
                            {jsonCopied === 'desktop' ? (
                              <Check className="h-3.5 w-3.5 text-accent-green" strokeWidth={2.5} />
                            ) : (
                              <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
                            )}
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            align="center"
                            sideOffset={2}
                            className="z-[10000] pointer-events-none animate-tooltip rounded-md bg-text-primary px-2.5 py-1.5 text-[12px] font-semibold text-background shadow-xl whitespace-nowrap"
                          >
                            Скопировано
                            <Tooltip.Arrow className="fill-text-primary" width={8} height={4} />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>
                  {error && <span className="text-[12px] text-accent-red">{error}</span>}
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const t = e.currentTarget;
                      const s = t.selectionStart;
                      const end = t.selectionEnd;
                      const v = t.value.substring(0, s) + '  ' + t.value.substring(end);
                      handleJsonChange(v);
                      requestAnimationFrame(() => {
                        t.selectionStart = t.selectionEnd = s + 2;
                      });
                    }
                  }}
                  spellCheck={false}
                  className="w-full flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-text-primary outline-none custom-scrollbar"
                />
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
