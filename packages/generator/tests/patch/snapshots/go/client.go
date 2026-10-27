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

// errorFromResponse reads an error answer, an ApiError. An empty body or
// one that is not JSON (a 404 without a body, a proxy page) gives an ApiError with
// no errors. The status code stays in StatusCode.
func errorFromResponse(resp *http.Response) error {
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
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
		return nil, errorFromResponse(resp)
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

const PachcaAPIURL = "https://api.example.com/v1"

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
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var items ItemsService = &ItemsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.items != nil {
		items = cfg.items
	}
	return &PachcaClient{
		Items: items,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var items ItemsService = &ItemsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.items != nil {
		items = cfg.items
	}
	return &PachcaClient{
		Items: items,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var items ItemsService = &ItemsServiceStub{}
	if cfg.items != nil {
		items = cfg.items
	}
	return &PachcaClient{
		Items: items,
	}
}
