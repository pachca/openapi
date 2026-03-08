import { FileUploadRequest, OAuthError, UploadParams } from "./types";
import { deserialize } from "./utils";

class CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

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
    form.set("file", request.file);
    const response = await fetch(directUrl, {
      method: "POST",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 201:
        return;
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new Error(`HTTP ${response.status}`);
    }
  }

  async getUploadParams(): Promise<UploadParams> {
    const response = await fetch(`${this.baseUrl}/uploads`, {
      method: "POST",
      headers: this.headers,
    });
    const body: any = await response.json();
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

export class PachcaClient {
  readonly common: CommonService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1") {
    const headers = { Authorization: `Bearer ${token}` };
    this.common = new CommonService(baseUrl, headers);
  }
}
