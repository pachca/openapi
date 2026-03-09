import {
  GetAuditEventsParams,
  GetAuditEventsResponse,
  AuditEvent,
  OAuthError,
  ApiError,
  GetWebhookEventsParams,
  GetWebhookEventsResponse,
  WebhookEvent,
  BotUpdateRequest,
  BotResponse,
  ListChatsParams,
  ListChatsResponse,
  Chat,
  ChatCreateRequest,
  ChatUpdateRequest,
  ListPropertiesParams,
  ListPropertiesResponse,
  ExportRequest,
  FileUploadRequest,
  UploadParams,
  ListMembersParams,
  ListMembersResponse,
  User,
  AddMembersRequest,
  ChatMemberRole,
  ListTagsParams,
  ListTagsResponse,
  GroupTag,
  GetTagUsersParams,
  GroupTagRequest,
  ListChatMessagesParams,
  ListChatMessagesResponse,
  Message,
  MessageCreateRequest,
  MessageUpdateRequest,
  LinkPreviewsRequest,
  ListReactionsParams,
  ListReactionsResponse,
  Reaction,
  ReactionRequest,
  RemoveReactionParams,
  ListReadMembersParams,
  Thread,
  AccessTokenInfo,
  StatusUpdateRequest,
  UserStatus,
  SearchChatsParams,
  SearchMessagesParams,
  SearchUsersParams,
  ListTasksParams,
  ListTasksResponse,
  Task,
  TaskCreateRequest,
  TaskUpdateRequest,
  ListUsersParams,
  UserCreateRequest,
  UserUpdateRequest,
  OpenViewRequest,
} from "./types";
import { deserialize, serialize } from "./utils";

