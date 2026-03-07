package pachca

import "time"

// SearchSort represents search sort order.
type SearchSort string

const (
	SearchSortRelevance SearchSort = "relevance" // По релевантности
	SearchSortDate      SearchSort = "date"      // По дате
)

// MessageSearchResult represents a message search result.
type MessageSearchResult struct {
	ID        int32     `json:"id"`
	ChatID    int32     `json:"chat_id"`
	UserID    int32     `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// SearchPaginationMetaPaginate represents search pagination info.
type SearchPaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

// SearchPaginationMeta represents search pagination metadata.
type SearchPaginationMeta struct {
	Total    int32                        `json:"total"`
	Paginate SearchPaginationMetaPaginate `json:"paginate"`
}

// OAuthError represents an OAuth error.
type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}

// SearchMessagesParams represents query parameters for searching messages.
type SearchMessagesParams struct {
	Query       string
	ChatIDs     []int32
	UserIDs     []int32
	CreatedFrom *time.Time
	CreatedTo   *time.Time
	Sort        *SearchSort
	Limit       *int32
	Cursor      *string
}

// SearchMessagesResponse represents the response for searching messages.
type SearchMessagesResponse struct {
	Data []MessageSearchResult `json:"data"`
	Meta SearchPaginationMeta  `json:"meta"`
}
