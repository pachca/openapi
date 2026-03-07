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

// CommonService handles common operations.
type CommonService struct {
	baseURL string
	client  *http.Client
}

// UploadFile uploads a file using multipart/form-data.
func (s *CommonService) UploadFile(ctx context.Context, request FileUploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		if request.ContentDisposition != nil {
			writer.WriteField("content-disposition", *request.ContentDisposition)
		}
		if request.ACL != nil {
			writer.WriteField("acl", *request.ACL)
		}
		if request.Policy != nil {
			writer.WriteField("policy", *request.Policy)
		}
		if request.XAmzCredential != nil {
			writer.WriteField("x-amz-credential", *request.XAmzCredential)
		}
		if request.XAmzAlgorithm != nil {
			writer.WriteField("x-amz-algorithm", *request.XAmzAlgorithm)
		}
		if request.XAmzDate != nil {
			writer.WriteField("x-amz-date", *request.XAmzDate)
		}
		if request.XAmzSignature != nil {
			writer.WriteField("x-amz-signature", *request.XAmzSignature)
		}
		writer.WriteField("key", request.Key)
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

// PachcaClient is the main client for the Pachca API.
type PachcaClient struct {
	Common *CommonService
}

// NewPachcaClient creates a new PachcaClient.
func NewPachcaClient(baseURL, token string) *PachcaClient {
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Common: &CommonService{baseURL: baseURL, client: client},
	}
}
