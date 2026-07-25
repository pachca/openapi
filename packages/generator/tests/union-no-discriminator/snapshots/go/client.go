package pachca

import (
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

type EventsService interface {
	GetEvents(ctx context.Context) (*GetEventsResponse, error)
}

type EventsServiceStub struct{}

func (s *EventsServiceStub) GetEvents(ctx context.Context) (*GetEventsResponse, error) {
	return nil, NotImplementedError{Method: "Events.getEvents"}
}

type EventsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *EventsServiceImpl) GetEvents(ctx context.Context) (*GetEventsResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/events", s.baseURL), nil)
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
		var result GetEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Events EventsService
}

type clientConfig struct {
	baseURL string
	events EventsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	events EventsService
}

type StubClientOption func(*stubClientConfig)

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithEvents(service EventsService) ClientOption {
	return func(cfg *clientConfig) { cfg.events = service }
}

func WithStubEvents(service EventsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.events = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var events EventsService = &EventsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.events != nil {
		events = cfg.events
	}
	return &PachcaClient{
		Events: events,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var events EventsService = &EventsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.events != nil {
		events = cfg.events
	}
	return &PachcaClient{
		Events: events,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var events EventsService = &EventsServiceStub{}
	if cfg.events != nil {
		events = cfg.events
	}
	return &PachcaClient{
		Events: events,
	}
}
