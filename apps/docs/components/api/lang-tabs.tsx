'use client';

export interface LangTabItem {
  id: string;
  label: string;
}

/**
 * Inline language/tool switcher rendered as tabs, styled like the header nav:
 * normal text color with a thin primary underline on the active tab. Sits in a
 * row with a `border-b`; the tab height matches `--boxed-header-height` so the
 * underline lands on the divider both in a BoxedPanel header and a plain row.
 *
 * Shared by <ApiClientPanel> and <CodeExamples variant="tabs">.
 */
export function LangTabs({
  items,
  activeId,
  onSelect,
  className,
}: {
  items: LangTabItem[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-x-5 self-stretch ${className ?? ''}`}>
      {items.map((it) => {
        const isActive = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className={`relative py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer select-none ${
              isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {it.label}
            {isActive && <span className="absolute left-0 right-0 bottom-0 h-px bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}
