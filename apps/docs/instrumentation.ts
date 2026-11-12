/**
 * Runs once when the server starts (Next.js instrumentation hook).
 *
 * Builds the search index ahead of the first query: reading every guide and
 * the OpenAPI spec takes about half a second, which the first visitor to open
 * search would otherwise wait for. The build runs on the next tick so it does
 * not hold up the server start; a query that arrives meanwhile waits for the
 * same build instead of starting another one.
 *
 * This file and the search route get separate copies of the indexer module
 * (Next bundles them into different module graphs); the index itself is on
 * `globalThis`, so the copy warmed here is the one the route reads. In
 * development each copy keeps its own index (fresh code on reload), so there
 * is nothing to warm.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { buildSearchIndex } = await import('./lib/search/indexer');
  setTimeout(() => {
    buildSearchIndex().catch((error: unknown) => {
      // The first query retries the build.
      console.error('Search index warm-up failed:', error);
    });
  }, 0);
}
