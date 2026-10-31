package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// errorFromResponse reads an error answer. Its body is either {"errors": [...]} or
// the OAuth form {"error", "error_description"}, which also comes with 400 and 403
// (insufficient_scope, invalid_grant): the body decides the type. An empty body or
// one that is not JSON (a 404 without a body, a proxy page) gives an ApiError with
// no errors. The status code stays in StatusCode.
func errorFromResponse(resp *http.Response) error {
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
	}
	var probe struct {
		Errors json.RawMessage `json:"errors"`
		Error  *string         `json:"error"`
	}
	if json.Unmarshal(data, &probe) == nil && probe.Errors == nil && probe.Error != nil {
		var e OAuthError
		if err := json.Unmarshal(data, &e); err == nil {
			return &e
		}
	}
	var e ApiError
	if json.Unmarshal(data, &e) != nil {
		e = ApiError{}
	}
	e.StatusCode = resp.StatusCode
	return &e
}

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type ChatsService interface {
	GetChat(ctx context.Context, id int32) (*Chat, error)
	CreateChat(ctx context.Context, request ChatCreateRequest) (*CreateChatResponse, error)
	UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*UpdateChatResponse, error)
}

type ChatsServiceStub struct{}

func (s *ChatsServiceStub) GetChat(ctx context.Context, id int32) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.getChat"}
}

func (s *ChatsServiceStub) CreateChat(ctx context.Context, request ChatCreateRequest) (*CreateChatResponse, error) {
	return nil, NotImplementedError{Method: "Chats.createChat"}
}

func (s *ChatsServiceStub) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*UpdateChatResponse, error) {
	return nil, NotImplementedError{Method: "Chats.updateChat"}
}

type ChatsServiceImpl struct {
	baseURL string
	client  *http.Client
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
	default:
		return nil, errorFromResponse(resp)
	}
}

func (s *ChatsServiceImpl) CreateChat(ctx context.Context, request ChatCreateRequest) (*CreateChatResponse, error) {
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
		var result CreateChatResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, errorFromResponse(resp)
	}
}

func (s *ChatsServiceImpl) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*UpdateChatResponse, error) {
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
		var result UpdateChatResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, errorFromResponse(resp)
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

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

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
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var chats ChatsService = &ChatsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.chats != nil {
		chats = cfg.chats
	}
	return &PachcaClient{
		Chats: chats,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var chats ChatsService = &ChatsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.chats != nil {
		chats = cfg.chats
	}
	return &PachcaClient{
		Chats: chats,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var chats ChatsService = &ChatsServiceStub{}
	if cfg.chats != nil {
		chats = cfg.chats
	}
	return &PachcaClient{
		Chats: chats,
	}
}
