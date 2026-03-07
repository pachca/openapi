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

// LinkPreviewsService handles link preview operations.
type LinkPreviewsService struct {
	baseURL string
	client  *http.Client
}

// CreateLinkPreviews creates link previews for a message.
func (s *LinkPreviewsService) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%d/link_previews", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

// PachcaClient is the main client for the Pachca API.
type PachcaClient struct {
	LinkPreviews *LinkPreviewsService
}

// NewPachcaClient creates a new PachcaClient.
func NewPachcaClient(baseURL, token string) *PachcaClient {
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		LinkPreviews: &LinkPreviewsService{baseURL: baseURL, client: client},
	}
}
