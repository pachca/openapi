import { FileUploadRequest, OAuthError } from "./types";

class CommonService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async uploadFile(request: FileUploadRequest): Promise<void> {
    const form = new FormData();
    if (request.contentDisposition !== undefined) form.set("content-disposition", request.contentDisposition);
    if (request.acl !== undefined) form.set("acl", request.acl);
    if (request.policy !== undefined) form.set("policy", request.policy);
    if (request.xAmzCredential !== undefined) form.set("x-amz-credential", request.xAmzCredential);
    if (request.xAmzAlgorithm !== undefined) form.set("x-amz-algorithm", request.xAmzAlgorithm);
    if (request.xAmzDate !== undefined) form.set("x-amz-date", request.xAmzDate);
    if (request.xAmzSignature !== undefined) form.set("x-amz-signature", request.xAmzSignature);
    form.set("key", request.key);
    form.set("file", request.file);
    const response = await fetch(`${this.baseUrl}/uploads`, {
      method: "POST",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 201:
        return;
      case 401:
        throw new OAuthError((await response.json()).error);
      default:
        throw new Error(`HTTP ${response.status}`);
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
