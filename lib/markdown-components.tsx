'use client';

import React from 'react';
import { Callout } from '@/components/api/callout';
import { GuideCodeBlock } from '@/components/api/guide-code-block';

/**
 * Unified markdown components for rendering across the app
 * Used by both static guide pages and API method descriptions
 */

// Inline code component with copy functionality
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-background-secondary border border-background-border px-1.5 py-0.5 rounded text-[13px] font-mono text-primary">
      {children}
    </code>
  );
}

// Link component
export function MarkdownLink({ href, children }: { href?: string; children: React.ReactNode }) {
  const isExternal = href?.startsWith('http');
  return (
    <a 
      href={href} 
      className="text-primary hover:underline"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

// Blockquote - determines if it's a warning or info callout
export function MarkdownBlockquote({ children }: { children: React.ReactNode }) {
  const text = React.Children.toArray(children)
    .map(child => {
      if (typeof child === 'string') return child;
      if (React.isValidElement(child) && typeof child.props === 'object' && child.props !== null && 'children' in child.props) {
        return String(child.props.children);
      }
      return '';
    })
    .join('');
  
  const isWarning = text.toLowerCase().includes('внимание') || 
                    text.toLowerCase().includes('warning') ||
                    text.toLowerCase().includes('важно');
  
  return <Callout type={isWarning ? 'warning' : 'info'}>{children}</Callout>;
}

// Code block component
export function MarkdownCodeBlock({ 
  className, 
  children,
  title 
}: { 
  className?: string; 
  children: React.ReactNode;
  title?: string;
}) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const code = String(children).replace(/\n$/, '');
  
  // Map common language names
  const languageMap: Record<string, string> = {
    'bash': 'curl',
    'shell': 'curl',
    'sh': 'curl',
    'javascript': 'javascript',
    'js': 'javascript',
    'typescript': 'typescript',
    'ts': 'typescript',
    'python': 'python',
    'py': 'python',
    'json': 'json',
    'http': 'http',
  };
  
  const mappedLanguage = languageMap[language] || language;
  
  return (
    <GuideCodeBlock
      language={mappedLanguage}
      code={code}
      title={title}
    />
  );
}

// Pre wrapper for code blocks
export function MarkdownPre({ children }: { children: React.ReactNode }) {
  return <div className="my-4">{children}</div>;
}

// Code - handles both inline and block
export function MarkdownCode({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className || '');
  
  // If it's a code block (has language class), render as block
  if (match) {
    return <MarkdownCodeBlock className={className}>{children}</MarkdownCodeBlock>;
  }
  
  // Otherwise render as inline code
  return <InlineCode>{children}</InlineCode>;
}

// Headings
export function MarkdownH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-3xl font-bold text-text-primary mb-6">
      {children}
    </h1>
  );
}

export function MarkdownH2({ id, children }: { id?: string; children: React.ReactNode }) {
  // Generate id that supports Cyrillic characters
  const text = String(children);
  const generatedId = id || text.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '') // Keep Unicode letters and numbers
    .replace(/-+/g, '-') // Remove multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  return (
    <h2 id={generatedId} className="text-2xl font-bold text-text-primary mt-12 mb-6 scroll-mt-20">
      {children}
    </h2>
  );
}

export function MarkdownH3({ id, children }: { id?: string; children: React.ReactNode }) {
  // Generate id that supports Cyrillic characters
  const text = String(children);
  const generatedId = id || text.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '') // Keep Unicode letters and numbers
    .replace(/-+/g, '-') // Remove multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  return (
    <h3 id={generatedId} className="text-xl font-bold text-text-primary mt-8 mb-4 scroll-mt-20">
      {children}
    </h3>
  );
}

export function MarkdownH4({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h4 id={id} className="text-lg font-bold text-text-primary mt-6 mb-3">
      {children}
    </h4>
  );
}

// Lists
export function MarkdownUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside ml-2 space-y-2 my-4 text-text-primary">
      {children}
    </ul>
  );
}

export function MarkdownOl({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal list-outside ml-6 space-y-2 my-4 text-text-primary">
      {children}
    </ol>
  );
}

export function MarkdownLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-text-primary leading-relaxed">
      {children}
    </li>
  );
}

// Paragraph
export function MarkdownP({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-text-primary leading-relaxed mb-4">
      {children}
    </p>
  );
}

// Horizontal rule
export function MarkdownHr() {
  return <hr className="my-8 border-background-border" />;
}

// Text formatting
export function MarkdownEm({ children }: { children: React.ReactNode }) {
  return <em className="text-text-secondary italic">{children}</em>;
}

export function MarkdownStrong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-text-primary">{children}</strong>;
}

// Table components
export function MarkdownTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse border border-background-border text-sm">
        {children}
      </table>
    </div>
  );
}

export function MarkdownThead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-background-tertiary">{children}</thead>;
}

export function MarkdownTbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function MarkdownTr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-background-border">{children}</tr>;
}

export function MarkdownTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-semibold text-text-primary border border-background-border">
      {children}
    </th>
  );
}

export function MarkdownTd({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 text-text-primary border border-background-border">
      {children}
    </td>
  );
}

/**
 * Complete set of MDX components for use with next-mdx-remote
 */
export const mdxComponents = {
  // Block elements
  h1: MarkdownH1,
  h2: MarkdownH2,
  h3: MarkdownH3,
  h4: MarkdownH4,
  p: MarkdownP,
  blockquote: MarkdownBlockquote,
  pre: MarkdownPre,
  code: MarkdownCode,
  hr: MarkdownHr,
  
  // Lists
  ul: MarkdownUl,
  ol: MarkdownOl,
  li: MarkdownLi,
  
  // Inline elements
  a: MarkdownLink,
  em: MarkdownEm,
  strong: MarkdownStrong,
  
  // Tables
  table: MarkdownTable,
  thead: MarkdownThead,
  tbody: MarkdownTbody,
  tr: MarkdownTr,
  th: MarkdownTh,
  td: MarkdownTd,
  
  // Custom components that can be used in MDX
  Callout,
  GuideCodeBlock,
};

export default mdxComponents;
