import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { getAdjacentItems } from '@/lib/navigation';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { UpdatesList } from '@/components/api/updates-list';
import { getGuideData } from '@/lib/content-loader';
import { notFound } from 'next/navigation';

export async function UpdatesPageContent() {
  const data = getGuideData('updates');

  if (!data) {
    notFound();
  }

  const pageUrl = '/guides/updates';
  const adjacent = await getAdjacentItems(pageUrl);
  const introContent = data.content.split(/<!--\s*update:/)[0].trim();

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
      <MarkdownContent content={introContent} />
      <UpdatesList />
    </StaticPageWrapper>
  );
}
