package pachca

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type AddMembersRequest struct {
	MemberIDs []int32 `json:"member_ids"`
}

type ChatCreateRequestChat struct {
	Name      string  `json:"name"`
	Channel   *bool   `json:"channel,omitempty"`
	Public    *bool   `json:"public,omitempty"`
	MemberIDs []int32 `json:"member_ids,omitempty"`
}

func (m ChatCreateRequestChat) MarshalJSON() ([]byte, error) {
	type Alias ChatCreateRequestChat
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.MemberIDs != nil {
		raw["member_ids"] = m.MemberIDs
	}
	return json.Marshal(raw)
}

type ChatCreateRequest struct {
	Chat ChatCreateRequestChat `json:"chat"`
}

type Chat struct {
	ID        int32     `json:"id"`
	Name      string    `json:"name"`
	IsChannel bool      `json:"is_channel"`
	IsPublic  bool      `json:"is_public"`
	CreatedAt time.Time `json:"created_at"`
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
