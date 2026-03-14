import { getSchemaByName, getEndpointByOperation, getBaseUrl } from '@/lib/openapi/parser';
import { WebhookSchemaSection } from '@/components/api/webhook-schema-section';
import { CodeExamples } from '@/components/api/code-examples';
import { ResponseCodesList } from '@/components/api/response-codes-list';
import { LimitCard } from '@/components/api/limit-card';
import { UpdatesList } from '@/components/api/updates-list';
import { Callout } from '@/components/api/callout';
import { Steps, Step } from '@/components/mdx/steps';
import { CardGroup, Card, GUIDE_ICONS, API_SECTION_META } from '@/components/mdx/cards';
import { Mermaid } from '@/components/mdx/mermaid';
import { Tree, TreeFolder, TreeFile } from '@/components/mdx/tree';
import { ImageCard } from '@/components/mdx/image-card';
import { AgentSkillsWorkflows } from '@/components/mdx/agent-skills-workflows';
import { CliCommands } from '@/components/mdx/cli-commands';
import { NpmBadge } from '@/components/mdx/npm-badge';
import { PackageBadge } from '@/components/mdx/package-badge';
import { HomeHero, HomeHeroContent, HomeHeroCode } from '@/components/mdx/home-hero';
import { getOrderedPages } from '@/lib/ordered-pages';
import { generateNavigation } from '@/lib/navigation';
import type { Schema } from '@/lib/openapi/types';
import { HTTP_CODES } from '@/lib/schemas/guide-schemas';

/**
 * MDX Components for dynamic content in markdown files
 *
 * Usage in .md files:
 *
 * <SchemaBlock name="MessageWebhookPayload" />
 * <SchemaBlock name="MessageWebhookPayload" title="Custom Title" />
 * <SchemaBlock name="inline" schema={{...}} />
 *
 * <HttpCodes />
 *
 * <Limit title="Название" limit="~4" period="1 сек" />
 * <Limit title="Название" limit="~4" period="1 сек" entity="chat_id" howItWorks="Описание" />
 *
 * <Updates />
 *
 * <ImageCard src="/images/example.webp" alt="Описание" caption="Подпись" />
 * <ImageCard src="/images/example.webp" alt="Описание" maxWidth={500} />
 */

// ============================================
// SchemaBlock - displays OpenAPI schema by name
// ============================================

interface SchemaBlockProps {
  /** Name of the schema in OpenAPI spec */
  name?: string;
  /** Custom title for the schema block */
  title?: string;
  /** Whether to show header */
  hideHeader?: boolean;
  /** Inline schema object (for custom schemas not in OpenAPI) */
  schema?: Schema;
}

export async function SchemaBlock({
  name,
  title,
  hideHeader = false,
  schema: inlineSchema,
}: SchemaBlockProps) {
  let schema: Schema | null = null;

  if (inlineSchema) {
    schema = inlineSchema;
  } else if (name) {
    schema = (await getSchemaByName(name)) || null;
  }

  if (!schema) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        Schema not found: {name}
      </div>
    );
  }

  return (
    <WebhookSchemaSection schema={schema} title={title} hideHeader={hideHeader} schemaName={name} />
  );
}

// ============================================
// HttpCodes - displays HTTP response codes table
// ============================================

export function HttpCodes() {
  return <ResponseCodesList title="Коды ответов HTTP" items={HTTP_CODES} />;
}

// ============================================
// ErrorSchema - displays error response schemas from OpenAPI
// ============================================

export async function ErrorSchema() {
  const apiError = await getSchemaByName('ApiError');
  const oauthError = await getSchemaByName('OAuthError');

  return (
    <div className="space-y-8">
      {apiError && (
        <WebhookSchemaSection schema={apiError} title="ApiError (400, 403, 404, 409, 410, 422)" />
      )}
      {oauthError && <WebhookSchemaSection schema={oauthError} title="OAuthError (401, 403)" />}
    </div>
  );
}

// ============================================
// Limit - displays rate limit card
// ============================================

interface LimitProps {
  title: string;
  limit: string;
  period: string;
  entity?: string;
  howItWorks?: string;
}

export function Limit({ title, limit, period, entity, howItWorks }: LimitProps) {
  return (
    <LimitCard
      title={title}
      limit={limit}
      period={period}
      entity={entity}
      howItWorks={
        howItWorks ? <span dangerouslySetInnerHTML={{ __html: howItWorks }} /> : undefined
      }
    />
  );
}

// ============================================
// Updates - displays changelog/updates list from MDX file
// ============================================

// Re-export UpdatesList as Updates for backward compatibility
export { UpdatesList as Updates };

// ============================================
// Warning/Info Callouts for explicit use
// ============================================

export function Warning({ children }: { children: React.ReactNode }) {
  return <Callout type="warning">{children}</Callout>;
}

