import type { Endpoint, NavigationItem } from '@/lib/openapi/types';
import { EndpointHeader } from './endpoint-header';
import { CodeExamples } from './code-examples';
import { ParametersSection } from './parameters-section';
import { ResponseSection } from './response-section';
import { RequestBodySection } from './request-body-section';
import { Footer } from '../layout/footer';
import { MarkdownContent } from './markdown-content';
import {
  generateTitle,
  getDescriptionWithoutTitle,
  generateUrlFromOperation,
} from '@/lib/openapi/mapper';
import { resolveEndpointDescriptionLinks } from '@/lib/openapi/resolve-links';

interface ApiMethodTemplateProps {
  endpoint: Endpoint;
  adjacent?: {
    prev: NavigationItem | null;
    next: NavigationItem | null;
  };
  allEndpoints: Endpoint[];
  baseUrl?: string;
}

export function ApiMethodTemplate({
  endpoint,
  adjacent,
  allEndpoints,
  baseUrl,
}: ApiMethodTemplateProps) {
  const processedEndpoint = resolveEndpointDescriptionLinks(endpoint, allEndpoints);
  const fullDescription = getDescriptionWithoutTitle(processedEndpoint);

  return (
    <div className="flex flex-col flex-1 min-h-full">
      <div className="grid grid-cols-1 xl:grid-cols-2 flex-1">
        {/* Left Column: Documentation */}
        <div className="flex flex-col">
          <div className="p-8 pt-10 xl:p-10 flex-1">
            <div className="xl:mx-0 prose prose-slate">
              <EndpointHeader
                title={generateTitle(endpoint)}
                pageUrl={endpoint.url || generateUrlFromOperation(endpoint)}
                method={endpoint.method}
                path={endpoint.path}
              />

              {fullDescription && (
                <div className="pb-3">
                  <MarkdownContent
                    content={fullDescription}
                    allEndpoints={allEndpoints}
                    className="method-description"
                  />
                </div>
              )}

              <div className="space-y-8">
                <ParametersSection endpoint={processedEndpoint} />
                <RequestBodySection endpoint={processedEndpoint} />
                <ResponseSection endpoint={processedEndpoint} />
              </div>
            </div>
          </div>
          <div className="hidden xl:block">
            <Footer adjacent={adjacent} />
          </div>
        </div>

        {/* Right Column: Code Examples (Sticky) */}
        <div className="relative bg-background border-t border-background-border/50 xl:border-t-0">
          <div className="xl:sticky xl:top-0 p-8 xl:py-10 xl:pr-10 xl:pl-0 h-fit xl:h-screen xl:overflow-y-auto custom-scrollbar">
            <CodeExamples endpoint={endpoint} baseUrl={baseUrl} />
          </div>
        </div>
      </div>
      <div className="xl:hidden">
        <Footer adjacent={adjacent} />
      </div>
    </div>
  );
}
