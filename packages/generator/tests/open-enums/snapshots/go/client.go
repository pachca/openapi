package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// errorFromBody reads an error answer. Its body is either {"errors": [...]} or the
// OAuth form {"error", "error_description"}, which also comes with 400 and 403
// (insufficient_scope, invalid_grant): the body decides the type.
func errorFromBody(resp *http.Response) error {
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
	}
	var probe struct {
		Errors json.RawMessage `json:"errors"`
		Error  *string         `json:"error"`
	}
	if json.Unmarshal(data, &probe) == nil && probe.Errors == nil && probe.Error != nil {
		var e OAuthError
		if err := json.Unmarshal(data, &e); err == nil {
			return &e
		}
	}
	var e ApiError
	if err := json.Unmarshal(data, &e); err != nil {
		return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
	}
	return &e
}

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type MembersService interface {
	ListMembers(ctx context.Context, params *ListMembersParams) (*ListMembersResponse, error)
	UpdateMember(ctx context.Context, id int32, request MemberUpdateRequest) (*Member, error)
}

type MembersServiceStub struct{}

func (s *MembersServiceStub) ListMembers(ctx context.Context, params *ListMembersParams) (*ListMembersResponse, error) {
	return nil, NotImplementedError{Method: "Members.listMembers"}
}

func (s *MembersServiceStub) UpdateMember(ctx context.Context, id int32, request MemberUpdateRequest) (*Member, error) {
	return nil, NotImplementedError{Method: "Members.updateMember"}
}

type MembersServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *MembersServiceImpl) ListMembers(ctx context.Context, params *ListMembersParams) (*ListMembersResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/members", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Sort != nil {
		q.Set("sort", string(*params.Sort))
	}
	if params != nil && params.Role != nil {
		q.Set("role", string(*params.Role))
	}
	if params != nil {
		for _, v := range params.Roles {
			q.Add("roles[]", fmt.Sprintf("%v", v))
		}
	}
	if params != nil && params.Region != nil {
		q.Set("region", string(*params.Region))
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
		var result ListMembersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	default:
		return nil, errorFromBody(resp)
	}
}

func (s *MembersServiceImpl) UpdateMember(ctx context.Context, id int32, request MemberUpdateRequest) (*Member, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/members/%v", s.baseURL, id), bytes.NewReader(body))
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
			Data Member `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	default:
		return nil, errorFromBody(resp)
	}
}

type PachcaClient struct {
	Members MembersService
}

type clientConfig struct {
	baseURL string
	members MembersService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	members MembersService
}

type StubClientOption func(*stubClientConfig)

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithMembers(service MembersService) ClientOption {
	return func(cfg *clientConfig) { cfg.members = service }
}

func WithStubMembers(service MembersService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.members = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var members MembersService = &MembersServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.members != nil {
		members = cfg.members
	}
	return &PachcaClient{
		Members: members,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var members MembersService = &MembersServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.members != nil {
		members = cfg.members
	}
	return &PachcaClient{
		Members: members,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var members MembersService = &MembersServiceStub{}
	if cfg.members != nil {
		members = cfg.members
	}
	return &PachcaClient{
		Members: members,
	}
}
