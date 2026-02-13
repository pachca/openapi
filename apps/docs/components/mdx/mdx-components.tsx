import { getSchemaByName } from '@/lib/openapi/parser';
import { WebhookSchemaSection } from '@/components/api/webhook-schema-section';
import { ResponseCodesList } from '@/components/api/response-codes-list';
import { LimitCard } from '@/components/api/limit-card';
import { UpdatesList } from '@/components/api/updates-list';
import { Callout } from '@/components/api/callout';
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
 * <Image src="/images/example.png" alt="Описание" />
 * <Image src="/images/example.png" alt="Описание" maxWidth={500} />
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
      <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-lg text-red-700">
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
// MarkdownTable - renders a simple table for forms page
// ============================================

export function MarkdownSyntaxTable() {
  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">
        <thead>
          <tr className="border-b border-background-border">
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Элемент
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Синтаксис
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Результат
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-background-border/40">
          <tr>
            <td className="py-5 pl-0! text-text-primary w-[20%]">Жирный</td>
            <td className="py-5 pl-0! w-[45%]">
              <code>**это жирный текст**</code> или <code>__это жирный текст__</code>
            </td>
            <td className="py-5 pl-0! text-text-primary font-bold">это жирный текст</td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Курсив</td>
            <td className="py-5 pl-0!">
              <code>*это курсивный текст*</code> или <code>_это курсивный текст_</code>
            </td>
            <td className="py-5 pl-0! text-text-primary italic">это курсивный текст</td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Ссылки</td>
            <td className="py-5 pl-0!">
              <code>[текст ссылки](https://www.google.com)</code>
            </td>
            <td className="py-5 pl-0! underline text-primary">текст ссылки</td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Маркированный список</td>
            <td className="py-5 pl-0!">
              <code>- первый пункт</code>
              <br />
              <code>- второй пункт</code>
            </td>
            <td className="py-5 pl-0!">
              • первый пункт
              <br />• второй пункт
            </td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Нумерованный список</td>
            <td className="py-5 pl-0!">
              <code>1. первый пункт</code>
              <br />
              <code>2. второй пункт</code>
            </td>
            <td className="py-5 pl-0!">
              1. первый пункт
              <br />
              2. второй пункт
            </td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Зачеркнутый</td>
            <td className="py-5 pl-0!">
              <code>~~это зачеркнутый текст~~</code>
            </td>
            <td className="py-5 pl-0! text-text-primary line-through">это зачеркнутый текст</td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Строчный код</td>
            <td className="py-5 pl-0!">
              <code>`код в тексте`</code>
            </td>
            <td className="py-5 pl-0!">
              <code>код в тексте</code>
            </td>
          </tr>
          <tr>
            <td className="py-5 pl-0! text-text-primary">Блок кода</td>
            <td className="py-5 pl-0!">
              <code>
                ```
                <br />
                Блок кода
                <br />
                ```
              </code>
            </td>
            <td className="py-5 pl-0! bg-background-secondary p-2 rounded font-mono text-sm">
              Блок кода
            </td>
          </tr>
        </tbody>
      </table>
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
// Image - displays image with border
// ============================================

interface ImageProps {
  src: string;
  alt: string;
  maxWidth?: number;
}

export function Image({ src, alt, maxWidth }: ImageProps) {
  return (
    <div
      className="my-8 rounded-lg overflow-hidden border border-background-border mx-auto"
      style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- using standard img for MDX content with external URLs */}
      <img src={src} alt={alt} className="w-full h-auto" />
    </div>
  );
}

// ============================================
// Warning/Info Callouts for explicit use
// ============================================

export function Warning({ children }: { children: React.ReactNode }) {
  return <Callout type="warning">{children}</Callout>;
}

export function Info({ children }: { children: React.ReactNode }) {
  return <Callout type="info">{children}</Callout>;
}

export function Tip({ children }: { children: React.ReactNode }) {
  return <Callout type="tip">{children}</Callout>;
}

export function Danger({ children }: { children: React.ReactNode }) {
  return <Callout type="danger">{children}</Callout>;
}

export function Note({ children }: { children: React.ReactNode }) {
  return <Callout type="note">{children}</Callout>;
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
  children: React.ReactNode;
}

export async function CodeBlock({ language = 'text', title, children }: CodeBlockProps) {
  const { GuideCodeBlock } = await import('@/components/api/guide-code-block');
  const code = String(children).replace(/\n$/, '');
  const mappedLanguage = language === 'bash' || language === 'shell' ? 'curl' : language;
  return <GuideCodeBlock language={mappedLanguage} code={code} title={title} />;
}

export const customMdxComponents = {
  SchemaBlock,
  HttpCodes,
  ErrorSchema,
  MarkdownSyntaxTable,
  CodeBlock,
  Limit,
  Updates: UpdatesList,
  Image,
  Warning,
  Info,
  Tip,
  Danger,
  Note,
  Callout,
};
