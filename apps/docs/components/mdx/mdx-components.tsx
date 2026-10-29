import { ArrowUpRight, Zap } from 'lucide-react';
import {
  getSchemaByName,
  getEndpointByOperation,
  getBaseUrl,
  parseOpenAPI,
} from '@/lib/openapi/parser';
import { processSchema } from '@/lib/openapi/resolve-links';
import { getSdkExamples, getSdkExampleForLang } from '@/lib/sdk-examples';
import { SchemaTable } from '@/components/api/schema-table';
import { WebhookSchemaSection } from '@/components/api/webhook-schema-section';
import { CodeExamples } from '@/components/api/code-examples';
import { ResponseCodesList } from '@/components/api/response-codes-list';
import { LimitCard } from '@/components/api/limit-card';
import { UpdatesList } from '@/components/api/updates-list';
import { Callout } from '@/components/api/callout';
import { Steps, Step } from '@/components/mdx/steps';
import { CardGroup, CardRow, Card, GUIDE_ICONS, API_SECTION_META } from '@/components/mdx/cards';
import { ParamsTable } from '@/components/mdx/params-table';
import { Mermaid } from '@/components/mdx/mermaid';
import { Tree, TreeFolder, TreeFile } from '@/components/mdx/tree';
import { ImageCard } from '@/components/mdx/image-card';
import { CliCommands } from '@/components/mdx/cli-commands';
import { McpTools } from '@/components/mdx/mcp-tools';
import { GlobalFlags } from '@/components/mdx/global-flags';
import { SdkCommands } from '@/components/mdx/sdk-commands';
import { NpmBadge } from '@/components/mdx/npm-badge';
import { PackageBadge } from '@/components/mdx/package-badge';
import { HomeHero, HomeHeroContent, HomeHeroCode } from '@/components/mdx/home-hero';
import { ApiClientPanel } from '@/components/mdx/api-client-panel';
import { ApiIntroNotes } from '@/components/mdx/api-intro-notes';
import { Tabs, Tab } from '@/components/mdx/tabs';
import { WebhookPlayground } from '@/components/mdx/webhook-playground';
import { MessagePlayground } from '@/components/mdx/message-playground';
import { FormPlayground } from '@/components/mdx/form-playground';
import { ScopeRolesTable } from '@/components/api/scope-roles-table';
import { getOrderedPages } from '@/lib/ordered-pages';
import { generateNavigation } from '@/lib/navigation';
import type { Endpoint, Schema } from '@/lib/openapi/types';
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
        <WebhookSchemaSection
          schema={apiError}
          title="ApiError (400, 402, 403, 404, 409, 410, 422, 429, 503, 504)"
        />
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
        <Card
          key={guide.path}
          title={guide.sectionTitle ? `${guide.sectionTitle}, ${guide.title}` : guide.title}
          icon={GUIDE_ICONS[guide.path]}
          href={guide.path}
        >
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
 * Multi-language mode (dropdown + header):
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" />
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="Custom title" />
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="With filters" params={{ event_key: "user_login", limit: 50 }} />
 * <ApiCodeExample operationId="MessageOperations_createMessage" responseMode="minimal" />
 * <ApiCodeExample operationId="MessageOperations_createMessage" example="Сообщение с кнопкой" />
 *
 * Single-language mode (no dropdown, no header, inline copy button):
 * <ApiCodeExample lang="typescript" operationId="ChatOperations_createChat" />
 * <ApiCodeExample lang="python" showInit={false} operationId="ChatOperations_getChat" />
 * <ApiCodeExample lang="go" operations={[
 *   { id: "ChatOperations_createChat", comment: "Создание чата" },
 *   { id: "ProfileOperations_getProfile", comment: "Получение профиля" }
 * ]} />
 *
 * operationId = {InterfaceName}_{methodName} from TypeSpec (see openapi.yaml)
 * params — override parameter and body field values; only specified + required ones are included (curl/cli only)
 * example — request body example to show, by its key or `summary` (the `@opExample` title); without it
 *   the first one. Every language shows it: curl and cli from the spec, the SDK languages from the
 *   `examples` field of the operation's examples.json entry. Needs `operationId`. An unknown name, or
 *   a shown SDK language without that example, renders an error. Applied after `params`, and `params`
 *   that name body fields drop the spec's examples, so use one or the other for the body.
 * responseMode — "full" (default): all fields with values; "minimal": null for nullable, [] for optional arrays
 * lang — single language: no dropdown/header, renders as simple code block
 * langs — filter languages in multi-language dropdown (e.g. ["typescript", "python", "go", "kotlin", "swift", "csharp"])
 * operations — multiple operations in one block (single-language mode only)
 * showInit — whether to include Client_Init (default: true)
 */

