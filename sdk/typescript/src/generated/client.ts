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
  GetTagUsersResponse,
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
  AvatarData,
  StatusUpdateRequest,
  UserStatus,
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
  OpenViewRequest,
} from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

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

  async getAuditEventsAll(params?: Omit<GetAuditEventsParams, 'cursor'>): Promise<AuditEvent[]> {
    const items: AuditEvent[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.getAuditEvents({ ...params, cursor } as GetAuditEventsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }
}

export class BotsService {
  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    throw new Error("Bots.getWebhookEvents is not implemented");
  }

  async getWebhookEventsAll(params?: Omit<GetWebhookEventsParams, 'cursor'>): Promise<WebhookEvent[]> {
    throw new Error("Bots.getWebhookEventsAll is not implemented");
  }

  async updateBot(id: number, request: BotUpdateRequest): Promise<BotResponse> {
    throw new Error("Bots.updateBot is not implemented");
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

  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/webhooks/events${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async updateBot(id: number, request: BotUpdateRequest): Promise<BotResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/bots/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/webhooks/events/${id}`, {
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

  async unarchiveChat(id: number): Promise<void> {
    throw new Error("Chats.unarchiveChat is not implemented");
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
    if (params?.lastMessageAtAfter !== undefined) query.set("last_message_at_after", params.lastMessageAtAfter);
    if (params?.lastMessageAtBefore !== undefined) query.set("last_message_at_before", params.lastMessageAtBefore);
    if (params?.personal !== undefined) query.set("personal", String(params.personal));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/chats${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async getChat(id: number): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
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

  async updateChat(id: number, request: ChatUpdateRequest): Promise<Chat> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}`, {
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

  async unarchiveChat(id: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/unarchive`, {
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

export class CommonService {
  async downloadExport(id: number): Promise<string> {
    throw new Error("Common.downloadExport is not implemented");
  }

  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    throw new Error("Common.listProperties is not implemented");
  }

  async requestExport(request: ExportRequest): Promise<void> {
    throw new Error("Common.requestExport is not implemented");
  }

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    throw new Error("Common.uploadFile is not implemented");
  }

  async getUploadParams(): Promise<UploadParams> {
    throw new Error("Common.getUploadParams is not implemented");
  }
}

export class CommonServiceImpl extends CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
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
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }

  async listProperties(params: ListPropertiesParams): Promise<ListPropertiesResponse> {
    const query = new URLSearchParams();
    query.set("entity_type", params.entityType);
    const response = await fetchWithRetry(`${this.baseUrl}/custom_properties?${query}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/chats/exports`, {
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
    const response = await fetchWithRetry(directUrl, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/uploads`, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
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
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }

  async addMembers(id: number, request: AddMembersRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members/${userId}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/group_tags/${tagId}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/leave`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/chats/${id}/members/${userId}`, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async getTag(id: number): Promise<GroupTag> {
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags/${id}`, {
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

  async getTagUsers(id: number, params?: GetTagUsersParams): Promise<GetTagUsersResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/group_tags/${id}/users${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as GetTagUsersResponse;
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async createTag(request: GroupTagRequest): Promise<GroupTag> {
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/group_tags/${id}`, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async getMessage(id: number): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/messages`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/pin`, {
      method: "POST",
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

  async updateMessage(id: number, request: MessageUpdateRequest): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/pin`, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async addReaction(id: number, request: ReactionRequest): Promise<Reaction> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/reactions`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/reactions?${query}`, {
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
}

export class ThreadsService {
  async getThread(id: number): Promise<Thread> {
    throw new Error("Threads.getThread is not implemented");
  }

  async createThread(id: number): Promise<Thread> {
    throw new Error("Threads.createThread is not implemented");
  }
}

export class ThreadsServiceImpl extends ThreadsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getThread(id: number): Promise<Thread> {
    const response = await fetchWithRetry(`${this.baseUrl}/threads/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/thread`, {
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

export class ProfileService {
  async getTokenInfo(): Promise<AccessTokenInfo> {
    throw new Error("Profile.getTokenInfo is not implemented");
  }

  async getProfile(): Promise<User> {
    throw new Error("Profile.getProfile is not implemented");
  }

  async getStatus(): Promise<unknown> {
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
}

export class ProfileServiceImpl extends ProfileService {
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
    const response = await fetchWithRetry(`${this.baseUrl}/profile`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/profile/status`, {
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

  async updateProfileAvatar(image: Blob): Promise<AvatarData> {
    const form = new FormData();
    form.set("image", image, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/profile/avatar`, {
      method: "PUT",
      headers: this.headers,
      body: form,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as AvatarData;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateStatus(request: StatusUpdateRequest): Promise<UserStatus> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/status`, {
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

  async deleteProfileAvatar(): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/avatar`, {
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

  async deleteStatus(): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/profile/status`, {
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
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as SearchChatsResponse;
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
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as SearchMessagesResponse;
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
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as SearchUsersResponse;
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
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/tasks${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async getTask(id: number): Promise<Task> {
    const response = await fetchWithRetry(`${this.baseUrl}/tasks/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/tasks`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/tasks/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/tasks/${id}`, {
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

  async getUserStatus(userId: number): Promise<unknown> {
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
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListUsersResponse;
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
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }

  async getUser(id: number): Promise<User> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${id}`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/status`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/users`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/users/${id}`, {
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

  async updateUserAvatar(userId: number, image: Blob): Promise<AvatarData> {
    const form = new FormData();
    form.set("image", image, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/avatar`, {
      method: "PUT",
      headers: this.headers,
      body: form,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as AvatarData;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new ApiError(body.errors);
    }
  }

  async updateUserStatus(userId: number, request: StatusUpdateRequest): Promise<UserStatus> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/status`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/users/${id}`, {
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

  async deleteUserAvatar(userId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/avatar`, {
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
    const response = await fetchWithRetry(`${this.baseUrl}/users/${userId}/status`, {
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

export class ViewsService {
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

  async openView(request: OpenViewRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/views/open`, {
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
    this.bots = new BotsServiceImpl(baseUrl, headers);
    this.chats = new ChatsServiceImpl(baseUrl, headers);
    this.common = new CommonServiceImpl(baseUrl, headers);
    this.groupTags = new GroupTagsServiceImpl(baseUrl, headers);
    this.linkPreviews = new LinkPreviewsServiceImpl(baseUrl, headers);
    this.members = new MembersServiceImpl(baseUrl, headers);
    this.messages = new MessagesServiceImpl(baseUrl, headers);
    this.profile = new ProfileServiceImpl(baseUrl, headers);
    this.reactions = new ReactionsServiceImpl(baseUrl, headers);
    this.readMembers = new ReadMembersServiceImpl(baseUrl, headers);
    this.search = new SearchServiceImpl(baseUrl, headers);
    this.security = new SecurityServiceImpl(baseUrl, headers);
    this.tasks = new TasksServiceImpl(baseUrl, headers);
    this.threads = new ThreadsServiceImpl(baseUrl, headers);
    this.users = new UsersServiceImpl(baseUrl, headers);
    this.views = new ViewsServiceImpl(baseUrl, headers);
  }

  static stub(bots: BotsService = new BotsService(), chats: ChatsService = new ChatsService(), common: CommonService = new CommonService(), groupTags: GroupTagsService = new GroupTagsService(), linkPreviews: LinkPreviewsService = new LinkPreviewsService(), members: MembersService = new MembersService(), messages: MessagesService = new MessagesService(), profile: ProfileService = new ProfileService(), reactions: ReactionsService = new ReactionsService(), readMembers: ReadMembersService = new ReadMembersService(), search: SearchService = new SearchService(), security: SecurityService = new SecurityService(), tasks: TasksService = new TasksService(), threads: ThreadsService = new ThreadsService(), users: UsersService = new UsersService(), views: ViewsService = new ViewsService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.bots = bots;
    client.chats = chats;
    client.common = common;
    client.groupTags = groupTags;
    client.linkPreviews = linkPreviews;
    client.members = members;
    client.messages = messages;
    client.profile = profile;
    client.reactions = reactions;
    client.readMembers = readMembers;
    client.search = search;
    client.security = security;
    client.tasks = tasks;
    client.threads = threads;
    client.users = users;
    client.views = views;
    return client;
  }
}
