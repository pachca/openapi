export interface LinkPreview {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface LinkPreviewsRequest {
  linkPreviews: Record<string, LinkPreview>;
}

export interface ApiErrorItem {
  key?: string;
  value?: string;
}

export class ApiError extends Error {
  errors?: ApiErrorItem[];
  constructor(errors?: ApiErrorItem[]) {
    super(errors?.map((e) => `${e.key}: ${e.value}`).join(", "));
    this.errors = errors;
  }
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}
