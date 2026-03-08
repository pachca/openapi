package pachca

import (
	"fmt"
	"strings"
	"time"
)

type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc"
	SortOrderDesc SortOrder = "desc"
)

type ChatAvailability string

const (
	ChatAvailabilityIsMember ChatAvailability = "is_member" // Чаты, где пользователь является участником
	ChatAvailabilityPublic   ChatAvailability = "public" // Все открытые чаты компании
)

type Chat struct {
	ID        int32     `json:"id"`
	Name      string    `json:"name"`
	IsChannel bool      `json:"is_channel"`
	IsPublic  bool      `json:"is_public"`
	CreatedAt time.Time `json:"created_at"`
	MemberIDs []int32   `json:"member_ids,omitempty"`
}

type ChatCreateRequestChat struct {
	Name      string  `json:"name"`
	Channel   *bool   `json:"channel,omitempty"`
	Public    *bool   `json:"public,omitempty"`
	MemberIDs []int32 `json:"member_ids,omitempty"`
}

type ChatCreateRequest struct {
	Chat ChatCreateRequestChat `json:"chat"`
}

type ChatUpdateRequestChat struct {
	Name   *string `json:"name,omitempty"`
	Public *bool   `json:"public,omitempty"`
}

type ChatUpdateRequest struct {
	Chat ChatUpdateRequestChat `json:"chat"`
}

type ApiErrorItem struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

type ApiError struct {
	Errors []ApiErrorItem `json:"errors,omitempty"`
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

type ListChatsParams struct {
	Availability *ChatAvailability
	Limit        *int32
	Cursor       *string
	SortField    *string
	SortOrder    *SortOrder
}

type ListChatsResponse struct {
	Data []Chat          `json:"data"`
	Meta *PaginationMeta `json:"meta,omitempty"`
}
