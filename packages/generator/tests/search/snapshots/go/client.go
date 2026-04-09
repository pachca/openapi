package pachca

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type SearchService interface {
	SearchMessages(ctx context.Context, params SearchMessagesParams) (*SearchMessagesResponse, error)
	SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]MessageSearchResult, error)
}

type SearchServiceStub struct{}

func (s *SearchServiceStub) SearchMessages(ctx context.Context, params SearchMessagesParams) (*SearchMessagesResponse, error) {
	return nil, NotImplementedError{Method: "Search.searchMessages"}
}

func (s *SearchServiceStub) SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]MessageSearchResult, error) {
	return nil, NotImplementedError{Method: "Search.searchMessagesAll"}
}

type SearchServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *SearchServiceImpl) SearchMessages(ctx context.Context, params SearchMessagesParams) (*SearchMessagesResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/search/messages", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("query", fmt.Sprintf("%v", params.Query))
	for _, v := range params.ChatIDs {
		q.Add("chat_ids[]", fmt.Sprintf("%v", v))
	}
	for _, v := range params.UserIDs {
		q.Add("user_ids[]", fmt.Sprintf("%v", v))
	}
	if params.CreatedFrom != nil {
		q.Set("created_from", params.CreatedFrom.Format(time.RFC3339))
	}
	if params.CreatedTo != nil {
		q.Set("created_to", params.CreatedTo.Format(time.RFC3339))
	}
	if params.Sort != nil {
		q.Set("sort", string(*params.Sort))
	}
	if params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result SearchMessagesResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *SearchServiceImpl) SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]MessageSearchResult, error) {
	if params == nil {
		params = &SearchMessagesParams{}
	}
	var items []MessageSearchResult
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.SearchMessages(ctx, *params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

type PachcaClient struct {
	Search SearchService
}

type clientConfig struct {
	baseURL string
	search SearchService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	search SearchService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithSearch(service SearchService) ClientOption {
	return func(cfg *clientConfig) { cfg.search = service }
}

func WithStubSearch(service SearchService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.search = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: DefaultBaseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var search SearchService = &SearchServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.search != nil {
		search = cfg.search
	}
	return &PachcaClient{
		Search: search,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var search SearchService = &SearchServiceStub{}
	if cfg.search != nil {
		search = cfg.search
	}
	return &PachcaClient{
		Search: search,
	}
}
