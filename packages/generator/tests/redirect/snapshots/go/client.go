package pachca

import (
	"context"
	"encoding/json"
	"errors"
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

type CommonService interface {
	DownloadExport(ctx context.Context, id int32) (string, error)
}

type CommonServiceStub struct{}

func (s *CommonServiceStub) DownloadExport(ctx context.Context, id int32) (string, error) {
	return "", NotImplementedError{Method: "Common.downloadExport"}
}

type CommonServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *CommonServiceImpl) DownloadExport(ctx context.Context, id int32) (string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/exports/%v", s.baseURL, id), nil)
	if err != nil {
		return "", err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusFound:
		location := resp.Header.Get("Location")
		if location == "" {
			return "", errors.New("missing Location header in redirect response")
		}
		return location, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return "", &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return "", fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return "", &e
	}
}

type PachcaClient struct {
	Common CommonService
}

type clientConfig struct {
	baseURL string
	common CommonService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	common CommonService
}

type StubClientOption func(*stubClientConfig)

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithCommon(service CommonService) ClientOption {
	return func(cfg *clientConfig) { cfg.common = service }
}

func WithStubCommon(service CommonService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.common = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	var common CommonService = &CommonServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.common != nil {
		common = cfg.common
	}
	return &PachcaClient{
		Common: common,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var common CommonService = &CommonServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.common != nil {
		common = cfg.common
	}
	return &PachcaClient{
		Common: common,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var common CommonService = &CommonServiceStub{}
	if cfg.common != nil {
		common = cfg.common
	}
	return &PachcaClient{
		Common: common,
	}
}
