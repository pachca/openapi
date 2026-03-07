package pachca

import (
	"context"
	"encoding/json"
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

type SearchService struct {
	baseURL string
	client  *http.Client
}

func (s *SearchService) SearchMessages(ctx context.Context, params SearchMessagesParams) (*SearchMessagesResponse, error) {
	u, _ := url.Parse(fmt.Sprintf("%s/search/messages", s.baseURL))
	q := u.Query()
	q.Set("query", fmt.Sprintf("%v", params.Query))
	for _, v := range params.ChatIDs {
		q.Add("chat_ids[]", fmt.Sprintf("%v", v))
	}
	for _, v := range params.UserIDs {
		q.Add("user_ids[]", fmt.Sprintf("%v", v))
	}
	if params != nil && params.CreatedFrom != nil {
		q.Set("created_from", fmt.Sprintf("%v", *params.CreatedFrom))
	}
	if params != nil && params.CreatedTo != nil {
		q.Set("created_to", fmt.Sprintf("%v", *params.CreatedTo))
	}
	if params != nil && params.Sort != nil {
		q.Set("sort", fmt.Sprintf("%v", *params.Sort))
	}
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
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result SearchMessagesResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Search *SearchService
}

func NewPachcaClient(baseURL, token string) *PachcaClient {
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Search: &SearchService{baseURL: baseURL, client: client},
	}
}
