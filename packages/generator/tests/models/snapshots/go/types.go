package pachca

import (
	"fmt"
	"strings"
	"time"
)

// UserRole represents user role.
type UserRole string

const (
	UserRoleAdmin      UserRole = "admin"       // Администратор
	UserRoleUser       UserRole = "user"        // Сотрудник
	UserRoleMultiAdmin UserRole = "multi_admin" // Мультиадмин
	UserRoleBot        UserRole = "bot"         // Бот
)

// User represents a user.
type User struct {
	ID               int32            `json:"id"`
	FirstName        string           `json:"first_name"`
	LastName         string           `json:"last_name"`
	Email            string           `json:"email"`
	PhoneNumber      *string          `json:"phone_number"`
	Role             UserRole         `json:"role"`
	IsActive         bool             `json:"is_active"`
	BotID            *int64           `json:"bot_id"`
	CreatedAt        time.Time        `json:"created_at"`
	Birthday         *string          `json:"birthday"`
	TagIDs           []int32          `json:"tag_ids"`
	CustomProperties []CustomProperty `json:"custom_properties,omitempty"`
	Status           *UserStatus      `json:"status,omitempty"`
}

// UserStatus represents user status.
type UserStatus struct {
	Emoji     *string `json:"emoji,omitempty"`
	Title     *string `json:"title,omitempty"`
	ExpiresAt *string `json:"expires_at,omitempty"`
}

// CustomProperty represents a custom property.
type CustomProperty struct {
	ID       int32  `json:"id"`
	Name     string `json:"name"`
	DataType string `json:"data_type"`
	Value    string `json:"value"`
}

// UserCreateRequestUser contains user creation data.
type UserCreateRequestUser struct {
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Role      *UserRole `json:"role,omitempty"`
	IsActive  *bool     `json:"is_active,omitempty"`
}

// UserCreateRequest is the request to create a user.
type UserCreateRequest struct {
	User UserCreateRequestUser `json:"user"`
}

// UserUpdateRequestUser contains user update data.
type UserUpdateRequestUser struct {
	FirstName   *string   `json:"first_name,omitempty"`
	LastName    *string   `json:"last_name,omitempty"`
	PhoneNumber *string   `json:"phone_number,omitempty"`
	Role        *UserRole `json:"role,omitempty"`
}

// UserUpdateRequest is the request to update a user.
type UserUpdateRequest struct {
	User UserUpdateRequestUser `json:"user"`
}

// MessageCreateRequestFile represents an attached file.
type MessageCreateRequestFile struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	FileType string `json:"file_type"`
	Size     int32  `json:"size"`
}

// MessageCreateRequestButton represents a button.
type MessageCreateRequestButton struct {
	Text string  `json:"text"`
	URL  *string `json:"url,omitempty"`
	Data *string `json:"data,omitempty"`
}

// MessageCreateRequestMessage contains message data.
type MessageCreateRequestMessage struct {
	EntityID int32                          `json:"entity_id"`
	Content  string                         `json:"content"`
	Files    []MessageCreateRequestFile     `json:"files,omitempty"`
	Buttons  [][]MessageCreateRequestButton `json:"buttons,omitempty"`
}

// MessageCreateRequest is the request to create a message.
type MessageCreateRequest struct {
	Message MessageCreateRequestMessage `json:"message"`
}

// ApiErrorItem represents a single error.
type ApiErrorItem struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

// ApiError represents an API error response.
type ApiError struct {
	Errors []ApiErrorItem `json:"errors,omitempty"`
}

func (e *ApiError) Error() string {
	if len(e.Errors) == 0 {
		return "api error"
	}
	parts := make([]string, 0, len(e.Errors))
	for _, item := range e.Errors {
		if item.Key != nil && item.Value != nil {
			parts = append(parts, fmt.Sprintf("%s: %s", *item.Key, *item.Value))
		}
	}
	if len(parts) == 0 {
		return "api error"
	}
	return strings.Join(parts, ", ")
}

// OAuthError represents an OAuth error response.
type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}

// PaginationMetaPaginate contains pagination cursor.
type PaginationMetaPaginate struct {
	NextPage *string `json:"next_page,omitempty"`
}

// PaginationMeta contains pagination metadata.
type PaginationMeta struct {
	Paginate *PaginationMetaPaginate `json:"paginate,omitempty"`
}

// SearchPaginationMetaPaginate contains search pagination cursor.
type SearchPaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

// SearchPaginationMeta contains search pagination metadata.
type SearchPaginationMeta struct {
	Total    int32                        `json:"total"`
	Paginate SearchPaginationMetaPaginate `json:"paginate"`
}
