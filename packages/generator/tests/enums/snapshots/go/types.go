package pachca

// SortOrder may hold a value this SDK does not list yet: a response keeps it as is.
type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc"
	SortOrderDesc SortOrder = "desc"
)

// UserRole may hold a value this SDK does not list yet: a response keeps it as is.
type UserRole string

const (
	UserRoleAdmin      UserRole = "admin" // Администратор
	UserRoleUser       UserRole = "user" // Сотрудник
	UserRoleMultiAdmin UserRole = "multi_admin" // Мультиадмин
	UserRoleBot        UserRole = "bot" // Бот
)

// ViewBlockHeaderType may hold a value this SDK does not list yet: a response keeps it as is.
type ViewBlockHeaderType string

const (
	ViewBlockHeaderTypeHeader ViewBlockHeaderType = "header" // Для заголовков всегда header
)
