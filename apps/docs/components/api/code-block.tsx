'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
}

let highlighterPromise: ReturnType<typeof import('shiki').createHighlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['one-dark-pro', 'one-light'],
        langs: [
          'json',
          'javascript',
          'typescript',
          'python',
          'bash',
          'shell',
          'http',
          'ruby',
          'php',
          'java',
          'go',
          'kotlin',
          'swift',
          'csharp',
        ],
      })
    );
  }
  return highlighterPromise;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function highlight() {
      try {
        const highlighter = await getHighlighter();

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
    return () => {
      isMounted = false;
    };
  }, [code, language]);

  if (!highlightedHtml) {
    return (
      <div className="flex items-center justify-center h-14 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="code-block-container" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
  );
}