interface ApiCodeExampleProps {
  operationId?: string;
  title?: string;
  show?: 'request' | 'response' | 'both';
  params?: Record<string, unknown>;
  example?: string;
  responseMode?: 'full' | 'minimal';
  lang?: 'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp' | 'curl' | 'cli';
  langs?: Array<'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp' | 'curl' | 'cli'>;
  defaultLang?: 'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp' | 'curl' | 'cli';
  operations?: Array<{ id: string; comment?: string }>;
  showInit?: boolean;
}

/**
 * The endpoint the curl and CLI examples of a guide are generated from, in
 * both the single- and the multi-language mode. `params` keep the named and
 * the required query parameters and body fields, with the given values: a
 * guide that asks for three fields should not get every optional one that
 * happens to have an example in the spec. `example` then keeps one authored
 * request body by its title. The .md twin is in `lib/mdx-expander.ts`, so the
 * page and its .md show the same request. `null` when the spec has no request
 * example with that title.
 */
async function guideEndpoint(
  endpoint: Endpoint,
  params: Record<string, unknown> | undefined,
  example: string | undefined
): Promise<Endpoint | null> {
  if (!params && !example) return endpoint;
  const { narrowRequestBody, selectRequestExample } = await import('@/lib/code-generators/utils');

  let result = endpoint;
  if (params) {
    const paramNames = Object.keys(params);
    result = {
      ...endpoint,
      parameters: endpoint.parameters
        .filter((p) => p.in !== 'query' || p.required || paramNames.includes(p.name))
        .map((p) => (paramNames.includes(p.name) ? { ...p, example: params[p.name] } : p)),
      requestBody: narrowRequestBody(endpoint.requestBody, params),
    };
  }
  if (example) {
    const requestBody = selectRequestExample(result.requestBody, example);
    if (!requestBody) return null;
    result = { ...result, requestBody };
  }
  return result;
}

/**
 * `example` that a shown SDK language has no code for: the generator writes a
 * named example into examples.json only when the spec names it. The .md twin
 * is in `lib/mdx-expander.ts`.
 */
function SdkExampleMissing({
  example,
  operationId,
  missing,
}: {
  example: string;
  operationId: string;
  missing: string[];
}) {
  return (
    <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
      Request example &quot;{example}&quot; ({operationId}) has no SDK code in: {missing.join(', ')}
    </div>
  );
}

