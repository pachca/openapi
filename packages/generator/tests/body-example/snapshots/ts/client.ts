import {
  MessageCreateRequest,
  Message,
  OAuthError,
  ApiError,
  MessageUpdateRequest,
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

export class MessagesService {
  async createMessage(request: MessageCreateRequest): Promise<Message> {
    throw new Error("Messages.createMessage is not implemented");
  }

  async updateMessage(id: number, request: MessageUpdateRequest): Promise<Message> {
    throw new Error("Messages.updateMessage is not implemented");
  }
}

export class MessagesServiceImpl extends MessagesService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async createMessage(request: MessageCreateRequest): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MessageCreateRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Message", body.data) as Message;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async updateMessage(id: number, request: MessageUpdateRequest): Promise<Message> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("MessageUpdateRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Message", body.data) as Message;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly messages: MessagesService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; messages?: MessagesService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; messages?: MessagesService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.messages = new MessagesServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.messages = tokenOrConfig.messages ?? new MessagesServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { messages?: MessagesService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.messages = overrides.messages ?? new MessagesService();
    return client;
  }
}
