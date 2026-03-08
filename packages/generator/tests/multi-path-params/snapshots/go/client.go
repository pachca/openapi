package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type TasksService struct {
	baseURL string
	client  *http.Client
}

func (s *TasksService) GetTask(ctx context.Context, projectId int32, taskId int32) (*Task, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/projects/%v/tasks/%v", s.baseURL, projectId, taskId), nil)
	if err != nil {
		return nil, err
	}
	resp, err := s.client.Do(req)
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

func (s *TasksService) UpdateTask(ctx context.Context, projectId int32, taskId int32, request TaskUpdateRequest) (*Task, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/projects/%v/tasks/%v", s.baseURL, projectId, taskId), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
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

func (s *TasksService) DeleteComment(ctx context.Context, projectId int32, taskId int32, commentId int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/projects/%v/tasks/%v/comments/%v", s.baseURL, projectId, taskId, commentId), nil)
	if err != nil {
		return err
	}
	resp, err := s.client.Do(req)
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
	Tasks *TasksService
}

const DefaultBaseURL = "https://api.example.com/v1"

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := DefaultBaseURL
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Tasks: &TasksService{baseURL: url, client: client},
	}
}
