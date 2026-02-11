import { ReactNode } from 'react';

interface LimitCardProps {
  title?: ReactNode;
  howItWorks?: ReactNode;
  limit: string;
  period: string;
  entity?: string;
}

export function LimitCard({ title, howItWorks, limit, period, entity }: LimitCardProps) {
  return (
    <div className="my-6 border border-background-border rounded-xl overflow-hidden bg-background">
      {title && (
        <div className="flex items-center justify-between px-3 bg-background-secondary border-b border-background-border h-[var(--boxed-header-height)]">
          <div className="text-[13px] font-medium text-text-primary truncate">{title}</div>
        </div>
      )}
      {howItWorks && (
        <div className="px-4 py-4 border-b border-background-border/60">
          <div className="text-[14px] text-text-primary leading-relaxed">{howItWorks}</div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-background-border/60">
        <div className="px-4 py-4">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">
            Лимит
          </div>
          <div className="text-[14px] text-text-primary font-mono">{limit}</div>
        </div>
        <div className="px-4 py-4">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">
            Период
          </div>
          <div className="text-[14px] text-text-primary font-mono">{period}</div>
        </div>
        {entity && (
          <div className="px-4 py-4">
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">
              Сущность
            </div>
            <div className="text-[14px] text-text-primary font-mono">{entity}</div>
          </div>
        )}
      </div>
    </div>
  );
}
