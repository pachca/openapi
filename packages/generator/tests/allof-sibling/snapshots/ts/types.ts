export interface BaseEntity {
  id: number;
  createdAt: string;
}

export interface Article {
  id: number;
  createdAt: string;
  title: string;
  body: string;
  isPublished?: boolean;
}
