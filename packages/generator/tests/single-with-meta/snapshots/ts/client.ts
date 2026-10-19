import {
  Chat,
  OAuthError,
  ApiError,
  ChatCreateRequest,
  CreateChatResponse,
  ChatUpdateRequest,
  UpdateChatResponse,
} from "./types.js";
import { deserialize, deserializeType, serializeType, fetchWithRetry } from "./utils.js";

/**
 * An error body is either `{ errors: [...] }` or the OAuth form `{ error, error_description }`,
 * which also comes with 400 and 403 (`insufficient_scope`, `invalid_grant`). The body decides the class.
 */
function errorFromBody(body: any): Error {
  if (body && typeof body.error === "string" && body.errors === undefined) return new OAuthError(body.error);
  return new ApiError(body?.errors);
}

export class ChatsService {
  async getChat(id: number): Promise<Chat> {
    throw new Error("Chats.getChat is not implemented");
  }

  async createChat(request: ChatCreateRequest): Promise<CreateChatResponse> {
    throw new Error("Chats.createChat is not implemented");
  }

  async updateChat(id: number, request: ChatUpdateRequest): Promise<UpdateChatResponse> {
    throw new Error("Chats.updateChat is not implemented");
  }
}

export class ChatsServiceImpl extends ChatsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getChat(id: number): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserializeType("Chat", body.data) as Chat;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw errorFromBody(body);
    }
  }

  async createChat(request: ChatCreateRequest): Promise<CreateChatResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ChatCreateRequest", request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return { ...(deserialize(body) as CreateChatResponse), data: deserializeType("Chat", body.data) as Chat };
      case 401:
        throw new OAuthError(body.error);
      default:
        throw errorFromBody(body);
    }
  }

  async updateChat(id: number, request: ChatUpdateRequest): Promise<UpdateChatResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ChatUpdateRequest", request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return { ...(deserialize(body) as UpdateChatResponse), data: deserializeType("Chat", body.data) as Chat };
      case 401:
        throw new OAuthError(body.error);
      default:
        throw errorFromBody(body);
    }
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly chats: ChatsService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; chats?: ChatsService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; chats?: ChatsService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.chats = new ChatsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.chats = tokenOrConfig.chats ?? new ChatsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { chats?: ChatsService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.chats = overrides.chats ?? new ChatsService();
    return client;
  }
}
