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
import { AgentSkillsWorkflows } from '@/components/mdx/agent-skills-workflows';
import { CliCommands } from '@/components/mdx/cli-commands';
import { GlobalFlags } from '@/components/mdx/global-flags';
import { SdkCommands } from '@/components/mdx/sdk-commands';
import { NpmBadge } from '@/components/mdx/npm-badge';
import { PackageBadge } from '@/components/mdx/package-badge';
import { HomeHero, HomeHeroContent, HomeHeroCode } from '@/components/mdx/home-hero';
import { Tabs, Tab } from '@/components/mdx/tabs';
import { WebhookPlayground } from '@/components/mdx/webhook-playground';
import { MessagePlayground } from '@/components/mdx/message-playground';
import { FormPlayground } from '@/components/mdx/form-playground';
import { ScopeRolesTable } from '@/components/api/scope-roles-table';
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
        <WebhookSchemaSection
          schema={apiError}
          title="ApiError (400, 402, 403, 404, 409, 410, 422)"
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
 * Multi-language mode (dropdown + header):
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" />
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="Custom title" />
 * <ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="With filters" params={{ event_key: "user_login", limit: 50 }} />
 * <ApiCodeExample operationId="MessageOperations_createMessage" responseMode="minimal" />
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
 * params — override query parameter values; only specified + required params are included (curl/cli only)
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
  responseMode?: 'full' | 'minimal';
  lang?: 'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp' | 'curl' | 'cli';
  langs?: Array<'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp' | 'curl' | 'cli'>;
  defaultLang?: 'typescript' | 'python' | 'go' | 'kotlin' | 'swift' | 'csharp' | 'curl' | 'cli';
  operations?: Array<{ id: string; comment?: string }>;
  showInit?: boolean;
}

export async function ApiCodeExample({
  operationId,
  title,
  show = 'request',
  params,
  responseMode,
  lang,
  langs,
  defaultLang,
  operations,
  showInit = true,
}: ApiCodeExampleProps) {
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
      const { generateCurl } = await import('@/lib/code-generators/curl');
      const { generateCLI } = await import('@/lib/code-generators/cli');
      const baseUrl = await getBaseUrl();
      const code =
        lang === 'curl' ? generateCurl(finalEndpoint, baseUrl) : generateCLI(finalEndpoint);
      return <GuideCodeBlock language="bash" code={code} />;
    }

    // SDK languages: load from examples.json
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

  const sdkEx = getSdkExamples(operationId);

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
  date: '18 мая 2026',
  title: 'Новое окно прочитавших и поставивших реакцию',
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
  AgentSkillsWorkflows,
  CliCommands,
  GlobalFlags,
  SdkCommands,
  NpmBadge,
  PackageBadge,
  HomeHero,
  HomeHeroContent,
  HomeHeroCode,
  ProductUpdatesLink,
};
