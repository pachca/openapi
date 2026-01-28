import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'Обзор | Пачка API',
    template: '%s | Пачка API',
  },
  description: 'Создавайте уникальные решения на одной платформе',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <head>
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
        <Tooltip.Provider delayDuration={0}>
          <TransitionProvider />
          <div className="flex w-full overflow-hidden main-container-padding">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-background custom-scrollbar flex flex-col min-w-0">
              {children}
            </main>
          </div>
        </Tooltip.Provider>
      </body>
    </html>
  );
}
