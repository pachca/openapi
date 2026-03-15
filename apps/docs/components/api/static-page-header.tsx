import { MarkdownActions } from './markdown-actions';

interface StaticPageHeaderProps {
  title: string;
  pageUrl: string;
  className?: string;
  sectionTitle?: string;
}

export function StaticPageHeader({
  title,
  pageUrl,
  className = '',
  sectionTitle,
}: StaticPageHeaderProps) {
  return (
    <div className={className}>
      {sectionTitle && (
        <div className="hidden lg:block text-sm font-medium text-text-tertiary mb-1">
          {sectionTitle}
        </div>
      )}
      <h1 className="text-4xl font-extrabold text-text-primary mb-2! tracking-tight">{title}</h1>
      <div className="mb-8">
        <MarkdownActions pageUrl={pageUrl} pageTitle={title} />
      </div>
    </div>
  );
}
