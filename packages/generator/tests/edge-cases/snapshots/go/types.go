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
	File               io.Reader `json:"file"`
	ContentDisposition string    `json:"Content-Disposition"`
}

type Notification struct {
	Kind string `json:"kind"`
}

type MessageNotification struct {
	Kind string `json:"kind"` // always "message"
	Text string `json:"text"`
}

type ReactionNotification struct {
	Kind  string `json:"kind"` // always "message"
	Emoji string `json:"emoji"`
}

type NotificationUnion struct {
	MessageNotification  *MessageNotification
	ReactionNotification *ReactionNotification
}

func (u *NotificationUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Kind string `json:"kind"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Kind {
	case "message":
		u.MessageNotification = &MessageNotification{}
		return json.Unmarshal(data, u.MessageNotification)
	default:
		return fmt.Errorf("unknown NotificationUnion kind: %s", disc.Kind)
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
