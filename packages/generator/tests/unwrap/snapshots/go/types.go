package pachca

import (
	"fmt"
	"strings"
	"time"
)

// AddMembersRequest represents a request to add members.
type AddMembersRequest struct {
	MemberIDs []int32 `json:"member_ids"`
}

// ChatCreateRequestChat represents chat data for creation.
type ChatCreateRequestChat struct {
	Name      string  `json:"name"`
	Channel   *bool   `json:"channel,omitempty"`
	Public    *bool   `json:"public,omitempty"`
	MemberIDs []int32 `json:"member_ids,omitempty"`
}

// ChatCreateRequest represents a request to create a chat.
type ChatCreateRequest struct {
	Chat ChatCreateRequestChat `json:"chat"`
}

// Chat represents a chat.
type Chat struct {
	ID        int32     `json:"id"`
	Name      string    `json:"name"`
	IsChannel bool      `json:"is_channel"`
	IsPublic  bool      `json:"is_public"`
	CreatedAt time.Time `json:"created_at"`
}

// ApiErrorItem represents an error item.
type ApiErrorItem struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

// ApiError represents an API error.
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

// OAuthError represents an OAuth error.
type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}
