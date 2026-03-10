package pachca

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
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

type CommonService struct {
	baseURL string
	client  *http.Client
}

func (s *CommonService) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		writer.WriteField("content-disposition", fmt.Sprintf("%v", request.ContentDisposition))
		writer.WriteField("acl", fmt.Sprintf("%v", request.ACL))
		writer.WriteField("policy", fmt.Sprintf("%v", request.Policy))
		writer.WriteField("x-amz-credential", fmt.Sprintf("%v", request.XAMZCredential))
		writer.WriteField("x-amz-algorithm", fmt.Sprintf("%v", request.XAMZAlgorithm))
		writer.WriteField("x-amz-date", fmt.Sprintf("%v", request.XAMZDate))
		writer.WriteField("x-amz-signature", fmt.Sprintf("%v", request.XAMZSignature))
		writer.WriteField("key", fmt.Sprintf("%v", request.Key))
		part, err := writer.CreateFormFile("file", "upload")
		if err != nil {
			return
		}
		if _, err := io.Copy(part, request.File); err != nil {
			return
		}
	}()
	req, err := http.NewRequestWithContext(ctx, "POST", directUrl, pr)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := doWithRetry(http.DefaultClient, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func (s *CommonService) GetUploadParams(ctx context.Context) (*UploadParams, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/uploads", s.baseURL), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data UploadParams `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

type PachcaClient struct {
	Common *CommonService
}

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := DefaultBaseURL
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Common: &CommonService{baseURL: url, client: client},
	}
}
