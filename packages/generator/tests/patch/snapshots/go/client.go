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

type ItemsService struct {
	baseURL string
	client  *http.Client
}

func (s *ItemsService) PatchItem(ctx context.Context, id int32, request ItemPatchRequest) (*Item, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PATCH", fmt.Sprintf("%s/items/%v", s.baseURL, id), bytes.NewReader(body))
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
			Data Item `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

type PachcaClient struct {
	Items *ItemsService
}

const DefaultBaseURL = "https://api.example.com/v1"

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := DefaultBaseURL
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Items: &ItemsService{baseURL: url, client: client},
	}
}