class SecurityService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async getAuditEvents(params: GetAuditEventsParams): Promise<GetAuditEventsResponse> {
    const query = new URLSearchParams();
    query.set("start_time", params.startTime);
    query.set("end_time", params.endTime);
    if (params?.eventKey !== undefined) query.set("event_key", params.eventKey);
    if (params?.actorId !== undefined) query.set("actor_id", params.actorId);
    if (params?.actorType !== undefined) query.set("actor_type", params.actorType);
    if (params?.entityId !== undefined) query.set("entity_id", params.entityId);
    if (params?.entityType !== undefined) query.set("entity_type", params.entityType);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const response = await fetch(`${this.baseUrl}/audit_events?${query}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as GetAuditEventsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getAuditEventsAll(params: Omit<GetAuditEventsParams, 'cursor'>): Promise<AuditEvent[]> {
    const items: AuditEvent[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.getAuditEvents({ ...params, cursor } as GetAuditEventsParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }
}

class BotsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/webhooks/events${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as GetWebhookEventsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getWebhookEventsAll(params?: Omit<GetWebhookEventsParams, 'cursor'>): Promise<WebhookEvent[]> {
    const items: WebhookEvent[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.getWebhookEvents({ ...params, cursor } as GetWebhookEventsParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async updateBot(id: number, request: BotUpdateRequest): Promise<BotResponse> {
    const response = await fetch(`${this.baseUrl}/bots/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as BotResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async deleteWebhookEvent(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/webhooks/events/${id}`, {
      method: "DELETE",
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

class ChatsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listChats(params?: ListChatsParams): Promise<ListChatsResponse> {
    const query = new URLSearchParams();
    if (params?.sortId !== undefined) query.set("sort[{field}]", params.sortId);
    if (params?.availability !== undefined) query.set("availability", params.availability);
    if (params?.lastMessageAtAfter !== undefined) query.set("last_message_at_after", params.lastMessageAtAfter);
    if (params?.lastMessageAtBefore !== undefined) query.set("last_message_at_before", params.lastMessageAtBefore);
    if (params?.personal !== undefined) query.set("personal", String(params.personal));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/chats${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListChatsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listChatsAll(params?: Omit<ListChatsParams, 'cursor'>): Promise<Chat[]> {
    const items: Chat[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listChats({ ...params, cursor } as ListChatsParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async getChat(id: number): Promise<Chat> {
    const response = await fetch(`${this.baseUrl}/chats/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Chat;
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

  async updateChat(id: number, request: ChatUpdateRequest): Promise<Chat> {
    const response = await fetch(`${this.baseUrl}/chats/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Chat;
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
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }

  async unarchiveChat(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/unarchive`, {
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

class CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async downloadExport(id: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chats/exports/${id}`, {
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
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }

  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    const query = new URLSearchParams();
    query.set("entity_type", params.entityType);
    const response = await fetch(`${this.baseUrl}/custom_properties?${query}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListPropertiesResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async requestExport(request: ExportRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/exports`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
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

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    const form = new FormData();
    form.set("Content-Disposition", request.contentDisposition);
    form.set("acl", request.acl);
    form.set("policy", request.policy);
    form.set("x-amz-credential", request.xAmzCredential);
    form.set("x-amz-algorithm", request.xAmzAlgorithm);
    form.set("x-amz-date", request.xAmzDate);
    form.set("x-amz-signature", request.xAmzSignature);
    form.set("key", request.key);
    form.set("file", request.file, "upload");
    const response = await fetch(directUrl, {
      method: "POST",
      body: form,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }

  async getUploadParams(): Promise<UploadParams> {
    const response = await fetch(`${this.baseUrl}/uploads`, {
      method: "POST",
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body) as UploadParams;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }
}

class MembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listMembers(id: number, params?: ListMembersParams): Promise<ListMembersResponse> {
    const query = new URLSearchParams();
    if (params?.role !== undefined) query.set("role", params.role);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/chats/${id}/members${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListMembersResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listMembersAll(id: number, params?: Omit<ListMembersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listMembers(id, { ...params, cursor } as ListMembersParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async addTags(id: number, groupTagIds: number[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/group_tags`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ group_tag_ids: groupTagIds }),
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

  async addMembers(id: number, request: AddMembersRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/members`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
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

  async updateMemberRole(id: number, userId: number, role: ChatMemberRole): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/members/$${userId}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ role: role }),
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

  async removeTag(id: number, tagId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/group_tags/$${tagId}`, {
      method: "DELETE",
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

  async leaveChat(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/leave`, {
      method: "DELETE",
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

  async removeMember(id: number, userId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${id}/members/$${userId}`, {
      method: "DELETE",
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

class GroupTagsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listTags(params?: ListTagsParams): Promise<ListTagsResponse> {
    const query = new URLSearchParams();
    if (params?.names !== undefined) query.set("names", String(params.names));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/group_tags${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListTagsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listTagsAll(params?: Omit<ListTagsParams, 'cursor'>): Promise<GroupTag[]> {
    const items: GroupTag[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listTags({ ...params, cursor } as ListTagsParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async getTag(id: number): Promise<GroupTag> {
    const response = await fetch(`${this.baseUrl}/group_tags/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as GroupTag;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getTagUsers(id: number, params?: GetTagUsersParams): Promise<ListMembersResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/group_tags/${id}/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListMembersResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getTagUsersAll(id: number, params?: Omit<GetTagUsersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.getTagUsers(id, { ...params, cursor } as GetTagUsersParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async createTag(request: GroupTagRequest): Promise<GroupTag> {
    const response = await fetch(`${this.baseUrl}/group_tags`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as GroupTag;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateTag(id: number, request: GroupTagRequest): Promise<GroupTag> {
    const response = await fetch(`${this.baseUrl}/group_tags/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as GroupTag;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async deleteTag(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/group_tags/${id}`, {
      method: "DELETE",
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

class MessagesService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listChatMessages(params: ListChatMessagesParams): Promise<ListChatMessagesResponse> {
    const query = new URLSearchParams();
    query.set("chat_id", String(params.chatId));
    if (params?.sortId !== undefined) query.set("sort[{field}]", params.sortId);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const response = await fetch(`${this.baseUrl}/messages?${query}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListChatMessagesResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listChatMessagesAll(params: Omit<ListChatMessagesParams, 'cursor'>): Promise<Message[]> {
    const items: Message[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listChatMessages({ ...params, cursor } as ListChatMessagesParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async getMessage(id: number): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/messages/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Message;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async createMessage(request: MessageCreateRequest): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as Message;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async pinMessage(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${id}/pin`, {
      method: "POST",
      headers: this.headers,
    });
    switch (response.status) {
      case 201:
        return;
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }

  async updateMessage(id: number, request: MessageUpdateRequest): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/messages/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Message;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async deleteMessage(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${id}`, {
      method: "DELETE",
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

  async unpinMessage(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${id}/pin`, {
      method: "DELETE",
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

class LinkPreviewsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${id}/link_previews`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
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

class ReactionsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listReactions(id: number, params?: ListReactionsParams): Promise<ListReactionsResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/messages/${id}/reactions${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListReactionsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listReactionsAll(id: number, params?: Omit<ListReactionsParams, 'cursor'>): Promise<Reaction[]> {
    const items: Reaction[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listReactions(id, { ...params, cursor } as ListReactionsParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async addReaction(id: number, request: ReactionRequest): Promise<Reaction> {
    const response = await fetch(`${this.baseUrl}/messages/${id}/reactions`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body) as Reaction;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async removeReaction(id: number, params: RemoveReactionParams): Promise<void> {
    const query = new URLSearchParams();
    query.set("code", params.code);
    if (params?.name !== undefined) query.set("name", params.name);
    const response = await fetch(`${this.baseUrl}/messages/${id}/reactions?${query}`, {
      method: "DELETE",
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

class ReadMembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listReadMembers(id: number, params?: ListReadMembersParams): Promise<unknown> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/messages/${id}/read_member_ids${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as unknown;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listReadMembersAll(id: number, params?: Omit<ListReadMembersParams, 'cursor'>): Promise<unknown[]> {
    const items: unknown[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listReadMembers(id, { ...params, cursor } as ListReadMembersParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }
}

class ThreadsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async getThread(id: number): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/threads/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Thread;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async createThread(id: number): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/messages/${id}/thread`, {
      method: "POST",
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as Thread;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }
}

class ProfileService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async getTokenInfo(): Promise<AccessTokenInfo> {
    const response = await fetch(`${this.baseUrl}/oauth/token/info`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as AccessTokenInfo;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as User;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getStatus(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/profile/status`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as unknown;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateStatus(request: StatusUpdateRequest): Promise<UserStatus> {
    const response = await fetch(`${this.baseUrl}/profile/status`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as UserStatus;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async deleteStatus(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/profile/status`, {
      method: "DELETE",
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

class SearchService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async searchChats(params?: SearchChatsParams): Promise<ListChatsResponse> {
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
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListChatsResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async searchChatsAll(params?: Omit<SearchChatsParams, 'cursor'>): Promise<Chat[]> {
    const items: Chat[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchChats({ ...params, cursor } as SearchChatsParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async searchMessages(params?: SearchMessagesParams): Promise<ListChatMessagesResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.createdFrom !== undefined) query.set("created_from", params.createdFrom);
    if (params?.createdTo !== undefined) query.set("created_to", params.createdTo);
    if (params?.chatIds !== undefined) query.set("chat_ids", String(params.chatIds));
    if (params?.userIds !== undefined) query.set("user_ids", String(params.userIds));
    if (params?.active !== undefined) query.set("active", String(params.active));
    const url = `${this.baseUrl}/search/messages${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListChatMessagesResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async searchMessagesAll(params?: Omit<SearchMessagesParams, 'cursor'>): Promise<Message[]> {
    const items: Message[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchMessages({ ...params, cursor } as SearchMessagesParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async searchUsers(params?: SearchUsersParams): Promise<ListMembersResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.order !== undefined) query.set("order", params.order);
    if (params?.createdFrom !== undefined) query.set("created_from", params.createdFrom);
    if (params?.createdTo !== undefined) query.set("created_to", params.createdTo);
    if (params?.companyRoles !== undefined) query.set("company_roles", String(params.companyRoles));
    const url = `${this.baseUrl}/search/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListMembersResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async searchUsersAll(params?: Omit<SearchUsersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchUsers({ ...params, cursor } as SearchUsersParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }
}

class TasksService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listTasks(params?: ListTasksParams): Promise<ListTasksResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/tasks${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListTasksResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listTasksAll(params?: Omit<ListTasksParams, 'cursor'>): Promise<Task[]> {
    const items: Task[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listTasks({ ...params, cursor } as ListTasksParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async getTask(id: number): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Task;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async createTask(request: TaskCreateRequest): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/tasks`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as Task;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateTask(id: number, request: TaskUpdateRequest): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Task;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async deleteTask(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: "DELETE",
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

class UsersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listUsers(params?: ListUsersParams): Promise<ListMembersResponse> {
    const query = new URLSearchParams();
    if (params?.query !== undefined) query.set("query", params.query);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListMembersResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async listUsersAll(params?: Omit<ListUsersParams, 'cursor'>): Promise<User[]> {
    const items: User[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listUsers({ ...params, cursor } as ListUsersParams);
      items.push(...response.data);
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }

  async getUser(id: number): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as User;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async getUserStatus(userId: number): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/users/$${userId}/status`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as unknown;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async createUser(request: UserCreateRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as User;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateUser(id: number, request: UserUpdateRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as User;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateUserStatus(userId: number, request: StatusUpdateRequest): Promise<UserStatus> {
    const response = await fetch(`${this.baseUrl}/users/$${userId}/status`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as UserStatus;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: "DELETE",
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

  async deleteUserStatus(userId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/$${userId}/status`, {
      method: "DELETE",
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

class ViewsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async openView(request: OpenViewRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/views/open`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    switch (response.status) {
      case 201:
        return;
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }
}

export class PachcaClient {
  readonly bots: BotsService;
  readonly chats: ChatsService;
  readonly common: CommonService;
  readonly groupTags: GroupTagsService;
  readonly linkPreviews: LinkPreviewsService;
  readonly members: MembersService;
  readonly messages: MessagesService;
  readonly profile: ProfileService;
  readonly reactions: ReactionsService;
  readonly readMembers: ReadMembersService;
  readonly search: SearchService;
  readonly security: SecurityService;
  readonly tasks: TasksService;
  readonly threads: ThreadsService;
  readonly users: UsersService;
  readonly views: ViewsService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1") {
    const headers = { Authorization: `Bearer ${token}` };
    this.bots = new BotsService(baseUrl, headers);
    this.chats = new ChatsService(baseUrl, headers);
    this.common = new CommonService(baseUrl, headers);
    this.groupTags = new GroupTagsService(baseUrl, headers);
    this.linkPreviews = new LinkPreviewsService(baseUrl, headers);
    this.members = new MembersService(baseUrl, headers);
    this.messages = new MessagesService(baseUrl, headers);
    this.profile = new ProfileService(baseUrl, headers);
    this.reactions = new ReactionsService(baseUrl, headers);
    this.readMembers = new ReadMembersService(baseUrl, headers);
    this.search = new SearchService(baseUrl, headers);
    this.security = new SecurityService(baseUrl, headers);
    this.tasks = new TasksService(baseUrl, headers);
    this.threads = new ThreadsService(baseUrl, headers);
    this.users = new UsersService(baseUrl, headers);
    this.views = new ViewsService(baseUrl, headers);
  }
}
