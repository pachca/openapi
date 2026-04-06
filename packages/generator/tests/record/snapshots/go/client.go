package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
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

var retryable5xx = map[int]bool{500: true, 502: true, 503: true, 504: true}

func jitter(d time.Duration) time.Duration {
	return time.Duration(float64(d) * (0.5 + rand.Float64()*0.5))
}

func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {
	for attempt := 0; ; attempt++ {
		if attempt > 0 && req.GetBody != nil {
			req.Body, _ = req.GetBody()
		}
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
		if retryable5xx[resp.StatusCode] && attempt < maxRetries {
			resp.Body.Close()
			delay := jitter(10 * time.Duration(1<<uint(attempt)) * time.Second)
			time.Sleep(delay)
			continue
		}
		return resp, nil
	}
}

type LinkPreviewsService struct {
	baseURL string
	client  *http.Client
}

func (s *LinkPreviewsService) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%v/link_previews", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type PachcaClient struct {
	LinkPreviews *LinkPreviewsService
}

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := DefaultBaseURL
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		LinkPreviews: &LinkPreviewsService{baseURL: url, client: client},
	}
}
