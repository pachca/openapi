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

type TasksService interface {
	GetTask(ctx context.Context, projectId int32, taskId int32) (*Task, error)
	UpdateTask(ctx context.Context, projectId int32, taskId int32, request TaskUpdateRequest) (*Task, error)
	DeleteComment(ctx context.Context, projectId int32, taskId int32, commentId int32) error
}

type TasksServiceStub struct{}

func (s *TasksServiceStub) GetTask(ctx context.Context, projectId int32, taskId int32) (*Task, error) {
	return nil, NotImplementedError{Method: "Tasks.getTask"}
}

func (s *TasksServiceStub) UpdateTask(ctx context.Context, projectId int32, taskId int32, request TaskUpdateRequest) (*Task, error) {
	return nil, NotImplementedError{Method: "Tasks.updateTask"}
}

func (s *TasksServiceStub) DeleteComment(ctx context.Context, projectId int32, taskId int32, commentId int32) error {
	return NotImplementedError{Method: "Tasks.deleteComment"}
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

const PachcaAPIURL = "https://api.example.com/v1"

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
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var tasks TasksService = &TasksServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.tasks != nil {
		tasks = cfg.tasks
	}
	return &PachcaClient{
		Tasks: tasks,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var tasks TasksService = &TasksServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.tasks != nil {
		tasks = cfg.tasks
	}
	return &PachcaClient{
		Tasks: tasks,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var tasks TasksService = &TasksServiceStub{}
	if cfg.tasks != nil {
		tasks = cfg.tasks
	}
	return &PachcaClient{
		Tasks: tasks,
	}
}
