import {
  OAuthError,
  ApiError,
  ChatCreateRequest,
  Chat,
} from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

export class MembersService {
  async addMembers(id: number, memberIds: number[]): Promise<void> {
    throw new Error("Members.addMembers is not implemented");
  }
}

export class MembersServiceImpl extends MembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  override async addMembers(id: number, memberIds: number[]): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: memberIds }),
    });
    switch (response.status) {
      case 204:
        return;
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }
}

export class ChatsService {
  async createChat(request: ChatCreateRequest): Promise<Chat> {
    throw new Error("Chats.createChat is not implemented");
  }

  async archiveChat(id: number): Promise<void> {
    throw new Error("Chats.archiveChat is not implemented");
  }
}

export class ChatsServiceImpl extends ChatsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  override async createChat(request: ChatCreateRequest): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as Chat;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  override async archiveChat(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/archive`, {
      method: "PUT",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }
}

export interface PachcaClientOptions {
  token: string;
  baseUrl?: string;
  chats?: ChatsService;
  members?: MembersService;
}

export class PachcaClient {
  readonly chats: ChatsService;
  readonly members: MembersService;

  constructor(options: PachcaClientOptions) {
    const { token } = options;
    const baseUrl = options.baseUrl ?? "https://api.pachca.com/api/shared/v1";
    const headers = { Authorization: `Bearer ${token}` };
    this.chats = options.chats ?? new ChatsServiceImpl(baseUrl, headers);
    this.members = options.members ?? new MembersServiceImpl(baseUrl, headers);
  }
}
