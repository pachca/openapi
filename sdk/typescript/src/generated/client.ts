import {
  GetAuditEventsParams,
  GetAuditEventsResponse,
  AuditEvent,
  OAuthError,
  ApiError,
  ListBotsParams,
  ListBotsResponse,
  BotResponse,
  BotScopeCatalog,
  ListBotTokensParams,
  ListBotTokensResponse,
  BotAccessToken,
  ListCompanyBotsParams,
  ListCompanyBotsResponse,
  CompanyBotResponse,
  GetWebhookEventsParams,
  GetWebhookEventsResponse,
  WebhookEvent,
  WebhookPayloadUnion,
  WebhookEventsStream,
  BotSelfTokenResponse,
  BotCreateRequest,
  BotCreateResponse,
  BotTokenCreateRequest,
  BotWebhookSelfUpdateRequest,
  BotSelfResponse,
  BotUpdateRequest,
  AvatarData,
  BotTokenUpdateRequest,
  ListChatsParams,
  ListChatsResponse,
  Chat,
  ListCompanyChatsParams,
  ListCompanyChatsResponse,
  ChatCreateRequest,
  CreateChatResponse,
  ExportRequest,
  ChatExport,
  ChatUpdateRequest,
  MarkChatUnreadRequest,
  ListMembersParams,
  ListMembersResponse,
  User,
  AddMembersRequest,
  ChatMemberRole,
  ListPropertiesParams,
  ListPropertiesResponse,
  DownloadFileParams,
  FileUploadRequest,
  UploadParams,
  ListDraftsParams,
  ListDraftsResponse,
  Draft,
  DraftCreateRequest,
  DraftUpdateRequest,
  ListTagsParams,
  ListTagsResponse,
  GroupTag,
  GetTagUsersParams,
  GetTagUsersResponse,
  GroupTagRequest,
  ListImportantMessagesParams,
  ListImportantMessagesResponse,
  Message,
  ListChatMessagesParams,
  ListChatMessagesResponse,
  MessageCreateRequest,
  LinkPreviewsRequest,
  MessageUpdateRequest,
  ListReactionsParams,
  ListReactionsResponse,
  Reaction,
  ReactionRequest,
  RemoveReactionParams,
  ListReadMembersParams,
  ListThreadsParams,
  ListThreadsResponse,
  Thread,
  AccessTokenInfo,
  OAuthRevokeRequest,
  OAuthTokenRequest,
  OAuthToken,
  UserStatus,
  StatusUpdateRequest,
  SearchChatsParams,
  SearchChatsResponse,
  SearchMessagesParams,
  SearchMessagesResponse,
  SearchUsersParams,
  SearchUsersResponse,
  ListTasksParams,
  ListTasksResponse,
  Task,
  TaskCreateRequest,
  TaskUpdateRequest,
  ListUsersParams,
  ListUsersResponse,
  UserCreateRequest,
  UserUpdateRequest,
  SubmitViewResponseRequest,
  SubmitViewResponseResult,
  OpenViewRequest,
} from "./types.js";
import { deserialize, deserializeType, serializeType, fetchWithRetry, toFormBody } from "./utils.js";

export interface PollWebhookEventsParams {
  limit?: number;
  intervalMs?: number;
  createdAfter?: Date | string | null;
  maxSeenDeliveryIds?: number;
}

export interface PollWebhookPayloadsParams<TPayload extends WebhookPayloadUnion = WebhookPayloadUnion> extends PollWebhookEventsParams {
  filter?: (payload: WebhookPayloadUnion, event: WebhookEvent) => payload is TPayload;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function createdAtMatches(event: WebhookEvent, createdAfter: Date | string | null | undefined): boolean {
  if (createdAfter == null) return true;
  return new Date(event.createdAt).getTime() >= new Date(createdAfter).getTime();
}

/** The body of an error answer, or undefined when it is empty or not JSON (a 404 without a body, a proxy page). */
async function errorBody(response: Response): Promise<any> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return undefined;
  }
}

/**
 * An error body is either `{ errors: [...] }` or the OAuth form `{ error, error_description }`,
 * which also comes with 400 and 403 (`insufficient_scope`, `invalid_grant`). The body decides the class.
 * An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in `status`.
 */
async function errorFromResponse(response: Response): Promise<Error> {
  const body = await errorBody(response);
  if (body && typeof body.error === "string" && body.errors === undefined) return new OAuthError(body.error);
  return new ApiError(Array.isArray(body?.errors) ? body.errors : [], response.status);
}

export const PACHCA_AUTHORIZE_URL = "https://app.pachca.com/apps/authorize";

export interface AuthorizeUrlParams {
  /** Client ID of the bot */
  clientId: string;
  /** One of the bot's redirect addresses, matched exactly */
  redirectUri: string;
  /** A random value you keep to recognise the return; each one is valid once */
  state: string;
  /** `codeChallenge` of a pair from `createPkce()` */
  codeChallenge: string;
  /** The authorization page of another installation */
  authorizeUrl?: string;
}

