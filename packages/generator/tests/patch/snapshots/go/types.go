package pachca

import (
	"fmt"
	"strings"
)

type Item struct {
	ID          int32   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Priority    *int32  `json:"priority,omitempty"`
}

type ItemPatchRequestItem struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description"`
	Priority    *int32  `json:"priority,omitempty"`
}

type ItemPatchRequest struct {
	Item ItemPatchRequestItem `json:"item"`
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
