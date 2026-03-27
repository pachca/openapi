import { OAuthError, ApiError } from "./types";
import { fetchWithRetry } from "./utils";

export abstract class CommonService {
  async downloadExport(id: number): Promise<string> {
    throw new Error("Common.downloadExport is not implemented");
  }
}

export class CommonServiceImpl extends CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

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

export interface PachcaServices {
  common?: CommonService;
}

export class PachcaClient {
  readonly common: CommonService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1", services: PachcaServices = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    this.common = services.common ?? new CommonServiceImpl(baseUrl, headers);
  }
}
