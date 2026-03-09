package pachca

import (
	"context"
	"encoding/json"
	"fmt"
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

func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {
	for attempt := 0; ; attempt++ {
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
		return resp, nil
	}
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
	resp, err := doWithRetry(s.client, req)
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

func (s *SearchService) SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]MessageSearchResult, error) {
	if params == nil {
		params = &SearchMessagesParams{}
	}
	var items []MessageSearchResult
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.SearchMessages(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
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
