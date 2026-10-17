/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

/**
 * Роль пользователя
 *
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
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

/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum ViewBlockHeaderType {
  /** Для заголовков всегда header */
  Header = "header",
}
