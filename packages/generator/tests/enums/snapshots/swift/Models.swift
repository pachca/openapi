import Foundation

enum SortOrder: String, Codable, CaseIterable {
    case asc
    case desc
}

/// Роль пользователя
enum UserRole: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мультиадмин
    case multiAdmin = "multi_admin"
    /// Бот
    case bot
}

enum ViewBlockHeaderType: String, Codable, CaseIterable {
    /// Для заголовков всегда header
    case header
}
