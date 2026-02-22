import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { Callout } from './callout';
import { GuideCodeBlock } from './guide-code-block';
import { InternalLink } from './smooth-scroll-link';
import { replaceSpecialTagsForMDX } from '@/lib/replace-special-tags';
import { toSlug } from '@/lib/utils/transliterate';
import type { Endpoint } from '@/lib/openapi/types';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { resolveEndpointLinks } from '@/lib/openapi/resolve-links';
import {
  SchemaBlock,
  HttpCodes,
  ErrorSchema,
  CodeBlock,
  Limit,
  Updates,
  Warning,
  Info,
  Danger,
  GuideCards,
  ApiCards,
  ApiCodeExample,
} from '@/components/mdx/mdx-components';
import { Steps, Step } from '@/components/mdx/steps';

import { CardGroup, Card } from '@/components/mdx/cards';
import { Mermaid } from '@/components/mdx/mermaid';
import { Tree, TreeFolder, TreeFile } from '@/components/mdx/tree';
import { ImageCard } from '@/components/mdx/image-card';
import { AgentSkillsWorkflows } from '@/components/mdx/agent-skills-workflows';
import { CopyableInlineCode } from './copyable-inline-code';
import { EndpointLink } from './endpoint-link';

// Simple markdown components for server rendering
const components = {
  // Blockquote -> Callout (for regular blockquotes in markdown)
  blockquote: ({ children }: { children: React.ReactNode }) => {
    const text = String(children);
    const isWarning = text.toLowerCase().includes('внимание');
    return <Callout type={isWarning ? 'warning' : 'info'}>{children}</Callout>;
  },

  // Code blocks
  pre: ({ children }: { children: React.ReactNode }) => <div className="my-4">{children}</div>,

  code: ({
    className,
    children,
    title,
  }: {
    className?: string;
    children: React.ReactNode;
    title?: string;
  }) => {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      const language = match[1] === 'bash' || match[1] === 'shell' ? 'curl' : match[1];
      const code = String(children).replace(/\n$/, '');
      return <GuideCodeBlock language={language} code={code} title={title} />;
    }
    return <CopyableInlineCode>{String(children)}</CopyableInlineCode>;
  },

  // Headings - skip H1 since StaticPageHeader provides it
  h1: () => null,
  h2: ({ id, children }: { id?: string; children: React.ReactNode }) => {
    const generatedId = id || toSlug(String(children));
    return (
      <h2 id={generatedId} className="text-2xl font-bold text-text-primary mt-12 mb-6 scroll-mt-20">
        {children}
      </h2>
    );
  },
  h3: ({ id, children }: { id?: string; children: React.ReactNode }) => {
    const generatedId = id || toSlug(String(children));
    return (
      <h3 id={generatedId} className="text-xl font-bold text-text-primary mt-8 mb-4 scroll-mt-20">
        {children}
      </h3>
    );
  },

  // Links - use InternalLink for client-side navigation
  a: InternalLink,

  // Lists
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-outside ml-2 space-y-2 my-4 text-text-primary">{children}</ul>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-text-primary leading-relaxed">{children}</li>
  ),

  // Paragraph
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-text-primary leading-relaxed mb-4">{children}</p>
  ),

  // Tables
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="border-b border-background-border">{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody className="divide-y divide-background-border/40">{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="py-5 pl-0! text-text-primary w-[20%]">{children}</td>
  ),

  // Other
  hr: () => <hr className="my-8 border-background-border" />,
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="text-text-secondary not-italic">{children}</em>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),

  // Custom MDX components for dynamic content
  SchemaBlock,
  HttpCodes,
  ErrorSchema,
  CodeBlock,
  Limit,
  Updates,
  Warning,
  Info,
  Danger,
  Callout,
  Steps,
  Step,
  CardGroup,
  Card,
  GuideCards,
  ApiCards,
  EndpointLink,
  Mermaid,
  Tree,
  TreeFolder,
  TreeFile,
  ImageCard,
  ApiCodeExample,
  AgentSkillsWorkflows,
};

interface MarkdownContentProps {
  /** Raw markdown content string */
  content: string;
  /** Optional: all endpoints for resolving [description](METHOD /path) links */
  allEndpoints?: Endpoint[];
  /** Optional: custom class name for wrapper */
  className?: string;
}

/**
 * Unified component for rendering markdown content
 * Used for both guide pages and API method descriptions
 *
 * Features:
 * - Renders markdown with MDXRemote
 * - Supports custom MDX components (SchemaBlock, Warning, Info, etc.)
 * - Resolves special link syntax [description](METHOD /path) to actual URLs
 * - Converts special tags (#corporation_price_only, etc.) to styled blocks
 * - Auto-loads endpoints for link resolution if not provided
 */
export async function MarkdownContent({
  content,
  allEndpoints,
  className = 'markdown-content',
}: MarkdownContentProps) {
  // Load endpoints if not provided (for resolving API links)
  const endpoints = allEndpoints ?? (await parseOpenAPI()).endpoints;

  // 1. Replace special tags with MDX components (<Warning>, <Info>)
  let processedContent = replaceSpecialTagsForMDX(content);

  // 2. Resolve endpoint links: [description](METHOD /path) -> <EndpointLink> with badge
  processedContent = resolveEndpointLinks(processedContent, endpoints, { mdx: true });

  return (
    <div className={className}>
      <MDXRemote
        source={processedContent}
        components={components}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </div>
  );
}
