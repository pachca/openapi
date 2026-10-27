import { OAuthError, ApiError } from "./types.js";
import { fetchWithRetry } from "./utils.js";

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

export class CommonService {
  async downloadExport(id: number): Promise<string> {
    throw new Error("Common.downloadExport is not implemented");
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
    const response = await fetchWithRetry(`${this.baseUrl}/exports/${id}`, {
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
      default:
        throw await errorFromResponse(response);
    }
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly common: CommonService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; common?: CommonService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; common?: CommonService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.common = new CommonServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.common = tokenOrConfig.common ?? new CommonServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { common?: CommonService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.common = overrides.common ?? new CommonService();
    return client;
  }
}
