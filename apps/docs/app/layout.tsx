import type { Metadata, Viewport } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar-wrapper';
import { HeaderServer } from '@/components/layout/header-wrapper';
import { TransitionProvider } from '@/components/layout/transition-provider';
import { DisplaySettingsProvider } from '@/components/layout/display-settings-context';
import { MobileTableOfContents } from '@/components/layout/mobile-toc';
import * as Tooltip from '@radix-ui/react-tooltip';
import './globals.css';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://dev.pachca.com'),
  title: {
    default: 'Обзор | Пачка для разработчиков',
    template: '%s | Пачка для разработчиков',
  },
  description: 'Создавайте уникальные решения на одной платформе',
  openGraph: {
    type: 'website',
    siteName: 'Пачка',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
  },
  other: {
    'apple-mobile-web-app-title': 'dev.pachca',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Пачка для разработчиков',
      description:
        'REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.',
      url: 'https://dev.pachca.com',
      inLanguage: 'ru',
      publisher: {
        '@type': 'Organization',
        '@id': 'https://pachca.com/#organization',
        name: 'Пачка',
        alternateName: ['Pachca'],
        url: 'https://pachca.com',
        sameAs: ['https://github.com/pachca', 'https://www.npmjs.com/org/pachca'],
        logo: {
          '@type': 'ImageObject',
          url: 'https://dev.pachca.com/web-app-manifest-512x512.png',
        },
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://dev.pachca.com/?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebAPI',
      name: 'Pachca REST API',
      description:
        'REST API для управления сообщениями, чатами, пользователями и задачами в мессенджере Пачка.',
      documentation: 'https://dev.pachca.com',
      url: 'https://api.pachca.com/api/shared/v1',
      provider: { '@id': 'https://pachca.com/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Пачка',
      alternateName: ['Pachca'],
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android, macOS, Windows, Linux',
      url: 'https://pachca.com',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`min-h-screen ${inter.className} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#36373d" media="(prefers-color-scheme: dark)" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Пачка API — Обновления"
          href="/feed.xml"
        />
        <link rel="llms-txt" type="text/plain" title="llms.txt" href="/llms.txt" />
        <link rel="llms-full-txt" type="text/plain" title="llms-full.txt" href="/llms-full.txt" />
        {/* Per-page <link rel="alternate" type="text/markdown"> is emitted by
            each page's generateMetadata() (alternates.types['text/markdown'])
            so it points to that page's own .md twin. Do NOT add a global one
            here — it would shadow the per-page tag with a constant href. */}
        <link rel="skills" href="/.well-known/skills/index.json" />
        <link
          rel="alternate"
          type="application/vnd.oai.openapi"
          title="OpenAPI"
          href="/openapi.yaml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var html = document.documentElement;
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                  html.classList.remove('dark', 'light');

                  if (savedTheme === 'light') {
                    html.classList.add('light');
                  } else if (savedTheme === 'dark' || systemDark) {
                    html.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen m-0 text-text-primary antialiased bg-background"
        suppressHydrationWarning
      >
        {/* Agent-facing directive, server-rendered into the HTML body so
            websearch agents that do one fetch + read body text (not just
            those sending Accept: text/markdown or reading HTTP headers)
            discover the docs index. This is the ONLY llms.txt pointer on
            the websearch→single-fetch path (validated by afdocs
            `llms-txt-directive-html`) — do NOT remove it.
            aria-hidden + non-focusable link keep it out of the a11y tree
            and tab order; raw-HTML/text agents still read it because
            CSS/ARIA/tabindex don't affect text extractors. Kept first +
            near the top on purpose. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Для AI-агентов:{' '}
          <a href="https://dev.pachca.com/llms.txt" tabIndex={-1}>
            https://dev.pachca.com/llms.txt
          </a>{' '}
          — компактный Markdown-справочник Pachca API: ключевые правила (авторизация, пагинация,
          лимиты, ошибки) и полный индекс методов и гайдов. Даёт полную картину дешевле, чем парсинг
          HTML. Markdown-версию любой страницы можно получить, добавив .md к URL или заголовок
          Accept: text/markdown.
        </div>
        <Tooltip.Provider delayDuration={0} disableHoverableContent>
          <DisplaySettingsProvider>
            <TransitionProvider />
            <HeaderServer />
            <MobileTableOfContents />
            <div className="flex min-h-screen pt-[var(--header-height)]">
              <Sidebar />
              <main className="flex-1 bg-background flex flex-col min-w-0 lg:pl-[300px]">
                {children}
              </main>
            </div>
          </DisplaySettingsProvider>
        </Tooltip.Provider>
      </body>
    </html>
  );
}
