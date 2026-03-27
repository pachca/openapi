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

  override async downloadExport(id: number): Promise<string> {
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

export interface PachcaClientOptions {
  token: string;
  baseUrl?: string;
  common?: CommonService;
}

export class PachcaClient {
  readonly common: CommonService;

  constructor(options: PachcaClientOptions) {
    const { token } = options;
    const baseUrl = options.baseUrl ?? "https://api.pachca.com/api/shared/v1";
    const headers = { Authorization: `Bearer ${token}` };
    this.common = options.common ?? new CommonServiceImpl(baseUrl, headers);
  }

  static stub(options: Partial<PachcaClientOptions> = {}): PachcaClient {
    return new PachcaClient({ token: options.token ?? "", baseUrl: options.baseUrl ?? "https://api.pachca.com/api/shared/v1",
      common: options.common ?? new CommonService(),
    });
  }
}
