package pachca

import (
	"bytes"
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

type ChatsService interface {
	ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error)
	ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error)
	GetChat(ctx context.Context, id int32) (*Chat, error)
	CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error)
	UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error)
	ArchiveChat(ctx context.Context, id int32) error
	DeleteChat(ctx context.Context, id int32) error
}

type ChatsServiceStub struct{}

func (s *ChatsServiceStub) ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error) {
	return nil, NotImplementedError{Method: "Chats.listChats"}
}

func (s *ChatsServiceStub) ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error) {
	return nil, NotImplementedError{Method: "Chats.listChatsAll"}
}

func (s *ChatsServiceStub) GetChat(ctx context.Context, id int32) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.getChat"}
}

func (s *ChatsServiceStub) CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.createChat"}
}

func (s *ChatsServiceStub) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.updateChat"}
}

func (s *ChatsServiceStub) ArchiveChat(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Chats.archiveChat"}
}

func (s *ChatsServiceStub) DeleteChat(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Chats.deleteChat"}
}

type ChatsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ChatsServiceImpl) ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/chats", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Availability != nil {
		q.Set("availability", string(*params.Availability))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	if params != nil && params.SortField != nil {
		q.Set("sort[field]", fmt.Sprintf("%v", *params.SortField))
	}
	if params != nil && params.SortOrder != nil {
		q.Set("sort[order]", string(*params.SortOrder))
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
		var result ListChatsResponse
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
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error) {
	if params == nil {
		params = &ListChatsParams{}
	}
	var items []Chat
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListChats(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 || result.Meta == nil {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *ChatsServiceImpl) GetChat(ctx context.Context, id int32) (*Chat, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/chats/%v", s.baseURL, id), nil)
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
		var result struct {
			Data Chat `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data Chat `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Chat `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) ArchiveChat(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%v/archive", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *ChatsServiceImpl) DeleteChat(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/chats/%v", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type PachcaClient struct {
	Chats ChatsService
}

type clientConfig struct {
	baseURL string
	chats ChatsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	chats ChatsService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithChats(service ChatsService) ClientOption {
	return func(cfg *clientConfig) { cfg.chats = service }
}

func WithStubChats(service ChatsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.chats = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: DefaultBaseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Chats: func() ChatsService { if cfg.chats != nil { return cfg.chats }; return &ChatsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Chats: func() ChatsService { if cfg.chats != nil { return cfg.chats }; return &ChatsServiceStub{} }(),
	}
}
