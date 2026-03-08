export interface Metadata {
}

export interface Event {
  id: number;
  type: string;
  metadata?: Record<string, unknown>;
}
