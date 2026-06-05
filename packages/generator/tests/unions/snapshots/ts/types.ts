export interface ViewBlockHeader {
  type: "header";
  text: string;
}

export interface ViewBlockPlainText {
  type: "plain_text";
  text: string;
}

export interface ViewBlockImage {
  type: "image";
  event: "image_shared";
  url: string;
  alt?: string;
}

export type ViewBlockUnion = ViewBlockHeader | ViewBlockPlainText | ViewBlockImage;
