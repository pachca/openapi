import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { getGuideContent } from '@/lib/content-loader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Обзор - Пачка для разработчиков',
  },
  description: 'Создавайте уникальные решения на одной платформе',
  alternates: {
    canonical: '/',
    types: {
      'text/markdown': '/.md',
    },
  },
  openGraph: {
    images: ['/api/og'],
  },
};

export default function HomePage() {
  return <HomeContent />;
}

async function HomeContent() {
  const adjacent = await getAdjacentItems('/');
  const content = getGuideContent('home');

  if (!content) {
    return (
      <StaticPageWrapper adjacent={adjacent}>
        <StaticPageHeader title="Обзор" pageUrl="/" />
        <p>Контент страницы не найден.</p>
      </StaticPageWrapper>
    );
  }

  return (
    <StaticPageWrapper adjacent={adjacent}>
      <StaticPageHeader title="Обзор" pageUrl="/" />
      <MarkdownContent content={content} />
    </StaticPageWrapper>
  );
}
