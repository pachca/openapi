package pachca

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
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
	UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error
	GetUploadParams(ctx context.Context) (*UploadParams, error)
}

type CommonServiceStub struct{}

func (s *CommonServiceStub) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
	return NotImplementedError{Method: "Common.uploadFile"}
}

func (s *CommonServiceStub) GetUploadParams(ctx context.Context) (*UploadParams, error) {
	return nil, NotImplementedError{Method: "Common.getUploadParams"}
}

type CommonServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *CommonServiceImpl) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		writer.WriteField("content-disposition", fmt.Sprintf("%v", request.ContentDisposition))
		writer.WriteField("acl", fmt.Sprintf("%v", request.ACL))
		writer.WriteField("policy", fmt.Sprintf("%v", request.Policy))
		writer.WriteField("x-amz-credential", fmt.Sprintf("%v", request.XAMZCredential))
		writer.WriteField("x-amz-algorithm", fmt.Sprintf("%v", request.XAMZAlgorithm))
		writer.WriteField("x-amz-date", fmt.Sprintf("%v", request.XAMZDate))
		writer.WriteField("x-amz-signature", fmt.Sprintf("%v", request.XAMZSignature))
		writer.WriteField("key", fmt.Sprintf("%v", request.Key))
		part, err := writer.CreateFormFile("file", "upload")
		if err != nil {
			pw.CloseWithError(err)
			return
		}
		if _, err := io.Copy(part, request.File); err != nil {
			pw.CloseWithError(err)
			return
		}
	}()
	req, err := http.NewRequestWithContext(ctx, "POST", directUrl, pr)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := doWithRetry(http.DefaultClient, req)
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
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *CommonServiceImpl) GetUploadParams(ctx context.Context) (*UploadParams, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/uploads", s.baseURL), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data UploadParams `json:"data"`
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
