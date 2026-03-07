package pachca

import (
	"context"
	"encoding/json"
	"errors"
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

// CommonService handles common operations.
type CommonService struct {
	baseURL string
	client  *http.Client
}

// DownloadExport retrieves the redirect URL for an export download.
func (s *CommonService) DownloadExport(ctx context.Context, id int32) (string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/exports/%d", s.baseURL, id), nil)
	if err != nil {
		return "", err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusFound:
		location := resp.Header.Get("Location")
		if location == "" {
			return "", errors.New("missing Location header in redirect response")
		}
		return location, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return "", &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return "", &e
	}
}

// PachcaClient is the main client for the Pachca API.
type PachcaClient struct {
	Common *CommonService
}

// NewPachcaClient creates a new PachcaClient.
func NewPachcaClient(baseURL, token string) *PachcaClient {
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	return &PachcaClient{
		Common: &CommonService{baseURL: baseURL, client: client},
	}
}
