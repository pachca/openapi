package pachca

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// errorFromResponse reads an error answer. Its body is either {"errors": [...]} or
// the OAuth form {"error", "error_description"}, which also comes with 400 and 403
// (insufficient_scope, invalid_grant): the body decides the type. An empty body or
// one that is not JSON (a 404 without a body, a proxy page) gives an ApiError with
// no errors. The status code stays in StatusCode.
func errorFromResponse(resp *http.Response) error {
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
	if json.Unmarshal(data, &e) != nil {
		e = ApiError{}
	}
	e.StatusCode = resp.StatusCode
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

type ReadMembersService interface {
	ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*ListReadMembersResponse, error)
	ListReadMembersAll(ctx context.Context, id int32, params *ListReadMembersParams) ([]int32, error)
}

type ReadMembersServiceStub struct{}

func (s *ReadMembersServiceStub) ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*ListReadMembersResponse, error) {
	return nil, NotImplementedError{Method: "Read members.listReadMembers"}
}

func (s *ReadMembersServiceStub) ListReadMembersAll(ctx context.Context, id int32, params *ListReadMembersParams) ([]int32, error) {
	return nil, NotImplementedError{Method: "Read members.listReadMembersAll"}
}

type ReadMembersServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ReadMembersServiceImpl) ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*ListReadMembersResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/messages/%v/read_member_ids", s.baseURL, id))
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
		var result ListReadMembersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, errorFromResponse(resp)
	}
}

func (s *ReadMembersServiceImpl) ListReadMembersAll(ctx context.Context, id int32, params *ListReadMembersParams) ([]int32, error) {
	if params == nil {
		params = &ListReadMembersParams{}
	}
	var items []int32
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListReadMembers(ctx, id, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

type PachcaClient struct {
	ReadMembers ReadMembersService
}

type clientConfig struct {
	baseURL string
	readMembers ReadMembersService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	readMembers ReadMembersService
}

type StubClientOption func(*stubClientConfig)

const PachcaAPIURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithReadMembers(service ReadMembersService) ClientOption {
	return func(cfg *clientConfig) { cfg.readMembers = service }
}

func WithStubReadMembers(service ReadMembersService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.readMembers = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: PachcaAPIURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	var readMembers ReadMembersService = &ReadMembersServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.readMembers != nil {
		readMembers = cfg.readMembers
	}
	return &PachcaClient{
		ReadMembers: readMembers,
	}
}

func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: baseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	var readMembers ReadMembersService = &ReadMembersServiceImpl{baseURL: cfg.baseURL, client: client}
	if cfg.readMembers != nil {
		readMembers = cfg.readMembers
	}
	return &PachcaClient{
		ReadMembers: readMembers,
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	var readMembers ReadMembersService = &ReadMembersServiceStub{}
	if cfg.readMembers != nil {
		readMembers = cfg.readMembers
	}
	return &PachcaClient{
		ReadMembers: readMembers,
	}
}