/** The authorization link for a message button: the consent screen with PKCE (S256). */
export function buildAuthorizeUrl(params: AuthorizeUrlParams): string {
  const url = new URL(params.authorizeUrl ?? PACHCA_AUTHORIZE_URL);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export interface Pkce {
  /** Keep it until the code exchange */
  codeVerifier: string;
  /** Goes into the authorization link */
  codeChallenge: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A PKCE pair: a random `codeVerifier` and its SHA-256 `codeChallenge`. */
export async function createPkce(): Promise<Pkce> {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) throw new Error("createPkce needs the Web Crypto API: Node.js 20+ or a browser");
  const codeVerifier = base64Url(webCrypto.getRandomValues(new Uint8Array(32)));
  const digest = await webCrypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return { codeVerifier, codeChallenge: base64Url(new Uint8Array(digest)) };
}

export class SecurityService {
  async getAuditEvents(params?: GetAuditEventsParams): Promise<GetAuditEventsResponse> {
    throw new Error("Security.getAuditEvents is not implemented");
  }

  async getAuditEventsAll(params?: Omit<GetAuditEventsParams, 'cursor'>): Promise<AuditEvent[]> {
    throw new Error("Security.getAuditEventsAll is not implemented");
  }
}

export class SecurityServiceImpl extends SecurityService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getAuditEvents(params?: GetAuditEventsParams): Promise<GetAuditEventsResponse> {
    const query = new URLSearchParams();
    if (params?.startTime !== undefined) query.set("start_time", params.startTime);
    if (params?.endTime !== undefined) query.set("end_time", params.endTime);
    if (params?.eventKey !== undefined) query.set("event_key", params.eventKey);
    if (params?.actorId !== undefined) query.set("actor_id", params.actorId);
    if (params?.actorType !== undefined) query.set("actor_type", params.actorType);
    if (params?.entityId !== undefined) query.set("entity_id", params.entityId);
    if (params?.entityType !== undefined) query.set("entity_type", params.entityType);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/audit_events${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as GetAuditEventsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getAuditEventsAll(params?: Omit<GetAuditEventsParams, 'cursor'>): Promise<AuditEvent[]> {
    const items: AuditEvent[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.getAuditEvents({ ...params, cursor } as GetAuditEventsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }
}

export class BotsService {
  async listBots(params?: ListBotsParams): Promise<ListBotsResponse> {
    throw new Error("Bots.listBots is not implemented");
  }

  async listBotsAll(params?: Omit<ListBotsParams, 'cursor'>): Promise<BotResponse[]> {
    throw new Error("Bots.listBotsAll is not implemented");
  }

  async getBot(id: number): Promise<BotResponse> {
    throw new Error("Bots.getBot is not implemented");
  }

  async getBotScopes(id: number): Promise<BotScopeCatalog> {
    throw new Error("Bots.getBotScopes is not implemented");
  }

  async listBotTokens(id: number, params?: ListBotTokensParams): Promise<ListBotTokensResponse> {
    throw new Error("Bots.listBotTokens is not implemented");
  }

  async listBotTokensAll(id: number, params?: Omit<ListBotTokensParams, 'cursor'>): Promise<BotAccessToken[]> {
    throw new Error("Bots.listBotTokensAll is not implemented");
  }

  async listCompanyBots(params?: ListCompanyBotsParams): Promise<ListCompanyBotsResponse> {
    throw new Error("Bots.listCompanyBots is not implemented");
  }

  async listCompanyBotsAll(params?: Omit<ListCompanyBotsParams, 'cursor'>): Promise<CompanyBotResponse[]> {
    throw new Error("Bots.listCompanyBotsAll is not implemented");
  }

  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    throw new Error("Bots.getWebhookEvents is not implemented");
  }

  async getWebhookEventsAll(params?: Omit<GetWebhookEventsParams, 'cursor'>): Promise<WebhookEvent[]> {
    throw new Error("Bots.getWebhookEventsAll is not implemented");
  }

  async *pollWebhookEvents(params?: PollWebhookEventsParams): AsyncGenerator<WebhookEvent> {
    const limit = params?.limit ?? 50;
    const intervalMs = params?.intervalMs ?? 5_000;
    const createdAfter = params?.createdAfter ?? new Date();
    const maxSeenDeliveryIds = params?.maxSeenDeliveryIds ?? 5_000;
    if (maxSeenDeliveryIds <= 0) throw new Error("maxSeenDeliveryIds must be greater than 0");

    const seenIdOrder: string[] = [];
    const seenIds = new Set<string>();
    const remember = (id: string): boolean => {
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      seenIdOrder.push(id);
      while (seenIdOrder.length > maxSeenDeliveryIds) {
        const oldest = seenIdOrder.shift();
        if (oldest !== undefined) seenIds.delete(oldest);
      }
      return true;
    };

    while (true) {
      let cursor: string | undefined;
      let hasNext = true;
      while (hasNext) {
        const response = await this.getWebhookEvents({ limit, cursor });
        let pageHasRecentEvents = false;
        for (const event of [...response.data].reverse()) {
          const matchesCreatedAfter = createdAtMatches(event, createdAfter);
          if (matchesCreatedAfter) pageHasRecentEvents = true;
          if (matchesCreatedAfter && remember(event.id)) yield event;
        }
        hasNext = (response.meta.paginate.hasNext ?? response.data.length > 0) && pageHasRecentEvents;
        cursor = response.meta.paginate.nextPage;
      }
      await sleep(intervalMs);
    }
  }

  async *pollWebhookPayloads<TPayload extends WebhookPayloadUnion = WebhookPayloadUnion>(
    params?: PollWebhookPayloadsParams<TPayload>,
  ): AsyncGenerator<TPayload> {
    for await (const event of this.pollWebhookEvents(params)) {
      const payload = event.payload;
      if (params?.filter == null || params.filter(payload, event)) yield payload as TPayload;
    }
  }

  async getWebhookEventsStream(): Promise<WebhookEventsStream> {
    throw new Error("Bots.getWebhookEventsStream is not implemented");
  }

  async selfRecreateBotToken(): Promise<BotSelfTokenResponse> {
    throw new Error("Bots.selfRecreateBotToken is not implemented");
  }

  async createBot(request: BotCreateRequest): Promise<BotCreateResponse> {
    throw new Error("Bots.createBot is not implemented");
  }

  async recreateBotToken(id: number): Promise<BotCreateResponse> {
    throw new Error("Bots.recreateBotToken is not implemented");
  }

  async rotateBotClientSecret(id: number): Promise<BotResponse> {
    throw new Error("Bots.rotateBotClientSecret is not implemented");
  }

  async createBotToken(id: number, request: BotTokenCreateRequest): Promise<BotAccessToken> {
    throw new Error("Bots.createBotToken is not implemented");
  }

  async reissueBotToken(id: number, tokenId: number): Promise<BotAccessToken> {
    throw new Error("Bots.reissueBotToken is not implemented");
  }

  async selfUpdateBotWebhook(request: BotWebhookSelfUpdateRequest): Promise<BotSelfResponse> {
    throw new Error("Bots.selfUpdateBotWebhook is not implemented");
  }

  async updateBot(id: number, request: BotUpdateRequest): Promise<BotResponse> {
    throw new Error("Bots.updateBot is not implemented");
  }

  async updateBotAvatar(id: number, image: Blob): Promise<AvatarData> {
    throw new Error("Bots.updateBotAvatar is not implemented");
  }

  async updateBotToken(id: number, tokenId: number, request: BotTokenUpdateRequest): Promise<BotAccessToken> {
    throw new Error("Bots.updateBotToken is not implemented");
  }

  async deleteBot(id: number): Promise<void> {
    throw new Error("Bots.deleteBot is not implemented");
  }

  async deleteBotAvatar(id: number): Promise<void> {
    throw new Error("Bots.deleteBotAvatar is not implemented");
  }

  async deleteBotToken(id: number, tokenId: number): Promise<void> {
    throw new Error("Bots.deleteBotToken is not implemented");
  }

  async deleteWebhookEvent(id: string): Promise<void> {
    throw new Error("Bots.deleteWebhookEvent is not implemented");
  }
}

export class BotsServiceImpl extends BotsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listBots(params?: ListBotsParams): Promise<ListBotsResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/bots${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListBotsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listBotsAll(params?: Omit<ListBotsParams, 'cursor'>): Promise<BotResponse[]> {
    const items: BotResponse[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listBots({ ...params, cursor } as ListBotsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getBot(id: number): Promise<BotResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotResponse", body.data) as BotResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getBotScopes(id: number): Promise<BotScopeCatalog> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/scopes`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotScopeCatalog", body) as BotScopeCatalog;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listBotTokens(id: number, params?: ListBotTokensParams): Promise<ListBotTokensResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/bots/${id}/tokens${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListBotTokensResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listBotTokensAll(id: number, params?: Omit<ListBotTokensParams, 'cursor'>): Promise<BotAccessToken[]> {
    const items: BotAccessToken[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listBotTokens(id, { ...params, cursor } as ListBotTokensParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async listCompanyBots(params?: ListCompanyBotsParams): Promise<ListCompanyBotsResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/company/bots${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListCompanyBotsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listCompanyBotsAll(params?: Omit<ListCompanyBotsParams, 'cursor'>): Promise<CompanyBotResponse[]> {
    const items: CompanyBotResponse[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listCompanyBots({ ...params, cursor } as ListCompanyBotsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/webhooks/events${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return { ...(deserialize(body) as GetWebhookEventsResponse), data: Array.isArray(body.data) ? body.data.map((item: unknown) => deserializeType("WebhookEvent", item) as WebhookEvent) : [] } as GetWebhookEventsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getWebhookEventsAll(params?: Omit<GetWebhookEventsParams, 'cursor'>): Promise<WebhookEvent[]> {
    const items: WebhookEvent[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.getWebhookEvents({ ...params, cursor } as GetWebhookEventsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getWebhookEventsStream(): Promise<WebhookEventsStream> {
    const response = await fetchWithRetry(`${this.baseUrl}/webhooks/events/stream`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("WebhookEventsStream", body.data) as WebhookEventsStream;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async selfRecreateBotToken(): Promise<BotSelfTokenResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bot/recreate_token`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotSelfTokenResponse", body.data) as BotSelfTokenResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createBot(request: BotCreateRequest): Promise<BotCreateResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("BotCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("BotCreateResponse", body.data) as BotCreateResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async recreateBotToken(id: number): Promise<BotCreateResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/recreate_token`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotCreateResponse", body.data) as BotCreateResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async rotateBotClientSecret(id: number): Promise<BotResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/rotate_client_secret`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotResponse", body.data) as BotResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createBotToken(id: number, request: BotTokenCreateRequest): Promise<BotAccessToken> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/tokens`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("BotTokenCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("BotAccessToken", body.data) as BotAccessToken;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async reissueBotToken(id: number, tokenId: number): Promise<BotAccessToken> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/tokens/${tokenId}/reissue`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotAccessToken", body.data) as BotAccessToken;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async selfUpdateBotWebhook(request: BotWebhookSelfUpdateRequest): Promise<BotSelfResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bot/webhook`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("BotWebhookSelfUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotSelfResponse", body.data) as BotSelfResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateBot(id: number, request: BotUpdateRequest): Promise<BotResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("BotUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotResponse", body.data) as BotResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateBotAvatar(id: number, image: Blob): Promise<AvatarData> {
    const form = new FormData();
    form.set("image", image, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/avatar`, {
      method: "PUT",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("AvatarData", body.data) as AvatarData;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateBotToken(id: number, tokenId: number, request: BotTokenUpdateRequest): Promise<BotAccessToken> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/tokens/${tokenId}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("BotTokenUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("BotAccessToken", body.data) as BotAccessToken;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteBot(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteBotAvatar(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/avatar`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteBotToken(id: number, tokenId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}/tokens/${tokenId}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteWebhookEvent(id: string): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/webhooks/events/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ChatsService {
  async listChats(params?: ListChatsParams): Promise<ListChatsResponse> {
    throw new Error("Chats.listChats is not implemented");
  }

  async listChatsAll(params?: Omit<ListChatsParams, 'cursor'>): Promise<Chat[]> {
    throw new Error("Chats.listChatsAll is not implemented");
  }

  async getChat(id: number): Promise<Chat> {
    throw new Error("Chats.getChat is not implemented");
  }

  async downloadExport(id: number): Promise<string> {
    throw new Error("Chats.downloadExport is not implemented");
  }

  async listCompanyChats(params?: ListCompanyChatsParams): Promise<ListCompanyChatsResponse> {
    throw new Error("Chats.listCompanyChats is not implemented");
  }

  async listCompanyChatsAll(params?: Omit<ListCompanyChatsParams, 'cursor'>): Promise<Chat[]> {
    throw new Error("Chats.listCompanyChatsAll is not implemented");
  }

  async createChat(request: ChatCreateRequest): Promise<CreateChatResponse> {
    throw new Error("Chats.createChat is not implemented");
  }

  async requestExport(request: ExportRequest): Promise<ChatExport> {
    throw new Error("Chats.requestExport is not implemented");
  }

  async updateChat(id: number, request: ChatUpdateRequest): Promise<Chat> {
    throw new Error("Chats.updateChat is not implemented");
  }

  async archiveChat(id: number): Promise<void> {
    throw new Error("Chats.archiveChat is not implemented");
  }

  async updateChatAvatar(id: number, image: Blob): Promise<AvatarData> {
    throw new Error("Chats.updateChatAvatar is not implemented");
  }

  async unarchiveChat(id: number): Promise<void> {
    throw new Error("Chats.unarchiveChat is not implemented");
  }

  async markChatUnread(id: number, request: MarkChatUnreadRequest): Promise<void> {
    throw new Error("Chats.markChatUnread is not implemented");
  }

  async deleteChatAvatar(id: number): Promise<void> {
    throw new Error("Chats.deleteChatAvatar is not implemented");
  }
}

export class ChatsServiceImpl extends ChatsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listChats(params?: ListChatsParams): Promise<ListChatsResponse> {
    const query = new URLSearchParams();
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.availability !== undefined) query.set("availability", params.availability);
    if (params?.archived !== undefined) query.set("archived", String(params.archived));
    if (params?.lastMessageAtAfter !== undefined) query.set("last_message_at_after", params.lastMessageAtAfter);
    if (params?.lastMessageAtBefore !== undefined) query.set("last_message_at_before", params.lastMessageAtBefore);
    if (params?.personal !== undefined) query.set("personal", String(params.personal));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/chats${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListChatsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listChatsAll(params?: Omit<ListChatsParams, 'cursor'>): Promise<Chat[]> {
    const items: Chat[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listChats({ ...params, cursor } as ListChatsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getChat(id: number): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Chat", body.data) as Chat;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async downloadExport(id: number): Promise<string> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/exports/${id}`, {
      headers: this.headers,
      redirect: "manual",
    });
    switch (response.status) {
      case 302: {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("Missing Location header in redirect response");
        }
        return location;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listCompanyChats(params?: ListCompanyChatsParams): Promise<ListCompanyChatsResponse> {
    const query = new URLSearchParams();
    if (params?.activity !== undefined) query.set("activity", params.activity);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/company/chats${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListCompanyChatsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listCompanyChatsAll(params?: Omit<ListCompanyChatsParams, 'cursor'>): Promise<Chat[]> {
    const items: Chat[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listCompanyChats({ ...params, cursor } as ListCompanyChatsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async createChat(request: ChatCreateRequest): Promise<CreateChatResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ChatCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return { ...(deserialize(body) as CreateChatResponse), data: deserializeType("Chat", body.data) as Chat };
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async requestExport(request: ExportRequest): Promise<ChatExport> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/exports`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(serializeType("ExportRequest", request)),
    });
    switch (response.status) {
      case 202: {
        const body = await response.json();
        return deserializeType("ChatExport", body.data) as ChatExport;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateChat(id: number, request: ChatUpdateRequest): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ChatUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Chat", body.data) as Chat;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async archiveChat(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/archive`, {
      method: "PUT",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateChatAvatar(id: number, image: Blob): Promise<AvatarData> {
    const form = new FormData();
    form.set("image", image, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/avatar`, {
      method: "PUT",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("AvatarData", body.data) as AvatarData;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async unarchiveChat(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/unarchive`, {
      method: "PUT",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async markChatUnread(id: number, request: MarkChatUnreadRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/unread`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MarkChatUnreadRequest", request)),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteChatAvatar(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/avatar`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class MembersService {
  async listMembers(id: number, params?: ListMembersParams): Promise<ListMembersResponse> {
    throw new Error("Members.listMembers is not implemented");
  }

  async listMembersAll(id: number, params?: Omit<ListMembersParams, 'cursor'>): Promise<User[]> {
    throw new Error("Members.listMembersAll is not implemented");
  }

  async addTags(id: number, groupTagIds: number[]): Promise<void> {
    throw new Error("Members.addTags is not implemented");
  }

  async addMembers(id: number, request: AddMembersRequest): Promise<void> {
    throw new Error("Members.addMembers is not implemented");
  }

  async updateMemberRole(id: number, userId: number, role: ChatMemberRole): Promise<void> {
    throw new Error("Members.updateMemberRole is not implemented");
  }

  async removeTag(id: number, tagId: number): Promise<void> {
    throw new Error("Members.removeTag is not implemented");
  }

  async leaveChat(id: number): Promise<void> {
    throw new Error("Members.leaveChat is not implemented");
  }

  async removeMember(id: number, userId: number): Promise<void> {
    throw new Error("Members.removeMember is not implemented");
  }
}

export class MembersServiceImpl extends MembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listMembers(id: number, params?: ListMembersParams): Promise<ListMembersResponse> {
    const query = new URLSearchParams();
    if (params?.role !== undefined) query.set("role", params.role);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/chats/${id}/members${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListMembersResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listMembersAll(id: number, params?: Omit<ListMembersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listMembers(id, { ...params, cursor } as ListMembersParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async addTags(id: number, groupTagIds: number[]): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/group_tags`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ group_tag_ids: groupTagIds }),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async addMembers(id: number, request: AddMembersRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("AddMembersRequest", request)),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateMemberRole(id: number, userId: number, role: ChatMemberRole): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members/${userId}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ role: role }),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async removeTag(id: number, tagId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/group_tags/${tagId}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async leaveChat(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/leave`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async removeMember(id: number, userId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members/${userId}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class CustomPropertiesService {
  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    throw new Error("Custom Properties.listProperties is not implemented");
  }
}

export class CustomPropertiesServiceImpl extends CustomPropertiesService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    const query = new URLSearchParams();
    query.set("entity_type", params.entityType);
    const response = await fetchWithRetry(`${this.baseUrl}/custom_properties?${query}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListPropertiesResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class FilesService {
  async downloadFile(id: number, params?: DownloadFileParams): Promise<Blob> {
    throw new Error("Files.downloadFile is not implemented");
  }

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    throw new Error("Files.uploadFile is not implemented");
  }

  async getUploadParams(): Promise<UploadParams> {
    throw new Error("Files.getUploadParams is not implemented");
  }
}

export class FilesServiceImpl extends FilesService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async downloadFile(id: number, params?: DownloadFileParams): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.target !== undefined) query.set("target", params.target);
    const url = `${this.baseUrl}/files/${id}${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200:
        return await response.blob();
      default:
        throw await errorFromResponse(response);
    }
  }

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    const form = new FormData();
    if (request.acl !== undefined) form.set("acl", request.acl);
    if (request.bucket !== undefined) form.set("bucket", request.bucket);
    form.set("Content-Disposition", request.contentDisposition);
    form.set("policy", request.policy);
    form.set("x-amz-credential", request.xAmzCredential);
    form.set("x-amz-algorithm", request.xAmzAlgorithm);
    form.set("x-amz-date", request.xAmzDate);
    form.set("x-amz-signature", request.xAmzSignature);
    form.set("key", request.key);
    form.set("file", request.file, "upload");
    const response = await fetchWithRetry(directUrl, {
      method: "POST",
      body: form,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async getUploadParams(): Promise<UploadParams> {
    const response = await fetchWithRetry(`${this.baseUrl}/uploads`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("UploadParams", body) as UploadParams;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class DraftsService {
  async listDrafts(params?: ListDraftsParams): Promise<ListDraftsResponse> {
    throw new Error("Drafts.listDrafts is not implemented");
  }

  async listDraftsAll(params?: Omit<ListDraftsParams, 'cursor'>): Promise<Draft[]> {
    throw new Error("Drafts.listDraftsAll is not implemented");
  }

  async getDraft(id: number): Promise<Draft> {
    throw new Error("Drafts.getDraft is not implemented");
  }

  async createDraft(request: DraftCreateRequest): Promise<Draft> {
    throw new Error("Drafts.createDraft is not implemented");
  }

  async updateDraft(id: number, request: DraftUpdateRequest): Promise<Draft> {
    throw new Error("Drafts.updateDraft is not implemented");
  }

  async deleteDraft(id: number): Promise<void> {
    throw new Error("Drafts.deleteDraft is not implemented");
  }
}

export class DraftsServiceImpl extends DraftsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listDrafts(params?: ListDraftsParams): Promise<ListDraftsResponse> {
    const query = new URLSearchParams();
    if (params?.type !== undefined) query.set("type", params.type);
    if (params?.entityType !== undefined) query.set("entity_type", params.entityType);
    if (params?.entityId !== undefined) query.set("entity_id", String(params.entityId));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/drafts${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListDraftsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listDraftsAll(params?: Omit<ListDraftsParams, 'cursor'>): Promise<Draft[]> {
    const items: Draft[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listDrafts({ ...params, cursor } as ListDraftsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getDraft(id: number): Promise<Draft> {
    const response = await fetchWithRetry(`${this.baseUrl}/drafts/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Draft", body.data) as Draft;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createDraft(request: DraftCreateRequest): Promise<Draft> {
    const response = await fetchWithRetry(`${this.baseUrl}/drafts`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("DraftCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Draft", body.data) as Draft;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateDraft(id: number, request: DraftUpdateRequest): Promise<Draft> {
    const response = await fetchWithRetry(`${this.baseUrl}/drafts/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("DraftUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Draft", body.data) as Draft;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteDraft(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/drafts/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class GroupTagsService {
  async listTags(params?: ListTagsParams): Promise<ListTagsResponse> {
    throw new Error("Group tags.listTags is not implemented");
  }

  async listTagsAll(params?: Omit<ListTagsParams, 'cursor'>): Promise<GroupTag[]> {
    throw new Error("Group tags.listTagsAll is not implemented");
  }

  async getTag(id: number): Promise<GroupTag> {
    throw new Error("Group tags.getTag is not implemented");
  }

  async getTagUsers(id: number, params?: GetTagUsersParams): Promise<GetTagUsersResponse> {
    throw new Error("Group tags.getTagUsers is not implemented");
  }

  async getTagUsersAll(id: number, params?: Omit<GetTagUsersParams, 'cursor'>): Promise<User[]> {
    throw new Error("Group tags.getTagUsersAll is not implemented");
  }

  async createTag(request: GroupTagRequest): Promise<GroupTag> {
    throw new Error("Group tags.createTag is not implemented");
  }

  async updateTag(id: number, request: GroupTagRequest): Promise<GroupTag> {
    throw new Error("Group tags.updateTag is not implemented");
  }

  async deleteTag(id: number): Promise<void> {
    throw new Error("Group tags.deleteTag is not implemented");
  }
}

export class GroupTagsServiceImpl extends GroupTagsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listTags(params?: ListTagsParams): Promise<ListTagsResponse> {
    const query = new URLSearchParams();
    if (params?.names !== undefined) {
      params.names.forEach((v) => query.append("names[]", String(v)));
    }
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/group_tags${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListTagsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listTagsAll(params?: Omit<ListTagsParams, 'cursor'>): Promise<GroupTag[]> {
    const items: GroupTag[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listTags({ ...params, cursor } as ListTagsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getTag(id: number): Promise<GroupTag> {
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("GroupTag", body.data) as GroupTag;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getTagUsers(id: number, params?: GetTagUsersParams): Promise<GetTagUsersResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/group_tags/${id}/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as GetTagUsersResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getTagUsersAll(id: number, params?: Omit<GetTagUsersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.getTagUsers(id, { ...params, cursor } as GetTagUsersParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async createTag(request: GroupTagRequest): Promise<GroupTag> {
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("GroupTagRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("GroupTag", body.data) as GroupTag;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateTag(id: number, request: GroupTagRequest): Promise<GroupTag> {
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("GroupTagRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("GroupTag", body.data) as GroupTag;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteTag(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ImportantMessagesService {
  async listImportantMessages(params?: ListImportantMessagesParams): Promise<ListImportantMessagesResponse> {
    throw new Error("Important messages.listImportantMessages is not implemented");
  }

  async listImportantMessagesAll(params?: Omit<ListImportantMessagesParams, 'cursor'>): Promise<Message[]> {
    throw new Error("Important messages.listImportantMessagesAll is not implemented");
  }

  async addMessageToImportant(messageId: number): Promise<void> {
    throw new Error("Important messages.addMessageToImportant is not implemented");
  }

  async removeMessageFromImportant(id: number): Promise<void> {
    throw new Error("Important messages.removeMessageFromImportant is not implemented");
  }
}

export class ImportantMessagesServiceImpl extends ImportantMessagesService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listImportantMessages(params?: ListImportantMessagesParams): Promise<ListImportantMessagesResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/important_messages${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListImportantMessagesResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listImportantMessagesAll(params?: Omit<ListImportantMessagesParams, 'cursor'>): Promise<Message[]> {
    const items: Message[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listImportantMessages({ ...params, cursor } as ListImportantMessagesParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async addMessageToImportant(messageId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/important_messages`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId }),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async removeMessageFromImportant(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/important_messages/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class MessagesService {
  async listChatMessages(params: ListChatMessagesParams): Promise<ListChatMessagesResponse> {
    throw new Error("Messages.listChatMessages is not implemented");
  }

  async listChatMessagesAll(params: Omit<ListChatMessagesParams, 'cursor'>): Promise<Message[]> {
    throw new Error("Messages.listChatMessagesAll is not implemented");
  }

  async getMessage(id: number): Promise<Message> {
    throw new Error("Messages.getMessage is not implemented");
  }

  async createMessage(request: MessageCreateRequest): Promise<Message> {
    throw new Error("Messages.createMessage is not implemented");
  }

  async unfurl(id: number, request: LinkPreviewsRequest): Promise<void> {
    throw new Error("Messages.unfurl is not implemented");
  }

  async pinMessage(id: number): Promise<void> {
    throw new Error("Messages.pinMessage is not implemented");
  }

  async updateMessage(id: number, request: MessageUpdateRequest): Promise<Message> {
    throw new Error("Messages.updateMessage is not implemented");
  }

  async deleteMessage(id: number): Promise<void> {
    throw new Error("Messages.deleteMessage is not implemented");
  }

  async unpinMessage(id: number): Promise<void> {
    throw new Error("Messages.unpinMessage is not implemented");
  }
}

export class MessagesServiceImpl extends MessagesService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listChatMessages(params: ListChatMessagesParams): Promise<ListChatMessagesResponse> {
    const query = new URLSearchParams();
    query.set("chat_id", String(params.chatId));
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const response = await fetchWithRetry(`${this.baseUrl}/messages?${query}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListChatMessagesResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listChatMessagesAll(params: Omit<ListChatMessagesParams, 'cursor'>): Promise<Message[]> {
    const items: Message[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listChatMessages({ ...params, cursor } as ListChatMessagesParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getMessage(id: number): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Message", body.data) as Message;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createMessage(request: MessageCreateRequest): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MessageCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Message", body.data) as Message;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async unfurl(id: number, request: LinkPreviewsRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/link_previews`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("LinkPreviewsRequest", request)),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async pinMessage(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/pin`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateMessage(id: number, request: MessageUpdateRequest): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MessageUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Message", body.data) as Message;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteMessage(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async unpinMessage(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/pin`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ReactionsService {
  async listReactions(id: number, params?: ListReactionsParams): Promise<ListReactionsResponse> {
    throw new Error("Reactions.listReactions is not implemented");
  }

  async listReactionsAll(id: number, params?: Omit<ListReactionsParams, 'cursor'>): Promise<Reaction[]> {
    throw new Error("Reactions.listReactionsAll is not implemented");
  }

  async addReaction(id: number, request: ReactionRequest): Promise<Reaction> {
    throw new Error("Reactions.addReaction is not implemented");
  }

  async removeReaction(id: number, params: RemoveReactionParams): Promise<void> {
    throw new Error("Reactions.removeReaction is not implemented");
  }
}

export class ReactionsServiceImpl extends ReactionsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listReactions(id: number, params?: ListReactionsParams): Promise<ListReactionsResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/messages/${id}/reactions${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListReactionsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listReactionsAll(id: number, params?: Omit<ListReactionsParams, 'cursor'>): Promise<Reaction[]> {
    const items: Reaction[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listReactions(id, { ...params, cursor } as ListReactionsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async addReaction(id: number, request: ReactionRequest): Promise<Reaction> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/reactions`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ReactionRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Reaction", body) as Reaction;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async removeReaction(id: number, params: RemoveReactionParams): Promise<void> {
    const query = new URLSearchParams();
    query.set("code", params.code);
    if (params?.name !== undefined) query.set("name", params.name);
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/reactions?${query}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ReadMembersService {
  async listReadMembers(id: number, params?: ListReadMembersParams): Promise<unknown> {
    throw new Error("Read members.listReadMembers is not implemented");
  }
}

export class ReadMembersServiceImpl extends ReadMembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listReadMembers(id: number, params?: ListReadMembersParams): Promise<unknown> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/messages/${id}/read_member_ids${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as unknown;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ThreadsService {
  async listThreads(params?: ListThreadsParams): Promise<ListThreadsResponse> {
    throw new Error("Threads.listThreads is not implemented");
  }

  async listThreadsAll(params?: Omit<ListThreadsParams, 'cursor'>): Promise<Thread[]> {
    throw new Error("Threads.listThreadsAll is not implemented");
  }

  async getThread(id: number): Promise<Thread> {
    throw new Error("Threads.getThread is not implemented");
  }

  async createThread(id: number): Promise<Thread> {
    throw new Error("Threads.createThread is not implemented");
  }

  async createStandaloneThread(): Promise<Thread> {
    throw new Error("Threads.createStandaloneThread is not implemented");
  }
}

export class ThreadsServiceImpl extends ThreadsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listThreads(params?: ListThreadsParams): Promise<ListThreadsResponse> {
    const query = new URLSearchParams();
    if (params?.lastMessageAtAfter !== undefined) query.set("last_message_at_after", params.lastMessageAtAfter);
    if (params?.lastMessageAtBefore !== undefined) query.set("last_message_at_before", params.lastMessageAtBefore);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/threads${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListThreadsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listThreadsAll(params?: Omit<ListThreadsParams, 'cursor'>): Promise<Thread[]> {
    const items: Thread[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listThreads({ ...params, cursor } as ListThreadsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getThread(id: number): Promise<Thread> {
    const response = await fetchWithRetry(`${this.baseUrl}/threads/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Thread", body.data) as Thread;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createThread(id: number): Promise<Thread> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/thread`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Thread", body.data) as Thread;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createStandaloneThread(): Promise<Thread> {
    const response = await fetchWithRetry(`${this.baseUrl}/threads`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Thread", body.data) as Thread;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class OAuthService {
  async getTokenInfo(): Promise<AccessTokenInfo> {
    throw new Error("OAuth.getTokenInfo is not implemented");
  }

  async revokeToken(request: OAuthRevokeRequest): Promise<void> {
    throw new Error("OAuth.revokeToken is not implemented");
  }

  async exchangeToken(request: OAuthTokenRequest): Promise<OAuthToken> {
    throw new Error("OAuth.exchangeToken is not implemented");
  }
}

export class OAuthServiceImpl extends OAuthService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getTokenInfo(): Promise<AccessTokenInfo> {
    const response = await fetchWithRetry(`${this.baseUrl}/oauth/token/info`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("AccessTokenInfo", body.data) as AccessTokenInfo;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async revokeToken(request: OAuthRevokeRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/oauth/revoke`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/x-www-form-urlencoded" },
      body: toFormBody(serializeType("OAuthRevokeRequest", request) as Record<string, unknown>),
    });
    switch (response.status) {
      case 200:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async exchangeToken(request: OAuthTokenRequest): Promise<OAuthToken> {
    const response = await fetchWithRetry(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toFormBody(serializeType("OAuthTokenRequest", request) as Record<string, unknown>),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("OAuthToken", body) as OAuthToken;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ProfileService {
  async getProfile(): Promise<User> {
    throw new Error("Profile.getProfile is not implemented");
  }

  async getStatus(): Promise<UserStatus> {
    throw new Error("Profile.getStatus is not implemented");
  }

  async updateProfileAvatar(image: Blob): Promise<AvatarData> {
    throw new Error("Profile.updateProfileAvatar is not implemented");
  }

  async updateStatus(request: StatusUpdateRequest): Promise<UserStatus> {
    throw new Error("Profile.updateStatus is not implemented");
  }

  async deleteProfileAvatar(): Promise<void> {
    throw new Error("Profile.deleteProfileAvatar is not implemented");
  }

  async deleteStatus(): Promise<void> {
    throw new Error("Profile.deleteStatus is not implemented");
  }

  async getTokenInfo(): Promise<AccessTokenInfo> {
    throw new Error("Profile.getTokenInfo is not implemented");
  }
}

export class ProfileServiceImpl extends ProfileService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getProfile(): Promise<User> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("User", body.data) as User;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getStatus(): Promise<UserStatus> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/status`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("UserStatus", body.data) as UserStatus;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateProfileAvatar(image: Blob): Promise<AvatarData> {
    const form = new FormData();
    form.set("image", image, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/profile/avatar`, {
      method: "PUT",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("AvatarData", body.data) as AvatarData;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateStatus(request: StatusUpdateRequest): Promise<UserStatus> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/status`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("StatusUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("UserStatus", body.data) as UserStatus;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteProfileAvatar(): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/avatar`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteStatus(): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/status`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async getTokenInfo(): Promise<AccessTokenInfo> {
    const response = await fetchWithRetry(`${this.baseUrl}/oauth/token/info`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("AccessTokenInfo", body.data) as AccessTokenInfo;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class SearchService {
  async searchChats(params?: SearchChatsParams): Promise<SearchChatsResponse> {
    throw new Error("Search.searchChats is not implemented");
  }

  async searchChatsAll(params?: Omit<SearchChatsParams, 'cursor'>): Promise<Chat[]> {
    throw new Error("Search.searchChatsAll is not implemented");
  }

  async searchMessages(params?: SearchMessagesParams): Promise<SearchMessagesResponse> {
    throw new Error("Search.searchMessages is not implemented");
  }

  async searchMessagesAll(params?: Omit<SearchMessagesParams, 'cursor'>): Promise<Message[]> {
    throw new Error("Search.searchMessagesAll is not implemented");
  }

  async searchUsers(params?: SearchUsersParams): Promise<SearchUsersResponse> {
    throw new Error("Search.searchUsers is not implemented");
  }

  async searchUsersAll(params?: Omit<SearchUsersParams, 'cursor'>): Promise<User[]> {
    throw new Error("Search.searchUsersAll is not implemented");
  }
}

export class SearchServiceImpl extends SearchService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async searchChats(params?: SearchChatsParams): Promise<SearchChatsResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.createdFrom !== undefined) query.set("created_from", params.createdFrom);
    if (params?.createdTo !== undefined) query.set("created_to", params.createdTo);
    if (params?.active !== undefined) query.set("active", String(params.active));
    if (params?.chatSubtype !== undefined) query.set("chat_subtype", params.chatSubtype);
    if (params?.personal !== undefined) query.set("personal", String(params.personal));
    const url = `${this.baseUrl}/search/chats${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as SearchChatsResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async searchChatsAll(params?: Omit<SearchChatsParams, 'cursor'>): Promise<Chat[]> {
    const items: Chat[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchChats({ ...params, cursor } as SearchChatsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async searchMessages(params?: SearchMessagesParams): Promise<SearchMessagesResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.createdFrom !== undefined) query.set("created_from", params.createdFrom);
    if (params?.createdTo !== undefined) query.set("created_to", params.createdTo);
    if (params?.chatIds !== undefined) {
      params.chatIds.forEach((v) => query.append("chat_ids[]", String(v)));
    }
    if (params?.userIds !== undefined) {
      params.userIds.forEach((v) => query.append("user_ids[]", String(v)));
    }
    if (params?.active !== undefined) query.set("active", String(params.active));
    const url = `${this.baseUrl}/search/messages${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as SearchMessagesResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async searchMessagesAll(params?: Omit<SearchMessagesParams, 'cursor'>): Promise<Message[]> {
    const items: Message[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchMessages({ ...params, cursor } as SearchMessagesParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async searchUsers(params?: SearchUsersParams): Promise<SearchUsersResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.createdFrom !== undefined) query.set("created_from", params.createdFrom);
    if (params?.createdTo !== undefined) query.set("created_to", params.createdTo);
    if (params?.companyRoles !== undefined) {
      params.companyRoles.forEach((v) => query.append("company_roles[]", String(v)));
    }
    const url = `${this.baseUrl}/search/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as SearchUsersResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async searchUsersAll(params?: Omit<SearchUsersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchUsers({ ...params, cursor } as SearchUsersParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }
}

export class TasksService {
  async listTasks(params?: ListTasksParams): Promise<ListTasksResponse> {
    throw new Error("Tasks.listTasks is not implemented");
  }

  async listTasksAll(params?: Omit<ListTasksParams, 'cursor'>): Promise<Task[]> {
    throw new Error("Tasks.listTasksAll is not implemented");
  }

  async getTask(id: number): Promise<Task> {
    throw new Error("Tasks.getTask is not implemented");
  }

  async createTask(request: TaskCreateRequest): Promise<Task> {
    throw new Error("Tasks.createTask is not implemented");
  }

  async updateTask(id: number, request: TaskUpdateRequest): Promise<Task> {
    throw new Error("Tasks.updateTask is not implemented");
  }

  async deleteTask(id: number): Promise<void> {
    throw new Error("Tasks.deleteTask is not implemented");
  }
}

export class TasksServiceImpl extends TasksService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listTasks(params?: ListTasksParams): Promise<ListTasksResponse> {
    const query = new URLSearchParams();
    if (params?.status !== undefined) query.set("status", params.status);
    if (params?.chatIds !== undefined) {
      params.chatIds.forEach((v) => query.append("chat_ids[]", String(v)));
    }
    if (params?.performerIds !== undefined) {
      params.performerIds.forEach((v) => query.append("performer_ids[]", String(v)));
    }
    if (params?.authorId !== undefined) query.set("author_id", String(params.authorId));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/tasks${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListTasksResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listTasksAll(params?: Omit<ListTasksParams, 'cursor'>): Promise<Task[]> {
    const items: Task[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listTasks({ ...params, cursor } as ListTasksParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getTask(id: number): Promise<Task> {
    const response = await fetchWithRetry(`${this.baseUrl}/tasks/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Task", body.data) as Task;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createTask(request: TaskCreateRequest): Promise<Task> {
    const response = await fetchWithRetry(`${this.baseUrl}/tasks`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("TaskCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Task", body.data) as Task;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateTask(id: number, request: TaskUpdateRequest): Promise<Task> {
    const response = await fetchWithRetry(`${this.baseUrl}/tasks/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("TaskUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Task", body.data) as Task;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteTask(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/tasks/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class UsersService {
  async listUsers(params?: ListUsersParams): Promise<ListUsersResponse> {
    throw new Error("Users.listUsers is not implemented");
  }

  async listUsersAll(params?: Omit<ListUsersParams, 'cursor'>): Promise<User[]> {
    throw new Error("Users.listUsersAll is not implemented");
  }

  async getUser(id: number): Promise<User> {
    throw new Error("Users.getUser is not implemented");
  }

  async getUserStatus(userId: number): Promise<UserStatus> {
    throw new Error("Users.getUserStatus is not implemented");
  }

  async createUser(request: UserCreateRequest): Promise<User> {
    throw new Error("Users.createUser is not implemented");
  }

  async updateUser(id: number, request: UserUpdateRequest): Promise<User> {
    throw new Error("Users.updateUser is not implemented");
  }

  async updateUserAvatar(userId: number, image: Blob): Promise<AvatarData> {
    throw new Error("Users.updateUserAvatar is not implemented");
  }

  async updateUserStatus(userId: number, request: StatusUpdateRequest): Promise<UserStatus> {
    throw new Error("Users.updateUserStatus is not implemented");
  }

  async deleteUser(id: number): Promise<void> {
    throw new Error("Users.deleteUser is not implemented");
  }

  async deleteUserAvatar(userId: number): Promise<void> {
    throw new Error("Users.deleteUserAvatar is not implemented");
  }

  async deleteUserStatus(userId: number): Promise<void> {
    throw new Error("Users.deleteUserStatus is not implemented");
  }
}

export class UsersServiceImpl extends UsersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listUsers(params?: ListUsersParams): Promise<ListUsersResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListUsersResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listUsersAll(params?: Omit<ListUsersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.listUsers({ ...params, cursor } as ListUsersParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }

  async getUser(id: number): Promise<User> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${id}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("User", body.data) as User;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async getUserStatus(userId: number): Promise<UserStatus> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/status`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("UserStatus", body.data) as UserStatus;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async createUser(request: UserCreateRequest): Promise<User> {
    const response = await fetchWithRetry(`${this.baseUrl}/users`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("UserCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("User", body.data) as User;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateUser(id: number, request: UserUpdateRequest): Promise<User> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("UserUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("User", body.data) as User;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateUserAvatar(userId: number, image: Blob): Promise<AvatarData> {
    const form = new FormData();
    form.set("image", image, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/avatar`, {
      method: "PUT",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("AvatarData", body.data) as AvatarData;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateUserStatus(userId: number, request: StatusUpdateRequest): Promise<UserStatus> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/status`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("StatusUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("UserStatus", body.data) as UserStatus;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteUserAvatar(userId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/avatar`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async deleteUserStatus(userId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/status`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class ViewsService {
  async submitViewResponse(viewId: string, request: SubmitViewResponseRequest): Promise<SubmitViewResponseResult> {
    throw new Error("Views.submitViewResponse is not implemented");
  }

  async openView(request: OpenViewRequest): Promise<void> {
    throw new Error("Views.openView is not implemented");
  }
}

export class ViewsServiceImpl extends ViewsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async submitViewResponse(viewId: string, request: SubmitViewResponseRequest): Promise<SubmitViewResponseResult> {
    const response = await fetchWithRetry(`${this.baseUrl}/views/${viewId}/submit_response`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("SubmitViewResponseRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("SubmitViewResponseResult", body) as SubmitViewResponseResult;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async openView(request: OpenViewRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/views/open`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("OpenViewRequest", request)),
    });
    switch (response.status) {
      case 201:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class CommonService {
  async getUploadParams(): Promise<UploadParams> {
    throw new Error("Common.getUploadParams is not implemented");
  }

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    throw new Error("Common.uploadFile is not implemented");
  }

  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    throw new Error("Common.listProperties is not implemented");
  }

  async requestExport(request: ExportRequest): Promise<ChatExport> {
    throw new Error("Common.requestExport is not implemented");
  }

  async downloadExport(id: number): Promise<string> {
    throw new Error("Common.downloadExport is not implemented");
  }
}

export class CommonServiceImpl extends CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getUploadParams(): Promise<UploadParams> {
    const response = await fetchWithRetry(`${this.baseUrl}/uploads`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("UploadParams", body) as UploadParams;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    const form = new FormData();
    if (request.acl !== undefined) form.set("acl", request.acl);
    if (request.bucket !== undefined) form.set("bucket", request.bucket);
    form.set("Content-Disposition", request.contentDisposition);
    form.set("policy", request.policy);
    form.set("x-amz-credential", request.xAmzCredential);
    form.set("x-amz-algorithm", request.xAmzAlgorithm);
    form.set("x-amz-date", request.xAmzDate);
    form.set("x-amz-signature", request.xAmzSignature);
    form.set("key", request.key);
    form.set("file", request.file, "upload");
    const response = await fetchWithRetry(directUrl, {
      method: "POST",
      body: form,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }

  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    const query = new URLSearchParams();
    query.set("entity_type", params.entityType);
    const response = await fetchWithRetry(`${this.baseUrl}/custom_properties?${query}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListPropertiesResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async requestExport(request: ExportRequest): Promise<ChatExport> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/exports`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(serializeType("ExportRequest", request)),
    });
    switch (response.status) {
      case 202: {
        const body = await response.json();
        return deserializeType("ChatExport", body.data) as ChatExport;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async downloadExport(id: number): Promise<string> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/exports/${id}`, {
      headers: this.headers,
      redirect: "manual",
    });
    switch (response.status) {
      case 302: {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("Missing Location header in redirect response");
        }
        return location;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export class LinkPreviewsService {
  async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
    throw new Error("Link Previews.createLinkPreviews is not implemented");
  }
}

export class LinkPreviewsServiceImpl extends LinkPreviewsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/link_previews`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("LinkPreviewsRequest", request)),
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw await errorFromResponse(response);
    }
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly bots: BotsService;
  readonly chats: ChatsService;
  /** @deprecated Renamed for clarity — use the new service(s). Kept working for backward compatibility. */
  readonly common: CommonService;
  readonly customProperties: CustomPropertiesService;
  readonly drafts: DraftsService;
  readonly files: FilesService;
  readonly groupTags: GroupTagsService;
  readonly importantMessages: ImportantMessagesService;
  /** @deprecated Renamed for clarity — use the new service(s). Kept working for backward compatibility. */
  readonly linkPreviews: LinkPreviewsService;
  readonly members: MembersService;
  readonly messages: MessagesService;
  readonly oauth: OAuthService;
  readonly profile: ProfileService;
  readonly reactions: ReactionsService;
  readonly readMembers: ReadMembersService;
  readonly search: SearchService;
  readonly security: SecurityService;
  readonly tasks: TasksService;
  readonly threads: ThreadsService;
  readonly users: UsersService;
  readonly views: ViewsService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; bots?: BotsService; chats?: ChatsService; common?: CommonService; customProperties?: CustomPropertiesService; drafts?: DraftsService; files?: FilesService; groupTags?: GroupTagsService; importantMessages?: ImportantMessagesService; linkPreviews?: LinkPreviewsService; members?: MembersService; messages?: MessagesService; oauth?: OAuthService; profile?: ProfileService; reactions?: ReactionsService; readMembers?: ReadMembersService; search?: SearchService; security?: SecurityService; tasks?: TasksService; threads?: ThreadsService; users?: UsersService; views?: ViewsService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; bots?: BotsService; chats?: ChatsService; common?: CommonService; customProperties?: CustomPropertiesService; drafts?: DraftsService; files?: FilesService; groupTags?: GroupTagsService; importantMessages?: ImportantMessagesService; linkPreviews?: LinkPreviewsService; members?: MembersService; messages?: MessagesService; oauth?: OAuthService; profile?: ProfileService; reactions?: ReactionsService; readMembers?: ReadMembersService; search?: SearchService; security?: SecurityService; tasks?: TasksService; threads?: ThreadsService; users?: UsersService; views?: ViewsService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.bots = new BotsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.chats = new ChatsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.common = new CommonServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.customProperties = new CustomPropertiesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.drafts = new DraftsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.files = new FilesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.groupTags = new GroupTagsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.importantMessages = new ImportantMessagesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.linkPreviews = new LinkPreviewsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.members = new MembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.messages = new MessagesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.oauth = new OAuthServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.profile = new ProfileServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.reactions = new ReactionsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.readMembers = new ReadMembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.search = new SearchServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.security = new SecurityServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.tasks = new TasksServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.threads = new ThreadsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.users = new UsersServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.views = new ViewsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.bots = tokenOrConfig.bots ?? new BotsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.chats = tokenOrConfig.chats ?? new ChatsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.common = tokenOrConfig.common ?? new CommonServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.customProperties = tokenOrConfig.customProperties ?? new CustomPropertiesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.drafts = tokenOrConfig.drafts ?? new DraftsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.files = tokenOrConfig.files ?? new FilesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.groupTags = tokenOrConfig.groupTags ?? new GroupTagsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.importantMessages = tokenOrConfig.importantMessages ?? new ImportantMessagesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.linkPreviews = tokenOrConfig.linkPreviews ?? new LinkPreviewsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.members = tokenOrConfig.members ?? new MembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.messages = tokenOrConfig.messages ?? new MessagesServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.oauth = tokenOrConfig.oauth ?? new OAuthServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.profile = tokenOrConfig.profile ?? new ProfileServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.reactions = tokenOrConfig.reactions ?? new ReactionsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.readMembers = tokenOrConfig.readMembers ?? new ReadMembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.search = tokenOrConfig.search ?? new SearchServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.security = tokenOrConfig.security ?? new SecurityServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.tasks = tokenOrConfig.tasks ?? new TasksServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.threads = tokenOrConfig.threads ?? new ThreadsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.users = tokenOrConfig.users ?? new UsersServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.views = tokenOrConfig.views ?? new ViewsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { bots?: BotsService; chats?: ChatsService; common?: CommonService; customProperties?: CustomPropertiesService; drafts?: DraftsService; files?: FilesService; groupTags?: GroupTagsService; importantMessages?: ImportantMessagesService; linkPreviews?: LinkPreviewsService; members?: MembersService; messages?: MessagesService; oauth?: OAuthService; profile?: ProfileService; reactions?: ReactionsService; readMembers?: ReadMembersService; search?: SearchService; security?: SecurityService; tasks?: TasksService; threads?: ThreadsService; users?: UsersService; views?: ViewsService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.bots = overrides.bots ?? new BotsService();
    client.chats = overrides.chats ?? new ChatsService();
    client.common = overrides.common ?? new CommonService();
    client.customProperties = overrides.customProperties ?? new CustomPropertiesService();
    client.drafts = overrides.drafts ?? new DraftsService();
    client.files = overrides.files ?? new FilesService();
    client.groupTags = overrides.groupTags ?? new GroupTagsService();
    client.importantMessages = overrides.importantMessages ?? new ImportantMessagesService();
    client.linkPreviews = overrides.linkPreviews ?? new LinkPreviewsService();
    client.members = overrides.members ?? new MembersService();
    client.messages = overrides.messages ?? new MessagesService();
    client.oauth = overrides.oauth ?? new OAuthService();
    client.profile = overrides.profile ?? new ProfileService();
    client.reactions = overrides.reactions ?? new ReactionsService();
    client.readMembers = overrides.readMembers ?? new ReadMembersService();
    client.search = overrides.search ?? new SearchService();
    client.security = overrides.security ?? new SecurityService();
    client.tasks = overrides.tasks ?? new TasksService();
    client.threads = overrides.threads ?? new ThreadsService();
    client.users = overrides.users ?? new UsersService();
    client.views = overrides.views ?? new ViewsService();
    return client;
  }
}
