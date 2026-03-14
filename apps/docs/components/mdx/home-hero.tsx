import { MarkdownActions } from '@/components/api/markdown-actions';

export function HomeHero({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 xl:gap-8 items-start mb-2">
      {children}
    </div>
  );
}

interface HomeHeroContentProps {
  subtitle?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function HomeHeroContent({ subtitle, title, description, children }: HomeHeroContentProps) {
  return (
    <div className="flex flex-col">
      {subtitle && <div className="text-sm font-medium text-text-tertiary mb-1">{subtitle}</div>}
      <h1 className="text-4xl font-extrabold text-text-primary mb-2! tracking-tight">{title}</h1>
      <div className="mb-8">
        <MarkdownActions pageUrl="/" pageTitle={title} />
      </div>
      <p className="text-[16px] text-text-secondary leading-relaxed">{description}</p>
      {children && <div className="flex flex-wrap gap-2.5 mt-6">{children}</div>}
    </div>
  );
}

export function HomeHeroCode({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
