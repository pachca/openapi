package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
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

type TasksService interface {
	GetTask(ctx context.Context, projectId int32, taskId int32) (*Task, error)
	UpdateTask(ctx context.Context, projectId int32, taskId int32, request TaskUpdateRequest) (*Task, error)
	DeleteComment(ctx context.Context, projectId int32, taskId int32, commentId int32) error
}

type TasksServiceStub struct{}

func (s *TasksServiceStub) GetTask(ctx context.Context, projectId int32, taskId int32) (*Task, error) {
	return nil, fmt.Errorf("Tasks.getTask is not implemented")
}

func (s *TasksServiceStub) UpdateTask(ctx context.Context, projectId int32, taskId int32, request TaskUpdateRequest) (*Task, error) {
	return nil, fmt.Errorf("Tasks.updateTask is not implemented")
}

func (s *TasksServiceStub) DeleteComment(ctx context.Context, projectId int32, taskId int32, commentId int32) error {
	return fmt.Errorf("Tasks.deleteComment is not implemented")
}

type TasksServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *TasksServiceImpl) GetTask(ctx context.Context, projectId int32, taskId int32) (*Task, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/projects/%v/tasks/%v", s.baseURL, projectId, taskId), nil)
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
		var result struct {
			Data Task `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *TasksServiceImpl) UpdateTask(ctx context.Context, projectId int32, taskId int32, request TaskUpdateRequest) (*Task, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/projects/%v/tasks/%v", s.baseURL, projectId, taskId), bytes.NewReader(body))
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
			Data Task `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *TasksServiceImpl) DeleteComment(ctx context.Context, projectId int32, taskId int32, commentId int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/projects/%v/tasks/%v/comments/%v", s.baseURL, projectId, taskId, commentId), nil)
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
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Tasks TasksService
}

type clientConfig struct {
	baseURL string
	tasks TasksService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	tasks TasksService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.example.com/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithTasks(service TasksService) ClientOption {
	return func(cfg *clientConfig) { cfg.tasks = service }
}

func WithStubTasks(service TasksService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.tasks = service }
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
		Tasks: func() TasksService { if cfg.tasks != nil { return cfg.tasks }; return &TasksServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Tasks: func() TasksService { if cfg.tasks != nil { return cfg.tasks }; return &TasksServiceStub{} }(),
	}
}
