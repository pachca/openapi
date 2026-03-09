package pachca

import (
	"io"
)

type FileUploadRequest struct {
	ContentDisposition string    `json:"content-disposition"`
	ACL                string    `json:"acl"`
	Policy             string    `json:"policy"`
	XAMZCredential     string    `json:"x-amz-credential"`
	XAMZAlgorithm      string    `json:"x-amz-algorithm"`
	XAMZDate           string    `json:"x-amz-date"`
	XAMZSignature      string    `json:"x-amz-signature"`
	Key                string    `json:"key"`
	File               io.Reader `json:"file"`
}

type UploadParams struct {
	ContentDisposition string `json:"Content-Disposition"`
	ACL                string `json:"acl"`
	Policy             string `json:"policy"`
	XAMZCredential     string `json:"x-amz-credential"`
	XAMZAlgorithm      string `json:"x-amz-algorithm"`
	XAMZDate           string `json:"x-amz-date"`
	XAMZSignature      string `json:"x-amz-signature"`
	Key                string `json:"key"`
	DirectURL          string `json:"direct_url"`
}

type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}
