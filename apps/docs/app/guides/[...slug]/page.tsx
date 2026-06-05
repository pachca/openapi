import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems, resolveRelatedItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { getGuideData, getAllGuideSlugs, extractFirstParagraph } from '@/lib/content-loader';
import { getSectionTitle, getNestedParentTitle, getActiveTab, TABS } from '@/lib/tabs-config';
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
  const pageTitle = data.frontmatter.title;
  const pageUrl = `/guides/${slugPath}`;
  const parent = getNestedParentTitle(pageUrl);
  const activeTab = getActiveTab(pageUrl);
  const tabPrefix =
    activeTab && (['cli', 'sdk', 'n8n'] as const).includes(activeTab as 'cli' | 'sdk' | 'n8n')
      ? TABS.find((t) => t.id === activeTab)?.title
      : null;
  const baseTitle = parent
    ? `${parent}, ${pageTitle}`
    : tabPrefix
      ? `${tabPrefix}, ${pageTitle}`
      : pageTitle;
  const description: string | undefined = data.frontmatter.description || firstParagraph;
  const ogImage = `/internal/og?type=guide&slug=${slugPath}`;

  return {
    title: { absolute: `${baseTitle} | Руководство разработчика` },
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
  const ogImage = `/internal/og?type=guide&slug=${slugPath}`;
  const adjacent = await getAdjacentItems(pageUrl);
  const relatedItems = await resolveRelatedItems(data.frontmatter.related, pageUrl);

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
      relatedItems={relatedItems}
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
