package pachca

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type UserRole string

const (
	UserRoleAdmin      UserRole = "admin" // Администратор
	UserRoleUser       UserRole = "user" // Сотрудник
	UserRoleMultiAdmin UserRole = "multi_admin" // Мультиадмин
	UserRoleBot        UserRole = "bot" // Бот
)

type User struct {
	ID               int32            `json:"id"`
	FirstName        string           `json:"first_name"`
	LastName         string           `json:"last_name"`
	Email            string           `json:"email"`
	Role             UserRole         `json:"role"`
	IsActive         bool             `json:"is_active"`
	CreatedAt        time.Time        `json:"created_at"`
	TagIDs           []int32          `json:"tag_ids"`
	PhoneNumber      *string          `json:"phone_number"`
	BotID            *int64           `json:"bot_id"`
	Birthday         *string          `json:"birthday"`
	CustomProperties []CustomProperty `json:"custom_properties,omitempty"`
	Status           *UserStatus      `json:"status,omitempty"`
}

func (m User) MarshalJSON() ([]byte, error) {
	type Alias User
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.CustomProperties != nil {
		raw["custom_properties"] = m.CustomProperties
	}
	return json.Marshal(raw)
}

type UserStatus struct {
	Emoji     *string `json:"emoji,omitempty"`
	Title     *string `json:"title,omitempty"`
	ExpiresAt *string `json:"expires_at"`
}

type CustomProperty struct {
	ID       int32  `json:"id"`
	Name     string `json:"name"`
	DataType string `json:"data_type"`
	Value    string `json:"value"`
}

type UserCreateRequestUser struct {
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Role      *UserRole `json:"role,omitempty"`
	IsActive  *bool     `json:"is_active,omitempty"`
}

type UserCreateRequest struct {
	User UserCreateRequestUser `json:"user"`
}

type UserUpdateRequestUser struct {
	FirstName   *string   `json:"first_name,omitempty"`
	LastName    *string   `json:"last_name,omitempty"`
	PhoneNumber *string   `json:"phone_number"`
	Role        *UserRole `json:"role,omitempty"`
}

type UserUpdateRequest struct {
	User UserUpdateRequestUser `json:"user"`
}

type MessageCreateRequestFile struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	FileType string `json:"file_type"`
	Size     int32  `json:"size"`
}

type MessageCreateRequestButton struct {
	Text string  `json:"text"`
	URL  *string `json:"url,omitempty"`
	Data *string `json:"data,omitempty"`
}

type MessageCreateRequestMessage struct {
	EntityID int32                          `json:"entity_id"`
	Content  string                         `json:"content"`
	Files    []MessageCreateRequestFile     `json:"files,omitempty"`
	Buttons  [][]MessageCreateRequestButton `json:"buttons,omitempty"`
}

func (m MessageCreateRequestMessage) MarshalJSON() ([]byte, error) {
	type Alias MessageCreateRequestMessage
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Files != nil {
		raw["files"] = m.Files
	}
	if m.Buttons != nil {
		raw["buttons"] = m.Buttons
	}
	return json.Marshal(raw)
}

type MessageCreateRequest struct {
	Message MessageCreateRequestMessage `json:"message"`
}

type ApiErrorItem struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

type ApiError struct {
	Errors []ApiErrorItem `json:"errors,omitempty"`
}

func (m ApiError) MarshalJSON() ([]byte, error) {
	type Alias ApiError
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Errors != nil {
		raw["errors"] = m.Errors
	}
	return json.Marshal(raw)
}

func (e *ApiError) Error() string {
	if len(e.Errors) == 0 {
		return "api error"
	}
	parts := make([]string, 0, len(e.Errors))
	for _, item := range e.Errors {
		parts = append(parts, fmt.Sprintf("%+v", item))
	}
	if len(parts) == 0 {
		return "api error"
	}
	return strings.Join(parts, ", ")
}

type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}

type PaginationMetaPaginate struct {
	NextPage *string `json:"next_page,omitempty"`
}

type PaginationMeta struct {
	Paginate *PaginationMetaPaginate `json:"paginate,omitempty"`
}

type SearchPaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

type SearchPaginationMeta struct {
	Total    int32                        `json:"total"`
	Paginate SearchPaginationMetaPaginate `json:"paginate"`
}
