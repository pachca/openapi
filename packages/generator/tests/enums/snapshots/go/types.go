package pachca

// SortOrder represents sort order.
type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc"
	SortOrderDesc SortOrder = "desc"
)

// UserRole represents user role.
type UserRole string

const (
	UserRoleAdmin      UserRole = "admin"       // Администратор
	UserRoleUser       UserRole = "user"        // Сотрудник
	UserRoleMultiAdmin UserRole = "multi_admin" // Мультиадмин
	UserRoleBot        UserRole = "bot"         // Бот
)

// ViewBlockHeaderType represents block type.
type ViewBlockHeaderType string

const (
	ViewBlockHeaderTypeHeader ViewBlockHeaderType = "header" // Для заголовков всегда header
)
