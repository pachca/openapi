/** snake_case → camelCase: "first_name" → "firstName", "user_2fa" → "user2fa" */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** snake_case → PascalCase: "first_name" → "FirstName" */
export function snakeToPascal(str: string): string {
  const camel = snakeToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** snake_case → UPPER_SNAKE_CASE: "is_member" → "IS_MEMBER", "chats:read" → "CHATS_READ" */
export function snakeToUpperSnake(str: string): string {
  return str.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
}

/** camelCase → snake_case: "firstName" → "first_name", "getHTTPClient" → "get_http_client" */
export function camelToSnake(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')  // HTTPClient → HTTP_Client
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')       // getHTTP → get_HTTP
    .toLowerCase();
}

/** kebab-case → camelCase: "x-amz-date" → "xAmzDate", "Content-Disposition" → "contentDisposition" */
export function kebabToCamel(str: string): string {
  const result = str.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
  return result.charAt(0).toLowerCase() + result.slice(1);
}

/** Extract schema name from $ref: "#/components/schemas/Chat" → "Chat" */
export function refName(ref: string): string {
  return ref.split('/').pop()!;
}

/** Tag name → service property name: "Chats" → "chats", "Link Previews" → "linkPreviews" */
export function tagToProperty(tag: string): string {
  const words = tag.split(/\s+/);
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

/** Tag name → service class name: "Chats" → "ChatsService", "Link Previews" → "LinkPreviewsService" */
export function tagToServiceName(tag: string): string {
  const words = tag.split(/\s+/);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Service';
}

/** "ChatOperations_listChats" → "listChats" */
export function operationIdToMethod(operationId: string): string {
  const parts = operationId.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : parts[0];
}
