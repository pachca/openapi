export interface FileUploadRequest {
  contentDisposition: string;
  acl: string;
  policy: string;
  xAmzCredential: string;
  xAmzAlgorithm: string;
  xAmzDate: string;
  xAmzSignature: string;
  key: string;
  file: Blob;
}

export interface UploadParams {
  contentDisposition: string;
  acl: string;
  policy: string;
  xAmzCredential: string;
  xAmzAlgorithm: string;
  xAmzDate: string;
  xAmzSignature: string;
  key: string;
  directUrl: string;
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}
