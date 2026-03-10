package pachca

type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc"
	SortOrderDesc SortOrder = "desc"
)

type UserRole string

const (
	UserRoleAdmin      UserRole = "admin" // Администратор
	UserRoleUser       UserRole = "user" // Сотрудник
	UserRoleMultiAdmin UserRole = "multi_admin" // Мультиадмин
	UserRoleBot        UserRole = "bot" // Бот
)

type ViewBlockHeaderType string

const (
	ViewBlockHeaderTypeHeader ViewBlockHeaderType = "header" // Для заголовков всегда header
)
