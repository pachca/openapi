import { ArrowUpRight, Package } from 'lucide-react';

interface NpmBadgeProps {
  package: string;
  version?: string;
  date?: string;
}

export function NpmBadge({ package: pkg, version, date }: NpmBadgeProps) {
  return (
    <a
      href={`https://www.npmjs.com/package/${pkg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group not-prose flex items-center gap-2 px-3 my-8 rounded-lg border border-background-border hover:bg-background-tertiary transition-all duration-200 no-underline!"
      style={{ height: 'var(--boxed-header-height)' }}
    >
      <Package className="h-3.5 w-3.5 text-text-primary shrink-0" strokeWidth={2} />
      <span className="text-[13px] font-semibold text-text-primary font-mono">{pkg}</span>
      {version && (
        <span className="text-[12px] text-text-tertiary font-mono">
          {version}
          {date && <> · {date}</>}
        </span>
      )}
      <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-text-tertiary shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}
