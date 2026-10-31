export enum FileType {
  File = "file",
  Image = "image",
  Voice = "voice",
}

export interface MessageFile {
  key: string;
  name: string;
  fileType: FileType;
  width?: number;
  height?: number;
  durationMs?: number;
  waveform?: string;
}

export interface UrlButton {
  text: string;
  url: string;
}

export interface DataButton {
  text: string;
  data: string;
}

export interface MessageCreateRequest {
  message: {
    entityId: number;
    content?: string;
    files?: MessageFile[];
    buttons?: Button[][];
    displayName?: string;
  };
  /** @default false */
  linkPreview?: boolean;
}

export interface MessageUpdateRequest {
  message: {
    content?: string;
    files?: MessageFile[];
  };
}

export interface Message {
  id: number;
  content: string;
}

export interface ApiErrorItem {
  key?: string;
  value?: string;
}

export class ApiError extends Error {
  errors: ApiErrorItem[];
  /** HTTP status code of the response. An answer with an empty body or one that is not JSON comes with `errors` empty. */
  status?: number;
  constructor(errors: ApiErrorItem[] = [], status?: number) {
    const list = errors ?? [];
    super(list.length ? list.map((e) => `${e.key}: ${e.value}`).join(", ") : status !== undefined ? `HTTP ${status}` : "");
    this.errors = list;
    this.status = status;
  }
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export type Button = UrlButton | DataButton;
