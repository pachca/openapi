import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { RelatedItem } from '@/lib/content-loader';

interface RelatedTopicsProps {
  items: RelatedItem[];
}

/**
 * "Связанные разделы" block — curated cross-links rendered above the prev/next
 * pager. Driven by the page's `related:` frontmatter (resolved server-side),
 * not inline MDX, so the body text stays clean and the styling stays uniform.
 */
export function RelatedTopics({ items }: RelatedTopicsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="not-prose mt-12" aria-label="Связанные разделы">
      <h2 className="text-sm font-medium text-text-tertiary mb-3">Связанные разделы</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 text-[14px] font-medium text-text-primary hover:text-primary transition-colors"
            >
              <FileText size={16} className="shrink-0 text-text-tertiary" />
              <span>{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
