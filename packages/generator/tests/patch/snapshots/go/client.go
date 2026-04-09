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

type ItemsService interface {
	PatchItem(ctx context.Context, id int32, request ItemPatchRequest) (*Item, error)
}

type ItemsServiceStub struct{}

func (s *ItemsServiceStub) PatchItem(ctx context.Context, id int32, request ItemPatchRequest) (*Item, error) {
	return nil, NotImplementedError{Method: "Items.patchItem"}
}

type ItemsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ItemsServiceImpl) PatchItem(ctx context.Context, id int32, request ItemPatchRequest) (*Item, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PATCH", fmt.Sprintf("%s/items/%v", s.baseURL, id), bytes.NewReader(body))
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
			Data Item `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

type PachcaClient struct {
	Items ItemsService
}

type clientConfig struct {
	baseURL string
	items ItemsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	items ItemsService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.example.com/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithItems(service ItemsService) ClientOption {
	return func(cfg *clientConfig) { cfg.items = service }
}

func WithStubItems(service ItemsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.items = service }
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
		Items: func() ItemsService { if cfg.items != nil { return cfg.items }; return &ItemsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Items: func() ItemsService { if cfg.items != nil { return cfg.items }; return &ItemsServiceStub{} }(),
	}
}
