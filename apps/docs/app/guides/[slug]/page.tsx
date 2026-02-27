import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { UpdatesList } from '@/components/api/updates-list';
import { getGuideData, getAllGuideSlugs, extractFirstParagraph } from '@/lib/content-loader';
import { loadUpdates } from '@/lib/updates-parser';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const data = getGuideData(slug);

  if (!data) {
    return {
      title: 'Страница не найдена',
    };
  }

  const firstParagraph = extractFirstParagraph(data.content);
  let title = data.frontmatter.title;
  let description: string | undefined = data.frontmatter.description || firstParagraph;
  let ogImage = `/api/og?type=guide&slug=${slug}`;

  if (slug === 'updates') {
    const dateParam = typeof resolvedSearchParams.s === 'string' ? resolvedSearchParams.s : null;

    if (dateParam) {
      const updates = loadUpdates();
      const update = updates.find((u) => u.date === dateParam);

      if (update) {
        title = `${update.title} — ${data.frontmatter.title}`;
        description = update.content
          .replace(/[#*`\[\]]/g, '')
          .slice(0, 200)
          .trim();
      }
    }

    ogImage = `/api/og?type=updates${dateParam ? `&date=${dateParam}` : ''}`;
  }

  return {
    title,
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
      images: [ogImage],
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
            name: 'API',
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
