import {
  ListChatsParams,
  ListChatsResponse,
  OAuthError,
  ApiError,
  Chat,
  ChatCreateRequest,
  ChatUpdateRequest,
} from "./types";
import { toCamelCase, toSnakeCase } from "./utils";

class ChatsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listChats(params?: ListChatsParams): Promise<ListChatsResponse> {
    const query = new URLSearchParams();
    if (params?.availability !== undefined) query.set("availability", params.availability);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.sortField !== undefined) query.set("sort[field]", params.sortField);
    if (params?.sortOrder !== undefined) query.set("sort[order]", params.sortOrder);
    const url = `${this.baseUrl}/chats${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return toCamelCase(body) as ListChatsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getChat(id: number): Promise<Chat> {
    const response = await fetch(`${this.baseUrl}/chats/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return toCamelCase(body.data) as Chat;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async createChat(request: ChatCreateRequest): Promise<Chat> {
    const response = await fetch(`${this.baseUrl}/chats`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCase(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return toCamelCase(body.data) as Chat;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateChat(id: number, request: ChatUpdateRequest): Promise<Chat> {
    const response = await fetch(`${this.baseUrl}/chats/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCase(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return toCamelCase(body.data) as Chat;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async archiveChat(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/archive`, {
      method: "PUT",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      case 401:
        throw new OAuthError((await response.json()).error);
      default:
        throw new ApiError((await response.json()).errors);
    }
  }

  async deleteChat(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      case 401:
        throw new OAuthError((await response.json()).error);
      default:
        throw new ApiError((await response.json()).errors);
    }
  }
}

export class PachcaClient {
  readonly chats: ChatsService;

  constructor(baseUrl: string, token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    this.chats = new ChatsService(baseUrl, headers);
  }
}
