'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import type { NavigationItem } from '@/lib/openapi/types';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import { Loader2, ArrowUpRight } from 'lucide-react';

const METHOD_COLORS = {
  GET: {
    ghost: 'bg-method-get/10 text-method-get',
    active: 'bg-primary/20 text-primary',
  },
  POST: {
    ghost: 'bg-method-post/10 text-method-post',
    active: 'bg-primary/20 text-primary',
  },
  PUT: {
    ghost: 'bg-method-put/10 text-method-put',
    active: 'bg-primary/20 text-primary',
  },
  DELETE: {
    ghost: 'bg-method-delete/10 text-method-delete',
    active: 'bg-primary/20 text-primary',
  },
  PATCH: {
    ghost: 'bg-method-patch/10 text-method-patch',
    active: 'bg-primary/20 text-primary',
  },
};

interface SidebarItemProps {
  item: NavigationItem;
  onItemClick?: () => void;
}

export function SidebarItem({ item, onItemClick }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const itemRef = useRef<HTMLAnchorElement>(null);
  const { isLoading, handleClick } = useNavigationLoading(item.href, 200);

  // Check if item has new badge (set by server in navigation.ts)
  const hasNewBadge = item.badge === 'new';

  const handleLinkClick = () => {
    handleClick();
    onItemClick?.();
  };

  if (item.external) {
    return (
      <li>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[14px] leading-[1.4] rounded-md font-medium text-text-secondary hover:bg-glass-hover hover:text-text-primary transition-colors duration-200"
        >
          <span className="truncate flex-1">{item.title}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        ref={itemRef}
        onClick={handleLinkClick}
        data-active={isActive || undefined}
        className={`flex items-center gap-2 px-2.5 py-1.5 text-[14px] leading-[1.4] rounded-md font-medium group transition-colors duration-200 ${
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
        }`}
      >
        <span className="truncate flex-1">{item.title}</span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
        {!isLoading && hasNewBadge && (
          <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
            <div className={`w-2 h-2 rounded-full bg-primary`} />
          </div>
        )}
        {!isLoading && item.method && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ml-auto px-1.5 py-0.5 rounded-full transition-colors duration-200 ${isActive ? METHOD_COLORS[item.method].active : METHOD_COLORS[item.method].ghost}`}
          >
            {item.method}
          </span>
        )}
      </Link>
    </li>
  );
}
