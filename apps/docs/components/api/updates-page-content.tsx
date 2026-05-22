import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StaticPageWrapper } from '@/components/layout/static-page-wrapper';
import { StaticPageHeader } from '@/components/api/static-page-header';
import { MarkdownContent } from '@/components/api/markdown-content';
import { UpdatesList } from '@/components/api/updates-list';
import { getGuideData } from '@/lib/content-loader';
import { getSectionTitle } from '@/lib/tabs-config';
import { loadTimeline, groupTimelineByDate, formatDateRu } from '@/lib/updates-parser';
import { groupBySeason, HOME_SEASON_LIMIT } from '@/lib/seasons';
import type { NavigationItem } from '@/lib/openapi/types';
import { notFound } from 'next/navigation';

type Variant =
  | { variant: 'home' }
  | { variant: 'date'; date: string }
  | { variant: 'season'; slug: string };

function buildJsonLd(headline: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline,
        description,
        url: `https://dev.pachca.com${url}`,
        inLanguage: 'ru',
        isPartOf: { '@type': 'WebSite', url: 'https://dev.pachca.com' },
        publisher: { '@type': 'Organization', name: 'Пачка', url: 'https://pachca.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'API', item: 'https://dev.pachca.com' },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Последние обновления',
            item: 'https://dev.pachca.com/updates',
          },
          { '@type': 'ListItem', position: 3, name: headline },
        ],
      },
    ],
  };
}

/** Link back to the full updates feed, shown atop date/season pages. */
function AllUpdatesLink() {
  return (
    <Link
      href="/updates"
      className="no-underline! inline-flex items-center gap-1.5 text-[14px] font-medium text-text-secondary hover:text-primary transition-colors mb-6"
    >
      <ArrowRight className="w-4 h-4 rotate-180" />
      Все обновления
    </Link>
  );
}

export async function UpdatesPageContent(props: Variant) {
  const data = getGuideData('updates');
  if (!data) {
    notFound();
  }

  const dateGroups = groupTimelineByDate(loadTimeline());
  const seasons = groupBySeason(dateGroups);

  // ── Single date ───────────────────────────────────────────────────────
  if (props.variant === 'date') {
    const idx = dateGroups.findIndex((g) => g.date === props.date);
    if (idx === -1) {
      notFound();
    }
    const group = dateGroups[idx];
    const firstUpdate = group.entries.find((e) => e.kind === 'update');
    const headline = firstUpdate ? firstUpdate.data.title : formatDateRu(props.date);

    const newer = idx > 0 ? dateGroups[idx - 1] : null;
    const older = idx < dateGroups.length - 1 ? dateGroups[idx + 1] : null;
    const adjacent = {
      prev: newer
        ? ({ title: newer.displayDate, href: `/updates/${newer.date}` } as NavigationItem)
        : null,
      next: older
        ? ({ title: older.displayDate, href: `/updates/${older.date}` } as NavigationItem)
        : null,
    };

    const jsonLd = buildJsonLd(headline, group.displayDate, `/updates/${props.date}`);

    return (
      <StaticPageWrapper
        adjacent={adjacent}
        hideTableOfContents
        prevLabel="Новее"
        nextLabel="Старее"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <AllUpdatesLink />
        <UpdatesList dateGroups={[group]} />
      </StaticPageWrapper>
    );
  }

  // ── Single season ─────────────────────────────────────────────────────
  if (props.variant === 'season') {
    const sIdx = seasons.findIndex((s) => s.season.slug === props.slug);
    if (sIdx === -1) {
      notFound();
    }
    const sg = seasons[sIdx];
    const newer = sIdx > 0 ? seasons[sIdx - 1] : null;
    const older = sIdx < seasons.length - 1 ? seasons[sIdx + 1] : null;
    const adjacent = {
      prev: newer
        ? ({
            title: `${newer.season.emoji} ${newer.season.label}`,
            href: `/updates/season/${newer.season.slug}`,
          } as NavigationItem)
        : null,
      next: older
        ? ({
            title: `${older.season.emoji} ${older.season.label}`,
            href: `/updates/season/${older.season.slug}`,
          } as NavigationItem)
        : null,
    };

    const jsonLd = buildJsonLd(
      sg.season.label,
      `Обновления API Пачки за период «${sg.season.label}»`,
      `/updates/season/${sg.season.slug}`
    );

    return (
      <StaticPageWrapper
        adjacent={adjacent}
        hideTableOfContents
        prevLabel="Новее"
        nextLabel="Старее"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <AllUpdatesLink />
        <h1 className="flex items-center gap-2 text-[32px] font-semibold! text-text-primary mt-0! mb-8!">
          <span aria-hidden>{sg.season.emoji}</span>
          {sg.season.label}
        </h1>
        <UpdatesList dateGroups={sg.dates} />
      </StaticPageWrapper>
    );
  }

  // ── Home: latest N seasons + "older" pagination ───────────────────────
  const shownSeasons = seasons.slice(0, HOME_SEASON_LIMIT);
  const shownDateGroups = shownSeasons.flatMap((s) => s.dates);
  const olderSeason = seasons[HOME_SEASON_LIMIT] ?? null;
  const adjacent = {
    prev: null,
    next: olderSeason
      ? ({
          title: `${olderSeason.season.emoji} ${olderSeason.season.label}`,
          href: `/updates/season/${olderSeason.season.slug}`,
        } as NavigationItem)
      : null,
  };

  const pageUrl = '/updates';
  const introContent = data.content.split(/<!--\s*update:/)[0].trim();
  const jsonLd = buildJsonLd(data.frontmatter.title, data.frontmatter.description || '', pageUrl);

  return (
    <StaticPageWrapper
      adjacent={adjacent}
      hideTableOfContents={data.frontmatter.hideTableOfContents}
      nextLabel="Старые обновления"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <StaticPageHeader
        title={data.frontmatter.title}
        pageUrl={pageUrl}
        sectionTitle={getSectionTitle(pageUrl) || undefined}
      />
      <MarkdownContent content={introContent} />
      <UpdatesList dateGroups={shownDateGroups} showSeasonHeaders />
    </StaticPageWrapper>
  );
}
