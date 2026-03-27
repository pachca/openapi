package pachca

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"strconv"
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

const maxRetries = 3

var retryable5xx = map[int]bool{500: true, 502: true, 503: true, 504: true}

func jitter(d time.Duration) time.Duration {
	return time.Duration(float64(d) * (0.5 + rand.Float64()*0.5))
}

func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {
	for attempt := 0; ; attempt++ {
		if attempt > 0 && req.GetBody != nil {
			req.Body, _ = req.GetBody()
		}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == http.StatusTooManyRequests && attempt < maxRetries {
			resp.Body.Close()
			delay := time.Duration(1<<uint(attempt)) * time.Second
			if ra := resp.Header.Get("Retry-After"); ra != "" {
				if secs, err := strconv.Atoi(ra); err == nil {
					delay = time.Duration(secs) * time.Second
				}
			}
			time.Sleep(delay)
			continue
		}
		if retryable5xx[resp.StatusCode] && attempt < maxRetries {
			resp.Body.Close()
			delay := jitter(10 * time.Duration(1<<uint(attempt)) * time.Second)
			time.Sleep(delay)
			continue
		}
		return resp, nil
	}
}

type CommonService interface {
	UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error
	GetUploadParams(ctx context.Context) (*UploadParams, error)
}

type CommonServiceStub struct{}

func (s *CommonServiceStub) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
	return fmt.Errorf("Common.uploadFile is not implemented")
}

func (s *CommonServiceStub) GetUploadParams(ctx context.Context) (*UploadParams, error) {
	return nil, fmt.Errorf("Common.getUploadParams is not implemented")
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

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

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
	cfg := clientConfig{baseURL: DefaultBaseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Common: func() CommonService { if cfg.common != nil { return cfg.common }; return &CommonServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Common: func() CommonService { if cfg.common != nil { return cfg.common }; return &CommonServiceStub{} }(),
	}
}
