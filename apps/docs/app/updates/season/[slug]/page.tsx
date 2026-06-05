import { UpdatesPageContent } from '@/components/api/updates-page-content';
import { loadTimeline, groupTimelineByDate } from '@/lib/updates-parser';
import { groupBySeason, parseSeasonSlug } from '@/lib/seasons';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const seasons = groupBySeason(groupTimelineByDate(loadTimeline()));
  return seasons.map((s) => ({ slug: s.season.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const season = parseSeasonSlug(slug);
  if (!season) {
    return { title: 'Страница не найдена' };
  }

  const title = season.label;
  const description = `Обновления API Пачки, CLI, SDK и расширения для n8n за период «${season.label}».`;

  return {
    title: { absolute: `${title} | Обновления | Руководство разработчика` },
    description,
    alternates: {
      canonical: `/updates/season/${slug}`,
      types: { 'text/markdown': `/updates/season/${slug}.md` },
    },
    openGraph: {
      type: 'article',
      siteName: 'Пачка',
      locale: 'ru_RU',
      description,
      images: [`/internal/og?type=updates&season=${slug}`],
    },
  };
}

export default async function UpdateSeasonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const season = parseSeasonSlug(slug);
  if (!season) {
    notFound();
  }

  return <UpdatesPageContent variant="season" slug={slug} />;
}
