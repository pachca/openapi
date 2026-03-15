import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { MarkdownContent } from '@/components/api/markdown-content';
import { getGuideData, extractFirstParagraph } from '@/lib/content-loader';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const data = getGuideData('home');

  if (!data) {
    return { title: 'Страница не найдена' };
  }

  const description = data.frontmatter.description || extractFirstParagraph(data.content);

  return {
    title: { absolute: 'Пачка для разработчиков' },
    description,
    alternates: {
      canonical: '/',
      types: {
        'text/markdown': '/index.md',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description,
      images: ['/api/og'],
    },
  };
}

export default async function HomePage() {
  const data = getGuideData('home');

  if (!data) {
    notFound();
  }

  const adjacent = await getAdjacentItems('/');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: data.frontmatter.title,
        description: data.frontmatter.description,
        url: 'https://dev.pachca.com',
        inLanguage: 'ru',
        image: 'https://dev.pachca.com/api/og',
        dateModified: new Date().toISOString(),
        isPartOf: {
          '@type': 'WebSite',
          url: 'https://dev.pachca.com',
        },
        publisher: { '@id': 'https://pachca.com/#organization' },
      },
    ],
  };

  return (
    <StaticPageWrapper
      adjacent={adjacent}
      hideTableOfContents={data.frontmatter.hideTableOfContents}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <MarkdownContent content={data.content} />
    </StaticPageWrapper>
  );
}
