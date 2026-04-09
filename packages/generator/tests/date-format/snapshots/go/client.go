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

type ExportService interface {
	ListEvents(ctx context.Context, params ListEventsParams) (*ListEventsResponse, error)
	CreateExport(ctx context.Context, request ExportRequest) (*Export, error)
}

type ExportServiceStub struct{}

func (s *ExportServiceStub) ListEvents(ctx context.Context, params ListEventsParams) (*ListEventsResponse, error) {
	return nil, NotImplementedError{Method: "Export.listEvents"}
}

func (s *ExportServiceStub) CreateExport(ctx context.Context, request ExportRequest) (*Export, error) {
	return nil, NotImplementedError{Method: "Export.createExport"}
}

type ExportServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ExportServiceImpl) ListEvents(ctx context.Context, params ListEventsParams) (*ListEventsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/events", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("date_from", fmt.Sprintf("%v", params.DateFrom))
	if params.DateTo != nil {
		q.Set("date_to", fmt.Sprintf("%v", *params.DateTo))
	}
	if params.CreatedAfter != nil {
		q.Set("created_after", params.CreatedAfter.Format(time.RFC3339))
	}
	if params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
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
		var result ListEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *ExportServiceImpl) CreateExport(ctx context.Context, request ExportRequest) (*Export, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/exports", s.baseURL), bytes.NewReader(body))
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
			Data Export `json:"data"`
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
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Export ExportService
}

type clientConfig struct {
	baseURL string
	export ExportService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	export ExportService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithExport(service ExportService) ClientOption {
	return func(cfg *clientConfig) { cfg.export = service }
}

func WithStubExport(service ExportService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.export = service }
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
		Export: func() ExportService { if cfg.export != nil { return cfg.export }; return &ExportServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Export: func() ExportService { if cfg.export != nil { return cfg.export }; return &ExportServiceStub{} }(),
	}
}
