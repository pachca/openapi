package pachca

type MessageResult struct {
	ID      int32  `json:"id"`
	Content string `json:"content"`
}

type PaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

type PaginationMeta struct {
	Paginate PaginationMetaPaginate `json:"paginate"`
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
	Query   string
	ChatIDs []int32
	UserIDs []int32
	Limit   *int32
	Cursor  *string
}

type SearchMessagesResponse struct {
	Data []MessageResult `json:"data"`
	Meta PaginationMeta  `json:"meta"`
}
