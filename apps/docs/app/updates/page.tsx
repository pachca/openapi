import { UpdatesPageContent } from '@/components/api/updates-page-content';
import { getGuideData, extractFirstParagraph } from '@/lib/content-loader';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const data = getGuideData('updates');

  if (!data) {
    return { title: 'Страница не найдена' };
  }

  const description = data.frontmatter.description || extractFirstParagraph(data.content);

  return {
    title: { absolute: `${data.frontmatter.title} | Руководство разработчика` },
    description,
    alternates: {
      canonical: '/updates',
      types: {
        'text/markdown': '/updates.md',
      },
    },
    openGraph: {
      type: 'article',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description,
      images: ['/api/og?type=updates'],
    },
  };
}

export default async function UpdatesPage() {
  const data = getGuideData('updates');

  if (!data) {
    notFound();
  }

  return <UpdatesPageContent />;
}
