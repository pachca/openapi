import { getBaseUrl } from '@/lib/openapi/parser';
import { API_CLIENTS } from '@/lib/api-clients';
import { Card } from '@/components/mdx/cards';
import { ApiClientPanelClient } from './api-client-panel-client';

/** Downloadable specs and files, shown below the client panel. */
const RESOURCES = [
  { title: 'OpenAPI', icon: 'FileSearch', href: '/openapi.yaml' },
  { title: 'Postman', icon: 'LayoutList', href: '/pachca.postman_collection.json' },
];

/**
 * Right-column panel for /api/overview: the base URL (read from the spec), a
 * tabbed switcher over the official clients (CLI and the six SDKs), and
 * downloadable resources (spec, Postman, llms.txt).
 */
export async function ApiClientPanel() {
  const baseUrl = await getBaseUrl();
  return (
    <div className="not-prose flex flex-col gap-4">
      <ApiClientPanelClient baseUrl={baseUrl} clients={API_CLIENTS} />
      <div className="flex flex-wrap gap-2.5">
        {RESOURCES.map((r) => (
          <Card key={r.href} compact title={r.title} icon={r.icon} href={r.href} download />
        ))}
      </div>
    </div>
  );
}
