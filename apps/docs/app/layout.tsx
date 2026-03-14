import type { Metadata, Viewport } from 'next';
import { Sidebar } from '@/components/layout/sidebar-wrapper';
import { HeaderServer } from '@/components/layout/header-wrapper';
import { TransitionProvider } from '@/components/layout/transition-provider';
import { DisplaySettingsProvider } from '@/components/layout/display-settings-context';
import { MobileTableOfContents } from '@/components/layout/mobile-toc';
import * as Tooltip from '@radix-ui/react-tooltip';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
    <html lang="ru" className="min-h-screen" suppressHydrationWarning>
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
        className="min-h-screen m-0 font-sans text-text-primary antialiased bg-background"
        suppressHydrationWarning
      >
        <Tooltip.Provider delayDuration={0}>
          <DisplaySettingsProvider>
            <TransitionProvider />
            <HeaderServer />
            <MobileTableOfContents />
            <div className="flex min-h-screen pt-[var(--mobile-header-height)]">
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
