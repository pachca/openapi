export interface ExportRequest {
  startAt: string;
  endAt: string;
  webhookUrl: string;
}

export interface Export {
  id: number;
  startAt: string;
  endAt: string;
  status: string;
  createdAt: string;
}

export interface Event {
  id: number;
  type: string;
  occurredAt: string;
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export interface ListEventsParams {
  dateFrom: string;
  dateTo?: string;
  createdAfter?: string;
  limit?: number;
}

export interface ListEventsResponse {
  data: Event[];
}
