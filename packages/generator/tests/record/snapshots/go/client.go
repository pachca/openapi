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

// errorFromBody reads an error answer. Its body is either {"errors": [...]} or the
// OAuth form {"error", "error_description"}, which also comes with 400 and 403
// (insufficient_scope, invalid_grant): the body decides the type.
func errorFromBody(resp *http.Response) error {
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
	if err := json.Unmarshal(data, &e); err != nil {
		return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
	}
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

type LinkPreviewsService interface {
	CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error
}

type LinkPreviewsServiceStub struct{}

func (s *LinkPreviewsServiceStub) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
	return NotImplementedError{Method: "Link Previews.createLinkPreviews"}
}

type LinkPreviewsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *LinkPreviewsServiceImpl) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%v/link_previews", s.baseURL, id), bytes.NewReader(body))
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
	case http.StatusCreated:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		return errorFromBody(resp)
	}
}

type PachcaClient struct {
	LinkPreviews LinkPreviewsService
}

type clientConfig struct {
	baseURL string
	linkPreviews LinkPreviewsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	linkPreviews LinkPreviewsService
}

type StubClientOption func(*stubClientConfig)

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithLinkPreviews(service LinkPreviewsService) ClientOption {
	return func(cfg *clientConfig) { cfg.linkPreviews = service }
}

func WithStubLinkPreviews(service LinkPreviewsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.linkPreviews = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var linkPreviews LinkPreviewsService = &LinkPreviewsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.linkPreviews != nil {
		linkPreviews = cfg.linkPreviews
	}
	return &PachcaClient{
		LinkPreviews: linkPreviews,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var linkPreviews LinkPreviewsService = &LinkPreviewsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.linkPreviews != nil {
		linkPreviews = cfg.linkPreviews
	}
	return &PachcaClient{
		LinkPreviews: linkPreviews,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var linkPreviews LinkPreviewsService = &LinkPreviewsServiceStub{}
	if cfg.linkPreviews != nil {
		linkPreviews = cfg.linkPreviews
	}
	return &PachcaClient{
		LinkPreviews: linkPreviews,
	}
}
