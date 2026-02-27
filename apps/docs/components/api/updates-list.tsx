import { loadUpdates, isNewUpdate } from '@/lib/updates-parser';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { toSlug } from '@/lib/utils/transliterate';
import { MarkdownContent } from './markdown-content';
import { HeadingLink } from './heading-link';

/**
 * Server component that renders updates from MDX file
 * Reads content/updates.mdx and renders each update entry
 */
export async function UpdatesList() {
  const updates = loadUpdates();
  const api = await parseOpenAPI();
  const allEndpoints = api.endpoints;

  return (
    <div className="relative ml-4 pl-10 space-y-16 pb-10">
      {/* Вертикальная линия */}
      <div className="absolute left-0 top-[5.5px] bottom-0 w-px bg-background-border/50" />

      {updates.map((update, index) => {
        const isNew = isNewUpdate(update.date);
        const sectionId = toSlug(update.title);

        return (
          <section key={`${update.date}-${index}`} className="relative scroll-mt-20" id={sectionId}>
            <div
              className={`absolute -left-[45.5px] top-0 w-3 h-3 rounded-full border-2 border-background z-10 ${
                isNew ? 'bg-primary' : 'bg-background-border'
              }`}
            />
            <div className="flex flex-col mb-3">
              <span className="text-[11px] font-mono font-bold text-text-tertiary uppercase tracking-widest leading-none mb-2">
                {update.displayDate}
              </span>
              <h3 className="group/heading relative text-[32px] font-semibold! text-text-primary leading-tight m-0!">
                <HeadingLink id={sectionId} searchParam={update.date} />
                {update.title}
              </h3>
            </div>
            <div className="text-text-primary leading-relaxed space-y-2 max-w-3xl">
              <MarkdownContent content={update.content} allEndpoints={allEndpoints} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
