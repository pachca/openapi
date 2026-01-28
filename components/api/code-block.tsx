'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function highlight() {
      try {
        // Dynamic import to avoid SSR issues with ESM-only module
        const { createHighlighter } = await import('shiki');
        
        const highlighter = await createHighlighter({
          themes: ['one-dark-pro', 'one-light'],
          langs: ['json', 'javascript', 'python', 'bash', 'shell', 'http', 'ruby', 'php', 'java', 'go', 'csharp'],
        });
        
        // Map languages
        let lang = language || 'json';
        if (lang === 'curl') lang = 'bash';

        const html = highlighter.codeToHtml(code, {
          lang,
          themes: {
            light: 'one-light',
            dark: 'one-dark-pro',
          },
          defaultColor: false,
          transformers: [
            {
              line(node, line) {
                node.properties['data-line'] = line;
              },
            },
          ],
        });

        if (isMounted) {
          // Clean up HTML to remove extra newlines between tags that cause spacing issues
          const cleanedHtml = html.replace(/>\n+</g, '><');
          setHighlightedHtml(cleanedHtml);
        }
      } catch (error) {
        console.error('Shiki error:', error);
      }
    }

    highlight();
    return () => { isMounted = false; };
  }, [code, language]);

  if (!highlightedHtml) {
    return (
      <div className="flex items-center justify-center h-14 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div 
      className="code-block-container"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }} 
    />
  );
}
