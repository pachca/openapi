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
          'python',
          'bash',
          'shell',
          'http',
          'ruby',
          'php',
          'java',
          'go',
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

        // Replace <placeholder> with markers before Shiki (avoids operator coloring)
        const placeholders: string[] = [];
        const preprocessed = code.replace(
          /<([\w\u0400-\u04FF][\w\u0400-\u04FF_-]*)>/g,
          (_, name) => {
            placeholders.push(name);
            return `__PH${placeholders.length - 1}__`;
          }
        );

        const html = highlighter.codeToHtml(preprocessed, {
          lang,
          themes: {
            light: 'one-light',
            dark: 'one-dark-pro',
          },
          defaultColor: false,
        });

        if (isMounted) {
          // Clean up HTML to remove extra newlines between tags that cause spacing issues
          let cleanedHtml = html.replace(/>\n+</g, '><');

          // Restore placeholders with uniform styling
          cleanedHtml = cleanedHtml.replace(
            /__PH(\d+)__/g,
            (_, i) => `<span class="code-placeholder">&lt;${placeholders[+i]}&gt;</span>`
          );

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
