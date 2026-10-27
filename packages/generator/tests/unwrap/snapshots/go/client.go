package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
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
	default:
		return errorFromResponse(resp)
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
	default:
		return nil, errorFromResponse(resp)
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
	default:
		return errorFromResponse(resp)
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

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

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
	var members MembersService = &MembersServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.members != nil {
		members = cfg.members
	}
	return &PachcaClient{
		Chats  : chats,
		Members: members,
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
	var members MembersService = &MembersServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.members != nil {
		members = cfg.members
	}
	return &PachcaClient{
		Chats  : chats,
		Members: members,
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
	var members MembersService = &MembersServiceStub{}
	if cfg.members != nil {
		members = cfg.members
	}
	return &PachcaClient{
		Chats  : chats,
		Members: members,
	}
}
