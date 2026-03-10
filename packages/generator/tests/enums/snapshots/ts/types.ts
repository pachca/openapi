export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

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

export enum ViewBlockHeaderType {
  /** Для заголовков всегда header */
  Header = "header",
}
