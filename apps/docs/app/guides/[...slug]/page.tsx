import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { getGuideData, getAllGuideSlugs, extractFirstParagraph } from '@/lib/content-loader';
import { getSectionTitle } from '@/lib/tabs-config';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  return slugs.map((slug) => ({ slug: slug.split('/') }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join('/');
  const data = getGuideData(slugPath);

  if (!data) {
    return {
      title: 'Страница не найдена',
    };
  }

  const firstParagraph = extractFirstParagraph(data.content);
  const title = data.frontmatter.title;
  const description: string | undefined = data.frontmatter.description || firstParagraph;
  const ogImage = `/api/og?type=guide&slug=${slug.join('-')}`;
  const pageUrl = `/guides/${slugPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      types: {
        'text/markdown': `${pageUrl}.md`,
      },
    },
    openGraph: {
      type: 'article',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description,
      images: [ogImage],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugPath = slug.join('/');
  const data = getGuideData(slugPath);

  if (!data) {
    notFound();
  }

  const pageUrl = `/guides/${slugPath}`;
  const adjacent = await getAdjacentItems(pageUrl);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: data.frontmatter.title,
        description: data.frontmatter.description,
        url: `https://dev.pachca.com${pageUrl}`,
        inLanguage: 'ru',
        isPartOf: {
          '@type': 'WebSite',
          url: 'https://dev.pachca.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Пачка',
          url: 'https://pachca.com',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Developer Guide',
            item: 'https://dev.pachca.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: data.frontmatter.title,
          },
        ],
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
      <StaticPageHeader
        title={data.frontmatter.title}
        pageUrl={pageUrl}
        sectionTitle={getSectionTitle(pageUrl) || undefined}
      />
      <MarkdownContent content={data.content} />
    </StaticPageWrapper>
  );
}
