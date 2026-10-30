import {
  ListChatsParams,
  ListChatsResponse,
  Chat,
  OAuthError,
  ApiError,
  ChatCreateRequest,
  ChatUpdateRequest,
} from "./types.js";
import { deserialize, deserializeType, serializeType, fetchWithRetry } from "./utils.js";

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

  async createChat(request: ChatCreateRequest): Promise<Chat> {
    throw new Error("Chats.createChat is not implemented");
  }

  async updateChat(id: number, request: ChatUpdateRequest): Promise<Chat> {
    throw new Error("Chats.updateChat is not implemented");
  }

  async archiveChat(id: number): Promise<void> {
    throw new Error("Chats.archiveChat is not implemented");
  }

  async deleteChat(id: number): Promise<void> {
    throw new Error("Chats.deleteChat is not implemented");
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
    if (params?.availability !== undefined) query.set("availability", params.availability);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.sortField !== undefined) query.set("sort[field]", params.sortField);
    if (params?.sortOrder !== undefined) query.set("sort[order]", params.sortOrder);
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
    do {
      const response = await this.listChats({ ...params, cursor } as ListChatsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta?.paginate.nextPage;
    } while (cursor);
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

  async createChat(request: ChatCreateRequest): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ChatCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Chat", body.data) as Chat;
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

  async deleteChat(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
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
