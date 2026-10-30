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

type MessagesService interface {
	CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error)
	UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error)
}

type MessagesServiceStub struct{}

func (s *MessagesServiceStub) CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error) {
	return nil, NotImplementedError{Method: "Messages.createMessage"}
}

func (s *MessagesServiceStub) UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error) {
	return nil, NotImplementedError{Method: "Messages.updateMessage"}
}

type MessagesServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *MessagesServiceImpl) CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages", s.baseURL), bytes.NewReader(body))
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
			Data Message `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		return nil, errorFromResponse(resp)
	}
}

func (s *MessagesServiceImpl) UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/messages/%v", s.baseURL, id), bytes.NewReader(body))
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
			Data Message `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		return nil, errorFromResponse(resp)
	}
}

type PachcaClient struct {
	Messages MessagesService
}

type clientConfig struct {
	baseURL string
	messages MessagesService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	messages MessagesService
}

type StubClientOption func(*stubClientConfig)

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithMessages(service MessagesService) ClientOption {
	return func(cfg *clientConfig) { cfg.messages = service }
}

func WithStubMessages(service MessagesService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.messages = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var messages MessagesService = &MessagesServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.messages != nil {
		messages = cfg.messages
	}
	return &PachcaClient{
		Messages: messages,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var messages MessagesService = &MessagesServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.messages != nil {
		messages = cfg.messages
	}
	return &PachcaClient{
		Messages: messages,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var messages MessagesService = &MessagesServiceStub{}
	if cfg.messages != nil {
		messages = cfg.messages
	}
	return &PachcaClient{
		Messages: messages,
	}
}
