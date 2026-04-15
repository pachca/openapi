import { UpdatesPageContent } from '@/components/api/updates-page-content';
import { getGuideData } from '@/lib/content-loader';
import { loadUpdates, loadReleases, formatDateRu } from '@/lib/updates-parser';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const PRODUCT_TITLES: Record<string, string> = {
  cli: 'CLI',
  sdk: 'SDK',
  generator: 'Generator',
  n8n: 'n8n Node',
};

export async function generateStaticParams() {
  const updates = loadUpdates();
  const releases = loadReleases();
  const dates = new Set([...updates.map((u) => u.date), ...releases.map((r) => r.date)]);
  return Array.from(dates).map((date) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const data = getGuideData('updates');
  const updates = loadUpdates();
  const releases = loadReleases();
  const update = updates.find((u) => u.date === date);
  const dateReleases = releases.filter((r) => r.date === date);

  if (!data || (!update && dateReleases.length === 0)) {
    return { title: 'Страница не найдена' };
  }

  let title: string;
  let description: string;

  if (update) {
    title = update.title;
    description = update.content
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\n+[-*]\s+/g, ', ')
      .replace(/^[-*]\s+/gm, '')
      .replace(/([:.]),/g, '$1')
      .replace(/[#*`]/g, '')
      .replace(/([^.!?:,])\n\n/g, '$1.\n\n')
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 200)
      .trim();
  } else {
    const products = [...new Set(dateReleases.map((r) => PRODUCT_TITLES[r.product]))].join(', ');
    title = `${products} — ${formatDateRu(date)}`;
    description = dateReleases.map((r) => `${PRODUCT_TITLES[r.product]} v${r.version}`).join(', ');
  }

  return {
    title: { absolute: `${title} | Руководство разработчика` },
    description,
    alternates: {
      canonical: `/updates/${date}`,
    },
    openGraph: {
      type: 'article',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description,
      images: [`/api/og?type=updates&date=${date}`],
    },
  };
}

export default async function UpdateDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const updates = loadUpdates();
  const releases = loadReleases();
  const update = updates.find((u) => u.date === date);
  const dateReleases = releases.filter((r) => r.date === date);

  if (!update && dateReleases.length === 0) {
    notFound();
  }

  return <UpdatesPageContent />;
}
