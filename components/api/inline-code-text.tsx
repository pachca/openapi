import React from 'react';

interface InlineCodeTextProps {
  text: string;
  className?: string;
}

export function InlineCodeText({ text, className }: InlineCodeTextProps) {
  if (!text) return null;

  // Split text by backticks: `code`
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
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
