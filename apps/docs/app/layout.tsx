import type { Metadata, Viewport } from 'next';
import { Sidebar } from '@/components/layout/sidebar-wrapper';
import { TransitionProvider } from '@/components/layout/transition-provider';
import { Inter } from 'next/font/google';
import * as Tooltip from '@radix-ui/react-tooltip';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://dev.pachca.com'),
  title: {
    default: 'Обзор - Пачка для разработчиков',
    template: '%s - Пачка для разработчиков',
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
  '@type': 'WebSite',
  name: 'Пачка для разработчиков',
  description:
    'REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.',
  url: 'https://dev.pachca.com',
  inLanguage: 'ru',
  publisher: {
    '@type': 'Organization',
    name: 'Пачка',
    url: 'https://pachca.com',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://dev.pachca.com/?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#36373d" media="(prefers-color-scheme: dark)" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Пачка API — Обновления"
          href="/feed.xml"
        />
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
        <link rel="alternate" type="text/plain" title="llms-full.txt" href="/llms-full.txt" />
        <link rel="alternate" type="text/markdown" title="skill.md" href="/skill.md" />
        <link
          rel="alternate"
          type="application/vnd.oai.openapi"
          title="OpenAPI"
          href="/openapi.yaml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        className="h-full m-0 overflow-hidden font-sans text-text-primary antialiased bg-background"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:text-sm"
        >
          Перейти к содержимому
        </a>
        <Tooltip.Provider delayDuration={0}>
          <TransitionProvider />
          <div className="flex w-full overflow-hidden main-container-padding">
            <Sidebar />
            <main
              id="main-content"
              className="flex-1 overflow-y-auto bg-background custom-scrollbar flex flex-col min-w-0"
            >
              {children}
            </main>
          </div>
        </Tooltip.Provider>
      </body>
    </html>
  );
}
