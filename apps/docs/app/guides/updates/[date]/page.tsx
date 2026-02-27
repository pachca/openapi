import { UpdatesPageContent } from '@/components/api/updates-page-content';
import { getGuideData } from '@/lib/content-loader';
import { loadUpdates } from '@/lib/updates-parser';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const updates = loadUpdates();
  return updates.map((u) => ({ date: u.date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const data = getGuideData('updates');
  const updates = loadUpdates();
  const update = updates.find((u) => u.date === date);

  if (!data || !update) {
    return { title: 'Страница не найдена' };
  }

  const title = update.title;
  const description = update.content
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/\n+[-*]\s+/g, ', ') // list items → comma-separated
    .replace(/^[-*]\s+/gm, '') // leading list marker
    .replace(/([:.]),/g, '$1') // fix ",  " after : or .
    .replace(/[#*`]/g, '') // remaining markdown
    .replace(/([^.!?:,])\n\n/g, '$1.\n\n') // period before paragraph breaks
    .replace(/\n+/g, ' ') // newlines → spaces
    .replace(/\s{2,}/g, ' ') // collapse spaces
    .slice(0, 200)
    .trim();

  return {
    title,
    description,
    alternates: {
      canonical: `/guides/updates/${date}`,
      types: {
        'text/markdown': '/guides/updates.md',
      },
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
  const update = updates.find((u) => u.date === date);

  if (!update) {
    notFound();
  }

  return <UpdatesPageContent />;
}
