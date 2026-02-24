'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import gsap from 'gsap';
import { toSlug } from '@/lib/utils/transliterate';

interface SmoothScrollLinkProps {
  href: string;
  children: ReactNode;
}

export function SmoothScrollLink({ href, children }: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const targetId = toSlug(decodeURIComponent(href.replace('#', '')));
    const target = document.getElementById(targetId);
    const mainContent = document.querySelector('main');

    if (target && mainContent) {
      // Стандартный скролл браузера обычно длится ~500-800мс
      // Делаем его быстрым (300мс) с приятным ускорением/замедлением
      gsap.to(mainContent, {
        duration: 0.4,
        scrollTop: target.offsetTop - 80, // 80px отступ сверху (scroll-mt-20)
        ease: 'power2.out',
      });

      // Обновляем URL без прыжка
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

  // Anchor links - transliterate Cyrillic anchors
  if (isAnchor && href) {
    const anchor = href.slice(1);
    const transliteratedHref = `#${toSlug(decodeURIComponent(anchor))}`;
    return (
      <a href={transliteratedHref} className={className}>
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
