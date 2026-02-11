import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { UpdatesList } from '@/components/api/updates-list';
import { getGuideData, getAllGuideSlugs, extractFirstParagraph } from '@/lib/content-loader';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getGuideData(slug);

  if (!data) {
    return {
      title: 'Страница не найдена',
    };
  }

  const firstParagraph = extractFirstParagraph(data.content);
  const description = firstParagraph || data.frontmatter.description;

  return {
    title: data.frontmatter.title,
    description,
    alternates: {
      canonical: `/guides/${slug}`,
      types: {
        'text/markdown': `/guides/${slug}.md`,
      },
    },
    openGraph: {
      type: 'article',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description,
      images: [`/api/og?type=guide&slug=${slug}`],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getGuideData(slug);

  if (!data) {
    notFound();
  }

  const pageUrl = `/guides/${slug}`;
  const adjacent = await getAdjacentItems(pageUrl);

  // Extract intro text (before first update marker) for updates page
  const introContent = data.frontmatter.useUpdatesComponent
    ? data.content.split(/<!--\s*update:/)[0].trim()
    : data.content;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: data.frontmatter.title,
    description: data.frontmatter.description,
    url: `https://dev.pachca.com${pageUrl}`,
    inLanguage: 'ru',
    publisher: {
      '@type': 'Organization',
      name: 'Пачка',
      url: 'https://pachca.com',
    },
  };

  return (
    <StaticPageWrapper
      adjacent={adjacent}
      hideTableOfContents={data.frontmatter.hideTableOfContents}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPageHeader title={data.frontmatter.title} pageUrl={pageUrl} />
      {data.frontmatter.useUpdatesComponent ? (
        <>
          <MarkdownContent content={introContent} />
          <UpdatesList />
        </>
      ) : (
        <MarkdownContent content={data.content} />
      )}
    </StaticPageWrapper>
  );
}
