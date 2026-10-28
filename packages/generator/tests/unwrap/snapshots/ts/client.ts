import {
  OAuthError,
  ApiError,
  ChatCreateRequest,
  Chat,
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

  async addMembers(id: number, memberIds: number[]): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: memberIds }),
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
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly chats: ChatsService;
  readonly members: MembersService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; chats?: ChatsService; members?: MembersService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; chats?: ChatsService; members?: MembersService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.chats = new ChatsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.members = new MembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.chats = tokenOrConfig.chats ?? new ChatsServiceImpl(resolvedBaseUrl, resolvedHeaders);
      this.members = tokenOrConfig.members ?? new MembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { chats?: ChatsService; members?: MembersService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.chats = overrides.chats ?? new ChatsService();
    client.members = overrides.members ?? new MembersService();
    return client;
  }
}
