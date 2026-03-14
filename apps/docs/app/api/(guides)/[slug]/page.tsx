import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { getGuideData, getAllApiGuideSlugs, extractFirstParagraph } from '@/lib/content-loader';
import { getSectionTitle } from '@/lib/tabs-config';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const slugs = getAllApiGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getGuideData(`api/${slug}`);

  if (!data) {
    return {
      title: 'Страница не найдена',
    };
  }

  const firstParagraph = extractFirstParagraph(data.content);
  const pageTitle = data.frontmatter.title;
  const section = getSectionTitle(`/api/${slug}`);
  const title = section ? `${section}: ${pageTitle}` : pageTitle;
  const description: string | undefined = data.frontmatter.description || firstParagraph;
  const ogImage = `/api/og?type=guide&slug=api/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/api/${slug}`,
      types: {
        'text/markdown': `/api/${slug}.md`,
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

export default async function ApiGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getGuideData(`api/${slug}`);

  if (!data) {
    notFound();
  }

  const pageUrl = `/api/${slug}`;
  const ogImage = `/api/og?type=guide&slug=api/${slug}`;
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
        image: `https://dev.pachca.com${ogImage}`,
        dateModified: new Date().toISOString(),
        isPartOf: {
          '@type': 'WebSite',
          url: 'https://dev.pachca.com',
        },
        publisher: { '@id': 'https://pachca.com/#organization' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Документация',
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
