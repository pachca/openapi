export interface FileUploadRequest {
  contentDisposition?: string;
  acl?: string;
  policy?: string;
  xAmzCredential?: string;
  xAmzAlgorithm?: string;
  xAmzDate?: string;
  xAmzSignature?: string;
  key: string;
  file: File | Blob;
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}
