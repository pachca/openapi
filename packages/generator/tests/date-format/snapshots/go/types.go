package pachca

import (
	"time"
)

type ExportRequest struct {
	StartAt    string `json:"start_at"`
	EndAt      string `json:"end_at"`
	WebhookURL string `json:"webhook_url"`
}

type Export struct {
	ID        int32     `json:"id"`
	StartAt   string    `json:"start_at"`
	EndAt     string    `json:"end_at"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Event struct {
	ID         int32     `json:"id"`
	Type       string    `json:"type"`
	OccurredAt time.Time `json:"occurred_at"`
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

type ListEventsParams struct {
	DateFrom     string
	DateTo       *string
	CreatedAfter *time.Time
	Limit        *int32
}

type ListEventsResponse struct {
	Data []Event `json:"data"`
}
