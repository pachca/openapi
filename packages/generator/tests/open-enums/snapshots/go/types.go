package pachca

import (
	"encoding/json"
	"fmt"
	"strings"
)

type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc"
	SortOrderDesc SortOrder = "desc"
)

type MemberKind string

const (
	MemberKindRegular MemberKind = "regular"
	MemberKindGuest   MemberKind = "guest"
	MemberKindValue   MemberKind = "value"
)

// MemberRole may hold a value this SDK does not list yet: a response keeps it as is.
type MemberRole string

const (
	MemberRoleAdmin MemberRole = "admin" // Administrator
	MemberRoleUser  MemberRole = "user" // Member
)

// Region may hold a value this SDK does not list yet: a response keeps it as is.
type Region string

const (
	RegionEu Region = "eu"
	RegionUs Region = "us"
)

// MemberStatus may hold a value this SDK does not list yet: a response keeps it as is.
type MemberStatus string

const (
	MemberStatusActive    MemberStatus = "active"
	MemberStatusSuspended MemberStatus = "suspended"
	MemberStatusUnknown   MemberStatus = "unknown"
)

// ErrorCode may hold a value this SDK does not list yet: a response keeps it as is.
type ErrorCode string

const (
	ErrorCodeBlank ErrorCode = "blank"
	ErrorCodeTaken ErrorCode = "taken"
)

// OAuthErrorCode may hold a value this SDK does not list yet: a response keeps it as is.
type OAuthErrorCode string

const (
	OAuthErrorCodeInvalidToken      OAuthErrorCode = "invalid_token" // The token is missing or revoked
	OAuthErrorCodeInsufficientScope OAuthErrorCode = "insufficient_scope" // The token lacks the scope
)

// PayloadKind may hold a value this SDK does not list yet: a response keeps it as is.
type PayloadKind string

const (
	PayloadKindCreated PayloadKind = "created"
	PayloadKindValue   PayloadKind = "value"
)

type Member struct {
	ID               int32          `json:"id"`
	Role             MemberRole     `json:"role"`
	Status           MemberStatus   `json:"status"`
	PreviousStatuses []MemberStatus `json:"previous_statuses,omitempty"`
}

func (m Member) MarshalJSON() ([]byte, error) {
	type Alias Member
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.PreviousStatuses != nil {
		raw["previous_statuses"] = m.PreviousStatuses
	}
	return json.Marshal(raw)
}

type MemberUpdateRequest struct {
	Role *MemberRole `json:"role,omitempty"`
	Kind *MemberKind `json:"kind,omitempty"`
}

type MemberEventPayload struct {
	Kind PayloadKind `json:"kind"`
}

type ApiErrorItem struct {
	Key     string    `json:"key"`
	Message string    `json:"message"`
	Code    ErrorCode `json:"code"`
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
	Err              OAuthErrorCode `json:"error"`
	ErrorDescription string         `json:"error_description"`
}

func (e *OAuthError) Error() string {
	if e.Err != "" {
		return string(e.Err)
	}
	return "oauth error"
}

type ListMembersParams struct {
	Sort   *SortOrder
	Role   *MemberRole
	Roles  []MemberRole
	Region *Region
}

type ListMembersResponse struct {
	Data []Member `json:"data"`
}
