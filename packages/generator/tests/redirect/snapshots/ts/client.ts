import { OAuthError, ApiError } from "./types";

class CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async downloadExport(id: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/exports/${id}`, {
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
        throw new OAuthError((await response.json()).error);
      default:
        throw new ApiError((await response.json()).errors);
    }
  }
}

export class PachcaClient {
  readonly common: CommonService;

  constructor(baseUrl: string, token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    this.common = new CommonService(baseUrl, headers);
  }
}
