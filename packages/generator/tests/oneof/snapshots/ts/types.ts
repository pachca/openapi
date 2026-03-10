export interface TextContent {
  kind: "text";
  text: string;
}

export interface ImageContent {
  kind: "image";
  url: string;
  caption?: string;
}

export interface VideoContent {
  kind: "video";
  url: string;
  duration?: number;
}

export type ContentBlock = TextContent | ImageContent | VideoContent;
