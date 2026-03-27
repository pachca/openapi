package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/url"
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

type EventsService interface {
	ListEvents(ctx context.Context, params *ListEventsParams) (*ListEventsResponse, error)
	PublishEvent(ctx context.Context, id int32, scope OAuthScope) (*Event, error)
}

type EventsServiceStub struct{}

func (s *EventsServiceStub) ListEvents(ctx context.Context, params *ListEventsParams) (*ListEventsResponse, error) {
	return nil, fmt.Errorf("Events.listEvents is not implemented")
}

func (s *EventsServiceStub) PublishEvent(ctx context.Context, id int32, scope OAuthScope) (*Event, error) {
	return nil, fmt.Errorf("Events.publishEvent is not implemented")
}

type EventsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *EventsServiceImpl) ListEvents(ctx context.Context, params *ListEventsParams) (*ListEventsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/events", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.IsActive != nil {
		q.Set("is_active", fmt.Sprintf("%v", *params.IsActive))
	}
	if params != nil {
		for _, v := range params.Scopes {
			q.Add("scopes[]", fmt.Sprintf("%v", v))
		}
	}
	if params != nil && params.Filter != nil {
		q.Set("filter", fmt.Sprintf("%v", *params.Filter))
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

func (s *EventsServiceImpl) PublishEvent(ctx context.Context, id int32, scope OAuthScope) (*Event, error) {
	body, err := json.Marshal(map[string]any{"scope": scope})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/events/%v/publish", s.baseURL, id), bytes.NewReader(body))
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
			Data Event `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type UploadsService interface {
	CreateUpload(ctx context.Context, request UploadRequest) error
}

type UploadsServiceStub struct{}

func (s *UploadsServiceStub) CreateUpload(ctx context.Context, request UploadRequest) error {
	return fmt.Errorf("Uploads.createUpload is not implemented")
}

type UploadsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *UploadsServiceImpl) CreateUpload(ctx context.Context, request UploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		writer.WriteField("Content-Disposition", fmt.Sprintf("%v", request.ContentDisposition))
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
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/uploads", s.baseURL), pr)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		return nil
	default:
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Events  EventsService
	Uploads UploadsService
}

type clientConfig struct {
	baseURL string
	events EventsService
	uploads UploadsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	events EventsService
	uploads UploadsService
}

type StubClientOption func(*stubClientConfig)

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithEvents(service EventsService) ClientOption {
	return func(cfg *clientConfig) { cfg.events = service }
}

func WithUploads(service UploadsService) ClientOption {
	return func(cfg *clientConfig) { cfg.uploads = service }
}

func WithStubEvents(service EventsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.events = service }
}

func WithStubUploads(service UploadsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.uploads = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Events : func() EventsService { if cfg.events != nil { return cfg.events }; return &EventsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Uploads: func() UploadsService { if cfg.uploads != nil { return cfg.uploads }; return &UploadsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Events : func() EventsService { if cfg.events != nil { return cfg.events }; return &EventsServiceStub{} }(),
		Uploads: func() UploadsService { if cfg.uploads != nil { return cfg.uploads }; return &UploadsServiceStub{} }(),
	}
}
