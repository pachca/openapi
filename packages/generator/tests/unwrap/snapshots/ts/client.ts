import { ApiError, Chat, ChatCreateRequest, OAuthError } from "./types";
import { toCamelCase, toSnakeCase } from "./utils";

// D1: 1 field → unwrapped into function params
// D2: 0 fields → void action, no body
// D3: 2+ fields → pass as object

class MembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  /** D1: addMembers — 1 field unwrapped */
  async addMembers(id: number, memberIds: number[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/members`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: memberIds }),
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

class ChatsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  /** D2: archiveChat — void action, no body */
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

  /** D3: createChat — 2+ fields, pass as object */
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
}

export class PachcaClient {
  readonly chats: ChatsService;
  readonly members: MembersService;

  constructor(baseUrl: string, token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    this.chats = new ChatsService(baseUrl, headers);
    this.members = new MembersService(baseUrl, headers);
  }
}
