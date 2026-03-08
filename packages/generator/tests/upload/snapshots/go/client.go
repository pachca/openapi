package pachca

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
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

type CommonService struct {
	baseURL string
	client  *http.Client
}

func (s *CommonService) UploadFile(ctx context.Context, request FileUploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		if request.ContentDisposition != nil {
			writer.WriteField("content-disposition", fmt.Sprintf("%v", *request.ContentDisposition))
		}
		if request.ACL != nil {
			writer.WriteField("acl", fmt.Sprintf("%v", *request.ACL))
		}
		if request.Policy != nil {
			writer.WriteField("policy", fmt.Sprintf("%v", *request.Policy))
		}
		if request.XAMZCredential != nil {
			writer.WriteField("x-amz-credential", fmt.Sprintf("%v", *request.XAMZCredential))
		}
		if request.XAMZAlgorithm != nil {
			writer.WriteField("x-amz-algorithm", fmt.Sprintf("%v", *request.XAMZAlgorithm))
		}
		if request.XAMZDate != nil {
			writer.WriteField("x-amz-date", fmt.Sprintf("%v", *request.XAMZDate))
		}
		if request.XAMZSignature != nil {
			writer.WriteField("x-amz-signature", fmt.Sprintf("%v", *request.XAMZSignature))
		}
		writer.WriteField("key", fmt.Sprintf("%v", request.Key))
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
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
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
