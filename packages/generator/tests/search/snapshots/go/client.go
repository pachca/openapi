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
	u, err := url.Parse(fmt.Sprintf("%s/search/messages", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("query", fmt.Sprintf("%v", params.Query))
	for _, v := range params.ChatIDs {
		q.Add("chat_ids[]", fmt.Sprintf("%v", v))
	}
	for _, v := range params.UserIDs {
		q.Add("user_ids[]", fmt.Sprintf("%v", v))
	}
	if params.CreatedFrom != nil {
		q.Set("created_from", params.CreatedFrom.Format(time.RFC3339))
	}
	if params.CreatedTo != nil {
		q.Set("created_to", params.CreatedTo.Format(time.RFC3339))
	}
	if params.Sort != nil {
		q.Set("sort", string(*params.Sort))
	}
	if params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params.Cursor != nil {
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

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := DefaultBaseURL
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Search: &SearchService{baseURL: url, client: client},
	}
}
