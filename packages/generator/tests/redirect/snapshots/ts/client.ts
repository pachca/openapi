import { OAuthError, ApiError } from "./types";
import { fetchWithRetry } from "./utils";

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
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
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

  static stub(common: CommonService = new CommonService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.common = common;
    return client;
  }
}
