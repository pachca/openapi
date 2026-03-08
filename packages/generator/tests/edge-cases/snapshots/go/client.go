package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
)

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type EventsService struct {
	baseURL string
	client  *http.Client
}

func (s *EventsService) ListEvents(ctx context.Context, params *ListEventsParams) (*ListEventsResponse, error) {
	u, _ := url.Parse(fmt.Sprintf("%s/events", s.baseURL))
	q := u.Query()
	if params != nil && params.IsActive != nil {
		q.Set("is_active", fmt.Sprintf("%v", *params.IsActive))
	}
	if params != nil && params.Scopes != nil {
		q.Set("scopes", fmt.Sprintf("%v", params.Scopes))
	}
	if params != nil && params.Filter != nil {
		q.Set("filter", fmt.Sprintf("%v", *params.Filter))
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
		var result ListEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *EventsService) PublishEvent(ctx context.Context, id int32, scope OAuthScope) (*Event, error) {
	body, err := json.Marshal(map[string]any{"scope": scope})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/events/%v/publish", s.baseURL, id), bytes.NewReader(body))
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
			Data Event `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type UploadsService struct {
	baseURL string
	client  *http.Client
}

func (s *UploadsService) CreateUpload(ctx context.Context, request UploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		writer.WriteField("Content-Disposition", fmt.Sprintf("%v", request.Content_Disposition))
		part, err := writer.CreateFormFile("file", "upload")
		if err != nil {
			return
		}
		io.Copy(part, request.File)
	}()
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/uploads", s.baseURL), pr)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		return nil
	default:
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Events  *EventsService
	Uploads *UploadsService
}

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := ""
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Events : &EventsService{baseURL: url, client: client},
		Uploads: &UploadsService{baseURL: url, client: client},
	}
}
