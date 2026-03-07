/** Роль пользователя */
export enum UserRole {
  /** Администратор */
  Admin = "admin",
  /** Сотрудник */
  User = "user",
  /** Мультиадмин */
  MultiAdmin = "multi_admin",
  /** Бот */
  Bot = "bot",
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  botId: number | null;
  createdAt: string;
  birthday: string | null;
  tagIds: number[];
  customProperties?: CustomProperty[];
  status?: UserStatus;
}

export interface UserStatus {
  emoji?: string;
  title?: string;
  expiresAt?: string | null;
}

export interface CustomProperty {
  id: number;
  name: string;
  dataType: string;
  value: string;
}

export interface UserCreateRequest {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role?: UserRole;
    /** @default true */
    isActive?: boolean;
  };
}

export interface UserUpdateRequest {
  user: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string | null;
    role?: UserRole;
  };
}

export interface MessageCreateRequestFile {
  key: string;
  name: string;
  fileType: string;
  size: number;
}

export interface MessageCreateRequestButton {
  text: string;
  url?: string;
  data?: string;
}

export interface MessageCreateRequest {
  message: {
    entityId: number;
    content: string;
    files?: MessageCreateRequestFile[];
    buttons?: MessageCreateRequestButton[][];
  };
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

export interface PaginationMeta {
  paginate?: {
    nextPage?: string;
  };
}

export interface SearchPaginationMeta {
  total: number;
  paginate: {
    nextPage: string;
  };
}
