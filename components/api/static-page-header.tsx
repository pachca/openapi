import { MarkdownActions } from './markdown-actions';

interface StaticPageHeaderProps {
  title: string;
  pageUrl: string;
  className?: string;
}

export function StaticPageHeader({ title, pageUrl, className = '' }: StaticPageHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-4xl font-extrabold text-text-primary mb-2! tracking-tight">{title}</h1>
      <div className="mb-8">
        <MarkdownActions 
          pageUrl={pageUrl}
          pageTitle={title}
        />
      </div>
    </div>
  );
}
