package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
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

type MembersService interface {
	AddMembers(ctx context.Context, id int32, memberIds []int32) error
}

type MembersServiceStub struct{}

func (s *MembersServiceStub) AddMembers(ctx context.Context, id int32, memberIds []int32) error {
	return NotImplementedError{Method: "Members.addMembers"}
}

type MembersServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *MembersServiceImpl) AddMembers(ctx context.Context, id int32, memberIds []int32) error {
	body, err := json.Marshal(map[string]any{"member_ids": memberIds})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats/%v/members", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
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

type ChatsService interface {
	CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error)
	ArchiveChat(ctx context.Context, id int32) error
}

type ChatsServiceStub struct{}

func (s *ChatsServiceStub) CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.createChat"}
}

func (s *ChatsServiceStub) ArchiveChat(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Chats.archiveChat"}
}

type ChatsServiceImpl struct {
	baseURL string
	client  *http.Client
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

type PachcaClient struct {
	Chats   ChatsService
	Members MembersService
}

type clientConfig struct {
	baseURL string
	chats ChatsService
	members MembersService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	chats ChatsService
	members MembersService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithChats(service ChatsService) ClientOption {
	return func(cfg *clientConfig) { cfg.chats = service }
}

func WithMembers(service MembersService) ClientOption {
	return func(cfg *clientConfig) { cfg.members = service }
}

func WithStubChats(service ChatsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.chats = service }
}

func WithStubMembers(service MembersService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.members = service }
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
		Chats  : func() ChatsService { if cfg.chats != nil { return cfg.chats }; return &ChatsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Members: func() MembersService { if cfg.members != nil { return cfg.members }; return &MembersServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Chats  : func() ChatsService { if cfg.chats != nil { return cfg.chats }; return &ChatsServiceStub{} }(),
		Members: func() MembersService { if cfg.members != nil { return cfg.members }; return &MembersServiceStub{} }(),
	}
}
