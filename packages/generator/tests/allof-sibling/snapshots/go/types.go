package pachca

import (
	"time"
)

type BaseEntity struct {
	ID        int32     `json:"id"`
	CreatedAt time.Time `json:"created_at"`
}

type Article struct {
	ID          int32     `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	Title       string    `json:"title"`
	Body        string    `json:"body"`
	IsPublished *bool     `json:"is_published,omitempty"`
}
