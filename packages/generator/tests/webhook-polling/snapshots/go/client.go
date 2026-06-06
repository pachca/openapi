package pachca

import (
	"context"
	"encoding/json"
	"errors"
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

type BotsService interface {
	GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error)
	GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error)
	PollWebhookEvents(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookEvent) error) error
	PollWebhookPayloads(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookPayloadUnion) error) error
}

type PollWebhookEventsOptions struct {
	Limit              *int32
	Interval           time.Duration
	CreatedAfter       *time.Time
	MaxSeenDeliveryIDs int
}

type BotsServiceStub struct{}

func (s *BotsServiceStub) GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error) {
	return nil, NotImplementedError{Method: "Bots.getWebhookEvents"}
}

func (s *BotsServiceStub) GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error) {
	return nil, NotImplementedError{Method: "Bots.getWebhookEventsAll"}
}

func (s *BotsServiceStub) PollWebhookEvents(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookEvent) error) error {
	return NotImplementedError{Method: "Bots.pollWebhookEvents"}
}

func (s *BotsServiceStub) PollWebhookPayloads(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookPayloadUnion) error) error {
	return NotImplementedError{Method: "Bots.pollWebhookPayloads"}
}

type BotsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *BotsServiceImpl) GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/webhooks/events", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
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
		var result GetWebhookEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *BotsServiceImpl) GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error) {
	if params == nil {
		params = &GetWebhookEventsParams{}
	}
	var items []WebhookEvent
	var cursor *string
	hasNext := true
	for hasNext {
		params.Cursor = cursor
		result, err := s.GetWebhookEvents(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
		if result.Meta.Paginate.HasNext != nil {
			hasNext = *result.Meta.Paginate.HasNext
		}
	}
	return items, nil
}

func (s *BotsServiceImpl) PollWebhookEvents(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookEvent) error) error {
	if handler == nil {
		return errors.New("handler must not be nil")
	}
	if options == nil {
		options = &PollWebhookEventsOptions{}
	}
	interval := options.Interval
	if interval == 0 {
		interval = 5 * time.Second
	}
	createdAfter := options.CreatedAfter
	if createdAfter == nil {
		now := time.Now()
		createdAfter = &now
	}
	maxSeenDeliveryIDs := options.MaxSeenDeliveryIDs
	if maxSeenDeliveryIDs == 0 {
		maxSeenDeliveryIDs = 5000
	}
	if maxSeenDeliveryIDs < 0 {
		return errors.New("MaxSeenDeliveryIDs must be greater than 0")
	}

	seenIDOrder := make([]string, 0, maxSeenDeliveryIDs)
	seenIDs := make(map[string]struct{}, maxSeenDeliveryIDs)
	remember := func(id string) bool {
		if _, ok := seenIDs[id]; ok {
			return false
		}
		seenIDs[id] = struct{}{}
		seenIDOrder = append(seenIDOrder, id)
		for len(seenIDOrder) > maxSeenDeliveryIDs {
			oldest := seenIDOrder[0]
			seenIDOrder = seenIDOrder[1:]
			delete(seenIDs, oldest)
		}
		return true
	}

	for {
		var cursor *string
		hasNext := true
		for hasNext {
			params := &GetWebhookEventsParams{Limit: options.Limit, Cursor: cursor}
			response, err := s.GetWebhookEvents(ctx, params)
			if err != nil {
				return err
			}
			pageHasRecentEvents := false
			for i := len(response.Data) - 1; i >= 0; i-- {
				event := response.Data[i]
				matchesCreatedAfter := !event.CreatedAt.Before(*createdAfter)
				if matchesCreatedAfter {
					pageHasRecentEvents = true
				}
				if matchesCreatedAfter && remember(event.ID) {
					if err := handler(event); err != nil {
						return err
					}
				}
			}
			nextPage := response.Meta.Paginate.NextPage
			cursor = &nextPage
			if response.Meta.Paginate.HasNext != nil {
				hasNext = *response.Meta.Paginate.HasNext
			} else {
				hasNext = len(response.Data) > 0
			}
			hasNext = hasNext && pageHasRecentEvents
		}

		timer := time.NewTimer(interval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return ctx.Err()
		case <-timer.C:
		}
	}
}

func (s *BotsServiceImpl) PollWebhookPayloads(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookPayloadUnion) error) error {
	if handler == nil {
		return errors.New("handler must not be nil")
	}
	return s.PollWebhookEvents(ctx, options, func(event WebhookEvent) error {
		return handler(event.Payload)
	})
}

type PachcaClient struct {
	Bots BotsService
}

type clientConfig struct {
	baseURL string
	bots BotsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	bots BotsService
}

type StubClientOption func(*stubClientConfig)

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithBots(service BotsService) ClientOption {
	return func(cfg *clientConfig) { cfg.bots = service }
}

func WithStubBots(service BotsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.bots = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var bots BotsService = &BotsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.bots != nil {
		bots = cfg.bots
	}
	return &PachcaClient{
		Bots: bots,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var bots BotsService = &BotsServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.bots != nil {
		bots = cfg.bots
	}
	return &PachcaClient{
		Bots: bots,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var bots BotsService = &BotsServiceStub{}
	if cfg.bots != nil {
		bots = cfg.bots
	}
	return &PachcaClient{
		Bots: bots,
	}
}
