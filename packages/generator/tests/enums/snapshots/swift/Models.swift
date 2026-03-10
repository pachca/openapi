import Foundation

public enum SortOrder: String, Codable, CaseIterable {
    case asc
    case desc
}

public enum UserRole: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мультиадмин
    case multiAdmin = "multi_admin"
    /// Бот
    case bot
}

public enum ViewBlockHeaderType: String, Codable, CaseIterable {
    /// Для заголовков всегда header
    case header
}
