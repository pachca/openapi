import {
  ListMembersParams,
  ListMembersResponse,
  OAuthError,
  ApiError,
  MemberUpdateRequest,
  Member,
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
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListMembersResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateMember(id: number, request: MemberUpdateRequest): Promise<Member> {
    const response = await fetchWithRetry(`${this.baseUrl}/members/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MemberUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Member", body.data) as Member;
      }
      default:
        throw await errorFromResponse(response);
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
