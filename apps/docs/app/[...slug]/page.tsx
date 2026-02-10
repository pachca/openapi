import { parseOpenAPI, getEndpointByUrl } from '@/lib/openapi/parser';
import {
  generateUrlFromOperation,
  generateTitle,
  getDescriptionWithoutTitle,
} from '@/lib/openapi/mapper';
import { ApiMethodTemplate } from '@/components/api/method-template';
import { getAdjacentItems } from '@/lib/navigation';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const api = await parseOpenAPI();

  return api.endpoints.map((endpoint) => {
    const url = generateUrlFromOperation(endpoint);
    const slug = url.split('/').filter(Boolean);

    return { slug };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const path = `/${resolvedParams.slug.join('/')}`;
  const endpoint = await getEndpointByUrl(path);

  if (!endpoint) {
    return {
      title: 'Страница не найдена',
    };
  }

  // Enhance endpoint with generated title
  endpoint.title = generateTitle(endpoint);

  const description = endpoint.description || endpoint.summary;
  const descriptionBody = (getDescriptionWithoutTitle(endpoint) || '')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .join(' ')
    .trim();
  const ogDescription =
    `${endpoint.method} ${endpoint.path}` + (descriptionBody ? `\n${descriptionBody}` : '');

  return {
    title: endpoint.title,
    description,
    openGraph: {
      siteName: 'Пачка',
      locale: 'ru_RU',
      description: ogDescription,
      images: [`/api/og?type=method&path=${path}`],
    },
  };
}

export default async function ApiMethodPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const path = `/${resolvedParams.slug.join('/')}`;
  const endpoint = await getEndpointByUrl(path);

  if (!endpoint) {
    notFound();
  }

  // Enhance endpoint with generated title and URL
  endpoint.title = generateTitle(endpoint);
  endpoint.url = path;

  const adjacent = await getAdjacentItems(path);

  // Get all endpoints and base URL for link generation
  const api = await parseOpenAPI();
  const baseUrl = api.servers[0]?.url;

  return (
    <ApiMethodTemplate
      endpoint={endpoint}
      adjacent={adjacent}
      allEndpoints={api.endpoints}
      baseUrl={baseUrl}
    />
  );
}
