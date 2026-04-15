import {
  loadTimeline,
  groupTimelineByDate,
  isNewUpdate,
  type TimelineEntry,
  type ParsedRelease,
  type ReleaseProduct,
} from '@/lib/updates-parser';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { toSlug } from '@/lib/utils/transliterate';
import { MarkdownContent } from './markdown-content';
import { HeadingLink } from './heading-link';
import { InlineCodeText } from './inline-code-text';
import { ArrowUpRight, Package } from 'lucide-react';

const PRODUCT_LABELS: Record<ReleaseProduct, string> = {
  cli: 'CLI',
  sdk: 'SDK',
  generator: 'Generator',
  n8n: 'n8n',
};

const PRODUCT_COLORS: Record<ReleaseProduct, string> = {
  cli: 'bg-method-get/10 text-method-get',
  sdk: 'bg-method-post/10 text-method-post',
  generator: 'bg-method-post/10 text-method-post',
  n8n: 'bg-primary/10 text-primary',
};

type PackageInfo = { href: (v: string) => string; title: string };

const PRODUCT_PACKAGES: Record<ReleaseProduct, PackageInfo[]> = {
  cli: [{ href: (v) => `https://www.npmjs.com/package/@pachca/cli/v/${v}`, title: 'CLI' }],
  sdk: [
    { href: (v) => `https://www.npmjs.com/package/@pachca/sdk/v/${v}`, title: 'TypeScript' },
    { href: (v) => `https://pypi.org/project/pachca-sdk/${v}/`, title: 'Python' },
    {
      href: (v) => `https://pkg.go.dev/github.com/pachca/openapi/sdk/go/generated@v${v}`,
      title: 'Go',
    },
    {
      href: () => 'https://github.com/pachca/openapi/tree/main/sdk/kotlin',
      title: 'Kotlin',
    },
    {
      href: () => 'https://github.com/pachca/openapi/tree/main/sdk/swift',
      title: 'Swift',
    },
    {
      href: (v) => `https://www.nuget.org/packages/Pachca.Sdk/${v}`,
      title: 'C#',
    },
  ],
  generator: [
    {
      href: (v) => `https://www.npmjs.com/package/@pachca/generator/v/${v}`,
      title: 'Generator',
    },
  ],
  n8n: [
    {
      href: (v) => `https://www.npmjs.com/package/n8n-nodes-pachca/v/${v}`,
      title: 'n8n',
    },
  ],
};

const CHANGE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  '+': { icon: '+', color: 'text-text-tertiary' },
  '~': { icon: '~', color: 'text-text-tertiary' },
  '-': { icon: '−', color: 'text-text-tertiary' },
};

/** Extract the last version from a range like "2.0.1–2.0.4" → "2.0.4" */
function resolveVersion(version: string): string {
  const parts = version.split('–');
  return parts[parts.length - 1];
}

function ProductBadge({ product }: { product: ReleaseProduct }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${PRODUCT_COLORS[product]}`}
    >
      {PRODUCT_LABELS[product]}
    </span>
  );
}

function PackageLink({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group no-underline! flex items-center gap-2 px-3 py-2 text-[14px] font-medium rounded-xl border border-glass-border bg-glass backdrop-blur-md hover:bg-glass-hover hover:border-glass-heavy-border transition-all duration-200"
    >
      <Package className="w-4 h-4 shrink-0 text-text-primary" strokeWidth={2} />
      <span className="text-[14px] font-medium text-text-primary">{title}</span>
      <ArrowUpRight className="ml-auto shrink-0 w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

function ReleaseEntry({ release }: { release: ParsedRelease }) {
  return (
    <div className="rounded-lg border border-glass-border bg-glass px-3 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <ProductBadge product={release.product} />
        <span className="text-[13px] font-mono font-semibold text-text-tertiary">
          v{release.version}
        </span>
      </div>
      <div className="space-y-1">
        {release.changes.map((change, i) => {
          const typeInfo = CHANGE_TYPE_ICONS[change.type] || CHANGE_TYPE_ICONS['~'];
          return (
            <div key={i} className="flex gap-2 text-[14px] leading-relaxed text-text-primary">
              <span className={`shrink-0 font-mono font-bold ${typeInfo.color} w-3 text-center`}>
                {typeInfo.icon}
              </span>
              <InlineCodeText text={change.description} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpdateEntry({
  entry,
  allEndpoints,
  sectionId,
}: {
  entry: TimelineEntry & { kind: 'update' };
  allEndpoints: Awaited<ReturnType<typeof parseOpenAPI>>['endpoints'];
  sectionId: string;
}) {
  const update = entry.data;
  return (
    <>
      <h3 className="group/heading relative text-[32px] font-semibold! text-text-primary leading-tight mt-0! mb-3!">
        <HeadingLink id={sectionId} searchParam={update.date} />
        {update.title}
      </h3>
      <div className="text-text-primary leading-relaxed space-y-2 max-w-3xl">
        <MarkdownContent content={update.content} allEndpoints={allEndpoints} />
      </div>
    </>
  );
}

/**
 * Server component that renders unified timeline: API updates + product releases
 */
export async function UpdatesList() {
  const timeline = loadTimeline();
  const groups = groupTimelineByDate(timeline);
  const api = await parseOpenAPI();
  const allEndpoints = api.endpoints;

  return (
    <div className="relative ml-4 pl-10 space-y-16 pb-10">
      {/* Вертикальная линия */}
      <div className="absolute left-0 top-[5.5px] bottom-0 w-px bg-background-border/50" />

      {groups.map((group) => {
        const isNew = isNewUpdate(group.date);
        const updates = group.entries.filter(
          (e): e is TimelineEntry & { kind: 'update' } => e.kind === 'update'
        );
        const releases = group.entries.filter(
          (e): e is TimelineEntry & { kind: 'release' } => e.kind === 'release'
        );

        const firstUpdate = updates[0];
        const sectionId = firstUpdate ? toSlug(firstUpdate.data.title) : `releases-${group.date}`;

        return (
          <section
            key={group.date}
            className="relative"
            id={sectionId}
            style={{ scrollMarginTop: 'var(--scroll-offset)' }}
          >
            <div
              className={`absolute -left-[45.5px] top-0 w-3 h-3 rounded-full border-2 border-background z-10 ${
                isNew ? 'bg-primary' : 'bg-background-border'
              }`}
            />
            <div className="flex flex-col mb-3">
              <span className="text-[11px] font-mono font-bold text-text-tertiary uppercase tracking-widest leading-none mb-2">
                {group.displayDate}
              </span>

              {/* API updates */}
              {updates.map((entry, i) => (
                <div key={`update-${i}`} className={i > 0 ? 'mt-8' : ''}>
                  <UpdateEntry entry={entry} allEndpoints={allEndpoints} sectionId={sectionId} />
                </div>
              ))}

              {/* Product releases */}
              {releases.length > 0 && (
                <div className={`space-y-4 ${updates.length > 0 ? 'mt-4' : 'mt-3'}`}>
                  {releases.map((entry, i) => (
                    <ReleaseEntry key={`release-${i}`} release={entry.data} />
                  ))}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {releases.flatMap((entry) =>
                      PRODUCT_PACKAGES[entry.data.product].map((pkg) => (
                        <PackageLink
                          key={`${entry.data.product}-${pkg.title}`}
                          href={pkg.href(resolveVersion(entry.data.version))}
                          title={pkg.title}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