export async function ApiCodeExample({
  operationId,
  title,
  show = 'request',
  params,
  example,
  responseMode,
  lang,
  langs,
  defaultLang,
  operations,
  showInit = true,
}: ApiCodeExampleProps) {
  // A named request example belongs to one operation.
  if (example && !operationId) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        operationId is required for example=&quot;{example}&quot;
      </div>
    );
  }

  // Single-language mode: render as simple code block
  if (lang) {
    const { GuideCodeBlock } = await import('@/components/api/guide-code-block');

    // CLI / cURL: generate from endpoint
    if (lang === 'cli' || lang === 'curl') {
      if (!operationId) {
        return (
          <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
            operationId is required for lang=&quot;{lang}&quot;
          </div>
        );
      }
      const endpoint = await getEndpointByOperation(operationId);
      if (!endpoint) {
        return (
          <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
            Endpoint not found: {operationId}
          </div>
        );
      }
      const finalEndpoint = await guideEndpoint(endpoint, params, example);
      if (!finalEndpoint) {
        return (
          <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
            Request example not found: {example} ({operationId})
          </div>
        );
      }
      const { generateCurl } = await import('@/lib/code-generators/curl');
      const { generateCLI } = await import('@/lib/code-generators/cli');
      const baseUrl = await getBaseUrl();
      const code =
        lang === 'curl' ? generateCurl(finalEndpoint, baseUrl) : generateCLI(finalEndpoint);
      return <GuideCodeBlock language="bash" code={code} />;
    }

    // SDK languages: load from examples.json
    if (example && operationId) {
      const code = getSdkExampleForLang(lang, [{ id: operationId, example }], showInit);
      if (code) return <GuideCodeBlock language={lang} code={code} />;
      // A name the spec lacks reads as in the other modes, before the SDK one.
      const endpoint = await getEndpointByOperation(operationId);
      if (!endpoint) {
        return (
          <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
            Endpoint not found: {operationId}
          </div>
        );
      }
      if (!(await guideEndpoint(endpoint, undefined, example))) {
        return (
          <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
            Request example not found: {example} ({operationId})
          </div>
        );
      }
      return <SdkExampleMissing example={example} operationId={operationId} missing={[lang]} />;
    }
    const ops = operations ?? (operationId ? [{ id: operationId }] : []);
    const code = getSdkExampleForLang(lang, ops, showInit);

    if (!code) {
      return (
        <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
          SDK example not found: {lang} / {operationId ?? ops.map((o) => o.id).join(', ')}
        </div>
      );
    }

    return <GuideCodeBlock language={lang} code={code} />;
  }

  // Multi-language SDK-only mode: render CodeExamples-style dropdown from examples.json.
  if (!operationId && operations?.length) {
    const sdkLangs = ['typescript', 'python', 'go', 'kotlin', 'swift', 'csharp'] as const;
    type SdkLang = (typeof sdkLangs)[number];
    const isSdkLang = (value: string): value is SdkLang =>
      (sdkLangs as readonly string[]).includes(value);
    const requestedSdkLangs = langs?.filter(isSdkLang);
    const visibleSdkLangs = requestedSdkLangs?.length ? requestedSdkLangs : [...sdkLangs];
    const sdkDefaultLang = defaultLang && isSdkLang(defaultLang) ? defaultLang : undefined;
    const sdkExamples = Object.fromEntries(
      sdkLangs.map((sdkLang) => [sdkLang, getSdkExampleForLang(sdkLang, operations, showInit)])
    );
    const syntheticEndpoint = {
      id: operations[0]?.id ?? 'sdk-example',
      method: 'GET' as const,
      path: '',
      tags: [],
      title: title ?? 'SDK example',
      parameters: [],
      responses: { '200': { description: 'OK' } },
    };

    return (
      <CodeExamples
        endpoint={syntheticEndpoint}
        show="request"
        title={title}
        sdkExamples={sdkExamples}
        langs={visibleSdkLangs}
        defaultLang={sdkDefaultLang}
        className="my-4"
      />
    );
  }

  // Multi-language mode: render CodeExamples with dropdown
  if (!operationId) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        operationId is required in multi-language mode
      </div>
    );
  }

  const endpoint = await getEndpointByOperation(operationId);
  const baseUrl = await getBaseUrl();

  if (!endpoint) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        Endpoint not found: {operationId}
      </div>
    );
  }

  const finalEndpoint = await guideEndpoint(endpoint, params, example);
  if (!finalEndpoint) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        Request example not found: {example} ({operationId})
      </div>
    );
  }

  // With `example` every tab shows that request, the SDK ones included.
  const sdkEx = getSdkExamples(operationId, example);
  if (example) {
    const sdkLangs = ['typescript', 'python', 'go', 'kotlin', 'swift', 'csharp'];
    const missing = sdkLangs.filter((l) => (!langs || langs.some((v) => v === l)) && !sdkEx[l]);
    if (missing.length > 0) {
      return <SdkExampleMissing example={example} operationId={operationId} missing={missing} />;
    }
  }

  return (
    <CodeExamples
      endpoint={finalEndpoint}
      baseUrl={baseUrl}
      show={show}
      title={title}
      responseMode={responseMode}
      sdkExamples={sdkEx}
      langs={langs}
      defaultLang={defaultLang}
      className="my-4"
    />
  );
}

