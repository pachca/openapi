import { FileUploadRequest, OAuthError, UploadParams } from "./types";
import { deserialize, fetchWithRetry } from "./utils";

export class CommonService {
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

  async uploadFile(directUrl: string, request: FileUploadRequest): Promise<void> {
    const form = new FormData();
    form.set("content-disposition", request.contentDisposition);
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
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new Error(`HTTP ${response.status}`);
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
        return deserialize(body.data) as UploadParams;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
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
