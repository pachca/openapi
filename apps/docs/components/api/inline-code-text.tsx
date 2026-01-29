import React from 'react';
import Link from 'next/link';

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
    const isExternal = url.startsWith('http');
    result.push(
      isExternal ? (
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-emphasis hover:underline"
        >
          {linkText}
        </a>
      ) : (
        <Link key={match.index} href={url} className="text-accent-emphasis hover:underline">
          {linkText}
        </Link>
      )
    );
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
          return (
            <code
              key={index}
              className="bg-background-secondary border border-background-border px-1 py-0.5 rounded text-[13px] font-mono text-text-primary mx-0.5"
            >
              {codeContent}
            </code>
          );
        }
        return <React.Fragment key={index}>{renderTextWithLinks(part)}</React.Fragment>;
      })}
    </span>
  );
}
