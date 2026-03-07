import {
  AddMembersRequest,
  OAuthError,
  ApiError,
  ChatCreateRequest,
  Chat,
} from "./types";
import { toCamelCase, toSnakeCase } from "./utils";

class MembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

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
