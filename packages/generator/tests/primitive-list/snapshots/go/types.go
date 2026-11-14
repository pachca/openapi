package pachca

import (
	"fmt"
	"strings"
)

type PaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

type PaginationMeta struct {
	Paginate PaginationMetaPaginate `json:"paginate"`
}

type ApiErrorItem struct {
	Message string  `json:"message"`
	Key     *string `json:"key,omitempty"`
}

type ApiError struct {
	Errors     []ApiErrorItem `json:"errors"`
	StatusCode int            `json:"-"` // HTTP status code of the answer
}

func (e *ApiError) Error() string {
	if len(e.Errors) == 0 {
		if e.StatusCode != 0 {
			return fmt.Sprintf("HTTP %d", e.StatusCode)
		}
		return "api error"
	}
	parts := make([]string, 0, len(e.Errors))
	for _, item := range e.Errors {
		parts = append(parts, item.Message)
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

type ListReadMembersParams struct {
	Limit  *int32
	Cursor *string
}

type ListReadMembersResponse struct {
	Data []int32        `json:"data"`
	Meta PaginationMeta `json:"meta"`
}
