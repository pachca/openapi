import { ArrowUpRight, Package } from 'lucide-react';

interface PackageBadgeProps {
  name: string;
  href: string;
  version?: string;
}

export function PackageBadge({ name, href, version }: PackageBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group not-prose flex items-center gap-2 px-3 my-4 rounded-xl border border-glass-border bg-glass backdrop-blur-md hover:bg-glass-hover hover:border-glass-heavy-border transition-all duration-200 no-underline! whitespace-nowrap"
      style={{ height: 'var(--boxed-header-height)' }}
    >
      <Package className="h-3.5 w-3.5 text-text-primary shrink-0" strokeWidth={2} />
      <span className="text-[13px] font-semibold text-text-primary font-mono">{name}</span>
      {version && (
        <span className="text-[12px] text-text-tertiary font-mono min-w-0 truncate">{version}</span>
      )}
      <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-text-tertiary shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}
