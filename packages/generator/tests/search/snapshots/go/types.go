package pachca

import (
	"time"
)

type SearchSort string

const (
	SearchSortRelevance SearchSort = "relevance" // По релевантности
	SearchSortDate      SearchSort = "date" // По дате
)

type MessageSearchResult struct {
	ID        int32     `json:"id"`
	ChatID    int32     `json:"chat_id"`
	UserID    int32     `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type SearchPaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

type SearchPaginationMeta struct {
	Total    int32                        `json:"total"`
	Paginate SearchPaginationMetaPaginate `json:"paginate"`
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

type SearchMessagesResponse struct {
	Data []MessageSearchResult `json:"data"`
	Meta SearchPaginationMeta  `json:"meta"`
}
