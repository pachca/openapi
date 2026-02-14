import React from 'react';
import Link from 'next/link';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { CopyableInlineCode } from './copyable-inline-code';
import { EndpointLink } from './endpoint-link';

interface InlineCodeTextProps {
  text: string;
  className?: string;
}

function renderTextWithLinks(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    const [, linkText, url] = match;
    const methodMatch = url.match(/^(GET|POST|PUT|DELETE|PATCH):(.+)$/);
    if (methodMatch) {
      const [, method, href] = methodMatch;
      result.push(
        <EndpointLink key={match.index} method={method} href={href}>
          {linkText}
        </EndpointLink>
      );
    } else {
      const isExternal = url.startsWith('http');
      result.push(
        isExternal ? (
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-emphasis hover:underline inline-flex items-baseline gap-0.5"
          >
            {linkText}
            <ExternalLinkIcon className="size-3.5 shrink-0 self-center" strokeWidth={2.5} />
          </a>
        ) : (
          <Link key={match.index} href={url} className="text-accent-emphasis hover:underline">
            {linkText}
          </Link>
        )
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}

export function InlineCodeText({ text, className }: InlineCodeTextProps) {
  if (!text) return null;

  const parts = text.split(/(`[^`]+`)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeContent = part.slice(1, -1);
          return <CopyableInlineCode key={index}>{codeContent}</CopyableInlineCode>;
        }
        return <React.Fragment key={index}>{renderTextWithLinks(part)}</React.Fragment>;
      })}
    </span>
  );
}
