import {
  ListMembersParams,
  ListMembersResponse,
  OAuthError,
  ApiError,
  MemberUpdateRequest,
  Member,
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

export class MembersService {
  async listMembers(params?: ListMembersParams): Promise<ListMembersResponse> {
    throw new Error("Members.listMembers is not implemented");
  }

  async updateMember(id: number, request: MemberUpdateRequest): Promise<Member> {
    throw new Error("Members.updateMember is not implemented");
  }
}

export class MembersServiceImpl extends MembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listMembers(params?: ListMembersParams): Promise<ListMembersResponse> {
    const query = new URLSearchParams();
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.role !== undefined) query.set("role", params.role);
    if (params?.roles !== undefined) {
      params.roles.forEach((v) => query.append("roles[]", String(v)));
    }
    if (params?.region !== undefined) query.set("region", params.region);
    const url = `${this.baseUrl}/members${query.toString() ? `?${query}` : ""}`;
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
        throw errorFromBody(body);
    }
  }

  async updateMember(id: number, request: MemberUpdateRequest): Promise<Member> {
    const response = await fetchWithRetry(`${this.baseUrl}/members/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MemberUpdateRequest", request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserializeType("Member", body.data) as Member;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw errorFromBody(body);
    }
  }
}

export class PachcaClient {
  readonly members: MembersService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; members?: MembersService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; members?: MembersService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? '';
      this.members = new MembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? '';
      this.members = tokenOrConfig.members ?? new MembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { members?: MembersService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.members = overrides.members ?? new MembersService();
    return client;
  }
}
