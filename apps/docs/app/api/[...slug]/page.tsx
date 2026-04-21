import { parseOpenAPI, getEndpointByUrl } from '@/lib/openapi/parser';
import {
  generateUrlFromOperation,
  generateTitle,
  getDescriptionWithoutTitle,
} from '@/lib/openapi/mapper';
import { ApiMethodTemplate } from '@/components/api/method-template';
import { getAdjacentItems } from '@/lib/navigation';
import { getSdkExamples } from '@/lib/sdk-examples';
import { formatMetaDescription } from '@/lib/meta-description';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const api = await parseOpenAPI();

  return api.endpoints.map((endpoint) => {
    const url = generateUrlFromOperation(endpoint);
    // URL is /api/{tag}/{action}, slug should be [{tag}, {action}]
    const slug = url.split('/').filter(Boolean).slice(1); // Remove "api" prefix
    return { slug };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const path = `/api/${resolvedParams.slug.join('/')}`;
  const endpoint = await getEndpointByUrl(path);

  if (!endpoint) {
    return {
      title: 'Страница не найдена',
    };
  }

  endpoint.title = generateTitle(endpoint);

  const descriptionBody = formatMetaDescription(getDescriptionWithoutTitle(endpoint));
  const description = descriptionBody || formatMetaDescription(endpoint.summary);
  const ogDescription =
    `${endpoint.method} ${endpoint.path}` + (descriptionBody ? `\n${descriptionBody}` : '');

  return {
    title: { absolute: `${endpoint.title} | Документация API` },
    description,
    alternates: {
      canonical: path,
      types: {
        'text/markdown': `${path}.md`,
      },
    },
    openGraph: {
      type: 'article',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description: ogDescription,
      images: [`/api/og?type=method&path=${path}`],
    },
  };
}

export default async function ApiMethodPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const path = `/api/${resolvedParams.slug.join('/')}`;
  const endpoint = await getEndpointByUrl(path);

  if (!endpoint) {
    notFound();
  }

  endpoint.title = generateTitle(endpoint);
  endpoint.url = path;

  const adjacent = await getAdjacentItems(path);

  const api = await parseOpenAPI();
  const baseUrl = api.servers[0]?.url;

  const sdkExamples = getSdkExamples(endpoint.id);
  const tag = endpoint.tags[0] || '';
  const section = resolvedParams.slug[0] || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: endpoint.title,
        description: endpoint.description || endpoint.summary,
        url: `https://dev.pachca.com${path}`,
        inLanguage: 'ru',
        image: `https://dev.pachca.com/api/og?type=method&path=${path}`,
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
            name: tag,
            item: `https://dev.pachca.com/api/${section}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: endpoint.title,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <ApiMethodTemplate
        endpoint={endpoint}
        adjacent={adjacent}
        allEndpoints={api.endpoints}
        baseUrl={baseUrl}
        sdkExamples={sdkExamples}
      />
    </>
  );
}
