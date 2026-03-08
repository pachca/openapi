package pachca

import (
	"encoding/json"
	"fmt"
	"io"
)

type OAuthScope string

const (
	OAuthScopeChatsRead  OAuthScope = "chats:read"
	OAuthScopeChatsWrite OAuthScope = "chats:write"
	OAuthScopeUsersRead  OAuthScope = "users:read"
	OAuthScopeUsersWrite OAuthScope = "users:write"
)

type EventType string

const (
	EventTypeMessage  EventType = "message"
	EventTypeReaction EventType = "reaction"
)

type EventFilter struct {
}

type Event struct {
	ID   int32     `json:"id"`
	Type EventType `json:"type"`
}

type PublishEventRequest struct {
	Scope OAuthScope `json:"scope"`
}

type UploadRequest struct {
	File                io.Reader `json:"file"`
	Content_Disposition string    `json:"Content-Disposition"`
}

type Notification struct {
	Kind string `json:"kind"`
}

type MessageNotification struct {
}

type ReactionNotification struct {
}

type NotificationUnion struct {
	MessageNotification  *MessageNotification
	ReactionNotification *ReactionNotification
}

func (u *NotificationUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "MessageNotification":
		u.MessageNotification = &MessageNotification{}
		return json.Unmarshal(data, u.MessageNotification)
	case "ReactionNotification":
		u.ReactionNotification = &ReactionNotification{}
		return json.Unmarshal(data, u.ReactionNotification)
	default:
		return fmt.Errorf("unknown NotificationUnion type: %s", disc.Type)
	}
}

func (u NotificationUnion) MarshalJSON() ([]byte, error) {
	if u.MessageNotification != nil {
		return json.Marshal(u.MessageNotification)
	}
	if u.ReactionNotification != nil {
		return json.Marshal(u.ReactionNotification)
	}
	return nil, fmt.Errorf("empty NotificationUnion")
}

type ListEventsParams struct {
	IsActive *bool
	Scopes   []OAuthScope
	Filter   *EventFilter
}

type ListEventsResponse struct {
	Data []Event `json:"data"`
}
