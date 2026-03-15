'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { toSlug } from '@/lib/utils/transliterate';
import { getScrollOffset } from '@/lib/utils/scroll-offset';

gsap.registerPlugin(ScrollToPlugin);

interface SmoothScrollLinkProps {
  href: string;
  children: ReactNode;
}

export function SmoothScrollLink({ href, children }: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const targetId = toSlug(decodeURIComponent(href.replace('#', '')));
    const target = document.getElementById(targetId);

    if (target) {
      const targetScrollTop =
        target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
      gsap.to(window, {
        duration: 0.4,
        scrollTo: { y: targetScrollTop },
        ease: 'power2.out',
      });

      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  const transliteratedHref = `#${toSlug(decodeURIComponent(href.replace('#', '')))}`;
  return (
    <a href={transliteratedHref} onClick={handleClick}>
      {children}
    </a>
  );
}

/**
 * Internal link component that uses Next.js Link for client-side navigation
 * Used in MDX content for internal links
 */
interface InternalLinkProps {
  href?: string;
  children: ReactNode;
  className?: string;
}

export function InternalLink({
  href,
  children,
  className = 'text-primary hover:underline',
}: InternalLinkProps) {
  const isExternal = href?.startsWith('http');
  const isAnchor = href?.startsWith('#');
  const isDownloadable = href?.endsWith('.txt') || href?.endsWith('.md') || href?.endsWith('.xml');

  // External links or downloadable files - use regular <a> with target="_blank"
  if (isExternal || isDownloadable) {
    return (
      <a
        href={href}
        className={`${className} inline-flex items-baseline gap-1`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        {isExternal && (
          <ExternalLinkIcon className="size-3.5 shrink-0 self-center" strokeWidth={2.5} />
        )}
      </a>
    );
  }

  // Anchor links - scroll to target element
  if (isAnchor && href) {
    const targetId = toSlug(decodeURIComponent(href.slice(1)));
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        const targetScrollTop =
          target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
        gsap.to(window, {
          duration: 0.4,
          scrollTo: { y: targetScrollTop },
          ease: 'power2.out',
        });
        window.history.pushState(null, '', `#${targetId}`);
      }
    };
    return (
      <a href={`#${targetId}`} onClick={handleClick} className={className}>
        {children}
      </a>
    );
  }

  // No href - use regular <a>
  if (!href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  // Internal links - use Next.js Link for client-side navigation
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
