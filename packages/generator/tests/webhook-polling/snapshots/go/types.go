package pachca

import (
	"encoding/json"
	"fmt"
	"time"
)

type WebhookEvent struct {
	ID        string              `json:"id"`
	EventType string              `json:"event_type"`
	Payload   WebhookPayloadUnion `json:"payload"`
	CreatedAt time.Time           `json:"created_at"`
}

type MessageWebhookPayload struct {
	Type      string `json:"type"` // always "message_new"
	MessageID int32  `json:"message_id"`
}

type ReactionWebhookPayload struct {
	Type     string `json:"type"` // always "reaction_added"
	Reaction string `json:"reaction"`
}

type PaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
	HasNext  *bool  `json:"has_next,omitempty"`
}

type PaginationMeta struct {
	Paginate PaginationMetaPaginate `json:"paginate"`
}

type WebhookPayloadUnion struct {
	MessageWebhookPayload  *MessageWebhookPayload
	ReactionWebhookPayload *ReactionWebhookPayload
}

func (u *WebhookPayloadUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "message_new":
		u.MessageWebhookPayload = &MessageWebhookPayload{}
		return json.Unmarshal(data, u.MessageWebhookPayload)
	case "reaction_added":
		u.ReactionWebhookPayload = &ReactionWebhookPayload{}
		return json.Unmarshal(data, u.ReactionWebhookPayload)
	default:
		return fmt.Errorf("unknown WebhookPayloadUnion type: %s", disc.Type)
	}
}

func (u WebhookPayloadUnion) MarshalJSON() ([]byte, error) {
	if u.MessageWebhookPayload != nil {
		return json.Marshal(u.MessageWebhookPayload)
	}
	if u.ReactionWebhookPayload != nil {
		return json.Marshal(u.ReactionWebhookPayload)
	}
	return nil, fmt.Errorf("empty WebhookPayloadUnion")
}

type GetWebhookEventsParams struct {
	Limit  *int32
	Cursor *string
}

type GetWebhookEventsResponse struct {
	Data []WebhookEvent `json:"data"`
	Meta PaginationMeta `json:"meta"`
}