export function Info({ children }: { children: React.ReactNode }) {
  return <Callout type="info">{children}</Callout>;
}

export function Danger({ children }: { children: React.ReactNode }) {
  return <Callout type="warning">{children}</Callout>;
}

// ============================================
// Export all MDX components
// ============================================

// ============================================
// CodeBlock - code block with optional title
// ============================================

interface CodeBlockProps {
  language?: string;
  title?: string;
  copyButton?: boolean;
  children: React.ReactNode;
}

export async function CodeBlock({
  language = 'text',
  title,
  copyButton,
  children,
}: CodeBlockProps) {
  const { GuideCodeBlock } = await import('@/components/api/guide-code-block');
  const code = String(children).replace(/\n$/, '');
  const mappedLanguage = language === 'bash' || language === 'shell' ? 'curl' : language;
  return (
    <GuideCodeBlock language={mappedLanguage} code={code} title={title} copyButton={copyButton} />
  );
}

// ============================================
// GuideCards - auto-generated cards from guide pages
// ============================================

export function GuideCards() {
  const guides = getOrderedPages().filter(
    (g) => g.path !== '/' && !g.path.startsWith('/updates') && !g.path.startsWith('/api/')
  );

  return (
    <CardGroup>
      {guides.map((guide) => (
        <Card key={guide.path} title={guide.title} icon={GUIDE_ICONS[guide.path]} href={guide.path}>
          {guide.description}
        </Card>
      ))}
    </CardGroup>
  );
}

// ============================================
// ApiCards - auto-generated cards from API navigation sections
// ============================================

export async function ApiCards() {
  const sections = await generateNavigation();
  // Skip first section ("Инструменты" — guides) and "Профиль и статус"
  const methodsSection = sections.find((s) => s.title === 'Методы API');
  const apiGroups = methodsSection?.items ?? [];

  return (
    <CardGroup>
      {apiGroups.map((group) => {
        const meta = API_SECTION_META[group.title];
        const firstHref = group.children?.[0]?.href || group.href;
        if (!firstHref) return null;

        return (
          <Card key={group.title} title={group.title} icon={meta?.icon} href={firstHref}>
            {meta?.description ?? group.title}
          </Card>
        );
      })}
    </CardGroup>
  );
}

// ============================================
// ApiCodeExample - auto-generated code examples from OpenAPI endpoint
// ============================================

/**
 * Usage in .mdx files:
 *
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" />
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="Custom title" />
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="With filters" params={{ event_key: "user_login", limit: 50 }} />
 * <ApiCodeExample operationId="MessageOperations_createMessage" requestMode="required" responseMode="minimal" />
 *
 * operationId = {InterfaceName}_{methodName} from TypeSpec (see openapi.yaml)
 * params — override query parameter values; only specified + required params are included
 * requestMode — "full" (default): all fields; "required": only required fields in request body
 * responseMode — "full" (default): all fields with values; "minimal": null for nullable, [] for optional arrays
 */

interface ApiCodeExampleProps {
  operationId: string;
  title?: string;
  show?: 'request' | 'response' | 'both';
  params?: Record<string, unknown>;
  requestMode?: 'full' | 'required';
  responseMode?: 'full' | 'minimal';
}

export async function ApiCodeExample({
  operationId,
  title,
  show = 'request',
  params,
  requestMode,
  responseMode,
}: ApiCodeExampleProps) {
  const endpoint = await getEndpointByOperation(operationId);
  const baseUrl = await getBaseUrl();

  if (!endpoint) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        Endpoint not found: {operationId}
      </div>
    );
  }

  let finalEndpoint = endpoint;
  if (params) {
    const paramNames = Object.keys(params);
    finalEndpoint = {
      ...endpoint,
      parameters: endpoint.parameters
        .filter((p) => p.in !== 'query' || p.required || paramNames.includes(p.name))
        .map((p) => (paramNames.includes(p.name) ? { ...p, example: params[p.name] } : p)),
    };
  }

  return (
    <CodeExamples
      endpoint={finalEndpoint}
      baseUrl={baseUrl}
      show={show}
      title={title}
      requestMode={requestMode}
      responseMode={responseMode}
      className="my-4"
    />
  );
}

export const customMdxComponents = {
  SchemaBlock,
  HttpCodes,
  ErrorSchema,
  CodeBlock,
  Limit,
  Updates: UpdatesList,
  Warning,
  Info,
  Danger,
  Callout,
  Steps,
  Step,
  CardGroup,
  Card,
  GuideCards,
  ApiCards,
  Mermaid,
  Tree,
  TreeFolder,
  TreeFile,
  ImageCard,
  ApiCodeExample,
  AgentSkillsWorkflows,
  CliCommands,
  NpmBadge,
  PackageBadge,
  HomeHero,
  HomeHeroContent,
  HomeHeroCode,
};
