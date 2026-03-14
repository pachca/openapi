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
  url: string;
  alt?: string;
}

export type ViewBlockUnion = ViewBlockHeader | ViewBlockPlainText | ViewBlockImage;