// ============================================
// ModelSchema - displays schema properties table by model name
// ============================================

interface ModelSchemaProps {
  /** Name of the schema in OpenAPI spec */
  name: string;
}

export async function ModelSchema({ name }: ModelSchemaProps) {
  const schema = await getSchemaByName(name);

  if (!schema) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        Schema not found: {name}
      </div>
    );
  }

  const api = await parseOpenAPI();
  const resolved = processSchema(schema, api.endpoints);

  return <SchemaTable schema={resolved} />;
}

// ============================================
// ScopeRoles - displays OAuth scopes with role tabs
// ============================================

export async function ScopeRoles() {
  const schema = await getSchemaByName('OAuthScope');

  if (!schema) {
    return (
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-xl text-red-700">
        Schema not found: OAuthScope
      </div>
    );
  }

  return <ScopeRolesTable schema={schema} />;
}

// Update manually when a new product release goes out
const LATEST_PRODUCT_UPDATE = {
  date: '28 октября 2026',
  title: 'MCP-сервер Пачки 🔌',
};

export function ProductUpdatesLink() {
  return (
    <a
      href="https://pachca.com/updates"
      target="_blank"
      rel="noopener noreferrer"
      className="group not-prose mb-10 flex flex-col rounded-xl border border-glass-border bg-glass backdrop-blur-md no-underline! transition-colors duration-200 hover:bg-glass-hover hover:border-glass-heavy-border"
    >
      <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-[21px] shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
            <Zap className="h-3 w-3 fill-white stroke-none" />
            new
          </span>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[13px] text-text-secondary font-medium">
              {LATEST_PRODUCT_UPDATE.date}
            </span>
            <span className="hidden sm:inline text-text-tertiary text-[14px]">·</span>
            <span className="hidden sm:inline truncate text-[14px] font-medium text-text-primary">
              {LATEST_PRODUCT_UPDATE.title}
            </span>
          </div>
        </div>
        <span className="sm:hidden mt-1 text-[14px] font-medium text-text-primary">
          {LATEST_PRODUCT_UPDATE.title}
        </span>
        <span className="ml-auto hidden  text-text-secondary font-normal shrink-0 items-center gap-0.5 text-[13px] transition-colors group-hover:text-text-primary lg:flex">
          Обновления продукта
          <ArrowUpRight className="h-3.5 w-3.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="lg:hidden">
        <div className="mx-4 border-t border-glass-divider" />
        <div className="flex items-center  text-text-secondary font-normal gap-0.5 px-4 py-2.5 text-[13px]">
          Обновления продукта
          <ArrowUpRight className="h-3.5 w-3.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </a>
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
  CardRow,
  Card,
  ParamsTable,
  GuideCards,
  ApiCards,
  Mermaid,
  Tree,
  TreeFolder,
  TreeFile,
  ImageCard,
  ApiCodeExample,
  ModelSchema,
  ScopeRoles,
  Tabs,
  Tab,
  WebhookPlayground,
  MessagePlayground,
  FormPlayground,
  CliCommands,
  McpTools,
  GlobalFlags,
  SdkCommands,
  NpmBadge,
  PackageBadge,
  HomeHero,
  HomeHeroContent,
  HomeHeroCode,
  ApiClientPanel,
  ApiIntroNotes,
  ProductUpdatesLink,
};
