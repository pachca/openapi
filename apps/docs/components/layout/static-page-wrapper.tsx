import { Footer } from '@/components/layout/footer';
import { ReactNode } from 'react';
import type { NavigationItem } from '@/lib/openapi/types';
import { TableOfContents } from './table-of-contents';

interface StaticPageWrapperProps {
  children: ReactNode;
  adjacent?: {
    prev: NavigationItem | null;
    next: NavigationItem | null;
  };
  hideTableOfContents?: boolean;
}

export function StaticPageWrapper({
  children,
  adjacent,
  hideTableOfContents,
}: StaticPageWrapperProps) {
  return (
    <div className="flex flex-col flex-1 min-h-full">
      <div className="flex-1 flex flex-col">
        <div className="p-8 pt-10 xl:p-10 pb-0! flex-1 flex justify-center">
          <div className="w-full max-w-[1000px] flex flex-col xl:flex-row gap-12 relative">
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="prose prose-slate flex-1 max-w-full xl:max-w-[700px]">{children}</div>
              <Footer adjacent={adjacent} noMargin={true} />
            </div>
            {!hideTableOfContents && (
              <aside className="hidden xl:block w-64 shrink-0 relative">
                <TableOfContents />
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
