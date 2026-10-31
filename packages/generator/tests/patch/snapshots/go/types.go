package pachca

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Item struct {
	ID          int32   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	Priority    *int32  `json:"priority,omitempty"`
}

type ItemPatchRequestItem struct {
	Name        *string  `json:"name,omitempty"`
	Description *string  `json:"description,omitempty"`
	Priority    *int32   `json:"priority,omitempty"`
	NullFields  []string `json:"-"` // fields to send as null: Description
}

// MarshalJSON leaves out every optional field that is not set. A field named
// in NullFields goes out as null, whatever value it holds.
func (m ItemPatchRequestItem) MarshalJSON() ([]byte, error) {
	type Alias ItemPatchRequestItem
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	for _, name := range m.NullFields {
		switch name {
		case "Description":
			raw["description"] = json.RawMessage("null")
		default:
			return nil, fmt.Errorf("ItemPatchRequestItem: field %q cannot be sent as null", name)
		}
	}
	return json.Marshal(raw)
}

type ItemPatchRequest struct {
	Item ItemPatchRequestItem `json:"item"`
}

type ApiErrorItem struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

type ApiError struct {
	Errors     []ApiErrorItem `json:"errors,omitempty"`
	StatusCode int            `json:"-"` // HTTP status code of the answer
}

func (m ApiError) MarshalJSON() ([]byte, error) {
	type Alias ApiError
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Errors != nil {
		if raw["errors"], err = json.Marshal(m.Errors); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
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
		parts = append(parts, fmt.Sprintf("%+v", item))
	}
	if len(parts) == 0 {
		return "api error"
	}
	return strings.Join(parts, ", ")
}
